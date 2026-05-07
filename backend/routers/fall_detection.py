import cv2
import time
import asyncio
import threading
from dataclasses import dataclass
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import Response, StreamingResponse

from services.fall_detection.fall_config import (
    CAMERA_FPS,
    CAMERA_HEIGHT,
    CAMERA_INDEX,
    CAMERA_WIDTH,
    DETECTION_FPS,
    FALL_ALERT_COOLDOWN_SECONDS,
    PID_X,
    PID_Y,
    STREAM_ANNOTATED,
    STREAM_FPS,
    STREAM_JPEG_QUALITY,
)
from services.fall_detection.control.pid import PIDController
from services.fall_detection.vision.detector_yolo import YoloDetector

router = APIRouter(prefix="/fall-detection", tags=["Fall Detection"])

LATEST_FRAME = None
LATEST_RAW_FRAME = None
LATEST_ANNOTATED_FRAME = None
FRAME_LOCK = threading.Lock()
RAW_FRAME_LOCK = threading.Lock()

@dataclass
class WebSocketClient:
    websocket: WebSocket
    loop: asyncio.AbstractEventLoop


ACTIVE_WEBSOCKETS = []
WEBSOCKET_LOCK = threading.Lock()

def notify_clients(message: str):
    """Send an alert to all connected websocket clients."""
    payload = {"type": "fall_alert", "message": message}

    def log_send_error(future):
        try:
            error = future.exception()
            if error:
                print(f"Error sending ws message: {error}")
        except Exception as e:
            print(f"Error checking ws send result: {e}")

    with WEBSOCKET_LOCK:
        clients = list(ACTIVE_WEBSOCKETS)

    for client in clients:
        try:
            future = asyncio.run_coroutine_threadsafe(client.websocket.send_json(payload), client.loop)
            future.add_done_callback(log_send_error)
        except Exception as e:
            print(f"Error sending ws message: {e}")

def fall_detection_loop():
    global LATEST_FRAME, LATEST_RAW_FRAME, LATEST_ANNOTATED_FRAME

    cap = cv2.VideoCapture(CAMERA_INDEX)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, CAMERA_WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CAMERA_HEIGHT)
    cap.set(cv2.CAP_PROP_FPS, CAMERA_FPS)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    if not cap.isOpened():
        print("Error: Could not connect to camera for Fall Detection.")
        return

    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    screen_center_x = frame_width // 2
    screen_center_y = frame_height // 2

    capture_interval = 1.0 / CAMERA_FPS

    def detection_worker():
        global LATEST_ANNOTATED_FRAME, LATEST_FRAME

        detector = YoloDetector()
        pid_x = PIDController(**PID_X)
        pid_y = PIDController(**PID_Y)
        detection_interval = 1.0 / DETECTION_FPS
        fall_alert_active = False
        last_fall_alert_time = 0.0
        last_stats_at = time.perf_counter()
        detected_frames = 0

        while True:
            frame_started_at = time.perf_counter()
            with RAW_FRAME_LOCK:
                raw_frame = None if LATEST_RAW_FRAME is None else LATEST_RAW_FRAME.copy()

            if raw_frame is None:
                time.sleep(detection_interval)
                continue

            detection_frame = raw_frame.copy()
            detection_frame, person_x, person_y, fall_status = detector.detect(detection_frame)
            detected_frames += 1
            cv2.circle(detection_frame, (screen_center_x, screen_center_y), 5, (255, 0, 0), -1)

            if person_x is not None and person_y is not None:
                error_x = person_x - screen_center_x
                error_y = person_y - screen_center_y

                cv2.line(detection_frame, (screen_center_x, screen_center_y), (person_x, person_y), (0, 255, 255), 2)

                if fall_status["is_fallen"]:
                    current_time = time.time()
                    can_alert = current_time - last_fall_alert_time > FALL_ALERT_COOLDOWN_SECONDS
                    if not fall_alert_active and can_alert:
                        print("!!! ALERT: FALL DETECTED !!!")
                        notify_clients("Warning: Fall detected!!")
                        fall_alert_active = True
                        last_fall_alert_time = current_time

                    cv2.putText(
                        detection_frame,
                        "FALL DETECTED!",
                        (frame_width // 2 - 150, 150),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        1.5,
                        (0, 0, 255),
                        4,
                    )
                elif not fall_status["lying"]:
                    fall_alert_active = False

                pan_signal = pid_x.compute(error_x)
                tilt_signal = pid_y.compute(error_y)

                cv2.putText(
                    detection_frame,
                    f"Err X: {error_x:4d} | Pan CMD: {pan_signal:6.2f}",
                    (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 255, 255),
                    2,
                )
                cv2.putText(
                    detection_frame,
                    f"Err Y: {error_y:4d} | Tilt CMD: {tilt_signal:6.2f}",
                    (20, 80),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 255, 255),
                    2,
                )
                cv2.putText(
                    detection_frame,
                    f"Fall state: {fall_status['reason']} | ID: {fall_status['track_id']}",
                    (20, 160),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.65,
                    (255, 255, 0),
                    2,
                )
            else:
                pid_x.reset()
                pid_y.reset()
                fall_alert_active = False
                cv2.putText(
                    detection_frame,
                    "Target Lost - Waiting...",
                    (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8,
                    (0, 0, 255),
                    2,
                )

            ret, buffer = cv2.imencode('.jpg', detection_frame, [cv2.IMWRITE_JPEG_QUALITY, STREAM_JPEG_QUALITY])
            if ret:
                LATEST_ANNOTATED_FRAME = buffer.tobytes()
                if STREAM_ANNOTATED:
                    with FRAME_LOCK:
                        LATEST_FRAME = LATEST_ANNOTATED_FRAME

            now = time.perf_counter()
            if now - last_stats_at >= 5.0:
                elapsed = now - last_stats_at
                print(f"Fall detection stats: detection={detected_frames / elapsed:.1f} fps")
                last_stats_at = now
                detected_frames = 0

            elapsed = time.perf_counter() - frame_started_at
            if elapsed < detection_interval:
                time.sleep(detection_interval - elapsed)

    threading.Thread(target=detection_worker, daemon=True).start()

    last_stats_at = time.perf_counter()
    captured_frames = 0
    print("Fall detection background thread started.")

    while True:
        frame_started_at = time.perf_counter()
        success, frame = cap.read()
        if not success:
            print("Failed to read camera frame. Retrying...")
            time.sleep(1)
            continue

        frame = cv2.flip(frame, 1)
        captured_frames += 1

        with RAW_FRAME_LOCK:
            LATEST_RAW_FRAME = frame.copy()

        if not STREAM_ANNOTATED:
            ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, STREAM_JPEG_QUALITY])
            if ret:
                with FRAME_LOCK:
                    LATEST_FRAME = buffer.tobytes()

        now = time.perf_counter()
        if now - last_stats_at >= 5.0:
            elapsed = now - last_stats_at
            print(
                f"Fall camera stats: capture={captured_frames / elapsed:.1f} fps, "
                f"stream={'annotated' if STREAM_ANNOTATED else 'raw'}, "
                f"jpeg_quality={STREAM_JPEG_QUALITY}"
            )
            last_stats_at = now
            captured_frames = 0

        elapsed = time.perf_counter() - frame_started_at
        if elapsed < capture_interval:
            time.sleep(capture_interval - elapsed)

def generate_frames():
    """Generator function to yield JPEG frames for StreamingResponse."""
    frame_interval = 1.0 / STREAM_FPS
    while True:
        frame_started_at = time.perf_counter()
        with FRAME_LOCK:
            frame = LATEST_FRAME
        if frame is None:
            time.sleep(frame_interval)
            continue
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        
        elapsed = time.perf_counter() - frame_started_at
        if elapsed < frame_interval:
            time.sleep(frame_interval - elapsed)

def generate_raw_frames():
    """Yield unannotated camera frames for camera reuse flows such as FaceID."""
    frame_interval = 1.0 / STREAM_FPS
    while True:
        frame_started_at = time.perf_counter()
        with RAW_FRAME_LOCK:
            frame = None if LATEST_RAW_FRAME is None else LATEST_RAW_FRAME.copy()
        if frame is None:
            time.sleep(frame_interval)
            continue

        ret, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, STREAM_JPEG_QUALITY])
        if ret:
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n"
            )

        elapsed = time.perf_counter() - frame_started_at
        if elapsed < frame_interval:
            time.sleep(frame_interval - elapsed)

@router.get("/stream")
def video_stream():
    """Endpoint for viewing the live video stream from Fall Detection."""
    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

@router.get("/raw-stream")
def raw_video_stream():
    """Endpoint for viewing the raw camera stream without detection overlays."""
    return StreamingResponse(generate_raw_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

@router.get("/snapshot")
def snapshot():
    """Return one raw camera frame for flows that cannot open the webcam directly."""
    with RAW_FRAME_LOCK:
        frame = None if LATEST_RAW_FRAME is None else LATEST_RAW_FRAME.copy()

    if frame is None:
        raise HTTPException(status_code=503, detail="Camera frame is not ready yet")

    ret, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, STREAM_JPEG_QUALITY])
    if not ret:
        raise HTTPException(status_code=500, detail="Could not encode camera frame")

    return Response(content=buffer.tobytes(), media_type="image/jpeg")

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Websocket for Fall Detection alerts."""
    await websocket.accept()
    client = WebSocketClient(websocket=websocket, loop=asyncio.get_running_loop())
    with WEBSOCKET_LOCK:
        ACTIVE_WEBSOCKETS.append(client)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        with WEBSOCKET_LOCK:
            if client in ACTIVE_WEBSOCKETS:
                ACTIVE_WEBSOCKETS.remove(client)

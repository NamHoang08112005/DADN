import time

import cv2

from services.fall_detection.fall_config import (
    CAMERA_FPS,
    CAMERA_HEIGHT,
    CAMERA_INDEX,
    CAMERA_WIDTH,
    FALL_ALERT_COOLDOWN_SECONDS,
    PID_X,
    PID_Y,
)
from services.fall_detection.control.pid import PIDController
from services.fall_detection.vision.detector_yolo import YoloDetector


def main():
    cap = cv2.VideoCapture(CAMERA_INDEX)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, CAMERA_WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CAMERA_HEIGHT)
    cap.set(cv2.CAP_PROP_FPS, CAMERA_FPS)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    if not cap.isOpened():
        print("Error: Could not connect to camera.")
        return

    detector = YoloDetector()
    pid_x = PIDController(**PID_X)
    pid_y = PIDController(**PID_Y)

    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    screen_center_x = frame_width // 2
    screen_center_y = frame_height // 2

    fall_alert_active = False
    last_fall_alert_time = 0.0

    print("System ready. Press q to quit.")

    while True:
        success, frame = cap.read()
        if not success:
            break

        frame = cv2.flip(frame, 1)

        frame, person_x, person_y, fall_status = detector.detect(frame)
        cv2.circle(frame, (screen_center_x, screen_center_y), 5, (255, 0, 0), -1)

        if person_x is not None and person_y is not None:
            error_x = person_x - screen_center_x
            error_y = person_y - screen_center_y

            cv2.line(frame, (screen_center_x, screen_center_y), (person_x, person_y), (0, 255, 255), 2)

            if fall_status["is_fallen"]:
                current_time = time.time()
                can_alert = current_time - last_fall_alert_time > FALL_ALERT_COOLDOWN_SECONDS
                if not fall_alert_active and can_alert:
                    print("!!! ALERT: FALL DETECTED !!!")
                    # TODO: Send this event to hardware, a siren/light, Telegram, or IFTTT.
                    fall_alert_active = True
                    last_fall_alert_time = current_time

                cv2.putText(
                    frame,
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
                frame,
                f"Err X: {error_x:4d} | Pan CMD: {pan_signal:6.2f}",
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 255, 255),
                2,
            )
            cv2.putText(
                frame,
                f"Err Y: {error_y:4d} | Tilt CMD: {tilt_signal:6.2f}",
                (20, 80),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 255, 255),
                2,
            )
            cv2.putText(
                frame,
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
                frame,
                "Target Lost - Waiting...",
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (0, 0, 255),
                2,
            )

        cv2.imshow("Camera Tracking - System Pipeline", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()

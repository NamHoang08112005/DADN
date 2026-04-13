import asyncio
import time
import hashlib
import sys

import cv2
import websockets
import json
from imutils.video import VideoStream

# Configuration
oracle_ip   = "129.150.38.89"
URI         = f"ws://{oracle_ip}:5000/ws"
ENC_QUALITY = 75
RESIZE      = (320, 256)
FPS_TARGET  = 24
SEND_EVERY  = 2  # send every 2nd captured frame

async def detect_loop():
    vs = VideoStream(src=0).start()
    await asyncio.sleep(2.0)  # camera warm‑up

    try:
        async with websockets.connect(URI, max_size=2**22) as ws:
            frame_id   = 0
            last_hash  = None
            frame_time = 1 / FPS_TARGET

            while True:
                start = time.time()

                # 1) grab original full‑res frame
                frame = vs.read()
                if frame is None:
                    continue
                h0, w0 = frame.shape[:2]

                frame_id += 1
                if frame_id % SEND_EVERY:
                    await asyncio.sleep(0)
                    continue

                # 2) resize & JPEG encode to 320×256
                small = cv2.resize(frame, RESIZE)
                h1, w1 = small.shape[:2]
                _, jpg = cv2.imencode(
                    ".jpg", small,
                    [cv2.IMWRITE_JPEG_QUALITY, ENC_QUALITY]
                )
                data = jpg.tobytes()

                # 3) optional: skip identical frames
                current_hash = hashlib.md5(data).hexdigest()
                if current_hash == last_hash:
                    await ws.send(data)
                    await ws.recv()
                    continue
                last_hash = current_hash

                # 4) send & await detection on small
                await ws.send(data)
                dets = json.loads(await ws.recv())

                # 5) compute scale factors
                fx = w0 / w1
                fy = h0 / h1

                # 6) draw scaled boxes on the full‑res frame
                for d in dets:
                    x1, y1, x2, y2 = d["bbox"]
                    x1 = int(x1 * fx);  x2 = int(x2 * fx)
                    y1 = int(y1 * fy);  y2 = int(y2 * fy)
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                    label = f"{d['class']} {d['confidence']:.2f}"
                    cv2.putText(
                        frame, label, (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2
                    )

                # 7) display the full‑resolution frame
                cv2.imshow("Fire Detection", frame)
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    # Clean up and exit immediately
                    print("Quitting...")
                    return

                # 8) throttle to target FPS
                elapsed = time.time() - start
                await asyncio.sleep(max(0, frame_time - elapsed))

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)

    finally:
        # Always invoked on exit or error
        vs.stop()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    asyncio.run(detect_loop())

import os
import cv2
import numpy as np
import pandas as pd
from datetime import datetime

from utils.mediapipe_utils import (
    HandDetector,
    get_main_hand,
    extract_landmarks,
    draw_label,
    init_camera,
    read_frame
)

# ==============================
# CONFIG
# ==============================
# DATA_DIR = "../data"
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

SAVE_RAW = True   # keep raw landmarks (recommended)

# Key → gesture mapping
GESTURE_KEYS = {
    ord('0'): "open_palm",       # turn on all
    ord('1'): "fist",            # turn off all

    ord('2'): "thumbs_up",       # increase speed
    ord('3'): "thumbs_down",     # decrease speed

    ord('4'): "peace",           # turn on light
    ord('5'): "four_fingers",    # turn off light
}

# ==============================
# INIT
# ==============================
detector = HandDetector()
cap = init_camera()

current_label = None

buffer = []
capturing = False
capture_count = 0
last_capture_time = 0

print("🎮 Controls:")
print("0-5: Select gesture label")
print("k: Capture posing gesture")
print("s: Save data")
print("c: Clear buffer")
print("q: Quit")

# ==============================
# CONFIG
# ==============================
SAMPLES_PER_CAPTURE = 1
CAPTURE_DELAY = 0.1  # seconds

# ==============================
# MAIN LOOP
# ==============================
import time

while True:
    frame = read_frame(cap)
    if frame is None:
        break

    results = detector.process(frame)
    hand = get_main_hand(results)

    if hand:
        detector.draw_landmarks(frame, hand)

        # ==============================
        # CONTROLLED CAPTURE
        # ==============================
        if capturing and current_label:
            current_time = time.time()

            if current_time - last_capture_time > CAPTURE_DELAY:
                landmarks = extract_landmarks(hand)
                buffer.append(landmarks)

                capture_count += 1
                last_capture_time = current_time

                print(f"📸 Captured {capture_count}/{SAMPLES_PER_CAPTURE}")

            if capture_count >= SAMPLES_PER_CAPTURE:
                capturing = False
                print("✅ Capture complete!")

    # ==============================
    # DISPLAY
    # ==============================
    draw_label(frame, f"Label: {current_label}", (10, 40))
    draw_label(frame, f"Buffer: {len(buffer)}", (10, 80), (255, 255, 0))
    draw_label(frame, f"Capturing: {capturing}", (10, 120), (0, 255, 255))

    cv2.imshow("Data Collection", frame)

    key = cv2.waitKey(1) & 0xFF

    # ==============================
    # KEY CONTROLS
    # ==============================
    if key in GESTURE_KEYS:
        current_label = GESTURE_KEYS[key]
        print(f"🎯 Selected: {current_label}")

    elif key == ord('k'):  # 🔥 CAPTURE TRIGGER
        if not current_label:
            print("⚠️ Select a label first")
            continue

        capturing = True
        capture_count = 0
        print("🚀 Start capturing...")

    elif key == ord('c'):
        buffer = []
        print("🧹 Buffer cleared")

    elif key == ord('s'):
        if not current_label or len(buffer) == 0:
            print("⚠️ Nothing to save")
            continue

        file_path = os.path.join(DATA_DIR, f"{current_label}.csv")

        df_new = pd.DataFrame(buffer)

        if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
            try:
                df_old = pd.read_csv(file_path)
                df_all = pd.concat([df_old, df_new], ignore_index=True)
            except Exception as e:
                print("⚠️ Failed to read old file, overwriting:", e)
                df_all = df_new
        else:
            df_all = df_new

        df_all.to_csv(file_path, index=False)

        print(f"💾 Saved {len(buffer)} samples → {file_path}")
        print("📁 Saving to:", os.path.abspath(file_path))

        buffer = []

    elif key == ord('q'):
        break

# ==============================
# CLEANUP
# ==============================
cap.release()
cv2.destroyAllWindows()

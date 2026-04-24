import os
import time
import json
import numpy as np
import joblib
from collections import deque

import cv2
import paho.mqtt.client as mqtt

# Utils
from utils.mediapipe_utils import (
    HandDetector,
    get_main_hand,
    extract_landmarks,
    draw_label,
    init_camera,
    read_frame
)
from utils.preprocessing import preprocess
from mqtt.publisher import MQTTPublisher


# ==============================
# CONFIG
# ==============================
MQTT_BROKER = "io.adafruit.com"
MQTT_PORT = 1883
MQTT_USERNAME = "StarryNight"

# Due to github commit issue (github will scan code!) -> remove key
MQTT_KEY = ""
# MQTT_TOPIC = f"{MQTT_USERNAME}/feeds/smart-home.ai.gesture"
MQTT_TOPIC = f"{MQTT_USERNAME}/feeds/smarthome.ai.gesture"

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "models")

# MODEL_PATH = "../models/gesture_model.pkl"
MODEL_PATH = f"{MODEL_DIR}/gesture_model.pkl"
# ENCODER_PATH = "../models/label_encoder.pkl"
ENCODER_PATH = f"{MODEL_DIR}/label_encoder.pkl"

CONFIDENCE_THRESHOLD = 0.7
SMOOTHING_WINDOW = 5
COOLDOWN_TIME = 2.0  # seconds

USE_2D = False


# ==============================
# LOAD MODEL
# ==============================
model = joblib.load(MODEL_PATH)
label_encoder = joblib.load(ENCODER_PATH)


# ==============================
# MQTT SETUP
# ==============================
# client = mqtt.Client()
# client.username_pw_set(MQTT_USERNAME, MQTT_KEY)
# client.connect(MQTT_BROKER, MQTT_PORT, 60)
mqtt_client = MQTTPublisher(
    broker=MQTT_BROKER,
    port=MQTT_PORT,
    username=MQTT_USERNAME,
    key=MQTT_KEY,
    default_topic=MQTT_TOPIC
)
mqtt_client.connect()


# ==============================
# INIT COMPONENTS
# ==============================
detector = HandDetector()
cap = init_camera()


# ==============================
# SMOOTHING
# ==============================
pred_queue = deque(maxlen=SMOOTHING_WINDOW)
last_sent_time = 0
last_sent_gesture = None


# a window of 5 to 15 frames is the "sweet spot" for responsiveness versus stability
def get_stable_prediction(queue):
    if len(queue) < SMOOTHING_WINDOW:
        return None
    # FIND: mode
    # set(queue): takes all the predictions in your queue and removes duplicates
    # queue.count: counts how many times each gesture appears in the original queue
    # max(..., key=...): looks at the unique gestures and picks the one that has the highest count
    return max(set(queue), key=queue.count)


# ==============================
# MAIN LOOP
# ==============================
print("🚀 Gesture inference started. Press 'q' to quit.")

while True:
    frame = read_frame(cap)
    if frame is None:
        break

    results = detector.process(frame)
    hand = get_main_hand(results)

    gesture_name = None
    confidence = 0.0

    if hand:
        # Draw landmarks
        detector.draw_landmarks(frame, hand)

        # Extract + preprocess
        landmarks = extract_landmarks(hand)
        features = preprocess(landmarks, use_2d=USE_2D).reshape(1, -1)

        # Predict
        probs = model.predict_proba(features)[0]
        pred_idx = np.argmax(probs)
        confidence = probs[pred_idx]

        gesture_name = str(label_encoder.inverse_transform([pred_idx])[0])

        # Add to smoothing queue
        if confidence > CONFIDENCE_THRESHOLD:
            pred_queue.append(gesture_name)

    # ==============================
    # STABLE PREDICTION
    # ==============================
    stable_gesture = get_stable_prediction(pred_queue)

    # ==============================
    # MQTT PUBLISH (cooldown + dedup)
    # ==============================
    current_time = time.time()

    if (
        stable_gesture is not None and
        (current_time - last_sent_time > COOLDOWN_TIME) and
        stable_gesture != last_sent_gesture
    ):
        payload = {
            "gesture": str(stable_gesture),
            "confidence": float(confidence),
            "timestamp": int(current_time)
        }

        mqtt_client.publish_gesture(payload, MQTT_TOPIC)
        print(f"📤 Publishing -> {MQTT_TOPIC}: {payload}")

        last_sent_time = current_time
        last_sent_gesture = stable_gesture

    # ==============================
    # DISPLAY
    # ==============================
    draw_label(frame, f"Gesture: {stable_gesture}", (10, 40))
    draw_label(frame, f"Conf: {confidence:.2f}", (10, 80), (255, 255, 0))

    cv2.imshow("Gesture Control", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        mqtt_client.auto_reconnect = False
        break


# ==============================
# CLEANUP
# ==============================
cap.release()
cv2.destroyAllWindows()
mqtt_client.disconnect()

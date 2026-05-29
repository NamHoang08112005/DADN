import time
import requests

BACKEND_URL = "http://127.0.0.1:8000"

#CONFIDENCE_THRESHOLD = 0.7

def send_gesture(gesture_description):
    """
    Send only gesture + confidence to backend.
    Backend will decide what to do.
    """

    confidence = gesture_description.get('confidence', 0.0)
    gesture = gesture_description.get('gesture', "unknown")

    # Already embedded into gesture inference
    # Filter low-confidence predictions at edge (optional but good)
    #if confidence is None or confidence < CONFIDENCE_THRESHOLD:
    #    print("⚠️ Low confidence - gesture ignored")
    #    return

    #payload = {
    #    "gesture": gesture,
    #    "confidence": confidence,
    #    "timestamp": time.time()
    #}

    try:
        print(f"📤 Sending gesture -> {gesture} ({confidence:.2f})")

        response = requests.post(
            f"{BACKEND_URL}/gesture/execute",
            json=gesture_description,
            timeout=3
        )

        if response.status_code != 200:
            print("❌ Backend error:", response.text)

    except Exception as e:
        print("❌ Failed to send gesture:", e)

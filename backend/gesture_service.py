import json


# ==============================
# DEVICE TOPICS
# ==============================
def topic(room, device, device_id):
    return f"smart-home/{room}/{device}/{device_id}/command"


# ==============================
# GESTURE → ACTION LOGIC
# ==============================
def handle_gesture(data, mqtt_client):
    gesture = data.get("gesture")
    confidence = data.get("confidence", 0)

    if confidence < 0.7:
        print("⚠️ Low confidence, ignored")
        return

    print(f"🧠 Processing gesture: {gesture}")

    # ==============================
    # MAPPING
    # ==============================
    if gesture == "open_palm":
        mqtt_client.publish(
            topic("living-room", "light", "led1"),
            json.dumps({"state": "ON"})
        )

    elif gesture == "fist":
        mqtt_client.publish(
            topic("living-room", "light", "led1"),
            json.dumps({"state": "OFF"})
        )

    elif gesture == "swipe_right":
        mqtt_client.publish(
            topic("living-room", "fan", "fan1"),
            json.dumps({"speed": 3})
        )

    elif gesture == "swipe_left":
        mqtt_client.publish(
            topic("living-room", "fan", "fan1"),
            json.dumps({"speed": 1})
        )

    elif gesture == "thumbs_up":
        mqtt_client.publish(
            topic("living-room", "servo", "curtain1"),
            json.dumps({"angle": 90})
        )

    elif gesture == "thumbs_down":
        mqtt_client.publish(
            topic("living-room", "servo", "curtain1"),
            json.dumps({"angle": 0})
        )

    else:
        print("❓ Unknown gesture")

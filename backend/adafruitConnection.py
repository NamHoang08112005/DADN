from Adafruit_IO import MQTTClient, Client
from dotenv import load_dotenv
import os
import sys
import random
import threading

load_dotenv()

# Adafruit IO Credentials
AIO_FEED_IDS = ["color change", "fan", "humid", "light", "switch", "temp", "text"]

def _require_env(name):
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


AIO_USERNAME = _require_env("AIO_USERNAME")
AIO_KEY = _require_env("AIO_KEY")

# Create Adafruit IO REST API Client
aio = Client(AIO_USERNAME, AIO_KEY)

# Create Adafruit IO MQTT Client
mqtt_client = MQTTClient(AIO_USERNAME, AIO_KEY)

def get_aio():
    if aio is None:
        raise Exception("Adafruit IO client not initialized!")
    return aio

def get_mqtt():
    if mqtt_client is None:
        raise Exception("Adafruit MQTT client not initialized!")
    return mqtt_client

#### API section
latest_temp = None

#### Ada Fruit Connection Section
def connected(client):
    print("Connected to Adafruit IO!")
    for feed in AIO_FEED_IDS:
        client.subscribe(feed)  # Subscribe to all feeds

def disconnected(client):
    print("Disconnected from Adafruit IO!")
    sys.exit(1)

def message(client, feed_id, payload):
    global latest_temp
    print(f"Received: {feed_id} = {payload}")
    if feed_id == AIO_FEED_IDS[5]:
        latest_temp = payload  # Store latest temperature

def publish_random_data(client, id):
    value = random.randint(0, 100)  # Generate a random value
    print(f"Publishing {value:.2f} to {AIO_FEED_IDS[id]}")
    client.publish( AIO_FEED_IDS[id] , value)
    
# def random_loop(client):
#     while True:
#         value = random.randint(0, 6)
#         publish_random_data(client, 1)
#         time.sleep(5)
#     print("Random loop stopped.")

#  Start MQTT Client in a separate thread
def start_mqtt():
    try:
        mqtt_client.on_message = message
        mqtt_client.on_connect = connected
        mqtt_client.on_disconnect = disconnected
        mqtt_client.connect()
        mqtt_client.loop_background()
    except Exception as e:
        print(f"[MQTT Error] {e}")

def run_mqtt_thread():
    mqtt_thread = threading.Thread(target=start_mqtt, daemon=True)
    mqtt_thread.start()

# if __name__ == "__main__":
#     # Start MQTT listener thread
#     # Thread này dùng đề listen feedback từ Adafruit
#     mqtt_thread = threading.Thread(target=start_mqtt, daemon=True)
#     mqtt_thread.start()

#     # Start random_loop thread
#     # Thread này dùng để push random data lên Ada feed, chạy bth thì k nên bật
#     # random_thread = threading.Thread(target=random_loop, args=(mqtt_client,), daemon=True)
#     # random_thread.start()
    
#     try:
#         while True:
#             time.sleep(1)
#     except KeyboardInterrupt:
#         print("Shutting down gracefully.")



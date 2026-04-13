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

def check_adafruit_connection():
    """
    Kiểm tra xem Adafruit có kết nối được không hay bị chặn
    Returns:
        dict: {
            'connected': bool,
            'status': str,
            'error': str (nếu có)
        }
    """
    try:
        if mqtt_client is None:
            return {
                'connected': False,
                'status': 'MQTT client not initialized',
                'error': 'mqtt_client is None'
            }
        
        # Kiểm tra xem mqtt_client có is_connected() method không
        if hasattr(mqtt_client, '_client') and mqtt_client._client:
            is_connected = mqtt_client._client.is_connected()
            if is_connected:
                return {
                    'connected': True,
                    'status': 'Connected to Adafruit IO',
                    'error': None
                }
            else:
                return {
                    'connected': False,
                    'status': 'MQTT client disconnected',
                    'error': 'Connection lost or not established'
                }
        else:
            return {
                'connected': False,
                'status': 'MQTT client not ready',
                'error': 'Internal MQTT client not initialized'
            }
    except Exception as e:
        return {
            'connected': False,
            'status': 'Connection check failed',
            'error': str(e)
        }

def is_adafruit_connected():
    """
    Simple boolean check - returns True nếu Adafruit đã kết nối được
    """
    result = check_adafruit_connection()
    return result['connected']

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



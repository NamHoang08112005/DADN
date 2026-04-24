import json
import time
import threading
import paho.mqtt.client as mqtt


# ==============================
# MQTT PUBLISHER CLASS
# ==============================

class MQTTPublisher:
    def __init__(
        self,
        broker,
        port,
        username,
        key,
        default_topic=None,
        keepalive=60,
        auto_reconnect=True
    ):
        self.broker = broker
        self.port = port
        self.username = username
        self.key = key
        self.default_topic = default_topic
        self.keepalive = keepalive
        self.auto_reconnect = auto_reconnect

        self.client = mqtt.Client()
        self.client.username_pw_set(self.username, self.key)

        # callbacks
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect

        self.connected = False

        # background loop thread
        self._loop_thread = None

    # ==============================
    # CALLBACKS
    # ==============================
    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            print("✅ MQTT connected")
            self.connected = True
        else:
            print(f"❌ MQTT connection failed: {rc}")

    def _on_disconnect(self, client, userdata, rc):
        print("⚠️ MQTT disconnected")
        self.connected = False

        if self.auto_reconnect:
            self._reconnect()

    # ==============================
    # CONNECTION MANAGEMENT
    # ==============================
    def connect(self):
        self.client.connect(self.broker, self.port, self.keepalive)

        # run loop in background
        self._loop_thread = threading.Thread(target=self.client.loop_forever)
        self._loop_thread.daemon = True
        self._loop_thread.start()

    def _reconnect(self):
        print("🔄 Attempting reconnect...")
        while not self.connected:
            try:
                self.client.reconnect()
                time.sleep(2)
            except Exception as e:
                print("Reconnect failed:", e)
                time.sleep(2)

    def disconnect(self):
        self.client.disconnect()

    # ==============================
    # PUBLISH METHODS
    # ==============================
    # "Quality of Service." 
    # Usually set to 0 for fast updates (like dimming a light) 
    # or 1 to ensure the command definitely arrives
    def publish(self, payload, topic=None, qos=0, retain=False):
        """
        Publish raw payload (dict or string)
        """
        if not self.connected:
            print("⚠️ MQTT not connected, skipping publish")
            return

        if topic is None:
            topic = self.default_topic

        if topic is None:
            raise ValueError("No topic specified")

        if isinstance(payload, dict):
            payload = json.dumps(payload)

        self.client.publish(topic, payload, qos=qos, retain=retain)

    def publish_gesture(self, payload, topic=None):
        """
        Standardized gesture payload
        Accept dict payload directly
        """
        if not isinstance(payload, dict):
            raise ValueError("payload must be dict")

        # payload.setdefault("timestamp", int(time.time()))

        self.publish(payload, topic=topic)

    def publish_json(self, data, topic=None):
        """
        Force JSON publish
        """
        self.publish(json.dumps(data), topic=topic)

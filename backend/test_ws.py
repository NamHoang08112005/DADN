from fastapi.testclient import TestClient
from main import app

client = TestClient(app)
try:
    with client.websocket_connect("/fall-detection/ws") as websocket:
        print("Connected successfully!")
        websocket.send_text("test")
        print("Message sent")
except Exception as e:
    print(f"Connection failed: {e}")

from fastapi import FastAPI, HTTPException, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import uvicorn
from routers import fan, light, sensor, login, activitylog
from contextlib import asynccontextmanager
from adafruitConnection import run_mqtt_thread
import os
from supabase import create_client, Client
import threading
from threading import Lock
import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from datetime import datetime, timedelta, timezone

class ThresholdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        app = request.app
        with app.state.max_request_lock:
            # print("Hello app state 1")
            # If app is in cooldown mode
            if app.state.cooldown_until:
                # print("Hello app state cooldown until")
                if datetime.now(timezone.utc).replace(tzinfo=None) < app.state.cooldown_until:
                    return JSONResponse(
                        {"error": "Temporarily blocked due to high activity. Try again later."},
                        status_code=429
                    )
                else:
                    # Cooldown expired
                    app.state.cooldown_until = None
                    app.state.max_request_counter = 0

            # Normal threshold check
            if app.state.max_request_counter >= app.state.max_limit:
                # Start cooldown for 2 minutes
                app.state.cooldown_until = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=2)
                return JSONResponse(
                    {"error": "Too many requests. You are temporarily blocked for 2 minutes."},
                    status_code=429
                )

            # Count this request
            app.state.max_request_counter += 1
            # print(app.state.max_request_counter)

        return await call_next(request)

# Reset to counter every 1 min
def check_to_reset(app: FastAPI):
    while True:
        time.sleep(60)  # 1 minutes
        with app.state.max_request_lock:
            print("Hello ", app.state.max_request_counter)
            app.state.max_request_counter = 0

@asynccontextmanager
async def lifespan(app: FastAPI):
    # A dedicated thread to constantly received new data from adafruit
    run_mqtt_thread()

    # Set up connection to Cloud Database
    url: str = "https://uptilkatqzrxvsqzcemx.supabase.co"
    key: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwdGlsa2F0cXpyeHZzcXpjZW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1NjkyOTMsImV4cCI6MjA2MTE0NTI5M30.XrdLClY2uTnKp9htHIU1dae2WdOXVbLVD5GwP0lW7mA"

    supabase: Client = create_client(url, key)
    app.state.db = supabase
    print("Finish set up connection with Supabase DB.")

    # Set up max action threshold + Lock
    app.state.max_request_counter = 0
    app.state.max_request_lock = Lock()
    app.state.max_limit = 25
    app.state.cooldown_until = None

    # A dedicated thread that constantly checking on the threshold and reset it
    threading.Thread(target=check_to_reset, args = (app,), daemon=True).start()

    yield  # Yield to let FastAPI start the app

    # No clean up needed
    print("No clean up needed with Supabase DB.")

    

# Initialize FastAPI app
app = FastAPI(lifespan= lifespan)

# Middleware for CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.56.1:3000",
]

app.add_middleware(
    ThresholdMiddleware
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
# Include routers
app.include_router(fan.router)
app.include_router(light.router)
app.include_router(sensor.router)
app.include_router(login.router)
app.include_router(activitylog.router)

@app.get("/")
async def root():
    """
    Root endpoint to check API status.
    """
    return { "Hello World" }
    

# @app.websocket("/notifications/ws")
# async def websocket_endpoint(websocket: WebSocket):
#     await websocket.accept()
#     await websocket.send_json({
#         "type": "notification",
#         "notification": {
#             "type": "fire_alert",
#             "data": {
#                 "location": "Room 101"
#             }
#         }
#     })
    
#     while True:
#         try:
#             data = await websocket.receive_text()
#             print(f"Message received: {data}")
#             # Optionally send messages back
#         except:
#             break

# ✅ Start FastAPI
if __name__ == "__main__":
    # Start FastAPI with Uvicorn
    # Main thread sẽ đc dùng để host API server, nơi frontend get data từ backend
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)

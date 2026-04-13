# Smart Home Backend

## Overview
The backend of the Smart Home project is built using FastAPI and Python. It provides a RESTful API for the frontend to interact with various sensors and devices in the smart home system. The backend also integrates with Adafruit IO for IoT device management and MySQL for data storage.

## Features
- RESTful API for sensor data retrieval
- Real-time device control (fan, light)
- Integration with Adafruit IO for IoT device management
- MySQL database integration for user authentication
- CORS support for frontend communication

## Tech Stack
- **Framework**: FastAPI
- **Language**: Python
- **Database**: MySQL
- **IoT Platform**: Adafruit IO
- **MQTT Client**: Adafruit MQTT Client

## Project Structure
```
backend/
├── main.py                # Main application entry point
├── model.py               # Pydantic models for data validation
├── adafruitConnection.py  # Adafruit IO integration
├── routers/               # API route handlers
│   ├── fan.py             # Fan control routes
│   ├── light.py           # Light control routes
│   ├── sensor.py          # Sensor data routes
│   └── login.py           # Authentication routes
└── ...
```

## API Endpoints

### Sensor Data
- **Temperature**:
  - `GET /sensor/temp/latest` - Get latest temperature reading
  - `GET /sensor/temp/history1000` - Get last 1000 temperature readings

- **Humidity**:
  - `GET /sensor/humid/latest` - Get latest humidity reading
  - `GET /sensor/humid/history1000` - Get last 1000 humidity readings

- **Light**:
  - `GET /sensor/light/latest` - Get latest light intensity reading
  - `GET /sensor/light/history1000` - Get last 1000 light intensity readings

### Device Control
- **Fan**:
  - `POST /fan/fan/on` - Turn on fan with specified speed
  - `POST /fan/fan/off` - Turn off fan

- **Light**:
  - `POST /light/switch/on` - Turn on light
  - `POST /light/switch/off` - Turn off light

### Authentication
- `POST /login/authentication` - Authenticate user

## Getting Started

### Prerequisites
- Python 3.8 or higher
- MySQL server
- Adafruit IO account

### Environment Variables
Create a `backend/.env` file with your Adafruit IO credentials:

```env
AIO_USERNAME=your_adafruit_username
AIO_KEY=your_adafruit_key
```

The backend reads these values at startup, so do not commit real credentials to git.

### Installation
1. Clone the repository
2. Navigate to the backend directory:
   ```
   cd backend
   ```
3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```


### Running the Server
To start the development server:
```
fastapi dev main.py
```
The API will be available at http://127.0.0.1:8000

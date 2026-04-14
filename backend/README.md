# Smart Home Backend

## Overview
The backend of the Smart Home project is built using FastAPI and Python. It provides a RESTful API for the frontend to interact with various sensors and devices in the smart home system. The backend also integrates with Adafruit IO for IoT device management and Supabase for data storage.

## Features
- RESTful API for sensor data retrieval
- Real-time device control (fan, light)
- Integration with Adafruit IO for IoT device management
- Supabase database integration for user authentication and activity logs
- CORS support for frontend communication

## Tech Stack
- **Framework**: FastAPI
- **Language**: Python
- **Database**: Supabase (Postgres)
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

## Getting Started

### Prerequisites
- Python 3.11 or 3.12 (recommended)
- Adafruit IO account
- Supabase project

### Environment Variables
Create a `backend/.env` file with your Adafruit IO and Supabase credentials:

```env
AIO_USERNAME=your_adafruit_username
AIO_KEY=your_adafruit_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
```

The backend reads these values at startup, so do not commit real credentials to git.

### Installation
1. Clone the repository
2. Navigate to the backend directory:
   ```
   cd backend
   ```
3. Create and activate a virtual environment with Python 3.12 (Windows PowerShell):
   ```
   py -3.12 -m venv ..\.venv
   ..\.venv\Scripts\Activate.ps1
   ```
4. Upgrade packaging tools:
   ```
   python -m pip install --upgrade pip setuptools wheel
   ```
5. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

If you use Python 3.14, `numpy` can fail with `metadata-generation-failed` because compatible wheels may not be available yet.

### Running the Server
To start the development server:
```
fastapi dev main.py
```
The API will be available at http://127.0.0.1:8000

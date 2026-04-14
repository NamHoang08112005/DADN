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

### Step-by-step: Run the Backend Server (Windows PowerShell)

1. Open PowerShell and move to the backend folder:
   ```powershell
   cd backend
   ```

2. Create the virtual environment (first time only):
   ```powershell
   py -3.12 -m venv ..\.venv
   ```

3. Activate the virtual environment (every time you open a new terminal):
   ```powershell
   ..\.venv\Scripts\Activate.ps1
   ```

4. Upgrade packaging tools (recommended after activation):
   ```powershell
   python -m pip install --upgrade pip setuptools wheel
   ```

5. Install dependencies:
   ```powershell
   python -m pip install -r requirements.txt
   ```

6. Start the server with the recommended script:
   ```powershell
   .\run.ps1
   ```

7. Open the API in your browser:
   ```
   http://127.0.0.1:8000
   ```

If you use Python 3.14, `numpy` can fail with `metadata-generation-failed` because compatible wheels may not be available yet.

### Alternative Manual Start
If needed, you can run the app manually after environment activation:

```powershell
fastapi dev main.py
```

If you encounter the OpenMP error (`OMP: Error #15`), use `.\run.ps1` instead of manual startup.

## Troubleshooting

### OpenMP Library Conflict Error
**Error**: `OMP: Error #15: Initializing libomp140.x86_64.dll, but found libiomp5md.dll already initialized.`

**Cause**: Conflict between NumPy and PyTorch OpenMP runtimes.

**Solution**:
1. Use the provided `run.ps1` script (Recommended):
   ```powershell
   .\run.ps1
   ```
   
2. Or manually set the environment variable before running:
   ```powershell
   $env:KMP_DUPLICATE_LIB_OK='TRUE'
   fastapi dev main.py
   ```

The `run.ps1` script automatically handles this configuration, so it's the easiest solution.

### ModuleNotFoundError: No module named uvicorn
**Error**: `C:\Users\...\python.exe: No module named uvicorn`

**Cause**: You are running the backend with a different Python interpreter than the one where `requirements.txt` was installed.

**Solution**:
1. Activate the project virtual environment:
   ```powershell
   ..\.venv\Scripts\Activate.ps1
   ```

2. Reinstall dependencies in the active environment:
   ```powershell
   python -m pip install -r requirements.txt
   ```

3. Start the backend again:
   ```powershell
   .\run.ps1
   ```

4. Verify interpreter and package if needed:
   ```powershell
   python -c "import sys; print(sys.executable)"
   python -m pip show uvicorn
   ```

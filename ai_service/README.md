# Smart Home AI Service

## Overview

The AI Service is the Machine Learning, and Computer Vision module of the Smart Home project. It is responsible for performing real-time AI inference on edge devices (simulated using a laptop webcam), and enabling intelligent interaction with IoT devices through hand gestures. The current architecture follows a hybrid Edge AI + Backend Logic design.

## Features

- Real-time hand gesture recognition using webcam input
- MediaPipe hand landmark extraction
- ML-based gesture classification using pre-trained Support Vector Machine model
- Edge inference for low latency, efficient network bandwidth usage, and better privacy

Example of gesture-action mappings (Gestures and Actions are pre-configured, cannot create a new one):

| Gesture        | Description                 |
| -------------- | --------------------------- |
| `open_palm`    | Turn on both fan and light  |
| `fist`         | Turn off both fan and light |
| `thumbs_up`    | Increase fan speed (+10%)   |
| `thumbs_down`  | Decrease fan speed (-10%)   |
| `peace`        | Turn on light (white)       |
| `four_fingers` | Turn off light (black)      |


## Gesture-to-IoT Pipeline

1. Webcam/ Camera: OpenCV captures frames from the webcam

```python
cap = cv2.VideoCapture(0)
```

2. The AI service:
	1. MediaPipe extracts 21 hand landmarks from captured frames
	2. Landmark coordinates are converted into ML input vectors
	3. SVM model performs classification (gesture label, confidence score) on vectors
	4. Only gestures with high confidence are sent to the backend using backend API endpoints (HTTP)

Example:
```python
requests.post(
    "{BACKEND_BASE_URL}/gesture/execute",
    json={
        "gesture": gesture,
        "confidence": confidence,
        "timestamp": ...
    }
)
```

3. The backend:
	1. Validates confidence (discards gestures with confidence < 0.7)
	2.  Loads gesture mappings from RAM cache (avoid slow mappings load from database)
	3. Applies gesture mappings using customizable rules to get expected actions
	4. Decision logic: Generates IoT commands from expected actions
	5. Parallel:
		1. Publishes commands to Adafruit IO using MQTT
		2. Broadcasts expected fan/led states (deduces from expected actions) to frontend for real-time interface update
		3. Store loggings to database

4. Adafruit IO: Control IoT devices

## Tech Stack

| Component             | Technology                                                                |
| --------------------- | ------------------------------------------------------------------------- |
| Language              | Python                                                                    |
| Computer Vision       | OpenCV                                                                    |
| Hand Tracking         | MediaPipe                                                                 |
| ML Models             | SVC from Scikit-learn                                                     |
| Serialization         | Joblib                                                                    |
| Numerical Processing  | NumPy                                                                     |
| Backend Communication | HTTP Requests (use MQTT, WebSocket, etc. if bi-directional communication) |
| IoT Communication     | MQTT (through backend)                                                    |


## Project Structure

```text
ai_service/
├── data/                         # Dataset and training samples
│   
├── models/                       # Trained ML models
│   ├── gesture_model.pkl
│   └── label_encoder.pkl
│
├── utils/                        # Shared helper utilities
│   ├── mediapipe_utils.py
│   └── preprocessing.py
│
├── training/                     # Training scripts
│   ├── train.py
│   └── train.ipynb                   # Trained on Cloud, and then flash onto camera
│
├── inference/                    # Real-time AI inference
│   ├── gesture_infer.py
│   └── gesture_commit.py                    # Send to backend (currently use HTTP)
│
├── mqtt/                # Communication helpers (develop later...)
│   └── mqtt_publisher.py
│
├── data_collection/                       # Collect data for training
│   └── collect_gestures.pkl
│
├── requirements.txt
├── run.ps1
└── README.md
```

## Getting Started

- **Python 3.10 for running ai_service on camera**
- Webcam/ Camera
- Backend server running
- Adafruit IO account
- Supabase project

## Installation

### 1. Navigate to AI Service Folder

```powershell
cd ai_service
```

### 2. Create Virtual Environment

```powershell
py -3.10 -m venv ..\.venv
```

### 3. Activate Virtual Environment

```powershell
..\.venv\Scripts\Activate.ps1
```

### 4. Install Dependencies

```powershell
python -m pip install -r requirements.txt
```

## Running the AI Service

Real-Time Gesture Inference

```powershell
python -m inference.gesture_infer
```

The service will:

1. Open webcam
2. Detect hand gestures (+ Draw hand landmarks on frame)
3. Run ML inference
4. Send gestures to backend

Press `q` or `<Ctr-C>` (Window) to quite. Note that don't forget to click on the frame-capturing window (make it blue edge) to make key pressing recognizable.

## Training a New Gesture Model

### 1. Collect Dataset

```powershell
python -m training.collect_dataset
```

This records hand landmark samples.

### 2. Train Model

Train on local machine:

```powershell
python -m training.train_gesture_model
```

Generated files:

- `gesture_model.pkl`
- `label_encoder.pkl`

Train on Cloud (Colab, etc.): Using train.ipynb

## Performance Optimizations

### RAM-Based Mapping Cache

Gesture mappings are cached in RAM for low-latency execution.

### Consecutive Gesture Support

The inference pipeline supports repeated identical gestures with cooldown control.

### Lightweight Communication

Only prediction results are sent over the network instead of raw video streams.

## Troubleshooting

### MediaPipe Installation Issues

Install compatible versions:

```powershell
..\.venv\Scripts\Activate.ps1
pip install mediapipe==0.10.9
```

Python 3.14 may not yet support some ML packages. Recommended: Python 3.10

## Future Improvements

- WebSocket real-time streaming
- Multi-hand gesture recognition
- Gesture sequence recognition
- User-specific gesture profiles
- Edge TPU/ Raspberry Pi deployment
- Voice + Gesture multimodal control
- Real-time gesture visualization UI

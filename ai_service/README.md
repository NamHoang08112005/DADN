# The directory structure of the "Gesture to IoT" ai service is described as followed:

```python
project/
│
├── webapp/                # Your existing dashboard (frontend + backend)
│   ├── frontend/
│   ├── backend/
│   └── mqtt_client/
│
├── ai_service/            # NEW (gesture system lives here)
│   ├── data/              # dataset
│   ├── models/            # trained models (.pkl, .h5)
│   ├── training/
│   │   └── train.py
│   ├── inference/
│   │   └── gesture_infer.py
│   ├── utils/
│   │   ├── preprocessing.py
│   │   └── mediapipe_utils.py
│   └── mqtt/
│       └── publisher.py
│
├── iot_firmware/          # micro:bit / device code
│
└── config/
    └── mqtt_topics.json
```

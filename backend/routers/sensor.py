
from fastapi import APIRouter, Request
from adafruitConnection import get_aio, get_mqtt, AIO_FEED_IDS
from datetime import datetime

router = APIRouter(prefix="/sensor", tags=["Sensor"])

@router.get("/")
def get_sensor_status():
    return {"status": "sensor is working"}

# Route to get the latest temperature data
@router.get("/temp/latest")
async def get_latest_temp():
    try:
        aio = get_aio()
        latest_value = aio.receive(AIO_FEED_IDS[5])  # Fetch latest value
        return {
            "value": latest_value.value,
            "timestamp": latest_value.created_at
        }
    except Exception as e:
        return {"error": str(e)}

# Route to get historical temperature data - limit 1000 records
@router.get("/temp/history1000")
async def get_temp_history():
    try:
        aio = get_aio()
        history = aio.data(AIO_FEED_IDS[5], max_results=1000) 
        return [
            {"value": entry.value, "timestamp": entry.created_at} for entry in history
        ]
    except Exception as e:
        return {"error": str(e)}
    
# Route to get the latest light data
@router.get("/light/latest")
async def get_latest_light():
    try:
        aio = get_aio()
        latest_value = aio.receive(AIO_FEED_IDS[3])  # Fetch latest value
        return {
            "value": latest_value.value,
            "timestamp": latest_value.created_at
        }
    except Exception as e:
        return {"error": str(e)}

# Route to get historical light data - limit 1000 records  
@router.get("/light/history1000")
async def get_light_history():
    try:
        aio = get_aio()
        history = aio.data(AIO_FEED_IDS[3], max_results=1000)  # Get last 5 entries
        return [
            {"value": entry.value, "timestamp": entry.created_at} for entry in history
        ]
    except Exception as e:
        return {"error": str(e)}
    
# Route to get the latest humid data
@router.get("/humid/latest")
async def get_latest_humid():
    try:
        aio = get_aio()
        latest_value = aio.receive(AIO_FEED_IDS[2])  # Fetch latest value
        return {
            "value": latest_value.value,
            "timestamp": latest_value.created_at
        }
    except Exception as e:
        return {"error": str(e)}

# Route to get historical humid data - limit 1000 records  
@router.get("/humid/history1000")
async def get_humid_history():
    try:
        aio = get_aio()
        history = aio.data(AIO_FEED_IDS[2], max_results=1000)  # Get last 5 entries
        return [
            {"value": entry.value, "timestamp": entry.created_at} for entry in history
        ]
    except Exception as e:
        return {"error": str(e)}
    

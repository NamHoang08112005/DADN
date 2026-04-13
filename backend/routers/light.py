from fastapi import APIRouter
from adafruitConnection import get_aio, get_mqtt, AIO_FEED_IDS
from model import Color

router = APIRouter( prefix="/light", tags=["Light"])

@router.get("/")
def get_light_status():
    return {"status": "light is working"}

@router.post("/switch/on")
async def turn_on_light():
    try:
        mqtt_client = get_mqtt()
        print(f"Publishing 1 to {AIO_FEED_IDS[4]}")
        mqtt_client.publish( AIO_FEED_IDS[4] , 1)
        return { "message": "Success" }
    except Exception as e:
        return {"error": str(e)}
    
@router.post("/switch/off")
async def turn_off_light():
    try:
        mqtt_client = get_mqtt()
        print(f"Publishing 0 to {AIO_FEED_IDS[4]}")
        mqtt_client.publish( AIO_FEED_IDS[4] , 0)
        return { "message": "Success" }
    except Exception as e:
        return {"error": str(e)}
    
@router.post("/switch/colorchange")
async def change_color(data : Color):
    try:
        mqtt_client = get_mqtt()
        print(f"Publishing {data.code.value} to {AIO_FEED_IDS[0]}")
        mqtt_client.publish( AIO_FEED_IDS[0] , data.code.value)
        return { "message": "Success" }
    except Exception as e:
        return {"error": str(e)}

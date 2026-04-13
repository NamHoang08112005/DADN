from fastapi import APIRouter
from adafruitConnection import get_aio, get_mqtt, AIO_FEED_IDS
from model import FanSpeed

router = APIRouter(prefix="/fan", tags=["Fan"])

@router.get("/")
def get_fan_status():
    return {"status": "Fan is working"}

@router.post("/fan/off")
async def turn_off_fan():
    try:
        mqtt_client = get_mqtt()
        print(f"Publishing 0 to {AIO_FEED_IDS[1]}")
        mqtt_client.publish( AIO_FEED_IDS[1] , 0)
        return { "message": "Success" }
    except Exception as e:
        return {"error": str(e)}



@router.post("/fan/on")
async def turn_on_fan(data: FanSpeed):
    try:
        mqtt_client = get_mqtt()
        print(f"Publishing {data.speed} to {AIO_FEED_IDS[1]}")
        mqtt_client.publish(AIO_FEED_IDS[1], data.speed)
        return {"message": f"Fan turned on at speed {data.speed}"}
    except Exception as e:
        return {"error": str(e)}
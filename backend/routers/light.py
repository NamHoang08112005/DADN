from fastapi import APIRouter, Request
from adafruitConnection import get_aio, get_mqtt, AIO_FEED_IDS
from model import Color

router = APIRouter( prefix="/light", tags=["Light"])

@router.get("/")
def get_light_status():
    return {"status": "light is working"}

@router.post("/switch/on")
async def turn_on_light(request: Request):
    try:
        mqtt_client = get_mqtt()
        print(f"Publishing 1 to {AIO_FEED_IDS[4]}")
        mqtt_client.publish( AIO_FEED_IDS[4] , 1)

        with request.app.state.led_lock:
            request.app.state.current_led_state["is_on"] = True

        return { "message": "Success" }
    except Exception as e:
        return {"error": str(e)}
    
@router.post("/switch/off")
async def turn_off_light(request: Request):
    try:
        mqtt_client = get_mqtt()
        print(f"Publishing 0 to {AIO_FEED_IDS[4]}")
        mqtt_client.publish( AIO_FEED_IDS[4] , 0)

        with request.app.state.led_lock:
            request.app.state.current_led_state["is_on"] = False

        return { "message": "Success" }
    except Exception as e:
        return {"error": str(e)}
    
@router.post("/switch/colorchange")
async def change_color(data : Color, request: Request):
    try:
        mqtt_client = get_mqtt()
        print(f"Publishing {data.code.value} to {AIO_FEED_IDS[0]}")
        mqtt_client.publish( AIO_FEED_IDS[0] , data.code.value)

        with request.app.state.led_lock:
            request.app.state.current_led_state["color"] = {
                "name": data.code.name,
                "value": data.code.value
            }

        return { "message": "Success" }
    except Exception as e:
        return {"error": str(e)}

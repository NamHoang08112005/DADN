from fastapi import APIRouter, Request, Query

router = APIRouter(prefix="/activitylog", tags=["Activity Log"])

@router.get("/")
def get_activitylog_status():
    return {"status": "activities log is working"}

@router.post("/get1000")
async def get_activities_log(request : Request ):

    try:
        supabase = request.app.state.db
        result = supabase.table("devicestatelog").select("*").execute()
        return {"data": result.data}
    except Exception as e:
        return {"error": str(e)}

@router.get("/state")
def get_device_state(request: Request):
    return {
        "fan_speed": request.app.state.current_fan_speed,
        "light_on": request.app.state.current_led_state["is_on"],
        "color": request.app.state.current_led_state["color"]
    }

@router.get("/gestures")
async def get_gesture_logs(
    request: Request,
    limit: int = Query(20, le=100)
):
    """
    Get latest gesture logs (simple version)
    """
    try:
        supabase = request.app.state.db

        result = (
            supabase
            .table("gesturelog")
            .select("*")
            .order("timestamp", desc=True)
            .limit(limit)
            .execute()
        )

        return {"data": result.data}

    except Exception as e:
        return {"error": str(e)}

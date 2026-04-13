from fastapi import APIRouter, Request

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
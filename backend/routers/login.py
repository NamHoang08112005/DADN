from fastapi import APIRouter, Request
from model import login_info, register_info

router = APIRouter(prefix="/login", tags=["Login"])


def _friendly_db_error(error: Exception) -> str:
    message = str(error)
    lowered = message.lower()
    if "getaddrinfo failed" in lowered or "name or service not known" in lowered or "temporary failure in name resolution" in lowered:
        return "Database service is unreachable (DNS/network issue). Please check your internet or DNS settings and try again."
    if "timed out" in lowered or "timeout" in lowered:
        return "Database request timed out. Please try again in a moment."
    return message


@router.get("/")
def get_login_status():
    return {"status": "login is working"}


@router.post("/authentication")
async def check_authentication(request: Request, data: login_info):
    try:
        supabase = request.app.state.db
        if supabase is None:
            return {"error": "Database connection is not available"}

        result = supabase.table("users").select("*") \
            .eq("username", data.username) \
            .eq("pass", data.password) \
            .execute()

        if result.data != []:
            return {"message": "Login successful", "user": result.data[0]}

        return {"message": "Invalid username or password"}
    except Exception as e:
        return {"error": _friendly_db_error(e)}


@router.post("/register")
async def register_new_account(request: Request, data: register_info):
    try:
        supabase = request.app.state.db
        if supabase is None:
            return {"error": "Database connection is not available"}

        existing_user = supabase.table("users").select("User_Id") \
            .eq("username", data.username) \
            .execute()

        if existing_user.data:
            return {"error": "Username already exists"}

        supabase.table("users").insert({
            "username": data.username,
            "pass": data.password,
            "email": data.email,
            "date_of_birth": data.date_of_birth.isoformat(),
            "social_security_number": data.SSN,
        }).execute()

        return {"message": "success"}
    except Exception as e:
        if "23505" in str(e) or "duplicate" in str(e).lower():
            return {"error": "Username already exists"}

        return {"error": _friendly_db_error(e)}

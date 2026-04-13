from fastapi import APIRouter, Request
from model import login_info, register_info
from datetime import datetime
from pathlib import Path
import json
from threading import Lock

router = APIRouter(prefix="/login", tags=["Login"])
LOCAL_USERS_FILE = Path(__file__).resolve().parents[1] / "local_users.json"
LOCAL_USERS_LOCK = Lock()


def _friendly_db_error(error: Exception) -> str:
    message = str(error)
    lowered = message.lower()
    if "getaddrinfo failed" in lowered or "name or service not known" in lowered or "temporary failure in name resolution" in lowered:
        return "Database service is unreachable (DNS/network issue). Please check your internet or DNS settings and try again."
    if "timed out" in lowered or "timeout" in lowered:
        return "Database request timed out. Please try again in a moment."
    return message


def _should_use_local_fallback(error: Exception) -> bool:
    lowered = str(error).lower()
    return (
        "getaddrinfo failed" in lowered
        or "name or service not known" in lowered
        or "temporary failure in name resolution" in lowered
        or "timed out" in lowered
        or "timeout" in lowered
    )


def _read_local_users() -> list[dict]:
    if not LOCAL_USERS_FILE.exists():
        return []

    try:
        with LOCAL_USERS_FILE.open("r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, list) else []
    except Exception:
        return []


def _write_local_users(users: list[dict]) -> None:
    with LOCAL_USERS_FILE.open("w", encoding="utf-8") as f:
        json.dump(users, f, ensure_ascii=True, indent=2)


def _find_local_user(username: str, password: str | None = None) -> dict | None:
    users = _read_local_users()
    for user in users:
        if user.get("username") == username and (password is None or user.get("pass") == password):
            return user
    return None


def _register_local_user(username: str, password: str, email: str, dob: str, ssn: str) -> None:
    with LOCAL_USERS_LOCK:
        users = _read_local_users()
        for user in users:
            if user.get("username") == username:
                raise ValueError("Username already exists")

        next_id = 1 if not users else max(int(user.get("User_Id", 0)) for user in users) + 1
        users.append(
            {
                "User_Id": next_id,
                "username": username,
                "pass": password,
                "email": email,
                "date_of_birth": dob,
                "social_security_number": ssn,
                "source": "local-fallback",
            }
        )
        _write_local_users(users)

@router.get("/")
def get_login_status():
    return {"status": "login is working"}

@router.post("/authentication")
async def check_authentication(request : Request, data: login_info ):
    try:
        username = data.username
        password = data.password
        supabase = request.app.state.db
        if supabase is None:
            local_user = _find_local_user(username, password)
            if local_user is not None:
                return {"message": "Login successful", "user": local_user}
            return {"message": "Invalid username or password"}

        result = supabase.table("users").select("*")\
                .eq("username", username)\
                .eq("pass", password)\
                .execute()

        if result.data != []:
            return {"message": "Login successful", "user": result.data[0]}
        else:
            return {"message": "Invalid username or password"}
    except Exception as e:
        if _should_use_local_fallback(e):
            local_user = _find_local_user(data.username, data.password)
            if local_user is not None:
                return {"message": "Login successful", "user": local_user}
            return {"message": "Invalid username or password"}
        return {"error": _friendly_db_error(e)}
    
@router.post("/register")
async def register_new_account(request : Request, data: register_info ):
    try:
        username = data.username
        password = data.password
        email = data.email
        dob = data.date_of_birth.isoformat()
        ssn = data.SSN
        supabase = request.app.state.db
        if supabase is None:
            _register_local_user(username, password, email, dob, ssn)
            return {"message" : "success"}

        supabase.table("users").insert({"username" : username, 
                                        "pass" : password, 
                                        "email" : email, 
                                        "date_of_birth" : dob, 
                                        "social_security_number" : ssn})\
                                .execute()
        return {"message" : "success"}
    except Exception as e:
        if "23505" in str(e):
            return {"error": "Username already exists"}

        if _should_use_local_fallback(e):
            try:
                _register_local_user(username, password, email, dob, ssn)
                return {"message" : "success"}
            except ValueError:
                return {"error": "Username already exists"}

        return {"error": _friendly_db_error(e)}

# @router.get("/items/")
# def read_items(request: Request):
#     cursor = request.app.state.db.cursor()
#     cursor.execute("SELECT * FROM items")
#     results = cursor.fetchall()
#     cursor.close()
#     return results

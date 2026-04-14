from fastapi import APIRouter, Request
from model import login_info, register_info
from datetime import datetime, timezone

router = APIRouter(prefix="/login", tags=["Login"])

VECTOR_COLUMN_CANDIDATES = [
    "face_vector",
    "face_embedding",
    "embedding",
    "vector",
]


def _friendly_db_error(error: Exception) -> str:
    message = str(error)
    lowered = message.lower()
    if "getaddrinfo failed" in lowered or "name or service not known" in lowered or "temporary failure in name resolution" in lowered:
        return "Database service is unreachable (DNS/network issue). Please check your internet or DNS settings and try again."
    if "timed out" in lowered or "timeout" in lowered:
        return "Database request timed out. Please try again in a moment."
    return message


def _fetch_user_vectors(supabase):
    # Try common vector column names to support minor schema variations.
    for vector_col in VECTOR_COLUMN_CANDIDATES:
        try:
            result = supabase.table("users").select(f"User_Id,{vector_col}").execute()
            data = [
                {
                    "User_Id": row.get("User_Id"),
                    "vector": row.get(vector_col),
                }
                for row in (result.data or [])
            ]
            return {"vector_column": vector_col, "users": data}
        except Exception:
            continue

    raise ValueError(
        "No supported vector column found in users table. Tried: "
        + ", ".join(VECTOR_COLUMN_CANDIDATES)
    )


def refresh_user_vector_cache(app, supabase=None):
    if supabase is None:
        supabase = app.state.db

    result = _fetch_user_vectors(supabase)
    app.state.user_vectors_cache = result["users"]
    app.state.user_vectors_column = result["vector_column"]
    app.state.user_vectors_loaded_at = datetime.now(timezone.utc).isoformat()
    return result


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


@router.get("/user-vectors")
async def get_all_user_vectors(request: Request):
    try:
        app = request.app
        supabase = app.state.db
        if supabase is None:
            return {"error": "Database connection is not available"}

        cache = getattr(app.state, "user_vectors_cache", None)
        cache_col = getattr(app.state, "user_vectors_column", None)
        loaded_at = getattr(app.state, "user_vectors_loaded_at", None)

        if cache is None or cache_col is None:
            result = refresh_user_vector_cache(app, supabase)
            cache = result["users"]
            cache_col = result["vector_column"]
            loaded_at = getattr(app.state, "user_vectors_loaded_at", None)

        return {
            "message": "Fetch successful (from RAM cache)",
            "vector_column": cache_col,
            "total": len(cache),
            "loaded_at": loaded_at,
            "data": cache,
        }
    except ValueError as e:
        return {"error": str(e)}
    except Exception as e:
        return {"error": _friendly_db_error(e)}


@router.post("/user-vectors/reload")
async def reload_user_vectors_cache(request: Request):
    try:
        app = request.app
        supabase = app.state.db
        if supabase is None:
            return {"error": "Database connection is not available"}

        result = refresh_user_vector_cache(app, supabase)
        return {
            "message": "Reload successful",
            "vector_column": result["vector_column"],
            "total": len(result["users"]),
            "loaded_at": app.state.user_vectors_loaded_at,
        }
    except ValueError as e:
        return {"error": str(e)}
    except Exception as e:
        return {"error": _friendly_db_error(e)}

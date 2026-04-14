from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from model import login_info, register_info
from datetime import datetime, timezone
from io import BytesIO
import json

import faiss
import numpy as np
from facenet_pytorch import InceptionResnetV1, MTCNN
from PIL import Image
import torch

router = APIRouter(prefix="/login", tags=["Login"])

VECTOR_COLUMN_CANDIDATES = [
    "face_vector",
    "face_embedding",
    "embedding",
    "vector",
]

FACE_EMBEDDING_SIZE = 512
FACE_MATCH_DISTANCE_THRESHOLD = 0.9

_FACE_MODEL = None
_FACE_MTCNN = None


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


def _get_face_models():
    global _FACE_MODEL, _FACE_MTCNN

    if _FACE_MTCNN is None:
        _FACE_MTCNN = MTCNN(
            image_size=160,
            margin=0,
            select_largest=True,
            post_process=True,
            device="cpu",
        )

    if _FACE_MODEL is None:
        _FACE_MODEL = InceptionResnetV1(pretrained="vggface2").eval()

    return _FACE_MTCNN, _FACE_MODEL


def _normalize_vector(raw_vector):
    if isinstance(raw_vector, str):
        try:
            raw_vector = json.loads(raw_vector)
        except Exception:
            return None

    if not isinstance(raw_vector, list):
        return None

    try:
        vector = np.asarray(raw_vector, dtype=np.float32)
    except Exception:
        return None

    if vector.ndim != 1 or vector.size != FACE_EMBEDDING_SIZE:
        return None

    return vector


def _extract_face_embedding(image_bytes: bytes) -> np.ndarray:
    mtcnn, model = _get_face_models()

    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    face_tensor = mtcnn(image)
    if face_tensor is None:
        raise ValueError("No face detected in the uploaded image.")

    with torch.no_grad():
        embedding = model(face_tensor.unsqueeze(0)).squeeze(0).cpu().numpy().astype(np.float32)

    if embedding.size != FACE_EMBEDDING_SIZE:
        raise ValueError("Unexpected FaceNet embedding size.")

    embedding = np.ascontiguousarray(embedding.reshape(1, FACE_EMBEDDING_SIZE), dtype=np.float32)
    faiss.normalize_L2(embedding)
    return embedding[0]


def _build_faiss_index(user_rows):
    vectors = []
    metadata = []

    for row in user_rows:
        vector = _normalize_vector(row.get("vector"))
        if vector is None:
            continue

        vectors.append(vector)
        metadata.append(row)

    if not vectors:
        raise ValueError("No face vectors available in the database.")

    matrix = np.ascontiguousarray(np.stack(vectors), dtype=np.float32)
    faiss.normalize_L2(matrix)

    index = faiss.IndexFlatL2(FACE_EMBEDDING_SIZE)
    index.add(matrix)
    return index, metadata


def _resolve_vector_column(app, supabase):
    cache_col = getattr(app.state, "user_vectors_column", None)
    if cache_col:
        return cache_col

    result = _fetch_user_vectors(supabase)
    app.state.user_vectors_cache = result["users"]
    app.state.user_vectors_column = result["vector_column"]
    app.state.user_vectors_loaded_at = datetime.now(timezone.utc).isoformat()
    return result["vector_column"]


@router.get("/")
def get_login_status():
    return {"status": "login is working"}


@router.post("/face-login")
async def face_login(request: Request, image: UploadFile = File(...)):
    try:
        supabase = request.app.state.db
        if supabase is None:
            raise HTTPException(status_code=503, detail="Database connection is not available")

        image_bytes = await image.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Empty image payload")

        embedding = _extract_face_embedding(image_bytes)

        cache = getattr(request.app.state, "user_vectors_cache", None)
        cache_col = getattr(request.app.state, "user_vectors_column", None)

        if cache is None or cache_col is None:
            result = refresh_user_vector_cache(request.app, supabase)
            cache = result["users"]
            cache_col = result["vector_column"]

        index, metadata = _build_faiss_index(cache)
        query = np.ascontiguousarray(embedding.reshape(1, FACE_EMBEDDING_SIZE), dtype=np.float32)
        faiss.normalize_L2(query)

        distances, indices = index.search(query, 1)
        best_distance = float(distances[0][0]) if distances.size else None
        best_index = int(indices[0][0]) if indices.size else -1

        if best_index < 0 or best_distance is None:
            return {
                "authenticated": False,
                "reason": "no_match",
                "message": "No matching user found",
                "vector_column": cache_col,
                "embedding_size": FACE_EMBEDDING_SIZE,
                "embedding": embedding.tolist(),
            }

        matched_user = metadata[best_index]
        matched_user_id = matched_user.get("User_Id")
        authenticated = best_distance <= FACE_MATCH_DISTANCE_THRESHOLD

        matched_user_profile = None
        if matched_user_id is not None:
            try:
                user_result = supabase.table("users").select("*") \
                    .eq("User_Id", matched_user_id) \
                    .limit(1) \
                    .execute()
                if user_result.data:
                    matched_user_profile = user_result.data[0]
            except Exception:
                matched_user_profile = None

        stored_to_db = False
        if authenticated and matched_user_id is not None:
            try:
                supabase.table("users").update({cache_col: embedding.tolist()}) \
                    .eq("User_Id", matched_user_id) \
                    .execute()
                stored_to_db = True
                refresh_user_vector_cache(request.app, supabase)
            except Exception:
                stored_to_db = False

        return {
            "authenticated": authenticated,
            "reason": "matched" if authenticated else "distance_above_threshold",
            "matched_user_id": matched_user_id,
            "matched_name": matched_user.get("Name"),
            "user": matched_user_profile,
            "distance_score": best_distance,
            "threshold": FACE_MATCH_DISTANCE_THRESHOLD,
            "vector_column": cache_col,
            "embedding_size": FACE_EMBEDDING_SIZE,
            "embedding": embedding.tolist(),
            "stored_to_db": stored_to_db,
            "message": (
                "Đã xác thực"
                if authenticated
                else f"Khuon mat chua khop (distance={best_distance:.4f}, threshold={FACE_MATCH_DISTANCE_THRESHOLD:.4f})"
            ),
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=_friendly_db_error(e))


@router.post("/face-enroll")
async def face_enroll(
    request: Request,
    image: UploadFile = File(...),
    user_id: int = Form(...),
):
    try:
        supabase = request.app.state.db
        if supabase is None:
            raise HTTPException(status_code=503, detail="Database connection is not available")

        image_bytes = await image.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Empty image payload")

        embedding = _extract_face_embedding(image_bytes)
        cache_col = _resolve_vector_column(request.app, supabase)

        result = supabase.table("users").update({cache_col: embedding.tolist()}) \
            .eq("User_Id", user_id) \
            .execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="User not found or update was blocked")

        refresh_user_vector_cache(request.app, supabase)

        return {
            "saved": True,
            "user_id": user_id,
            "vector_column": cache_col,
            "embedding_size": FACE_EMBEDDING_SIZE,
            "embedding": embedding.tolist(),
            "message": "Da them du lieu FaceID thanh cong",
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=_friendly_db_error(e))


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

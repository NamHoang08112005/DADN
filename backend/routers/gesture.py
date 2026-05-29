from datetime import *
from fastapi import APIRouter, Request, HTTPException
from adafruitConnection import get_mqtt, AIO_FEED_IDS
from typing import List, Optional
from pydantic import BaseModel, Field
from model import GestureMappingCreate, GestureMappingUpdate
from datetime import datetime


router = APIRouter(prefix="/gesture", tags=["Gesture"])

CONFIDENCE_THRESHOLD = 0.7
MIN_SPEED = 0
MAX_SPEED = 100
SPEED_INCREMENT = 10 


def refresh_gesture_mapping_cache(app, supabase):
    try:
        result = supabase.table("gesture_mapping") \
            .select("*") \
            .eq("is_active", True) \
            .execute()

        mapping_dict = {}

        for row in result.data:
            gesture = row["gesture_name"]

            if gesture not in mapping_dict:
                mapping_dict[gesture] = []

            mapping_dict[gesture].append({
                "action_type": row["action_type"],
                "action_value": row["action_value"]
            })

        # Thread-safe update 
        with app.state.gesture_mapping_lock:
            app.state.gesture_mapping_cache = mapping_dict
            app.state.gesture_mapping_loaded_at = datetime.now()

        print(f"✅ Loaded {len(mapping_dict)} gesture mappings into RAM")

        return { "message": "Cache refreshed", "total_gestures": len(mapping_dict) }

    except Exception as e:
        print(f"❌ Failed to load gesture mappings: {e}")


@router.post("/execute")
async def execute_gesture(data: dict, request: Request):
    """
    Receive gesture from edge device and execute mapped actions.
    """
    gesture = data.get("gesture")
    confidence = data.get("confidence")

    if not gesture:
        return {"error": "Missing gesture"}

    if confidence is None or confidence < CONFIDENCE_THRESHOLD:
        return {"message": "Ignored low-confidence gesture"}

    # Get mapping from RAM cache
    # mapping_cache = { gesture_name: { action_type:text action_value:int. } }
    mapping_cache = request.app.state.gesture_mapping_cache
    actions = mapping_cache.get(gesture)

    if not actions:
        return {"message": f"No mapping found for gesture: {gesture}"}

    mqtt_client = get_mqtt()

    try:
        # After validation passes
        timestamp = datetime.utcnow().isoformat()

        #await request.app.state.ws_manager.broadcast({
        #    "type": "gesture_log",
        #    "gesture": gesture,
        #    "confidence": confidence,
        #    "timestamp": timestamp,
        #    "status": "processing"
        #})

        executed_actions = list()

        for action in actions:
            action_type = action.get("action_type")
            value = action.get("action_value")

            # ==============================
            # FAN CONTROL
            # ==============================
            if action_type == "fan_on":
                speed = value if value is not None else 50 
                print(f"[GESTURE] Fan ON -> {speed}") 
                mqtt_client.publish(AIO_FEED_IDS[1], speed)

                await request.app.state.ws_manager.broadcast({
                    "type": "fan_update",
                    "speed": speed
                })

                # ✅ Update state
                with request.app.state.fan_speed_lock:
                    request.app.state.current_fan_speed = speed

                executed_actions.append({
                    "action": "fan_on",
                    "value": speed
                })

            elif action_type == "fan_off":
                with request.app.state.fan_speed_lock:
                    request.app.state.current_fan_speed = 0
                print("[GESTURE] Fan OFF")
                mqtt_client.publish(AIO_FEED_IDS[1], 0)

                await request.app.state.ws_manager.broadcast({
                    "type": "fan_update",
                    "speed": 0
                })

                with request.app.state.fan_speed_lock:
                    request.app.state.current_fan_speed = 0

                executed_actions.append({
                    "action": "fan_off",
                    "value": 0
                })

            elif action_type == "fan_speed_up":
                with request.app.state.fan_speed_lock:
                    current = request.app.state.current_fan_speed
                    new_speed = min(current + SPEED_INCREMENT, MAX_SPEED)
                    request.app.state.current_fan_speed = new_speed

                print(f"[GESTURE] Fan speed UP -> {new_speed}")
                mqtt_client.publish(AIO_FEED_IDS[1], new_speed)

                await request.app.state.ws_manager.broadcast({
                    "type": "fan_update",
                    "speed": new_speed
                })

                with request.app.state.fan_speed_lock:
                    request.app.state.current_fan_speed = new_speed

                executed_actions.append({
                    "action": "fan_speed_up",
                    "value": new_speed
                })

            elif action_type == "fan_speed_down":
                with request.app.state.fan_speed_lock:
                    current = request.app.state.current_fan_speed
                    new_speed = max(current - SPEED_INCREMENT, MIN_SPEED)
                    request.app.state.current_fan_speed = new_speed

                print(f"[GESTURE] Fan speed DOWN -> {new_speed}")
                mqtt_client.publish(AIO_FEED_IDS[1], new_speed)

                await request.app.state.ws_manager.broadcast({
                    "type": "fan_update",
                    "speed": new_speed
                })

                with request.app.state.fan_speed_lock:
                    request.app.state.current_fan_speed = new_speed

                executed_actions.append({
                    "action": "fan_speed_down",
                    "value": new_speed
                })

            # ==============================
            # LIGHT CONTROL
            # ==============================
            elif action_type == "light_on":
                print("[GESTURE] Light ON")
                mqtt_client.publish(AIO_FEED_IDS[4], 1)

                await request.app.state.ws_manager.broadcast({
                    "type": "led_update",
                    "is_on": True
                })

                with request.app.state.led_lock:
                    request.app.state.current_led_state["is_on"] = True

                executed_actions.append({
                    "action": "light_on",
                    "value": True
                })

            elif action_type == "light_off":
                print("[GESTURE] Light OFF")
                mqtt_client.publish(AIO_FEED_IDS[4], 0)

                await request.app.state.ws_manager.broadcast({
                    "type": "led_update",
                    "is_on": False
                })

                with request.app.state.led_lock:
                    request.app.state.current_led_state["is_on"] = False

                executed_actions.append({
                    "action": "light_off",
                    "value": False
                })

            elif action_type == "color_change":
                if value:
                    print(f"[GESTURE] Color -> {value}")
                    mqtt_client.publish(AIO_FEED_IDS[0], value)

        await request.app.state.ws_manager.broadcast({
            "type": "gesture_log",
            "gesture": gesture,
            "confidence": confidence,
            "actions": executed_actions,
            "timestamp": timestamp,
            "status": "executed"
        })

        await request.app.state.db.table("gesturelog").insert({
            "gesture": gesture,
            "confidence": confidence,
            "actions": executed_actions,
            "status": "executed",
            "timestamp": timestamp
        }).execute()

        return {
            "message": "Executed",
            "gesture": gesture,
            "actions_executed": len(actions)
        }

    except Exception as e:
        return {"error": f"Sending commands to devices failed: {str(e)}"}


# Get all mappings
@router.get("/gesture-mapping")
def get_all_mappings(request: Request):
    try:
        supabase = request.app.state.db

        result = supabase.table("gesture_mapping") \
            .select("*") \
            .execute()

        return {"data": result.data}

    except Exception as e:
        return {"error": str(e)}


# Create new mappings
@router.post("/gesture-mapping")
def create_mapping(data: GestureMappingCreate, request: Request):
    try:
        supabase = request.app.state.db

        payload = {
            "gesture_name": data.gesture_name,
            "action_type": data.action_type,
            "action_value": data.action_value,
            "is_active": data.is_active,
        }

        result = supabase.table("gesture_mapping") \
            .insert(payload) \
            .execute()

        refresh_gesture_mapping_cache(request.app, request.app.state.db)

        return {
            "message": "Mapping created",
            "data": result.data
        }

    except Exception as e:
        return {"error": str(e)}


# Update mappings
@router.put("/gesture-mapping/{mapping_id}")
def update_mapping(data: GestureMappingUpdate, request: Request):
    try:
        supabase = request.app.state.db

        update_data = {}

        if data.gesture_name is not None:
            update_data["gesture_name"] = data.gesture_name
        if data.action_type is not None:
            update_data["action_type"] = data.action_type
        if data.action_value is not None:
            update_data["action_value"] = data.action_value
        if data.is_active is not None:
            update_data["is_active"] = data.is_active

        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        result = supabase.table("gesture_mapping") \
            .update(update_data) \
            .eq("id", data.id) \
            .execute()

        refresh_gesture_mapping_cache(request.app, request.app.state.db)

        return {
            "message": "Mapping updated",
            "data": result.data
        }

    except Exception as e:
        return {"error": str(e)}

# Delete mappings
@router.delete("/gesture-mapping/{mapping_id}")
def delete_mapping(mapping_id: str, request: Request):
    try:
        supabase = request.app.state.db

        result = supabase.table("gesture_mapping") \
            .delete() \
            .eq("id", mapping_id) \
            .execute()

        refresh_gesture_mapping_cache(request.app, request.app.state.db)

        return {
            "message": "Mapping deleted",
            "data": result.data
        }

    except Exception as e:
        return {"error": str(e)}

# Refresh cache manually
@router.post("/gesture-mapping/reload")
def reload_mapping(request: Request):
    return refresh_gesture_mapping_cache(
        request.app,
        request.app.state.db
    )

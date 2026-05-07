from collections import defaultdict, deque
from dataclasses import dataclass, field
import math
import random
import time

import cv2
from ultralytics import YOLO

from services.fall_detection.fall_config import (
    DETECTION_CONFIDENCE,
    DETECTION_IMAGE_SIZE,
    FALL_ANGLE_SPEED_DEG_PER_SEC,
    FALL_ASPECT_RATIO,
    FALL_BOX_ONLY_ASPECT_RATIO,
    FALL_CENTER_DROP_RATIO,
    FALL_CONFIRM_SECONDS,
    FALL_EDGE_MARGIN_RATIO,
    FALL_HEIGHT_DROP_RATIO,
    FALL_HISTORY_SECONDS,
    FALL_OUT_OF_FRAME_SECONDS,
    FALL_RECOVERY_SECONDS,
    FALL_STILLNESS_CENTER_RATIO,
    FALL_STILLNESS_SECONDS,
    FALL_TORSO_ANGLE_DEGREES,
    MIN_KEYPOINT_CONFIDENCE,
    MODEL_PATH,
    PERSON_CLASS_ID,
    SMOOTHING_ALPHA,
    STATIC_LYING_SECONDS,
    TARGET_LOST_SECONDS,
    YOLO_MAX_DETECTIONS,
)


@dataclass
class FallTrackState:
    history: deque = field(default_factory=deque)
    lying_since: float | None = None
    confirmed_since: float | None = None
    still_since: float | None = None
    fall_candidate_since: float | None = None
    last_seen: float = 0.0
    is_fallen: bool = False


class YoloDetector:
    def __init__(self, model_name=MODEL_PATH):
        print("Loading YOLO pose model...")
        self.model = YOLO(model_name)

        self.smooth_x = None
        self.smooth_y = None
        self.alpha = SMOOTHING_ALPHA

        self.last_target_box = None
        self.last_target_kpts = None
        self.last_target_status = self._empty_fall_status()
        self.last_all_statuses = []
        self.active_target_id = None
        self.active_state_id = None

        self.id_colors = {}
        self.fall_states = defaultdict(FallTrackState)

        self.SKELETON_CONNECTIONS = [
            (0, 1), (0, 2), (1, 3), (2, 4),
            (5, 6), (5, 11), (6, 12), (11, 12),
            (5, 7), (7, 9),
            (6, 8), (8, 10),
            (11, 13), (13, 15),
            (12, 14), (14, 16),
        ]

        print("Model loaded.")

    def _empty_fall_status(self):
        return {
            "is_fallen": False,
            "track_id": None,
            "reason": "no_target",
            "angle": None,
            "aspect_ratio": None,
            "angle_speed": 0.0,
            "height_drop_ratio": 0.0,
            "center_drop_ratio": 0.0,
            "keypoint_quality": 0.0,
            "lying": False,
            "still": False,
            "near_edge": False,
            "recent_motion_ratio": 0.0,
            "evidence": "none",
        }

    def get_color_for_id(self, track_id):
        if track_id not in self.id_colors:
            self.id_colors[track_id] = (
                random.randint(50, 255),
                random.randint(50, 255),
                random.randint(50, 255),
            )
        return self.id_colors[track_id]

    def detect(self, frame):
        results = self.model.track(
            frame,
            persist=True,
            classes=[PERSON_CLASS_ID],
            conf=DETECTION_CONFIDENCE,
            imgsz=DETECTION_IMAGE_SIZE,
            max_det=YOLO_MAX_DETECTIONS,
            verbose=False,
        )

        detections = self._extract_detections(results[0])
        for detection in detections:
            detection["frame_shape"] = frame.shape
        now = time.time()
        self._drop_stale_fall_states(now)

        statuses = []
        for detection in detections:
            status = self._update_fall_status(detection, now)
            detection["fall_status"] = status
            statuses.append(status)
            self._draw_detection(frame, detection)
            self._draw_fall_label(frame, detection, status)

        target = self._select_target(detections)
        if target is None:
            lost_status = self._lost_target_status(now)
            lost_x = self.smooth_x if lost_status["is_fallen"] else None
            lost_y = self.smooth_y if lost_status["is_fallen"] else None
            self.smooth_x = lost_x
            self.smooth_y = lost_y
            self.last_target_box = None
            self.last_target_kpts = None
            self.last_target_status = lost_status
            self.last_all_statuses = []
            if not lost_status["is_fallen"]:
                self.active_target_id = None
                self.active_state_id = None
            return frame, lost_x, lost_y, self.last_target_status

        x1, y1, x2, y2 = target["box"]
        raw_cx = (x1 + x2) // 2
        raw_cy = (y1 + y2) // 2

        if self.smooth_x is None:
            self.smooth_x, self.smooth_y = raw_cx, raw_cy
        else:
            self.smooth_x = int(self.alpha * raw_cx + (1 - self.alpha) * self.smooth_x)
            self.smooth_y = int(self.alpha * raw_cy + (1 - self.alpha) * self.smooth_y)

        cv2.circle(frame, (self.smooth_x, self.smooth_y), 6, (0, 0, 255), -1)

        self.last_target_box = target["box"]
        self.last_target_kpts = target["keypoints"]
        self.active_target_id = target["track_id"]
        self.active_state_id = target["state_id"]
        target_status = target.get("fall_status", self._empty_fall_status())
        alert_status = next((status for status in statuses if status["is_fallen"]), target_status)
        self.last_target_status = alert_status
        self.last_all_statuses = statuses
        self._draw_fall_debug(frame, target, alert_status)

        return frame, self.smooth_x, self.smooth_y, self.last_target_status

    def _extract_detections(self, result):
        if result.boxes is None or len(result.boxes) == 0:
            return []

        boxes = result.boxes.xyxy.int().cpu().tolist()
        track_ids = [None] * len(boxes)
        if result.boxes.id is not None:
            track_ids = result.boxes.id.int().cpu().tolist()

        keypoints = [[] for _ in boxes]
        keypoint_conf = [[] for _ in boxes]
        if result.keypoints is not None and result.keypoints.xy is not None:
            keypoints = result.keypoints.xy.int().cpu().tolist()
            if result.keypoints.conf is not None:
                keypoint_conf = result.keypoints.conf.cpu().tolist()
            else:
                keypoint_conf = [[1.0 for _ in person] for person in keypoints]

        detections = []
        for index, box in enumerate(boxes):
            x1, y1, x2, y2 = box
            width = max(0, x2 - x1)
            height = max(0, y2 - y1)
            track_id = track_ids[index] if index < len(track_ids) else None
            detections.append({
                "box": (x1, y1, x2, y2),
                "track_id": track_id,
                "state_id": track_id if track_id is not None else f"untracked_{index}",
                "keypoints": keypoints[index] if index < len(keypoints) else [],
                "keypoint_conf": keypoint_conf[index] if index < len(keypoint_conf) else [],
                "area": width * height,
            })
        return detections

    def _select_target(self, detections):
        if not detections:
            return None

        if self.active_target_id is not None:
            for detection in detections:
                if detection["track_id"] == self.active_target_id:
                    return detection

        return max(detections, key=lambda item: item["area"])

    def _draw_detection(self, frame, detection):
        x1, y1, x2, y2 = detection["box"]
        track_id = detection["track_id"]
        color_key = track_id if track_id is not None else detection["state_id"]
        color = self.get_color_for_id(color_key)

        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        label = f"ID: {track_id}" if track_id is not None else "ID: pending"
        cv2.putText(frame, label, (x1, max(20, y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

        kpts = detection["keypoints"]
        kpt_conf = detection["keypoint_conf"]
        for idx, kp in enumerate(kpts):
            if self._valid_keypoint(kpts, kpt_conf, idx):
                cv2.circle(frame, (kp[0], kp[1]), 4, color, -1)

        for kp_a_idx, kp_b_idx in self.SKELETON_CONNECTIONS:
            if self._valid_keypoint(kpts, kpt_conf, kp_a_idx) and self._valid_keypoint(kpts, kpt_conf, kp_b_idx):
                kp_a = kpts[kp_a_idx]
                kp_b = kpts[kp_b_idx]
                cv2.line(frame, (kp_a[0], kp_a[1]), (kp_b[0], kp_b[1]), color, 2)

    def _draw_fall_label(self, frame, target, status):
        x1, y1, _, _ = target["box"]
        if status["is_fallen"]:
            cv2.putText(
                frame,
                "FALL",
                (x1, y1 + 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.0,
                (0, 0, 255),
                3,
            )

    def _draw_fall_debug(self, frame, target, status):
        angle = "--" if status["angle"] is None else f"{status['angle']:.0f}"
        debug_text = (
            f"angle:{angle} ar:{status['aspect_ratio']:.2f} "
            f"drop:{status['height_drop_ratio']:.2f}/{status['center_drop_ratio']:.2f} "
            f"ev:{status['evidence']}"
        )
        cv2.putText(frame, debug_text, (20, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 0), 2)

    def _update_fall_status(self, target, now):
        box = target["box"]
        kpts = target["keypoints"]
        kpt_conf = target["keypoint_conf"]
        x1, y1, x2, y2 = box
        frame_height, frame_width = target["frame_shape"][:2]
        width = max(1, x2 - x1)
        height = max(1, y2 - y1)
        center_x = (x1 + x2) / 2.0
        center_y = (y1 + y2) / 2.0
        aspect_ratio = width / height
        angle = self._torso_angle(kpts, kpt_conf)
        keypoint_quality = self._core_keypoint_quality(kpts, kpt_conf)

        state = self.fall_states[target["state_id"]]
        state.last_seen = now

        sample = {
            "time": now,
            "angle": angle,
            "height": height,
            "center_x": center_x,
            "center_y": center_y,
            "aspect_ratio": aspect_ratio,
        }
        state.history.append(sample)
        while state.history and now - state.history[0]["time"] > FALL_HISTORY_SECONDS:
            state.history.popleft()

        angle_speed = 0.0
        height_drop_ratio = 0.0
        center_drop_ratio = 0.0
        recent_motion_ratio = 0.0
        if len(state.history) >= 2:
            oldest = state.history[0]
            delta_time = max(0.001, sample["time"] - oldest["time"])
            if angle is not None and oldest["angle"] is not None:
                angle_speed = abs(angle - oldest["angle"]) / delta_time
            height_drop_ratio = (oldest["height"] - height) / max(1.0, oldest["height"])
            center_drop_ratio = (center_y - oldest["center_y"]) / max(1.0, oldest["height"])
            recent = [
                item
                for item in state.history
                if now - item["time"] <= FALL_STILLNESS_SECONDS
            ]
            if len(recent) >= 2:
                base = max(1.0, width, height)
                motion = [
                    math.hypot(item["center_x"] - center_x, item["center_y"] - center_y) / base
                    for item in recent[:-1]
                ]
                recent_motion_ratio = max(motion) if motion else 0.0

        sudden_motion = (
            angle_speed >= FALL_ANGLE_SPEED_DEG_PER_SEC
            or height_drop_ratio >= FALL_HEIGHT_DROP_RATIO
            or center_drop_ratio >= FALL_CENTER_DROP_RATIO
        )
        lying_by_pose = angle is not None and angle >= FALL_TORSO_ANGLE_DEGREES
        lying_by_strong_box = aspect_ratio >= FALL_BOX_ONLY_ASPECT_RATIO
        lying_by_weak_box_with_motion = angle is None and aspect_ratio >= FALL_ASPECT_RATIO and sudden_motion
        lying = lying_by_pose or lying_by_strong_box or lying_by_weak_box_with_motion
        near_edge = self._near_frame_edge(box, frame_width, frame_height)
        still = recent_motion_ratio <= FALL_STILLNESS_CENTER_RATIO

        evidence = "upright"
        if lying_by_pose:
            evidence = "pose_angle"
        elif lying_by_strong_box:
            evidence = "strong_box_ratio"
        elif lying_by_weak_box_with_motion:
            evidence = "box_ratio_with_motion"
        elif angle is None and aspect_ratio >= FALL_ASPECT_RATIO:
            evidence = "wide_box_ignored"

        if lying:
            if state.lying_since is None:
                state.lying_since = now
            if sudden_motion or (near_edge and center_drop_ratio >= FALL_CENTER_DROP_RATIO):
                if state.fall_candidate_since is None:
                    state.fall_candidate_since = now
            if still:
                if state.still_since is None:
                    state.still_since = now
            else:
                state.still_since = None
        else:
            state.lying_since = None
            state.still_since = None
            state.fall_candidate_since = None
            if state.is_fallen and state.confirmed_since and now - state.confirmed_since > FALL_RECOVERY_SECONDS:
                state.is_fallen = False
                state.confirmed_since = None

        lying_duration = 0.0 if state.lying_since is None else now - state.lying_since
        still_duration = 0.0 if state.still_since is None else now - state.still_since
        has_fall_transition = state.fall_candidate_since is not None
        has_fall_posture = (
            has_fall_transition
            and lying_duration >= STATIC_LYING_SECONDS
            and still_duration >= FALL_STILLNESS_SECONDS
        )
        has_edge_fall_posture = near_edge and lying and sudden_motion and still_duration >= FALL_CONFIRM_SECONDS

        if has_fall_posture or has_edge_fall_posture:
            if state.confirmed_since is None:
                state.confirmed_since = now
            if now - state.confirmed_since >= FALL_CONFIRM_SECONDS:
                state.is_fallen = True
        elif not lying:
            state.confirmed_since = None

        reason = "upright"
        if state.is_fallen:
            reason = "confirmed_fall"
        elif lying and not still:
            reason = "confirming_motion"
        elif lying and sudden_motion:
            reason = "confirming_sudden_fall_stillness"
        elif lying and not has_fall_transition:
            reason = "lying_no_fall_motion"
        elif lying:
            reason = "confirming_lying_stillness"
        elif evidence == "wide_box_ignored":
            reason = "wide_box_ignored"

        return {
            "is_fallen": state.is_fallen,
            "track_id": target["track_id"],
            "reason": reason,
            "angle": angle,
            "aspect_ratio": aspect_ratio,
            "angle_speed": angle_speed,
            "height_drop_ratio": height_drop_ratio,
            "center_drop_ratio": center_drop_ratio,
            "keypoint_quality": keypoint_quality,
            "lying": lying,
            "still": still,
            "near_edge": near_edge,
            "recent_motion_ratio": recent_motion_ratio,
            "evidence": evidence,
        }

    def _near_frame_edge(self, box, frame_width, frame_height):
        x1, y1, x2, y2 = box
        margin_x = frame_width * FALL_EDGE_MARGIN_RATIO
        margin_y = frame_height * FALL_EDGE_MARGIN_RATIO
        return (
            x1 <= margin_x
            or y1 <= margin_y
            or x2 >= frame_width - margin_x
            or y2 >= frame_height - margin_y
        )

    def _lost_target_status(self, now):
        if self.active_state_id is None:
            return self._empty_fall_status()

        state = self.fall_states.get(self.active_state_id)
        if state is None or now - state.last_seen > FALL_OUT_OF_FRAME_SECONDS:
            return self._empty_fall_status()

        last_status = self.last_target_status or self._empty_fall_status()
        if last_status.get("near_edge") and (last_status.get("lying") or last_status.get("center_drop_ratio", 0.0) >= FALL_CENTER_DROP_RATIO):
            state.is_fallen = True
            status = dict(last_status)
            status["is_fallen"] = True
            status["reason"] = "confirmed_fall_out_of_frame"
            status["evidence"] = "target_lost_near_edge"
            return status

        status = dict(last_status)
        status["reason"] = "target_lost"
        return status

    def _torso_angle(self, kpts, kpt_conf):
        required = [5, 6, 11, 12]
        if not all(self._valid_keypoint(kpts, kpt_conf, idx) for idx in required):
            return None

        shoulder_l = kpts[5]
        shoulder_r = kpts[6]
        hip_l = kpts[11]
        hip_r = kpts[12]

        shoulder_center_x = (shoulder_l[0] + shoulder_r[0]) / 2.0
        shoulder_center_y = (shoulder_l[1] + shoulder_r[1]) / 2.0
        hip_center_x = (hip_l[0] + hip_r[0]) / 2.0
        hip_center_y = (hip_l[1] + hip_r[1]) / 2.0

        dx = hip_center_x - shoulder_center_x
        dy = hip_center_y - shoulder_center_y
        return math.degrees(math.atan2(abs(dx), max(abs(dy), 1e-6)))

    def _core_keypoint_quality(self, kpts, kpt_conf):
        core_indexes = [5, 6, 11, 12]
        values = [
            kpt_conf[idx]
            for idx in core_indexes
            if idx < len(kpts) and idx < len(kpt_conf) and kpts[idx][0] > 0 and kpts[idx][1] > 0
        ]
        if not values:
            return 0.0
        return sum(values) / len(values)

    def _valid_keypoint(self, kpts, kpt_conf, index):
        if index >= len(kpts):
            return False
        if kpts[index][0] <= 0 or kpts[index][1] <= 0:
            return False
        if index < len(kpt_conf) and kpt_conf[index] < MIN_KEYPOINT_CONFIDENCE:
            return False
        return True

    def _drop_stale_fall_states(self, now):
        stale_ids = [
            state_id
            for state_id, state in self.fall_states.items()
            if state.last_seen > 0 and now - state.last_seen > TARGET_LOST_SECONDS
        ]
        for state_id in stale_ids:
            del self.fall_states[state_id]

    def get_last_target_data(self):
        return self.last_target_box, self.last_target_kpts

    def get_last_fall_status(self):
        return self.last_target_status

    def get_all_fall_statuses(self):
        return self.last_all_statuses

    def reset_runtime_state(self):
        self.smooth_x = None
        self.smooth_y = None
        self.last_target_box = None
        self.last_target_kpts = None
        self.last_target_status = self._empty_fall_status()
        self.last_all_statuses = []
        self.active_target_id = None
        self.active_state_id = None
        self.fall_states.clear()

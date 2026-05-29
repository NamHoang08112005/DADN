import cv2
import numpy as np
import mediapipe as mp


# ==============================
# MEDIAPIPE HANDS WRAPPER
# ==============================

class HandDetector:
    def __init__(
        self,
        max_num_hands=1,
        detection_confidence=0.7,
        tracking_confidence=0.7
    ):
        self.mp_hands = mp.solutions.hands
        self.mp_draw = mp.solutions.drawing_utils

        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=max_num_hands,
            min_detection_confidence=detection_confidence,
            min_tracking_confidence=tracking_confidence
        )

    def process(self, frame):
        """
        Process a BGR frame and return MediaPipe results
        """
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb)
        return results

    def draw_landmarks(self, frame, hand_landmarks):
        """
        Draw hand landmarks on frame
        """
        self.mp_draw.draw_landmarks(
            frame,
            hand_landmarks,
            self.mp_hands.HAND_CONNECTIONS
        )


# ==============================
# LANDMARK EXTRACTION
# ==============================

def extract_landmarks(hand_landmarks):
    """
    Convert MediaPipe landmarks → flat numpy array (63,)
    """
    coords = []
    for lm in hand_landmarks.landmark:
        coords.extend([lm.x, lm.y, lm.z])
    return np.array(coords, dtype=np.float32)


def extract_landmarks_list(results):
    """
    Extract landmarks for all detected hands
    Returns list of (63,) arrays
    """
    if not results.multi_hand_landmarks:
        return []

    return [extract_landmarks(hand) for hand in results.multi_hand_landmarks]


# ==============================
# HAND SELECTION
# ==============================

def get_main_hand(results):
    """
    Return the first detected hand (most common use case)
    """
    if not results.multi_hand_landmarks:
        return None
    return results.multi_hand_landmarks[0]


# ==============================
# VISUALIZATION HELPERS
# ==============================

def draw_all_hands(detector, frame, results):
    """
    Draw all detected hands
    """
    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            detector.draw_landmarks(frame, hand_landmarks)


def draw_label(frame, text, position=(10, 40), color=(0, 255, 0)):
    """
    Draw label text on frame
    """
    cv2.putText(
        frame,
        text,
        position,
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        color,
        2
    )


# ==============================
# DEBUG / DATA COLLECTION
# ==============================

def draw_landmark_points(frame, hand_landmarks):
    """
    Draw only points (no connections) for debugging
    """
    h, w, _ = frame.shape

    for lm in hand_landmarks.landmark:
        cx, cy = int(lm.x * w), int(lm.y * h)
        cv2.circle(frame, (cx, cy), 4, (0, 255, 255), -1)


def get_bounding_box(frame, hand_landmarks):
    """
    Get bounding box around hand
    """
    h, w, _ = frame.shape
    xs, ys = [], []

    for lm in hand_landmarks.landmark:
        xs.append(int(lm.x * w))
        ys.append(int(lm.y * h))

    return min(xs), min(ys), max(xs), max(ys)


def draw_bounding_box(frame, bbox, color=(255, 0, 0)):
    """
    Draw bounding box on frame
    """
    x_min, y_min, x_max, y_max = bbox
    cv2.rectangle(frame, (x_min, y_min), (x_max, y_max), color, 2)


# ==============================
# CAMERA UTILS
# ==============================

def init_camera(camera_id=0, width=640, height=480):
    """
    Initialize webcam with resolution
    """
    cap = cv2.VideoCapture(camera_id)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
    return cap


def read_frame(cap, flip=True):
    """
    Read frame safely
    """
    ret, frame = cap.read()
    if not ret:
        return None

    if flip:
        # Flip the frame horizontally (mirror effect)
        frame = cv2.flip(frame, 1)

    return frame

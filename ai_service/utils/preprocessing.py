import numpy as np


# ==============================
# BASIC LANDMARK UTILITIES
# ==============================

def reshape_landmarks(flat_landmarks):
    """
    Convert flat array (63,) → (21, 3)
    """
    return np.array(flat_landmarks).reshape(21, 3)


def flatten_landmarks(landmarks_3d):
    """
    Convert (21, 3) → (63,)
    """
    return landmarks_3d.flatten()


# ==============================
# NORMALIZATION
# ==============================

def normalize_landmarks(landmarks):
    """
    Normalize landmarks:
    - Translation invariant (wrist = origin)
    - Scale invariant (divide by max distance)
    """
    landmarks = reshape_landmarks(landmarks)

    # Step 1: translate (wrist as origin)
    wrist = landmarks[0]
    landmarks = landmarks - wrist

    # Step 2: scale normalization
    max_dist = np.max(np.linalg.norm(landmarks, axis=1))
    if max_dist > 0:
        landmarks = landmarks / max_dist

    return flatten_landmarks(landmarks)


# ==============================
# OPTIONAL ENHANCEMENTS
# ==============================

def normalize_2d(landmarks):
    """
    Normalize using only x, y (ignore z)
    Useful if z is noisy
    """
    landmarks = reshape_landmarks(landmarks)

    xy = landmarks[:, :2]

    wrist = xy[0]
    xy = xy - wrist

    max_dist = np.max(np.linalg.norm(xy, axis=1))
    if max_dist > 0:
        xy = xy / max_dist

    # pad back z=0
    z = np.zeros((21, 1))
    normalized = np.concatenate([xy, z], axis=1)

    return flatten_landmarks(normalized)


def center_only(landmarks):
    """
    Only translation normalization (no scaling)
    """
    landmarks = reshape_landmarks(landmarks)
    wrist = landmarks[0]
    landmarks = landmarks - wrist
    return flatten_landmarks(landmarks)


# ==============================
# DATA AUGMENTATION (for training)
# ==============================

def add_noise(landmarks, noise_level=0.01):
    """
    Add small Gaussian noise
    """
    noise = np.random.normal(0, noise_level, landmarks.shape)
    return landmarks + noise


def random_scale(landmarks, scale_range=(0.9, 1.1)):
    """
    Random scaling (for robustness)
    """
    scale = np.random.uniform(*scale_range)
    return landmarks * scale


def random_rotation_z(landmarks, angle_range=(-15, 15)):
    """
    Rotate hand around Z-axis (in-plane rotation)
    """
    landmarks = reshape_landmarks(landmarks)

    angle = np.deg2rad(np.random.uniform(*angle_range))
    cos_a, sin_a = np.cos(angle), np.sin(angle)

    rot_matrix = np.array([
        [cos_a, -sin_a, 0],
        [sin_a,  cos_a, 0],
        [0,      0,     1]
    ])

    rotated = landmarks @ rot_matrix.T
    return flatten_landmarks(rotated)


# ==============================
# PIPELINE (MAIN ENTRY)
# ==============================

def preprocess(landmarks, use_2d=False):
    """
    Main preprocessing pipeline (USE THIS EVERYWHERE)
    """
    if use_2d:
        landmarks = normalize_2d(landmarks)
    else:
        landmarks = normalize_landmarks(landmarks)

    return landmarks

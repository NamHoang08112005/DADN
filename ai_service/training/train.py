import os
import glob
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder

from utils.preprocessing import preprocess


# ==============================
# CONFIG
# ==============================
DATA_PATH = "../data"   # folder or CSV
MODEL_OUT = "../models/gesture_model.pkl"
ENCODER_OUT = "../models/label_encoder.pkl"

USE_2D = False   # True: recommended
TEST_SIZE = 0.2
RANDOM_STATE = 42


# ==============================
# LOAD DATA
# ==============================
# Expected: [x1, y1, z1, ..., x63, label]
def load_from_csv(csv_path):
    """
    CSV format:
    x1, y1, z1, ..., x63, label
    """
    df = pd.read_csv(csv_path)

    X = df.iloc[:, :-1].values
    y = df.iloc[:, -1].values

    return X, y


# Expected: 
# data/
# ├── open_palm.csv
# ├── fist.csv
# ├── swipe_left.csv
# └── ...
def load_from_folder(folder_path):
    X_list = []
    y_list = []

    files = glob.glob(os.path.join(folder_path, "*.csv"))

    print(f"📂 Found {len(files)} files")

    for file in files:
        label = os.path.splitext(os.path.basename(file))[0]

        # ==============================
        # SAFE LOAD
        # ==============================
        if os.path.getsize(file) == 0:
            print(f"⚠️ Skipping empty file: {file}")
            continue

        try:
            df = pd.read_csv(file)
        except Exception as e:
            print(f"⚠️ Failed to read {file}: {e}")
            continue

        if df.empty:
            print(f"⚠️ Skipping empty dataframe: {file}")
            continue

        data = df.values

        print(f"✅ {label}: {data.shape}")

        X_list.append(data)
        y_list.extend([label] * len(data))

    # ==============================
    # STACK
    # ==============================
    if not X_list:
        raise ValueError("❌ No valid data found")

    X = np.vstack(X_list)
    y = np.array(y_list)

    return X, y

#def load_from_folder(folder_path):
#    """
#    Folder structure:
#    data/
#      ├── open_palm.csv
#      ├── fist.csv
#      └── ...
#    """
#    X_list = []
#    y_list = []

#    files = glob.glob(os.path.join(folder_path, "*.csv"))

#    for file in files:
#        label = os.path.splitext(os.path.basename(file))[0]
#        data = pd.read_csv(file).values

#        X_list.append(data)
#        y_list.extend([label] * len(data))

#    X = np.vstack(X_list)
#    y = np.array(y_list)

#    return X, y


# ==============================
# PREPROCESSING
# ==============================

def preprocess_dataset(X):
    """
    Apply preprocessing to entire dataset
    """
    X_processed = []

    for sample in X:
        processed = preprocess(sample, use_2d=USE_2D)
        X_processed.append(processed)

    return np.array(X_processed)


# ==============================
# MAIN TRAINING PIPELINE
# ==============================

def main():
    print("📦 Loading dataset...")

    if DATA_PATH.endswith(".csv"):
        X, y = load_from_csv(DATA_PATH)
    else:
        X, y = load_from_folder(DATA_PATH)

    print(f"✅ Loaded {len(X)} samples")

    # Encode labels
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)

    print("🧠 Preprocessing...")
    X_processed = preprocess_dataset(X)

    # Train/val split
    X_train, X_val, y_train, y_val = train_test_split(
        X_processed,
        y_encoded,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y_encoded
    )

    print(f"📊 Train: {len(X_train)}, Val: {len(X_val)}")

    # ==============================
    # TRAIN MODEL (SVM)
    # ==============================
    print("🚀 Training SVM model...")

    model = SVC(
        kernel="rbf",
        probability=True,
        C=10,
        gamma="scale"
    )

    model.fit(X_train, y_train)

    # ==============================
    # EVALUATION
    # ==============================
    print("🧪 Evaluating...")

    y_pred = model.predict(X_val)

    acc = accuracy_score(y_val, y_pred)
    print(f"✅ Accuracy: {acc:.4f}")

    print("\n📋 Classification Report:")
    print(classification_report(
        y_val,
        y_pred,
        target_names=label_encoder.classes_
    ))

    # ==============================
    # SAVE MODEL
    # ==============================
    os.makedirs(os.path.dirname(MODEL_OUT), exist_ok=True)

    joblib.dump(model, MODEL_OUT)
    joblib.dump(label_encoder, ENCODER_OUT)

    print(f"💾 Model saved to: {MODEL_OUT}")
    print(f"💾 Encoder saved to: {ENCODER_OUT}")


# ==============================
# ENTRY POINT
# ==============================
if __name__ == "__main__":
    main()

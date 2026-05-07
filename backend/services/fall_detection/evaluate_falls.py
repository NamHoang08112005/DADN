import argparse
import csv
from pathlib import Path

import cv2

from services.fall_detection.vision.detector_yolo import YoloDetector


def parse_args():
    parser = argparse.ArgumentParser(description="Evaluate fall detection on saved videos.")
    parser.add_argument("videos", nargs="+", help="Video file paths to evaluate.")
    parser.add_argument("--output", default="fall_eval_results.csv", help="CSV output path.")
    parser.add_argument("--show", action="store_true", help="Display annotated frames while evaluating.")
    parser.add_argument(
        "--label",
        choices=["fall", "nonfall", "unknown"],
        default="unknown",
        help="Optional label applied to all input videos.",
    )
    return parser.parse_args()


def evaluate_video(detector, video_path, show=False):
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video: {video_path}")

    frame_count = 0
    fall_frames = 0
    first_fall_frame = None
    strongest_status = None

    while True:
        success, frame = cap.read()
        if not success:
            break

        frame_count += 1
        frame, _, _, status = detector.detect(frame)

        if status["is_fallen"]:
            fall_frames += 1
            if first_fall_frame is None:
                first_fall_frame = frame_count

        if strongest_status is None or status["height_drop_ratio"] > strongest_status["height_drop_ratio"]:
            strongest_status = status.copy()

        if show:
            cv2.imshow("Fall evaluation", frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    cap.release()
    if show:
        cv2.destroyAllWindows()

    return {
        "video": str(video_path),
        "frames": frame_count,
        "fall_frames": fall_frames,
        "predicted_fall": fall_frames > 0,
        "first_fall_frame": first_fall_frame if first_fall_frame is not None else "",
        "max_height_drop_ratio": "" if strongest_status is None else f"{strongest_status['height_drop_ratio']:.4f}",
        "max_center_drop_ratio": "" if strongest_status is None else f"{strongest_status['center_drop_ratio']:.4f}",
        "last_reason": "" if strongest_status is None else strongest_status["reason"],
    }


def main():
    args = parse_args()
    detector = YoloDetector()
    rows = []

    for video in args.videos:
        detector.reset_runtime_state()
        video_path = Path(video)
        result = evaluate_video(detector, video_path, show=args.show)
        result["label"] = args.label
        rows.append(result)
        print(
            f"{video_path}: predicted_fall={result['predicted_fall']} "
            f"fall_frames={result['fall_frames']}/{result['frames']}"
        )

    output_path = Path(args.output)
    fieldnames = [
        "video",
        "label",
        "frames",
        "fall_frames",
        "predicted_fall",
        "first_fall_frame",
        "max_height_drop_ratio",
        "max_center_drop_ratio",
        "last_reason",
    ]
    with output_path.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()

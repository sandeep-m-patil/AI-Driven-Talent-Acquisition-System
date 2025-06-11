import cv2
import mediapipe as mp
import numpy as np
import tempfile
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI()

# Allow CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

mp_pose = mp.solutions.pose

def calculate_angle(a, b, c):
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)

    ba = a - b
    bc = c - b

    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6)
    angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
    return np.degrees(angle)

def euclidean_dist(p1, p2):
    return np.linalg.norm(np.array(p1) - np.array(p2))

@app.post("/pose/analyze")
async def analyze_pose(file: UploadFile = File(...)):
    # Save uploaded video temporarily
    suffix = file.filename.split(".")[-1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{suffix}") as temp_file:
        temp_file.write(await file.read())
        temp_path = temp_file.name

    cap = cv2.VideoCapture(temp_path)
    if not cap.isOpened():
        raise HTTPException(status_code=400, detail="Could not open video file")

    pose = mp_pose.Pose(static_image_mode=False, min_detection_confidence=0.5, min_tracking_confidence=0.5)

    head_positions = []
    eye_contact_off_count = 0
    body_move_count = 0
    mouth_movement_count = 0
    total_frames = 0

    HEAD_MOVE_ANGLE_THRESHOLD = 15  # degrees
    EYE_MOVEMENT_THRESHOLD = 0.02   # normalized units
    BODY_MOVE_THRESHOLD = 0.05      # normalized units
    MOUTH_MOVE_THRESHOLD = 0.02     # normalized units

    prev_left_shoulder = None
    prev_right_shoulder = None
    prev_mouth_left = None
    prev_mouth_right = None

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        total_frames += 1

        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(image_rgb)

        if not results.pose_landmarks:
            continue

        lm = results.pose_landmarks.landmark

        try:
            left_ear = [lm[mp_pose.PoseLandmark.LEFT_EAR.value].x, lm[mp_pose.PoseLandmark.LEFT_EAR.value].y]
            nose = [lm[mp_pose.PoseLandmark.NOSE.value].x, lm[mp_pose.PoseLandmark.NOSE.value].y]
            right_ear = [lm[mp_pose.PoseLandmark.RIGHT_EAR.value].x, lm[mp_pose.PoseLandmark.RIGHT_EAR.value].y]
        except Exception:
            continue

        angle = calculate_angle(left_ear, nose, right_ear)
        head_positions.append(angle)

        # Eye contact detection:
        left_eye = np.array([lm[mp_pose.PoseLandmark.LEFT_EYE.value].x, lm[mp_pose.PoseLandmark.LEFT_EYE.value].y])
        right_eye = np.array([lm[mp_pose.PoseLandmark.RIGHT_EYE.value].x, lm[mp_pose.PoseLandmark.RIGHT_EYE.value].y])
        nose_point = np.array([lm[mp_pose.PoseLandmark.NOSE.value].x, lm[mp_pose.PoseLandmark.NOSE.value].y])

        left_eye_vec = left_eye - nose_point
        right_eye_vec = right_eye - nose_point

        if (abs(left_eye_vec[0]) > EYE_MOVEMENT_THRESHOLD or abs(left_eye_vec[1]) > EYE_MOVEMENT_THRESHOLD or
            abs(right_eye_vec[0]) > EYE_MOVEMENT_THRESHOLD or abs(right_eye_vec[1]) > EYE_MOVEMENT_THRESHOLD):
            eye_contact_off_count += 1

        # Body movement detection:
        left_shoulder = [lm[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x, lm[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
        right_shoulder = [lm[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x, lm[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]

        if prev_left_shoulder is not None and prev_right_shoulder is not None:
            left_shoulder_dist = euclidean_dist(left_shoulder, prev_left_shoulder)
            right_shoulder_dist = euclidean_dist(right_shoulder, prev_right_shoulder)
            avg_shoulder_move = (left_shoulder_dist + right_shoulder_dist) / 2.0
            if avg_shoulder_move > BODY_MOVE_THRESHOLD:
                body_move_count += 1

        prev_left_shoulder = left_shoulder
        prev_right_shoulder = right_shoulder

        # Mouth movement detection:
        mouth_left = [lm[mp_pose.PoseLandmark.MOUTH_LEFT.value].x, lm[mp_pose.PoseLandmark.MOUTH_LEFT.value].y]
        mouth_right = [lm[mp_pose.PoseLandmark.MOUTH_RIGHT.value].x, lm[mp_pose.PoseLandmark.MOUTH_RIGHT.value].y]

        if prev_mouth_left is not None and prev_mouth_right is not None:
            mouth_left_dist = euclidean_dist(mouth_left, prev_mouth_left)
            mouth_right_dist = euclidean_dist(mouth_right, prev_mouth_right)
            avg_mouth_move = (mouth_left_dist + mouth_right_dist) / 2.0
            if avg_mouth_move > MOUTH_MOVE_THRESHOLD:
                mouth_movement_count += 1

        prev_mouth_left = mouth_left
        prev_mouth_right = mouth_right

    cap.release()
    pose.close()

    head_move_count = 0
    for i in range(1, len(head_positions)):
        if abs(head_positions[i] - head_positions[i-1]) > HEAD_MOVE_ANGLE_THRESHOLD:
            head_move_count += 1

    summary = {
        "total_frames": total_frames,
        "head_move_count": head_move_count,
        "eye_contact_off_count": eye_contact_off_count,
        "body_move_count": body_move_count,
        "mouth_movement_count": mouth_movement_count,
        "head_movement_percentage": round(head_move_count / max(total_frames, 1) * 100, 2),
        "eye_contact_off_percentage": round(eye_contact_off_count / max(total_frames, 1) * 100, 2),
        "body_movement_percentage": round(body_move_count / max(total_frames, 1) * 100, 2),
        "mouth_movement_percentage": round(mouth_movement_count / max(total_frames, 1) * 100, 2),
    }

    return JSONResponse(content={"summary": summary})

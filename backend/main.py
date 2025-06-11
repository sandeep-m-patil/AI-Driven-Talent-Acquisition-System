from fastapi import FastAPI, UploadFile, File, Form
from routers import resume, interview, pose
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import mediapipe as mp
import cv2
import numpy as np
from typing import List, Dict
import os
from dotenv import load_dotenv
import tempfile

# Load environment variables
load_dotenv()

# Configure Google Gemini API
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
model = genai.GenerativeModel('gemini-pro')

app = FastAPI(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MediaPipe Pose
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=2,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Include routers with prefix
app.include_router(resume.router, prefix="/resume", tags=["resume"])
app.include_router(pose.router, prefix="/pose", tags=["pose"])
app.include_router(interview.router, prefix="/interview", tags=["interview"])

@app.post("/generate-questions")
async def generate_questions(job_description: str):
    prompt = f"""Based on the following job description, generate 5 relevant interview questions:
    {job_description}
    
    Format the response as a JSON array of questions."""
    
    response = model.generate_content(prompt)
    return {"questions": response.text}

@app.post("/score-answer")
async def score_answer(
    question: str = Form(...),
    answer: str = Form(...)
):
    prompt = f"""Evaluate the following interview answer:
    Question: {question}
    Answer: {answer}
    
    Provide a score (0-100) and detailed feedback on:
    1. Clarity
    2. Correctness
    3. Completeness
    
    Format the response as JSON with 'score' and 'feedback' fields."""
    
    response = model.generate_content(prompt)
    return {"evaluation": response.text}

@app.post("/analyze-pose")
async def analyze_pose(video: UploadFile = File(...)):
    # Save uploaded video to temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_video:
        content = await video.read()
        temp_video.write(content)
        temp_video_path = temp_video.name

    # Initialize video capture
    cap = cv2.VideoCapture(temp_video_path)
    
    # Initialize pose analysis metrics
    head_movement = []
    eye_contact = []
    body_posture = []
    mouth_movement = []
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        # Convert to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(rgb_frame)
        
        if results.pose_landmarks:
            # Extract relevant landmarks
            landmarks = results.pose_landmarks.landmark
            
            # Analyze head movement (using nose position)
            nose = landmarks[mp_pose.PoseLandmark.NOSE.value]
            head_movement.append((nose.x, nose.y))
            
            # Analyze body posture (using shoulder alignment)
            left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
            right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
            body_posture.append(abs(left_shoulder.y - right_shoulder.y))
            
            # Add more pose analysis logic here
    
    cap.release()
    os.unlink(temp_video_path)
    
    # Calculate final scores
    head_movement_score = calculate_head_movement_score(head_movement)
    body_posture_score = calculate_body_posture_score(body_posture)
    
    return {
        "head_movement_score": head_movement_score,
        "body_posture_score": body_posture_score,
        "feedback": generate_pose_feedback(head_movement_score, body_posture_score)
    }

def calculate_head_movement_score(movements):
    if not movements:
        return 0
    # Calculate variance in head position
    x_coords, y_coords = zip(*movements)
    variance = np.var(x_coords) + np.var(y_coords)
    # Convert to a 0-100 score (lower variance is better)
    return max(0, 100 - (variance * 1000))

def calculate_body_posture_score(postures):
    if not postures:
        return 0
    # Calculate average shoulder alignment
    avg_posture = np.mean(postures)
    # Convert to a 0-100 score (better alignment is better)
    return max(0, 100 - (avg_posture * 100))

def generate_pose_feedback(head_score, posture_score):
    feedback = []
    
    if head_score < 70:
        feedback.append("Try to maintain more stable head position during the interview.")
    if posture_score < 70:
        feedback.append("Work on maintaining better posture and shoulder alignment.")
        
    return " ".join(feedback) if feedback else "Good posture and head movement!"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
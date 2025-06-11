from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from services.question_generator import generate
import asyncio

router = APIRouter(prefix="/interview", tags=["Interview"])

class JobReq(BaseModel):
    role: str
    job_description: str

class QuestionsResponse(BaseModel):
    technical_questions: List[str]
    behavioral_questions: List[str]

class InterviewResponse(BaseModel):
    questions: QuestionsResponse

async def run_blocking_io(func, *args):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, func, *args)

@router.post("/generate_questions", response_model=InterviewResponse)
async def generate_interview_questions(data: JobReq):
    try:
        questions = await run_blocking_io(generate, data.role, data.job_description)

        # Validate that keys exist
        if not questions or \
           'technical_questions' not in questions or \
           'behavioral_questions' not in questions:
            raise HTTPException(status_code=500, detail="Invalid question data received")

        # Return wrapped in "questions" key exactly as desired
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

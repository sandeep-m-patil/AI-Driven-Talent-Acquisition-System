from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from services.nlp_resume import process_resume_vs_jd
import pdfplumber

router = APIRouter(prefix="/resume", tags=["Resume"])

@router.post("/score")
async def upload_resume(
    file: UploadFile = File(...),
    job_description: str = Form(...)
):
    try:
        if file.filename.lower().endswith(".pdf"):
            with pdfplumber.open(file.file) as pdf:
                text = "\n".join(page.extract_text() or "" for page in pdf.pages)
        else:
            content = await file.read()
            text = content.decode("utf-8", errors="ignore")

        result = process_resume_vs_jd(text, job_description)
        return JSONResponse(content=result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing resume: {str(e)}")

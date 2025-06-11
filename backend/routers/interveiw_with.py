from fastapi import FastAPI, UploadFile, File, HTTPException
import tempfile
import os
import speech_recognition as sr

app = FastAPI()

@app.post("/transcribe_live")
async def transcribe_live_audio(audio_file: UploadFile = File(...)):
    try:
        suffix = os.path.splitext(audio_file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_audio:
            temp_audio.write(await audio_file.read())
            temp_audio_path = temp_audio.name

        r = sr.Recognizer()
        with sr.AudioFile(temp_audio_path) as source:
            audio = r.record(source)

        os.unlink(temp_audio_path)

        transcript = r.recognize_google(audio)
        return {"transcript": transcript}
    except sr.UnknownValueError:
        raise HTTPException(status_code=400, detail="Could not understand audio")
    except sr.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Request failed; {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

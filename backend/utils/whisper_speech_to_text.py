import tempfile
import whisper


model = whisper.load_model("base")

def transcribe(audio):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp:
        temp.write(audio.file.read())
        result = model.transcribe(temp.name)
        return result["text"]

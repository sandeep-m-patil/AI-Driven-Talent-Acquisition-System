import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"

def generate(role: str, job_description: str) -> dict:
    prompt = f"""
You are an intelligent interview assistant.

Role: {role}

Based on the following job description, generate:
- 7 technical interview questions
- 3 behavioral interview questions

Format the output as JSON:
{{
    "technical_questions": ["..."],
    "behavioral_questions": ["..."]
}}

Job Description:
{job_description}
"""

    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ]
    }

    headers = {"Content-Type": "application/json"}

    response = requests.post(GEMINI_URL, headers=headers, json=payload)

    if response.status_code != 200:
        raise Exception(f"Gemini API error: {response.text}")

    response_json = response.json()
    generated_text = response_json["candidates"][0]["content"]["parts"][0]["text"]

    print("Raw Gemini response text:")
    print(generated_text)  # <<-- DEBUG: see exactly what came back

    # Sometimes the response may include explanation or extra text,
    # so try to extract the JSON substring from generated_text
    try:
        # Naive attempt: find first { and last } to get JSON substring
        start = generated_text.index('{')
        end = generated_text.rindex('}') + 1
        json_str = generated_text[start:end]

        return json.loads(json_str)
    except Exception as e:
        # If still fails, raise with raw text for easier debugging
        raise Exception(f"Failed to parse Gemini response JSON. Raw output: {generated_text}. Error: {str(e)}")

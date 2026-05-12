from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Allow Chrome extension to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

HF_API_TOKEN = os.getenv("HF_API_TOKEN")
API_URL = "https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn"

class TextInput(BaseModel):
    text: str

@app.post("/summarize")
async def summarize(input: TextInput):
    if not input.text.strip():
        raise HTTPException(status_code=400, detail="Text is empty")

    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
    payload = {
        "inputs": input.text[:3000],  # BART token limit
        "parameters": {
            "max_length": 150,
            "min_length": 50,
            "do_sample": False
        }
    }

    response = requests.post(API_URL, headers=headers, json=payload)

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="HuggingFace API error")

    summary = response.json()[0]["summary_text"]
    return {"summary": summary}

@app.get("/")
async def root():
    return {"status": "AI Summarizer API is running"}
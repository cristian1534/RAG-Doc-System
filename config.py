import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    OLLAMA_URL = os.getenv("OLLAMA_URL", "https://dc74-46-33-39-161.ngrok-free.app/proxy")
    TIMEOUT_SECONDS = 180.0
    
    @classmethod
    def get_ollama_url(cls):
        # Use URL from environment variable
        return os.getenv("OLLAMA_URL", "https://dc74-46-33-39-161.ngrok-free.app/proxy")

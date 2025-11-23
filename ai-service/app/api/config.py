"""
API Configuration
"""
import os
from typing import List
from dotenv import load_dotenv

load_dotenv()


class APIConfig:
    """API configuration settings"""
    
    # Service Info
    SERVICE_NAME = "SourceFlow AI Service"
    SERVICE_VERSION = "1.0.0"
    SERVICE_DESCRIPTION = "AI-powered BOM generation service using Groq API (Free Tier)"
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = os.getenv("CORS_ORIGINS", "*").split(",")
    CORS_ALLOW_CREDENTIALS = True
    CORS_ALLOW_METHODS = ["*"]
    CORS_ALLOW_HEADERS = ["*"]
    
    # API Configuration
    API_V1_PREFIX = "/api/v1"
    
    # Environment
    ENV = os.getenv("ENV", "development")
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    
    # Groq API
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    
    @classmethod
    def validate(cls) -> bool:
        """Validate required configuration"""
        if not cls.GROQ_API_KEY:
            print("WARNING: GROQ_API_KEY not set. BOM generation will fail.")
            print("Please set GROQ_API_KEY in your .env file or environment variables.")
            return False
        return True


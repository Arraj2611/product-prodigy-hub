"""
AI Service - FastAPI application for BOM generation
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import time
import os
from dotenv import load_dotenv

from app.models.bom_generator import BOMGenerator

load_dotenv()

# Verify Gemini API key is set
if not os.getenv("GEMINI_API_KEY"):
    print("WARNING: GEMINI_API_KEY not set. BOM generation will fail.")
    print("Please set GEMINI_API_KEY in your .env file or environment variables.")

app = FastAPI(
    title="SourceFlow AI Service",
    description="AI-powered BOM generation service using Google Gemini (Free Tier)",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize BOM generator (uses Gemini API)
try:
    bom_generator = BOMGenerator()
except ValueError as e:
    print(f"ERROR: {e}")
    bom_generator = None


class BOMRequest(BaseModel):
    description: Optional[str] = None
    yield_buffer: float = 10.0  # Default 10% yield buffer


class BOMResponse(BaseModel):
    bom: dict
    confidence: float
    processing_time: float


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "ai-bom-generator"
    }


@app.post("/api/v1/ai/generate-bom", response_model=BOMResponse)
async def generate_bom(
    images: List[UploadFile] = File(...),
    description: Optional[str] = None,
    yield_buffer: float = 10.0
):
    """
    Generate BOM from product images and description
    
    Target: <5 seconds latency (NFR-1.1)
    """
    start_time = time.time()
    
    if not images:
        raise HTTPException(status_code=400, detail="At least one image is required")
    
    if not bom_generator:
        raise HTTPException(
            status_code=500,
            detail="AI service not initialized. Please set GEMINI_API_KEY environment variable."
        )
    
    try:
        # Read image data
        image_data = []
        for image in images:
            if not image.content_type or not image.content_type.startswith("image/"):
                raise HTTPException(status_code=400, detail=f"Invalid file type: {image.content_type}")
            
            data = await image.read()
            image_data.append({
                "data": data,
                "filename": image.filename,
                "content_type": image.content_type
            })
        
        # Generate BOM using Gemini
        result = await bom_generator.generate(
            images=image_data,
            description=description or "",
            yield_buffer=yield_buffer
        )
        
        processing_time = time.time() - start_time
        
        # Log if processing takes too long
        if processing_time > 5.0:
            print(f"WARNING: BOM generation took {processing_time:.2f}s (target: <5s)")
        
        return BOMResponse(
            bom=result["bom"],
            confidence=result["confidence"],
            processing_time=round(processing_time, 2)
        )
    
    except Exception as e:
        print(f"Error generating BOM: {str(e)}")
        raise HTTPException(status_code=500, detail=f"BOM generation failed: {str(e)}")


@app.get("/")
async def root():
    return {
        "service": "SourceFlow AI Service",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "generate_bom": "/api/v1/ai/generate-bom"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


"""
BOM Request/Response Models
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any


class BOMRequest(BaseModel):
    """Request model for BOM generation"""
    description: Optional[str] = None
    yield_buffer: float = 10.0  # Default 10% yield buffer


class BOMResponse(BaseModel):
    """Response model for BOM generation"""
    bom: Dict[str, Any]
    confidence: float
    processing_time: float


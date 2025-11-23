"""
Batch Processing Router
Handles Groq Batch API operations
"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List, Optional
import json

from app.services.batch_service import BatchService

router = APIRouter(prefix="/api/v1/batch", tags=["Batch"])

# Global batch service
batch_service: Optional[BatchService] = None


def set_batch_service(service: BatchService):
    """Set global batch service (called during app startup)"""
    global batch_service
    batch_service = service


@router.post("/create")
async def create_batch(
    requests: List[dict],
    endpoint: str = "/v1/chat/completions",
    completion_window: str = "24h"
):
    """
    Create a batch job from a list of requests
    
    Args:
        requests: List of batch request dictionaries
        endpoint: API endpoint
        completion_window: Processing window (24h to 7d)
    
    Returns:
        Batch job information
    """
    if not batch_service:
        raise HTTPException(
            status_code=500,
            detail="Batch service not initialized"
        )
    
    try:
        # Create batch file
        file_path = batch_service.create_batch_file(requests)
        
        # Upload file
        file_obj = batch_service.upload_batch_file(file_path)
        
        # Create batch job
        batch = batch_service.create_batch_job(
            input_file_id=file_obj.id,
            endpoint=endpoint,
            completion_window=completion_window
        )
        
        return {
            "success": True,
            "batch_id": batch.id,
            "status": batch.status,
            "input_file_id": batch.input_file_id,
            "completion_window": batch.completion_window,
            "expires_at": batch.expires_at
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch creation failed: {str(e)}")


@router.get("/status/{batch_id}")
async def get_batch_status(batch_id: str):
    """Get the status of a batch job"""
    if not batch_service:
        raise HTTPException(
            status_code=500,
            detail="Batch service not initialized"
        )
    
    try:
        status = batch_service.get_batch_status(batch_id)
        return {
            "success": True,
            "batch_id": status.id,
            "status": status.status,
            "request_counts": status.request_counts,
            "output_file_id": status.output_file_id,
            "error_file_id": status.error_file_id,
            "completed_at": status.completed_at,
            "expires_at": status.expires_at
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get batch status: {str(e)}")


@router.get("/results/{output_file_id}")
async def get_batch_results(output_file_id: str):
    """Get results from a completed batch job"""
    if not batch_service:
        raise HTTPException(
            status_code=500,
            detail="Batch service not initialized"
        )
    
    try:
        results = batch_service.get_batch_results(output_file_id)
        return {
            "success": True,
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get batch results: {str(e)}")


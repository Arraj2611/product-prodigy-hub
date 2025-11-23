"""
Error Handling Utilities
"""
from typing import Optional
from fastapi import HTTPException


def handle_groq_error(error: Exception) -> HTTPException:
    """
    Handle Groq API errors and return appropriate HTTP exception
    
    Args:
        error: The exception that occurred
    
    Returns:
        HTTPException with appropriate status code and message
    """
    error_str = str(error)
    
    # Rate limit errors
    if "429" in error_str or "rate limit" in error_str.lower() or "quota" in error_str.lower():
        return HTTPException(
            status_code=429,
            detail="Groq API rate limit exceeded. Please wait a few minutes and try again."
        )
    
    # Generic error
    return HTTPException(
        status_code=500,
        detail=f"AI service error: {error_str}"
    )


def validate_service_initialized(service: Optional[object], service_name: str = "AI service") -> None:
    """
    Validate that a service is initialized
    
    Args:
        service: The service object to validate
        service_name: Name of the service for error message
    
    Raises:
        HTTPException if service is not initialized
    """
    if not service:
        raise HTTPException(
            status_code=500,
            detail=f"{service_name} not initialized. Please set GROQ_API_KEY environment variable."
        )


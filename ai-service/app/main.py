"""
AI Service - Main Entry Point
"""
import signal
import sys
import uvicorn

from app.api.app import create_app

# Create FastAPI application
app = create_app()


if __name__ == "__main__":
    # Handle graceful shutdown on SIGINT/SIGTERM
    def signal_handler(sig, frame):
        print("\n🛑 Received shutdown signal, shutting down gracefully...")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
        access_log=True
    )

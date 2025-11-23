"""
FastAPI Application Factory
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.config import APIConfig
from app.api.routers import health, inference, batch
from app.models.bom_generator import BOMGenerator
from app.services.groq_service import GroqService
from app.services.batch_service import BatchService


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown
    Handles graceful initialization and cleanup
    """
    # Startup
    print("🚀 Starting SourceFlow AI Service...")
    
    # Validate configuration
    if not APIConfig.validate():
        print("⚠️  Configuration validation failed, but continuing...")
    
    # Initialize services
    bom_generator = None
    groq_service = None
    batch_svc = None
    
    try:
        bom_generator = BOMGenerator()
        groq_service = GroqService()
        batch_svc = BatchService()
        print("✅ AI Service initialized successfully")
    except ValueError as e:
        print(f"ERROR: {e}")
        bom_generator = None
        groq_service = None
        batch_svc = None
    
    # Set services in routers
    if bom_generator and groq_service:
        inference.set_services(bom_generator, groq_service)
    
    if batch_svc:
        batch.set_batch_service(batch_svc)
    
    yield
    
    # Shutdown
    print("🛑 Shutting down AI Service...")
    print("✅ AI Service shutdown complete")


def create_app() -> FastAPI:
    """
    Create and configure FastAPI application
    """
    app = FastAPI(
        title=APIConfig.SERVICE_NAME,
        description=APIConfig.SERVICE_DESCRIPTION,
        version=APIConfig.SERVICE_VERSION,
        lifespan=lifespan
    )
    
    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=APIConfig.CORS_ORIGINS,
        allow_credentials=APIConfig.CORS_ALLOW_CREDENTIALS,
        allow_methods=APIConfig.CORS_ALLOW_METHODS,
        allow_headers=APIConfig.CORS_ALLOW_HEADERS,
    )
    
    # Include routers
    app.include_router(health.router)
    app.include_router(inference.router)
    app.include_router(batch.router)
    
    # Root endpoint
    @app.get("/")
    async def root():
        return {
            "service": APIConfig.SERVICE_NAME,
            "version": APIConfig.SERVICE_VERSION,
            "endpoints": {
                "health": "/health",
                "generate_bom": "/api/v1/ai/generate-bom",
                "generate_market_forecast": "/api/v1/ai/generate-market-forecast",
                "generate_price_forecast": "/api/v1/ai/generate-price-forecast",
                "generate_suppliers": "/api/v1/ai/generate-suppliers",
                "fetch_supplier_contact": "/api/v1/ai/fetch-supplier-contact",
                "generate_revenue_projection": "/api/v1/ai/generate-revenue-projection",
                "generate_product_performance": "/api/v1/ai/generate-product-performance",
                "generate_marketing_campaigns": "/api/v1/ai/generate-marketing-campaigns"
            }
        }
    
    return app


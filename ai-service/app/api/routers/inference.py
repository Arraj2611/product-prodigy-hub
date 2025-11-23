"""
AI Inference Router
Handles all AI-related endpoints
"""
from fastapi import APIRouter, File, UploadFile, HTTPException
from typing import List, Optional
import time

from app.api.models.bom import BOMRequest, BOMResponse
from app.api.models.forecast import (
    MarketForecastRequest,
    PriceForecastRequest,
    RevenueProjectionRequest
)
from app.api.models.supplier import (
    SupplierRequest,
    SupplierContactRequest
)
from app.api.models.product import (
    ProductPerformanceRequest,
    MarketingCampaignRequest
)
from app.models.bom_generator import BOMGenerator
from app.services.groq_service import GroqService

router = APIRouter(prefix="/api/v1/ai", tags=["AI"])

# Global services (will be injected via dependency)
bom_generator: Optional[BOMGenerator] = None
groq_service: Optional[GroqService] = None


def set_services(bom_gen: BOMGenerator, groq_svc: GroqService):
    """Set global services (called during app startup)"""
    global bom_generator, groq_service
    bom_generator = bom_gen
    groq_service = groq_svc


@router.post("/generate-bom", response_model=BOMResponse)
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
            detail="AI service not initialized. Please set GROQ_API_KEY environment variable."
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
        
        # Generate BOM using Groq
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
        error_str = str(e)
        print(f"Error generating BOM: {error_str}")
        
        # Check if it's a rate limit error
        if "429" in error_str or "rate limit" in error_str.lower() or "quota" in error_str.lower():
            raise HTTPException(
                status_code=429,
                detail="Groq API rate limit exceeded. Please wait a few minutes and try again."
            )
        
        # Generic error
        raise HTTPException(
            status_code=500,
            detail=f"BOM generation failed: {error_str}"
        )


@router.post("/generate-market-forecast")
async def generate_market_forecast(request: MarketForecastRequest):
    """Generate market demand forecasts for different countries"""
    if not groq_service:
        raise HTTPException(
            status_code=500,
            detail="AI service not initialized. Please set GROQ_API_KEY environment variable."
        )
    
    try:
        result = await groq_service.generate_market_demand_forecast(
            product_name=request.product_name,
            product_description=request.product_description or "",
            bom_materials=request.bom_materials,
            target_markets=request.target_markets
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"Error generating market forecast: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Market forecast generation failed: {str(e)}")


@router.post("/generate-price-forecast")
async def generate_price_forecast(request: PriceForecastRequest):
    """Generate material price trend forecasts"""
    if not groq_service:
        raise HTTPException(
            status_code=500,
            detail="AI service not initialized. Please set GROQ_API_KEY environment variable."
        )
    
    try:
        result = await groq_service.generate_material_price_forecast(
            material_name=request.material_name,
            material_type=request.material_type,
            unit=request.unit,
            weeks=request.weeks
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"Error generating price forecast: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Price forecast generation failed: {str(e)}")


@router.post("/generate-suppliers")
async def generate_suppliers(request: SupplierRequest):
    """Generate supplier recommendations with locations"""
    if not groq_service:
        raise HTTPException(
            status_code=500,
            detail="AI service not initialized. Please set GROQ_API_KEY environment variable."
        )
    
    try:
        result = await groq_service.generate_supplier_recommendations(
            material_name=request.material_name,
            material_type=request.material_type,
            quantity=request.quantity,
            unit=request.unit,
            preferred_countries=request.preferred_countries
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"Error generating suppliers: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Supplier generation failed: {str(e)}")


@router.post("/fetch-supplier-contact")
async def fetch_supplier_contact(request: SupplierContactRequest):
    """Fetch supplier contact information using web search"""
    if not groq_service:
        raise HTTPException(
            status_code=500,
            detail="AI service not initialized. Please set GROQ_API_KEY environment variable."
        )
    
    try:
        result = await groq_service.fetch_supplier_contact_info(
            supplier_name=request.supplier_name,
            city=request.city,
            country=request.country,
            website=request.website
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"Error fetching supplier contact: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Contact fetch failed: {str(e)}")


@router.post("/generate-revenue-projection")
async def generate_revenue_projection(request: RevenueProjectionRequest):
    """Generate revenue projections using Groq with web search"""
    if not groq_service:
        raise HTTPException(
            status_code=500,
            detail="AI service not initialized. Please set GROQ_API_KEY environment variable."
        )
    
    try:
        result = await groq_service.generate_revenue_projection(
            product_name=request.product_name,
            product_description=request.product_description or "",
            bom_cost=request.bom_cost,
            target_markets=request.target_markets
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"Error generating revenue projection: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Revenue projection generation failed: {str(e)}")


@router.post("/generate-product-performance")
async def generate_product_performance(request: ProductPerformanceRequest):
    """Generate product performance metrics using Groq"""
    if not groq_service:
        raise HTTPException(
            status_code=500,
            detail="AI service not initialized. Please set GROQ_API_KEY environment variable."
        )
    
    try:
        result = await groq_service.generate_product_performance(
            products=request.products
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"Error generating product performance: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Product performance generation failed: {str(e)}")


@router.post("/generate-marketing-campaigns")
async def generate_marketing_campaigns(request: MarketingCampaignRequest):
    """Generate marketing campaign recommendations using Groq with web search"""
    if not groq_service:
        raise HTTPException(
            status_code=500,
            detail="AI service not initialized. Please set GROQ_API_KEY environment variable."
        )
    
    try:
        result = await groq_service.generate_marketing_campaigns(
            product_name=request.product_name,
            product_description=request.product_description or "",
            target_markets=request.target_markets
        )
        return {"success": True, "data": result}
    except Exception as e:
        print(f"Error generating marketing campaigns: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Marketing campaign generation failed: {str(e)}")


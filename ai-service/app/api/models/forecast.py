"""
Forecast Request Models
"""
from pydantic import BaseModel
from typing import List, Optional


class MarketForecastRequest(BaseModel):
    """Request model for market forecast generation"""
    product_name: str
    product_description: Optional[str] = None
    bom_materials: List[str]
    target_markets: Optional[List[str]] = None


class PriceForecastRequest(BaseModel):
    """Request model for price forecast generation"""
    material_name: str
    material_type: str
    unit: str
    weeks: int = 8


class RevenueProjectionRequest(BaseModel):
    """Request model for revenue projection generation"""
    product_name: str
    product_description: Optional[str] = None
    bom_cost: float
    target_markets: Optional[List[str]] = None


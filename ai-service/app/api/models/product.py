"""
Product Request Models
"""
from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class ProductPerformanceRequest(BaseModel):
    """Request model for product performance generation"""
    products: List[Dict[str, Any]]


class MarketingCampaignRequest(BaseModel):
    """Request model for marketing campaign generation"""
    product_name: str
    product_description: Optional[str] = None
    target_markets: Optional[List[str]] = None


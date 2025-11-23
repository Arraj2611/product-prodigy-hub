"""
Supplier Request Models
"""
from pydantic import BaseModel
from typing import List, Optional


class SupplierRequest(BaseModel):
    """Request model for supplier recommendations"""
    material_name: str
    material_type: str
    quantity: float
    unit: str
    preferred_countries: Optional[List[str]] = None


class SupplierContactRequest(BaseModel):
    """Request model for supplier contact information"""
    supplier_name: str
    city: str
    country: str
    website: Optional[str] = None


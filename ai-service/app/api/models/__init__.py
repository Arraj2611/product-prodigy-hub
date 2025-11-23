"""
API Request/Response Models
"""
from .bom import BOMRequest, BOMResponse
from .forecast import (
    MarketForecastRequest,
    PriceForecastRequest,
    RevenueProjectionRequest
)
from .supplier import (
    SupplierRequest,
    SupplierContactRequest
)
from .product import (
    ProductPerformanceRequest,
    MarketingCampaignRequest
)

__all__ = [
    'BOMRequest',
    'BOMResponse',
    'MarketForecastRequest',
    'PriceForecastRequest',
    'RevenueProjectionRequest',
    'SupplierRequest',
    'SupplierContactRequest',
    'ProductPerformanceRequest',
    'MarketingCampaignRequest',
]


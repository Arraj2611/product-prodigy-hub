"""
Price Forecast Agent
Expert in commodity pricing and price trend forecasting
"""

import json
import asyncio
from typing import Dict, Any, TYPE_CHECKING
from .prompts.price_forecast import price_forecast_prompt

if TYPE_CHECKING:
    from app.services.groq_service import GroqService


class PriceForecastAgent:
    """
    Agent specialized in generating material price forecasts
    """
    
    def __init__(self, groq_service: "GroqService"):
        self.groq_service = groq_service
    
    async def generate_forecast(
        self,
        material_name: str,
        material_type: str,
        unit: str,
        weeks: int = 8
    ) -> Dict[str, Any]:
        """
        Generate material price trend forecasts
        
        Args:
            material_name: Name of the material
            material_type: Type of material
            unit: Unit of measurement
            weeks: Number of weeks to forecast
        
        Returns:
            Dictionary with price forecasts for each week
        """
        formatted_prompt = price_forecast_prompt.format_messages(
            material_name=material_name,
            material_type=material_type,
            unit=unit,
            weeks=weeks
        )
        
        messages = []
        for msg in formatted_prompt:
            if msg.type == "system":
                messages.append({"role": "system", "content": msg.content})
            elif msg.type == "human":
                messages.append({"role": "user", "content": msg.content})
        
        response = await asyncio.to_thread(
            self.groq_service._retry_with_backoff,
            lambda: self.groq_service.client.chat.completions.create(
                model="groq/compound-mini",  # Use compound-mini for web search
                messages=messages,
                temperature=0.6,
                max_completion_tokens=1024,
                response_format={"type": "json_object"}
            )
        )
        
        result = self.groq_service._parse_json_response(response.choices[0].message.content)
        return result


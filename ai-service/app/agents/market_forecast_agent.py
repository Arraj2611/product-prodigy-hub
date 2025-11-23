"""
Market Forecast Agent
Expert in market intelligence and demand forecasting
"""

import json
import asyncio
from typing import Dict, Any, List, TYPE_CHECKING
from .prompts.market_forecast import market_forecast_prompt

if TYPE_CHECKING:
    from app.services.groq_service import GroqService


class MarketForecastAgent:
    """
    Agent specialized in generating market demand forecasts
    """
    
    def __init__(self, groq_service: "GroqService"):
        self.groq_service = groq_service
    
    async def generate_forecast(
        self,
        product_name: str,
        product_description: str,
        bom_materials: List[str],
        target_markets: List[str] = None
    ) -> Dict[str, Any]:
        """
        Generate market demand forecasts for target markets
        
        Args:
            product_name: Name of the product
            product_description: Product description
            bom_materials: List of materials from BOM
            target_markets: Optional list of target countries
        
        Returns:
            Dictionary with market forecasts for each country
        """
        if target_markets is None:
            # Expanded list of major markets across different regions for selling finished products
            target_markets = [
                "United States", "United Kingdom", "Japan", "Germany", "Australia", "Canada",
                "France", "Italy", "Spain", "Netherlands", "Sweden", "Switzerland",
                "China", "India", "South Korea", "Singapore", "Hong Kong", "Thailand",
                "Brazil", "Mexico", "Argentina", "Chile", "United Arab Emirates", "South Africa"
            ]
        
        formatted_prompt = market_forecast_prompt.format_messages(
            product_name=product_name,
            product_description=product_description,
            bom_materials=', '.join(bom_materials),
            target_markets=', '.join(target_markets)
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
                model="llama-3.1-8b-instant",  # Faster, cheaper model for market analysis
                messages=messages,
                temperature=0.7,
                max_completion_tokens=4096,  # Increased for more market data
                response_format={"type": "json_object"}
            )
        )
        
        result = self.groq_service._parse_json_response(response.choices[0].message.content)
        
        # Validate and ensure forecasts array exists
        if "forecasts" not in result:
            print(f"⚠️  Warning: Market forecast response missing 'forecasts' key. Response keys: {result.keys()}")
            result["forecasts"] = []
        
        forecasts = result.get("forecasts", [])
        
        # Validate each forecast has required fields
        validated_forecasts = []
        for forecast in forecasts:
            # Ensure all required fields exist with defaults
            validated_forecast = {
                "country": forecast.get("country", "Unknown"),
                "city": forecast.get("city"),
                "demand": float(forecast.get("demand", 50)),
                "competition": float(forecast.get("competition", 50)),
                "price": float(forecast.get("price", 50)),
                "growth": float(forecast.get("growth", 50)),
                "marketSize": forecast.get("marketSize"),
                "avgPrice": forecast.get("avgPrice"),
                "growthPercent": forecast.get("growthPercent"),
                "trend": forecast.get("trend", "stable"),
            }
            validated_forecasts.append(validated_forecast)
        
        result["forecasts"] = validated_forecasts
        
        if len(validated_forecasts) == 0:
            print(f"⚠️  Warning: No market forecasts generated for product '{product_name}'. This may indicate an issue with the AI response.")
        else:
            print(f"✅ Generated {len(validated_forecasts)} market forecasts for product '{product_name}'")
        
        return result


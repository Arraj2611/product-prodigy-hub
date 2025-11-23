"""
Revenue Projection Agent
Expert in financial forecasting and revenue analysis
"""

import json
import asyncio
from typing import Dict, Any, List, TYPE_CHECKING
from .prompts.revenue_projection import revenue_projection_prompt

if TYPE_CHECKING:
    from app.services.groq_service import GroqService


class RevenueProjectionAgent:
    """
    Agent specialized in generating revenue projections
    """
    
    def __init__(self, groq_service: "GroqService"):
        self.groq_service = groq_service
    
    async def generate_projection(
        self,
        product_name: str,
        product_description: str,
        bom_cost: float,
        target_markets: List[str] = None
    ) -> Dict[str, Any]:
        """
        Generate revenue projections for a product
        
        Args:
            product_name: Name of the product
            product_description: Product description
            bom_cost: Total BOM cost
            target_markets: Optional list of target countries
        
        Returns:
            Dictionary with monthly revenue projections
        """
        if target_markets is None:
            target_markets = ["United States", "United Kingdom", "Japan", "Germany"]
        
        # Use web search to get real pricing data
        search_query = f"average selling price for {product_name} in {', '.join(target_markets)} 2024"
        web_results = self.groq_service.search_web(search_query)
        
        formatted_prompt = revenue_projection_prompt.format_messages(
            product_name=product_name,
            product_description=product_description,
            bom_cost=bom_cost,
            target_markets=', '.join(target_markets),
            web_results=web_results.get('results', 'No specific market data available')
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
                max_completion_tokens=2048,
                response_format={"type": "json_object"}
            )
        )
        
        result = self.groq_service._parse_json_response(response.choices[0].message.content)
        return result


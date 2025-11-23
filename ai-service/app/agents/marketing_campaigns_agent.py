"""
Marketing Campaigns Agent
Expert in marketing strategy and campaign planning
"""

import json
import asyncio
from typing import Dict, Any, List, TYPE_CHECKING
from .prompts.marketing_campaigns import marketing_campaigns_prompt

if TYPE_CHECKING:
    from app.services.groq_service import GroqService


class MarketingCampaignsAgent:
    """
    Agent specialized in generating marketing campaign recommendations
    """
    
    def __init__(self, groq_service: "GroqService"):
        self.groq_service = groq_service
    
    async def generate_campaigns(
        self,
        product_name: str,
        product_description: str,
        target_markets: List[str] = None
    ) -> Dict[str, Any]:
        """
        Generate marketing campaign suggestions
        
        Args:
            product_name: Name of the product
            product_description: Product description
            target_markets: Optional list of target countries
        
        Returns:
            Dictionary with campaign recommendations
        """
        if target_markets is None:
            target_markets = ["United States", "United Kingdom"]
        
        # Use web search for current marketing trends
        search_query = f"best marketing strategies for {product_name} in {', '.join(target_markets)} 2024"
        web_results = self.groq_service.search_web(search_query)
        
        formatted_prompt = marketing_campaigns_prompt.format_messages(
            product_name=product_name,
            product_description=product_description,
            target_markets=', '.join(target_markets),
            web_results=web_results.get('results', 'No specific trends available')
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
                temperature=0.7,
                max_completion_tokens=2048,
                response_format={"type": "json_object"}
            )
        )
        
        result = self.groq_service._parse_json_response(response.choices[0].message.content)
        return result


"""
Product Performance Agent
Expert in product performance metrics and analytics
"""

import json
import asyncio
from typing import Dict, Any, List, TYPE_CHECKING
from .prompts.product_performance import product_performance_prompt

if TYPE_CHECKING:
    from app.services.groq_service import GroqService


class ProductPerformanceAgent:
    """
    Agent specialized in generating product performance metrics
    """
    
    def __init__(self, groq_service: "GroqService"):
        self.groq_service = groq_service
    
    async def generate_performance(
        self,
        products: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Generate performance metrics for products
        
        Args:
            products: List of products with their details
        
        Returns:
            Dictionary with performance metrics for each product
        """
        if not products:
            return {"performance": []}
        
        product_list = "\n".join([
            f"- {p.get('name', 'Unknown')}: {p.get('description', 'No description')}"
            for p in products
        ])
        
        formatted_prompt = product_performance_prompt.format_messages(
            product_list=product_list,
            product_count=len(products)
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


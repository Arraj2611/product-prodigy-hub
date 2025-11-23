"""
Supplier Contact Info Agent
Expert in finding business contact information
"""

import json
import asyncio
from typing import Dict, Any, TYPE_CHECKING
from .prompts.supplier_contact_info import supplier_contact_info_prompt

if TYPE_CHECKING:
    from app.services.groq_service import GroqService


class SupplierContactInfoAgent:
    """
    Agent specialized in finding supplier contact information
    """
    
    def __init__(self, groq_service: "GroqService"):
        self.groq_service = groq_service
    
    async def find_contact_info(
        self,
        supplier_name: str,
        city: str,
        country: str,
        website: str = None
    ) -> Dict[str, Any]:
        """
        Find contact email for a supplier
        
        Args:
            supplier_name: Name of the supplier company
            city: City where supplier is located
            country: Country where supplier is located
            website: Optional website URL
        
        Returns:
            Dictionary with contact email and website
        """
        formatted_prompt = supplier_contact_info_prompt.format_messages(
            supplier_name=supplier_name,
            city=city,
            country=country,
            website=website or "Not provided"
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
                temperature=0.2,  # Very low temperature for accurate contact info
                max_completion_tokens=256,  # Small response for just contact info
                response_format={"type": "json_object"}
            )
        )
        
        result = self.groq_service._parse_json_response(response.choices[0].message.content)
        return result


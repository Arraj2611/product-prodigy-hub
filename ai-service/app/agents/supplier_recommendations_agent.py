"""
Supplier Recommendations Agent
Expert in global sourcing and supplier identification
"""

import json
import asyncio
from typing import Dict, Any, List, TYPE_CHECKING
from .prompts.supplier_recommendations import supplier_recommendations_prompt

if TYPE_CHECKING:
    from app.services.groq_service import GroqService


class SupplierRecommendationsAgent:
    """
    Agent specialized in finding legitimate supplier companies
    """
    
    def __init__(self, groq_service: "GroqService"):
        self.groq_service = groq_service
    
    async def find_suppliers(
        self,
        material_name: str,
        material_type: str,
        quantity: float,
        unit: str,
        preferred_countries: List[str] = None
    ) -> Dict[str, Any]:
        """
        Generate supplier recommendations using web search
        
        Args:
            material_name: Name of the material
            material_type: Type of material
            quantity: Required quantity
            unit: Unit of measurement
            preferred_countries: Optional list of preferred countries
        
        Returns:
            Dictionary with supplier recommendations
        """
        if preferred_countries is None:
            preferred_countries = []
        
        formatted_prompt = supplier_recommendations_prompt.format_messages(
            material_name=material_name,
            material_type=material_type,
            quantity=quantity,
            unit=unit,
            preferred_countries=', '.join(preferred_countries) if preferred_countries else "None"
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
                model="llama-3.1-8b-instant",  # Faster, cheaper model for supplier recommendations
                messages=messages,
                temperature=0.3,  # Lower temperature for more accurate supplier data
                max_completion_tokens=4096,  # Higher for detailed supplier info
                response_format={"type": "json_object"}
            )
        )
        
        result = self.groq_service._parse_json_response(response.choices[0].message.content)
        
        # Ensure max 3 best suppliers per material (AI should have already ranked them)
        if "suppliers" in result:
            suppliers = result["suppliers"]
            
            # Remove duplicates by company name
            seen_names = set()
            unique_suppliers = []
            for supplier in suppliers:
                supplier_name = supplier.get("name", "").strip().lower()
                if supplier_name and supplier_name not in seen_names:
                    seen_names.add(supplier_name)
                    unique_suppliers.append(supplier)
            
            # If AI returned more than 3, take the top 3 best ones
            # (AI should have already ranked them, but we ensure here as well)
            if len(unique_suppliers) > 3:
                # Sort by rating, reliability, and price competitiveness
                unique_suppliers.sort(
                    key=lambda s: (
                        s.get("rating", 0) or 0,  # Higher is better
                        s.get("reliability", 0) or 0,  # Higher is better
                        -(s.get("unitPrice", 0) or 999999)  # Lower price is better (negative for reverse sort)
                    ),
                    reverse=True
                )
                unique_suppliers = unique_suppliers[:3]
                print(f"✅ Selected top 3 best suppliers for {material_name} from {len(suppliers)} found")
            elif len(unique_suppliers) == 3:
                print(f"✅ Found exactly 3 suppliers for {material_name}")
            else:
                print(f"⚠️  Found {len(unique_suppliers)} supplier(s) for {material_name} (target: 3, but returning all available)")
            
            result["suppliers"] = unique_suppliers
        
        return result


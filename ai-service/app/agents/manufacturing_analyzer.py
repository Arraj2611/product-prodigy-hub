"""
Manufacturing Analyzer Agent
Specialized agent for manufacturing process analysis
"""

from typing import Dict, Any, TYPE_CHECKING
import json
from .prompts.manufacturing_analysis import manufacturing_analysis_prompt

if TYPE_CHECKING:
    from app.services.groq_service import GroqService


class ManufacturingAnalyzerAgent:
    """Expert agent for manufacturing process analysis"""
    
    def __init__(self, groq_service: "GroqService"):
        self.groq_service = groq_service
    
    async def analyze_manufacturing(
        self,
        product_analysis: Dict[str, Any],
        material_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze manufacturing processes and requirements
        
        Args:
            product_analysis: Result from ProductAnalyzerAgent
            material_analysis: Result from MaterialAnalyzerAgent
        
        Returns:
            Manufacturing process analysis
        """
        # Format prompt using LangChain template
        formatted_prompt = manufacturing_analysis_prompt.format_messages(
            product_analysis=json.dumps(product_analysis, indent=2),
            material_analysis=json.dumps(material_analysis, indent=2)
        )
        
        # Convert to Groq API format
        messages = []
        for msg in formatted_prompt:
            if msg.type == "system":
                messages.append({"role": "system", "content": msg.content})
            elif msg.type == "human":
                messages.append({"role": "user", "content": msg.content})
        
        import asyncio
        response = await asyncio.to_thread(
            self.groq_service._retry_with_backoff,
            lambda: self.groq_service.client.chat.completions.create(
                model=self.groq_service.text_model,
                messages=messages,
                temperature=0.3,
                max_completion_tokens=4096,
                response_format={"type": "json_object"}
            )
        )
        
        result = self.groq_service._parse_json_response(
            response.choices[0].message.content
        )
        
        return result


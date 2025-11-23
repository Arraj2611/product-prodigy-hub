"""
BOM Generator - Core AI logic for generating Bill of Materials
Now using LangGraph agents with Groq API (free tier)
"""
from typing import List, Dict, Any
from app.services.groq_service import GroqService
from app.agents.orchestrator import AnalysisOrchestrator


class BOMGenerator:
    """
    Main BOM generation orchestrator using LangGraph agents
    """
    
    def __init__(self):
        self.groq_service = GroqService()
        self.orchestrator = AnalysisOrchestrator(self.groq_service)
    
    async def generate(
        self,
        images: List[Dict[str, Any]],
        description: str = "",
        yield_buffer: float = 10.0
    ) -> Dict[str, Any]:
        """
        Generate multi-level BOM from images and description using LangGraph agents
        
        Args:
            images: List of image data dictionaries
            description: Textual product description
            yield_buffer: Percentage buffer for material waste (default 10%)
        
        Returns:
            Dictionary containing BOM structure and confidence score
        """
        # Use the orchestrator with all specialized agents
        result = await self.orchestrator.analyze_product(
            images=images,
            description=description,
            yield_buffer=yield_buffer
        )
        
        return {
            "bom": result["bom"],
            "confidence": result.get("confidence", 0.8)
        }

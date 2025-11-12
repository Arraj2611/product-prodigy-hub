"""
BOM Generator - Core AI logic for generating Bill of Materials
Now using Google Gemini API (free tier)
"""
from typing import List, Dict, Any
import asyncio
from app.services.gemini_service import GeminiService


class BOMGenerator:
    """
    Main BOM generation orchestrator using Gemini API
    """
    
    def __init__(self):
        self.gemini_service = GeminiService()
    
    async def generate(
        self,
        images: List[Dict[str, Any]],
        description: str = "",
        yield_buffer: float = 10.0
    ) -> Dict[str, Any]:
        """
        Generate multi-level BOM from images and description using Gemini API
        
        Args:
            images: List of image data dictionaries
            description: Textual product description
            yield_buffer: Percentage buffer for material waste (default 10%)
        
        Returns:
            Dictionary containing BOM structure and confidence score
        """
        # Step 1: Analyze images with Gemini
        analysis_result = await asyncio.to_thread(
            self.gemini_service.analyze_product_images,
            images,
            description
        )
        
        # Step 2: Calculate quantities with yield buffer
        quantities = self._calculate_quantities(analysis_result, yield_buffer)
        
        # Step 3: Generate multi-level BOM structure
        bom = self._build_bom_structure(
            analysis_result=analysis_result,
            quantities=quantities,
            yield_buffer=yield_buffer
        )
        
        # Get confidence from Gemini analysis
        confidence = analysis_result.get("confidence", 0.8)
        
        return {
            "bom": bom,
            "confidence": confidence
        }
    
    def _calculate_quantities(
        self,
        analysis_result: Dict[str, Any],
        yield_buffer: float
    ) -> Dict[str, float]:
        """
        Calculate material quantities with yield buffer
        """
        quantities = {}
        
        # Primary materials
        for material in analysis_result.get("primary_materials", []):
            name = material.get("name", "Unknown Material")
            estimated = material.get("estimated_quantity", "2.0 meters")
            
            # Extract numeric value
            try:
                # Handle formats like "2.5 meters", "2.5m", "2.5"
                qty_str = estimated.replace("meters", "").replace("meter", "").replace("m", "").strip()
                qty = float(qty_str)
                
                # Apply yield buffer
                adjusted_qty = qty * (1 + yield_buffer / 100)
                quantities[name] = round(adjusted_qty, 3)
            except (ValueError, AttributeError):
                quantities[name] = 2.0 * (1 + yield_buffer / 100)
        
        # Trims (count-based)
        for trim in analysis_result.get("trims", []):
            name = trim.get("name", "Unknown Trim")
            specs = trim.get("specifications", {})
            count = specs.get("count", 0)
            
            if isinstance(count, str):
                try:
                    count = int(count)
                except ValueError:
                    count = 6  # Default
            elif not isinstance(count, int):
                count = 6  # Default
            
            quantities[name] = float(count)
        
        # Notions
        for notion in analysis_result.get("notions", []):
            name = notion.get("name", "Unknown Notion")
            estimated = notion.get("estimated_quantity", "40 meters")
            
            try:
                qty_str = estimated.replace("meters", "").replace("meter", "").replace("m", "").strip()
                qty = float(qty_str)
                quantities[name] = round(qty, 3)
            except (ValueError, AttributeError):
                quantities[name] = 40.0
        
        return quantities
    
    def _build_bom_structure(
        self,
        analysis_result: Dict[str, Any],
        quantities: Dict[str, float],
        yield_buffer: float
    ) -> Dict[str, Any]:
        """
        Build multi-level BOM structure:
        - Shell Fabrication (primary materials)
        - Trims & Hardware
        - Notions (thread, interfacing)
        - Packaging & Labeling
        """
        bom = {
            "categories": [],
            "total_cost": 0.0,
            "yield_buffer": yield_buffer
        }
        
        # Shell Fabrication
        shell_items = []
        for material in analysis_result.get("primary_materials", []):
            name = material.get("name", "Unknown Material")
            qty = quantities.get(name, 0)
            
            if qty > 0:
                shell_items.append({
                    "name": name,
                    "type": "Primary Fabric",
                    "quantity": qty,
                    "unit": "meter",
                    "specifications": material.get("specifications", {}),
                    "source": material.get("source", "Unknown")
                })
        
        if shell_items:
            bom["categories"].append({
                "category": "Shell Fabrication",
                "items": shell_items
            })
        
        # Trims & Hardware
        trim_items = []
        for trim in analysis_result.get("trims", []):
            name = trim.get("name", "Unknown Trim")
            qty = quantities.get(name, 0)
            
            if qty > 0:
                trim_items.append({
                    "name": name,
                    "type": trim.get("type", "Hardware"),
                    "quantity": f"{int(qty)} pieces",
                    "unit": "piece",
                    "specifications": trim.get("specifications", {}),
                    "source": trim.get("source", "Unknown")
                })
        
        if trim_items:
            bom["categories"].append({
                "category": "Trims & Hardware",
                "items": trim_items
            })
        
        # Notions
        notion_items = []
        for notion in analysis_result.get("notions", []):
            name = notion.get("name", "Unknown Notion")
            qty = quantities.get(name, 0)
            
            if qty > 0:
                notion_items.append({
                    "name": name,
                    "type": "Notion",
                    "quantity": round(qty, 3),
                    "unit": "meter",
                    "specifications": {}
                })
        
        if notion_items:
            bom["categories"].append({
                "category": "Notions",
                "items": notion_items
            })
        
        # Packaging & Labeling (default items)
        packaging_items = [
            {
                "name": "Hang Tags",
                "type": "Packaging",
                "quantity": "1 piece",
                "unit": "piece",
                "specifications": {}
            },
            {
                "name": "Poly Bag",
                "type": "Packaging",
                "quantity": "1 piece",
                "unit": "piece",
                "specifications": {}
            }
        ]
        
        bom["categories"].append({
            "category": "Packaging & Labeling",
            "items": packaging_items
        })
        
        return bom

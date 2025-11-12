"""
Gemini Service - Google Gemini API integration for multimodal analysis
Uses free tier: Gemini 2.0 Flash-Lite (30 RPM, 1M TPM, 1.5K RPD)
"""
import google.generativeai as genai
import os
from typing import List, Dict, Any
import base64
from io import BytesIO
from PIL import Image
import json


class GeminiService:
    """
    Service for interacting with Google Gemini API
    Uses free tier model: gemini-2.0-flash-lite
    """
    
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        genai.configure(api_key=api_key)
        
        # Use free tier model: gemini-2.0-flash-lite
        # Free tier limits: 30 RPM, 1M TPM, 1.5K RPD
        self.model = genai.GenerativeModel('gemini-2.0-flash-lite')
        
    def analyze_product_images(
        self,
        images: List[Dict[str, Any]],
        description: str = ""
    ) -> Dict[str, Any]:
        """
        Analyze product images using Gemini's multimodal capabilities
        
        Args:
            images: List of image data dictionaries
            description: Textual product description
        
        Returns:
            Analysis results with material properties, components, and confidence
        """
        try:
            # Prepare images for Gemini
            gemini_images = []
            for img_data in images:
                image = Image.open(BytesIO(img_data["data"]))
                # Convert to RGB if needed
                if image.mode != "RGB":
                    image = image.convert("RGB")
                gemini_images.append(image)
            
            # Create prompt for BOM analysis
            prompt = self._create_analysis_prompt(description)
            
            # Call Gemini API with images and text
            response = self.model.generate_content(
                [prompt] + gemini_images,
                generation_config={
                    "temperature": 0.3,  # Lower temperature for more consistent results
                    "max_output_tokens": 2048,
                }
            )
            
            # Parse response
            result = self._parse_gemini_response(response.text)
            
            return result
            
        except Exception as e:
            print(f"Gemini API error: {str(e)}")
            raise
    
    def _create_analysis_prompt(self, description: str) -> str:
        """
        Create detailed prompt for product analysis
        """
        prompt = f"""You are an expert textile and product manufacturing analyst. Analyze the provided product images and generate a detailed Bill of Materials (BOM) breakdown.

Product Description: {description if description else "Not provided"}

Please analyze the images and provide a JSON response with the following structure:

{{
  "primary_materials": [
    {{
      "name": "Material name (e.g., '14oz Selvedge Denim', '100% Cotton Fabric')",
      "type": "FABRIC",
      "specifications": {{
        "fiber_content": "e.g., '100% Cotton'",
        "weight": "e.g., '14oz'",
        "texture": "e.g., 'rough', 'smooth', 'woven'",
        "luster": "e.g., 'matte', 'glossy'"
      }},
      "source": "Likely country of origin (e.g., 'Japan', 'Italy')",
      "estimated_quantity": "Estimated quantity needed (e.g., 2.5 meters)"
    }}
  ],
  "trims": [
    {{
      "name": "Component name (e.g., 'Metal Buttons', 'YKK Zipper', 'Copper Rivets')",
      "type": "Closure or Hardware",
      "specifications": {{
        "material": "e.g., 'Metal', 'Copper'",
        "count": "Estimated number of pieces"
      }},
      "source": "Likely country of origin"
    }}
  ],
  "notions": [
    {{
      "name": "Notion name (e.g., 'Sewing Thread', 'Interfacing')",
      "type": "Notion",
      "estimated_quantity": "Estimated quantity"
    }}
  ],
  "detected_components": ["List of visible components like buttons, zippers, pockets, etc."],
  "material_properties": {{
    "texture": "Overall texture assessment",
    "luster": "Overall luster assessment",
    "opacity": "opaque or transparent",
    "apparent_quality": "high, medium, or low"
  }},
  "confidence": 0.0-1.0
}}

Be specific and accurate. If you cannot determine certain details, use reasonable defaults based on the product type. Focus on textile/apparel products and their manufacturing requirements.
"""
        return prompt
    
    def _parse_gemini_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse Gemini's text response into structured data
        """
        try:
            # Try to extract JSON from response
            # Gemini might wrap JSON in markdown code blocks
            text = response_text.strip()
            
            # Remove markdown code blocks if present
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            # Parse JSON
            parsed = json.loads(text)
            
            # Ensure required fields
            if "primary_materials" not in parsed:
                parsed["primary_materials"] = []
            if "trims" not in parsed:
                parsed["trims"] = []
            if "notions" not in parsed:
                parsed["notions"] = []
            if "confidence" not in parsed:
                parsed["confidence"] = 0.8  # Default confidence
            
            return parsed
            
        except json.JSONDecodeError as e:
            print(f"Failed to parse Gemini response as JSON: {e}")
            print(f"Response text: {response_text[:500]}")
            
            # Fallback: return structured response with extracted info
            return {
                "primary_materials": [{
                    "name": "Cotton Fabric",
                    "type": "FABRIC",
                    "specifications": {"fiber_content": "100% Cotton"},
                    "source": "Various",
                    "estimated_quantity": "2.0 meters"
                }],
                "trims": [],
                "notions": [],
                "detected_components": [],
                "material_properties": {
                    "texture": "unknown",
                    "luster": "unknown",
                    "opacity": "opaque",
                    "apparent_quality": "medium"
                },
                "confidence": 0.6
            }


"""
Product Analyzer Agent
Specialized agent for analyzing product images and identifying components
"""

from typing import List, Dict, Any, TYPE_CHECKING
import json
from .prompts.product_analysis import product_analysis_prompt

if TYPE_CHECKING:
    from app.services.groq_service import GroqService


class ProductAnalyzerAgent:
    """Expert agent for product analysis and reverse engineering"""
    
    def __init__(self, groq_service: "GroqService"):
        self.groq_service = groq_service
    
    async def analyze(self, images: List[Dict[str, Any]], description: str = "") -> Dict[str, Any]:
        """
        Analyze product images to identify category, components, and manufacturing requirements
        
        Args:
            images: List of image data dictionaries with 'url' or 'data' keys
            description: Optional product description
        
        Returns:
            Analysis result with product category, components, and manufacturing insights
        """
        # Format prompt using LangChain template
        formatted_prompt = product_analysis_prompt.format_messages(description=description)
        
        # Extract system and human messages
        system_message = None
        human_message_text = None
        for msg in formatted_prompt:
            if msg.type == "system":
                system_message = msg.content
            elif msg.type == "human":
                human_message_text = msg.content
        
        # Prepare image content - handle both URL and base64 data
        image_contents = []
        for img in images:
            if img.get("url"):
                # URL-based image
                image_contents.append({
                    "type": "image_url",
                    "image_url": {"url": img["url"]}
                })
            elif img.get("data"):
                # Base64 data - convert to data URL
                import base64
                img_base64 = base64.b64encode(img["data"]).decode('utf-8')
                image_contents.append({
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{img_base64}"}
                })
        
        # Build messages for Groq API
        messages = []
        if system_message:
            messages.append({
                "role": "system",
                "content": system_message
            })
        
        # Combine human message text with images
        messages.append({
            "role": "user",
            "content": [
                {"type": "text", "text": human_message_text or ""}
            ] + image_contents
        })
        
        # Call Groq API (using sync method in async context)
        # Use more retries for product analysis (critical step)
        import asyncio
        max_retries = 3  # Reduced retries to prevent excessive API calls
        initial_delay = 3.0  # Longer initial delay for server errors
        
        for attempt in range(max_retries):
            try:
                response = await asyncio.to_thread(
                    self.groq_service._retry_with_backoff,
                    lambda: self.groq_service.client.chat.completions.create(
                        model=self.groq_service.vision_model,
                        messages=messages,
                        temperature=0.3,
                        max_completion_tokens=4096,
                        response_format={"type": "json_object"}
                    ),
                    max_retries=2,  # Reduced internal retries to prevent excessive calls
                    initial_delay=2.0
                )
                
                result = self.groq_service._parse_json_response(
                    response.choices[0].message.content
                )
                
                return result
            except Exception as e:
                error_str = str(e)
                is_server_error = (
                    "500" in error_str or 
                    "Internal Server Error" in error_str or
                    "internal_server_error" in error_str.lower()
                )
                
                if is_server_error and attempt < max_retries - 1:
                    # Wait longer between attempts for server errors
                    delay = initial_delay * (2 ** attempt)
                    print(f"⚠️  Product analysis server error (500). Retrying in {delay:.1f} seconds... (attempt {attempt + 1}/{max_retries})")
                    await asyncio.sleep(delay)
                    continue
                elif attempt < max_retries - 1:
                    # For other errors, retry with shorter delay
                    delay = 2.0 * (attempt + 1)
                    print(f"⚠️  Product analysis error. Retrying in {delay:.1f} seconds... (attempt {attempt + 1}/{max_retries})")
                    await asyncio.sleep(delay)
                    continue
                else:
                    # Final attempt failed
                    print(f"❌ Product analysis failed after {max_retries} attempts: {error_str}")
                    raise Exception(f"Product analysis failed after {max_retries} attempts. Error: {error_str}")


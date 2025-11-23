"""
Material Analyzer Agent
Specialized agent for identifying and specifying materials
"""

from typing import List, Dict, Any, TYPE_CHECKING
import json
from .prompts.material_analysis import material_analysis_prompt

if TYPE_CHECKING:
    from app.services.groq_service import GroqService


class MaterialAnalyzerAgent:
    """Expert agent for material identification and specification"""
    
    def __init__(self, groq_service: "GroqService"):
        self.groq_service = groq_service
    
    async def analyze_materials(
        self, 
        product_analysis: Dict[str, Any],
        images: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Analyze and specify all materials required for the product
        
        Args:
            product_analysis: Result from ProductAnalyzerAgent
            images: Product images for reference
        
        Returns:
            Detailed material specifications with pricing
        """
        # Format prompt using LangChain template
        formatted_prompt = material_analysis_prompt.format_messages(
            product_analysis=json.dumps(product_analysis, indent=2)
        )
        
        # Convert to Groq API format
        messages = []
        for msg in formatted_prompt:
            if msg.type == "system":
                messages.append({"role": "system", "content": msg.content})
            elif msg.type == "human":
                messages.append({"role": "user", "content": msg.content})
        
        import asyncio
        
        # Retry logic for truncated responses
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = await asyncio.to_thread(
                    self.groq_service._retry_with_backoff,
                    lambda: self.groq_service.client.chat.completions.create(
                        model="llama-3.3-70b-versatile",  # Use faster model with higher token limit
                        messages=messages,
                        temperature=0.3,
                        max_completion_tokens=32768,  # Higher limit for comprehensive material analysis
                        response_format={"type": "json_object"}
                    )
                )
                
                response_text = response.choices[0].message.content
                
                # Check if response was truncated
                if response.choices[0].finish_reason == "length":
                    print(f"⚠️  Warning: Material analysis response truncated (attempt {attempt + 1}/{max_retries})")
                    if attempt < max_retries - 1:
                        # Try again with a prompt that requests more concise output
                        messages[-1]["content"] += "\n\nIMPORTANT: Provide a more concise response while maintaining all essential material data. Focus on key materials and categories only."
                        continue
                
                result = self.groq_service._parse_json_response(response_text)
                
                # Validate that we got categories
                if "categories" in result and len(result.get("categories", [])) > 0:
                    return result
                else:
                    print(f"⚠️  Warning: Response missing categories (attempt {attempt + 1}/{max_retries})")
                    if attempt < max_retries - 1:
                        continue
                
                return result
                
            except Exception as e:
                print(f"Error in material analysis (attempt {attempt + 1}/{max_retries}): {str(e)}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
                    continue
                else:
                    # Return fallback structure with empty categories
                    return {
                        "categories": [],
                        "error": f"Material analysis failed: {str(e)}"
                    }
        
        # Should not reach here, but just in case
        return {"categories": []}


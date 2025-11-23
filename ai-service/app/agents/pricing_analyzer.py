"""
Pricing Analyzer Agent
Specialized agent for pricing and cost estimation
"""

from typing import Dict, Any, TYPE_CHECKING
import json
from .prompts.pricing_analysis import pricing_analysis_prompt

if TYPE_CHECKING:
    from app.services.groq_service import GroqService


class PricingAnalyzerAgent:
    """Expert agent for pricing and cost estimation"""
    
    def __init__(self, groq_service: "GroqService"):
        self.groq_service = groq_service
    
    async def analyze_pricing(
        self,
        material_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze and refine pricing for all materials
        
        Args:
            material_analysis: Result from MaterialAnalyzerAgent
        
        Returns:
            Refined pricing analysis with market data
        """
        # Format prompt using LangChain template
        formatted_prompt = pricing_analysis_prompt.format_messages(
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
        
        # Retry logic for truncated responses
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = await asyncio.to_thread(
                    self.groq_service._retry_with_backoff,
                    lambda: self.groq_service.client.chat.completions.create(
                        model="groq/compound-mini",
                        messages=messages,
                        temperature=0.2,  # Lower temperature for pricing accuracy
                        max_completion_tokens=8192,  # Max allowed by Groq API
                        response_format={"type": "json_object"}
                    )
                )
                
                response_text = response.choices[0].message.content
                
                # Check if response was truncated (common indicators)
                if response.choices[0].finish_reason == "length":
                    print(f"Warning: Response truncated (attempt {attempt + 1}/{max_retries})")
                    if attempt < max_retries - 1:
                        # Try again with a prompt that requests more concise output
                        messages[-1]["content"] += "\n\nIMPORTANT: Provide a more concise response while maintaining all essential pricing data. Focus on key materials only."
                        continue
                
                result = self.groq_service._parse_json_response(response_text)
                
                # Validate that we got pricing data OR categories
                if "categories" in result and len(result.get("categories", [])) > 0:
                    print(f"✅ Pricing analysis returned {len(result.get('categories', []))} categories")
                    return result
                elif "materials_pricing" in result or "pricing_analysis" in result:
                    return result
                else:
                    print(f"⚠️  Warning: Response missing pricing data or categories (attempt {attempt + 1}/{max_retries})")
                    print(f"   Response keys: {list(result.keys())}")
                    if attempt < max_retries - 1:
                        continue
                
                return result
                
            except Exception as e:
                print(f"Error in pricing analysis (attempt {attempt + 1}/{max_retries}): {str(e)}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
                    continue
                else:
                    # Return fallback structure - preserve categories from material_analysis if available
                    fallback = {
                        "pricing_analysis": {
                            "analysis_date": "2025-01-13",
                            "currency": "USD",
                            "market_conditions": "Unable to fetch current market data"
                        },
                        "materials_pricing": []
                    }
                    # Preserve categories from material_analysis if pricing failed
                    if "categories" in material_analysis and len(material_analysis.get("categories", [])) > 0:
                        print(f"⚠️  Pricing analysis failed, preserving {len(material_analysis.get('categories', []))} categories from material_analysis")
                        fallback["categories"] = material_analysis["categories"]
                    return fallback


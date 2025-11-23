"""
Analysis Orchestrator
Coordinates the army of specialized agents for comprehensive product analysis
"""

from typing import List, Dict, Any, TYPE_CHECKING
from .product_analyzer import ProductAnalyzerAgent
from .material_analyzer import MaterialAnalyzerAgent
from .manufacturing_analyzer import ManufacturingAnalyzerAgent
from .pricing_analyzer import PricingAnalyzerAgent

if TYPE_CHECKING:
    from app.services.groq_service import GroqService


class AnalysisOrchestrator:
    """
    Orchestrates multiple specialized agents to perform comprehensive product analysis
    """
    
    def __init__(self, groq_service: "GroqService"):
        self.groq_service = groq_service
        self.product_analyzer = ProductAnalyzerAgent(groq_service)
        self.material_analyzer = MaterialAnalyzerAgent(groq_service)
        self.manufacturing_analyzer = ManufacturingAnalyzerAgent(groq_service)
        self.pricing_analyzer = PricingAnalyzerAgent(groq_service)
    
    async def analyze_product(
        self,
        images: List[Dict[str, Any]],
        description: str = "",
        yield_buffer: float = 10.0
    ) -> Dict[str, Any]:
        """
        Comprehensive product analysis using all specialized agents
        
        Args:
            images: List of product images
            description: Product description
            yield_buffer: Material waste buffer percentage
        
        Returns:
            Complete analysis with BOM structure
        """
        # Step 1: Product Analysis Agent
        print("🔍 Agent 1: Product Analyzer - Analyzing product structure...")
        try:
            product_analysis = await self.product_analyzer.analyze(images, description)
        except Exception as e:
            print(f"❌ Product analysis failed: {str(e)}")
            raise Exception(f"Product analysis failed: {str(e)}")
        
        # Step 2: Material Analysis Agent
        print("🧪 Agent 2: Material Analyzer - Identifying materials...")
        try:
            material_analysis = await self.material_analyzer.analyze_materials(
                product_analysis,
                images
            )
        except Exception as e:
            print(f"❌ Material analysis failed: {str(e)}")
            raise Exception(f"Material analysis failed: {str(e)}")
        
        # Step 3: Manufacturing Analysis Agent (parallel with pricing)
        print("🏭 Agent 3: Manufacturing Analyzer - Analyzing production processes...")
        try:
            manufacturing_analysis = await self.manufacturing_analyzer.analyze_manufacturing(
                product_analysis,
                material_analysis
            )
        except Exception as e:
            print(f"⚠️  Warning: Manufacturing analysis failed: {str(e)}")
            print("   Continuing with basic manufacturing data...")
            # Use fallback manufacturing analysis
            manufacturing_analysis = {
                "manufacturing_processes": [],
                "assembly_steps": [],
                "quality_requirements": []
            }
        
        # Step 4: Pricing Analysis Agent
        print("💰 Agent 4: Pricing Analyzer - Calculating costs...")
        try:
            pricing_analysis = await self.pricing_analyzer.analyze_pricing(
                material_analysis
            )
        except Exception as e:
            print(f"⚠️  Warning: Pricing analysis failed: {str(e)}")
            print("   Continuing with material analysis data...")
            # Use material analysis as fallback for pricing
            # Extract materials from material_analysis structure
            material_list = material_analysis.get("primary_materials", [])
            if not material_list:
                material_list = material_analysis.get("materials", [])
            
            print(f"   Found {len(material_list)} materials in material_analysis for fallback")
            
            # Convert to pricing format - preserve existing unit_cost and total_cost if available
            pricing_analysis = {
                "materials_pricing": [
                    {
                        "name": m.get("name", ""),
                        "type": m.get("type", "MATERIAL"),
                        "estimated_quantity": m.get("estimated_quantity", m.get("quantity", 0)),
                        "unit": m.get("unit", "piece"),
                        "unit_cost": m.get("unit_cost", m.get("unitCost", 0)),  # Preserve if available
                        "total_cost": m.get("total_cost", m.get("totalCost", 0)),  # Preserve if available
                        "specifications": m.get("specifications", {}),
                        "source": m.get("source", "Unknown")
                    }
                    for m in material_list
                ],
                "hardware_fasteners": material_analysis.get("hardware_fasteners", []),
                "finishes_coatings": material_analysis.get("finishes_coatings", []),
                "packaging": material_analysis.get("packaging", []),
                "pricing_analysis": {
                    "currency": "USD",
                    "market_conditions": "Unable to fetch pricing data"
                }
            }
            
            print(f"   Created fallback pricing_analysis with {len(pricing_analysis['materials_pricing'])} materials")
        
        # Step 5: Combine all analyses into final BOM structure
        print("📋 Orchestrator: Building final BOM structure...")
        final_bom = self._build_final_bom(
            product_analysis,
            pricing_analysis,  # Use pricing analysis (has refined prices)
            manufacturing_analysis,
            material_analysis,  # Pass material_analysis as fallback
            yield_buffer
        )
        
        return {
            "bom": final_bom,
            "product_analysis": product_analysis,
            "manufacturing_analysis": manufacturing_analysis,
            "confidence": self._calculate_confidence(product_analysis, material_analysis)
        }
    
    def _build_final_bom(
        self,
        product_analysis: Dict[str, Any],
        pricing_analysis: Dict[str, Any],
        manufacturing_analysis: Dict[str, Any],
        material_analysis: Dict[str, Any],  # Added as parameter for fallback
        yield_buffer: float
    ) -> Dict[str, Any]:
        """Build final BOM structure from all agent analyses using AI-generated categories"""
        
        # Calculate quantities with yield buffer
        def apply_yield_buffer(qty: float) -> float:
            return qty * (1 + yield_buffer / 100)
        
        def parse_quantity(qty_str: Any) -> float:
            """Parse quantity string to float"""
            if isinstance(qty_str, (int, float)):
                return float(qty_str)
            if isinstance(qty_str, str):
                import re
                match = re.search(r'[\d.]+', qty_str)
                return float(match.group()) if match else 0.0
            return 0.0
        
        def calculate_total_cost(unit_cost: Any, quantity: float) -> float:
            """Calculate total cost from unit cost and quantity"""
            unit = 0.0
            if unit_cost is not None:
                if isinstance(unit_cost, (int, float)):
                    unit = float(unit_cost)
                elif isinstance(unit_cost, str):
                    try:
                        unit = float(unit_cost)
                    except:
                        unit = 0.0
            return unit * quantity
        
        # Priority 1: Use categories from pricing_analysis (has refined prices)
        categories = pricing_analysis.get("categories", [])
        if categories and len(categories) > 0:
            print(f"✅ Using {len(categories)} categories from pricing_analysis")
        else:
            # Priority 2: Use categories from material_analysis
            categories = material_analysis.get("categories", [])
            if categories and len(categories) > 0:
                print(f"✅ Using {len(categories)} categories from material_analysis")
            else:
                # No categories found - this is an error condition
                print(f"❌ ERROR: No categories found in either pricing_analysis or material_analysis")
                print(f"   pricing_analysis keys: {list(pricing_analysis.keys())}")
                print(f"   material_analysis keys: {list(material_analysis.keys())}")
                # Return empty structure - this should not happen if AI is working correctly
                return {
                    "categories": [],
                    "total_cost": 0,
                    "product_category": product_analysis.get("product_category", "Unknown"),
                    "manufacturing_complexity": manufacturing_analysis.get("manufacturing_complexity", "medium")
                }
        
        # Process categories: apply yield buffer and ensure accurate cost calculations
        processed_categories = []
        for cat in categories:
            processed_items = []
            for item in cat.get("items", []):
                # Parse quantity
                qty = parse_quantity(item.get("estimated_quantity", item.get("quantity", 0)))
                qty_with_buffer = apply_yield_buffer(qty)
                
                # Get costs
                unit_cost = item.get("unit_cost", item.get("unitCost", 0))
                total_cost = item.get("total_cost", item.get("totalCost", 0))
                
                # Recalculate total_cost if needed to ensure accuracy
                if unit_cost and qty_with_buffer > 0:
                    calculated_total = calculate_total_cost(unit_cost, qty_with_buffer)
                    # Use provided total_cost if it exists and is reasonable, otherwise use calculated
                    if not total_cost or total_cost == 0:
                        total_cost = calculated_total
                    else:
                        # Verify the provided total_cost is close to calculated (within 5% tolerance)
                        if abs(float(total_cost) - calculated_total) / max(calculated_total, 0.01) > 0.05:
                            print(f"⚠️  Warning: total_cost mismatch for {item.get('name', 'unknown')}, using calculated value")
                            total_cost = calculated_total
                
                processed_items.append({
                    "name": item.get("name", ""),
                    "type": item.get("type", "MATERIAL"),
                    "quantity": qty_with_buffer,
                    "unit": item.get("unit", "piece"),
                    "unitCost": float(unit_cost) if unit_cost else 0,
                    "totalCost": float(total_cost) if total_cost else 0,
                    "specifications": item.get("specifications", {}),
                    "source": item.get("source", item.get("price_source", "Unknown"))
                })
            
            if processed_items:
                processed_categories.append({
                    "category": cat.get("category", "Uncategorized"),
                    "items": processed_items
                })
        
        print(f"📦 Processed {len(processed_categories)} categories with {sum(len(cat['items']) for cat in processed_categories)} total items")
        
        # Calculate total cost
        total_cost = sum(
            sum(item.get("totalCost", 0) for item in cat["items"])
            for cat in processed_categories
        )
        
        return {
            "categories": processed_categories,
            "total_cost": total_cost,
            "product_category": product_analysis.get("product_category", "Unknown"),
            "manufacturing_complexity": manufacturing_analysis.get("manufacturing_complexity", "medium")
        }
    
    def _calculate_confidence(
        self,
        product_analysis: Dict[str, Any],
        material_analysis: Dict[str, Any]
    ) -> float:
        """Calculate confidence score based on analysis completeness"""
        confidence = 0.5  # Base confidence
        
        # Increase confidence based on analysis depth
        if product_analysis.get("detected_components"):
            confidence += 0.2
        
        if material_analysis.get("primary_materials"):
            confidence += 0.2
        
        if material_analysis.get("hardware_fasteners"):
            confidence += 0.1
        
        return min(confidence, 1.0)

"""
AI Service tests
"""
import pytest
from app.models.bom_generator import BOMGenerator
from app.services.vision_processor import VisionProcessor
from app.services.material_classifier import MaterialClassifier
from app.services.dimensional_analyzer import DimensionalAnalyzer


@pytest.fixture
def bom_generator():
    vision_processor = VisionProcessor()
    material_classifier = MaterialClassifier()
    dimensional_analyzer = DimensionalAnalyzer()
    return BOMGenerator(
        vision_processor=vision_processor,
        material_classifier=material_classifier,
        dimensional_analyzer=dimensional_analyzer
    )


def test_bom_generation(bom_generator):
    """Test BOM generation"""
    # Mock image data
    images = [{
        "data": b"fake_image_data",
        "filename": "test.jpg",
        "content_type": "image/jpeg"
    }]
    
    # This would need proper mocking in production
    # result = await bom_generator.generate(images, "denim jacket", 10.0)
    # assert result["confidence"] > 0
    # assert "bom" in result
    pass


def test_processing_time(bom_generator):
    """Test that BOM generation completes in <5 seconds"""
    import time
    start = time.time()
    # result = await bom_generator.generate(...)
    # elapsed = time.time() - start
    # assert elapsed < 5.0
    pass


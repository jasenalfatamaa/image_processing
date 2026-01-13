import pytest
import os
from PIL import Image
from tasks import process_image_task

def test_process_image_grayscale(tmp_path):
    # Setup: Create a temporary RGB image
    img_path = tmp_path / "test.png"
    img = Image.new('RGB', (100, 100), color=(255, 0, 0))
    img.save(img_path)
    
    # Execute: Run task logic (mocking the Celery part by calling function directly if possible)
    # Since process_image_task is a Celery task, we test the logic inside it.
    # We can mock the result or just check the output file.
    options = {"grayscale": True, "resize": False, "compress": False, "target_format": "original"}
    result = process_image_task.run(str(img_path), "test.png", options)
    
    # Verify
    assert result["status"] == "SUCCESS"
    processed_path = os.path.join("processed_images", result["filename"])
    assert os.path.exists(processed_path)
    
    with Image.open(processed_path) as p_img:
        assert p_img.mode == "L" # Grayscale mode

def test_process_image_resize(tmp_path):
    img_path = tmp_path / "test_resize.png"
    img = Image.new('RGB', (200, 200), color=(0, 255, 0))
    img.save(img_path)
    
    options = {"grayscale": False, "resize": True, "target_width": "100", "target_height": "100", "compress": False, "target_format": "original"}
    result = process_image_task.run(str(img_path), "test_resize.png", options)
    
    processed_path = os.path.join("processed_images", result["filename"])
    with Image.open(processed_path) as p_img:
        assert p_img.size == (100, 100)

import os
import time
from celery import Celery
from PIL import Image, ImageOps, ImageEnhance
from config import settings

# setup celery
celery_app = Celery(
    'image_task',
    broker = settings.CELERY_BROKER_URL,
    backend = settings.CELERY_RESULT_BACKEND
)

@celery_app.task(name="process_image_task")
def process_image_task(file_path, filename, options):
    try:
        # Simulate processing time for better UX visibility of states
        time.sleep(1.2) 
        
        img = Image.open(file_path)
        original_format = img.format # Save this before any conversion
        
        # 1. Resize (optimized)
        target_w = options.get("target_width")
        target_h = options.get("target_height")
        
        if options.get("resize"):
            if target_w or target_h:
                # Use provided dimensions
                w = int(target_w) if target_w else img.size[0]
                h = int(target_h) if target_h else img.size[1]
                
                # If only one is provided, keep aspect ratio
                if target_w and not target_h:
                    h = int((float(img.size[1]) * float(w / img.size[0])))
                elif target_h and not target_w:
                    w = int((float(img.size[0]) * float(h / img.size[1])))
                
                img = img.resize((w, h), Image.Resampling.LANCZOS)
            else:
                # Default behavior: 800px width
                base_width = 800
                w_percent = (base_width / float(img.size[0]))
                h_size = int((float(img.size[1]) * float(w_percent)))
                img = img.resize((base_width, h_size), Image.Resampling.LANCZOS)

        # 2. Preserve original mode or convert as needed
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGBA")
        else:
            img = img.convert("RGB")

        # 3. Grayscale
        if options.get("grayscale"): 
            img = ImageOps.grayscale(img)
        
        # 4. Format selection
        target_format_opt = options.get("target_format", "original")
        if target_format_opt == "original":
            # Use original format if possible, otherwise fallback
            save_format = original_format or "JPEG"
        else:
            save_format = target_format_opt.upper()
            if save_format == "JPG": save_format = "JPEG"
        
        # 5. Saving with Optimization and Compression fix
        save_params = {"optimize": True}
        
        # If compressing, use lower quality but ensure optimize is ON
        if options.get("compress"):
            if save_format == "JPEG":
                save_params["quality"] = 55 # Aggressive but usually okay
                if img.mode == "RGBA":
                    img = img.convert("RGB") # JPEG doesn't support alpha
            elif save_format == "PNG":
                save_params["compress_level"] = 8 # High compression for PNG
            elif save_format == "WEBP":
                save_params["quality"] = 50
        else:
            # Not compressing: High quality
            if save_format == "JPEG":
                save_params["quality"] = 90
                if img.mode == "RGBA":
                    img = img.convert("RGB")
            elif save_format == "WEBP":
                save_params["quality"] = 85
        
        file_name = f"processed_{os.path.basename(file_path)}"
        output_path = os.path.join("processed_images", file_name)
        
        # ACTUALLY SAVE
        img.save(output_path, format=save_format, **save_params)

        return {
            "status": "SUCCESS",
            "file": output_path,
            "filename": file_name,
            "size_bytes": os.path.getsize(output_path),
            "dimensions": img.size,
            "format": save_format
        }
    
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return {
            "status": "FAILURE",
            "error": str(e)
        }

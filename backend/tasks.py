import os
import time
from celery import Celery
from PIL import Image
from config import settings

# setup celery
celery_app = Celery(
    'image_task',
    broker = settings.CELERY_BROKER_URL,
    backend = settings.CELERY_RESULT_BACKEND
)

@celery_app.task(name="process_image_task")
def process_image_task(file_path, filename):
    """
    Tugas asinkron: resize gambar dan ubah jadi hitam putih.
    """

    try:
        time.sleep(5)

        with Image.open(file_path) as img:
            img = img.convert("L") # greyscale
            img.thumbnail((300,300)) # resize

            output_folder = "processed_images"
            output_path = os.path.join(output_folder, f"processed_{filename}")
            img.save(output_path)

        return {"status": "success", "file": output_path}
    
    except Exception as e:
        return {"status": "failed", "error": str(e)}
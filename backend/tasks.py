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
def process_image_task(file_path, filename, options):
    img = Image.open(file_path)

    # 1. Logika Grayscale
    if options.get("grayscale"): 
        img = img.convert("L")
    
    # 2. Logika resize (contoh ke 800px width, aspect ratio terjaga)
    if options.get("resize"):
        base_width = 600
        w_percent = (base_width / float(img.size[0]))
        h_size = int((float(img.size[1]) * float(w_percent)))
        img = img.resize((base_width, h_size), Image.Resampling.LANCZOS)

    # 3. Logika format conversion & save
    target_format = options.get("target_format", "original")
    if target_format == "original":
        save_format = img.format or "JPEG" # simpan sesuai format asli atau fallback ke jpeg jika format tidak terdeteksi 
        #output_path = f"processed_images/processed_{os.path.basename(file_path)}"
    else:
        save_format = target_format
        #file_name = os.path.splitext(os.path.basename(file_path))[0]
        #output_path = f"processed_images/{file_name}.{target_format}"
    
    # 4. Logika Kompresi
    # buat parameter tambahan untuk fungsi save
    save_params = {"format": save_format}

    if options.get("compress"):
        save_params["optimize"] = True

        if save_format.upper() in ["JPEG", "JPG", "WEBP"]:
            save_params["quality"] = 60  # atur kualitas kompresi sesuai kebutuhan
        elif save_format.upper() == "PNG":
            save_params["compress_level"] = 5  # tingkat kompresi tertinggi untuk PNG
    else:
        save_params["quality"] = 95  # kualitas tinggi tanpa kompresi signifikan
        save_params["optimize"] = False
    
    file_name = f"processed_{os.path.basename(file_path)}"
    output_path = os.path.join("processed_images", file_name)
    
    # SImpan dengan parameter kompresi
    img.save(output_path, **save_params)

    # ambil ukuran file dalam byte
    file_size = os.path.getsize(output_path)
    return {
        "status": "SUCCESS",
        "file": output_path,
        "size_bytes": file_size
    }



"""
    
    Tugas asinkron: resize gambar dan ubah jadi hitam putih.
    

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

"""
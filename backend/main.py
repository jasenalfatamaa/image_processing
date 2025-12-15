import shutil
import os
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from tasks import process_image_task, celery_app
from celery.result import AsyncResult

app = FastAPI()


# SETUP FOLDER DAN CORS
UPLOAD_FOLDER = "uploads"
PROCESSED_FOLDER = "processed_images"
for f in [UPLOAD_FOLDER, PROCESSED_FOLDER]:
    if not os.path.exists(f):
        os.makedirs(f)


# CORS untuk komunikasi dengan frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)


# Endpoint untuk serve gambar hasil
app.mount("/results", StaticFiles(directory=PROCESSED_FOLDER), name = "results")

@app.post("/upload/")
async def upload_image(file: UploadFile = File(...)):
    # simpan file asli
    file_location = os.path.join(UPLOAD_FOLDER, file.filename)
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # kirim tugas ke celery secara asynchronous
    task = process_image_task.delay(file_location, file.filename)

    return {
        "task_id": task.id,
        "filename": file.filename
    }

@app.get("/status/{task_id}")
async def get_status(task_id: str):
    # cek status tugas
    task_result = AsyncResult(task_id, app=celery_app)

    return {
        "status": task_result.state,
        "result": task_result.result if task_result.ready() else None
    }
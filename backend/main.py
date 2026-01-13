import shutil
import os
import asyncio
import json
import magic
from fastapi import FastAPI, UploadFile, File, Form, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from tasks import process_image_task, celery_app
from celery.result import AsyncResult
from pydantic import BaseModel
from typing import Optional, List

app = FastAPI(title="NeoProcessor API", version="2.0")

# SETUP FOLDER
UPLOAD_FOLDER = "uploads"
PROCESSED_FOLDER = "processed_images"
for f in [UPLOAD_FOLDER, PROCESSED_FOLDER]:
    if not os.path.exists(f):
        os.makedirs(f)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

# Serve static files
app.mount("/results", StaticFiles(directory=PROCESSED_FOLDER), name = "results")

# File validation helper
def validate_file(file: UploadFile):
    content_type = file.content_type
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

@app.post("/upload/")
async def upload_image(
    file: UploadFile = File(...),
    options: str = Form(...) 
):
    validate_file(file)
    
    options_dict = json.loads(options)
    
    # Generate unique filename to avoid collisions
    import uuid
    ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{ext}"
    
    file_location = os.path.join(UPLOAD_FOLDER, unique_filename)
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # kirim tugas ke celery
    task = process_image_task.delay(file_location, unique_filename, options_dict)

    return {
        "task_id": task.id,
        "filename": unique_filename
    }

@app.get("/status/{task_id}")
async def get_status(task_id: str):
    task_result = AsyncResult(task_id, app=celery_app)
    return {
        "status": task_result.state,
        "result": task_result.result if task_result.ready() else None
    }

@app.websocket("/ws/status/{task_id}")
async def status_websocket(websocket: WebSocket, task_id: str):
    await websocket.accept()
    try:
        while True:
            task_result = AsyncResult(task_id, app=celery_app)
            status_data = {
                "status": task_result.state,
                "result": task_result.result if task_result.ready() else None
            }
            await websocket.send_json(status_data)
            
            if task_result.ready():
                break
                
            await asyncio.sleep(1) # Poll every 1 second and push via WS
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WS Error: {e}")
    finally:
        await websocket.close()

@app.get("/history/")
async def get_history():
    files = []
    if os.path.exists(PROCESSED_FOLDER):
        for f in os.listdir(PROCESSED_FOLDER):
            if f.startswith("processed_"):
                files.append({
                    "url": f"/results/{f}",
                    "name": f
                })
    return {"history": files[::-1][:10]} # Return last 10 items

@app.get("/download/{filename}")
async def download_file(filename: str):
    file_path = os.path.join(PROCESSED_FOLDER, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type='application/octet-stream'
    )

@app.get("/")
def read_root():
    return {
        "name": "NeoProcessor API",
        "status": "Online",
        "version": "2.0",
        "features": ["WebSockets", "Celery Workers", "AI Filters"]
    }
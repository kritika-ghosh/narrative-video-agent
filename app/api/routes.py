import os
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks
from typing import List
from .schemas import JobResponse, JobStatusResponse
from app.pipeline_runner import run_video_pipeline

router = APIRouter()
fake_database = {}

@router.post("/generate", response_model=JobResponse)
async def start_video_generation(
    background_tasks: BackgroundTasks,
    images: List[UploadFile] = File(description="Upload your target image files directly here"),
    prompt: str = Form(description="Enter the core text prompt narrative context"),
    theme: str = Form(default="cinematic", description="Enter optional aesthetic theme rules")
):
    """
    Asynchronously ingest direct file payloads and kick off the graph production timeline pipeline.
    """
    job_id = str(uuid.uuid4())
    
    upload_dir = "data/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    saved_image_paths = []
    for img in images:
        file_path = os.path.join(upload_dir, f"{job_id}_{img.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(img.file, buffer)
        saved_image_paths.append(file_path)

    fake_database[job_id] = {
        "status": "Starting pipeline...",
        "progress": 5,
        "video_url": None
    }
    
    background_tasks.add_task(run_video_pipeline, job_id, saved_image_paths, prompt)

    return JobResponse(
        job_id=job_id,
        status="processing",
        message=f"Received {len(images)} images. Your narrative is being archived."
    )

@router.get("/status/{job_id}", response_model=JobStatusResponse)
async def check_job_status(job_id: str):
    job = fake_database.get(job_id)
    if not job:
        return JobStatusResponse(job_id=job_id, status="not_found", progress=0)
    return JobStatusResponse(
        job_id=job_id,
        status=job["status"],
        progress=job["progress"],
        video_url=job["video_url"]
    )
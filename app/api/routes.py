import os
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks, Request
from typing import List
from .schemas import JobResponse, JobStatusResponse
from ..pipe_runner import run_video_pipeline

router = APIRouter()
fake_database = {}

@router.post("/generate", response_model=JobResponse)
async def start_video_generation(
    background_tasks: BackgroundTasks,
    # Changing the type binding tells OpenAPI explicitly that this is a binary file stream array
    images: List[UploadFile] = File(..., alias="images"),
    prompt: str = Form(..., description="Enter the core text prompt narrative context"),
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
async def check_job_status(job_id: str, request: Request):
    job = fake_database.get(job_id)
    if not job:
        return JobStatusResponse(job_id=job_id, status="not_found", progress=0)
    
    video_url = job["video_url"]
    if video_url and not video_url.startswith("http"):
        base_url = str(request.base_url).rstrip("/")
        # Replace OS path backslashes with slashes for URL format
        url_path = video_url.replace("\\", "/")
        video_url = f"{base_url}/{url_path}"
        
    return JobStatusResponse(
        job_id=job_id,
        status=job["status"],
        progress=job["progress"],
        video_url=video_url
    )
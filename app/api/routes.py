from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks
from typing import List
import uuid
from .schemas import JobResponse, JobStatusResponse

router = APIRouter()

# Temporary in-memory dictionary to track job statuses (we'd use a database later)
fake_database = {}

@router.post("/generate", response_model=JobResponse)
async def start_video_generation(
    background_tasks: BackgroundTasks,
    images: List[UploadFile] = File(...),
    prompt: str = Form(...),
    theme: str = Form("cinematic")
):
    """Endpoint to upload images and trigger the CrewAI pipeline."""
    
    # 1. Generate a unique ID for this video job
    job_id = str(uuid.uuid4())
    
    # 2. Update our "database"
    fake_database[job_id] = {
        "status": "processing",
        "progress": 5,
        "video_url": None
    }
    
    # 3. TODO: Tell FastAPI to run the CrewAI agents in the background
    # background_tasks.add_task(run_crewai_pipeline, job_id, images, prompt)

    return JobResponse(
        job_id=job_id,
        status="processing",
        message=f"Received {len(images)} images. Your narrative is being archived."
    )

@router.get("/status/{job_id}", response_model=JobStatusResponse)
async def check_job_status(job_id: str):
    """Endpoint for the UI to poll and see if the video is done."""
    job = fake_database.get(job_id)
    
    if not job:
        return JobStatusResponse(job_id=job_id, status="not_found", progress=0)
        
    return JobStatusResponse(
        job_id=job_id,
        status=job["status"],
        progress=job["progress"],
        video_url=job["video_url"]
    )
from pydantic import BaseModel
from typing import List, Optional

# What we expect back when we start a video generation job
class JobResponse(BaseModel):
    job_id: str
    status: str
    message: str

# What we send to the client when they check the status
class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: int  # 0 to 100
    video_url: Optional[str] = None
# Narrative Video Agent

A multi-agent system that automates the creation of cinematic, narrative-driven videos from image assets using AI-powered orchestration.

## Features
- **Agentic Pipeline**: Uses CrewAI for intelligent task distribution (Archivist & Director agents).
- **Computer Vision**: Leverages Gemini 1.5 Flash for scene analysis and narrative extraction.
- **Narrative Graph**: Maps the optimal visual flow to ensure cinematic continuity.
- **Automated Rendering**: Uses MoviePy to compile image sequences into structured, captioned MP4s.
- **FastAPI Backend**: Asynchronous API with status tracking for long-running generation jobs.

## System Architecture


## Quick Start
1. **Clone the repository**:
   ```bash
   git clone [https://github.com/yourusername/narrative-video-agent.git](https://github.com/yourusername/narrative-video-agent.git)
   cd narrative-video-agent
   ```

2. **Install dependencies**:
  ```bash
  pip install -r requirements.txt
  ```


3. **Set Environment Variables**:
Create a `.env` file and add your keys:
```env
GROQ_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```


4. **Run the Server**:
```bash
uvicorn app.main:app --reload
```



## Usage

Send a POST request to `/api/v1/generate` with your images and prompt:

```bash
curl -X POST "[http://127.0.0.1:8000/api/v1/generate](http://127.0.0.1:8000/api/v1/generate)" \
  -F "images=@scene1.jpg" \
  -F "images=@scene2.jpg" \
  -F "prompt=A beautiful cinematic sunset transitioning into a cozy starry night"

```

## Tech Stack

* **Framework**: FastAPI
* **AI Agents**: CrewAI + Groq (Llama-3.1)
* **Vision**: Google Gemini API
* **Rendering**: MoviePy (v2.0)
* **Deployment**: Vercel Ready
"""

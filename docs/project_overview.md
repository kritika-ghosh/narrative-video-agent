<div align="center">

# 🎥 Narrative Video Agent — Project Overview

### *A comprehensive developer walkthrough of the end-to-end multi-agent AI pipeline for cinematic video synthesis from raw visual assets.*

<br/>

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.11x-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Docker](https://img.shields.io/badge/Docker-Containerised-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![CrewAI](https://img.shields.io/badge/CrewAI-Multi--Agent-8A2BE2?style=flat-square)](https://crewai.com)
[![Gemini](https://img.shields.io/badge/Gemini-1.5_Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.1-F55036?style=flat-square&logo=groq&logoColor=white)](https://groq.com)
[![Vercel](https://img.shields.io/badge/Vercel-deployed-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)
[![HuggingFace](https://img.shields.io/badge/Deployed-HuggingFace_Spaces-FFD21E?style=flat-square&logo=huggingface&logoColor=black)](https://huggingface.co/spaces)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---

> **TL;DR:** The **Narrative Video Agent** is an end-to-end, multi-agent AI pipeline designed to synthesize captioned cinematic MP4 videos from raw visual assets and a narrative textual prompt in a single click. It coordinates multimodal visual perception, graph-based narrative pathfinding, LLM screenplay compilation, and hardware-accelerated video rendering.

---

## 📋 Table of Contents

- 🖼️ [1. What It Does](#1-what-it-does)
- 🗺️ [2. System Architecture](#2-system-architecture)
- 🗂️ [3. Repository Structure](#3-repository-structure)
- ⚙️ [4. Backend Deep Dive](#4-backend-deep-dive)
  - 🔌 [4.1 Entry Point & Server](#41-entry-point--server)
  - 📡 [4.2 API Layer](#42-api-layer)
  - 🚀 [4.3 The Pipeline Runner](#43-the-pipeline-runner)
  - 🤖 [4.4 AI Agents](#44-ai-agents)
  - 🛠️ [4.5 Services](#45-services)
- 🖥️ [5. Frontend Deep Dive](#5-frontend-deep-dive)
  - 🎨 [5.1 Tech Stack](#51-tech-stack)
  - 🧱 [5.2 Component Architecture](#52-component-architecture)
  - 🔗 [5.3 API Client](#53-api-client)
- 🌊 [6. Data Flow: End to End](#6-data-flow-end-to-end)
- 🎯 [7. Key Design Decisions](#7-key-design-decisions)
- 🔑 [8. Environment Variables](#8-environment-variables)
- 💻 [9. Running Locally](#9-running-locally)
- 🐳 [10. Deployment](#10-deployment)
- 🏛️ [11. Tech Stack Summary](#11-tech-stack-summary)

---

## 🖼️ 1. What It Does

The Narrative Video Agent is a **multi-agent AI pipeline** that orchestrates complex workflows:

- 📥 **Input:** A set of uploaded images + a user-written narrative prompt + an aesthetic theme.
- 📤 **Output:** A polished, captioned `.mp4` video with cinematic transitions.

> [!NOTE]
> Unlike standard video montage utilities that perform simple image concatenation, the Narrative Video Agent *reasons* about the underlying assets. It extracts semantic metadata from each image, applies graph-theory optimization to sort the images into a cohesive narrative sequence, generates a detailed screenplay script, and renders the assets with high-fidelity transitions.

---

## 🗺️ 2. System Architecture

The high-level architecture decouples the frontend client, the API routing layer, and the asynchronous orchestration pipeline:

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                             │
│         React + Vite frontend (deployed on Vercel)              │
│  Upload images → Write prompt → Watch progress → Play video     │
└───────────────────────┬─────────────────────────────────────────┘
                        │ HTTP (multipart form / polling)
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│              FastAPI Backend (deployed on Hugging Face)          │
│                                                                  │
│  POST /api/v1/generate  ──►  Background Task spawned            │
│  GET  /api/v1/status/{id} ◄── Frontend polls every 3s           │
│  GET  /health             ◄── UptimeRobot keep-alive            │
│  GET  /data/outputs/*.mp4 ◄── Static file serving               │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PIPELINE RUNNER (pipe_runner.py)               │
│                                                                  │
│  Phase 1 ─ PERCEPTION    →  ArchivistAgent (Gemini Vision)      │
│  Phase 2 ─ PATHFINDING   →  GraphService (greedy traversal)     │
│  Phase 3 ─ SCRIPTING     →  DirectorAgent (Groq / Llama-3.1)    │
│  Phase 4 ─ RENDERING     →  VideoService (MoviePy + FFmpeg)     │
│  Phase 5 ─ COMPLETE      →  Video URL written to job store      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ 3. Repository Structure

A standard modular repository dividing Python backend logic and React frontend code:

```
narrative-video-agent/
│
├── app/                        # Backend Python package
│   ├── main.py                 # FastAPI app factory, CORS, static files
│   ├── pipe_runner.py          # Master 5-phase pipeline orchestrator
│   │
│   ├── agents/
│   │   ├── archivist.py        # CrewAI agent: visual perception
│   │   └── director.py         # CrewAI agent: scripting & direction
│   │
│   ├── api/
│   │   ├── routes.py           # POST /generate, GET /status/{id}
│   │   └── schemas.py          # Pydantic request/response models
│   │
│   ├── services/
│   │   ├── vision_service.py   # Gemini 1.5 Flash image analysis
│   │   ├── graph_service.py    # Narrative pathfinding algorithm
│   │   └── video_service.py    # MoviePy + FFmpeg video assembly
│   │
│   └── core/
│       ├── config.py           # App configuration
│       └── exceptions.py       # Custom exception classes
│
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx             # Root component, phase state machine
│   │   ├── index.css           # Design system (tokens, glass cards, etc.)
│   │   ├── main.jsx            # Vite entry point
│   │   │
│   │   ├── components/
│   │   │   ├── GenerationForm.jsx   # Upload, trial presets, prompt, submit
│   │   │   ├── PollingTracker.jsx   # Progress bar, live status updates
│   │   │   ├── ResultDisplay.jsx    # Video player + reset button
│   │   │   ├── Toast.jsx            # Animated toast notification system
│   │   │   └── landing/
│   │   │       └── LandingPage.jsx  # Three.js hero landing page
│   │   │
│   │   └── services/
│   │       └── api.js          # Axios API client
│   │
│   ├── public/
│   │   └── samples/            # Bundled sample images for the trial presets
│   │
│   ├── package.json
│   └── vite.config.js
│
├── data/
│   ├── uploads/                # Temporary image upload staging area
│   └── outputs/                # Generated scene clips and final MP4s
│
├── Dockerfile                  # Container image for Hugging Face Spaces
├── requirements.txt            # Python dependencies
├── .env.example                # Environment variable template
└── project_overview.md         # This file
```

---

## ⚙️ 4. Backend Deep Dive

### 4.1 Entry Point & Server

**[`app/main.py`](file:///d:/Desktop/projects/narrative-video-agent/app/main.py)**

The FastAPI application initialization is configured here. Key operational details:

- 🔓 **CORS Middleware:** Standard permissive CORS configuration (`allow_origins=["*"]`) allows cross-origin requests from any client environment (e.g. Vercel development and production instances).
- 📁 **Static Asset Serving:** Mounts the `data/` directory statically at `/data` so that synthesized output videos and intermediary assets can be streamed directly in the browser via standard HTTP GET requests.
- 📡 **API Routing:** Imports and registers the `/api/v1` router, separating operational endpoints from administrative or developer routes.
- 🩺 **Health Check Endpoints:** Provides a highly optimized `GET /health` and `HEAD /health` liveness probe. 

```python
# Server is run via Uvicorn bound to port 7860 (Hugging Face's required port)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
```

> [!IMPORTANT]
> Port 7860 must be explicitly configured as it is the mandatory exposed port for Hugging Face Spaces. The liveness probe must support both `GET` and `HEAD` requests to ensure compatibility with standard monitoring solutions (e.g. UptimeRobot) which use `HEAD` to minimize bandwidth while keeping the server awake.

---

### 4.2 API Layer

**[`app/api/routes.py`](file:///d:/Desktop/projects/narrative-video-agent/app/api/routes.py)**

The backend interface exposes two core operational endpoints for job management:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/v1/generate` | `POST` | Accepts incoming images, prompts, and themes. Spawns a background task and returns a `job_id`. |
| `/api/v1/status/{job_id}` | `GET` | Returns status details, completion percentage, and the final output video URL. |

> [!TIP]
> **Asynchronous Task Pattern:** The `/generate` endpoint consumes a `multipart/form-data` payload. Since video synthesis is a high-latency execution (1–3 minutes), the endpoint writes the uploads to the directory staging area, registers an initial processing record in an in-memory `fake_database` dictionary, registers the pipeline runner as a FastAPI `BackgroundTask`, and immediately returns a `202 Accepted` response with the `job_id`. This prevents client HTTP timeout exceptions.

**[`app/api/schemas.py`](file:///d:/Desktop/projects/narrative-video-agent/app/api/schemas.py)**

Strict validation is enforced using **Pydantic v2** models:
- `JobResponse`: Initial handshake response containing `job_id`, status, and a feedback message.
- `JobStatusResponse`: Operational progress tracking structure containing `job_id`, `status`, `progress` (0–100), and `video_url` (if completed).

---

### 4.3 The Pipeline Runner

**[`app/pipe_runner.py`](file:///d:/Desktop/projects/narrative-video-agent/app/pipe_runner.py)**

The centralized execution orchestrator, `run_video_pipeline()`, coordinates a strict **5-Phase execution framework**:

| Phase | Progress Marker | Description |
|:---:|:---:|---|
| **Phase 1: Perception** | **20%** | `ArchivistAgent` uses Google Gemini 1.5 Flash to extract semantic traits from uploaded images, returning a structured `DossierOutput`. |
| **Phase 2: Pathfinding** | **45%** | `GraphService` models the dossier as a directed graph, computing optimal narrative routing to minimize visual transition friction. |
| **Phase 3: Scripting** | **70%** | `DirectorAgent` evaluates the sorted path and prompt to compile the scene script (`ScriptOutput`) containing captions and transitions. |
| **Phase 4: Rendering** | **90%** | `VideoService` scales images, overlays dynamic captions, compiles silent clips, and stitches them with FFmpeg transition filters. |
| **Phase 5: Complete** | **100%** | Writes the final video URL to `fake_database`, triggering success actions in the polling client. |

> [!IMPORTANT]
> **Strict JSON Schema Enforcement:** To prevent agent hallucinations, both `CrewAI` tasks enforce structured outputs using Pydantic classes:
> ```python
> archivist_task.output_pydantic = DossierOutput
> director_task.output_pydantic = ScriptOutput
> ```
> This prevents malformed JSON strings or markdown commentary from breaking down-stream processes in the pipeline, ensuring high reliability.

---

### 4.4 AI Agents

The pipeline incorporates a dual-agent configuration coordinated using the **CrewAI** framework. To secure high speed and low latency, text reasoning is offloaded to Groq's high-speed inference endpoints using the `llama-3.1-8b-instant` model.

#### Archivist Agent — [`app/agents/archivist.py`](file:///d:/Desktop/projects/narrative-video-agent/app/agents/archivist.py)
- **Role:** Lead Visual Archivist & Semantic Indexer.
- **Backstory:** Specialized in parsing visual motifs, settings, and atmospheres from unstructured image dossiers.
- **Workflow:** Combines direct Gemini Vision REST responses into a coherent `DossierOutput` consisting of an array of individual image features: setting, color palette, mood, and primary subjects.

#### Director Agent — [`app/agents/director.py`](file:///d:/Desktop/projects/narrative-video-agent/app/agents/director.py)
- **Role:** Narrative Director & Visual Editor.
- **Backstory:** Professional screenwriter capable of forging visual metadata and themes into tightly structured screenplays with customized transitions.
- **Workflow:** Consumes the narrative ordered dossier and user prompt to synthesize a complete `ScriptOutput` containing a collection of `scenes` defining duration, captions (capped at 10 words for high visual legibility), and specific transition models.

> [!TIP]
> Groq's custom hardware accelerators yield text inference throughput exceeding **500 tokens/second**, dropping the multi-agent reasoning phase to a sub-second process and leaving rendering as the only true compute cost.

---

### 4.5 Services

#### Vision Service — [`app/services/vision_service.py`](file:///d:/Desktop/projects/narrative-video-agent/app/services/vision_service.py)
Wraps the **Google Gemini 1.5 Flash** API via the `google-generativeai` SDK. PIL images are serialized and transmitted in a single multi-part payload to extract:
- `subjects`: Key entities present.
- `setting`: Location/environment classification.
- `color_palette`: Harmonious visual tones.
- `mood` & `action`: Emotional stance and latent kinetic activity.

#### Graph Service — [`app/services/graph_service.py`](file:///d:/Desktop/projects/narrative-video-agent/app/services/graph_service.py)
A specialized graph-routing algorithm designed to solve the narrative ordering problem. It constructs a complete directed graph where edges represent visual transition friction between two images.
Friction scoring parameters:
- **Mood Discontinuity:** `+5` penalty.
- **Spatial/Setting Discontinuity:** `+3` penalty.
- **Subject Discontinuity (No overlap):** `+2` penalty.

> [!NOTE]
> The algorithm anchors on the user's first uploaded image as the narrative hook and traverses the remaining nodes using a **greedy nearest-neighbor heuristic** to find a Hamiltonian Path that minimizes cumulative transition friction.

#### Video Service — [`app/services/video_service.py`](file:///d:/Desktop/projects/narrative-video-agent/app/services/video_service.py)
A complex compositing and assembly engine integrating `MoviePy` and custom raw `FFmpeg` shell execution:
1. **Scene Generation:** Each image is scaled to fit a standardized `1920x1080` (Full HD, 16:9) canvas, utilizing pillarboxing or letterboxing to protect visual aspect ratios. Caption text is overlayed using custom ImageMagick rendering with dynamic sizing to prevent overflows.
2. **Programmatic FFmpeg Stitching:** Individually rendered silent MP4 clips are sequentially merged using FFmpeg's `xfade` filter using transition types dynamically chosen by the Director Agent (e.g. `fade`, `pixelize`, `smoothleft`).
3. **Stitching Optimization:** Integrates pre-aligned YUV420p color filters to avoid codec errors and enforce absolute playback compatibility.

---

## 🖥️ 5. Frontend Deep Dive

### 5.1 Tech Stack

The UI is built as a responsive Single Page Application (SPA):

- **React 19 & Vite 5:** Modern UI and build pipeline providing high-speed hot module reloading (HMR) and optimized Rollup bundles.
- **Framer Motion:** Handles smooth, high-fidelity element exits, slide animations, and transition states.
- **Three.js & React Three Fiber:** Renders a gorgeous, custom 3D interactive particle background on the landing screen, giving a premium product feel.
- **Vanilla CSS + Tailwind CSS v4:** Curated design tokens written in CSS variables coupled with utility-based styling layouts.
- **Axios:** Handles asynchronous HTTP requests to backend endpoints.

<details>
<summary>🎨 <strong>Expand Color System Tokens</strong></summary>

<br>

The design tokens are declared at the root level in `index.css`:
- `Primary Accent (Cyan)`: `#00d4ff` (representing high technology)
- `Secondary Accent (Purple)`: `#7c5cff` (representing cinematic narrative and depth)
- `Warm Accent (Coral)`: `#ff5c7c` (for destructive operations/errors)
- `Base Surface (Deep Dark)`: `#06060c` (with custom glassmorphism overrides)

</details>

---

### 5.2 Component Architecture

The frontend is structured around a centralized state machine in `App.jsx`, tracking four major state cycles:

```
[ idle ]  ──(User click submit)──►  [ uploading ]  ──(Job accepted)──►  [ processing ]  ──(Polling completes)──►  [ completed ]
```

- **`idle` Phase:** Displays the customized `GenerationForm` where files are dropped and inputs are configured.
- **`uploading` Phase:** Displays a sleek loader card while Axios transfers binary payloads to the server.
- **`processing` Phase:** Mounts `PollingTracker`, triggering automated progress queries every 3 seconds to fetch status logs and percentage outputs.
- **`completed` Phase:** Unmounts progress gauges and displays `ResultDisplay`, serving the complete video inside an optimized HTML5 video player with download and restart handles.

```jsx
// LandingPage is imported dynamically to optimize bundle load sizes
const LandingPage = React.lazy(() => import('./components/landing/LandingPage'));
```

> [!TIP]
> Because Three.js and dynamic WebGL frameworks carry significant bundle weight (~600KB), the `LandingPage` is lazy loaded behind a standard React `Suspense` boundary. This reduces the **First Contentful Paint (FCP)** metric.

---

### 5.3 API Client

**[`frontend/src/services/api.js`](file:///d:/Desktop/projects/narrative-video-agent/frontend/src/services/api.js)**

Exposes two normalized async methods for HTTP transport:
- `startGeneration(images, prompt, theme)`: Serializes variables and file lists into a unified `FormData` payload, transmitting it via a `POST` request.
- `checkJobStatus(jobId)`: Queries `GET /status/{jobId}` and normalizes relative server file paths into static absolute URLs using the API client's `baseURL` parameters.

---

## 🌊 6. Data Flow: End to End

Below is the complete architectural life-cycle of a single video generation operation:

```
1. Client selects images + writes prompt + selects aesthetic theme
           │
           ▼
2. Frontend POSTs multipart form payload to POST /api/v1/generate
           │
           ▼
3. Backend saves binary files to local 'data/uploads' path
   Registers UUIDv4 job ID with status "Starting pipeline..."
   Returns job ID immediately to the client
           │
           ▼
4. Frontend enters 'processing' phase, launching a 3-second polling interval against GET /status/{id}
           │
           ▼
5. Asynchronous Pipeline Task executes on a dedicated OS thread:
   ├─ Phase 1: VisionService sends images to Gemini Flash, compiling DossierOutput
   ├─ Phase 2: GraphService processes visual transitions and orders the narrative path
   ├─ Phase 3: DirectorAgent writes scene screenplay (captions, durations, transitions)
   ├─ Phase 4: VideoService renders scenes via MoviePy, stitches with FFmpeg xfade
   └─ Phase 5: Final MP4 output path is committed to the local DB store
           │
           ▼
6. Polling client receives status="completed" and a valid video_url
   Frontend transitions to 'completed' and renders the video playback module
```

---

## 🎯 7. Key Design Decisions

### Multimodal Pipeline Separation
Rather than executing a single, heavy model call, visual semantic extraction is completely isolated from screenplay writing. Google Gemini 1.5 Flash provides optimal visual analysis, while the Llama-3.1 model running on Groq handles textual reasoning. This yields high instruction adherence, zero data loss, and swift execution.

### Edge Friction Pathfinding
Instead of displaying images in random order or relying on fragile LLM ordering, a deterministic greedy pathfinding algorithm arranges the assets. This guarantees that visually similar pictures are grouped logically and connected via smoother transitions.

### Pydantic Output Contracts
Task objects bind directly to Pydantic validation boundaries via CrewAI's `output_pydantic`. This eliminates structural failures (e.g. LLMs writing narrative preamble, returning malformed lists, or omitting fields), ensuring reliable execution down the pipeline.

---

## 🔑 8. Environment Variables

Create a standard `.env` configuration file in the project's root folder using the `.env.example` template:

| Variable | Scope | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | Backend | Google AI Studio API access key (Gemini 1.5 Flash). |
| `GROQ_API_KEY` | Backend | Groq Cloud platform API key (Llama-3.1 model). |
| `VITE_API_BASE_URL` | Frontend | Target API gateway path. Defaults to `http://localhost:8000/api/v1`. |

---

## 💻 9. Running Locally

### Backend Installation

```bash
# 1. Initialize environment
python -m venv venv
venv\Scripts\activate          # Windows activation
# source venv/bin/activate     # macOS / Linux activation

# 2. Install dependencies
pip install -r requirements.txt

# 3. Launch ASGI server
uvicorn app.main:app --reload --port 8000
```

The API documentation will be available at `http://localhost:8000/docs`.

### Frontend Installation

```bash
cd frontend
npm install
npm run dev
```

The application interface will be live at `http://localhost:5173`.

---

## 🐳 10. Deployment

### Backend — Hugging Face Spaces (Docker)

The application is fully containerized using the customized [`Dockerfile`](file:///d:/Desktop/projects/narrative-video-agent/Dockerfile) to match Hugging Face Space environments:

- **Base Image:** `python:3.11-slim` ensures minimal file weights.
- **Dependencies:** Integrates system binary structures like `ffmpeg`, `imagemagick`, and `fonts-liberation`.
- **ImageMagick Security Policy Patch:** Reconfigures ImageMagick policies inside Debian to allow standard TextClip calls to output over local folders, resolving a common MoviePy exception:
  ```bash
  RUN sed -i 's/rights="none" pattern="PDF"/rights="read|write" pattern="PDF"/' /etc/ImageMagick-6/policy.xml
  ```

### Frontend — Vercel

The React UI is deployed directly to Vercel's global CDN:

```bash
cd frontend
npx vercel --prod
```

> [!IMPORTANT]
> The environment variable `VITE_API_BASE_URL` must be set in Vercel's settings to point to your Hugging Face Space URL (e.g. `https://your-space-url.hf.space/api/v1`) to bridge the frontend and backend.

---

## 🏛️ 11. Tech Stack Summary

The unified stack is summarized below:

| Architectural Tier | Selected Technology | Technical Utility |
|---|---|---|
| **Client UI** | React 19 + Vite 5 | SPA layer with rapid HMR |
| **Styling Engine** | CSS Variables + Tailwind CSS v4 | High-fidelity fluid design token layouts |
| **Animation Systems** | Framer Motion + Three.js | High-performance dynamic transitions & 3D particle canvas |
| **HTTP Transport** | Axios | Normalized async REST interface |
| **API Framework** | FastAPI (Python 3.11) | High-performance, concurrent ASGI endpoint routing |
| **Agent Core** | CrewAI | Multi-agent definition and validation wrapper |
| **Computer Vision** | Google Gemini 1.5 Flash | Multimodal asset semantic parser |
| **Text Reasoning** | Groq / Llama-3.1-8b-instant | Screenplay compilation and transition parsing |
| **Video Compositing** | MoviePy v2.0 | Standardizes sizes, scales, and overlays captions |
| **Video Compilation** | FFmpeg | Hardware-accelerated transitions |
| **Container Engine** | Docker | Standardizes system-level dependencies for HF Spaces |

---

<div align="center">

*Designed and implemented with ❤️ by **Kritika Ghosh**.*  
*Leveraging cutting-edge multi-agent pipelines for cinematic generation.*

</div>

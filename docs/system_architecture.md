<div align="center">

# 🎬 Narrative Video Agent — System Architecture

> *A decoupled, asynchronous, multi-agent orchestration system for end-to-end cinematic video synthesis from heterogeneous visual assets.*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.11x-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Docker](https://img.shields.io/badge/Docker-Containerised-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![Gemini](https://img.shields.io/badge/Gemini-1.5_Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.1_8b-F55036?style=flat-square&logo=groq&logoColor=white)](https://groq.com)
[![CrewAI](https://img.shields.io/badge/CrewAI-Multi--Agent-8A2BE2?style=flat-square)](https://crewai.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Redis](https://img.shields.io/badge/Redis-Future_Upgrade-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-Media_Pipeline-007808?style=flat-square&logo=ffmpeg&logoColor=white)](https://ffmpeg.org)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
[![HuggingFace](https://img.shields.io/badge/Deployed-HuggingFace_Spaces-FFD21E?style=flat-square&logo=huggingface&logoColor=black)](https://huggingface.co/spaces)

</div>

---

## 📋 Table of Contents

- 🧠 [1. Architectural Philosophy](#1-architectural-philosophy)
- 🗺️ [2. High-Level Topology](#2-high-level-topology)
- ⚙️ [3. Backend Service Layer](#3-backend-service-layer)
- 🤖 [4. Multi-Agent Orchestration Layer](#4-multi-agent-orchestration-layer)
- 🕸️ [5. Graph-Based Narrative Pathfinding Subsystem](#5-graph-based-narrative-pathfinding-subsystem)
- 🎞️ [6. Media Synthesis Pipeline](#6-media-synthesis-pipeline)
- 🖥️ [7. Frontend Application Architecture](#7-frontend-application-architecture)
- 🔗 [8. Inter-Service Communication](#8-inter-service-communication)
- 💾 [9. State Management & Job Lifecycle](#9-state-management--job-lifecycle)
- 🐳 [10. Containerisation & Runtime Environment](#10-containerisation--runtime-environment)
- 📈 [11. Scalability Vectors & Production Upgrade Path](#11-scalability-vectors--production-upgrade-path)

---

## 🧠 1. Architectural Philosophy

The Narrative Video Agent is engineered around three core architectural tenets:

### 1.1 Decoupled Asynchronous Execution

Video synthesis is an I/O-bound and compute-bound workload with latency characteristics incompatible with synchronous HTTP semantics. The system therefore decouples request ingestion from pipeline execution using FastAPI's `BackgroundTasks` mechanism. The ingestion endpoint (`POST /api/v1/generate`) performs only ephemeral I/O (file persistence, UUID allocation, in-memory state initialisation) before returning a `202`-equivalent response containing the job identifier. The client transitions to a polling loop against `GET /api/v1/status/{job_id}`, receiving granular progress telemetry while the pipeline executes on a separate OS thread.

> [!IMPORTANT]
> The ingestion endpoint is strictly non-blocking. It returns immediately after enqueuing the `BackgroundTask` — **never** after pipeline completion. Any synchronous coupling here would block Uvicorn's event loop and degrade all concurrent request performance.

### 1.2 Hierarchical Agent Specialisation

Rather than delegating the entire transformation to a monolithic large language model — which suffers from hallucination, context-length constraints, and lack of structured output guarantees — the system implements a **Hierarchical Multi-Agent Pattern**. Perception, narrative reasoning, and scripting are distributed across purpose-built agents, each with a narrowly scoped role, deterministic output schema, and independent LLM backend. This yields higher factual accuracy per domain, reduced prompt complexity, and robust Pydantic-validated inter-agent data contracts.

### 1.3 Hybrid Inference Resource Allocation

The system applies a resource-optimal LLM routing strategy:

- 👁️ **Vision-language tasks** (image-to-structured-metadata) → Google Gemini 1.5 Flash (best-in-class multimodal throughput)
- 📝 **Text reasoning tasks** (metadata-to-screenplay) → Groq-hosted Llama-3.1-8b-instant (~500 tokens/sec, sub-100ms TTFT)

> [!TIP]
> This routing strategy is cost-optimal: Gemini Flash handles the multimodal heavy lifting at low cost-per-token, while Groq's hardware-accelerated inference removes text generation from the critical-path latency bottleneck entirely.

---

## 🗺️ 2. High-Level Topology

```
 ┌──────────────────────────────────────────────────────────────────┐
 │                     CLIENT TIER (Vercel CDN)                     │
 │                                                                  │
 │   React 19 SPA  ──  Vite 5  ──  Framer Motion  ──  Three.js     │
 │                                                                  │
 │   ┌──────────┐    multipart/form-data     ┌──────────────────┐  │
 │   │  Upload  │ ──────────────────────────► │  POST /generate  │  │
 │   │  Form    │                             └──────────────────┘  │
 │   │          │    SSE-style polling        ┌──────────────────┐  │
 │   │  Polling │ ◄──────────────────────────  │  GET /status/:id │  │
 │   │  Tracker │                             └──────────────────┘  │
 │   └──────────┘                                                   │
 └───────────────────────────┬──────────────────────────────────────┘
                             │ HTTPS
 ┌───────────────────────────▼──────────────────────────────────────┐
 │              APPLICATION TIER (Hugging Face Spaces / Docker)     │
 │                                                                  │
 │   FastAPI 0.11x  ──  Uvicorn ASGI  ──  CORSMiddleware           │
 │                                                                  │
 │   ┌─────────────────────────────────────────────────────────┐   │
 │   │                    PIPELINE RUNNER                       │   │
 │   │                                                          │   │
 │   │  ┌───────────┐  ┌───────────┐  ┌───────────────────┐   │   │
 │   │  │ Archivist │  │  Graph    │  │  Director Agent   │   │   │
 │   │  │  Agent    │─►│  Service  │─►│  (Groq/Llama)     │   │   │
 │   │  │ (Gemini)  │  │ (Greedy   │  │                   │   │   │
 │   │  └───────────┘  │ Traversal)│  └───────────────────┘   │   │
 │   │                  └───────────┘           │               │   │
 │   │                                          ▼               │   │
 │   │                                  ┌─────────────────┐     │   │
 │   │                                  │  Video Service  │     │   │
 │   │                                  │  MoviePy+FFmpeg │     │   │
 │   │                                  └────────┬────────┘     │   │
 │   │                                           │              │   │
 │   │                                           ▼              │   │
 │   │                                     final_{id}.mp4       │   │
 │   └─────────────────────────────────────────────────────────┘   │
 │                                                                  │
 │   Static File Server: /data  ──► data/outputs/*.mp4             │
 └──────────────────────────────────────────────────────────────────┘

 External APIs:
   ├── Google Gemini API  (VisionService)
   └── Groq Cloud API     (ArchivistAgent, DirectorAgent)
```

---

## ⚙️ 3. Backend Service Layer

### 3.1 ASGI Server & Application Factory

The application is bootstrapped in [`app/main.py`](app/main.py) using the **ASGI** (Asynchronous Server Gateway Interface) protocol via **Uvicorn**, providing non-blocking I/O across all HTTP interactions.

**Middleware Stack (inbound request order):**

- 🔓 **CORSMiddleware** — Permissive origin policy (`allow_origins=["*"]`) for cross-origin browser requests from the Vercel-hosted frontend. Permits all HTTP methods and headers, including `Content-Type: multipart/form-data`.
- 📁 **StaticFiles** — Mounts the `data/` directory at `/data`, enabling direct browser-side video streaming of generated MP4 artefacts without a separate media server.
- 🔀 **APIRouter** — Namespaced under `/api/v1` for versioned endpoint hygiene.

**Runtime directory provisioning:**

```python
os.makedirs("data/uploads", exist_ok=True)
os.makedirs("data/outputs", exist_ok=True)
```

This idempotent call ensures the ephemeral Hugging Face container filesystem is correctly initialised on cold start, preventing `FileNotFoundError` exceptions during the first pipeline invocation.

### 3.2 Endpoint Specifications

<details>
<summary>📡 <strong>Expand Full Endpoint Specifications</strong></summary>

<br>

#### `POST /api/v1/generate`

```
Content-Type:  multipart/form-data
Request Body:
  images[]   — Binary file streams (UploadFile[], MIME type: image/*)
  prompt     — str  (narrative context, max ~500 chars)
  theme      — str  (aesthetic directive, default: "cinematic")

Response 200:
  {
    "job_id":  "550e8400-e29b-41d4-a716-446655440000",
    "status":  "processing",
    "message": "Received N images. Your narrative is being archived."
  }
```

**Internal execution path:**
1. 🔑 Allocates a UUIDv4 `job_id`
2. 💾 Streams each `UploadFile` buffer to `data/uploads/{job_id}_{filename}` via `shutil.copyfileobj`
3. 🗂️ Initialises a `fake_database[job_id]` record: `{status, progress, video_url}`
4. 📤 Enqueues `run_video_pipeline` as a `BackgroundTask` (executes on the Starlette threadpool)
5. ↩️ Returns `JobResponse` immediately — non-blocking

#### `GET /api/v1/status/{job_id}`

```
Response 200:
  {
    "job_id":    "550e8400-...",
    "status":    "Director is writing the script...",
    "progress":  60,
    "video_url": null | "https://host/data/outputs/{job_id}_final.mp4"
  }
```

**URL normalisation:** When `video_url` contains a relative OS filesystem path, the endpoint dynamically prepends the request's `base_url` and converts Windows backslashes to URL-safe forward slashes.

#### `GET /health` + `HEAD /health`

A minimal liveness probe endpoint returning `{"status": "online"}`. Registered for both GET and HEAD verbs to support UptimeRobot's HTTP(S) monitor, which keeps the Hugging Face Space from entering idle/cold-start suspension.

</details>

> [!NOTE]
> The `/health` endpoint supports both `GET` and `HEAD` verbs deliberately. UptimeRobot's HTTP monitor uses `HEAD` to minimise bandwidth while checking liveness — registering only `GET` would cause the monitor to report false-positive downtime.

---

## 🤖 4. Multi-Agent Orchestration Layer

The system uses **CrewAI** as the agent orchestration framework. Each agent is a discrete `crewai.Agent` instance with an isolated LLM backend, a role-specific system prompt (encoded in `role`, `goal`, `backstory`), and `allow_delegation=False` to enforce strict single-agent accountability per task.

### 4.1 Crew Topology

Two sequential single-agent Crews are instantiated per pipeline run:

```
Crew 1:  [ArchivistAgent]  →  Task: image analysis   →  DossierOutput
                ↓ (pydantic-validated handoff)
         [GraphService]     →  deterministic path sort
                ↓
Crew 2:  [DirectorAgent]   →  Task: screenplay       →  ScriptOutput
```

> [!WARNING]
> Crews are **not concurrent** — Crew 2 cannot begin until Crew 1's output is validated and the graph traversal is complete. This sequential dependency chain guarantees referential integrity across pipeline phases. Introducing parallelism here without a robust inter-agent contract would risk the `DirectorAgent` referencing `image_id` values that do not exist in the ordered dossier.

### 4.2 LLM Backend Configuration

Both agents configure their LLM via CrewAI's `LLM` abstraction:

```python
self.llm = LLM(
    model="groq/llama-3.1-8b-instant",
    api_key=os.getenv("GROQ_API_KEY")
)
```

Routing inference through Groq's inference infrastructure provides:

- ⚡ **~500 tokens/second** generation throughput (vs ~30–80 tok/s on standard OpenAI endpoints)
- 🚀 Sub-100ms **time-to-first-token** (TTFT), critical for perceived pipeline responsiveness
- 🎯 Llama-3.1-8b's strong **instruction-following fidelity** for JSON-constrained output

### 4.3 Pydantic Output Schemas

Output schemas are bound to CrewAI tasks via `task.output_pydantic`, which instructs the framework to:

1. 📋 Append schema-definition JSON to the agent's system prompt
2. ✅ Validate the LLM's raw output against the schema using Pydantic v2's `model_validate`
3. 📦 Expose the validated object via `crew.kickoff().pydantic`

**`DossierOutput` (Archivist → Graph Service):**

```python
class ImageMetadata(BaseModel):
    image_id:      str        # filename
    subjects:      List[str]  # primary visual anchors
    setting:       str        # geographic/temporal environment
    color_palette: List[str]  # dominant colors (hex or descriptive)
    mood:          str        # emotional valence
    action:        str        # narrative trajectory

class DossierOutput(BaseModel):
    assets: List[ImageMetadata]
```

**`ScriptOutput` (Director → VideoService):**

```python
class ScriptScene(BaseModel):
    image_id:        str    # filename (must match DossierOutput)
    caption:         str    # narrative bridge (≤10 words)
    duration:        float  # display duration (2.5–5.0 seconds)
    transition_next: str    # FFmpeg xfade transition identifier

class ScriptOutput(BaseModel):
    scenes:     List[ScriptScene]
```

> [!IMPORTANT]
> Allowed `transition_next` values are enumerated in the DirectorAgent's task description: `fade | pixelize | smoothleft | circlecrop | distance | radial`. This constrains the LLM's token space and prevents invalid FFmpeg filter invocations at runtime.

---

## 🕸️ 5. Graph-Based Narrative Pathfinding Subsystem

**[`app/services/graph_service.py`](app/services/graph_service.py)**

The `GraphService` implements a **weighted directed graph traversal** over the image dossier to determine the optimal narrative sequence. This is the system's most distinctive algorithmic component.

### 5.1 Problem Formulation

Given a set of `n` images `{I₁, I₂, ..., Iₙ}`, each with associated semantic metadata `M(Iᵢ)`, find the permutation `π` that minimises the total **narrative friction**:

```
minimise  Σ  w(I_π(k), I_π(k+1))   for k = 1 to n-1
```

where `w(a, b)` is the pairwise edge weight (friction) between adjacent images.

### 5.2 Edge Weight Function

```python
def calculate_edge_weight(self, node_a: dict, node_b: dict) -> int:
    score = 0
    if node_a['mood']    != node_b['mood']:    score += 5  # mood discontinuity
    if node_a['setting'] != node_b['setting']: score += 3  # spatial discontinuity
    subjects_a = set(node_a.get('subjects', []))
    subjects_b = set(node_b.get('subjects', []))
    if not subjects_a.intersection(subjects_b): score += 2  # subject discontinuity
    return score
```

| Criterion | Weight | Rationale |
|:---|:---:|:---|
| 😟 Mood discontinuity | **5** | Abrupt emotional tonal shifts are the strongest source of viewer disorientation |
| 📍 Setting discontinuity | **3** | Spatial jump cuts break narrative immersion |
| 👤 Subject discontinuity | **2** | Loss of visual anchoring weakens story coherence |

> [!NOTE]
> Maximum possible friction per edge is **10** (all three criteria differ). Minimum is **0** (identical mood, setting, and shared subjects). The greedy traversal targets a path that keeps the cumulative friction score as close to zero as possible.

### 5.3 Traversal Algorithm

The implementation applies a **greedy nearest-neighbour heuristic** — a well-established approximation for the NP-hard Minimum Hamiltonian Path problem:

```
1. Anchor: fix I₁ (first uploaded image) as the traversal origin
2. Unvisited ← {I₂, I₃, ..., Iₙ}
3. While Unvisited ≠ ∅:
     best ← argmin_{Iⱼ ∈ Unvisited}  w(current, Iⱼ)
     path.append(best)
     current ← best
     Unvisited.remove(best)
4. Return path
```

> [!TIP]
> **Time complexity:** O(n²) — acceptable for hackathon-scale inputs (n ≤ ~30 images). For production workloads with large batches, this can be upgraded to the **Christofides approximation algorithm** or a **beam search variant** for a tighter approximation ratio guarantee.

---

## 🎞️ 6. Media Synthesis Pipeline

### 6.1 Vision Analysis — VisionService + Gemini 1.5 Flash

**[`app/services/vision_service.py`](app/services/vision_service.py)**

Each image is opened via `PIL.Image.open()` and submitted as a multimodal content part to `gemini-1.5-flash` via the `google-generativeai` Python SDK. The prompt enforces a structured JSON return format specifying `subjects`, `setting`, `color_palette`, `mood`, and `action`. The model's response text is passed directly to the ArchivistAgent as raw metadata for dossier compilation.



### 6.3 Video Compositing — VideoService + MoviePy

**[`app/services/video_service.py`](app/services/video_service.py)**

Each scene in `ScriptOutput.scenes` is rendered individually:

**Canvas normalisation:**
```
canvas: 1920 × 1080 (Full HD, 16:9)
image scaling: preserve aspect ratio (letterbox if landscape-dominant,
               pillarbox if portrait-dominant)
dimension enforcement: force even pixel dimensions for H.264 codec compliance
```

**Caption compositing:**
- 🖊️ `TextClip` rendered via ImageMagick with font `Arial.ttf` (Windows) or `LiberationSans-Regular.ttf` (Linux)
- 📏 Dynamic font size: 64px → 48px → 38px based on available `text_w` to prevent text overflow
- 🖤 Stroke: 2px black outline for legibility against all background colours
- 📐 Vertical position: `canvas_h - text_height - 60px` margin from bottom
- 🎬 Rendered as a captioned `CompositeVideoClip` on a `ColorClip(0,0,0)` black background

Each scene is written as a silent H.264 MP4 at 24fps using `codec="libx264"`.

### 6.4 Video Stitching — FFmpeg xfade

<details>
<summary>🎬 <strong>Expand FFmpeg xfade Filter Details</strong></summary>

<br>

After all scenes are independently rendered, FFmpeg is invoked programmatically via `subprocess.run` in a sequential stitching loop:

```
For each adjacent scene pair (i-1, i):
  filter_complex:
    [0:v]format=yuv420p,settb=AVTB[v0];
    [1:v]format=yuv420p,settb=AVTB[v1];
    [v0][v1]xfade=transition={T}:duration=1.0:offset={O}[v]

  where:
    T = DirectorAgent-assigned transition identifier
    O = cumulative duration of clip 0 − 1.0 (xfade overlap offset)
```

**Pixel format normalisation** (`format=yuv420p`) and **timebase alignment** (`settb=AVTB`) are applied before the xfade filter to eliminate the "DTS < PTS" artefact and codec incompatibility errors that arise from MoviePy's default output format.

</details>



---

## 🖥️ 7. Frontend Application Architecture

### 7.1 Build System

**Vite 5** with `@vitejs/plugin-react` provides:

- ⚡ **Hot Module Replacement (HMR)** with React Fast Refresh for sub-100ms dev iteration cycles
- 📦 **Rollup-based** production bundling with tree-shaking and code splitting
- 🔧 **Environment variable injection** via `import.meta.env.VITE_*` at build time

### 7.2 Phase State Machine

`App.jsx` implements a **finite state machine (FSM)** with four discrete phases:

```
         ┌──────────┐
         │   IDLE   │ ◄────────────────────────────────┐
         └────┬─────┘                                   │
              │ handleSubmit()                          │ handleReset()
              ▼                                         │
       ┌────────────┐                                   │
       │ UPLOADING  │ ── (await POST /generate) ──►     │
       └────┬───────┘                                   │
            │ job_id received                           │
            ▼                                           │
      ┌───────────────┐                                 │
      │  PROCESSING   │ ── poll every 3s ──►            │
      └──────┬────────┘                                 │
             │ status === "completed"                   │
             ▼                                          │
      ┌────────────┐                                    │
      │  COMPLETED │ ───────────────────────────────────┘
      └────────────┘
```

Phase transitions trigger `AnimatePresence`-managed route animations (blur + Y-axis slide), providing perceptual continuity between UI states.

### 7.3 Code Splitting Strategy

`LandingPage` (contains Three.js WebGL context, geometries, shaders) is isolated behind a `React.lazy()` dynamic import boundary:

```javascript
const LandingPage = lazy(() => import('./components/landing/LandingPage'));
```

> [!TIP]
> This defers the Three.js bundle (~600KB) from the critical rendering path, reducing **Largest Contentful Paint (LCP)** for the main app view. The `Suspense` fallback renders a zero-height `div` to prevent layout shift during the async import resolution.

---

## 🔗 8. Inter-Service Communication

### 8.1 Frontend → Backend

All HTTP traffic uses **Axios** with a configured `apiClient` instance:

```javascript
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: { Accept: 'application/json' }
});
```

**Polling implementation:** `PollingTracker` invokes `checkJobStatus` on a fixed 3-second interval. Upon receiving `status === "completed"`, it extracts `video_url` and propagates it to `App.jsx` via the `onStatusUpdate` callback, triggering the `COMPLETED` phase transition.

### 8.2 Backend → External APIs

| Service | Protocol | Auth |
|:---|:---|:---|
| 🔍 Google Gemini 1.5 Flash | HTTPS REST (`google-generativeai` SDK) | `GEMINI_API_KEY` env var |
| ⚡ Groq / Llama-3.1-8b | HTTPS REST (CrewAI `LLM` abstraction) | `GROQ_API_KEY` env var |
| 🎬 FFmpeg | `subprocess.Popen` (IPC) | N/A — system binary |

---

## 💾 9. State Management & Job Lifecycle

### 9.1 In-Memory Job Store

Job state is persisted in `fake_database` — a module-level Python `dict` in `app/api/routes.py`:

```python
fake_database: dict[str, dict] = {
    job_id: {
        "status":    str,    # human-readable phase description
        "progress":  int,    # 0–100
        "video_url": str | None
    }
}
```

> [!WARNING]
> `fake_database` is **not persistent across process restarts**. A container redeploy or Hugging Face Space cold-start will silently discard all in-flight and completed job records. Clients polling a job that no longer exists in memory will receive a `404`. The production upgrade path (Redis) eliminates this failure mode entirely.

**Trade-offs of this approach:**

| Property | Current (dict) | Production Upgrade |
|:---|:---:|:---:|
| 💾 Persistence | ❌ Lost on process restart | ✅ Redis / PostgreSQL |
| 🔀 Concurrency | ⚠️ Single-process only | ✅ Distributed via Redis pub/sub |
| 📈 Scalability | ❌ Cannot horizontal-scale | ✅ Celery task queue |
| ⚡ Latency | ✅ O(1) lookup | ✅ O(1) Redis GET |

### 9.2 Progress Telemetry

Progress is updated atomically within the pipeline runner before and after each phase:

| Phase Entry | Status String | Progress |
|:---|:---|:---:|
| 🟢 Job accepted | `"Starting pipeline..."` | **5%** |
| 🔍 Phase 1 start | `"Archivist is analyzing images..."` | **20%** |
| 🕸️ Phase 2 start | `"Calculating narrative arc..."` | **45%** |
| ✍️ Phase 3 start | `"Director is writing the script..."` | **70%** |
| 🎬 Phase 4 start | `"Applying transitions & rendering video..."` | **90%** |
| ✅ Phase 5 complete | `"completed"` | **100%** |

---

## 🐳 10. Containerisation & Runtime Environment

**[`Dockerfile`](Dockerfile)**

```dockerfile
FROM python:3.11-slim          # Minimal Debian-based image
WORKDIR /workspace

# System-level media processing dependencies
RUN apt-get install -y ffmpeg imagemagick fonts-liberation

# ImageMagick security policy patch (enables text rendering over arbitrary paths)
RUN sed -i 's/rights="none" pattern="PDF"/rights="read|write" pattern="PDF"/' \
    /etc/ImageMagick-6/policy.xml

RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
EXPOSE 7860
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
```

> [!IMPORTANT]
> Port **7860** is mandatory for Hugging Face Spaces Docker SDK. Any other exposed port will cause the Space to fail its liveness check and never reach a running state.

**Key environment characteristics:**

- 🔢 Port **7860** is mandatory for Hugging Face Spaces Docker SDK
- 🔤 `fonts-liberation` provides `LiberationSans-Regular.ttf` — a metrically-compatible Arial substitute for text overlay rendering
- 🔓 ImageMagick policy patching is required because the default Debian ImageMagick configuration disables file I/O for security reasons, which blocks MoviePy's `TextClip` from invoking the `convert` binary against arbitrary paths

---

## 📈 11. Scalability Vectors & Production Upgrade Path

<details>
<summary>🏗️ <strong>Expand Full Scalability Upgrade Table</strong></summary>

<br>

| Component | ⚠️ Current Constraint | ✅ Production Solution |
|:---|:---|:---|
| 💾 Job store | In-process Python dict | Redis Cluster + TTL expiry |
| ⚙️ Pipeline execution | FastAPI BackgroundTask (single thread) | Celery distributed task queue with GPU worker pool |
| 📁 File storage | Local container filesystem | AWS S3 / GCS with presigned URL delivery |
| 📺 Video streaming | Static file mount on ASGI server | CloudFront CDN with byte-range request support |
| 🤖 LLM inference | External API calls (Groq, Gemini) | Self-hosted vLLM + Triton Inference Server |
| 🔀 Agent concurrency | Sequential Crews | Parallel Crew execution with `Process` mode |
| 📊 Monitoring | `print()` statements | OpenTelemetry traces + Prometheus metrics + Grafana |
| 🔐 Auth | None | JWT bearer tokens + API key rotation |

</details>

> [!CAUTION]
> Running **multiple Uvicorn workers** (e.g. `--workers 4`) in the current architecture is unsafe. The `fake_database` dict is process-local — worker processes do not share memory, meaning a `POST /generate` handled by Worker A will produce a `job_id` invisible to Worker B when the client subsequently polls `GET /status/{job_id}`. Horizontal scaling requires migrating job state to a shared external store (Redis) first.

---

<div align="center">

## 🏛️ Architectural Summary

*The three foundational tenets and their key mechanisms*

| Tenet | Principle | Key Mechanisms |
|:---:|:---|:---|
| 🔌 **Decoupled Async Execution** | Request ingestion is never blocked by synthesis latency | `FastAPI BackgroundTasks` · `UUIDv4 job_id` · 3-second client polling loop · `GET /status` telemetry endpoint |
| 🧠 **Hierarchical Agent Specialisation** | Each agent owns a single, narrowly-scoped domain with typed I/O | `CrewAI` orchestration · `ArchivistAgent` (vision) · `DirectorAgent` (scripting) · Pydantic v2 inter-agent contracts |
| ⚡ **Hybrid Inference Resource Allocation** | Route each workload to the optimal inference backend | Gemini 1.5 Flash (multimodal) · Groq/Llama-3.1 (text, ~500 tok/s) |

<br>

---

*Built with ❤️ for cinematic storytelling · Deployed on [Hugging Face Spaces](https://huggingface.co/spaces)*

</div>

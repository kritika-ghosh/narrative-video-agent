---
title: Narrative Video Agent
emoji: 🎥
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

<div align="center">

# 🎬 Narrative Video Agent

### *Transform images and a prompt into a fully rendered cinematic MP4 — powered by a multi-agent AI pipeline.*

<br/>

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Vercel](https://img.shields.io/badge/Vercel-deployed-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)
[![Hugging Face](https://img.shields.io/badge/Hugging%20Face-Spaces-FFD21E?style=flat-square&logo=huggingface&logoColor=black)](https://huggingface.co/spaces)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## 🎥 Demo

<div align="center">

<!-- 🎬 Add your demo video/GIF here -->

*Demo video coming soon — drop your MP4 or GIF here.*

</div>

---

## 🌟 Features

- 🖼️ **Multi-image upload** — feed the pipeline any number of images as visual context
- 🧠 **Dual-agent AI** — an Archivist perceives scenes, a Director writes the screenplay and transitions
- 🎞️ **Cinematic rendering** — MoviePy + FFmpeg assemble a polished, fluid transition MP4
- ⚡ **Real-time progress** — five-phase streaming pipeline with live status updates in the UI
- 🌐 **Full-stack SaaS** — React 19 frontend on Vercel, FastAPI backend on Hugging Face Spaces
- 🐳 **One-command deploy** — Dockerised backend ready for any container platform
- ✨ **Immersive UI** — Three.js particle canvas, Framer Motion transitions, Tailwind CSS v4

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 5, Tailwind CSS v4, Framer Motion, Three.js |
| **Backend** | FastAPI, Python 3.11, MoviePy v2.0, FFmpeg |
| **AI / LLM** | Google Gemini 1.5 Flash (vision), Groq / Llama-3.1-8b-instant (text) |
| **Orchestration** | CrewAI multi-agent framework |
| **Infrastructure** | Docker, Hugging Face Spaces (port 7860), Vercel |

---

## 🚀 Pipeline

The pipeline executes five sequential phases, each updating the frontend in real time:

```
🖼️  Phase 1 · Perception
      ↓  Gemini 1.5 Flash analyses every uploaded image
🗺️  Phase 2 · Pathfinding
      ↓  Graph traversal orders the images into a narrative arc
✍️  Phase 3 · Scripting
      ↓  DirectorAgent writes the scene-by-scene screenplay & transitions
🎬  Phase 4 · Rendering
      ↓  MoviePy + FFmpeg compile & stitch the final MP4
✅  Phase 5 · Complete
         Cinematic video ready for download
```

### 🤖 Agents

| Agent | Role | Models |
|---|---|---|
| **ArchivistAgent** | Visual perception — captions, mood, and scene metadata | Gemini 1.5 Flash + Groq/Llama-3.1 |
| **DirectorAgent** | Screenplay writing and transition selection | Groq/Llama-3.1-8b-instant |

---

## ⚡ Quick Start

### Prerequisites

- Python 3.11+, `ffmpeg` in `PATH`
- Node.js 18+
- Docker (optional, for containerised backend)
- API keys: `GEMINI_API_KEY`, `GROQ_API_KEY`

---

### 🐍 Backend

```bash
# 1. Clone the repo
git clone https://github.com/kritika-ghosh/narrative-video-agent.git
cd narrative-video-agent

# 2. Create & activate a virtual environment
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set environment variables
cp .env.example .env
# Edit .env and fill in GEMINI_API_KEY and GROQ_API_KEY

# 5. Start the API server
uvicorn app.main:app --host 0.0.0.0 --port 7860 --reload
```

> [!NOTE]
> The backend expects FFmpeg to be installed and available on your system `PATH`. On Windows you can install it via `winget install ffmpeg`; on macOS via `brew install ffmpeg`.

#### 🐳 Docker (alternative)

```bash
docker build -t narrative-video-agent .
docker run -p 7860:7860 \
  -e GEMINI_API_KEY=your_key \
  -e GROQ_API_KEY=your_key \
  narrative-video-agent
```

---

### ⚛️ Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set the API base URL
echo "VITE_API_BASE_URL=http://localhost:7860" > .env.local

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> [!TIP]
> Point `VITE_API_BASE_URL` at the Hugging Face Spaces URL to connect the dev frontend directly to the deployed backend.

---

## 🔌 API Reference

Base URL: `https://<your-hf-space>.hf.space` (production) or `http://localhost:7860` (local)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/generate` | Upload images + prompt; returns a job ID and begins the pipeline |
| `GET` | `/api/v1/status/{job_id}` | Poll the current phase, progress, and final video URL |

### `POST /api/v1/generate`

**Form data**

| Field | Type | Required | Description |
|---|---|---|---|
| `images` | `file[]` | ✅ | One or more image files (JPEG / PNG) |
| `prompt` | `string` | ✅ | Creative direction or theme for the video |
| `theme` | `string` | ❌ | Visual aesthetic preset (default: "cinematic") |

**Response**

```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "message": "Received images. Your narrative is being archived."
}
```

### `GET /api/v1/status/{job_id}`

**Response (in-progress)**

```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "Director is writing the script...",
  "progress": 70,
  "video_url": null
}
```

**Response (complete)**

```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "progress": 100,
  "video_url": "http://localhost:7860/data/outputs/550e8400-e29b-41d4-a716-446655440000_final.mp4"
}
```

---

## 🔐 Environment Variables

| Variable | Where | Description |
|---|---|---|
| `GEMINI_API_KEY` | Backend | Google AI Studio API key for Gemini 1.5 Flash vision calls |
| `GROQ_API_KEY` | Backend | Groq API key for Llama-3.1-8b-instant (scripting & text) |
| `VITE_API_BASE_URL` | Frontend | Full URL of the backend API (no trailing slash) |

> [!IMPORTANT]
> Never commit real API keys to version control. Use `.env` files locally and Hugging Face / Vercel secret management in production.

---

## 📁 Project Structure

<details>
<summary>Click to expand</summary>

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
└── project_overview.md
```

</details>

---

## 🚢 Deployment

### Backend → Hugging Face Spaces

The backend runs as a Dockerised Hugging Face Space on port **7860**.

1. Push the repo to your Hugging Face Space (or link your GitHub repo).
2. Add `GEMINI_API_KEY` and `GROQ_API_KEY` as **Space secrets** in the HF settings panel.
3. Hugging Face builds and deploys the Docker image automatically.

> [!NOTE]
> The YAML front matter at the top of this file (`sdk: docker`, `app_port: 7860`) configures the Space automatically — no additional setup required.

### Frontend → Vercel

The frontend is deployed to **Vercel**.

1. Import the `frontend/` directory (or the whole repo) into Vercel.
2. Set `VITE_API_BASE_URL` to your Hugging Face Space URL in Vercel's environment variable settings.
3. Vercel builds with `npm run build` and serves the static output.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. **Fork** the repository
2. **Create** a feature branch — `git checkout -b feat/amazing-feature`
3. **Commit** your changes — `git commit -m 'feat: add amazing feature'`
4. **Push** to the branch — `git push origin feat/amazing-feature`
5. **Open** a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

> [!TIP]
> Running `uvicorn app.main:app --reload` during development gives you hot-reload on every save, making iteration fast.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ by **[Kritika Ghosh](https://github.com/kritika-ghosh)**

</div>

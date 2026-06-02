<div align="center">

# 🎬 Narrative Video Agent — Implementation Details

*Technical deep-dive into the implementation decisions, algorithmic constructs, data schemas, and engineering trade-offs underpinning the Narrative Video Agent pipeline.*

![CrewAI](https://img.shields.io/badge/CrewAI-Orchestration-6C63FF?style=flat-square&logo=robot&logoColor=white)
![Pydantic](https://img.shields.io/badge/Pydantic-v2_Schema_Enforcement-E92063?style=flat-square&logo=python&logoColor=white)
![FFmpeg](https://img.shields.io/badge/FFmpeg-xfade_Stitching-007808?style=flat-square&logo=ffmpeg&logoColor=white)
![MoviePy](https://img.shields.io/badge/MoviePy-Compositing-FF6F00?style=flat-square&logo=python&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_1.5_Flash-Multimodal_Inference-4285F4?style=flat-square&logo=google&logoColor=white)
![React](https://img.shields.io/badge/React-Frontend_State_Machine-61DAFB?style=flat-square&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-BackgroundTask-009688?style=flat-square&logo=fastapi&logoColor=white)

</div>

---

## 📋 Table of Contents

- [🔀 1. Pipeline Orchestration & Phase Management](#1-pipeline-orchestration--phase-management)
- [🧱 2. Pydantic Schema Enforcement at the LLM Boundary](#2-pydantic-schema-enforcement-at-the-llm-boundary)
- [👁️ 3. Vision Service — Multimodal Inference via Gemini 1.5 Flash](#3-vision-service--multimodal-inference-via-gemini-15-flash)
- [🗺️ 4. Graph Pathfinder — Greedy Hamiltonian Approximation](#4-graph-pathfinder--greedy-hamiltonian-approximation)
- [🗃️ 5. Archivist Agent — Semantic Dossier Compilation](#5-archivist-agent--semantic-dossier-compilation)
- [🎬 6. Director Agent — Screenplay Generation](#6-director-agent--screenplay-generation)
- [🎞️ 7. Video Service — Compositing, Encoding & Stitching](#7-video-service--compositing-encoding--stitching)
- [⚛️ 8. Frontend State Machine & Component Lifecycle](#8-frontend-state-machine--component-lifecycle)
- [🔌 9. API Normalisation & Field Aliasing](#9-api-normalisation--field-aliasing)
- [🛡️ 10. Error Handling & Fault Isolation](#10-error-handling--fault-isolation)
- [🖥️ 11. Cross-Platform Runtime Compatibility](#11-cross-platform-runtime-compatibility)
- [📊 Quick-Reference Navigation Table](#quick-reference-navigation-table)

---

## 1. Pipeline Orchestration & Phase Management

**[`app/pipe_runner.py`](app/pipe_runner.py)**

`run_video_pipeline(job_id, image_paths, user_prompt)` is the **monolithic pipeline entry point**, executed on Starlette's `BackgroundTask` threadpool. The function is structured as a linear phase sequence inside a single `try/except` block with a pre-initialised `final_video_path = None` sentinel to guarantee exception-safe job state mutation.

### 1.1 Lazy Module Imports

**Agent** and service classes are imported inside the function body rather than at module scope:

> [!IMPORTANT]
> The **deferred import pattern** is not a style choice — it is architecturally necessary to avoid circular import resolution. `routes.py` imports `pipe_runner`, which would need to import from `routes` at module scope, creating an unresolvable import cycle. Deferring to function-body scope breaks the cycle entirely.

```python
def run_video_pipeline(job_id, image_paths, user_prompt):
    from .agents.archivist import ArchivistAgent
    from .agents.director import DirectorAgent
    from .services.graph_service import GraphService
    from .services.video_service import VideoService
    from .api.routes import fake_database
```

This deferred import pattern:
- ♻️ Avoids circular import resolution at module initialisation time (`routes.py` imports `pipe_runner`, which would need to import from `routes`)
- 🎯 Ensures `fake_database` reference is resolved against the module singleton already populated by the request handler, not a fresh import-time empty dict

### 1.2 Phase State Mutation

At each phase boundary, the shared `fake_database` dict is updated **atomically** (Python's GIL ensures dict writes are thread-safe for simple key assignment):

```python
fake_database[job_id]["status"]   = "Archivist is analyzing images..."
fake_database[job_id]["progress"] = 15
```

The polling endpoint reads this dict on each GET request, providing the frontend with **real-time pipeline telemetry** without websockets or server-sent events.

### 1.3 Exception Handling & Crash Diagnostics

```python
except Exception as e:
    traceback.print_exc()   # Full stack trace to container stdout/HF logs
    fake_database[job_id]["status"]   = f"Failed: {str(e)}"
    fake_database[job_id]["progress"] = 0
```

> [!TIP]
> `traceback.print_exc()` prints the full exception chain to stdout, which is captured by the Hugging Face Spaces container log viewer. This is **far preferable** to `str(e)` alone — `str(e)` discards the traceback and makes remote debugging practically impossible.

---

## 2. Pydantic Schema Enforcement at the LLM Boundary

The most architecturally significant implementation decision is the use of **Pydantic v2 schemas** as a **hard contract** between the LLM outputs and the downstream pipeline stages.

### 2.1 The Problem: Unconstrained LLM Output

Without output schema enforcement, LLMs typically respond with:
- 🚧 Markdown code fences around JSON (` ```json ... ``` `)
- 📝 Explanatory prose before/after the JSON object
- 👻 Hallucinated keys not in the schema
- 🔢 Wrong data types (string where int expected)
- ✂️ Truncated output for large responses

Any of these failure modes would crash the pipeline at the JSON parsing stage.

### 2.2 The Solution: CrewAI `output_pydantic`

```python
archivist_task.output_pydantic = DossierOutput
archivist_task.expected_output = "A strict JSON object matching the DossierOutput schema."
```

**CrewAI**'s `output_pydantic` mechanism:
1. 📋 Serialises the Pydantic schema to a JSON Schema definition and appends it to the agent's system prompt
2. 🧹 After the agent's LLM call completes, CrewAI strips markdown fences and attempts `DossierOutput.model_validate(parsed_json)`
3. 🔁 If validation fails, CrewAI retries the LLM call with the validation error appended to the prompt (self-correcting loop)
4. ✅ On success, exposes the validated object via `crew.kickoff().pydantic`

### 2.3 Dual-Path Output Extraction

> [!WARNING]
> **CrewAI may return results via either `result.pydantic` or `result.json_dict`** — the pipeline must handle both paths. Relying solely on `result.pydantic` causes crashes when the LLM output was parseable as JSON but failed the Pydantic model validation. This dual-path extraction is the critical resilience mechanism.

<details><summary>🔍 Expand: Dual-Path Extraction Code</summary>

```python
if hasattr(raw_metadata, 'pydantic') and raw_metadata.pydantic:
    metadata_list = [asset.model_dump() for asset in raw_metadata.pydantic.assets]
elif hasattr(raw_metadata, 'json_dict') and raw_metadata.json_dict:
    metadata_list = raw_metadata.json_dict.get('assets', [])
else:
    raise ValueError("CrewAI failed to return a validated structure.")
```

This defensive extraction ensures the pipeline degrades gracefully rather than crashing on partial LLM compliance.

</details>

### 2.4 `image_id` Re-binding Post-Extraction

The LLM assigns `image_id` values based on the filenames described in its prompt, but these may differ from the actual saved filenames (e.g., due to `{job_id}_` prefix prepended during upload). After extraction, **`image_id` is re-bound** to the actual basename:

```python
for i, meta in enumerate(metadata_list):
    if i < len(image_paths):
        meta["image_id"] = os.path.basename(image_paths[i])
```

> [!NOTE]
> This re-binding step is what ensures the `image_paths_map` lookup in `VideoService` resolves correctly. Without it, the `image_id` keys from the LLM may not match any key in the map, causing every scene to silently fall back to a placeholder.

---

## 3. Vision Service — Multimodal Inference via Gemini 1.5 Flash

**[`app/services/vision_service.py`](app/services/vision_service.py)**

### 3.1 Model Selection Rationale

`gemini-1.5-flash` is selected over `gemini-1.5-pro` for the following operational reasons:

| Criterion | `gemini-1.5-flash` | `gemini-1.5-pro` |
|---|---|---|
| ⚡ Latency per image | ~1–2s | ~5–8s |
| 💰 Cost (per 1M tokens) | $0.075 | $3.50 |
| 📊 JSON instruction-following | Sufficient for structured prompts | Superior but unnecessary |
| 🧠 Multimodal context window | 1M tokens | 1M tokens |

> [!TIP]
> For batch image analysis in a real-time pipeline, **latency and cost dominate** over marginal quality improvements. Flash provides ~97% cost reduction at 4–6× faster throughput — a clear engineering optimum for this use case.

### 3.2 Prompt Engineering

<details><summary>🔍 Expand: Vision Prompt & Rationale</summary>

```python
prompt = """
Analyze this image for a video narrative pipeline. Return ONLY a JSON object with:
- 'subjects': list of main subjects
- 'setting': the environment or background
- 'color_palette': 3 descriptive colors
- 'mood': the emotional tone (e.g., melancholic, energetic)
- 'action': what is happening
"""
response = self.model.generate_content([prompt, img])
```

The prompt is intentionally terse and prescriptive:
- 🚫 **"Return ONLY a JSON object"** — suppresses the model's tendency to prefix responses with preamble text
- 🔑 **Enumerated key names** — establishes explicit schema expectations without using a formal JSON Schema (which would add token overhead)
- 💡 **Example values in parentheses** — grounds the model's vocabulary for free-text fields like `mood` and `action`

</details>

### 3.3 Image Passing Mechanism

Images are passed as `PIL.Image` objects directly to `generate_content([prompt, img])`. The **`google-generativeai` SDK** serialises PIL images to base64-encoded JPEG inline data parts internally, avoiding the need for pre-upload to Google Cloud Storage.

---

## 4. Graph Pathfinder — Greedy Hamiltonian Approximation

**[`app/services/graph_service.py`](app/services/graph_service.py)**

### 4.1 Algorithmic Classification

The narrative ordering problem is formally equivalent to the **Minimum Weight Hamiltonian Path (MWHP)** problem — a well-known **NP-hard** combinatorial optimisation problem. Exact solutions require O(n!) time complexity, making them intractable for n > 12.

> [!IMPORTANT]
> The implemented **greedy nearest-neighbour heuristic** is a deliberate trade-off:
> - ⏱️ **Time complexity:** O(n²) — polynomial, tractable for n up to hundreds of images
> - 📐 **Approximation ratio:** Typically 1.25×–2× optimal (empirically acceptable for video narrative ordering)
> - 🔒 **Determinism:** Given the same input set and anchor point, always produces the same output ordering

### 4.2 Anchor Point Selection

The algorithm anchors on `metadata_list[0]` — the first image as uploaded by the user. This is an intentional design choice: the user's first uploaded image is frequently the most contextually significant (e.g., the protagonist's introduction shot or establishing scene), and anchoring on it **respects the user's implicit ordering intention**.

### 4.3 Subject Overlap Detection

```python
subjects_a = set(node_a.get('subjects', []))
subjects_b = set(node_b.get('subjects', []))
if not subjects_a.intersection(subjects_b):
    score += 2
```

**Set intersection** over subject lists provides a lexicographic similarity measure. This is a coarse-grained proxy for visual continuity — more sophisticated implementations could use CLIP embedding cosine similarity between images for semantic subject matching. The current implementation is deliberately lightweight to avoid adding a second large model dependency.

---

## 5. Archivist Agent — Semantic Dossier Compilation

**[`app/agents/archivist.py`](app/agents/archivist.py)**

### 5.1 Agent Configuration

<details><summary>🔍 Expand: Full Archivist Agent Schema</summary>

```python
Agent(
    role='Lead Visual Archivist',
    goal='Extract deep semantic, visual, and emotional metadata from a batch of images.',
    backstory='You are a master archivist with a keen eye for visual storytelling. '
              'You do not just see objects; you see mood, lighting, and narrative potential.',
    verbose=True,
    llm=self.llm,
    allow_delegation=False
)
```

</details>

> [!WARNING]
> **`allow_delegation=False` is a critical hardening setting.** CrewAI agents with delegation enabled can spawn sub-tasks and invoke other agents, introducing non-deterministic execution paths and unbounded token overhead. Since the Archivist's task is tightly scoped, delegation is explicitly disabled to guarantee execution predictability.

**`verbose=True`** pipes CrewAI's internal reasoning chain (task decomposition, tool calls, LLM responses) to stdout, providing diagnostic visibility in the Hugging Face container logs during development.

### 5.2 Task Description Construction

The task description is dynamically constructed to include the image count and user prompt:

```python
description = f"""
The user wants a video with the following theme/prompt: '{user_prompt}'.
You have been provided a batch of {len(image_paths)} images.
Analyze the extracted visual data for each image and compile a 'Narrative Dossier'.
Ensure you highlight the emotional tone and visual continuity between the assets.
"""
```

> [!NOTE]
> Injecting `user_prompt` into the Archivist's task description — even though the Archivist focuses on **perception** rather than scripting — biases the agent to surface metadata features that are thematically relevant to the user's intent. For example, a prompt about "melancholy" will cause the Archivist to foreground `mood` features like "subdued," "overcast," or "solitary" over neutral observations.

---

## 6. Director Agent — Screenplay Generation

**[`app/agents/director.py`](app/agents/director.py)**

### 6.1 Constrained Transition Vocabulary

The **DirectorAgent**'s task description explicitly enumerates the permissible `transition_next` values:

```
You MUST choose from exactly one of these strings:
fade, pixelize, smoothleft, circlecrop, distance, radial
```

> [!CAUTION]
> This vocabulary constraint is **not optional**. The LLM cannot invent `"dissolve"` or `"wipe"` — neither of these are valid xfade filter names. A hallucinated transition string causes `subprocess.CalledProcessError` deep inside the FFmpeg stitching loop, silently corrupting the output file. Enumerating the exact allowed strings in the prompt is the only reliable prevention mechanism.

This constraint serves a dual purpose:
- 🚫 **Prevents hallucinated FFmpeg filter names** — avoids `subprocess.CalledProcessError` in the stitching loop
- 🎨 **Guides semantic transition selection** — the DirectorAgent maps emotional transitions to visual idioms (e.g., `pixelize` for jarring mood shifts, `fade` for serene continuity, `circlecrop` for dramatic reveals)



### 6.3 Caption Constraint (≤10 Words)

**Caption length** is capped at 10 words in the task description. This is enforced at the prompt level rather than programmatically post-generation. The rationale: MoviePy's `TextClip` with `method='caption'` wraps text to the specified `size=(text_w, None)` bounding box, but very long captions reduce font size and degrade legibility on video. 10 words maps to approximately 60–80 characters — comfortably renderable at 64px on a 1600px-wide text area.

### 6.4 Duration Range Enforcement (2.5–5.0 seconds)

> [!IMPORTANT]
> The **lower bound (2.5s)** is load-bearing, not aesthetic. Since the xfade transition window is 1.0s, any scene shorter than 1.0s would produce a zero or negative-duration residual clip, causing FFmpeg to emit a fatal `Invalid DTS` error. The 2.5s lower bound provides a comfortable 1.5s safety margin above the 1.0s xfade overlap.

The upper bound (5.0s) prevents excessively static shots that reduce video engagement.

---



---

## 7. Video Service — Compositing, Encoding & Stitching

**[`app/services/video_service.py`](app/services/video_service.py)**

### 8.1 Aspect Ratio Preservation & Canvas Fitting

Images are scaled to fit a **1920×1080 canvas** while preserving the source aspect ratio:

<details><summary>🔍 Expand: Canvas Math — Letterbox / Pillarbox Calculation</summary>

```python
orig_aspect    = orig_w / orig_h
canvas_aspect  = canvas_w / canvas_h  # 1.778 (16:9)

if orig_aspect > canvas_aspect:      # wider than 16:9 → letterbox
    new_w = canvas_w                 # 1920
    new_h = int(canvas_w / orig_aspect)
else:                                # taller than 16:9 → pillarbox
    new_h = canvas_h                 # 1080
    new_w = int(canvas_h * orig_aspect)

# Enforce even dimensions for H.264 codec compliance (YUV 4:2:0 chroma subsampling)
new_w = (new_w // 2) * 2
new_h = (new_h // 2) * 2
```

H.264 with **YUV 4:2:0** chroma subsampling requires even pixel dimensions. Odd-dimension inputs cause `libx264` to emit a non-fatal warning and may produce a 1-pixel green border artefact on some decoders. Integer truncation followed by rounding down to the nearest even number eliminates this.

</details>

> [!WARNING]
> **Skipping the even-dimension enforcement is a common H.264 encoding trap.** On some decoders (notably hardware decoders on Android and iOS), odd-dimension video produces a permanent 1-pixel green or black stripe along the right/bottom edge that cannot be fixed in post. Always enforce `(dim // 2) * 2` before passing dimensions to `libx264`.

### 8.2 TextClip Rendering via ImageMagick

**MoviePy** delegates text rasterisation to ImageMagick's `convert` binary. The `method='caption'` parameter instructs ImageMagick to word-wrap the text within the specified `size=(text_w, None)` bounding box, expanding the clip height automatically.

**Dynamic font size selection:**

```python
font_size = 64
if text_w < 1000: font_size = 48
if text_w < 600:  font_size = 38
```

`text_w` is computed as `min(1600, int(new_w * 0.9))`, bounded below at 500px. This ensures portrait images (narrow `new_w`) receive appropriately smaller text rather than overflowing the canvas.

### 8.3 FFmpeg xfade Filter Architecture

The xfade loop operates on a rolling `current_video` pointer, iteratively compositing one new scene per iteration:

<details><summary>🔍 Expand: xfade Stitching Loop & Offset Formula</summary>

```python
current_video    = compiled_clips[0]["path"]
current_duration = compiled_clips[0]["duration"]

for i in range(1, len(compiled_clips)):
    offset = current_duration - fade_duration  # onset of transition (seconds from start)

    filter_string = (
        f"[0:v]format=yuv420p,settb=AVTB[v0];"
        f"[1:v]format=yuv420p,settb=AVTB[v1];"
        f"[v0][v1]xfade=transition={T}:duration=1.0:offset={offset}[v]"
    )

    current_duration = current_duration + next_duration - fade_duration
```

**Offset calculation:** `offset = current_duration - 1.0` positions the transition onset 1 second before the end of the current clip, creating a **1-second overlap window**. The new `current_duration` accounts for the 1-second subtraction from the merged clip's total duration.

</details>

> [!CAUTION]
> **`format=yuv420p,settb=AVTB` is mandatory** on each input stream before the xfade filter. MoviePy may output clips with `yuvj420p` (JPEG-range YUV) or non-standard timebases (`1/12800` vs `1/24`), which cause xfade to fail with cryptic `DTS < PTS` or `filter graph not properly configured` errors. This normalisation pre-filter silently eliminates an entire class of FFmpeg stitching failures.



---

## 8. Frontend State Machine & Component Lifecycle

### 9.1 Phase Enum Constants

```javascript
const PHASES = {
  IDLE:       'idle',
  UPLOADING:  'uploading',
  PROCESSING: 'processing',
  COMPLETED:  'completed',
};
```

Using a **`PHASES` object as an enum** prevents magic string comparisons throughout the component tree, enabling IDE autocompletion and reducing typo-induced state bugs.

### 9.2 `useCallback` Memoisation Strategy

All event handlers in `App.jsx` are wrapped in **`useCallback`**:

```javascript
const handleSubmit = useCallback(async (images, prompt, theme) => { ... }, [addToast]);
const handleReset  = useCallback(() => { ... }, []);
```

This prevents child components (`GenerationForm`, `PollingTracker`, `ResultDisplay`) from re-rendering due to referential inequality of handler props on each parent render cycle. Since these components receive handlers as props, `useCallback` is essential for maintaining `React.memo`-equivalent stability without explicit memoisation of child components.

### 9.3 Toast Notification System

<details><summary>🔍 Expand: Toast ID Counter & AnimatePresence Pattern</summary>

```javascript
let toastIdCounter = 0;  // module-level, survives re-renders

const addToast = useCallback((message, type = 'error') => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
}, []);
```

**Toast IDs** use a module-level counter (not `useState`) to guarantee monotonic uniqueness without triggering re-renders on counter increment. The `AnimatePresence` wrapper in `ToastContainer` manages `exit` animations for dismissed toasts using `layoutId` matching.

</details>

### 9.4 Particle System (Decorative)

```javascript
const particles = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    left: `${10 + Math.random() * 80}%`,
    top:  `${10 + Math.random() * 80}%`,
    delay: `${i * 1.1}s`,
    size: 2 + Math.random() * 3,
}));
```

> [!NOTE]
> The particle array is defined at **module scope** (outside the component) using `Math.random()`. This means positions are randomised **once at module load time** and remain stable across re-renders — preventing the jarring repositioning that would occur if particles were computed inside the component body on every render cycle.

---

## 9. API Normalisation & Field Aliasing

The frontend API service explicitly handles field name discrepancies between the backend's response schema and the frontend's expected field names:

```javascript
// startGeneration response normalisation:
return {
    job_id:  data.task_id || data.job_id,   // backend may use either
    status:  data.status,
    message: data.message
};

// checkJobStatus response normalisation:
return {
    video_url: data.video_path || data.video_url || null  // multiple possible keys
};
```

This **aliasing layer** provides a **contract buffer** — the frontend is insulated from backend field name changes, and the backend is not forced to match the frontend's naming conventions. This is particularly important in hackathon contexts where backend schemas evolve rapidly.

---

## 10. Error Handling & Fault Isolation

### 11.1 Per-Scene Error Isolation (VideoService)

Each scene's compositing step is wrapped in its own `try/except`:

<details><summary>🔍 Expand: Per-Scene Captionless Fallback Pattern</summary>

```python
try:
    txt_clip = TextClip(caption, ...)
    composite_scene = CompositeVideoClip([base_clip, txt_clip])
    composite_scene.write_videofile(scene_path, ...)
    compiled_clips.append({"path": scene_path})
except Exception as e:
    print(f"[!] Text render failed for {img_id}: {e}")
    base_clip.write_videofile(scene_path, ...)  # Save captionless fallback
    compiled_clips.append({"path": scene_path})
```

If ImageMagick fails (e.g., font not found, security policy violation), the scene is saved **without caption text** and the pipeline continues. This **fault isolation** prevents a single text render failure from aborting the entire video generation job.

</details>

### 11.2 FFmpeg Subprocess Error Propagation

```python
try:
    subprocess.run(cmd, check=True)
except subprocess.CalledProcessError as e:
    print(f"FFMPEG CRASHED ON STITCH {i}!")
    raise e  # Re-raise to outer pipeline exception handler
```

> [!CAUTION]
> FFmpeg errors are **intentionally re-raised** rather than silently absorbed. A stitching failure produces a corrupt or missing intermediate file that would cascade into a worse failure downstream. Silently swallowing the error would allow the pipeline to appear to succeed while producing a broken video. Re-raising allows the outer `except` block to mark the job as failed with a descriptive status.

### 11.3 Frontend Error Recovery

On `UPLOADING` phase errors (network failure, 4xx/5xx from backend):

```javascript
catch (err) {
    addToast(err.response?.data?.detail || err.message || 'Upload failed.', 'error');
    setPhase(PHASES.IDLE);  // Return to idle — user can retry
}
```

On `PROCESSING` phase failures (pipeline crash reported via status polling):

```javascript
} else if (status.status?.startsWith('Failed')) {
    addToast(status.status, 'error');
    setPhase(PHASES.IDLE);  // Return to idle — user can retry with different inputs
}
```

Both error paths return the UI to `IDLE`, allowing the user to adjust their inputs and retry **without a page reload**.

---

## 11. Cross-Platform Runtime Compatibility

The codebase explicitly handles the Windows (development) vs Linux (Docker/production) runtime dichotomy in two places:

### 12.1 ImageMagick Binary Path

```python
if platform.system() == "Windows":
    os.environ["IMAGEMAGICK_BINARY"] = r"C:\Program Files\ImageMagick-7.1.2-Q16-HDRI\magick.exe"
else:
    os.environ["IMAGEMAGICK_BINARY"] = "/usr/bin/convert"
```

Windows uses the standalone **`magick.exe`** binary from ImageMagick 7.x. Linux uses the legacy **`convert`** binary from ImageMagick 6.x (installed via `apt`). MoviePy's `TextClip` reads the `IMAGEMAGICK_BINARY` environment variable to locate the binary.

### 12.2 Font Path Resolution

```python
if platform.system() == "Windows":
    font_path = "C:/Windows/Fonts/arial.ttf"
else:
    font_path = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
    if not os.path.exists(font_path):
        font_path = "Arial"  # Fallback to font family name
```

> [!TIP]
> **`LiberationSans-Regular`** is a metrically-compatible open-source substitute for Arial, installed via the `fonts-liberation` apt package in the Dockerfile. The **absolute path is preferred** over the font family name because MoviePy resolves font family names through fontconfig, which may not be available in all container configurations. The absolute path fallback to `"Arial"` is a last-resort defence for non-standard Linux distributions.

---

## Quick-Reference Navigation Table

> [!NOTE]
> Use this table as a fast-lookup index for every key implementation challenge in the pipeline, its solution, and where to find it in the codebase.

| # | Implementation Challenge | Solution | File Location |
|---|---|---|---|
| 1 | Circular import between `routes.py` and `pipe_runner.py` | Deferred / lazy imports inside function body | [`app/pipe_runner.py`](app/pipe_runner.py) |
| 2 | Real-time pipeline progress without WebSockets | GIL-safe `dict` mutation + HTTP polling endpoint | [`app/pipe_runner.py`](app/pipe_runner.py) · [`app/api/routes.py`](app/api/routes.py) |
| 3 | LLM returns malformed / partial JSON | CrewAI `output_pydantic` with self-correcting retry loop | [`app/agents/archivist.py`](app/agents/archivist.py) |
| 4 | `result.pydantic` unavailable after partial LLM compliance | Dual-path extraction: `pydantic` → `json_dict` → `ValueError` | [`app/pipe_runner.py`](app/pipe_runner.py) |
| 5 | LLM `image_id` mismatch with actual uploaded filenames | Post-extraction `image_id` re-binding to `os.path.basename` | [`app/pipe_runner.py`](app/pipe_runner.py) |
| 6 | Narrative ordering of N images (NP-hard MWHP) | Greedy nearest-neighbour O(n²) heuristic, anchored on image[0] | [`app/services/graph_service.py`](app/services/graph_service.py) |
| 7 | LLM hallucinating invalid FFmpeg transition names | Explicit enumeration of allowed `transition_next` strings in prompt | [`app/agents/director.py`](app/agents/director.py) |
| 8 | H.264 encoding failure on odd pixel dimensions | `(dim // 2) * 2` rounding before canvas resize | [`app/services/video_service.py`](app/services/video_service.py) |
| 9 | xfade `DTS < PTS` / timebase mismatch errors | `format=yuv420p,settb=AVTB` pre-filter on every FFmpeg input stream | [`app/services/video_service.py`](app/services/video_service.py) |
| 10 | ImageMagick font-not-found crashing entire pipeline | Per-scene `try/except` with captionless video fallback | [`app/services/video_service.py`](app/services/video_service.py) |
| 11 | Backend field name drift breaking frontend | API normalisation layer with `||`-chained field aliasing | [`frontend/src/services/api.js`](frontend/src/services/api.js) |
| 12 | Windows vs Linux binary paths for ImageMagick & fonts | `platform.system()` branching for `IMAGEMAGICK_BINARY` + font path | [`app/services/video_service.py`](app/services/video_service.py) |
| 13 | Particle positions shifting on every React re-render | Module-scope `Array.from` with `Math.random()` (computed once at load) | [`frontend/src/App.jsx`](frontend/src/App.jsx) |
| 14 | Toast IDs triggering re-renders on increment | Module-level `toastIdCounter` integer (not `useState`) | [`frontend/src/App.jsx`](frontend/src/App.jsx) |

---

<div align="center">

*Generated for the Narrative Video Agent project — a CrewAI + Gemini + FFmpeg pipeline.*

</div>

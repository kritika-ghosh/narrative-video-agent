/**
 * API Service Layer — Pure network calls, zero React dependencies.
 * Cleanly separated from all UI components.
 */
import axios from 'axios';

const apiClient = axios.create({
  // Dynamically points to your live Hugging Face production URL or local development server
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    Accept: 'application/json',
  },
});

/**
 * Start a video generation job.
 * @param {File[]} images - Array of image File objects
 * @param {string} prompt - Narrative context prompt
 * @param {string} theme  - Aesthetic theme (default: "cinematic")
 * @returns {Promise<{job_id: string, status: string, message: string}>}
 */
export async function startGeneration(images, prompt, theme = 'cinematic') {
  const formData = new FormData();
  images.forEach((file) => formData.append('images', file));
  formData.append('prompt', prompt);
  formData.append('theme', theme);

  const { data } = await apiClient.post('/generate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  // Normalize backend 'task_id' to frontend expected 'job_id' to keep UI components happy!
  return {
    job_id: data.task_id || data.job_id,
    status: data.status,
    message: data.message
  };
}

/**
 * Poll the status of a generation job.
 * @param {string} jobId
 * @returns {Promise<{job_id: string, status: string, progress: number, video_url: string|null}>}
 */
export async function checkJobStatus(jobId) {
  // Use your active jobId token to query the FastAPI endpoint
  const { data } = await apiClient.get(`/status/${jobId}`);
  
  return {
    job_id: data.task_id || data.job_id,
    status: data.status,
    progress: data.progress || 0,
    // Ensure the output path matches your backend's video key mapping
    video_url: data.video_path || data.video_url || null
  };
}
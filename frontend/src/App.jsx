import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Loader2, Video } from 'lucide-react';
import { startGeneration, checkJobStatus } from './services/api';
import GenerationForm from './components/GenerationForm';
import PollingTracker from './components/PollingTracker';
import ResultDisplay from './components/ResultDisplay';
import ToastContainer from './components/Toast';

/**
 * Lifecycle phases:
 *   idle -> uploading -> processing -> completed
 */
const PHASES = {
  IDLE: 'idle',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
};

const pageVariants = {
  initial: { opacity: 0, y: 24, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -16, filter: 'blur(6px)', transition: { duration: 0.3 } },
};

const particles = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  left: `${10 + Math.random() * 80}%`,
  top: `${10 + Math.random() * 80}%`,
  delay: `${i * 1.1}s`,
  size: 2 + Math.random() * 3,
}));

let toastIdCounter = 0;

export default function App() {
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [jobId, setJobId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [videoUrl, setVideoUrl] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'error') => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleSubmit = useCallback(async (images, prompt, theme) => {
    setPhase(PHASES.UPLOADING);
    try {
      const response = await startGeneration(images, prompt, theme);
      setJobId(response.job_id);
      setStatusMessage(response.message);
      setProgress(5);
      setPhase(PHASES.PROCESSING);
    } catch (err) {
      addToast(err.response?.data?.detail || err.message || 'Upload failed. Please try again.', 'error');
      setPhase(PHASES.IDLE); // Return to idle so they can fix and retry
    }
  }, [addToast]);

  const handleStatusUpdate = useCallback((status) => {
    setProgress(status.progress);
    setStatusMessage(status.status);

    if (status.status === 'completed') {
      setVideoUrl(status.video_url);
      setPhase(PHASES.COMPLETED);
      addToast('Video generated successfully!', 'success');
    } else if (status.status?.startsWith('Failed')) {
      addToast(status.status, 'error');
      setPhase(PHASES.IDLE); // Return to idle on failure
    }
  }, [addToast]);

  const handleReset = useCallback(() => {
    setPhase(PHASES.IDLE);
    setJobId(null);
    setProgress(0);
    setStatusMessage('');
    setVideoUrl(null);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Decorative floating particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            top: p.top,
            animationDelay: p.delay,
            width: p.size,
            height: p.size,
          }}
        />
      ))}

      {/* Header */}
      <header className="text-center mb-10 relative z-10">
        <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full border border-border-dim bg-surface-elevated/50 text-text-muted text-xs font-mono tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-success animate-pulse" />
          Narrative Archivist
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-primary bg-clip-text text-transparent flex items-center justify-center gap-3">
          <Video className="w-10 h-10 text-accent-primary hidden sm:block" />
          Video Narrative Engine
        </h1>
        <p className="mt-3 text-text-secondary text-base max-w-md mx-auto leading-relaxed">
          Upload images, craft a prompt, and watch AI agents weave them into a cinematic narrative.
        </p>
      </header>

      {/* Phase Router */}
      <main className="w-full max-w-2xl relative z-10">
        <AnimatePresence mode="wait">
          {phase === PHASES.IDLE && (
            <motion.div key="form" {...pageVariants}>
              <GenerationForm onSubmit={handleSubmit} />
            </motion.div>
          )}

          {phase === PHASES.UPLOADING && (
            <motion.div key="uploading" {...pageVariants}>
              <div className="glass-card p-10 flex flex-col items-center gap-5">
                <Loader2 className="w-10 h-10 text-accent-primary animate-spin" />
                <p className="text-text-secondary text-sm">Uploading your assets…</p>
              </div>
            </motion.div>
          )}

          {phase === PHASES.PROCESSING && (
            <motion.div key="processing" {...pageVariants}>
              <PollingTracker
                jobId={jobId}
                progress={progress}
                statusMessage={statusMessage}
                onStatusUpdate={handleStatusUpdate}
              />
            </motion.div>
          )}

          {phase === PHASES.COMPLETED && (
            <motion.div key="completed" {...pageVariants}>
              <ResultDisplay videoUrl={videoUrl} onReset={handleReset} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-16 text-text-muted text-xs font-mono tracking-wider relative z-10 flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-accent-secondary" />
          ARCHIVIST v1.0 — powered by agentic AI
        </div>
        <span className="hidden sm:inline text-text-muted/40">•</span>
        <span>Designed & Developed by Kritika Ghosh</span>
      </footer>

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

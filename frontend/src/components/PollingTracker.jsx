import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { checkJobStatus } from '../services/api';

const POLL_INTERVAL_MS = 3000;

export default function PollingTracker({ jobId, progress, statusMessage, onStatusUpdate }) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const status = await checkJobStatus(jobId);
        onStatusUpdate(status);

        // Stop polling if terminal state
        if (status.status === 'completed' || status.status?.startsWith('Failed')) {
          clearInterval(intervalRef.current);
        }
      } catch {
        // Network hiccup — keep retrying silently
      }
    };

    // Immediate first poll, then interval
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => clearInterval(intervalRef.current);
  }, [jobId, onStatusUpdate]);

  // Map progress to descriptive stage
  const getStageLabel = (pct) => {
    if (pct <= 15) return '01 — Perception';
    if (pct <= 40) return '02 — Graph Traversal';
    if (pct <= 60) return '03 — Scripting';
    if (pct <= 85) return '04 — Rendering';
    return '05 — Finalizing';
  };

  return (
    <div className="glass-card p-8 space-y-8">
      {/* Stage indicator */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-accent-primary tracking-wider uppercase">
          {getStageLabel(progress)}
        </span>
        <span className="text-xs font-mono text-text-muted">
          {progress}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="progress-track">
        <motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Status message */}
      <div className="flex items-center gap-3">
        <Loader2 size={20} className="text-accent-primary animate-spin" />
        <p className="text-sm text-text-secondary leading-relaxed">
          {statusMessage || 'Processing…'}
        </p>
      </div>

      {/* Visual pipeline steps */}
      <div className="grid grid-cols-5 gap-1.5">
        {[15, 40, 60, 85, 100].map((threshold, i) => (
          <div
            key={threshold}
            className={`h-1 rounded-full transition-all duration-500 ${
              progress >= threshold
                ? 'bg-accent-primary'
                : progress >= threshold - 10
                  ? 'bg-accent-primary/30'
                  : 'bg-surface-elevated'
            }`}
          />
        ))}
      </div>

      <p className="text-center text-text-muted text-xs font-mono">
        JOB_ID: {jobId?.slice(0, 8)}…
      </p>
    </div>
  );
}

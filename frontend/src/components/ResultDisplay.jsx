import { motion } from 'framer-motion';
import { Check, Download, RotateCcw } from 'lucide-react';

export default function ResultDisplay({ videoUrl, onReset }) {
  return (
    <div className="glass-card p-8 space-y-6">
      {/* Success badge */}
      <div className="flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.15 }}
          className="w-16 h-16 rounded-full bg-accent-success/10 border border-accent-success/30 flex items-center justify-center text-accent-success"
        >
          <Check size={32} strokeWidth={2.5} />
        </motion.div>
      </div>

      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-text-primary">Narrative Complete</h2>
        <p className="text-sm text-text-secondary">Your video has been generated successfully.</p>
      </div>

      {/* Video player */}
      {videoUrl && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl overflow-hidden border border-border-dim bg-black"
        >
          <video
            src={videoUrl}
            controls
            className="w-full aspect-video"
          >
            Your browser does not support the video tag.
          </video>
        </motion.div>
      )}

      {/* Download + Reset */}
      <div className="flex items-center justify-center gap-4 pt-2">
        {videoUrl && (
          <a
            href={videoUrl}
            download
            className="btn-ghost"
          >
            <Download size={16} />
            Download
          </a>
        )}
        <button onClick={onReset} className="btn-glow">
          <RotateCcw size={16} />
          Generate Another
        </button>
      </div>
    </div>
  );
}

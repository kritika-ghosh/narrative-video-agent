import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const VARIANTS = {
  error: {
    icon: AlertCircle,
    color: 'var(--color-accent-warm)',
    bg: 'rgba(255,107,107,0.08)',
    border: 'rgba(255,107,107,0.25)',
  },
  success: {
    icon: CheckCircle2,
    color: 'var(--color-accent-success)',
    bg: 'rgba(0,232,123,0.08)',
    border: 'rgba(0,232,123,0.25)',
  },
  info: {
    icon: Info,
    color: 'var(--color-accent-secondary)',
    bg: 'rgba(0,212,255,0.08)',
    border: 'rgba(0,212,255,0.25)',
  },
};

/**
 * Individual toast item.
 */
function ToastItem({ id, message, type = 'error', onDismiss }) {
  const { icon: Icon, color, bg, border } = VARIANTS[type] ?? VARIANTS.error;

  useEffect(() => {
    const t = setTimeout(() => onDismiss(id), 4000);
    return () => clearTimeout(t);
  }, [id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      style={{ background: bg, borderColor: border }}
      className="flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl max-w-sm w-full pointer-events-auto"
    >
      <Icon size={18} style={{ color, flexShrink: 0, marginTop: 1 }} />
      <p className="text-sm text-text-primary flex-1 leading-relaxed">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
        aria-label="Dismiss"
      >
        <X size={15} />
      </button>
    </motion.div>
  );
}

/**
 * Toast container — mount once in App, pass in toasts array + dismiss handler.
 */
export default function ToastContainer({ toasts, onDismiss }) {
  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

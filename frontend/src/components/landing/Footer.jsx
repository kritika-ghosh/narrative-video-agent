import { Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      className="relative py-10 px-6 text-center"
      style={{ borderTop: '1px solid rgba(120,100,255,0.08)' }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(124,92,255,0.4), transparent)' }}
      />
      <p
        className="flex items-center justify-center gap-2 text-xs font-mono tracking-wider"
        style={{ color: '#55556a' }}
      >
        <Sparkles size={13} style={{ color: '#7c5cff' }} />
        ARCHIVIST v1.0 — Designed &amp; Developed by{' '}
        <span style={{ color: '#8888a8' }}>Kritika Ghosh</span>
      </p>
    </footer>
  );
}

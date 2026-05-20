import { motion } from 'framer-motion';

export default function Navbar({ onLaunch }) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
      style={{
        background: 'rgba(6, 6, 12, 0.65)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(120, 100, 255, 0.08)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: '#00e87b' }}
        />
        <span
          className="font-semibold text-sm tracking-wide"
          style={{ color: '#eeeef4', fontFamily: 'var(--font-sans)' }}
        >
          Narrative Archivist
        </span>
      </div>

      {/* CTA */}
      <button className="btn-ghost text-sm" onClick={onLaunch}>
        Launch App →
      </button>
    </motion.nav>
  );
}

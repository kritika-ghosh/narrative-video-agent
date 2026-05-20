import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Suspense, lazy } from 'react';

const HolographicBlob = lazy(() => import('./HolographicBlob'));

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.65, ease: [0.4, 0, 0.2, 1] },
  },
};

export default function HeroSection({ onLaunch }) {
  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 px-6">
      {/* Extra glow behind hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 15% 50%, rgba(124,92,255,0.10) 0%, transparent 65%), radial-gradient(ellipse 50% 50% at 85% 40%, rgba(0,212,255,0.07) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-6 items-center">
        {/* ── Left Column ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-6"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="flex">
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono tracking-widest uppercase"
              style={{
                border: '1px solid rgba(120,100,255,0.2)',
                background: 'rgba(124,92,255,0.08)',
                color: '#8888a8',
              }}
            >
              <Sparkles size={12} style={{ color: '#7c5cff' }} />
              Powered by Agentic AI
            </span>
          </motion.div>

          {/* Heading */}
          <motion.div variants={itemVariants}>
            <h1
              className="text-5xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.05]"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #7c5cff 0%, #00d4ff 50%, #7c5cff 100%)',
                  backgroundSize: '200% auto',
                  animation: 'gradientShift 5s linear infinite',
                }}
              >
                Video Narrative
              </span>
              <br />
              <span style={{ color: '#eeeef4' }}>Engine</span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg leading-relaxed max-w-md"
            style={{ color: '#8888a8' }}
          >
            Upload images, craft a prompt, and watch{' '}
            <span style={{ color: '#eeeef4' }}>multi-agent AI</span> weave them into a
            cinematic narrative — powered by CrewAI & Gemini.
          </motion.p>

          {/* Stats row */}
          <motion.div variants={itemVariants} className="flex items-center gap-6 flex-wrap">
            {[
              { value: '3', label: 'AI Agents' },
              { value: '∞', label: 'Narratives' },
              { value: 'HD', label: 'Output' },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-start">
                <span
                  className="text-2xl font-bold"
                  style={{ color: '#7c5cff' }}
                >
                  {value}
                </span>
                <span className="text-xs uppercase tracking-widest" style={{ color: '#55556a' }}>
                  {label}
                </span>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex items-center gap-4 flex-wrap pt-2">
            <button
              className="btn-glow text-base px-8 py-3.5 rounded-xl"
              onClick={onLaunch}
              id="hero-try-it-out-btn"
            >
              Try it out →
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost text-sm"
              id="hero-github-btn"
            >
              View on GitHub
            </a>
          </motion.div>
        </motion.div>

        {/* ── Right Column — 3D Blob ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="relative flex items-center justify-center"
          style={{ height: 440 }}
        >
          {/* Glow disc behind blob */}
          <div
            aria-hidden="true"
            className="absolute rounded-full"
            style={{
              width: 340,
              height: 340,
              background:
                'radial-gradient(circle, rgba(124,92,255,0.18) 0%, rgba(0,212,255,0.08) 50%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
          <Suspense
            fallback={
              <div
                className="flex items-center justify-center text-xs font-mono"
                style={{ color: '#55556a' }}
              >
                Loading 3D scene…
              </div>
            }
          >
            <HolographicBlob />
          </Suspense>
        </motion.div>
      </div>
    </section>
  );
}

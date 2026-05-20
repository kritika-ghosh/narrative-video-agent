import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Eye, Network, Film } from 'lucide-react';

const features = [
  {
    id: 'perception',
    icon: Eye,
    title: 'Perception Engine',
    description:
      'Lead Visual Archivist analyzes your input batch using Gemini 1.5 Flash to extract semantic features, mood, and color palettes.',
    accentColor: '#7c5cff',
    glowColor: 'rgba(124, 92, 255, 0.15)',
    tag: 'Agent 01',
  },
  {
    id: 'graph',
    icon: Network,
    title: 'Graph-based Continuity',
    description:
      'Our Graph Pathfinder mathematically optimizes image traversal based on narrative distance, ensuring logical, rhythmic transitions.',
    accentColor: '#00d4ff',
    glowColor: 'rgba(0, 212, 255, 0.12)',
    tag: 'Agent 02',
  },
  {
    id: 'orchestration',
    icon: Film,
    title: 'Narrative Orchestration',
    description:
      'The Director Agent synthesizes a dynamic script and synchronized timeline, rendered seamlessly via MoviePy.',
    accentColor: '#a78bfa',
    glowColor: 'rgba(167, 139, 250, 0.14)',
    tag: 'Agent 03',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.18, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
  },
};

function FeatureCard({ feature }) {
  const Icon = feature.icon;

  return (
    <motion.div
      variants={cardVariants}
      className="glass-card p-7 flex flex-col gap-5 relative overflow-hidden group"
      id={`feature-card-${feature.id}`}
    >
      {/* Background glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 50% 0%, ${feature.glowColor}, transparent)`,
        }}
      />

      {/* Top row: tag + icon */}
      <div className="relative z-10 flex items-center justify-between">
        <span
          className="text-[10px] font-mono tracking-widest uppercase px-3 py-1 rounded-full"
          style={{
            color: feature.accentColor,
            background: `${feature.glowColor}`,
            border: `1px solid ${feature.accentColor}30`,
          }}
        >
          {feature.tag}
        </span>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: `${feature.glowColor}`,
            border: `1px solid ${feature.accentColor}30`,
          }}
        >
          <Icon size={18} style={{ color: feature.accentColor }} />
        </div>
      </div>

      {/* Title */}
      <h3
        className="relative z-10 text-lg font-bold leading-snug"
        style={{ color: '#eeeef4' }}
      >
        {feature.title}
      </h3>

      {/* Description */}
      <p
        className="relative z-10 text-sm leading-relaxed"
        style={{ color: '#8888a8' }}
      >
        {feature.description}
      </p>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(90deg, transparent, ${feature.accentColor}, transparent)` }}
      />
    </motion.div>
  );
}

export default function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      className="relative py-28 px-6"
      id="features"
    >
      {/* Section divider glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-px h-24"
        style={{ background: 'linear-gradient(to bottom, rgba(124,92,255,0.4), transparent)' }}
      />

      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          className="text-center mb-16"
        >
          <p
            className="text-xs font-mono tracking-widest uppercase mb-4"
            style={{ color: '#55556a' }}
          >
            Under the hood
          </p>
          <h2
            className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight"
            style={{ color: '#eeeef4' }}
          >
            How it{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, #7c5cff, #00d4ff)' }}
            >
              works
            </span>
          </h2>
          <p
            className="mt-4 text-sm sm:text-base max-w-xl mx-auto leading-relaxed"
            style={{ color: '#8888a8' }}
          >
            Three specialized AI agents collaborate in a multi-stage pipeline to transform your images into cinematic gold.
          </p>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {features.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </motion.div>

        {/* Pipeline connector (desktop only) */}
        <div className="hidden md:flex items-center justify-center gap-0 mt-0 -translate-y-[calc(100%+2rem)] pointer-events-none absolute left-0 right-0 top-[60%]">
          {/* purely decorative, handled by card layout */}
        </div>
      </div>
    </section>
  );
}

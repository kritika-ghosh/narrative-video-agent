import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, X, Play, Wand2, Loader2 } from 'lucide-react';

const THEMES = [
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'documentary', label: 'Documentary' },
  { value: 'nostalgic', label: 'Nostalgic' },
  { value: 'futuristic', label: 'Futuristic' },
  { value: 'dark', label: 'Dark' },
];

const MAX_PROMPT_LENGTH = 500;

// ── Trial / Demo preset ──────────────────────────────────────────────────────
// A curated set of thematic images + a ready-made prompt so judges can hit
// "Generate" without needing to supply their own photos.
const TRIAL_PRESETS = [
  {
    label: '🌄 Epic Journey',
    prompt:
      'A lone wanderer crosses vast mountain ranges and ancient forests, chasing the horizon as the world transforms from dawn to dusk — a cinematic odyssey of solitude and wonder.',
    theme: 'cinematic',
    // Unsplash source URLs (stable, no API key needed)
    images: [
      { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', name: 'mountain-peak.jpg' },
      { url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80', name: 'mountain-forest.jpg' },
      { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', name: 'beach-sunset.jpg' },
      { url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80', name: 'aerial-landscape.jpg' },
    ],
  },
  {
    label: '🌆 City Pulse',
    prompt:
      'The city never sleeps — neon lights bleed into rain-slicked streets as millions of lives intersect in a breathless urban symphony of ambition, longing, and electric dreams.',
    theme: 'dark',
    images: [
      { url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80', name: 'city-night.jpg' },
      { url: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=800&q=80', name: 'city-street.jpg' },
      { url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&q=80', name: 'city-aerial.jpg' },
      { url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80', name: 'city-lights.jpg' },
    ],
  },
  {
    label: '🌸 Nature Awakens',
    prompt:
      'Season by season, nature reclaims its quiet power — cherry blossoms fall like pink snow, ancient rivers carve their paths, and wildlife stirs in a world untouched by time.',
    theme: 'nostalgic',
    images: [
      { url: 'https://images.unsplash.com/photo-1490750967868-88df5691cc6f?w=800&q=80', name: 'cherry-blossoms.jpg' },
      { url: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&q=80', name: 'forest-river.jpg' },
      { url: 'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=800&q=80', name: 'lake-reflection.jpg' },
      { url: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=800&q=80', name: 'wildlife.jpg' },
    ],
  },
];

async function urlToFile(url, filename) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  const blob = await res.blob();
  const ext = blob.type.split('/')[1] || 'jpg';
  return new File([blob], filename || `sample.${ext}`, { type: blob.type });
}

export default function GenerationForm({ onSubmit }) {
  const [images, setImages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [theme, setTheme] = useState('cinematic');
  const [dragOver, setDragOver] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialError, setTrialError] = useState(null);
  const [activePreset, setActivePreset] = useState(null);
  const fileInputRef = useRef(null);

  const handleFiles = useCallback((files) => {
    const accepted = Array.from(files).filter((f) => f.type.startsWith('image/'));
    setImages((prev) => [...prev, ...accepted]);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePromptChange = (e) => {
    const val = e.target.value;
    if (val.length <= MAX_PROMPT_LENGTH) {
      setPrompt(val);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (images.length === 0 || !prompt.trim()) return;
    onSubmit(images, prompt, theme);
  };

  const loadTrialPreset = useCallback(async (preset) => {
    setTrialLoading(true);
    setTrialError(null);
    setActivePreset(preset.label);
    try {
      const files = await Promise.all(
        preset.images.map((img) => urlToFile(img.url, img.name)),
      );
      setImages(files);
      setPrompt(preset.prompt);
      setTheme(preset.theme);
    } catch (err) {
      setTrialError('Could not load sample images. Check your connection and try again.');
    } finally {
      setTrialLoading(false);
    }
  }, []);

  const canSubmit = images.length > 0 && prompt.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="glass-card p-8 space-y-7">

      {/* ── Trial Banner ── */}
      <div className="trial-banner">
        <div className="trial-banner-header">
          <Wand2 size={15} className="trial-icon" />
          <span className="trial-label">Try a Sample</span>
          <span className="trial-sublabel">— no photos needed</span>
        </div>
        <div className="trial-presets">
          {TRIAL_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              disabled={trialLoading}
              onClick={() => loadTrialPreset(preset)}
              className={`trial-preset-btn${activePreset === preset.label ? ' trial-preset-btn--active' : ''}`}
            >
              {trialLoading && activePreset === preset.label ? (
                <Loader2 size={13} className="animate-spin" />
              ) : null}
              {preset.label}
            </button>
          ))}
        </div>
        <AnimatePresence>
          {trialError && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="trial-error"
            >
              {trialError}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ── Upload Zone ── */}
      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-surface-elevated border border-border-dim flex items-center justify-center text-accent-primary">
            <UploadCloud size={28} />
          </div>
          <p className="text-text-secondary text-sm">
            <span className="text-accent-primary font-medium">Click to browse</span> or drag & drop images
          </p>
          <p className="text-text-muted text-xs">PNG, JPG, WebP — no limit</p>
        </div>
      </div>

      {/* ── Image Previews ── */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((file, i) => (
            <motion.div
              key={`${file.name}-${i}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group w-20 h-20 rounded-xl overflow-hidden border border-border-dim"
            >
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(i);
                }}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-accent-warm"
              >
                <X size={20} />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Prompt ── */}
      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <label htmlFor="prompt-input" className="block text-xs font-mono text-text-muted tracking-wider uppercase">
            Narrative Prompt
          </label>
          <span className={`text-xs font-mono ${prompt.length === MAX_PROMPT_LENGTH ? 'text-accent-warm' : 'text-text-muted'}`}>
            {prompt.length} / {MAX_PROMPT_LENGTH}
          </span>
        </div>
        <textarea
          id="prompt-input"
          rows={3}
          placeholder="Describe the story you want to tell…"
          value={prompt}
          onChange={handlePromptChange}
          className="w-full bg-surface-elevated border border-border-dim rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/20 resize-none transition-all"
        />
      </div>

      {/* ── Theme Pills ── */}
      <div className="space-y-2">
        <label className="block text-xs font-mono text-text-muted tracking-wider uppercase">
          Aesthetic Theme
        </label>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTheme(t.value)}
              className={`theme-pill ${theme === t.value ? 'active' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="btn-glow w-full"
      >
        <Play size={18} fill="currentColor" />
        Generate Narrative
      </button>
    </form>
  );
}

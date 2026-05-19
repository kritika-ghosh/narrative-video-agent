import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, X, Play } from 'lucide-react';

const THEMES = [
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'documentary', label: 'Documentary' },
  { value: 'nostalgic', label: 'Nostalgic' },
  { value: 'futuristic', label: 'Futuristic' },
  { value: 'dark', label: 'Dark' },
];

const MAX_PROMPT_LENGTH = 500;

export default function GenerationForm({ onSubmit }) {
  const [images, setImages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [theme, setTheme] = useState('cinematic');
  const [dragOver, setDragOver] = useState(false);
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

  const canSubmit = images.length > 0 && prompt.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="glass-card p-8 space-y-7">
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

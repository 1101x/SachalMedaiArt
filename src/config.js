/* ─── Sound Config ──────────────────────────────────────────── */
const SOUNDS = [
  { id: 'wave',    label: 'WAVE',     file: './src/wave.mp4',    color: '#00e5ff', color2: '#0044cc', glyph: '∿', viz: 'polar'    },
  { id: 'moktak',  label: 'MOKTAK',   file: './src/moktak.mp4',  color: '#ff00cc', color2: '#7700ff', glyph: '◈', viz: 'mandala'  },
  { id: 'crowd01', label: 'CROWD 01', file: './src/crowd01.mp4', color: '#00ff88', color2: '#00cc44', glyph: '⋯', viz: 'particles' },
  { id: 'crowd02', label: 'CROWD 02', file: './src/crowd02.mp4', color: '#ff6600', color2: '#ff0044', glyph: '▊', viz: 'bars'      },
];

/* ─── Particle factory ──────────────────────────────────────── */
function makeParticles(n, w, h) {
  return Array.from({ length: n }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 1.5,
    vy: (Math.random() - 0.5) * 1.5,
  }));
}

/* ─── Hex → "r,g,b" helper ─────────────────────────────────── */
function hexRGB(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

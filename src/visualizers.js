/* ─── VIZ 1: POLAR OSCILLOSCOPE (wave) ─────────────────────── */
function drawPolar(ctx, analyser, t, color, color2, w, h) {
  const fftBuf = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(fftBuf);
  const N = fftBuf.length;
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  const baseR = Math.min(w, h) * 0.32;
  for (let ring = 1; ring <= 4; ring++) {
    const r = baseR * ring * 0.28;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${hexRGB(color)},0.06)`; ctx.lineWidth = 0.5; ctx.stroke();
  }
  for (let spoke = 0; spoke < 12; spoke++) {
    const theta = (spoke / 12) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.lineTo(cx + baseR * 1.2 * Math.cos(theta), cy + baseR * 1.2 * Math.sin(theta));
    ctx.strokeStyle = `rgba(${hexRGB(color)},0.05)`; ctx.lineWidth = 0.5; ctx.stroke();
  }
  const cfgs = [
    { scale: 1.0,  speed:  0.22, lw: 2.0, alpha: 1.0,  col: color  },
    { scale: 0.55, speed: -0.38, lw: 1.0, alpha: 0.55, col: color  },
    { scale: 1.45, speed:  0.14, lw: 0.7, alpha: 0.30, col: color2 },
  ];
  cfgs.forEach(({ scale, speed, lw, alpha, col }, ri) => {
    const R = baseR * scale;
    const rot = t * speed + ri * Math.PI / 3;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(${hexRGB(col)},${alpha})`; ctx.lineWidth = lw;
    for (let i = 0; i <= N; i++) {
      const theta = (i / N) * Math.PI * 2 + rot;
      const amp = (fftBuf[i % N] - 128) / 128;
      const r = R + amp * R * 0.45;
      const x = cx + r * Math.cos(theta), y = cy + r * Math.sin(theta);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.stroke();
  });
  ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
}

/* ─── VIZ 2: GEOMETRIC MANDALA (moktak) ────────────────────── */
function drawMandala(ctx, analyser, t, color, color2, w, h) {
  const freqBuf = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(freqBuf);
  const bassE = freqBuf.slice(0, 6).reduce((a, b) => a + b, 0) / (6 * 255);
  const midE  = freqBuf.slice(6, 60).reduce((a, b) => a + b, 0) / (54 * 255);
  ctx.fillStyle = `rgba(0,0,0,${0.08 + bassE * 0.18})`; ctx.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2, base = Math.min(w, h) * 0.28;
  const gs = 44;
  for (let gx = gs / 2; gx < w; gx += gs) {
    for (let gy = gs / 2; gy < h; gy += gs) {
      const dist = Math.sqrt((gx - cx) ** 2 + (gy - cy) ** 2);
      const wave = Math.sin(dist * 0.018 - t * 2.8) * 0.5 + 0.5;
      const sz = 1.2 * wave * (1 + midE * 2.5);
      ctx.fillStyle = `rgba(${hexRGB(color)},${wave * 0.12})`;
      ctx.beginPath(); ctx.arc(gx, gy, sz, 0, Math.PI * 2); ctx.fill();
    }
  }
  const sides = 6, layers = 9;
  for (let L = 0; L < layers; L++) {
    const r = base * (0.12 + L * 0.10) * (1 + bassE * 0.9);
    const rot = t * (L % 2 === 0 ? 1 : -1) * (0.18 + midE * 0.6) + L * (Math.PI / sides);
    const a = Math.max(0, 1 - L * 0.09);
    ctx.strokeStyle = `rgba(${hexRGB(L < 4 ? color : color2)},${a})`;
    ctx.lineWidth = L === 0 ? 2.5 : Math.max(0.4, 1.8 - L * 0.18);
    ctx.beginPath();
    for (let s = 0; s <= sides; s++) {
      const theta = (s / sides) * Math.PI * 2 + rot;
      const x = cx + r * Math.cos(theta), y = cy + r * Math.sin(theta);
      s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.stroke();
  }
  if (bassE > 0.45) {
    const intensity = (bassE - 0.45) / 0.55, spokes = 18;
    for (let i = 0; i < spokes; i++) {
      const theta = (i / spokes) * Math.PI * 2 + t * 0.5;
      const len = base * (0.5 + intensity * 0.9);
      ctx.strokeStyle = `rgba(${hexRGB(color)},${intensity * 0.8})`; ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(cx + base * 0.08 * Math.cos(theta), cy + base * 0.08 * Math.sin(theta));
      ctx.lineTo(cx + len * Math.cos(theta), cy + len * Math.sin(theta));
      ctx.stroke();
    }
  }
}

/* ─── VIZ 3: PARTICLE CONSTELLATION (crowd01) ──────────────── */
function drawParticles(ctx, analyser, t, color, color2, w, h, parts) {
  const freqBuf = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(freqBuf);
  const energy = freqBuf.reduce((a, b) => a + b, 0) / (freqBuf.length * 255);
  ctx.fillStyle = 'rgba(0,0,0,0.07)'; ctx.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2, rgb = hexRGB(color);
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const fi = Math.floor((p.x / w) * freqBuf.length);
    const fv = freqBuf[Math.min(fi, freqBuf.length - 1)] / 255;
    const angle = Math.sin(p.x * 0.009 + t) * Math.cos(p.y * 0.009 + t * 0.7) * Math.PI * 2;
    p.vx += Math.cos(angle) * 0.08 * (1 + fv * 4);
    p.vy += Math.sin(angle) * 0.08 * (1 + fv * 4);
    if (energy > 0.25) {
      const dx = cx - p.x, dy = cy - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 1;
      p.vx += (dx / dist) * energy * 0.6;
      p.vy += (dy / dist) * energy * 0.6;
    }
    p.vx *= 0.91; p.vy *= 0.91; p.x += p.vx; p.y += p.vy;
    if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
    if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
    const bright = Math.min(1, fv * 2 + 0.25), sz = 1.2 + fv * 3;
    ctx.fillStyle = `rgba(${rgb},${bright * 0.85})`;
    ctx.beginPath(); ctx.arc(p.x, p.y, sz, 0, Math.PI * 2); ctx.fill();
  }
  const maxD = 70 + energy * 110, check = Math.min(60, parts.length);
  for (let i = 0; i < check; i++) {
    for (let j = i + 1; j < check; j++) {
      const dx = parts[i].x - parts[j].x, dy = parts[i].y - parts[j].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < maxD) {
        ctx.strokeStyle = `rgba(${rgb},${(1 - d / maxD) * 0.35 * energy})`;
        ctx.lineWidth = 0.6; ctx.beginPath();
        ctx.moveTo(parts[i].x, parts[i].y); ctx.lineTo(parts[j].x, parts[j].y);
        ctx.stroke();
      }
    }
  }
}

/* ─── VIZ 4: SPECTRAL BARS (crowd02) ───────────────────────── */
function drawBars(ctx, analyser, t, color, color2, w, h) {
  const freqBuf = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(freqBuf);
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(0, 0, w, h);
  const COUNT = 96, barW = w / COUNT, cy = h / 2;
  for (let i = 0; i < COUNT; i++) {
    const val = freqBuf[Math.floor(i * freqBuf.length / COUNT)] / 255;
    const bh = val * h * 0.44, x = i * barW;
    const hue = 20 - (i / COUNT) * 15 + val * 25;
    const sat = 85 + val * 15, lit = 38 + val * 38;
    const grad = ctx.createLinearGradient(x, cy - bh, x, cy);
    grad.addColorStop(0, `hsla(${hue + 25},${sat}%,${lit + 15}%,0.15)`);
    grad.addColorStop(1, `hsla(${hue},${sat}%,${lit}%,0.9)`);
    ctx.fillStyle = grad;
    ctx.fillRect(x, cy - bh, barW - 1, bh);
    ctx.fillRect(x, cy, barW - 1, bh);
    if (val > 0.2) {
      ctx.fillStyle = `hsla(${hue + 30},100%,82%,${val * 0.9})`;
      ctx.fillRect(x, cy - bh - 1, barW - 1, 2);
      ctx.fillRect(x, cy + bh - 1, barW - 1, 2);
    }
  }
  ctx.strokeStyle = `rgba(${hexRGB(color)},0.3)`; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
  for (let sy = 0; sy < h; sy += 4) {
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(0, sy, w, 1);
  }
}

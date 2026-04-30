/* App — React component (uses globals: React, SOUNDS, makeParticles,
   drawPolar, drawMandala, drawParticles, drawBars)              */
const { useState, useRef, useEffect, useCallback } = React;

const App = () => {
  const canvasRef   = useRef(null);
  const audioRef    = useRef(null);
  const ctxRef      = useRef(null);      /* AudioContext */
  const analyserRef = useRef(null);
  const sourceRef   = useRef(null);
  const rafRef      = useRef(0);
  const partsRef    = useRef([]);
  const tRef        = useRef(0);

  const [active, setActive]   = useState(null);
  const [playing, setPlaying] = useState(false);
  const [errMsg, setErrMsg]   = useState('');
  const [ampDb, setAmpDb]     = useState(0);

  /* Resize canvas */
  useEffect(() => {
    const canvas = canvasRef.current;
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      if (active?.id === 'crowd01')
        partsRef.current = makeParticles(320, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [active]);

  /* Button click */
  const handleClick = useCallback(async (sound) => {
    setErrMsg('');
    const canvas = canvasRef.current;

    if (!ctxRef.current)
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const audioCtx = ctxRef.current;
    if (audioCtx.state === 'suspended') await audioCtx.resume();

    if (!audioRef.current) {
      const el = new Audio();
      el.crossOrigin = 'anonymous';
      el.loop = true;
      audioRef.current = el;
    }

    if (!analyserRef.current) {
      const an = audioCtx.createAnalyser();
      an.fftSize = 1024;
      an.smoothingTimeConstant = 0.82;
      an.connect(audioCtx.destination);
      analyserRef.current = an;
    }

    if (!sourceRef.current) {
      sourceRef.current = audioCtx.createMediaElementSource(audioRef.current);
      sourceRef.current.connect(analyserRef.current);
    }

    const audio = audioRef.current;

    /* Toggle pause on same sound */
    if (active?.id === sound.id && playing) {
      audio.pause(); setPlaying(false); return;
    }
    /* Resume same paused sound */
    if (active?.id === sound.id && !playing) {
      try { await audio.play(); setPlaying(true); } catch(e) { setErrMsg(e.message); }
      return;
    }

    /* Switch to new sound */
    audio.src = sound.file;
    audio.load();
    if (sound.id === 'crowd01')
      partsRef.current = makeParticles(320, canvas.width, canvas.height);

    try {
      await audio.play();
      setActive(sound);
      setPlaying(true);
    } catch(e) {
      setErrMsg(`파일 로드 실패: ${sound.file}`);
      console.error(e);
    }
  }, [active, playing]);

  /* Animation loop */
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const c2d = canvas.getContext('2d');
    c2d.clearRect(0, 0, canvas.width, canvas.height);

    const loop = () => {
      tRef.current += 0.016;
      const t = tRef.current;
      const w = canvas.width, h = canvas.height;

      if      (active.viz === 'polar')     drawPolar    (c2d, analyser, t, active.color, active.color2, w, h);
      else if (active.viz === 'mandala')   drawMandala  (c2d, analyser, t, active.color, active.color2, w, h);
      else if (active.viz === 'particles') drawParticles(c2d, analyser, t, active.color, active.color2, w, h, partsRef.current);
      else if (active.viz === 'bars')      drawBars     (c2d, analyser, t, active.color, active.color2, w, h);

      const td = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(td);
      const rms = Math.sqrt(td.reduce((s, v) => s + (v - 128) ** 2, 0) / td.length);
      setAmpDb(Math.round(rms * 10) / 10);

      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  /* ── JSX ────────────────────────────────────────────────────── */
  return (
    React.createElement('div', { style: { position: 'fixed', inset: 0, background: '#000', overflow: 'hidden', fontFamily: "'Share Tech Mono', monospace" } },

      /* Canvas */
      React.createElement('canvas', { ref: canvasRef, style: { position: 'absolute', inset: 0, display: 'block' } }),

      /* Idle prompt */
      !active && React.createElement('div', {
        style: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 12, pointerEvents: 'none' }
      },
        React.createElement('div', { style: { fontSize: 11, letterSpacing: '0.5em', color: 'rgba(255,255,255,0.15)' } }, 'SOUND VISUALIZER'),
        React.createElement('div', { style: { fontSize: 10, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.07)' } },
          'SELECT A SOURCE BELOW',
          React.createElement('span', { className: 'cursor', style: { background: 'rgba(255,255,255,0.2)' } })
        )
      ),

      /* HUD — top left */
      active && React.createElement('div', { className: 'hud-label', style: { top: 28, left: 28, color: active.color } },
        React.createElement('div', { style: { fontSize: 26, marginBottom: 6 } }, active.glyph),
        React.createElement('div', { style: { marginBottom: 3 } }, active.label),
        React.createElement('div', { style: { color: 'rgba(255,255,255,0.25)', fontSize: 9 } },
          playing ? '● REC' : '⏸ PAUSED', ' / AMP ', ampDb)
      ),

      /* HUD — top right */
      active && React.createElement('div', { className: 'hud-label', style: { top: 28, right: 28, textAlign: 'right', color: 'rgba(255,255,255,0.15)', fontSize: 9 } },
        React.createElement('div', null, 'FFT / 1024'),
        React.createElement('div', null, 'SR / ', active.viz.toUpperCase()),
        React.createElement('div', { style: { marginTop: 4, color: active.color, opacity: 0.5 } }, 'LIVE ∿')
      ),

      /* Corner decorations */
      [{ top: 14, left: 14 }, { top: 14, right: 14 }, { bottom: 80, left: 14 }, { bottom: 80, right: 14 }]
        .map((pos, i) =>
          React.createElement('svg', { key: i, width: 12, height: 12, style: { position: 'absolute', opacity: 0.2, ...pos } },
            React.createElement('line', { x1: i % 2 === 0 ? 0 : 12, y1: 0, x2: i % 2 === 0 ? 0 : 12, y2: 12, stroke: '#fff', strokeWidth: 1 }),
            React.createElement('line', { x1: 0, y1: i < 2 ? 0 : 12, x2: 12, y2: i < 2 ? 0 : 12, stroke: '#fff', strokeWidth: 1 })
          )
        ),

      /* Error */
      errMsg && React.createElement('div', {
        style: { position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)',
          color: '#ff4444', padding: '8px 20px', fontSize: 10, letterSpacing: '0.2em', whiteSpace: 'nowrap' }
      }, '✕ ', errMsg),

      /* Bottom button bar */
      React.createElement('div', {
        style: { position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.6)' }
      },
        SOUNDS.map((sound) => {
          const isActive  = active?.id === sound.id;
          const isPlaying = isActive && playing;
          return React.createElement('button', {
            key: sound.id,
            className: 'btn-sound',
            onClick: () => handleClick(sound),
            style: {
              background: isActive ? `${sound.color}18` : 'transparent',
              color: isActive ? sound.color : `${sound.color}66`,
              borderBottom: isActive ? `2px solid ${sound.color}` : '2px solid transparent',
            },
            onMouseEnter: e => { if (!isActive) e.currentTarget.style.background = `${sound.color}0d`; },
            onMouseLeave: e => { if (!isActive) e.currentTarget.style.background = 'transparent'; },
          },
            React.createElement('span', { className: 'glyph' }, sound.glyph),
            sound.label,
            isPlaying && React.createElement('span', {
              style: { position: 'absolute', top: 8, right: 12, width: 5, height: 5,
                borderRadius: '50%', background: sound.color,
                animation: 'blink 1.4s ease-in-out infinite', display: 'block' }
            })
          );
        })
      )
    )
  );
};

// app/components/MobileHeroGlassy.jsx
import React, {useEffect, useRef} from 'react';
import {Link} from '@remix-run/react';

function SnowCanvasInSection({enabled, containerRef, mobileOnly = true}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const flakesRef = useRef([]);
  const ctxRef = useRef(null);
  const spriteRef = useRef(null);
  const sizeRef = useRef({w: 0, h: 0, dpr: 1});
  const runningRef = useRef(false);
  const lastTimeRef = useRef(0);
  const lastRenderRef = useRef(0);
  const fpsRef = useRef(30);

  function prefersReducedMotion() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  }

  function isMobileNow() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(max-width: 749px)')?.matches;
  }

  function getPerfMultiplier() {
    if (typeof navigator === 'undefined') return 1;
    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory || 4;

    if (cores <= 2 || mem <= 2) return 0.65;
    if (cores <= 4 || mem <= 4) return 0.8;
    return 1;
  }

  function getFlakeCount(w, h) {
    // tuned for a hero section (mobile-first)
    const area = w * h;
    let base = Math.round(area / 22000); // ~40-70 typical on mobile hero
    base = Math.max(26, Math.min(base, 80));
    return Math.max(18, Math.round(base * getPerfMultiplier()));
  }

  function makeSprite() {
    const c = document.createElement('canvas');
    c.width = 32;
    c.height = 32;
    const g = c.getContext('2d');
    if (!g) return null;

    const cx = 16;
    const cy = 16;
    const r = 10;

    const grad = g.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, 'rgba(255,255,255,0.95)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');

    g.fillStyle = grad;
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.fill();

    return c;
  }

  function createFlake(w, h, randomY = true) {
    const size = 6 + Math.random() * 10; // 6–16px
    const vy = 28 + Math.random() * 70;
    const vx = -10 + Math.random() * 20;
    const alpha = 0.18 + Math.random() * 0.6;

    return {
      x: Math.random() * w,
      y: randomY ? Math.random() * h : -Math.random() * h,
      size,
      vy,
      vx,
      alpha,
    };
  }

  function resizeAndSync() {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!container || !canvas || !ctx) return;

    const w = container.clientWidth || 0;
    const h = container.clientHeight || 0;
    if (!w || !h) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    sizeRef.current = {w, h, dpr};

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    fpsRef.current = w <= 749 ? 30 : 45;

    const targetCount = getFlakeCount(w, h);
    const current = flakesRef.current;

    if (current.length < targetCount) {
      const add = targetCount - current.length;
      for (let i = 0; i < add; i++) current.push(createFlake(w, h, true));
    } else if (current.length > targetCount) {
      flakesRef.current = current.slice(0, targetCount);
    }
  }

  function clearCanvas() {
    const ctx = ctxRef.current;
    const {w, h} = sizeRef.current;
    if (!ctx || !w || !h) return;
    ctx.clearRect(0, 0, w, h);
  }

  function step(now) {
    if (!runningRef.current) return;

    rafRef.current = requestAnimationFrame(step);

    const ctx = ctxRef.current;
    const sprite = spriteRef.current;
    const {w, h} = sizeRef.current;
    if (!ctx || !sprite || !w || !h) return;

    const targetFps = fpsRef.current || 30;
    const frameInterval = 1000 / targetFps;

    if (!lastTimeRef.current) lastTimeRef.current = now;
    if (!lastRenderRef.current) lastRenderRef.current = now;

    if (now - lastRenderRef.current < frameInterval) return;

    const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = now;
    lastRenderRef.current = now;

    ctx.clearRect(0, 0, w, h);

    const flakes = flakesRef.current;
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];

      f.y += f.vy * dt;
      f.x += f.vx * dt;

      if (f.y > h + 24) {
        f.y = -24;
        f.x = Math.random() * w;
      }
      if (f.x < -30) f.x = w + 30;
      if (f.x > w + 30) f.x = -30;

      ctx.globalAlpha = f.alpha;
      ctx.drawImage(sprite, f.x, f.y, f.size, f.size);
    }

    ctx.globalAlpha = 1;
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!enabled) return;
    if (prefersReducedMotion()) return;
    if (mobileOnly && !isMobileNow()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', {alpha: true, desynchronized: true});
    if (!ctx) return;

    ctxRef.current = ctx;
    spriteRef.current = makeSprite();

    let ro;
    const container = containerRef.current;

    function onResize() {
      if (mobileOnly && !isMobileNow()) {
        runningRef.current = false;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
        clearCanvas();
        return;
      }
      resizeAndSync();
    }

    function onVisibility() {
      if (document.hidden) {
        runningRef.current = false;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      } else {
        if (enabled && (!mobileOnly || isMobileNow())) {
          resizeAndSync();
          lastTimeRef.current = 0;
          lastRenderRef.current = 0;
          runningRef.current = true;
          rafRef.current = requestAnimationFrame(step);
        }
      }
    }

    window.addEventListener('resize', onResize, {passive: true});
    document.addEventListener('visibilitychange', onVisibility);

    if (container && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => onResize());
      ro.observe(container);
    }

    // start
    resizeAndSync();
    lastTimeRef.current = 0;
    lastRenderRef.current = 0;
    runningRef.current = true;
    rafRef.current = requestAnimationFrame(step);

    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      if (ro) ro.disconnect();
      runningRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      clearCanvas();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, mobileOnly]);

  if (!enabled) return null;

  return <canvas ref={canvasRef} className="mhg__snow" aria-hidden="true" />;
}

export default function MobileHeroGlassy({
  mobileImageSrc,
  mobileImageSrcSet,
  alt = '',
  eyebrow,
  title,
  subtitle,
  ctaText,
  ctaTo,
  align = 'bottom', // "bottom" | "center"
  snow = true, // enable/disable the snow for this component only
}) {
  const rootRef = useRef(null);

  return (
    <section ref={rootRef} className="mhg" aria-label={title || 'Hero'}>
      {/* Mobile-only background image (avoids loading the big image on desktop) */}
      <picture className="mhg__bg" aria-hidden="true">
        <source
          media="(max-width: 749px)"
          srcSet={mobileImageSrcSet || mobileImageSrc}
        />
        <img
          className="mhg__img"
          src="data:image/gif;base64,R0lGODlhAQABAAAAACw="
          alt=""
          loading="eager"
          decoding="async"
        />
      </picture>

      {/* Snow layer (scoped to this section only) */}
      <SnowCanvasInSection enabled={snow} containerRef={rootRef} mobileOnly />

      {/* Content layer */}
      <div className={`mhg__content mhg__content--${align}`}>
        <div className="mhg__glass">
          {eyebrow ? <p className="mhg__eyebrow">{eyebrow}</p> : null}
          {title ? <h1 className="mhg__title">{title}</h1> : null}
          {subtitle ? <p className="mhg__subtitle">{subtitle}</p> : null}

          {ctaText && ctaTo ? (
            <Link className="mhg__cta" to={ctaTo} prefetch="intent">
              {ctaText}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

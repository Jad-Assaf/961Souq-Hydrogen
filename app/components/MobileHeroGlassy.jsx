// app/components/MobileHeroGlassy.jsx
import React, {useEffect, useRef} from 'react';
import {Link} from '@remix-run/react';

function SnowCanvasInSection({enabled, containerRef, mobileOnly = true}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const ctxRef = useRef(null);
  const flakesRef = useRef([]);
  const runningRef = useRef(false);

  const sizeRef = useRef({w: 0, h: 0, dpr: 1, fps: 24});
  const lastNowRef = useRef(0);
  const lastFrameMsRef = useRef(0);
  const inViewRef = useRef(true);

  function prefersReducedMotion() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  }

  function isMobileNow() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(max-width: 749px)')?.matches;
  }

  function getConfig(w) {
    const isMobile = w <= 749;
    const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
    const fps = isMobile ? 24 : 30;
    const count = isMobile ? 18 : 40; // intentionally low for section snow
    return {dpr, fps, count};
  }

  function makeFlake(w, h, randomY = true) {
    return {
      x: Math.random() * w,
      y: randomY ? Math.random() * h : -Math.random() * h,
      r: 0.7 + Math.random() * 1.6,
      vy: 16 + Math.random() * 45,
      vx: -6 + Math.random() * 12,
      a: 0.12 + Math.random() * 0.42,
    };
  }

  function sync() {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!container || !canvas || !ctx) return;

    const w = Math.max(1, Math.floor(container.clientWidth || 0));
    const h = Math.max(1, Math.floor(container.clientHeight || 0));
    if (!w || !h) return;

    const {dpr, fps, count} = getConfig(w);
    sizeRef.current = {w, h, dpr, fps};

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const arr = flakesRef.current;
    if (arr.length < count) {
      for (let i = arr.length; i < count; i++) arr.push(makeFlake(w, h, true));
    } else if (arr.length > count) {
      flakesRef.current = arr.slice(0, count);
    }
  }

  function clear() {
    const ctx = ctxRef.current;
    const {w, h} = sizeRef.current;
    if (!ctx || !w || !h) return;
    ctx.clearRect(0, 0, w, h);
  }

  function stop() {
    runningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    clear();
  }

  function start() {
    if (runningRef.current) return;
    sync();
    lastNowRef.current = 0;
    lastFrameMsRef.current = 0;
    runningRef.current = true;
    rafRef.current = requestAnimationFrame(draw);
  }

  function draw(now) {
    if (!runningRef.current) return;
    rafRef.current = requestAnimationFrame(draw);

    if (!inViewRef.current) return;

    const ctx = ctxRef.current;
    const {w, h, fps} = sizeRef.current;
    if (!ctx || !w || !h || !fps) return;

    const frameInterval = 1000 / fps;

    if (!lastNowRef.current) lastNowRef.current = now;
    if (!lastFrameMsRef.current) lastFrameMsRef.current = now;

    if (now - lastFrameMsRef.current < frameInterval) return;

    const dt = Math.min((now - lastNowRef.current) / 1000, 0.05);
    lastNowRef.current = now;
    lastFrameMsRef.current = now;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';

    const flakes = flakesRef.current;
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];

      f.y += f.vy * dt;
      f.x += f.vx * dt;

      if (f.y > h + 20) {
        f.y = -20;
        f.x = Math.random() * w;
      }
      if (f.x < -20) f.x = w + 20;
      if (f.x > w + 20) f.x = -20;

      ctx.globalAlpha = f.a;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
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

    const container = containerRef.current;
    if (!container) return;

    // Only run when visible
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        inViewRef.current = !!entry?.isIntersecting;
        if (inViewRef.current && enabled) start();
        else stop();
      },
      {threshold: 0.05},
    );
    io.observe(container);

    function onResize() {
      if (mobileOnly && !isMobileNow()) {
        stop();
        return;
      }
      sync();
    }

    window.addEventListener('resize', onResize, {passive: true});

    // initial
    sync();
    start();

    return () => {
      io.disconnect();
      window.removeEventListener('resize', onResize);
      stop();
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

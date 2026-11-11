import { useEffect, useRef } from "react";
const rand = (a, b) => a + Math.random() * (b - a);
export default function Background() {
  const canvas = useRef(null);
  useEffect(() => {
    let animation;
    const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cv = canvas.current,
      ctx = cv.getContext("2d");
    let W = 0,
      H = 0,
      dpr = 1;
    const stars = [],
      dust = [],
      parts = [];
    let last = performance.now();
    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth;
      H = innerHeight;
      cv.width = W * dpr;
      cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars.length = 0;
      const n = Math.round((W * H) / 8500);
      for (let i = 0; i < n; i++)
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: rand(0.25, 1.15),
          p: rand(0, 6.28),
          s: rand(0.4, 1.5),
          a: rand(0.2, 0.65),
        });
      dust.length = 0;
      for (let i = 0; i < 42; i++)
        dust.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: rand(0.5, 1.8),
          vx: rand(-0.1, 0.1),
          vy: -rand(0.04, 0.22),
          a: rand(0.12, 0.5),
          p: rand(0, 6.28),
        });
    }
    function emit(x, y, o = {}) {
      const n = o.n ?? 14;
      for (let i = 0; i < n; i++) {
        const a =
          o.dir != null
            ? o.dir + (Math.random() - 0.5) * (o.arc ?? 1)
            : Math.random() * 6.283;
        const sp = (o.speed ?? 2.2) * (0.3 + Math.random());
        parts.push({
          x: x + rand(-(o.jitter ?? 0), o.jitter ?? 0),
          y: y + rand(-(o.jitter ?? 0), o.jitter ?? 0),
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          age: 0,
          max: (o.life ?? 900) * rand(0.6, 1.2),
          r: (o.size ?? 1.8) * rand(0.5, 1.5),
          spark: Math.random() < 0.4,
          g: o.g ?? 0.02,
        });
      }
    }
    function sparkle(x, y, r, a) {
      ctx.beginPath();
      ctx.moveTo(x, y - r * 3);
      ctx.quadraticCurveTo(x, y, x + r * 3, y);
      ctx.quadraticCurveTo(x, y, x, y + r * 3);
      ctx.quadraticCurveTo(x, y, x - r * 3, y);
      ctx.quadraticCurveTo(x, y, x, y - r * 3);
      ctx.fillStyle = `rgba(255,238,185,${a})`;
      ctx.fill();
    }
    function frame(t) {
      const dt = Math.min(40, t - last);
      last = t;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      for (const s of stars) {
        const a = REDUCED
          ? s.a * 0.7
          : s.a * (0.45 + 0.55 * Math.sin(t * 0.001 * s.s + s.p));
        ctx.fillStyle = `rgba(246,232,196,${Math.max(0, a)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, 6.283);
        ctx.fill();
      }
      if (!REDUCED)
        for (const d of dust) {
          d.x += (d.vx * dt) / 16 + Math.sin(t * 0.0004 + d.p) * 0.12;
          d.y += (d.vy * dt) / 16;
          if (d.y < -10) {
            d.y = H + 10;
            d.x = Math.random() * W;
          }
          if (d.x < -10) d.x = W + 10;
          if (d.x > W + 10) d.x = -10;
          const a = d.a * (0.5 + 0.5 * Math.sin(t * 0.0009 + d.p));
          ctx.fillStyle = `rgba(224,190,110,${a})`;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, 6.283);
          ctx.fill();
        }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.age += dt;
        if (p.age >= p.max) {
          parts.splice(i, 1);
          continue;
        }
        const k = dt / 16;
        p.vx *= 0.985;
        p.vy = p.vy * 0.985 + p.g * k;
        p.x += p.vx * k;
        p.y += p.vy * k;
        const a = 1 - p.age / p.max;
        if (p.spark) sparkle(p.x, p.y, p.r * a, a);
        else {
          ctx.fillStyle = `rgba(246,214,130,${a * 0.85})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * (0.4 + a * 0.6), 0, 6.283);
          ctx.fill();
        }
      }
      ctx.globalCompositeOperation = "source-over";
      animation = requestAnimationFrame(frame);
    }
    addEventListener("resize", resize);
    resize();
    animation = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(animation);
      removeEventListener("resize", resize);
    };
  }, []);
  return (
    <>
      <canvas id="fx" ref={canvas} aria-hidden="true" />
      <div className="vignette" />
      <svg className="moons" viewBox="0 0 520 40" aria-hidden="true">
        {[0.08, 0.28, 0.5, 0.76, 1, 0.76, 0.5, 0.28, 0.08].map((p, i) => {
          const r = i === 4 ? 12 : 8;
          return (
            <g
              key={i}
              transform={`translate(${30 + i * 57.5} 20) ${i > 4 ? "scale(-1 1)" : ""}`}
            >
              <circle r={r} />
              <path
                className="lit"
                d={`M0 ${-r}A${r} ${r} 0 0 1 0 ${r}A${(r * Math.abs(1 - 2 * p)).toFixed(2)} ${r} 0 0 ${p < 0.5 ? 0 : 1} 0 ${-r}Z`}
              />
            </g>
          );
        })}
      </svg>
    </>
  );
}

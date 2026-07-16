'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { ReactNode, useEffect, useState, useRef } from 'react';

interface StatItem {
  value: number;
  label: string;
  icon?: ReactNode;
  color?: string;
}

interface VodafoneHeroProps {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  stats?: StatItem[];
  action?: ReactNode;
}

// ─── Shimmer ───
export function ShimmerText({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      {children}
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer bg-[length:200%_100%]" />
    </span>
  );
}

// ─── Aurora (4-layer reactbits-style) ───
function Aurora() {
  const layers = [
    { cx: 25, cy: 30, color: '#E60000', blur: 100 },
    { cx: 55, cy: 60, color: '#CC0000', blur: 80 },
    { cx: 80, cy: 20, color: '#FF3333', blur: 90 },
    { cx: 35, cy: 80, color: '#990000', blur: 70 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {layers.map((l, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 opacity-[0.18]"
          style={{
            background: `radial-gradient(ellipse at ${l.cx}% ${l.cy}%, ${l.color} 0%, transparent 60%)`,
            filter: `blur(${l.blur}px)`,
          }}
          animate={{
            x: [0, (i % 2 ? 30 : -25) * (i + 1), 0],
            y: [0, -20 * (i + 1), 0],
            scale: [1, 1.12 - i * 0.02, 1],
          }}
          transition={{
            duration: 14 + i * 3,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 1.8,
          }}
        />
      ))}
    </div>
  );
}

// ─── BorderTrail ───
function BorderTrail() {
  return (
    <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
      <motion.div
        className="absolute inset-0"
        style={{
          borderRadius: 'inherit',
          border: '1px solid transparent',
          background: 'linear-gradient(135deg, transparent 25%, #E60000 40%, #FF3333 50%, #E60000 60%, transparent 75%) border-box',
          WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
        animate={{ backgroundPosition: ['300% 0%', '-300% 0%'] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

// ─── Floating orbs ───
function FloatingOrbs() {
  const orbs = [
    { s: 260, x: 82, y: 8, d: 13, c: 'from-red-600/20 to-transparent' },
    { s: 180, x: 92, y: 52, d: 16, c: 'from-orange-500/15 to-transparent' },
    { s: 160, x: 8, y: 62, d: 12, c: 'from-red-700/12 to-transparent' },
    { s: 130, x: 18, y: 18, d: 15, c: 'from-rose-500/10 to-transparent' },
    { s: 220, x: 72, y: 82, d: 19, c: 'from-red-800/8 to-transparent' },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {orbs.map((o, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full bg-gradient-to-b ${o.c} blur-3xl`}
          style={{ width: o.s, height: o.s, left: `${o.x}%`, top: `${o.y}%` }}
          animate={{ y: [0, -45 - i * 5, 0], x: [0, i % 2 ? 18 : -14, 0], scale: [1, 1.18 - i * 0.02, 1] }}
          transition={{ duration: o.d, repeat: Infinity, ease: 'easeInOut', delay: i * 2.2 }}
        />
      ))}
    </div>
  );
}

// ─── Particles (reactbits-style, red tinted) ───
function Particles() {
  const p = useRef(
    Array.from({ length: 55 }, (_, i) => ({
      id: i,
      s: Math.random() * 3 + 0.5,
      x: Math.random() * 100,
      y: Math.random() * 100,
      dl: Math.random() * 10,
      du: Math.random() * 8 + 5,
      op: Math.random() * 0.3 + 0.02,
      dx: (Math.random() - 0.5) * 40,
      dy: (Math.random() - 0.5) * 20 - 12,
      isRed: i % 2 === 0,
    }))
  ).current;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {p.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.s, height: p.s,
            left: `${p.x}%`, top: `${p.y}%`,
            background: p.isRed
              ? 'radial-gradient(circle, rgba(230,0,0,0.6), transparent)'
              : 'radial-gradient(circle, rgba(255,255,255,0.3), transparent)',
            boxShadow: p.isRed ? '0 0 4px rgba(230,0,0,0.3)' : 'none',
          }}
          animate={{ y: [0, p.dy, 0], x: [0, p.dx, 0], opacity: [p.op, p.op * 3, p.op] }}
          transition={{ duration: p.du, repeat: Infinity, delay: p.dl, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ─── Splash blob (reactbits SplashCursor-inspired) ───
function SplashBlob() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 18 });
  const sy = useSpring(my, { stiffness: 40, damping: 18 });

  useEffect(() => {
    const h = (e: MouseEvent) => { mx.set(e.clientX); my.set(e.clientY); };
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, [mx, my]);

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle at center, rgba(230,0,0,0.07) 0%, rgba(255,50,50,0.03) 30%, transparent 70%)',
        x: useTransform(sx, v => v - 300),
        y: useTransform(sy, v => v - 300),
      }}
    />
  );
}

// ─── Spotlight cursor ───
function Spotlight() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 80, damping: 25 });
  const sy = useSpring(my, { stiffness: 80, damping: 25 });
  const op = useMotionValue(0);

  useEffect(() => {
    const h = (e: MouseEvent) => { mx.set(e.clientX); my.set(e.clientY); op.set(1); };
    const l = () => op.set(0);
    window.addEventListener('mousemove', h);
    window.addEventListener('mouseleave', l);
    return () => { window.removeEventListener('mousemove', h); window.removeEventListener('mouseleave', l); };
  }, [mx, my, op]);

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        width: 650, height: 650, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(230,0,0,0.15) 0%, rgba(255,51,51,0.06) 40%, transparent 70%)',
        x: useTransform(sx, v => v - 325),
        y: useTransform(sy, v => v - 325),
        opacity: op,
      }}
    />
  );
}

// ─── Scan lines ───
function ScanLines() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.015]"
      style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.5) 1px, rgba(255,255,255,0.5) 2px)',
      }}
    />
  );
}

// ─── Animated counter ───
function AnimatedCount({ value, label, icon, color = 'text-white' }: { value: number; label: string; icon?: ReactNode; color?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    counted.current = false;
    setCount(0);
    const el = ref.current;
    if (!el) return;
    if (value === 0) {
      counted.current = true;
      return;
    }
    const o = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !counted.current) {
          counted.current = true;
          let s = 0;
          const step = Math.max(1, Math.ceil(value / 30));
          const t = setInterval(() => { s += step; if (s >= value) { setCount(value); clearInterval(t); } else setCount(s); }, 25);
        }
      },
      { threshold: 0.3 }
    );
    o.observe(el);
    return () => o.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="group relative">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-600/15 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-all duration-500" />
      <div className="relative flex items-center gap-3 px-4 py-2.5 rounded-xl border border-red-500/20 bg-black/40 backdrop-blur-sm hover:bg-black/50 transition-all">
        {icon && <div className="text-red-400/70">{icon}</div>}
        <div>
          <div className="flex items-baseline gap-0.5">
            <span className={`text-xl font-black tabular-nums tracking-tight ${color}`}>{count}</span>
          </div>
          <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/40">{label}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Vodafone diagonal split (multi-layer, dramatic) ───
function VodafoneDiagonalSplit() {
  return (
    <>
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'linear-gradient(160deg, transparent 30%, rgba(230,0,0,0.18) 50%, rgba(200,0,0,0.28) 65%, transparent 82%)',
        clipPath: 'polygon(28% 0%, 100% 0%, 100% 100%, 0% 100%)',
        transform: 'skewX(-14deg) translateX(14%)',
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'linear-gradient(180deg, rgba(255,51,51,0.1) 0%, rgba(230,0,0,0.14) 50%, rgba(150,0,0,0.06) 100%)',
        clipPath: 'polygon(42% 0%, 100% 0%, 100% 100%, 12% 100%)',
        transform: 'skewX(-14deg) translateX(10%)',
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.04) 60%, transparent 70%)',
        clipPath: 'polygon(33% 0%, 100% 0%, 100% 100%, 3% 100%)',
        transform: 'skewX(-14deg) translateX(12%)',
      }} />
      <div className="absolute top-1/4 -translate-y-1/2 right-0 w-96 h-96 bg-red-500/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[200px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-orange-500/8 rounded-full blur-[120px] pointer-events-none" />
    </>
  );
}

// ─── Main Hero ───
export default function VodafoneHero({ eyebrow, title, subtitle, stats, action }: VodafoneHeroProps) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useRef(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const o = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !visible.current) {
        visible.current = true;
        setInView(true);
      }
    }, { threshold: 0.1 });
    o.observe(el);
    return () => o.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative overflow-hidden rounded-2xl min-h-[280px]">
      {/* Cinematic dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#020202] via-[#080505] to-[#100202]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Grid texture */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_50%_50%,white_1px,transparent_1px)] bg-[length:22px_22px]" />

      {/* Scan lines */}
      <ScanLines />

      {/* Aurora */}
      <Aurora />

      {/* Vodafone diagonal */}
      <VodafoneDiagonalSplit />

      {/* Top animated border */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: 'linear-gradient(90deg, transparent, #E60000 20%, #FF3333 50%, #E60000 80%, transparent)' }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={inView ? { scaleX: 1, opacity: 1 } : {}}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />

      {/* Bottom glow */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(230,0,0,0.35) 50%, transparent)' }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={inView ? { scaleX: 1, opacity: 1 } : {}}
        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
      />

      {/* Border trail */}
      <BorderTrail />

      {/* Interactive layers */}
      <Spotlight />
      <SplashBlob />
      <FloatingOrbs />
      <Particles />

      {/* Content */}
      <div className="relative z-10 px-6 py-6 md:px-10 md:py-8 flex items-center justify-between gap-6 min-h-[280px]">
        <div className="min-w-0 max-w-xl">
          {/* Eyebrow */}
          <motion.div
            className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 rounded-full border border-red-500/20 bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-[0.15em]"
            initial={{ opacity: 0, y: -10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            {eyebrow}
          </motion.div>

          {/* Title */}
          <motion.h1
            className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {title}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-[11px] md:text-xs text-slate-400 max-w-lg leading-relaxed font-medium"
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            {subtitle}
          </motion.p>
        </div>

        {/* Stats + Action */}
        <div className="flex flex-col gap-3 items-end shrink-0">
          {stats && stats.length > 0 && (
            <motion.div
              className="flex flex-wrap gap-2 justify-end"
              initial={{ opacity: 0, x: 20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.45 }}
            >
              {stats.map((s, i) => (
                <AnimatedCount key={i} {...s} />
              ))}
            </motion.div>
          )}
          {action && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.55 }}
            >
              {action}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

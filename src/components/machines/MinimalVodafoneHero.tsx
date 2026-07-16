'use client';

import { motion } from 'motion/react';
import { ReactNode, useEffect, useState, useRef } from 'react';

interface StatItem {
  value: number;
  label: string;
  icon?: ReactNode;
  color?: string;
}

interface MinimalVodafoneHeroProps {
  eyebrow: string;
  title: ReactNode;
  subtitle?: string;
  stats?: StatItem[];
  action?: ReactNode;
  className?: string;
}

// ─── Shimmer Text ─────────────────────────────────────────────────────────────
export function ShimmerText({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      {children}
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-shimmer bg-[length:200%_100%]" />
    </span>
  );
}

// ─── Minimal Animated Counter ─────────────────────────────────────────────────
function MiniCount({ value, label, icon, color = 'text-white' }: { value: number; label: string; icon?: ReactNode; color?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    counted.current = false;
    setCount(0);
    const el = ref.current;
    if (!el) return;
    if (value === 0) { counted.current = true; return; }
    const o = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !counted.current) {
        counted.current = true;
        let s = 0;
        const step = Math.max(1, Math.ceil(value / 25));
        const t = setInterval(() => {
          s += step;
          if (s >= value) { setCount(value); clearInterval(t); }
          else setCount(s);
        }, 20);
      }
    }, { threshold: 0.3 });
    o.observe(el);
    return () => o.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-red-500/20 bg-black/30 backdrop-blur-sm hover:bg-black/40 transition-all">
      {icon && <span className="text-red-400/70">{icon}</span>}
      <div>
        <span className={`text-lg font-black tabular-nums ${color}`}>{count}</span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-white/40 block">{label}</span>
      </div>
    </div>
  );
}

// ─── Main Minimal Hero ────────────────────────────────────────────────────────
export default function MinimalVodafoneHero({ eyebrow, title, subtitle, stats, action, className = '' }: MinimalVodafoneHeroProps) {
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
    <section ref={ref} className={`relative overflow-hidden rounded-2xl ${className}`} style={{ minHeight: 180 }}>
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0f0505] to-[#0a0505]" />
      
      {/* Subtle red accent */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'linear-gradient(135deg, transparent 40%, rgba(230,0,0,0.12) 60%, rgba(200,0,0,0.08) 80%, transparent 100%)',
        clipPath: 'polygon(35% 0%, 100% 0%, 100% 100%, 0% 100%)',
      }} />
      
      {/* Grid texture */}
      <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_50%_50%,white_1px,transparent_1px)] bg-[length:20px_20px]" />

      {/* Top red border */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-[1.5px]"
        style={{ background: 'linear-gradient(90deg, transparent, #E60000 30%, #FF3333 50%, #E60000 70%, transparent)' }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={inView ? { scaleX: 1, opacity: 1 } : {}}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />

      {/* Bottom glow */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(230,0,0,0.3) 50%, transparent)' }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={inView ? { scaleX: 1, opacity: 1 } : {}}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
      />

      {/* Red orb accent */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-red-500/8 rounded-full blur-[80px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 px-5 py-5 md:px-8 md:py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Eyebrow */}
          <motion.div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-3 rounded-full border border-red-500/25 bg-red-500/10 text-red-400 text-[9px] font-bold uppercase tracking-[0.15em]"
            initial={{ opacity: 0, y: -8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            {eyebrow}
          </motion.div>

          {/* Title */}
          <motion.h1
            className="text-xl md:text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight mb-1.5"
            initial={{ opacity: 0, y: 15 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            {title}
          </motion.h1>

          {/* Subtitle */}
          {subtitle && (
            <motion.p
              className="text-[10px] md:text-xs text-slate-400 max-w-lg leading-relaxed font-medium"
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.25 }}
            >
              {subtitle}
            </motion.p>
          )}
        </div>

        {/* Stats + Action */}
        <div className="flex flex-col md:items-end gap-2 shrink-0">
          {stats && stats.length > 0 && (
            <motion.div
              className="flex flex-wrap gap-2 md:justify-end"
              initial={{ opacity: 0, x: 15 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              {stats.map((s, i) => (
                <MiniCount key={i} {...s} />
              ))}
            </motion.div>
          )}
          {action && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.35, delay: 0.45 }}
            >
              {action}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

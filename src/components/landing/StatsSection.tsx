'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Package, Wrench, Activity, Clock, Shield, Zap } from 'lucide-react';

const stats = [
  {
    icon: Package,
    value: 684,
    suffix: '+',
    label: 'SKU Aktif',
    description: 'Suku cadang terkelola',
    color: '#22D3EE',
    bgColor: 'rgba(34,211,238,0.1)',
    borderColor: 'rgba(34,211,238,0.2)',
  },
  {
    icon: Wrench,
    value: 724,
    suffix: '+',
    label: 'Parts Terkelola',
    description: 'Komponen engineering',
    color: '#3B82F6',
    bgColor: 'rgba(59,130,246,0.1)',
    borderColor: 'rgba(59,130,246,0.2)',
  },
  {
    icon: Activity,
    value: 182,
    suffix: '+',
    label: 'Work Orders',
    description: 'Tiket aktif diproses',
    color: '#6366F1',
    bgColor: 'rgba(99,102,241,0.1)',
    borderColor: 'rgba(99,102,241,0.2)',
  },
  {
    icon: Clock,
    value: 24,
    suffix: '/7',
    label: 'Real-time',
    description: 'Monitoring tanpa henti',
    color: '#22D3EE',
    bgColor: 'rgba(34,211,238,0.1)',
    borderColor: 'rgba(34,211,238,0.2)',
  },
];

const badges = [
  { icon: Shield, text: 'Enkripsi SSL', color: '#4ADE80' },
  { icon: Zap, text: 'Fast Access', color: '#22D3EE' },
  { icon: Activity, text: 'Real-time Data', color: '#3B82F6' },
];

function AnimatedCounter({ target, suffix, color }: { target: number; suffix: string; color: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref} style={{ color }}>
      {count.toLocaleString('id-ID')}
      {suffix}
    </span>
  );
}

export default function StatsSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  return (
    <section className="relative py-20 md:py-32 px-4">
      {/* Divider glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.15), transparent)' }} />

      <div ref={sectionRef} className="max-w-5xl mx-auto">
        {/* Section header */}
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-cyan-400/60 mb-3 block">
            Statistik Sistem
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
            Dipercaya untuk{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #22D3EE, #0891B2)' }}>
              Performa Terbaik
            </span>
          </h2>
          <p className="text-sm md:text-base text-white/40">
            Data real-time dari sistem ENGSYS yang terus beroperasi.
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 mb-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                className="group relative p-5 md:p-6 rounded-2xl text-center overflow-hidden"
                style={{
                  background: 'rgba(10, 16, 32, 0.6)',
                  border: `1px solid ${stat.borderColor}`,
                  backdropFilter: 'blur(10px)',
                }}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, borderColor: stat.color }}
              >
                {/* Hover glow */}
                <div
                  className="absolute -top-10 -right-10 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: stat.bgColor }}
                />

                <div
                  className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: stat.bgColor, border: `1px solid ${stat.borderColor}` }}
                >
                  <Icon size={20} style={{ color: stat.color }} />
                </div>

                <div className="text-2xl md:text-3xl font-black mb-1">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} color={stat.color} />
                </div>
                <p className="text-xs font-bold text-white/70 mb-0.5">{stat.label}</p>
                <p className="text-[10px] text-white/30">{stat.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Trust badges */}
        <motion.div
          className="flex flex-wrap justify-center gap-3"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.text}
                className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <Icon size={12} style={{ color: badge.color }} />
                <span className="text-[10px] font-semibold text-white/50">{badge.text}</span>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* Bottom divider */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.15), transparent)' }} />
    </section>
  );
}
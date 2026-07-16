'use client';

import React from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Boxes, ClipboardList, Settings, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: Boxes,
    title: 'Smart Inventory',
    subtitle: 'Monitoring Real-time',
    description:
      'Kelola 684+ SKU suku cadang dengan monitoring real-time, alert stok minimum, dan valuasi aset otomatis.',
    stats: ['684+ SKU', 'Real-time', 'Auto Alert'],
    gradient: 'from-cyan-500/20 to-blue-500/20',
    iconBg: 'rgba(34,211,238,0.12)',
    iconColor: '#22D3EE',
    borderColor: 'rgba(34,211,238,0.15)',
  },
  {
    icon: ClipboardList,
    title: 'Work Order',
    subtitle: 'Kanban Board & Tracking',
    description:
      'Sistem tiket work order dengan Kanban board, tracking progress, dan klasifikasi masalah otomatis.',
    stats: ['Kanban', 'Auto Track', 'Priority'],
    gradient: 'from-blue-500/20 to-indigo-500/20',
    iconBg: 'rgba(59,130,246,0.12)',
    iconColor: '#3B82F6',
    borderColor: 'rgba(59,130,246,0.15)',
  },
  {
    icon: Settings,
    title: 'Preventive Maintenance',
    subtitle: 'Jadwal & Kontrol',
    description:
      'Jadwalkan dan pantau maintenance preventif untuk menjaga mesin tetap beroperasi optimal.',
    stats: ['Scheduler', 'MTTR', 'Report'],
    gradient: 'from-indigo-500/20 to-purple-500/20',
    iconBg: 'rgba(99,102,241,0.12)',
    iconColor: '#6366F1',
    borderColor: 'rgba(99,102,241,0.15)',
  },
];

function FeatureCard({ feature, index }: { feature: (typeof features)[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const Icon = feature.icon;

  return (
    <motion.div
      ref={ref}
      className="group relative"
      initial={{ opacity: 0, y: 60, rotateX: -10 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.15, ease: 'easeOut' }}
      style={{ perspective: '1000px' }}
    >
      <motion.div
        className="relative p-6 md:p-8 rounded-2xl overflow-hidden cursor-default"
        style={{
          background: 'rgba(10, 16, 32, 0.7)',
          border: `1px solid ${feature.borderColor}`,
          backdropFilter: 'blur(20px)',
        }}
        whileHover={{
          scale: 1.03,
          rotateY: 5,
          rotateX: -3,
          boxShadow: `0 20px 60px ${feature.borderColor}`,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Top gradient line */}
        <div
          className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r ${feature.gradient} opacity-60`}
        />

        {/* Corner glow */}
        <div
          className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: feature.iconBg }}
        />

        {/* Icon */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 relative"
          style={{
            background: feature.iconBg,
            border: `1px solid ${feature.borderColor}`,
          }}
        >
          <Icon size={24} style={{ color: feature.iconColor }} />
          {/* Icon glow */}
          <div
            className="absolute inset-0 rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity"
            style={{ background: feature.iconBg }}
          />
        </div>

        {/* Title */}
        <h3 className="text-lg md:text-xl font-bold text-white mb-1">{feature.title}</h3>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: feature.iconColor }}>
          {feature.subtitle}
        </p>

        {/* Description */}
        <p className="text-sm text-white/50 leading-relaxed mb-5">{feature.description}</p>

        {/* Stats pills */}
        <div className="flex flex-wrap gap-2 mb-5">
          {feature.stats.map((stat) => (
            <span
              key={stat}
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{
                background: feature.iconBg,
                color: feature.iconColor,
                border: `1px solid ${feature.borderColor}`,
              }}
            >
              {stat}
            </span>
          ))}
        </div>

        {/* Bottom link */}
        <div
          className="flex items-center gap-1.5 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: feature.iconColor }}
        >
          <span>Melangkah</span>
          <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function FeaturesSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section id="features" className="relative py-20 md:py-32 px-4">
      {/* Section header */}
      <div ref={sectionRef} className="text-center mb-12 md:mb-16 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-cyan-400/60 mb-3 block">
            Fitur Utama
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
            Solusi Lengkap untuk{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #22D3EE, #0891B2)' }}>
              Engineering
            </span>
          </h2>
          <p className="text-sm md:text-base text-white/40">
            Sistem terintegrasi yang menghubungkan inventori, work order, dan maintenance dalam satu platform.
          </p>
        </motion.div>
      </div>

      {/* Feature cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
        {features.map((feature, index) => (
          <FeatureCard key={feature.title} feature={feature} index={index} />
        ))}
      </div>
    </section>
  );
}
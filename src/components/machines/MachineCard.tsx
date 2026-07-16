'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Settings, AlertTriangle, Zap, Wrench, MapPin, Cpu, Gauge } from 'lucide-react';
import { StatusBadge, MachineStatus } from '../ui/StatusBadge';

export interface MachineData {
  id: string; // MCH-001
  name: string;
  description?: string | null;
  area?: string | null;
  status: MachineStatus;
  machineType?: string | null;
  manufacturer?: string | null;
  powerWatt?: number | null;
  airPressureValue?: number | null;
  electricalCount: number;
  mechanicalCount: number;
  hasCriticalAlert: boolean;
}

interface MachineCardProps {
  machine: MachineData;
  index?: number;
}

export function MachineCard({ machine, index = 0 }: MachineCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.06,
        ease: [0.16, 1, 0.3, 1]
      }}
    >
      <Link href={`/machines/${machine.id.replace(/\//g, '___')}`} className="block group">
        <motion.div 
          className={`relative overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 p-5 transition-all duration-300 ${
            machine.hasCriticalAlert
              ? 'border-red-200 dark:border-red-950 shadow-lg shadow-red-500/10'
              : 'border-slate-200 dark:border-slate-800 hover:border-red-500/50 dark:hover:border-red-500/50'
          }`}
          whileHover={{ y: -6, boxShadow: '0 20px 40px -12px rgba(220, 38, 38, 0.25)' }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Gradient Accent Bar */}
          <div className={`absolute top-0 left-0 right-0 h-1 ${
            machine.hasCriticalAlert 
              ? 'bg-gradient-to-r from-red-500 to-red-600' 
              : 'bg-gradient-to-r from-red-500 via-red-500 to-red-600'
          }`} />
          
          {/* Animated Background Glow on Hover */}
          <motion.div 
            className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-red-500/5 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          {/* Indikator Kritikalitas (Merah di sudut) */}
          {machine.hasCriticalAlert && (
            <motion.div 
              className="absolute top-3 right-3 flex h-6 items-center gap-1 rounded-full bg-red-500 px-2.5 text-[9px] font-bold text-white uppercase tracking-wider shadow-lg shadow-red-500/30"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            >
              <AlertTriangle size={10} />
              <span>Kritis</span>
            </motion.div>
          )}

          {/* Kode & Status Mesin */}
          <div className="flex items-center justify-between mt-2">
            <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider">
              {machine.id}
            </span>
            {!machine.hasCriticalAlert && <StatusBadge status={machine.status} />}
          </div>

          {/* Nama Mesin - Bold & Prominent */}
          <h3 className="mt-3 text-base font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
            {machine.name}
          </h3>

          {/* Deskripsi & Area */}
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin size={12} className="text-red-500" />
            <span className="truncate font-medium">{machine.area || 'Tanpa Area'}</span>
          </div>

          {/* Quick Specs Pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            {machine.machineType && (
              <motion.span 
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg"
                whileHover={{ scale: 1.05 }}
              >
                <Cpu size={10} className="text-red-500" />
                {machine.machineType}
              </motion.span>
            )}
            {machine.powerWatt && (
              <motion.span 
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-lg"
                whileHover={{ scale: 1.05 }}
              >
                <Zap size={10} />
                {(machine.powerWatt / 1000).toFixed(1)}kW
              </motion.span>
            )}
            {machine.airPressureValue && (
              <motion.span 
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg"
                whileHover={{ scale: 1.05 }}
              >
                <Gauge size={10} />
                {machine.airPressureValue} bar
              </motion.span>
            )}
          </div>

          {/* Ringkasan Suku Cadang Terhubung */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/20"
              whileHover={{ scale: 1.05 }}
            >
              <Zap size={14} className="text-amber-500" />
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{machine.electricalCount}</span>
              <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70">Elektrik</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/20"
              whileHover={{ scale: 1.05 }}
            >
              <Wrench size={14} className="text-blue-500" />
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400">{machine.mechanicalCount}</span>
              <span className="text-[10px] text-blue-600/70 dark:text-blue-400/70">Mekanik</span>
            </motion.div>
          </div>

          {/* Bottom Accent Line */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
      </Link>
    </motion.div>
  );
}

export default MachineCard;

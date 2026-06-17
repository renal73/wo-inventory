'use client';

import React from 'react';
import Link from 'next/link';
import { Settings, AlertTriangle, Zap, Wrench, MapPin } from 'lucide-react';
import { StatusBadge, MachineStatus } from '../ui/StatusBadge';

export interface MachineData {
  id: string; // MCH-001
  name: string;
  description?: string | null;
  area?: string | null;
  status: MachineStatus;
  electricalCount: number;
  mechanicalCount: number;
  hasCriticalAlert: boolean;
}

interface MachineCardProps {
  machine: MachineData;
}

export function MachineCard({ machine }: MachineCardProps) {
  return (
    <Link href={`/machines/${machine.id}`} className="block group">
      <div 
        className={`relative overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 p-5 shadow-xs transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md ${
          machine.hasCriticalAlert
            ? 'border-red-200 dark:border-red-950 ring-1 ring-red-500/10'
            : 'border-slate-200 dark:border-slate-800'
        }`}
      >
        {/* Indikator Kritikalitas (Merah di sudut) */}
        {machine.hasCriticalAlert && (
          <div className="absolute top-0 right-0 flex h-6 items-center gap-1 rounded-bl-xl bg-red-500 px-2.5 text-[9px] font-bold text-white uppercase tracking-wider animate-pulse shadow-sm">
            <AlertTriangle size={10} />
            <span>Kritis</span>
          </div>
        )}

        {/* Kode & Status Mesin */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider">
            {machine.id}
          </span>
          {!machine.hasCriticalAlert && <StatusBadge status={machine.status} />}
        </div>

        {/* Nama Mesin */}
        <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {machine.name}
        </h3>

        {/* Deskripsi & Area */}
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin size={13} className="text-slate-400" />
          <span className="truncate">{machine.area || 'Tanpa Area'}</span>
        </div>

        {/* Ringkasan Suku Cadang Terhubung */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Zap size={14} className="text-amber-500 shrink-0" />
            <span>{machine.electricalCount} Elektrik</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wrench size={14} className="text-blue-500 shrink-0" />
            <span>{machine.mechanicalCount} Mekanik</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
export default MachineCard;

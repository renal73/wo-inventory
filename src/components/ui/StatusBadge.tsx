import React from 'react';

export type MachineStatus = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';

interface StatusBadgeProps {
  status: MachineStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  let bgClass = '';
  let textClass = '';
  let dotClass = '';
  let label = '';

  switch (status) {
    case 'ACTIVE':
      bgClass = 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800';
      textClass = 'text-emerald-700 dark:text-emerald-400';
      dotClass = 'bg-emerald-500';
      label = 'Aktif';
      break;
    case 'MAINTENANCE':
      bgClass = 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
      textClass = 'text-amber-700 dark:text-amber-400';
      dotClass = 'bg-amber-500 animate-pulse';
      label = 'Maintenance';
      break;
    case 'INACTIVE':
      bgClass = 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800';
      textClass = 'text-slate-500 dark:text-slate-400';
      dotClass = 'bg-slate-400';
      label = 'Tidak Aktif';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border transition-all duration-200 ${bgClass} ${textClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}

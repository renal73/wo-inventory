import React from 'react';

interface RoleBadgeProps {
  role: 'ADMIN' | 'USER' | 'WAREHOUSE' | 'TECHNICIAN' | 'OPERATOR' | 'QC_ANALYST';
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const getBadgeStyles = () => {
    switch (role) {
      case 'ADMIN': return 'bg-blue-600 text-white shadow-xs';
      case 'WAREHOUSE': return 'bg-purple-600 text-white shadow-xs';
      case 'TECHNICIAN': return 'bg-orange-500 text-white shadow-xs';
      case 'OPERATOR': return 'bg-emerald-600 text-white shadow-xs';
      case 'QC_ANALYST': return 'bg-pink-600 text-white shadow-xs';
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const getRoleName = () => {
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'WAREHOUSE': return 'Gudang';
      case 'TECHNICIAN': return 'Teknisi';
      case 'OPERATOR': return 'Operator';
      case 'QC_ANALYST': return 'QC Analyst';
      default: return 'User';
    }
  };
  
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide transition-colors duration-200 ${getBadgeStyles()}`}
    >
      {getRoleName()}
    </span>
  );
}

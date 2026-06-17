import React from 'react';

interface RoleBadgeProps {
  role: 'ADMIN' | 'USER';
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const isAdmin = role === 'ADMIN';
  
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide transition-colors duration-200 ${
        isAdmin
          ? 'bg-blue-600 text-white shadow-sm'
          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
      }`}
    >
      {isAdmin ? 'Admin' : 'User'}
    </span>
  );
}

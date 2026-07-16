"use client";

import { motion } from "framer-motion";
import { Search, Filter, Plus, LayoutGrid, List } from "lucide-react";

interface WorkOrderHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  onCreateNew?: () => void;
  canCreate?: boolean;
  totalCount: number;
}

export function WorkOrderHeader({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  viewMode,
  onViewModeChange,
  onCreateNew,
  canCreate,
  totalCount,
}: WorkOrderHeaderProps) {
  const statusOptions = [
    { value: "", label: "Semua Status" },
    { value: "OPEN", label: "Terbuka" },
    { value: "ASSIGNED", label: "Ditugaskan" },
    { value: "IN_PROGRESS", label: "Dikerjakan" },
    { value: "COMPLETED", label: "Selesai" },
  ];

  const priorityOptions = [
    { value: "", label: "Semua Prioritas" },
    { value: "LOW", label: "Proses sedang berjalan" },
    { value: "MEDIUM", label: "Proses berhenti" },
    { value: "HIGH", label: "Darurat" },
  ];

  return (
    <div className="space-y-6">
      {/* Title Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Work Orders
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {totalCount} tiket {statusFilter ? `(${statusOptions.find(s => s.value === statusFilter)?.label})` : ""}
          </p>
        </div>

        {canCreate && onCreateNew && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCreateNew}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/25 transition-colors"
          >
            <Plus size={18} />
            Buat Tiket Baru
          </motion.button>
        )}
      </motion.div>

      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col lg:flex-row gap-4"
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari work order..."
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="relative min-w-[180px]">
          <Filter
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-slate-400">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Priority Filter */}
        <div className="relative min-w-[180px]">
          <Filter
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
          >
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-slate-400">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onViewModeChange("grid")}
            className={`p-2.5 rounded-lg transition-all ${
              viewMode === "grid"
                ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <LayoutGrid size={18} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onViewModeChange("list")}
            className={`p-2.5 rounded-lg transition-all ${
              viewMode === "list"
                ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <List size={18} />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

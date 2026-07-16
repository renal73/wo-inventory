"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { useState } from "react";
import { Clock, User, Wrench, AlertTriangle, CheckCircle2, Package } from "lucide-react";

interface WorkOrderCardProps {
  wo: any;
  onClick: () => void;
  index: number;
}

export function WorkOrderCard({ wo, onClick, index }: WorkOrderCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  const statusConfig = {
    OPEN: { color: "blue", bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-400", label: "Terbuka", icon: AlertTriangle },
    ASSIGNED: { color: "purple", bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-700 dark:text-purple-400", label: "Ditugaskan", icon: User },
    IN_PROGRESS: { color: "amber", bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", label: "Dikerjakan", icon: Wrench },
    COMPLETED: { color: "emerald", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", label: "Selesai", icon: CheckCircle2 },
  };

  const status = statusConfig[wo.status as keyof typeof statusConfig] || statusConfig.OPEN;
  const StatusIcon = status.icon;
  
  const priorityColors = {
    LOW: "text-emerald-600 dark:text-emerald-400",
    MEDIUM: "text-orange-600 dark:text-orange-400",
    HIGH: "text-red-600 dark:text-red-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      style={{
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="group relative cursor-pointer"
    >
      {/* Glow effect on hover */}
      <motion.div
        className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `linear-gradient(135deg, ${status.color === "blue" ? "rgba(59, 130, 246, 0.3)" : status.color === "purple" ? "rgba(168, 85, 247, 0.3)" : status.color === "amber" ? "rgba(251, 146, 60, 0.3)" : "rgba(16, 185, 129, 0.3)"}, transparent)`,
          filter: "blur(10px)",
        }}
      />

      {/* Card */}
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 transition-all duration-300 group-hover:border-red-200 dark:group-hover:border-red-900 group-hover:shadow-lg group-hover:shadow-red-500/10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[11px] font-bold tracking-wide text-slate-900 dark:text-white uppercase">
                {wo.woNumber}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${status.bg} ${status.text}`}>
                {status.label}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-[14px] leading-tight mb-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors tracking-tight">
              {wo.title}
            </h3>
            {wo.description && (
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                {wo.description}
              </p>
            )}
          </div>
          
          <motion.div
            className={`ml-3 w-10 h-10 rounded-xl flex items-center justify-center ${status.bg} shrink-0`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <StatusIcon size={18} className={status.text} />
          </motion.div>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Package size={12} className="text-slate-400" />
            <span>{wo.Machine?.name || "N/A"}</span>
          </div>
          
          {wo.priority && (
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${priorityColors[wo.priority as keyof typeof priorityColors]}`} />
              <span className={priorityColors[wo.priority as keyof typeof priorityColors]}>
                {wo.priority}
              </span>
            </div>
          )}

          {wo.assignedNames && wo.assignedNames.length > 0 && (
            <div className="flex items-center gap-1.5">
              <User size={12} className="text-slate-400" />
              <span>{wo.assignedNames[0]}</span>
              {wo.assignedNames.length > 1 && (
                <span className="text-slate-400">+{wo.assignedNames.length - 1}</span>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5 ml-auto">
            <Clock size={12} className="text-slate-400" />
            <span>{new Date(wo.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}</span>
          </div>
        </div>

        {/* Hover indicator - Vodafone Red */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-400 rounded-b-2xl"
          initial={{ scaleX: 0 }}
          whileHover={{ scaleX: 1 }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  );
}

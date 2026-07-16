'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import {
  Plus, X, Search, RefreshCw, Clock, MapPin,
  User, AlertTriangle, CheckCircle2, Loader2,
  ChevronRight, Users, FileText, Zap, Wrench, 
  Package, Shield, Building2, Camera, Image as ImageIcon
} from 'lucide-react';
import imageCompression from 'browser-image-compression';

// ─── Types ───────────────────────────────────────────────────────────────────
type WoStatus = 'OPEN' | 'IN_REVIEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CLOSED';
type Priority = 'DARURAT' | 'PROSES_BERHENTI' | 'PROSES_BERJALAN';
type WoCategory = 'PERBAIKAN' | 'PEMBUATAN' | 'INSTALASI' | 'MODIFIKASI' | 'KESELAMATAN';
type JobCategory = 'MACHINERY' | 'UTILITY' | 'FACILITY_BUILDING';

interface WorkOrder {
  id: string;
  woNumber: string;
  title: string;
  description: string;
  location: string;
  category: WoCategory;
  classification?: string | null;
  jobCategory?: JobCategory | null;
  priority: Priority;
  status: WoStatus;
  requestedBy?: { id: string; name: string; role: string };
  assignedToIds: string[];
  assignedNames: string[];
  adminNotes?: string;
  techNotes?: string;
  slaBreached: boolean;
  slaPercent: number;
  createdAt: string;
  updatedAt: string;
  assignedAt?: string | null;
  dueDate?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  attachments?: string[];
  completionAttachments?: string[];
}

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getDurationText = (startedAt?: string | null, completedAt?: string | null) => {
  if (!startedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const diffMs = end - start;
  if (diffMs <= 0) return '0 detik';
  
  const totalSecs = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;
  
  const parts = [];
  if (hours > 0) parts.push(`${hours} jam`);
  if (minutes > 0) parts.push(`${minutes} menit`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} detik`);
  
  return parts.join(' ');
};

interface Technician {
  id: string;
  name: string;
  username: string;
  role: string;
}

// ─── Kanban Column Config ─────────────────────────────────────────────────────
const COLUMNS: { id: string; label: string; statuses: WoStatus[]; color: string; accent: string; textColor: string; borderColor: string }[] = [
  { id: 'LAPORAN_MASUK',   label: 'LAPORAN MASUK',    statuses: ['OPEN', 'IN_REVIEW'],  color: 'from-blue-50 to-blue-100/60',    accent: 'bg-blue-500',   textColor: 'text-blue-700',   borderColor: 'border-blue-300' },
  { id: 'DITUGASKAN',      label: 'DITUGASKAN',        statuses: ['ASSIGNED'],           color: 'from-purple-50 to-purple-100/60',accent: 'bg-purple-500', textColor: 'text-purple-700', borderColor: 'border-purple-300' },
  { id: 'DIKERJAKAN',      label: 'DIKERJAKAN',         statuses: ['IN_PROGRESS'],        color: 'from-amber-50 to-amber-100/60',  accent: 'bg-amber-500',  textColor: 'text-amber-700',  borderColor: 'border-amber-300' },
  { id: 'DITANGGUHKAN',   label: 'DITANGGUHKAN',       statuses: ['ON_HOLD'],            color: 'from-red-50 to-red-100/60',      accent: 'bg-red-500',    textColor: 'text-red-700',    borderColor: 'border-red-300' },
  { id: 'PERLU_VERIFIKASI',label: 'PERLU VERIFIKASI',  statuses: ['COMPLETED'],          color: 'from-emerald-50 to-emerald-100/60', accent: 'bg-emerald-500', textColor: 'text-emerald-700', borderColor: 'border-emerald-300' },
];

const PRIORITY_LABELS: Record<Priority, string> = {
  DARURAT: 'Darurat',
  PROSES_BERHENTI: 'Proses Berhenti',
  PROSES_BERJALAN: 'Proses masih dapat berjalan',
};

// ─── Priority Badge ───────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: Priority }) {
  const styles: Record<Priority, string> = {
    DARURAT: 'bg-red-500 text-white border border-red-600',
    PROSES_BERHENTI: 'bg-orange-500 text-white border border-orange-600',
    PROSES_BERJALAN: 'bg-emerald-500 text-white border border-emerald-600',
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider ${styles[priority]}`}>
      {PRIORITY_LABELS[priority] || priority}
    </span>
  );
}

// ─── Category Icon ────────────────────────────────────────────────────────────
function CategoryIcon({ category }: { category: WoCategory }) {
  const icons: Record<WoCategory, React.ReactNode> = {
    PERBAIKAN:   <Wrench  size={11} />,
    PEMBUATAN:   <Package size={11} />,
    INSTALASI:   <Building2 size={11} />,
    MODIFIKASI:  <Zap    size={11} />,
    KESELAMATAN: <Shield size={11} />,
  };
  return <span className="text-slate-400">{icons[category]}</span>;
}

// ─── SLA Bar ──────────────────────────────────────────────────────────────────
function SlaBar({ percent, breached }: { percent: number; breached: boolean }) {
  const color = breached ? 'bg-red-500' : percent > 75 ? 'bg-orange-400' : 'bg-emerald-400';
  return (
    <div className="w-full h-0.5 bg-slate-200 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

// ─── Work Order Card ──────────────────────────────────────────────────────────
function WoCard({ wo, onClick }: { wo: WorkOrder; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`group bg-white rounded-xl border p-3.5 cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${
        wo.slaBreached ? 'border-red-300 animate-pulse-border' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Header: WO Number + Priority */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <CategoryIcon category={wo.category} />
          <span className="font-mono text-[10px] font-semibold text-blue-600">{wo.woNumber}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {wo.slaBreached && <AlertTriangle size={11} className="text-red-500" />}
          <PriorityBadge priority={wo.priority} />
        </div>
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-slate-800 leading-tight mb-1.5 group-hover:text-blue-700 transition-colors line-clamp-2">
        {wo.title}
      </h4>

      {/* Location */}
      <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-2.5">
        <MapPin size={10} className="shrink-0" />
        <span className="truncate">{wo.location}</span>
      </div>

      {/* SLA Bar */}
      <SlaBar percent={wo.slaPercent} breached={wo.slaBreached} />

      {/* Job Category + Due Date row */}
      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
        {wo.jobCategory && (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase tracking-wide">
            {wo.jobCategory === 'MACHINERY' ? '⚙' : wo.jobCategory === 'UTILITY' ? '⚡' : '🏢'}
            {wo.jobCategory === 'FACILITY_BUILDING' ? 'Facility' : wo.jobCategory === 'MACHINERY' ? 'Machinery' : 'Utility'}
          </span>
        )}
        {wo.dueDate && (
          <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded border border-amber-200/50">
            <Clock size={10} className="shrink-0" />
            <span>Due: {formatDate(wo.dueDate)}</span>
          </div>
        )}
      </div>

      {/* Assignee */}
      <div className="mt-2.5 flex items-center gap-1.5">
        {wo.assignedNames.length > 0 ? (
          <>
            <div className="flex items-center justify-center w-5 h-5 bg-blue-100 rounded-full text-[9px] font-bold text-blue-600">
              T
            </div>
            <span className="text-[11px] text-slate-600 truncate">{wo.assignedNames.join(', ')}</span>
          </>
        ) : (
          <div className="flex items-center gap-1 text-[11px] font-medium text-red-500">
            <User size={10} />
            <span>BELUM DITUGASKAN</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WorkOrdersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Modal states
  const [createOpen, setCreateOpen] = useState(false);
  const [detailWo, setDetailWo] = useState<WorkOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Technicians for assign
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([]);

  // Create form
  const [formData, setFormData] = useState({
    title: '', description: '', location: '',
    category: 'PERBAIKAN' as WoCategory,
    jobCategory: 'MACHINERY' as JobCategory,
    priority: 'PROSES_BERJALAN' as Priority
  });
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  // Complete WO form (for Technicians)
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completionFiles, setCompletionFiles] = useState<File[]>([]);
  
  // Part Pickup State - SIMPLIFIED
  const [partsModalOpen, setPartsModalOpen] = useState(false);
  const [inventoryParts, setInventoryParts] = useState<any[]>([]);
  const [partsLoading, setPartsLoading] = useState(false);
  const [takenParts, setTakenParts] = useState<any[]>([]);
  const [partSearch, setPartSearch] = useState('');
  const [techNotes, setTechNotes] = useState('');
  const [takingPartId, setTakingPartId] = useState<string | null>(null);

  // Admin Review / Assign Inputs
  const [adminClassification, setAdminClassification] = useState<string>('ELECTRIC');
  const [adminJobCategory, setAdminJobCategory] = useState<string>('MACHINERY');
  const [adminPriority, setAdminPriority] = useState<Priority>('PROSES_BERJALAN');
  const [assignedAt, setAssignedAt] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');

  // Mobile responsive columns active tab
  const [activeTab, setActiveTab] = useState('LAPORAN_MASUK');

  // ─── SIMPLIFIED Part Pickup Handler ────────────────────────────────────────
  const handleTakePart = async (part: any, qty: number = 1) => {
    if (!detailWo) {
      alert('Work Order belum dipilih');
      return;
    }
    if (part.stock < qty) {
      alert('Stok tidak mencukupi');
      return;
    }
    setTakingPartId(part.id);
    try {
      // Auto-generate notes from WO info - API expects locationNotes
      const locationNotes = `WO ${detailWo.woNumber} - ${detailWo.title}${detailWo.location ? ' @ ' + detailWo.location : ''}`;
      console.log('Taking part:', { partId: part.id, qtyTaken: qty, locationNotes });
      
      const res = await fetch(`/api/work-orders/${detailWo.id}/parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partId: part.id,
          qtyTaken: qty,
          locationNotes: locationNotes
        })
      });
      
      console.log('Response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('Success response:', data);
        
        // Add to taken parts list - use response data if available
        const newPart = {
          id: Date.now().toString(),
          partId: part.id,
          partName: data.data?.part?.name || part.name,
          qtyTaken: qty,
          notes: locationNotes,
          takenAt: new Date().toISOString()
        };
        setTakenParts(prev => [...prev, newPart]);
        
        // Refresh inventory to show updated stock
        const partsRes = await fetch('/api/inventory/parts');
        if (partsRes.ok) {
          const partsData = await partsRes.json();
          setInventoryParts(Array.isArray(partsData) ? partsData : (partsData.parts || []));
        }
        
        alert('Part berhasil diambil!');
      } else {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error response:', err);
        alert('Gagal mengambil part: ' + (err.error || 'Unknown error'));
      }
    } catch (e: any) {
      console.error('Error taking part:', e);
      alert('Terjadi kesalahan saat mengambil part: ' + e.message);
    } finally {
      setTakingPartId(null);
    }
  };

  const openPartsModal = async () => {
    if (!detailWo) return;
    setPartsLoading(true);
    setPartsModalOpen(true);
    setTakenParts([]);
    try {
      const [partsRes, woPartsRes] = await Promise.all([
        fetch('/api/inventory/parts'),
        fetch(`/api/work-orders/${detailWo.id}/parts`)
      ]);
      if (partsRes.ok) {
        const partsData = await partsRes.json();
        setInventoryParts(Array.isArray(partsData) ? partsData : (partsData.parts || []));
      }
      if (woPartsRes.ok) {
        const woPartsData = await woPartsRes.json();
        setTakenParts(Array.isArray(woPartsData) ? woPartsData : (woPartsData.data || []));
      }
    } catch (e) {
      console.error('Error fetching parts:', e);
    } finally {
      setPartsLoading(false);
    }
  };

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  const fetchWorkOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch('/api/work-orders');
      if (res.ok) setWorkOrders(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchTechnicians = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch('/api/technicians');
      if (res.ok) setTechnicians(await res.json());
    } catch (e) { console.error(e); }
  }, [isAdmin]);

  useEffect(() => {
    fetchWorkOrders();
    fetchTechnicians();
    pollingRef.current = setInterval(() => fetchWorkOrders(true), 10000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [fetchWorkOrders, fetchTechnicians]);

  // ─── Helper: File Upload ────────────────────────────────────────────────────
  const uploadFiles = async (fileList: File[]) => {
    if (fileList.length === 0) return [];
    const uploadFormData = new FormData();
    for (const file of fileList) {
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
      try {
        const compressedFile = await imageCompression(file, options);
        uploadFormData.append('files', compressedFile);
      } catch (error) {
        console.error('Compression error', error);
        uploadFormData.append('files', file); // fallback
      }
    }
    const res = await fetch('/api/upload', { method: 'POST', body: uploadFormData });
    if (res.ok) {
      const data = await res.json();
      return data.paths || [];
    }
    return [];
  };

  // ─── Create WO ──────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const uploadedPaths = await uploadFiles(files);
      const res = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, attachments: uploadedPaths })
      });
      if (res.ok) {
        setCreateOpen(false);
        setFormData({ title: '', description: '', location: '', category: 'PERBAIKAN', jobCategory: 'MACHINERY', priority: 'PROSES_BERJALAN' });
        setFiles([]);
        await fetchWorkOrders(true);
      } else {
        const err = await res.json();
        if (res.status === 401 && err.error?.includes('Sesi tidak valid')) {
          setFormError('Sesi Anda kedaluwarsa setelah perubahan sistem. Silakan logout dan login kembali.');
        } else {
          setFormError(err.error || 'Gagal membuat Work Order');
        }
      }
    } catch { setFormError('Terjadi kesalahan jaringan'); }
    finally { setSubmitting(false); }
  };

  const openDetail = async (wo: WorkOrder) => {
    setDetailWo(wo);
    setSelectedTechIds(wo.assignedToIds || []);
    setAdminClassification(wo.classification || 'ELECTRIC');
    setAdminJobCategory(wo.jobCategory || 'MACHINERY');
    setAdminPriority(wo.priority || 'PROSES_BERJALAN');
    setAssignedAt(wo.assignedAt ? new Date(wo.assignedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setDueDate(wo.dueDate ? new Date(wo.dueDate).toISOString().split('T')[0] : '');
  };

  // ─── Assign + Change Status ──────────────────────────────────────────────────
  const handleAssign = async () => {
    if (!detailWo) return;
    setActionLoading(true);
    try {
      const names = selectedTechIds
        .map(id => technicians.find(t => t.id === id)?.name)
        .filter(Boolean) as string[];

      const payload: any = {
        assignedToIds: selectedTechIds,
        assignedNames: names,
        classification: adminClassification,
        jobCategory: adminJobCategory,
        priority: adminPriority,
        assignedAt: assignedAt ? new Date(assignedAt).toISOString() : null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      };
      if (selectedTechIds.length > 0 && detailWo.status === 'OPEN') {
        payload.status = 'ASSIGNED';
      }

      const res = await fetch(`/api/work-orders/${detailWo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updated = await res.json();
        setDetailWo({ ...updated, slaBreached: detailWo.slaBreached, slaPercent: detailWo.slaPercent });
        await fetchWorkOrders(true);
      }
    } finally { setActionLoading(false); }
  };

  const handleStatusChange = async (newStatus: string, note?: string) => {
    if (!detailWo) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/work-orders/${detailWo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note })
      });
      if (res.ok) {
        const updated = await res.json();
        setDetailWo({ ...updated, slaBreached: detailWo.slaBreached, slaPercent: detailWo.slaPercent });
        await fetchWorkOrders(true);
      }
    } finally { setActionLoading(false); }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailWo) return;
    setActionLoading(true);
    try {
      const uploadedPaths = await uploadFiles(completionFiles);
      const res = await fetch(`/api/work-orders/${detailWo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'COMPLETED', 
          techNotes: techNotes,
          completionAttachments: uploadedPaths
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setDetailWo({ ...updated, slaBreached: detailWo.slaBreached, slaPercent: detailWo.slaPercent });
        setCompleteModalOpen(false);
        setCompletionFiles([]);
        setTechNotes('');
        await fetchWorkOrders(true);
      }
    } finally { setActionLoading(false); }
  };

  // ─── Filter & Column Data ────────────────────────────────────────────────────
  const filtered = workOrders.filter(wo =>
    wo.title.toLowerCase().includes(search.toLowerCase()) ||
    wo.woNumber.toLowerCase().includes(search.toLowerCase()) ||
    wo.location.toLowerCase().includes(search.toLowerCase())
  );

  const getColumnWos = (col: typeof COLUMNS[0]) =>
    filtered.filter(wo => col.statuses.includes(wo.status));

  const toggleTech = (id: string) => {
    setSelectedTechIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // ─── Status action buttons ───────────────────────────────────────────────────
  const statusActions: Record<WoStatus, { label: string; next: string; color: string }[]> = {
    OPEN:        [{ label: 'Review', next: 'IN_REVIEW', color: 'bg-blue-600' }],
    IN_REVIEW:   [{ label: 'Tutup', next: 'CLOSED', color: 'bg-slate-600' }],
    ASSIGNED:    [{ label: 'Mulai Dikerjakan', next: 'IN_PROGRESS', color: 'bg-amber-500' }],
    IN_PROGRESS: [
      { label: 'Tunda', next: 'ON_HOLD', color: 'bg-red-500' },
      { label: 'Selesai', next: 'COMPLETED', color: 'bg-emerald-600' }
    ],
    ON_HOLD:     [{ label: 'Lanjutkan', next: 'IN_PROGRESS', color: 'bg-amber-500' }],
    COMPLETED:   [{ label: 'Tutup (Verifikasi OK)', next: 'CLOSED', color: 'bg-slate-700' }],
    CLOSED:      [],
  };

  // ─── Category config ─────────────────────────────────────────────────────────
  const CATEGORIES: { value: WoCategory; label: string; code: string }[] = [
    { value: 'PERBAIKAN',   label: 'Perbaikan',   code: 'A' },
    { value: 'PEMBUATAN',   label: 'Pembuatan',   code: 'B' },
    { value: 'INSTALASI',   label: 'Instalasi',   code: 'C' },
    { value: 'MODIFIKASI',  label: 'Modifikasi',  code: 'D' },
    { value: 'KESELAMATAN', label: 'Keselamatan', code: 'E' },
  ];

  const previewWoNumber = () => {
    const cat = CATEGORIES.find(c => c.value === formData.category);
    const yr = String(new Date().getFullYear()).slice(-2);
    return `WO-${cat?.code ?? 'A'}${yr}/xxxx`;
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* ── Header Bar ── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 flex-shrink-0">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 max-w-[1600px] mx-auto">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="text-blue-500 shrink-0" size={22} />
              Work Orders — Kanban Board
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              {workOrders.length} tiket aktif · Refresh otomatis setiap 10 detik
              {refreshing && <Loader2 size={10} className="inline ml-1.5 animate-spin" />}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari no WO, judul, lokasi..."
                className="pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => fetchWorkOrders(true)}
                className="flex-1 sm:flex-initial p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex justify-center items-center"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => setCreateOpen(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
              >
                <Plus size={16} />
                Buat Tiket
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Columns Tab Bar ── */}
      <div className="lg:hidden flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 space-x-2 overflow-x-auto shrink-0 scrollbar-none">
        {COLUMNS.map(col => {
          const count = getColumnWos(col).length;
          const isActive = activeTab === col.id;
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => setActiveTab(col.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all border ${
                isActive
                  ? `${col.textColor} ${col.color} ${col.borderColor} shadow-sm`
                  : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${col.accent}`} />
              <span>{col.label}</span>
              <span className="bg-slate-200/60 dark:bg-slate-800 text-[10px] px-1.5 py-0.5 rounded-full">{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Kanban Board ── */}
      <div className="flex-1 overflow-y-auto lg:overflow-x-auto px-4 pb-8 pt-5">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 size={32} className="animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            {/* Desktop Board Layout (visible on lg and up) */}
            <div className="hidden lg:flex gap-4 min-w-max max-w-[1600px] mx-auto">
              {COLUMNS.map(col => {
                const colWos = getColumnWos(col);
                return (
                  <div key={col.id} className="w-72 flex-shrink-0 flex flex-col">
                    {/* Column Header */}
                    <div className={`bg-gradient-to-b ${col.color} rounded-t-2xl border border-b-0 ${col.borderColor} px-4 py-3 flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${col.accent}`} />
                        <span className={`text-xs font-bold tracking-wider ${col.textColor}`}>{col.label}</span>
                      </div>
                      <span className={`text-xs font-bold ${col.textColor} bg-white/60 rounded-full px-2 py-0.5`}>
                        {colWos.length}
                      </span>
                    </div>

                    {/* Column Cards */}
                    <div className={`flex-1 bg-gradient-to-b ${col.color} rounded-b-2xl border ${col.borderColor} p-3 space-y-3 min-h-[500px]`}>
                      {colWos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-xs text-center gap-1">
                          <CheckCircle2 size={20} className="opacity-30" />
                          <span>Tidak ada tiket</span>
                        </div>
                      ) : (
                        colWos.map(wo => (
                          <WoCard key={wo.id} wo={wo} onClick={() => openDetail(wo)} />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Board Layout (visible below lg) */}
            <div className="flex lg:hidden flex-col w-full max-w-md mx-auto">
              {COLUMNS.filter(col => col.id === activeTab).map(col => {
                const colWos = getColumnWos(col);
                return (
                  <div key={col.id} className="flex flex-col w-full">
                    {/* Column Cards */}
                    <div className={`bg-gradient-to-b ${col.color} rounded-2xl border ${col.borderColor} p-3.5 space-y-3 min-h-[450px]`}>
                      {colWos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs text-center gap-1.5 bg-white/40 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-4">
                          <CheckCircle2 size={24} className="text-slate-300 dark:text-slate-700" />
                          <span>Tidak ada tiket di kategori ini</span>
                        </div>
                      ) : (
                        colWos.map(wo => (
                          <WoCard key={wo.id} wo={wo} onClick={() => openDetail(wo)} />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ════════════════ MODAL CREATE ════════════════ */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-900 shrink-0">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus size={18} className="text-blue-500" />
                Buat Permintaan Perbaikan
              </h3>
              <button onClick={() => setCreateOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white/50">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                  <AlertTriangle size={14} />
                  {formError}
                </div>
              )}

              {/* Kategori */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Kategori WO</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat.value })}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        formData.category === cat.value
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-mono font-bold">{cat.code}26</div>
                      <div className="text-[9px] opacity-80 mt-0.5">{cat.label}</div>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  ID Tiket: <span className="font-mono font-semibold text-blue-500">{previewWoNumber()}</span>
                </p>
              </div>

              {/* Judul */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Judul Masalah <span className="text-red-400">*</span></label>
                <input
                  required value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  placeholder="Contoh: Mesin CNC A mati mendadak"
                />
              </div>

              {/* Lokasi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Lokasi / Area <span className="text-red-400">*</span></label>
                <input
                  required value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  placeholder="Contoh: Gedung A – Line Produksi 1"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Deskripsi Detail <span className="text-red-400">*</span></label>
                <textarea
                  required value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                  placeholder="Jelaskan kondisi kerusakan secara detail..."
                />
              </div>
              {/* Kategori Pengerjaan (Job Category) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Kategori Pekerjaan <span className="text-red-400">*</span></label>
                <select
                  value={formData.jobCategory}
                  onChange={e => setFormData({ ...formData, jobCategory: e.target.value as JobCategory })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none"
                >
                  <option value="MACHINERY">Machinery</option>
                  <option value="UTILITY">Utility</option>
                  <option value="FACILITY_BUILDING">Facility/Building</option>
                </select>
              </div>

              {/* Prioritas (Klasifikasi & tanggal penugasan dipilih oleh Admin setelah review) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Prioritas</label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value as Priority })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none"
                >
                  <option value="PROSES_BERJALAN">Proses masih dapat berjalan</option>
                  <option value="PROSES_BERHENTI">Proses Berhenti</option>
                  <option value="DARURAT">Darurat</option>
                </select>
              </div>

              {/* Lampiran Foto (Opsional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Lampiran Foto (Opsional)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      setFiles(Array.from(e.target.files));
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {files.length > 0 && (
                  <p className="text-[10px] text-slate-400 mt-1">{files.length} file dipilih</p>
                )}
              </div>
            </form>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-955 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const submitBtn = document.querySelector('form button[type="submit"]');
                  if (submitBtn) {
                    (submitBtn as HTMLButtonElement).click();
                  } else {
                    const formEl = document.querySelector('form');
                    if (formEl) formEl.requestSubmit();
                  }
                }}
                disabled={submitting}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                {submitting ? 'Menyimpan...' : 'Kirim Permintaan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ MODAL DETAIL ════════════════ */}
      {detailWo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start shrink-0 bg-gradient-to-r from-slate-50 to-blue-50/50 dark:from-slate-900">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-blue-600">{detailWo.woNumber}</span>
                  <PriorityBadge priority={detailWo.priority} />
                  {detailWo.slaBreached && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                      <AlertTriangle size={9} /> SLA BREACH
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">{detailWo.title}</h3>
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                  <MapPin size={11} />{detailWo.location}
                </div>
              </div>
              <button onClick={() => setDetailWo(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white/50">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Description */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Deskripsi</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{detailWo.description}</p>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-slate-400 mb-0.5">Kategori</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">{detailWo.category}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-slate-400 mb-0.5">Klasifikasi</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">{detailWo.classification}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-slate-400 mb-0.5">Pemohon</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">{detailWo.requestedBy?.name || '-'}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-slate-400 mb-0.5">SLA Progress</p>
                  <p className={`font-semibold ${detailWo.slaBreached ? 'text-red-500' : 'text-emerald-600'}`}>
                    {detailWo.slaPercent}% {detailWo.slaBreached ? '⚠ Melewati' : '✓ Aman'}
                  </p>
                </div>
              </div>

              {/* Admin Review Form */}
              {isAdmin && detailWo.status !== 'CLOSED' && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/10 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    Tinjauan Admin
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Klasifikasi Masalah</label>
                      <select
                        value={adminClassification}
                        onChange={e => setAdminClassification(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      >
                        <option value="ELECTRIC">Electric</option>
                        <option value="MECHANIC">Mechanic</option>
                        <option value="SIPIL">Sipil</option>
                        <option value="OTHER">Lain-lain</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Kategori Pengerjaan</label>
                      <select
                        value={adminJobCategory}
                        onChange={e => setAdminJobCategory(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      >
                        <option value="MACHINERY">Machinery</option>
                        <option value="UTILITY">Utility</option>
                        <option value="FACILITY_BUILDING">Facility/Building</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Prioritas</label>
                      <select
                        value={adminPriority}
                        onChange={e => setAdminPriority(e.target.value as Priority)}
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      >
                        <option value="PROSES_BERJALAN">Proses Berjalan</option>
                        <option value="PROSES_BERHENTI">Proses Berhenti</option>
                        <option value="DARURAT">Darurat</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Tanggal Mulai</label>
                      <input
                        type="date"
                        value={assignedAt}
                        onChange={e => setAssignedAt(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Assign Teknisi (Admin only) */}
              {isAdmin && detailWo.status !== 'CLOSED' && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-purple-50/50 dark:bg-purple-900/10">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <Users size={13} className="text-purple-500" /> Tugaskan Teknisi
                  </h4>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto mb-3">
                    {technicians.length === 0 ? (
                      <p className="text-xs text-slate-400">Tidak ada teknisi tersedia</p>
                    ) : technicians.map(tech => (
                      <label key={tech.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedTechIds.includes(tech.id)}
                          onChange={() => toggleTech(tech.id)}
                          className="rounded text-purple-500 focus:ring-purple-500"
                        />
                        <div className="flex items-center justify-center w-6 h-6 bg-purple-100 rounded-full text-[10px] font-bold text-purple-600">
                          {tech.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{tech.name}</p>
                          <p className="text-[10px] text-slate-400">{tech.role}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={handleAssign}
                    disabled={actionLoading}
                    className="w-full py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                    Simpan Penugasan
                  </button>
                </div>
              )}

              {/* Current Assignees */}
              {detailWo.assignedNames.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Teknisi Bertugas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detailWo.assignedNames.map((name, i) => (
                      <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        <User size={10} />{name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Time Tracking */}
              {detailWo.startedAt && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <Clock size={12} /> Waktu Pengerjaan
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Mulai: </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {new Date(detailWo.startedAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Durasi: </span>
                      <span className="font-bold text-amber-700 dark:text-amber-400">
                        {getDurationText(detailWo.startedAt, detailWo.completedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Request Attachments */}
              {detailWo.attachments && detailWo.attachments.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <ImageIcon size={12} /> Lampiran Foto Request ({detailWo.attachments.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {detailWo.attachments.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-colors aspect-square">
                        <img src={url} alt={`Lampiran ${i+1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Completion Attachments */}
              {detailWo.completionAttachments && detailWo.completionAttachments.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Camera size={12} /> Foto Penyelesaian ({detailWo.completionAttachments.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {detailWo.completionAttachments.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 transition-colors aspect-square">
                        <img src={url} alt={`Hasil ${i+1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Tech Notes */}
              {detailWo.techNotes && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-1">Catatan Teknisi</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{detailWo.techNotes}</p>
                </div>
              )}

              {/* Status Actions */}
              {(statusActions[detailWo.status] || []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Ubah Status</p>
                  <div className="flex flex-wrap gap-2">
                    {(statusActions[detailWo.status] || []).map(action => (
                      <button
                        key={action.next}
                        onClick={() => {
                          if (action.next === 'COMPLETED') {
                            setCompleteModalOpen(true);
                          } else {
                            handleStatusChange(action.next);
                          }
                        }}
                        disabled={actionLoading}
                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-50 ${action.color}`}
                      >
                        {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <ChevronRight size={12} />}
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Part Pickup Section - SIMPLIFIED */}
              {['ASSIGNED', 'IN_PROGRESS', 'ON_HOLD'].includes(detailWo.status) && (
                <div className="border border-orange-200 dark:border-orange-800 rounded-xl p-4 bg-orange-50/50 dark:bg-orange-900/10">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Package size={13} className="text-orange-500" /> Part yang Digunakan
                    </h4>
                    <button
                      onClick={openPartsModal}
                      disabled={partsLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {partsLoading ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                      Ambil Part
                    </button>
                  </div>
                  {takenParts.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {takenParts.map((tp: any, idx: number) => (
                        <div key={tp.id || idx} className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-lg border border-orange-100 dark:border-orange-900">
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Package size={14} className="text-orange-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{tp.partName || tp.Part?.name || tp.part?.name || 'Part'}</p>
                            <p className="text-[10px] text-slate-500">{tp.qtyTaken} pcs · {tp.notes || tp.locationNotes || 'Tanpa catatan'}</p>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {tp.takenAt ? new Date(tp.takenAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-2">Belum ada part yang diambil untuk WO ini</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ MODAL COMPLETION (Technician) ════════════════ */}
      {completeModalOpen && detailWo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-green-50 dark:from-slate-900 dark:to-slate-900 shrink-0">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <CheckCircle2 size={18} className="text-emerald-500" />
                Selesaikan Work Order
              </h3>
              <button onClick={() => { setCompleteModalOpen(false); setCompletionFiles([]); setTechNotes(''); }} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white/50">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleComplete} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-xs">
                <span className="text-slate-500">Tiket: </span>
                <span className="font-mono font-bold text-blue-600">{detailWo.woNumber}</span>
                <span className="text-slate-400 mx-1.5">·</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{detailWo.title}</span>
              </div>

              {/* Tech Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Catatan Perbaikan
                </label>
                <textarea
                  value={techNotes}
                  onChange={e => setTechNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"
                  placeholder="Jelaskan perbaikan yang telah dilakukan..."
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Camera size={13} className="text-emerald-500" />
                  Lampiran Foto Hasil (Opsional)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      setCompletionFiles(Array.from(e.target.files));
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {completionFiles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] text-slate-400 mb-1.5">{completionFiles.length} file dipilih</p>
                    <div className="flex gap-2 flex-wrap">
                      {completionFiles.map((file, i) => (
                        <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-emerald-200 dark:border-emerald-800 relative group">
                          <img src={URL.createObjectURL(file)} alt={`Preview ${i+1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setCompletionFiles(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <X size={14} className="text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </form>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-955 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => { setCompleteModalOpen(false); setCompletionFiles([]); setTechNotes(''); }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={(e) => handleComplete(e as any)}
                disabled={actionLoading}
                className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading && <Loader2 size={14} className="animate-spin" />}
                {actionLoading ? 'Mengirim...' : 'Tandai Selesai'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ MODAL PART PICKUP - SIMPLIFIED ════════════════ */}
      {partsModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-orange-200 dark:border-orange-800 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-orange-100 dark:border-orange-900 flex justify-between items-center bg-gradient-to-r from-orange-50 to-amber-50 dark:from-slate-900 shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                  <Package size={18} className="text-orange-500" />
                  Ambil Part
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">WO: {detailWo?.woNumber} — Auto-fill notes</p>
              </div>
              <button onClick={() => setPartsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 pt-4 pb-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={partSearch}
                  onChange={(e) => setPartSearch(e.target.value)}
                  placeholder="Cari nama part..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                />
              </div>
            </div>

            {/* Parts List with Quick Take */}
            <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-2">
              {partsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-orange-500" />
                </div>
              ) : inventoryParts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Part tidak ditemukan</p>
              ) : (
                inventoryParts
                  .filter((p: any) => !partSearch || (p.name || '').toLowerCase().includes(partSearch.toLowerCase()))
                  .map((part: any) => (
                    <div key={part.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{part.name}</p>
                        <p className={`text-xs font-bold ${(part.stock || 0) < 3 ? 'text-red-500' : 'text-emerald-600'}`}>
                          Stok: {part.stock || 0} pcs
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTakePart(part, 1)}
                        disabled={takingPartId === part.id || (part.stock || 0) < 1}
                        className="ml-3 px-4 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shrink-0"
                      >
                        {takingPartId === part.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Plus size={12} />
                        )}
                        Ambil 1
                      </button>
                    </div>
                  ))
              )}
            </div>

            {/* Taken Parts Summary */}
            {takenParts.length > 0 && (
              <div className="px-5 py-3 border-t border-orange-100 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-900/20">
                <p className="text-xs font-bold text-orange-700 dark:text-orange-400 mb-2">
                  {takenParts.length} part sudah diambil untuk WO ini
                </p>
                <div className="flex flex-wrap gap-1">
                  {takenParts.map((tp: any, idx: number) => (
                    <span key={tp.id || idx} className="text-[10px] px-2 py-1 bg-white dark:bg-slate-800 rounded-lg border border-orange-200 dark:border-orange-800">
                      {tp.partName || tp.part?.name || 'Part'} ×{tp.qtyTaken}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-5 py-4 border-t border-orange-100 dark:border-orange-900 flex justify-end shrink-0">
              <button
                onClick={() => setPartsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SLA pulse animation */}
      <style jsx global>{`
        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 0 4px rgba(239,68,68,0.1); }
        }
        .animate-pulse-border { animation: pulse-border 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

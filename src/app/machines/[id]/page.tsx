'use client';

import React, { useEffect, useState, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MachinePartTable, AssignedPart } from '@/components/machines/MachinePartTable';
import { AssignPartModal } from '@/components/machines/AssignPartModal';
import { 
  ArrowLeft, 
  Zap, 
  Wrench, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  AlertTriangle,
  FileText,
  MapPin
} from 'lucide-react';

export default function MachineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const machineId = params.id as string;

  // State data mesin
  const [machine, setMachine] = useState<any>(null);
  const [parts, setParts] = useState<AssignedPart[]>([]);
  const [loading, setLoading] = useState(true);

  // State Tab: ELECTRICAL (Elektrik) atau MECHANICAL (Mekanik)
  const [activeTab, setActiveTab] = useState<'ELECTRICAL' | 'MECHANICAL'>('ELECTRICAL');

  // State Modal Assign Part
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  // State Modal Edit Assignment
  const [editAssignOpen, setEditAssignOpen] = useState(false);
  const [selectedAssignPart, setSelectedAssignPart] = useState<AssignedPart | null>(null);
  const [editRecQty, setEditRecQty] = useState(1);
  const [editNotes, setEditNotes] = useState('');
  const [editAssignLoading, setEditAssignLoading] = useState(false);
  const [editAssignError, setEditAssignError] = useState('');

  // State Modal Edit Mesin
  const [editMachineOpen, setEditMachineOpen] = useState(false);
  const [editMachineData, setEditMachineData] = useState({
    name: '',
    description: '',
    area: '',
    status: 'ACTIVE'
  });
  const [editMachineError, setEditMachineError] = useState('');
  const [editMachineLoading, setEditMachineLoading] = useState(false);

  // State Modal Konfirmasi Hapus Mesin
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // State Modal Impor Excel Pemetaan Part
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');

  useEffect(() => {
    if (machineId) {
      loadMachineData();
      loadMachineParts();
    }
  }, [machineId]);

  const loadMachineData = async () => {
    try {
      const data = await api.machines.getById(machineId);
      setMachine(data);
      setEditMachineData({
        name: data.name,
        description: data.description || '',
        area: data.area || '',
        status: data.status
      });
    } catch (err) {
      console.error('Gagal memuat detail mesin:', err);
    }
  };

  const loadMachineParts = async () => {
    try {
      setLoading(true);
      const data = await api.machines.getParts(machineId);
      setParts(data);
    } catch (err) {
      console.error('Gagal memuat part mesin:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handler melepaskan part dari mesin (Unassign)
  const handleUnassignPart = async (partId: string) => {
    if (!confirm('Apakah Anda yakin ingin melepas suku cadang ini dari mesin?')) return;
    try {
      await api.machines.unassignPart(machineId, partId);
      loadMachineParts();
    } catch (err: any) {
      alert(err.message || 'Gagal melepas suku cadang');
    }
  };

  // Handler membuka modal edit pemetaan
  const openEditAssignModal = (part: AssignedPart) => {
    setSelectedAssignPart(part);
    setEditRecQty(part.recommendedMinQty);
    setEditNotes(part.notes || '');
    setEditAssignError('');
    setEditAssignOpen(true);
  };

  // Submit edit pemetaan
  const handleEditAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignPart) return;

    try {
      setEditAssignLoading(true);
      setEditAssignError('');
      await api.machines.updatePart(machineId, selectedAssignPart.partId, {
        recommendedMinQty: editRecQty,
        notes: editNotes
      });
      loadMachineParts();
      setEditAssignOpen(false);
    } catch (err: any) {
      setEditAssignError(err.message || 'Gagal memperbarui pemetaan');
    } finally {
      setEditAssignLoading(false);
    }
  };

  // Submit edit mesin
  const handleEditMachineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMachineData.name) {
      setEditMachineError('Nama mesin wajib diisi');
      return;
    }

    try {
      setEditMachineLoading(true);
      setEditMachineError('');
      await api.machines.update(machineId, editMachineData);
      loadMachineData();
      setEditMachineOpen(false);
    } catch (err: any) {
      setEditMachineError(err.message || 'Gagal memperbarui data mesin');
    } finally {
      setEditMachineLoading(false);
    }
  };

  // Eksekusi hapus mesin
  const handleDeleteMachine = async () => {
    try {
      setDeleteLoading(true);
      setDeleteError('');
      await api.machines.delete(machineId);
      router.push('/machines');
    } catch (err: any) {
      setDeleteError(err.message || 'Gagal menghapus mesin');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleImportExcelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;

    const fileExt = importFile.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'xlsx' && fileExt !== 'xls') {
      setImportError('Format berkas tidak didukung. Harap pilih berkas .xlsx atau .xls');
      return;
    }

    try {
      setImportLoading(true);
      setImportError('');
      
      const fd = new FormData();
      fd.append('file', importFile);
      
      const res = await api.machines.importPartsExcel(machineId, fd);
      
      if (res.success) {
        setImportFile(null);
        setImportModalOpen(false);
        loadMachineParts();
      }
    } catch (err: any) {
      setImportError(err.message || 'Gagal mengimpor pemetaan suku cadang');
    } finally {
      setImportLoading(false);
    }
  };

  if (!machine) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
        <p className="text-xs font-semibold text-slate-500 animate-pulse">Memuat data mesin...</p>
      </div>
    );
  }

  // Filter part berdasarkan tab aktif
  const filteredParts = parts.filter(p => p.partType === activeTab);

  return (
    <div className="space-y-6">
        
        {/* Tombol Kembali */}
        <button
          onClick={() => router.push('/machines')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Daftar Mesin</span>
        </button>

        {/* Header Metadata Mesin */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-3 relative z-10 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-sm font-black text-slate-400 dark:text-slate-500 tracking-wider">
                {machine.id}
              </span>
              <StatusBadge status={machine.status} />
            </div>

            <h1 className="text-xl font-extrabold text-slate-950 dark:text-slate-100 tracking-tight leading-none">
              {machine.name}
            </h1>
            
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
              <MapPin size={13} className="text-slate-400 shrink-0" />
              <span>Lokasi Area: {machine.area || 'Tidak Ada Area'}</span>
            </div>

            {machine.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                {machine.description}
              </p>
            )}
          </div>

          {/* Action Edit / Delete Mesin (Admin) */}
          {isAdmin && (
            <div className="flex items-center gap-2 shrink-0 z-10">
              <button
                onClick={() => setEditMachineOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 h-8 text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <Edit2 size={12} />
                <span>Ubah Mesin</span>
              </button>
              
              <button
                onClick={() => setDeleteConfirmOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 h-8 text-[11px] font-bold bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-100/30 transition-colors cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Hapus Mesin</span>
              </button>
            </div>
          )}
        </div>

        {/* Dual Tab Suku Cadang (Elektrik / Mekanik) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            {/* Pemilihan Tab */}
            <div className="flex border border-slate-200 dark:border-slate-800 text-xs font-bold p-1 rounded-xl gap-2 w-fit bg-slate-50 dark:bg-slate-950">
              <button
                onClick={() => setActiveTab('ELECTRICAL')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'ELECTRICAL'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Zap size={13} className="text-amber-500 shrink-0" />
                <span>Electrical Parts ({parts.filter(p => p.partType === 'ELECTRICAL').length})</span>
              </button>

              <button
                onClick={() => setActiveTab('MECHANICAL')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'MECHANICAL'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Wrench size={13} className="text-blue-500 shrink-0" />
                <span>Mechanical Parts ({parts.filter(p => p.partType === 'MECHANICAL').length})</span>
              </button>
            </div>

            {/* Tombol Map Part Baru (Admin) */}
            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setImportFile(null);
                    setImportError('');
                    setImportModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 h-8 text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 rounded-lg transition-all shadow-xs cursor-pointer w-fit"
                >
                  📥 <span>Impor Excel Pemetaan</span>
                </button>
                <button
                  onClick={() => setAssignModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 h-8 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-md shadow-blue-600/10 cursor-pointer w-fit"
                >
                  <Plus size={14} />
                  <span>Hubungkan Suku Cadang</span>
                </button>
              </div>
            )}
          </div>

          {/* Tabel Render */}
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            </div>
          ) : (
            <MachinePartTable
              parts={filteredParts}
              onEdit={openEditAssignModal}
              onUnassign={handleUnassignPart}
            />
          )}
        </div>

        {/* MODAL 1: Hubungkan Part Baru (AssignPartModal) */}
        <AssignPartModal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          machineId={machineId}
          partType={activeTab}
          onSuccess={loadMachineParts}
        />

        {/* MODAL 2: Edit Kuantitas Rekomendasi / Notes */}
        {editAssignOpen && selectedAssignPart && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Ubah Rekomendasi Suku Cadang
                </h3>
                <button onClick={() => setEditAssignOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleEditAssignSubmit} className="p-5 space-y-4">
                {editAssignError && (
                  <div className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-900/50">
                    {editAssignError}
                  </div>
                )}

                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Suku Cadang</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    [{selectedAssignPart.partId}] {selectedAssignPart.name}
                  </p>
                </div>

                {/* Input recommendedMinQty */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Kuantitas Rekomendasi Minimum
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editRecQty}
                    onChange={(e) => setEditRecQty(Number(e.target.value))}
                    className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
                    required
                  />
                </div>

                {/* Input Notes */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Catatan Pemasangan
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Masukkan catatan baru..."
                    className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500 h-20 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setEditAssignOpen(false)}
                    className="px-4 h-9 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={editAssignLoading}
                    className="px-4 h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-all shadow-md shadow-blue-600/10 shrink-0 cursor-pointer"
                  >
                    {editAssignLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: Edit Data Mesin */}
        {editMachineOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Ubah Informasi Mesin
                </h3>
                <button onClick={() => setEditMachineOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleEditMachineSubmit} className="p-5 space-y-4">
                {editMachineError && (
                  <div className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-900/50">
                    {editMachineError}
                  </div>
                )}

                {/* Nama Mesin */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Nama Mesin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editMachineData.name}
                    onChange={(e) => setEditMachineData({ ...editMachineData, name: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
                    required
                  />
                </div>

                {/* Area */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Area / Lokasi Mesin
                  </label>
                  <input
                    type="text"
                    value={editMachineData.area}
                    onChange={(e) => setEditMachineData({ ...editMachineData, area: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Status Operasional
                  </label>
                  <select
                    value={editMachineData.status}
                    onChange={(e) => setEditMachineData({ ...editMachineData, status: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500 text-slate-600 dark:text-slate-300"
                    required
                  >
                    <option value="ACTIVE">Aktif (ACTIVE)</option>
                    <option value="MAINTENANCE">Dalam Perawatan (MAINTENANCE)</option>
                    <option value="INACTIVE">Tidak Aktif (INACTIVE)</option>
                  </select>
                </div>

                {/* Deskripsi */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Deskripsi Detail
                  </label>
                  <textarea
                    value={editMachineData.description}
                    onChange={(e) => setEditMachineData({ ...editMachineData, description: e.target.value })}
                    className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500 h-20 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setEditMachineOpen(false)}
                    className="px-4 h-9 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={editMachineLoading}
                    className="px-4 h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-all shadow-md shadow-blue-600/10 shrink-0 cursor-pointer"
                  >
                    {editMachineLoading ? 'Menyimpan...' : 'Simpan Mesin'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 4: Konfirmasi Hapus Mesin */}
        {deleteConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 text-red-600">
                <AlertTriangle size={18} className="shrink-0" />
                <h3 className="text-sm font-bold">Hapus Mesin Produksi?</h3>
              </div>
              <div className="p-5 space-y-3">
                {deleteError && (
                  <div className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 dark:border-red-900/50">
                    {deleteError}
                  </div>
                )}
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Apakah Anda yakin ingin menghapus mesin <span className="font-bold text-slate-800 dark:text-slate-100">[{machine.id}] {machine.name}</span> dari daftar?
                </p>
                <div className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 rounded-lg p-2.5 font-medium leading-normal">
                  ⚠️ Penghapusan ini bersifat permanen. Seluruh pemetaan data suku cadang yang terhubung ke mesin ini akan ikut terhapus otomatis (cascade).
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  disabled={deleteLoading}
                  className="px-4 h-8 text-[11px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteMachine}
                  disabled={deleteLoading}
                  className="px-4 h-8 text-[11px] font-bold bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors cursor-pointer"
                >
                  {deleteLoading ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* MODAL 5: Impor Excel Pemetaan Suku Cadang */}
        {importModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Impor Massal Pemetaan Suku Cadang
                </h3>
                <button onClick={() => setImportModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleImportExcelSubmit} className="p-5 space-y-4">
                {importError && (
                  <div className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-900/50">
                    {importError}
                  </div>
                )}

                <div className="space-y-1 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Unduh Template Terlebih Dahulu</span>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-slate-500">
                      Gunakan format template resmi agar data terbaca oleh sistem.
                    </p>
                    <a
                      href={`/api/machines/${machineId}/parts/template`}
                      download
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 rounded-lg hover:bg-emerald-100/30 transition-colors shrink-0"
                    >
                      📥 Template Excel
                    </a>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Pilih File Excel (.xlsx, .xls)
                  </label>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setImportModalOpen(false)}
                    className="px-4 h-9 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={importLoading || !importFile}
                    className="px-4 h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-all shadow-md shadow-blue-600/10 shrink-0 cursor-pointer"
                  >
                    {importLoading ? 'Mengimpor...' : 'Impor Data'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
  );
}

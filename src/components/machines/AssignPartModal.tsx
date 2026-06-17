'use client';

import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { api } from '@/lib/api';

interface AssignPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  machineId: string;
  partType: 'ELECTRICAL' | 'MECHANICAL';
  onSuccess: () => void;
}

export function AssignPartModal({ isOpen, onClose, machineId, partType, onSuccess }: AssignPartModalProps) {
  const [parts, setParts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartId, setSelectedPartId] = useState('');
  const [recommendedMinQty, setRecommendedMinQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  // Load suku cadang saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      loadParts();
      setSelectedPartId('');
      setRecommendedMinQty(1);
      setNotes('');
      setError('');
    }
  }, [isOpen, partType]);

  const loadParts = async () => {
    try {
      setLoading(true);
      setError('');
      // Ambil seluruh part
      const categoryId = partType === 'ELECTRICAL' ? 'cat-elec' : 'cat-mech';
      const data = await api.parts.list({ categoryId });
      setParts(data);
    } catch (err: any) {
      console.error('Gagal memuat part:', err);
      setError('Gagal memuat daftar suku cadang');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Filter part berdasarkan kueri pencarian lokal
  const filteredParts = parts.filter(
    p =>
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartId) {
      setError('Silakan pilih suku cadang terlebih dahulu');
      return;
    }

    try {
      setSubmitLoading(true);
      setError('');
      await api.machines.assignPart(machineId, {
        partId: selectedPartId,
        partType,
        recommendedMinQty,
        notes
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Gagal memetakan part:', err);
      setError(err.message || 'Terjadi kesalahan saat memetakan suku cadang');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Hubungkan Part {partType === 'ELECTRICAL' ? 'Elektrik' : 'Mekanik'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Modal */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 p-3 rounded-lg border border-red-200 dark:border-red-900/50">
              {error}
            </div>
          )}

          {/* Cari & Pilih Part */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Pilih Suku Cadang
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ID atau nama suku cadang..."
                className="w-full h-9 pl-9 pr-4 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
              />
            </div>
            
            {loading ? (
              <p className="text-[10px] text-slate-400 animate-pulse mt-1">Memuat daftar part...</p>
            ) : filteredParts.length === 0 ? (
              <p className="text-[10px] text-slate-400 mt-1">Suku cadang tidak ditemukan.</p>
            ) : (
              <select
                value={selectedPartId}
                onChange={(e) => setSelectedPartId(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500 mt-1"
              >
                <option value="">-- Pilih Suku Cadang --</option>
                {filteredParts.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.id}] {p.name} (Stok: {p.stock})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Kuantitas Rekomendasi */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Kuantitas Rekomendasi Minimum
            </label>
            <input
              type="number"
              min="1"
              value={recommendedMinQty}
              onChange={(e) => setRecommendedMinQty(Number(e.target.value))}
              className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
              required
            />
          </div>

          {/* Catatan / Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Catatan Khusus (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Lokasi pasang di blower utama..."
              className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500 h-20 resize-none"
            />
          </div>

          {/* Tombol Simpan */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitLoading || !selectedPartId}
              className="px-4 h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-all shadow-md shadow-blue-600/10 shrink-0"
            >
              {submitLoading ? 'Menyimpan...' : 'Hubungkan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default AssignPartModal;

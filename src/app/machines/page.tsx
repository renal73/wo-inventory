'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { api } from '@/lib/api';
import { MachineCard, MachineData } from '@/components/machines/MachineCard';
import { Search, Plus, X, AlertCircle } from 'lucide-react';

export default function MachinesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // State utama
  const [machines, setMachines] = useState<MachineData[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [search, setSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // State Modal Tambah Mesin
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    area: '',
    status: 'ACTIVE'
  });
  const [error, setError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [codePrefix, setCodePrefix] = useState<'UT-' | 'EQ-' | 'NA'>('UT-');
  const [codeBody, setCodeBody] = useState('');

  useEffect(() => {
    loadMachines();
  }, [search, selectedArea, selectedStatus]);

  const loadMachines = async () => {
    try {
      setLoading(true);
      const data = await api.machines.list({
        search,
        area: selectedArea,
        status: selectedStatus
      });
      setMachines(data);

      // Ambil daftar area unik untuk filter dropdown
      if (areas.length === 0) {
        const uniqueAreas = Array.from(
          new Set(data.map((m: any) => m.area).filter(Boolean))
        ) as string[];
        setAreas(uniqueAreas);
      }
    } catch (err) {
      console.error('Gagal memuat daftar mesin:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      area: '',
      status: 'ACTIVE'
    });
    setCodePrefix('UT-');
    setCodeBody('');
    setError('');
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedBody = codeBody.trim();
    const finalId = codePrefix === 'NA' 
      ? trimmedBody.toUpperCase() 
      : `${codePrefix}${trimmedBody.toUpperCase()}`;

    if (!finalId) {
      setError('Kode Mesin wajib diisi');
      return;
    }
    if (!formData.name) {
      setError('Nama Mesin wajib diisi');
      return;
    }

    // Validasi client-side format baru
    if (codePrefix !== 'NA') {
      const bodyRegex = /^[A-Z]{2}\/\d{3,4}$/;
      if (!bodyRegex.test(trimmedBody.toUpperCase())) {
        setError(`Format Kode Mesin salah. Untuk prefix ${codePrefix}, format setelah prefix harus berupa 2 huruf, tanda slash (/), diikuti 3-4 digit angka (Contoh: EL/001 atau ME/0002)`);
        return;
      }
    } else {
      if (finalId.length < 2) {
        setError('Kode mesin minimal terdiri dari 2 karakter (Contoh: NA)');
        return;
      }
    }

    try {
      setSubmitLoading(true);
      await api.machines.create({ ...formData, id: finalId });
      loadMachines();
      setModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Gagal menambahkan mesin baru');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6">
        
        {/* Header Halaman */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase">
              Mesin Produksi & Utility
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Daftar mesin pabrik farmasi. Hubungkan suku cadang elektrik/mekanikal untuk melacak suku cadang pengganti yang kompatibel.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-md shadow-blue-600/10 cursor-pointer shrink-0"
            >
              <Plus size={15} />
              <span>Tambah Mesin</span>
            </button>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan kode (MCH-001) atau nama mesin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Area Filter */}
          <div className="w-full md:w-48">
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500 text-slate-600 dark:text-slate-300"
            >
              <option value="">Semua Area</option>
              {areas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-48">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500 text-slate-600 dark:text-slate-300"
            >
              <option value="">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="INACTIVE">Tidak Aktif</option>
            </select>
          </div>
        </div>

        {/* Grid List Mesin */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
            <p className="text-xs font-semibold text-slate-500 animate-pulse">Memuat daftar mesin...</p>
          </div>
        ) : machines.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl">
            Belum ada mesin terdaftar yang sesuai kriteria filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {machines.map((m) => (
              <MachineCard key={m.id} machine={m} />
            ))}
          </div>
        )}

        {/* MODAL: Tambah Mesin Baru (Admin only) */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Registrasi Mesin Baru
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
                {error && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 p-3 rounded-lg border border-red-200 dark:border-red-900/50">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Kode Mesin */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Kode Mesin <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={codePrefix}
                      onChange={(e) => {
                        const val = e.target.value as 'UT-' | 'EQ-' | 'NA';
                        setCodePrefix(val);
                        setCodeBody('');
                      }}
                      className="h-9 px-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500 text-slate-600 dark:text-slate-300"
                    >
                      <option value="UT-">UT-</option>
                      <option value="EQ-">EQ-</option>
                      <option value="NA">NA/Null (Bebas)</option>
                    </select>
                    <input
                      type="text"
                      placeholder={codePrefix === 'NA' ? 'Contoh: NA atau BOILER' : 'Contoh: EL/001'}
                      value={codeBody}
                      onChange={(e) => setCodeBody(e.target.value)}
                      className="flex-1 h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500 uppercase font-mono tracking-wider"
                      required
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    {codePrefix === 'NA' 
                      ? 'Format Bebas: Masukkan "NA" atau kode lainnya.' 
                      : `Format: Prefix ${codePrefix} diikuti 2 huruf kategori, slash (/), dan 3-4 digit angka (e.g. EL/001).`}
                  </p>
                </div>

                {/* Nama Mesin */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Nama Mesin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan nama mesin..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
                    required
                  />
                </div>

                {/* Area / Lokasi */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Area / Lokasi Mesin
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Produksi Lantai 1, Gudang..."
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Status Awal */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Status Operasional Awal
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
                    Deskripsi / Catatan Teknis
                  </label>
                  <textarea
                    placeholder="Tuliskan spesifikasi detail atau kegunaan mesin..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500 h-20 resize-none"
                  />
                </div>

                {/* Submit buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 h-9 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="px-4 h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-all shadow-md shadow-blue-600/10 shrink-0 cursor-pointer"
                  >
                    {submitLoading ? 'Menyimpan...' : 'Simpan Mesin'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
  );
}

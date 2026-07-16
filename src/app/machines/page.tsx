'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { api } from '@/lib/api';
import { MachineCard, MachineData } from '@/components/machines/MachineCard';
import VodafoneHero, { ShimmerText } from '@/components/machines/VodafoneHero';
import { Search, Plus, X, AlertCircle, Cpu, Wrench, Download } from 'lucide-react';

export default function MachinesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // State utama
  const [machines, setMachines] = useState<MachineData[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbStats, setDbStats] = useState<{ total: number; active: number; maintenance: number; inactive: number; workOrders: number } | null>(null);

  // Filter & Search
  const [search, setSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const [exportLoading, setExportLoading] = useState(false);

  // State Modal Tambah Mesin
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    area: '',
    status: 'ACTIVE',
    powerWattKw: '',
    airPressureBar: ''
  });
  const [error, setError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [codePrefix, setCodePrefix] = useState<'UT-' | 'EQ-' | 'NA'>('UT-');
  const [codeBody, setCodeBody] = useState('');

  useEffect(() => {
    loadMachines();
    if (!dbStats) loadDbStats();
  }, [search, selectedArea, selectedStatus]);

  const loadDbStats = async () => {
    try {
      const res = await fetch('/api/machines/stats');
      const data = await res.json();
      setDbStats(data);
    } catch {}
  };

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

  const handleExport = async () => {
    try {
      setExportLoading(true);
      const res = await fetch('/api/machines/export-excel');
      if (!res.ok) throw new Error('Gagal export data mesin');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().split('T')[0];
      a.download = `mesin-export-${date}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
      alert('Gagal mengunduh data mesin');
    } finally {
      setExportLoading(false);
    }
  };

  const openAddModal = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      area: '',
      status: 'ACTIVE',
      powerWattKw: '',
      airPressureBar: ''
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
        setError(`Format Kode Mesin salah. Untuk prefix ${codePrefix}, format setelah prefix harus berupa 4 huruf, tanda slash (/), diikuti 4 digit angka (Contoh: ABCD/0001)`);
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
      const payload: any = { ...formData, id: finalId };
      // Konversi kW → Watt sebelum kirim ke API
      if (formData.powerWattKw && formData.powerWattKw !== '') {
        payload.powerWatt = Math.round(parseFloat(String(formData.powerWattKw)) * 1000);
      }
      if (formData.airPressureBar && formData.airPressureBar !== '') {
        payload.airPressureValue = parseFloat(String(formData.airPressureBar));
      }
      delete payload.powerWattKw;
      delete payload.airPressureBar;
      await api.machines.create(payload);
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

        {/* Vodafone Hero */}
        {user && (
          <VodafoneHero
            eyebrow="Machine Registry"
            title={
              <>
                <ShimmerText>Mesin Produksi & Utility</ShimmerText>
              </>
            }
            subtitle="Daftar mesin pabrik farmasi. Hubungkan suku cadang elektrik/mekanikal untuk melacak suku cadang pengganti yang kompatibel."
            stats={
              dbStats
                ? [
                    { value: dbStats.active, label: 'Aktif', color: 'text-emerald-400', icon: <Cpu size={14} /> },
                    { value: dbStats.maintenance, label: 'Maintenance', color: 'text-amber-400', icon: <Wrench size={14} /> },
                    { value: dbStats.total, label: 'Total Mesin', color: 'text-white', icon: <Cpu size={14} /> },
                    // { value: dbStats.workOrders, label: 'Total WO', color: 'text-red-400', icon: <Wrench size={14} /> },
                  ]
                : undefined
            }
            action={
              isAdmin ? (
                <button
                  onClick={openAddModal}
                  className="inline-flex items-center gap-1.5 px-4 h-10 text-xs font-bold bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-xl transition-all shadow-lg shadow-red-600/20 cursor-pointer shrink-0"
                >
                  <Plus size={15} />
                  <span>Tambah Mesin</span>
                </button>
              ) : undefined
            }
          />
        )}

        {/* Filter & Search Bar */}
        <div className="bg-black/40 backdrop-blur-md border border-red-900/20 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan kode (MCH-001) atau nama mesin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 text-xs bg-slate-900/60 border border-red-900/30 rounded-lg focus:outline-hidden focus:border-red-500 text-slate-200 placeholder-slate-500"
            />
          </div>

          {/* Area Filter */}
          <div className="w-full md:w-48">
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-slate-900/60 border border-red-900/30 rounded-lg focus:outline-hidden focus:border-red-500 text-slate-300"
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
              className="w-full h-10 px-3 text-xs bg-slate-900/60 border border-red-900/30 rounded-lg focus:outline-hidden focus:border-red-500 text-slate-300"
            >
              <option value="">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="INACTIVE">Tidak Aktif</option>
            </select>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={exportLoading || machines.length === 0}
            className="inline-flex items-center gap-1.5 px-4 h-10 text-xs font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-slate-700 disabled:to-slate-600 disabled:text-slate-400 text-white rounded-xl transition-all shadow-lg shadow-emerald-600/20 cursor-pointer shrink-0"
          >
            <Download size={15} className={exportLoading ? 'animate-bounce' : ''} />
            <span>{exportLoading ? 'Exporting...' : 'Export Excel'}</span>
          </button>
        </div>

        {/* Grid List Mesin dengan border merah gelap */}
        <div className="bg-black/20 backdrop-blur-sm border border-red-950/30 rounded-2xl p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-red-500" />
            <p className="text-xs font-semibold text-slate-400 animate-pulse">Memuat daftar mesin...</p>
          </div>
        ) : machines.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-500 text-xs border border-dashed border-red-900/20 rounded-2xl">
            Belum ada mesin terdaftar yang sesuai kriteria filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {machines.map((m) => (
              <MachineCard key={m.id} machine={m} />
            ))}
          </div>
        )}
        </div>

        {/* MODAL: Tambah Mesin Baru (Admin only) */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-slate-950 border border-red-900/40 rounded-2xl shadow-2xl shadow-red-900/20 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-red-900/20">
                <h3 className="text-sm font-bold text-slate-100">
                  Registrasi Mesin Baru
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
                {error && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-red-400 bg-red-950/30 p-3 rounded-lg border border-red-900/50">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Kode Mesin */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
                      className="h-9 px-2 text-xs bg-slate-900 border border-red-900/30 rounded-lg focus:outline-hidden focus:border-red-500 text-slate-300"
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
                      className="flex-1 h-9 px-3 text-xs bg-slate-900 border border-red-900/30 rounded-lg focus:outline-hidden focus:border-red-500 uppercase font-mono tracking-wider text-slate-200 placeholder-slate-600"
                      required
                    />
                  </div>
                  <p className="text-[9px] text-slate-500 mt-0.5">
                    {codePrefix === 'NA' 
                      ? 'Format Bebas: Masukkan "NA" atau kode lainnya.' 
                      : `Format: Prefix ${codePrefix} diikuti 2 huruf kategori, slash (/), dan 3-4 digit angka (e.g. EL/001).`}
                  </p>
                </div>

                {/* Nama Mesin */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Nama Mesin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan nama mesin..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-slate-900 border border-red-900/30 rounded-lg focus:outline-hidden focus:border-red-500 text-slate-200 placeholder-slate-600"
                    required
                  />
                </div>

                {/* Area / Lokasi */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Area / Lokasi Mesin
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Produksi Lantai 1, Gudang..."
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-slate-900 border border-red-900/30 rounded-lg focus:outline-hidden focus:border-red-500 text-slate-200 placeholder-slate-600"
                  />
                </div>

                {/* Status Awal */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Status Operasional Awal
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-slate-900 border border-red-900/30 rounded-lg focus:outline-hidden focus:border-red-500 text-slate-300"
                    required
                  >
                    <option value="ACTIVE">Aktif (ACTIVE)</option>
                    <option value="MAINTENANCE">Dalam Perawatan (MAINTENANCE)</option>
                    <option value="INACTIVE">Tidak Aktif (INACTIVE)</option>
                  </select>
                </div>

                {/* Deskripsi */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Deskripsi / Catatan Teknis
                  </label>
                  <textarea
                    placeholder="Tuliskan spesifikasi detail atau kegunaan mesin..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3 text-xs bg-slate-900 border border-red-900/30 rounded-lg focus:outline-hidden focus:border-red-500 h-20 resize-none text-slate-200 placeholder-slate-600"
                  />
                </div>

                {/* Daya (kW) & Tekanan Udara (bar) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Daya (kW)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="contoh: 7.5"
                      value={formData.powerWattKw}
                      onChange={(e) => setFormData({ ...formData, powerWattKw: e.target.value })}
                      className="w-full h-9 px-3 text-xs bg-slate-900 border border-red-900/30 rounded-lg focus:outline-hidden focus:border-red-500 text-slate-200 placeholder-slate-600"
                    />
                    <p className="text-[9px] text-slate-500 mt-0.5">Daya dalam kilowatt</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Tekanan Udara (bar)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="contoh: 6.0"
                      value={formData.airPressureBar}
                      onChange={(e) => setFormData({ ...formData, airPressureBar: e.target.value })}
                      className="w-full h-9 px-3 text-xs bg-slate-900 border border-red-900/30 rounded-lg focus:outline-hidden focus:border-red-500 text-slate-200 placeholder-slate-600"
                    />
                    <p className="text-[9px] text-slate-500 mt-0.5">Tekanan dalam bar</p>
                  </div>
                </div>

                {/* Submit buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-red-900/20">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 h-9 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="px-4 h-9 text-xs font-semibold bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:from-red-800 disabled:to-red-700 text-white rounded-lg transition-all shadow-lg shadow-red-600/20 shrink-0 cursor-pointer"
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
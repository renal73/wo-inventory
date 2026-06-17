'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { api } from '@/lib/api';
import { QrCode } from '@/components/ui/QrCode';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  QrCode as QrIcon, 
  History, 
  Edit2, 
  Trash2,
  AlertTriangle,
  Settings,
  Cog,
  X,
  MapPin,
  HelpCircle,
  Package
} from 'lucide-react';

export default function InventoryPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // State utama
  const [parts, setParts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [rackLocations, setRackLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // State filter & pencarian
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRack, setSelectedRack] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [filterHasMachine, setFilterHasMachine] = useState(false);

  // State modal QR Code
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrPart, setQrPart] = useState<any>(null);

  // State modal Riwayat
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyPart, setHistoryPart] = useState<any>(null);
  const [partHistory, setPartHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // State modal Pemetaan Mesin
  const [machineModalOpen, setMachineModalOpen] = useState(false);
  const [machinePart, setMachinePart] = useState<any>(null);

  // State modal Form Add/Edit
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [formPartId, setFormPartId] = useState('');
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    categoryId: '',
    minStockAlert: 5,
    price: 0,
    rackLocation: '',
    vendor: ''
  });
  const [formError, setFormError] = useState('');
  const [formSubmitLoading, setFormSubmitLoading] = useState(false);

  // State modal Konfirmasi Hapus
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePart, setDeletePart] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Muat data awal
  useEffect(() => {
    loadData();
    loadCategories();
  }, [search, selectedCategory, selectedRack, filterLowStock, filterHasMachine]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.parts.list({
        search,
        categoryId: selectedCategory,
        rackLocation: selectedRack,
        lowStock: filterLowStock,
        hasMachine: filterHasMachine
      });
      setParts(data);

      // Ambil daftar lokasi rak unik untuk filter dropdown
      if (rackLocations.length === 0) {
        const uniqueRacks = Array.from(
          new Set(data.map((p: any) => p.rackLocation).filter(Boolean))
        ) as string[];
        setRackLocations(uniqueRacks);
      }
    } catch (err) {
      console.error('Gagal memuat suku cadang:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await api.categories.list();
      setCategories(cats);
    } catch (err) {
      console.error('Gagal memuat kategori:', err);
    }
  };

  // Unduh CSV (Admin only)
  const handleExportCSV = () => {
    window.open('/api/parts/export/csv', '_blank');
  };

  // Handler membuka modal QR
  const openQrModal = (part: any) => {
    setQrPart(part);
    setQrModalOpen(true);
  };

  // Handler membuka modal Riwayat
  const openHistoryModal = async (part: any) => {
    setHistoryPart(part);
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const hist = await api.parts.getHistory(part.id);
      setPartHistory(hist);
    } catch (err) {
      console.error('Gagal memuat riwayat:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Handler membuka modal Mesin
  const openMachineModal = (part: any) => {
    setMachinePart(part);
    setMachineModalOpen(true);
  };

  // Handler membuka form tambah
  const openAddForm = () => {
    setFormMode('ADD');
    setFormData({
      id: '',
      name: '',
      description: '',
      categoryId: categories[0]?.id || '',
      minStockAlert: 5,
      price: 0,
      rackLocation: '',
      vendor: ''
    });
    setFormError('');
    setFormModalOpen(true);
  };

  // Handler membuka form edit
  const openEditForm = (part: any) => {
    setFormMode('EDIT');
    setFormPartId(part.id);
    setFormData({
      id: part.id,
      name: part.name,
      description: part.description || '',
      categoryId: part.categoryId,
      minStockAlert: part.minStockAlert,
      price: part.price,
      rackLocation: part.rackLocation || '',
      vendor: part.vendor || ''
    });
    setFormError('');
    setFormModalOpen(true);
  };

  // Submit form tambah/edit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (formMode === 'ADD' && !formData.id) {
      setFormError('Part ID wajib diisi');
      return;
    }
    if (!formData.name) {
      setFormError('Nama Suku Cadang wajib diisi');
      return;
    }

    try {
      setFormSubmitLoading(true);
      if (formMode === 'ADD') {
        await api.parts.create(formData);
      } else {
        await api.parts.update(formPartId, formData);
      }
      loadData();
      setFormModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan suku cadang');
    } finally {
      setFormSubmitLoading(false);
    }
  };

  // Buka konfirmasi hapus
  const openDeleteConfirm = (part: any) => {
    setDeletePart(part);
    setDeleteError('');
    setDeleteConfirmOpen(true);
  };

  // Eksekusi hapus
  const handleDelete = async () => {
    if (!deletePart) return;
    try {
      setDeleteLoading(true);
      setDeleteError('');
      await api.parts.delete(deletePart.id);
      loadData();
      setDeleteConfirmOpen(false);
    } catch (err: any) {
      setDeleteError(err.message || 'Gagal menghapus suku cadang');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
        
        {/* Header Halaman */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase">
              Inventaris Suku Cadang
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Kelola master data suku cadang engineering, stok minimum rak, dan pemetaan mesin terkait.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3.5 h-9 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition-colors shadow-xs cursor-pointer"
                >
                  <Download size={14} />
                  <span>Ekspor CSV</span>
                </button>

                <button
                  onClick={openAddForm}
                  className="inline-flex items-center gap-1.5 px-3.5 h-9 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-md shadow-blue-600/10 cursor-pointer shrink-0"
                >
                  <Plus size={15} />
                  <span>Tambah Suku Cadang</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan Part ID, nama suku cadang, atau deskripsi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
              />
            </div>

            {/* Kategori Dropdown */}
            <div className="w-full md:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500 text-slate-600 dark:text-slate-300"
              >
                <option value="">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Lokasi Rak Dropdown */}
            <div className="w-full md:w-48">
              <select
                value={selectedRack}
                onChange={(e) => setSelectedRack(e.target.value)}
                className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500 text-slate-600 dark:text-slate-300"
              >
                <option value="">Semua Lokasi Rak</option>
                {rackLocations.map((rack) => (
                  <option key={rack} value={rack}>
                    {rack}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggle Switches (Kritis & Dipakai di Mesin) */}
          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            {/* Filter Stok Menipis */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterLowStock}
                onChange={(e) => setFilterLowStock(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded-xs focus:ring-blue-500 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <AlertTriangle size={14} className="text-red-500 shrink-0" />
                Hanya Stok Menipis / Kritis
              </span>
            </label>

            {/* Filter Dipakai di Mesin */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterHasMachine}
                onChange={(e) => setFilterHasMachine(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded-xs focus:ring-blue-500 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <Cog size={14} className="text-violet-500 shrink-0" />
                Terhubung ke Mesin
              </span>
            </label>
          </div>
        </div>

        {/* Tabel Data Suku Cadang */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              <p className="text-xs font-semibold text-slate-500 animate-pulse">Memuat data inventaris...</p>
            </div>
          ) : parts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-slate-400 text-xs">
              <Package size={30} className="mb-2 text-slate-300" />
              Belum ada suku cadang terdaftar yang memenuhi kriteria pencarian.
            </div>
          ) : (
            <>
              {/* Tampilan Desktop (Tabel) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="p-4">Part ID</th>
                      <th className="p-4">Nama Suku Cadang</th>
                      <th className="p-4">Kategori</th>
                      <th className="p-4 text-center">Stok</th>
                      <th className="p-4">Lokasi Rak</th>
                      <th className="p-4">Harga (Weighted Avg)</th>
                      <th className="p-4 text-center">Dipakai di Mesin</th>
                      <th className="p-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {parts.map((p) => {
                      const totalAsset = p.stock * p.price;
                      return (
                        <tr 
                          key={p.id} 
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all ${
                            p.isLowStock 
                              ? 'bg-red-50/10 dark:bg-red-950/5' 
                              : ''
                          }`}
                        >
                          {/* Part ID */}
                          <td className="p-4 font-mono font-bold text-slate-900 dark:text-slate-100 tracking-wider">
                            {p.id}
                          </td>
                          
                          {/* Nama Suku Cadang */}
                          <td className="p-4">
                            <div className="font-bold text-slate-800 dark:text-slate-200">{p.name}</div>
                            {p.description && (
                              <div className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5" title={p.description}>
                                {p.description}
                              </div>
                            )}
                          </td>

                          {/* Kategori */}
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium text-slate-600 dark:text-slate-300">
                              {p.category?.name || 'Lainnya'}
                            </span>
                          </td>

                          {/* Stok dengan status kritis */}
                          <td className="p-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className={`font-bold ${p.isLowStock ? 'text-red-600 dark:text-red-500 animate-pulse' : 'text-slate-800 dark:text-slate-200'}`}>
                                {p.stock} unit
                              </span>
                              {p.isLowStock && (
                                <span className="text-[8px] font-bold text-red-500 uppercase tracking-widest mt-0.5">
                                  Low stock
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Lokasi Rak */}
                          <td className="p-4">
                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
                              <MapPin size={12} className="text-slate-400 shrink-0" />
                              <span>{p.rackLocation || '-'}</span>
                            </div>
                          </td>

                          {/* Harga */}
                          <td className="p-4">
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p.price)}
                            </div>
                            <div className="text-[9px] text-slate-400 font-semibold mt-0.5">
                              Aset: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalAsset)}
                            </div>
                          </td>

                          {/* Dipakai di Mesin */}
                          <td className="p-4 text-center">
                            {p.machineCount > 0 ? (
                              <button
                                onClick={() => openMachineModal(p)}
                                title="Lihat Pemetaan Mesin"
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 dark:bg-violet-950/20 dark:text-violet-400 border border-violet-200 dark:border-violet-900 cursor-pointer hover:bg-violet-100 transition-colors"
                              >
                                <Cog size={10} />
                                <span>{p.machineCount} Mesin</span>
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400">
                                Tidak Ada
                              </span>
                            )}
                          </td>

                          {/* Aksi */}
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openQrModal(p)}
                                title="Tampilkan Label QR Code"
                                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <QrIcon size={14} />
                              </button>
                              <button
                                onClick={() => openHistoryModal(p)}
                                title="Lihat Riwayat Transaksi"
                                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <History size={14} />
                              </button>
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => openEditForm(p)}
                                    title="Edit Suku Cadang"
                                    className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    onClick={() => openDeleteConfirm(p)}
                                    title="Hapus Suku Cadang"
                                    className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Tampilan Seluler (Kartu/Card View) */}
              <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                {parts.map((p) => {
                  const totalAsset = p.stock * p.price;
                  return (
                    <div 
                      key={p.id} 
                      className={`p-4 space-y-3.5 transition-colors ${
                        p.isLowStock 
                          ? 'bg-red-50/5 dark:bg-red-950/2' 
                          : ''
                      }`}
                    >
                      {/* Baris Pertama: Part ID & Badge Stok */}
                      <div className="flex items-start justify-between">
                        <span className="font-mono text-xs font-black text-slate-900 dark:text-slate-100 tracking-wider">
                          {p.id}
                        </span>
                        
                        <div className="text-right shrink-0">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.isLowStock 
                              ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/50 animate-pulse' 
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            Stok: {p.stock} unit
                          </span>
                          {p.isLowStock && (
                            <span className="text-[8px] font-extrabold text-red-500 uppercase tracking-widest block mt-1">
                              Low Stock
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Baris Kedua: Nama & Deskripsi */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {p.name}
                        </h4>
                        {p.description && (
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {p.description}
                          </p>
                        )}
                        <div className="mt-2">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-850 font-bold text-[9px] text-slate-500 dark:text-slate-400">
                            {p.category?.name || 'Lainnya'}
                          </span>
                        </div>
                      </div>

                      {/* Baris Ketiga: Info Detail (Rak & Harga) */}
                      <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        <div className="space-y-0.5">
                          <span className="text-slate-400 block">Lokasi Rak:</span>
                          <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <MapPin size={11} className="text-slate-400" />
                            {p.rackLocation || '-'}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-slate-400 block">Harga (Avg / Aset):</span>
                          <span className="text-slate-700 dark:text-slate-300 block">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p.price)}
                          </span>
                          <span className="text-[9px] text-slate-400 block">
                            Total: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalAsset)}
                          </span>
                        </div>
                      </div>

                      {/* Baris Keempat: Mesin Terhubung & Tombol Aksi */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <div>
                          {p.machineCount > 0 ? (
                            <button
                              onClick={() => openMachineModal(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-violet-50 text-violet-700 dark:bg-violet-950/20 dark:text-violet-400 border border-violet-200 dark:border-violet-900/50 hover:bg-violet-100 transition-colors cursor-pointer"
                            >
                              <Cog size={10} />
                              <span>{p.machineCount} Mesin</span>
                            </button>
                          ) : (
                            <span className="text-[9px] font-extrabold text-slate-400">
                              Tidak Ada Mesin
                            </span>
                          )}
                        </div>

                        {/* Aksi Cepat */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openQrModal(p)}
                            title="Tampilkan Label QR Code"
                            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <QrIcon size={14} />
                          </button>
                          <button
                            onClick={() => openHistoryModal(p)}
                            title="Lihat Riwayat Transaksi"
                            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <History size={14} />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => openEditForm(p)}
                                title="Edit Suku Cadang"
                                className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => openDeleteConfirm(p)}
                                title="Hapus Suku Cadang"
                                className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* MODAL 1: QR Code Label */}
        {qrModalOpen && qrPart && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Label QR Code Rak</span>
                <button onClick={() => setQrModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 flex flex-col items-center justify-center">
                {/* Visual Generator QR */}
                <QrCode value={qrPart.id} size={150} />
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 mt-4 text-center">
                  {qrPart.name}
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  Lokasi Gudang: {qrPart.rackLocation || 'Belum Ditentukan'}
                </p>
                
                <button 
                  onClick={() => window.print()}
                  className="mt-6 w-full h-8 text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cetak Label Rak
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: Riwayat Transaksi */}
        {historyModalOpen && historyPart && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Riwayat Transaksi</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">[{historyPart.id}] {historyPart.name}</p>
                </div>
                <button onClick={() => setHistoryModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                  <X size={16} />
                </button>
              </div>
              <div className="p-5 overflow-y-auto max-h-96">
                {historyLoading ? (
                  <div className="flex justify-center py-10">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                  </div>
                ) : partHistory.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-10">Belum ada riwayat transaksi barang masuk atau keluar.</p>
                ) : (
                  <div className="space-y-4">
                    {partHistory.map((h) => {
                      const isInbound = h.type === 'INBOUND';
                      return (
                        <div key={h.id} className="flex gap-3 text-xs pl-1">
                          <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${isInbound ? 'bg-blue-500' : 'bg-orange-500'}`} />
                          <div className="flex-1 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-3">
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span className="font-bold text-slate-600 dark:text-slate-300">Oleh: {h.createdBy}</span>
                              <span>{new Date(h.date).toLocaleDateString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                            </div>
                            <p className="text-slate-800 dark:text-slate-200 font-bold mt-1.5">
                              {isInbound ? 'Barang Masuk (Inbound)' : 'Barang Keluar (Outbound)'} : {h.quantity} unit
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/50">
                              {isInbound ? (
                                <>
                                  <div><span className="font-semibold">Harga Beli:</span> {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(h.price)}</div>
                                  <div><span className="font-semibold">Vendor:</span> {h.vendor}</div>
                                </>
                              ) : (
                                <>
                                  <div className="col-span-2"><span className="font-semibold">Tujuan:</span> {h.purpose}</div>
                                  {h.machine && <div className="col-span-2"><span className="font-semibold">Mesin:</span> {h.machine}</div>}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="flex justify-end px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/80">
                <button onClick={() => setHistoryModalOpen(false)} className="px-4 h-8 text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: Pemetaan Mesin */}
        {machineModalOpen && machinePart && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Dipakai di Mesin</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">[{machinePart.id}] {machinePart.name}</p>
                </div>
                <button onClick={() => setMachineModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                  <X size={16} />
                </button>
              </div>
              <div className="p-5 space-y-3 overflow-y-auto max-h-80">
                {machinePart.machines?.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{m.name}</h4>
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5">Kode Mesin: {m.id} | Area: {m.area}</p>
                      {m.notes && <p className="text-[9px] text-slate-400 mt-1 italic">Catatan: {m.notes}</p>}
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-400">
                        {m.partType === 'ELECTRICAL' ? 'Elektrik' : 'Mekanik'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end px-5 py-3.5 border-t border-slate-100 dark:border-slate-800/80">
                <button onClick={() => setMachineModalOpen(false)} className="px-4 h-8 text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 4: Form Add/Edit Part */}
        {formModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {formMode === 'ADD' ? 'Registrasi Suku Cadang Baru' : 'Edit Informasi Suku Cadang'}
                </h3>
                <button onClick={() => setFormModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                  <X size={16} />
                </button>
              </div>
              
              <form onSubmit={handleFormSubmit} className="p-5 space-y-4 max-h-128 overflow-y-auto">
                {formError && (
                  <div className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 p-3 rounded-lg border border-red-200 dark:border-red-900/50">
                    {formError}
                  </div>
                )}

                {/* Part ID (Hanya ADD yang diizinkan isi) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Part ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: EL-001 atau ME-012"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    disabled={formMode === 'EDIT'}
                    className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500 disabled:opacity-50"
                    required
                  />
                  {formMode === 'ADD' && (
                    <p className="text-[9px] text-slate-400 mt-0.5">Format: 2 huruf kapital kategori (EL/ME), tanda hubung, diikuti 3 digit angka.</p>
                  )}
                </div>

                {/* Nama Suku Cadang */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Nama Suku Cadang <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan nama suku cadang..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
                    required
                  />
                </div>

                {/* Kategori */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500 text-slate-600 dark:text-slate-300"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lokasi Rak */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Lokasi Rak Gudang
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Rak A-01"
                    value={formData.rackLocation}
                    onChange={(e) => setFormData({ ...formData, rackLocation: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Batas Minimum Alert */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Batas Minimum Stok Alert
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: Number(e.target.value) })}
                    className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
                    required
                  />
                </div>

                {/* Vendor Utama */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Vendor / Penyuplai Utama
                  </label>
                  <input
                    type="text"
                    placeholder="Nama produsen / distributor..."
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                {/* Catatan / Deskripsi */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Deskripsi Detail
                  </label>
                  <textarea
                    placeholder="Spesifikasi teknis detail barang..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500 h-20 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setFormModalOpen(false)}
                    className="px-4 h-9 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitLoading}
                    className="px-4 h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-all shadow-md shadow-blue-600/10 shrink-0 cursor-pointer"
                  >
                    {formSubmitLoading ? 'Menyimpan...' : 'Simpan Barang'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 5: Konfirmasi Hapus */}
        {deleteConfirmOpen && deletePart && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 text-red-600">
                <AlertTriangle size={18} className="shrink-0" />
                <h3 className="text-sm font-bold">Hapus Suku Cadang?</h3>
              </div>
              <div className="p-5 space-y-3">
                {deleteError && (
                  <div className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 p-3 rounded-lg border border-red-200 dark:border-red-900/50">
                    {deleteError}
                  </div>
                )}
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Apakah Anda yakin ingin menghapus suku cadang <span className="font-bold text-slate-800 dark:text-slate-100">[{deletePart.id}] {deletePart.name}</span> dari inventaris?
                </p>
                <div className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 rounded-lg p-2.5 font-medium leading-normal">
                  ⚠️ Penghapusan ini akan memutus hubungan pemetaan suku cadang ini ke seluruh mesin produksi terkait secara otomatis (cascade).
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
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="px-4 h-8 text-[11px] font-bold bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors cursor-pointer"
                >
                  {deleteLoading ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
  );
}

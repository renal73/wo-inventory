'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { api } from '@/lib/api';
import { 
  Settings, 
  Layers, 
  HelpCircle, 
  Upload, 
  Database, 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
  RefreshCw, 
  UserPlus, 
  Key, 
  CheckCircle,
  AlertTriangle,
  Zap,
  Wrench,
  Cpu,
  Package,
  X
} from 'lucide-react';

export default function AdminPanelPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // State master
  const [categories, setCategories] = useState<any[]>([]);
  const [purposes, setPurposes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  // State feedback
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Package');
  
  const [newPurposeName, setNewPurposeName] = useState('');

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importMachineFile, setImportMachineFile] = useState<File | null>(null);
  const [importMachineLoading, setImportMachineLoading] = useState(false);

  // Form User states
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userFormMode, setUserFormMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userFormData, setUserFormData] = useState({
    username: '',
    name: '',
    role: 'USER' as 'ADMIN' | 'USER',
    resetPassword: false
  });
  const [userFormError, setUserFormError] = useState('');
  const [userFormLoading, setUserFormLoading] = useState(false);

  // List icon kategori
  const iconList = [
    { name: 'Package', icon: Package },
    { name: 'Zap', icon: Zap },
    { name: 'Wrench', icon: Wrench },
    { name: 'Cpu', icon: Cpu }
  ];

  useEffect(() => {
    if (isAdmin) {
      loadAllData();
    }
  }, [isAdmin]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [cats, purs, usrs] = await Promise.all([
        api.categories.list(),
        api.purposes.list(),
        api.users.list()
      ]);
      setCategories(cats);
      setPurposes(purs);
      setUsers(usrs);
    } catch (err) {
      console.error('Gagal memuat data admin:', err);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 5000);
  };

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(''), 5000);
  };

  // --- KATEGORI CRUD ---
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    try {
      await api.categories.create({ name: newCatName, icon: newCatIcon });
      setNewCatName('');
      loadAllData();
      showSuccess('Kategori baru berhasil ditambahkan');
    } catch (err: any) {
      showError(err.message || 'Gagal menambahkan kategori');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Hapus kategori ini?')) return;
    try {
      const res = await api.categories.delete(id);
      loadAllData();
      showSuccess('Kategori berhasil dihapus');
    } catch (err: any) {
      showError(err.message || 'Gagal menghapus kategori');
    }
  };

  // --- TUJUAN PENGGUNAAN CRUD ---
  const handleAddPurpose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPurposeName) return;

    try {
      await api.purposes.create({ purpose: newPurposeName });
      setNewPurposeName('');
      loadAllData();
      showSuccess('Tujuan penggunaan baru berhasil ditambahkan');
    } catch (err: any) {
      showError(err.message || 'Gagal menambahkan tujuan penggunaan');
    }
  };

  const handleTogglePurpose = async (p: any) => {
    try {
      await api.purposes.update(p.id, { purpose: p.purpose, isActive: !p.isActive });
      loadAllData();
      showSuccess('Status tujuan penggunaan berhasil diperbarui');
    } catch (err: any) {
      showError(err.message || 'Gagal memperbarui status');
    }
  };

  const handleDeletePurpose = async (id: string) => {
    if (!confirm('Hapus tujuan penggunaan ini?')) return;
    try {
      await api.purposes.delete(id);
      loadAllData();
      showSuccess('Tujuan penggunaan berhasil dihapus');
    } catch (err: any) {
      showError(err.message || 'Gagal menghapus tujuan penggunaan');
    }
  };

  // --- FILE IMPORT (EXCEL / CSV) ---
  const handleImportUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;

    const fileExt = importFile.name.split('.').pop()?.toLowerCase();
    const isExcel = fileExt === 'xlsx' || fileExt === 'xls';
    const isCsv = fileExt === 'csv';

    if (!isExcel && !isCsv) {
      showError('Format berkas tidak didukung. Harap pilih berkas .xlsx, .xls, atau .csv');
      return;
    }

    try {
      setImportLoading(true);
      const fd = new FormData();
      fd.append('file', importFile);
      
      let res;
      if (isExcel) {
        res = await api.utils.importExcel(fd);
      } else {
        res = await api.utils.importCsv(fd);
      }

      if (res.success) {
        showSuccess(res.message);
        setImportFile(null);
        // Clear input file
        const input = document.getElementById('importFileInput') as HTMLInputElement;
        if (input) input.value = '';
        loadAllData();
      }
    } catch (err: any) {
      showError(err.message || 'Gagal mengimpor file data barang');
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportMachineUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importMachineFile) return;

    const fileExt = importMachineFile.name.split('.').pop()?.toLowerCase();
    const isExcel = fileExt === 'xlsx' || fileExt === 'xls';

    if (!isExcel) {
      showError('Format berkas tidak didukung. Harap pilih berkas template Excel .xlsx atau .xls');
      return;
    }

    try {
      setImportMachineLoading(true);
      const fd = new FormData();
      fd.append('file', importMachineFile);
      
      const res = await api.utils.importMachinesExcel(fd);

      if (res.success) {
        showSuccess(res.message);
        setImportMachineFile(null);
        // Clear input file
        const input = document.getElementById('importMachineFileInput') as HTMLInputElement;
        if (input) input.value = '';
        loadAllData();
      }
    } catch (err: any) {
      showError(err.message || 'Gagal mengimpor file data mesin');
    } finally {
      setImportMachineLoading(false);
    }
  };

  // --- DATABASE OPERATIONS ---
  const handleDatabaseSeed = async () => {
    if (!confirm('⚠️ PERINGATAN: Seluruh data transaksi & relasi saat ini akan digantikan dengan data bawaan default. Lanjutkan?')) return;
    try {
      const res = await api.utils.seedDb();
      loadAllData();
      showSuccess(res.message);
    } catch (err: any) {
      showError(err.message || 'Gagal melakukan seed database');
    }
  };

  const handleDatabaseClear = async () => {
    if (!confirm('🚨 BAHAYA: Ini akan menghapus seluruh data barang (suku cadang) sampai kosong dari database, beserta semua riwayat transaksi masuk/keluar dan pemetaan mesin. Lanjutkan?')) return;
    try {
      const res = await api.utils.clearDb();
      loadAllData();
      showSuccess(res.message);
    } catch (err: any) {
      showError(err.message || 'Gagal mengosongkan database');
    }
  };

  // --- USER OPERATIONS ---
  const openAddUserModal = () => {
    setUserFormMode('ADD');
    setUserFormData({
      username: '',
      name: '',
      role: 'USER',
      resetPassword: false
    });
    setUserFormError('');
    setUserModalOpen(true);
  };

  const openEditUserModal = (u: any) => {
    setUserFormMode('EDIT');
    setSelectedUserId(u.id);
    setUserFormData({
      username: u.username,
      name: u.name,
      role: u.role,
      resetPassword: false
    });
    setUserFormError('');
    setUserModalOpen(true);
  };

  const handleUserFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError('');

    if (!userFormData.username || !userFormData.name) {
      setUserFormError('Username dan nama user wajib diisi');
      return;
    }

    try {
      setUserFormLoading(true);
      if (userFormMode === 'ADD') {
        await api.users.create(userFormData);
      } else {
        await api.users.update(selectedUserId, userFormData);
      }
      loadAllData();
      setUserModalOpen(false);
      showSuccess(`Pengguna berhasil ${userFormMode === 'ADD' ? 'dibuat. Password default: ' + userFormData.username + '123' : 'diperbarui'}`);
    } catch (err: any) {
      setUserFormError(err.message || 'Gagal memproses data user');
    } finally {
      setUserFormLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === 'usr-admin') {
      showError('Administrator utama tidak dapat dihapus');
      return;
    }
    if (!confirm('Apakah Anda yakin ingin menghapus akun pengguna ini?')) return;

    try {
      await api.users.delete(id);
      loadAllData();
      showSuccess('Akun pengguna berhasil dihapus');
    } catch (err: any) {
      showError(err.message || 'Gagal menghapus user');
    }
  };

  return (
    <div className="space-y-6">
        
        {/* Header Halaman */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
          <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase">
            Panel Administrasi Sistem
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi master data kategori, tujuan transaksi, bulk upload inventaris, kontrol akun user, dan pemulihan database.
          </p>
        </div>

        {/* Global Feedback Alert */}
        {success && (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
            <CheckCircle size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-900/50">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Grid Menu Kontrol Admin */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* SEKSI 1: Kelola Kategori */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col space-y-4">
            <h3 className="text-xs font-bold text-slate-950 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-1.5">
              <Layers size={14} className="text-blue-600" />
              <span>Kelola Kategori Master</span>
            </h3>

            {/* Form Tambah Kategori */}
            <form onSubmit={handleAddCategory} className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nama Kategori</label>
                <input
                  type="text"
                  placeholder="Contoh: Instrumentasi..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
                />
              </div>

              {/* Ikon selector */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Ikon</label>
                <select
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  className="h-8 px-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500 text-slate-600 dark:text-slate-300"
                >
                  <option value="Package">📦 Package</option>
                  <option value="Zap">⚡ Zap</option>
                  <option value="Wrench">🔧 Wrench</option>
                  <option value="Cpu">💻 Cpu</option>
                </select>
              </div>

              <button
                type="submit"
                className="px-3.5 h-8 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-md shadow-blue-600/10 cursor-pointer shrink-0"
              >
                Tambah
              </button>
            </form>

            {/* List Kategori */}
            <div className="flex-1 overflow-y-auto max-h-40 divide-y divide-slate-100 dark:divide-slate-800/80">
              {categories.map((c) => {
                return (
                  <div key={c.id} className="flex items-center justify-between py-2.5 text-xs">
                    <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                      <span>{c.name}</span>
                      <span className="text-[9px] text-slate-400">({c.partCount || 0} part)</span>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(c.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1"
                      title="Hapus Kategori"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SEKSI 2: Tujuan Penggunaan */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col space-y-4">
            <h3 className="text-xs font-bold text-slate-950 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-1.5">
              <HelpCircle size={14} className="text-blue-600" />
              <span>Tujuan Penggunaan Outbound</span>
            </h3>

            {/* Form Tambah Tujuan */}
            <form onSubmit={handleAddPurpose} className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Parameter Tujuan Penggunaan</label>
                <input
                  type="text"
                  placeholder="Contoh: Overhaul Pabrik..."
                  value={newPurposeName}
                  onChange={(e) => setNewPurposeName(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="px-3.5 h-8 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-md shadow-blue-600/10 cursor-pointer shrink-0"
              >
                Tambah
              </button>
            </form>

            {/* List Tujuan Penggunaan */}
            <div className="flex-1 overflow-y-auto max-h-40 divide-y divide-slate-100 dark:divide-slate-800/80">
              {purposes.map((p) => {
                return (
                  <div key={p.id} className="flex items-center justify-between py-2.5 text-xs">
                    <div className="flex items-center gap-3 font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={p.isActive}
                        onChange={() => handleTogglePurpose(p)}
                        className="w-3.5 h-3.5 border-slate-300 rounded-sm text-blue-600"
                        title="Aktif/Nonaktifkan Dropdown"
                      />
                      <span className={p.isActive ? '' : 'text-slate-400 line-through'}>{p.purpose}</span>
                    </div>
                    <button
                      onClick={() => handleDeletePurpose(p.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1"
                      title="Hapus Tujuan"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SEKSI 3: Import Suku Cadang (Excel / CSV) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-950 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <Upload size={14} className="text-blue-600" />
                <span>Import Suku Cadang (Excel / CSV)</span>
              </h3>
              
              <a
                href="/api/parts/template"
                download
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-extrabold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 rounded-lg hover:bg-emerald-100/30 transition-colors"
              >
                📥 Template Excel
              </a>
            </div>

            <form onSubmit={handleImportUpload} className="space-y-4">
              <p className="text-[10px] text-slate-500 leading-normal">
                Pilih file Excel (<code className="font-mono">.xlsx</code>, <code className="font-mono">.xls</code>) atau <code className="font-mono">.csv</code> dengan struktur kolom: <br />
                <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 border border-slate-200 dark:border-slate-700 rounded-sm block mt-1">
                  Part ID, Nama Suku Cadang, Kategori, Stok Fisik, Lokasi Rak, Harga Satuan, Vendor, Deskripsi
                </code>
              </p>
              
              <div className="flex gap-2">
                <input
                  id="importFileInput"
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="flex-1 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  required
                />

                <button
                  type="submit"
                  disabled={importLoading || !importFile}
                  className="px-4 h-9 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-all shadow-md shadow-blue-600/10 cursor-pointer shrink-0"
                >
                  {importLoading ? 'Mengimpor...' : 'Impor Data'}
                </button>
              </div>
            </form>
          </div>

          {/* SEKSI 3b: Import Mesin (Excel) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-950 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <Upload size={14} className="text-blue-600" />
                <span>Import Mesin (Excel)</span>
              </h3>
              
              <a
                href="/api/machines/template"
                download
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-extrabold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 rounded-lg hover:bg-emerald-100/30 transition-colors"
              >
                📥 Template Excel
              </a>
            </div>

            <form onSubmit={handleImportMachineUpload} className="space-y-4">
              <p className="text-[10px] text-slate-500 leading-normal">
                Pilih file Excel (<code className="font-mono">.xlsx</code>, <code className="font-mono">.xls</code>) dengan struktur kolom: <br />
                <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 border border-slate-200 dark:border-slate-700 rounded-sm block mt-1">
                  Kode Mesin, Nama Mesin, Area, Status, Deskripsi
                </code>
              </p>
              
              <div className="flex gap-2">
                <input
                  id="importMachineFileInput"
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => setImportMachineFile(e.target.files?.[0] || null)}
                  className="flex-1 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  required
                />

                <button
                  type="submit"
                  disabled={importMachineLoading || !importMachineFile}
                  className="px-4 h-9 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-all shadow-md shadow-blue-600/10 cursor-pointer shrink-0"
                >
                  {importMachineLoading ? 'Mengimpor...' : 'Impor Data'}
                </button>
              </div>
            </form>
          </div>

          {/* SEKSI 4: Manajemen Database */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col space-y-4">
            <h3 className="text-xs font-bold text-slate-950 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-1.5">
              <Database size={14} className="text-blue-600" />
              <span>Manajemen Database Sistem</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <button
                onClick={handleDatabaseSeed}
                className="flex items-center justify-center gap-1.5 px-4 h-9 font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <RefreshCw size={13} />
                <span>Reset ke Data Dummy</span>
              </button>

              <button
                onClick={handleDatabaseClear}
                className="flex items-center justify-center gap-1.5 px-4 h-9 font-bold bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 rounded-lg hover:bg-red-100/30 transition-colors cursor-pointer border border-red-200 dark:border-red-900/50"
              >
                <Trash2 size={13} />
                <span>Kosongkan Database</span>
              </button>
            </div>
            <p className="text-[9px] text-slate-400 italic">
              * Seed data dummy akan mengisi beberapa data mesin awal, log dummy transaksi masuk/keluar, dan akun standard untuk pengujian visual dashboard.
            </p>
          </div>

        </div>

        {/* SEKSI 5: Manajemen User (Full Width) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-950 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <Users size={14} className="text-blue-600" />
              <span>Daftar & Manajemen Akun Pengguna</span>
            </h3>
            
            <button
              onClick={openAddUserModal}
              className="inline-flex items-center gap-1 px-2.5 h-7 text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-md shadow-blue-600/10 cursor-pointer"
            >
              <UserPlus size={12} />
              <span>Tambah User</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3">Nama User</th>
                  <th className="p-3">Username</th>
                  <th className="p-3">Hak Akses Role</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {users.map((u) => {
                  const isMainAdmin = u.username === 'admin';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{u.name}</td>
                      <td className="p-3 font-mono font-bold text-slate-500">{u.username}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          u.role === 'ADMIN' 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditUserModal(u)}
                            className="text-slate-400 hover:text-blue-600 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Ubah Detail User"
                          >
                            <Edit2 size={12} />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={isMainAdmin}
                            className={`p-1 rounded-lg ${
                              isMainAdmin 
                                ? 'text-slate-300 cursor-not-allowed' 
                                : 'text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                            title="Hapus Akun"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL USER FORM (ADD/EDIT) */}
        {userModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {userFormMode === 'ADD' ? 'Tambah Akun Pengguna Baru' : 'Ubah Detail Pengguna'}
                </h3>
                <button onClick={() => setUserModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleUserFormSubmit} className="p-5 space-y-4">
                {userFormError && (
                  <div className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-900/50">
                    {userFormError}
                  </div>
                )}

                {/* Username */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: budi, reza..."
                    value={userFormData.username}
                    onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                    disabled={userFormMode === 'EDIT'}
                    className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500 disabled:opacity-50"
                    required
                  />
                  {userFormMode === 'ADD' && (
                    <p className="text-[9px] text-slate-400 mt-0.5">Password default akun baru: <span className="font-bold">username + &quot;123&quot;</span></p>
                  )}
                </div>

                {/* Nama Lengkap */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan nama lengkap..."
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                    className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
                    required
                  />
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Hak Akses Peran (Role)
                  </label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as 'ADMIN' | 'USER' })}
                    className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500 text-slate-600 dark:text-slate-300"
                    required
                  >
                    <option value="USER">USER (Teknisi Lapangan)</option>
                    <option value="ADMIN">ADMIN (Supervisor Gudang / Engineering)</option>
                  </select>
                </div>

                {/* Reset Password (Hanya Tampil saat EDIT) */}
                {userFormMode === 'EDIT' && (
                  <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs font-semibold text-slate-600 dark:text-slate-400 select-none">
                    <input
                      type="checkbox"
                      checked={userFormData.resetPassword}
                      onChange={(e) => setUserFormData({ ...userFormData, resetPassword: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded-xs focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="flex items-center gap-1">
                      <Key size={13} className="text-amber-500" />
                      Reset Password ke Default ({userFormData.username}123)
                    </span>
                  </label>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setUserModalOpen(false)}
                    className="px-4 h-9 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={userFormLoading}
                    className="px-4 h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-all shadow-md shadow-blue-600/10 shrink-0 cursor-pointer"
                  >
                    {userFormLoading ? 'Menyimpan...' : 'Simpan Akun'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
  );
}

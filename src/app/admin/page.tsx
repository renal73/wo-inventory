'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { api } from '@/lib/api';
import { 
  Settings, 
  Layers, 
  HelpCircle, 
  Upload, 
  Download,
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
  X,
  FileSpreadsheet,
  AlertCircle,
  Ruler,
  MapPin
} from 'lucide-react';

export default function AdminPanelPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // State master
  const [categories, setCategories] = useState<any[]>([]);
  const [purposes, setPurposes] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  // State feedback
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Package');
  
  const [newPurposeName, setNewPurposeName] = useState('');

  // Form Satuan states
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitLabel, setNewUnitLabel] = useState('');

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
    role: 'USER' as 'ADMIN' | 'USER' | 'WAREHOUSE' | 'TECHNICIAN' | 'OPERATOR' | 'QC_ANALYST',
    resetPassword: false
  });
  const [userFormError, setUserFormError] = useState('');
  const [userFormLoading, setUserFormLoading] = useState(false);

  // Work Orders Admin State
  const [woCount, setWoCount] = useState<number>(0);
  const [woLoading, setWoLoading] = useState(false);
  const [woImportFile, setWoImportFile] = useState<File | null>(null);
  const [woImportLoading, setWoImportLoading] = useState(false);
  const [woDeleteConfirmOpen, setWoDeleteConfirmOpen] = useState(false);
  const [woDeleting, setWoDeleting] = useState(false);

  // Tools Admin State
  const [toolsCount, setToolsCount] = useState<number>(0);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [toolsImportFile, setToolsImportFile] = useState<File | null>(null);
  const [toolsImportLoading, setToolsImportLoading] = useState(false);
  const [toolsDeleteConfirmOpen, setToolsDeleteConfirmOpen] = useState(false);
  const [toolsDeleting, setToolsDeleting] = useState(false);

  // Rooms Admin State
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomLocation, setNewRoomLocation] = useState('');
  const [roomsImportFile, setRoomsImportFile] = useState<File | null>(null);
  const [roomsImportLoading, setRoomsImportLoading] = useState(false);

  // List icon kategori
  const iconList = [
    { name: 'Package', icon: Package },
    { name: 'Zap', icon: Zap },
    { name: 'Wrench', icon: Wrench },
    { name: 'Cpu', icon: Cpu }
  ];

  // Load Work Orders & Tools count on mount
  useEffect(() => {
    if (isAdmin) {
      loadAllData();
      loadWoCount();
      loadToolsCount();
      loadRooms();
    }
  }, [isAdmin]);

  const loadWoCount = async () => {
    try {
      setWoLoading(true);
      const res = await api.workOrdersAdmin.getCount();
      setWoCount(res.count);
    } catch (err) {
      console.error('Gagal memuat jumlah work orders:', err);
    } finally {
      setWoLoading(false);
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [cats, purs, usrs, unts] = await Promise.all([
        api.categories.list(),
        api.purposes.list(),
        api.users.list(),
        fetch('/api/unit-of-measures').then(r => r.json())
      ]);
      setCategories(cats);
      setPurposes(purs);
      setUsers(usrs);
      setUnits(unts);
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

  // --- SATUAN CRUD ---
  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName || !newUnitLabel) return;

    try {
      const res = await fetch('/api/unit-of-measures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newUnitName, label: newUnitLabel })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setNewUnitName('');
      setNewUnitLabel('');
      loadAllData();
      showSuccess('Satuan baru berhasil ditambahkan');
    } catch (err: any) {
      showError(err.message || 'Gagal menambahkan satuan');
    }
  };

  const handleDeleteUnit = async (id: string) => {
    if (!confirm('Hapus satuan ini?')) return;
    try {
      const res = await fetch(`/api/unit-of-measures?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      loadAllData();
      showSuccess('Satuan berhasil dihapus');
    } catch (err: any) {
      showError(err.message || 'Gagal menghapus satuan');
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

  const handleClearParts = async () => {
    if (!confirm('🚨 BAHAYA: Ini akan menghapus seluruh data barang (suku cadang) sampai kosong dari database, beserta semua riwayat transaksi masuk/keluar dan pemetaan mesin. Lanjutkan?')) return;
    try {
      const res = await api.utils.clearDbParts();
      loadAllData();
      showSuccess(res.message);
    } catch (err: any) {
      showError(err.message || 'Gagal mengosongkan data barang');
    }
  };

  const handleClearMachines = async () => {
    if (!confirm('🚨 BAHAYA: Ini akan menghapus seluruh data mesin produksi sampai kosong dari database. Riwayat transaksi akan tetap ada namun referensi mesinnya akan dihilangkan. Lanjutkan?')) return;
    try {
      const res = await api.utils.clearDbMachines();
      loadAllData();
      showSuccess(res.message);
    } catch (err: any) {
      showError(err.message || 'Gagal mengosongkan data mesin');
    }
  };

  // --- WORK ORDERS ADMIN OPERATIONS ---
  const handleExportWorkOrders = async (format: 'csv' | 'excel' = 'csv') => {
    try {
      setWoLoading(true);
      const response = format === 'excel' 
        ? await api.workOrdersAdmin.exportExcel()
        : await api.workOrdersAdmin.export();
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().split('T')[0];
      a.download = format === 'excel' 
        ? `work-orders-export-${date}.xlsx`
        : `work-orders-export-${date}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSuccess(`Work orders berhasil diexport ke ${format.toUpperCase()}`);
    } catch (err: any) {
      showError(err.message || 'Gagal export work orders');
    } finally {
      setWoLoading(false);
    }
  };

  const handleDownloadTemplate = async (format: 'csv' | 'excel' = 'csv') => {
    try {
      const response = format === 'excel'
        ? await api.workOrdersAdmin.getTemplateExcel()
        : await api.workOrdersAdmin.getTemplate();
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'excel'
        ? 'work-orders-import-template.xlsx'
        : 'work-orders-import-template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSuccess(`Template ${format.toUpperCase()} berhasil didownload`);
    } catch (err: any) {
      showError(err.message || 'Gagal download template');
    }
  };

  const handleImportWorkOrders = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!woImportFile) return;

    const fileExt = woImportFile.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'csv' && fileExt !== 'xlsx' && fileExt !== 'xls') {
      showError('Format file harus CSV atau Excel (.xlsx, .xls)');
      return;
    }

    try {
      setWoImportLoading(true);
      const fd = new FormData();
      fd.append('file', woImportFile);
      const res = await api.workOrdersAdmin.import(fd);
      showSuccess(res.message);
      setWoImportFile(null);
      const input = document.getElementById('woImportFileInput') as HTMLInputElement;
      if (input) input.value = '';
      loadWoCount();
    } catch (err: any) {
      showError(err.message || 'Gagal import work orders');
    } finally {
      setWoImportLoading(false);
    }
  };

  const handleDeleteAllWorkOrders = async () => {
    try {
      setWoDeleting(true);
      const res = await api.workOrdersAdmin.deleteAll();
      showSuccess(res.message);
      setWoDeleteConfirmOpen(false);
      loadWoCount();
    } catch (err: any) {
      showError(err.message || 'Gagal menghapus work orders');
    } finally {
      setWoDeleting(false);
    }
  };

  // --- ROOMS ADMIN OPERATIONS ---
  const loadRooms = async () => {
    try {
      setRoomsLoading(true);
      const res = await fetch('/api/rooms');
      const data = await res.json();
      setRooms(Array.isArray(data) ? data : data.rooms || []);
    } catch (err) {
      console.error('Gagal memuat data ruangan:', err);
    } finally {
      setRoomsLoading(false);
    }
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    try {
      await api.rooms.create({ name: newRoomName.trim(), description: newRoomLocation.trim() || undefined });
      setNewRoomName('');
      setNewRoomLocation('');
      loadRooms();
      showSuccess('Ruangan berhasil ditambahkan');
    } catch (err: any) {
      showError(err.message || 'Gagal menambahkan ruangan');
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm('Hapus ruangan ini?')) return;
    try {
      await api.rooms.delete(id);
      loadRooms();
      showSuccess('Ruangan berhasil dihapus');
    } catch (err: any) {
      showError(err.message || 'Gagal menghapus ruangan');
    }
  };

  const handleImportRooms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomsImportFile) return;
    try {
      setRoomsImportLoading(true);
      const fd = new FormData();
      fd.append('file', roomsImportFile);
      const res = await fetch('/api/rooms/import', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showSuccess(data.message);
      setRoomsImportFile(null);
      const input = document.getElementById('roomsImportFileInput') as HTMLInputElement;
      if (input) input.value = '';
      loadRooms();
    } catch (err: any) {
      showError(err.message || 'Gagal import ruangan');
    } finally {
      setRoomsImportLoading(false);
    }
  };

  const handleExportRooms = async () => {
    try {
      const response = await fetch('/api/rooms/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rooms-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSuccess('Ruangan berhasil diexport');
    } catch (err: any) {
      showError(err.message || 'Gagal export ruangan');
    }
  };

  // --- TOOLS ADMIN OPERATIONS ---
  const loadToolsCount = async () => {
    try {
      setToolsLoading(true);
      const res = await api.toolsAdmin.getCount();
      setToolsCount(res.count);
    } catch (err) {
      console.error('Gagal memuat jumlah tools:', err);
    } finally {
      setToolsLoading(false);
    }
  };

  const handleExportTools = async (format: 'csv' | 'excel' = 'csv') => {
    try {
      setToolsLoading(true);
      const response = format === 'excel'
        ? await api.toolsAdmin.exportExcel()
        : await api.toolsAdmin.export();
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().split('T')[0];
      a.download = format === 'excel'
        ? `tools-export-${date}.xlsx`
        : `tools-export-${date}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSuccess(`Tools berhasil diexport ke ${format.toUpperCase()}`);
    } catch (err: any) {
      showError(err.message || 'Gagal export tools');
    } finally {
      setToolsLoading(false);
    }
  };

  const handleDownloadToolsTemplate = async (format: 'csv' | 'excel' = 'csv') => {
    try {
      const response = format === 'excel'
        ? await api.toolsAdmin.getTemplateExcel()
        : await api.toolsAdmin.getTemplate();
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'excel'
        ? 'tools-import-template.xlsx'
        : 'tools-import-template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSuccess(`Template ${format.toUpperCase()} berhasil didownload`);
    } catch (err: any) {
      showError(err.message || 'Gagal download template');
    }
  };

  const handleImportTools = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toolsImportFile) return;

    const fileExt = toolsImportFile.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'csv' && fileExt !== 'xlsx' && fileExt !== 'xls') {
      showError('Format file harus CSV atau Excel (.xlsx, .xls)');
      return;
    }

    try {
      setToolsImportLoading(true);
      const fd = new FormData();
      fd.append('file', toolsImportFile);
      const res = await api.toolsAdmin.import(fd);
      showSuccess(res.message);
      setToolsImportFile(null);
      const input = document.getElementById('toolsImportFileInput') as HTMLInputElement;
      if (input) input.value = '';
      loadToolsCount();
    } catch (err: any) {
      showError(err.message || 'Gagal import tools');
    } finally {
      setToolsImportLoading(false);
    }
  };

  const handleDeleteAllTools = async () => {
    try {
      setToolsDeleting(true);
      const res = await api.toolsAdmin.deleteAll();
      showSuccess(res.message);
      setToolsDeleteConfirmOpen(false);
      loadToolsCount();
    } catch (err: any) {
      showError(err.message || 'Gagal menghapus tools');
    } finally {
      setToolsDeleting(false);
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

          {/* SEKSI 1b: Kelola Satuan Stok */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col space-y-4">
            <h3 className="text-xs font-bold text-slate-950 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-1.5">
              <Ruler size={14} className="text-blue-600" />
              <span>Kelola Satuan Stok</span>
            </h3>

            {/* Form Tambah Satuan */}
            <form onSubmit={handleAddUnit} className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nama Satuan</label>
                <input
                  type="text"
                  placeholder="Contoh: Roll, Pcs, Box..."
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Label</label>
                <input
                  type="text"
                  placeholder="Contoh: roll, pcs, box..."
                  value={newUnitLabel}
                  onChange={(e) => setNewUnitLabel(e.target.value)}
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

            {/* List Satuan */}
            <div className="flex-1 overflow-y-auto max-h-40 divide-y divide-slate-100 dark:divide-slate-800/80">
              {units.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-2.5 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                    <span>{u.name}</span>
                    <span className="text-[9px] text-slate-400 font-mono">({u.label})</span>
                    <span className="text-[9px] text-slate-400">— {u._count?.parts || 0} part</span>
                  </div>
                  <button
                    onClick={() => handleDeleteUnit(u.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors p-1"
                    title="Hapus Satuan"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {units.length === 0 && (
                <p className="text-[10px] text-slate-400 py-2">Belum ada satuan yang terdaftar.</p>
              )}
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <button
                onClick={handleDatabaseSeed}
                className="flex items-center justify-center gap-1.5 px-4 h-9 font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <RefreshCw size={13} />
                <span>Reset ke Data Dummy</span>
              </button>

              <button
                onClick={handleClearParts}
                className="flex items-center justify-center gap-1.5 px-4 h-9 font-bold bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 rounded-lg hover:bg-red-100/30 transition-colors cursor-pointer border border-red-200 dark:border-red-900/50"
              >
                <Trash2 size={13} />
                <span>Kosongkan Data Barang</span>
              </button>

              <button
                onClick={handleClearMachines}
                className="flex items-center justify-center gap-1.5 px-4 h-9 font-bold bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400 rounded-lg hover:bg-orange-100/30 transition-colors cursor-pointer border border-orange-200 dark:border-orange-900/50"
              >
                <Trash2 size={13} />
                <span>Kosongkan Data Mesin</span>
              </button>
            </div>
            <p className="text-[9px] text-slate-400 italic">
              * Seed data dummy akan mengisi beberapa data mesin awal, log dummy transaksi masuk/keluar, dan akun standard untuk pengujian visual dashboard.
            </p>
          </div>

        </div>

        {/* SEKSI B-1: Work Orders Admin - Import / Export / Delete All */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-950 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet size={14} className="text-blue-600" />
              <span>Manajemen Work Orders (Import / Export)</span>
            </h3>
            <div className="flex items-center gap-2">
              {woLoading ? (
                <span className="text-[10px] text-slate-400">Memuat...</span>
              ) : (
                <span className="px-2.5 py-1 text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg">
                  {woCount} Work Orders
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Export Section */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <Download size={16} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Export Work Orders</h4>
                  <p className="text-[9px] text-slate-400">Download semua data WO ke CSV atau Excel</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExportWorkOrders('csv')}
                  disabled={woLoading || woCount === 0}
                  className="flex-1 px-3 py-2 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
                >
                  {woLoading ? '...' : '📥 CSV'}
                </button>
                <button
                  onClick={() => handleExportWorkOrders('excel')}
                  disabled={woLoading || woCount === 0}
                  className="flex-1 px-3 py-2 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-md shadow-blue-600/10 cursor-pointer"
                >
                  {woLoading ? '...' : '📊 Excel'}
                </button>
              </div>
            </div>

            {/* Import Section */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Upload size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Import Work Orders</h4>
                  <p className="text-[9px] text-slate-400">Upload data WO dari file CSV atau Excel</p>
                </div>
              </div>
              <form onSubmit={handleImportWorkOrders} className="space-y-2">
                <input
                  id="woImportFileInput"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setWoImportFile(e.target.files?.[0] || null)}
                  className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
                <button
                  type="submit"
                  disabled={woImportLoading || !woImportFile}
                  className="w-full px-3 py-2 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-md shadow-blue-600/10 cursor-pointer"
                >
                  {woImportLoading ? 'Mengimpor...' : '📤 Import CSV/Excel'}
                </button>
              </form>
            </div>

            {/* Template & Delete Section */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <FileSpreadsheet size={16} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Template & Hapus Semua</h4>
                  <p className="text-[9px] text-slate-400">Download template CSV/Excel</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownloadTemplate('csv')}
                  className="flex-1 px-3 py-2 text-[10px] font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all shadow-md shadow-purple-600/10 cursor-pointer"
                >
                  📋 CSV
                </button>
                <button
                  onClick={() => handleDownloadTemplate('excel')}
                  className="flex-1 px-3 py-2 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  📊 Excel
                </button>
              </div>
              <button
                onClick={() => setWoDeleteConfirmOpen(true)}
                disabled={woCount === 0}
                className="w-full px-3 py-2 text-[11px] font-bold bg-red-50 hover:bg-red-100 disabled:bg-slate-100 disabled:cursor-not-allowed text-red-600 border border-red-200 rounded-lg transition-all cursor-pointer"
              >
                🗑️ Hapus Semua Work Orders
              </button>
            </div>
          </div>

          {/* Info Note */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg">
            <AlertCircle size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-[9px] text-amber-700 dark:text-amber-300 leading-relaxed">
              <strong>Format Import:</strong> Title, Description, Location (wajib), Category, Priority, Classification, Job Category, Status (opsional). 
              Kategori valid: PERBAIKAN, PEMBUATAN, INSTALASI, MODIFIKASI, KESELAMATAN. 
              Priority: LOW, MEDIUM, HIGH.
            </p>
          </div>
        </div>

        {/* SEKSI B-3: Tools Admin - Import / Export / Delete All */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-950 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet size={14} className="text-cyan-600" />
              <span>Manajemen Tools (Import / Export)</span>
            </h3>
            <div className="flex items-center gap-2">
              {toolsLoading ? (
                <span className="text-[10px] text-slate-400">Memuat...</span>
              ) : (
                <span className="px-2.5 py-1 text-[10px] font-bold bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-lg">
                  {toolsCount} Tools
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Export Section */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <Download size={16} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Export Tools</h4>
                  <p className="text-[9px] text-slate-400">Download semua data tools ke CSV atau Excel</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExportTools('csv')}
                  disabled={toolsLoading || toolsCount === 0}
                  className="flex-1 px-3 py-2 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-md shadow-emerald-600/10 cursor-pointer"
                >
                  {toolsLoading ? '...' : '📥 CSV'}
                </button>
                <button
                  onClick={() => handleExportTools('excel')}
                  disabled={toolsLoading || toolsCount === 0}
                  className="flex-1 px-3 py-2 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-md shadow-blue-600/10 cursor-pointer"
                >
                  {toolsLoading ? '...' : '📊 Excel'}
                </button>
              </div>
            </div>

            {/* Import Section */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Upload size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Import Tools</h4>
                  <p className="text-[9px] text-slate-400">Upload data tools dari file CSV</p>
                </div>
              </div>
              <form onSubmit={handleImportTools} className="space-y-2">
                <input
                  id="toolsImportFileInput"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setToolsImportFile(e.target.files?.[0] || null)}
                  className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
                <button
                  type="submit"
                  disabled={toolsImportLoading || !toolsImportFile}
                  className="w-full px-3 py-2 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg transition-all shadow-md shadow-blue-600/10 cursor-pointer"
                >
                  {toolsImportLoading ? 'Mengimpor...' : '📤 Import CSV/Excel'}
                </button>
              </form>
            </div>

            {/* Template & Delete Section */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <FileSpreadsheet size={16} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Template & Hapus Semua</h4>
                  <p className="text-[9px] text-slate-400">Download template CSV/Excel</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownloadToolsTemplate('csv')}
                  className="flex-1 px-3 py-2 text-[10px] font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all shadow-md shadow-purple-600/10 cursor-pointer"
                >
                  📋 CSV
                </button>
                <button
                  onClick={() => handleDownloadToolsTemplate('excel')}
                  className="flex-1 px-3 py-2 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  📊 Excel
                </button>
              </div>
              <button
                onClick={() => setToolsDeleteConfirmOpen(true)}
                disabled={toolsCount === 0}
                className="w-full px-3 py-2 text-[11px] font-bold bg-red-50 hover:bg-red-100 disabled:bg-slate-100 disabled:cursor-not-allowed text-red-600 border border-red-200 rounded-lg transition-all cursor-pointer"
              >
                🗑️ Hapus Semua Tools
              </button>
            </div>
          </div>

          {/* Info Note */}
          <div className="flex items-start gap-2 p-3 bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900/50 rounded-lg">
            <AlertCircle size={14} className="text-cyan-600 dark:text-cyan-400 mt-0.5 shrink-0" />
            <p className="text-[9px] text-cyan-700 dark:text-cyan-300 leading-relaxed">
              <strong>Format Import:</strong> name, brand, stock, picUsername (wajib: name, stock). Format file: CSV atau Excel (.xlsx, .xls).
              Jika tool dengan nama yang sama sudah ada, akan diupdate datanya.
            </p>
          </div>
        </div>

          {/* SEKSI B-1b: Kelola Ruangan */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-950 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin size={14} className="text-orange-600" />
                <span>Kelola Ruangan / Lokasi</span>
              </h3>
              <div className="flex items-center gap-2">
                {roomsLoading ? (
                  <span className="text-[10px] text-slate-400">Memuat...</span>
                ) : (
                  <span className="px-2.5 py-1 text-[10px] font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg">
                    {rooms.length} Ruangan
                  </span>
                )}
              </div>
            </div>

            {/* Form Tambah Ruangan */}
            <form onSubmit={handleAddRoom} className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nama Ruangan</label>
                <input
                  type="text"
                  placeholder="Contoh: Gudang Utama, Workshop A..."
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-orange-500"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Lokasi (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Gedung 1, Lantai 2..."
                  value={newRoomLocation}
                  onChange={(e) => setNewRoomLocation(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-orange-500"
                />
              </div>
              <button
                type="submit"
                disabled={!newRoomName.trim()}
                className="px-3.5 h-8 text-[11px] font-bold bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg transition-all shadow-md shadow-orange-600/10 cursor-pointer shrink-0"
              >
                Tambah
              </button>
            </form>

            {/* Import & Export Buttons */}
            <div className="flex gap-2 items-center">
              <form onSubmit={handleImportRooms} className="flex gap-2 items-center flex-1">
                <input
                  id="roomsImportFileInput"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setRoomsImportFile(e.target.files?.[0] || null)}
                  className="flex-1 text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
                <button
                  type="submit"
                  disabled={roomsImportLoading || !roomsImportFile}
                  className="px-3 h-7 text-[10px] font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg transition-all cursor-pointer shrink-0"
                >
                  {roomsImportLoading ? '...' : '📥 Import'}
                </button>
              </form>
              <button
                onClick={handleExportRooms}
                disabled={rooms.length === 0}
                className="px-3 h-7 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg transition-all cursor-pointer shrink-0"
              >
                📊 Export
              </button>
            </div>

            {/* List Ruangan */}
            <div className="overflow-y-auto max-h-48 divide-y divide-slate-100 dark:divide-slate-800/80">
              {rooms.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2.5 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                    <MapPin size={12} className="text-orange-500" />
                    <span>{r.name}</span>
                    {r.description && <span className="text-[9px] text-slate-400">({r.description})</span>}
                    {r._count?.workOrders !== undefined && (
                      <span className="text-[9px] text-slate-400">— {r._count.workOrders} WO</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteRoom(r.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors p-1"
                    title="Hapus Ruangan"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {rooms.length === 0 && !roomsLoading && (
                <p className="text-[10px] text-slate-400 py-2">Belum ada ruangan yang terdaftar.</p>
              )}
            </div>
          </div>

          {/* SEKSI B-2: Pengaturan Maintenance (Placeholder) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-950 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <Settings size={14} className="text-blue-600" />
              <span>Pengaturan Preventive Maintenance</span>
            </h3>
          </div>
          <div className="text-xs text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 p-6 rounded-xl flex items-center justify-center">
            [Konfigurasi Template PM & SLA Work Order akan dimuat di sini]
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
                    <p className="text-[9px] text-slate-400 mt-0.5">Password default akun baru: <span className="font-bold">username + "123"</span></p>
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
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as 'ADMIN' | 'USER' | 'WAREHOUSE' | 'TECHNICIAN' | 'OPERATOR' | 'QC_ANALYST' })}
                    className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500 text-slate-600 dark:text-slate-300"
                    required
                  >
                    <option value="USER">USER (Operator Lapangan)</option>
                    <option value="TECHNICIAN">TECHNICIAN (Teknisi Maintenance)</option>
                    <option value="OPERATOR">OPERATOR (Operator Produksi)</option>
                    <option value="QC_ANALYST">QC_ANALYST (Analis QC)</option>
                    <option value="WAREHOUSE">WAREHOUSE (Petugas Gudang)</option>
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

        {/* MODAL DELETE ALL WORK ORDERS CONFIRMATION */}
        {woDeleteConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-2xl shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
                  <h3 className="text-sm font-bold text-red-700 dark:text-red-300">
                    Konfirmasi Hapus Semua Work Orders
                  </h3>
                </div>
                <button onClick={() => setWoDeleteConfirmOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl">
                  <p className="text-sm font-bold text-red-700 dark:text-red-300 mb-2">
                    ⚠️ PERHATIAN: Tindakan ini tidak dapat dibatalkan!
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
                    Anda akan menghapus <strong>{woCount} work order</strong> beserta semua data terkait, termasuk:
                  </p>
                  <ul className="mt-2 text-xs text-red-600 dark:text-red-400 list-disc list-inside space-y-1">
                    <li>Riwayat update work order</li>
                    <li>Part yang digunakan (work order parts)</li>
                    <li>Semua lampiran terkait</li>
                  </ul>
                </div>

                <p className="text-xs text-slate-500 text-center">
                  Apakah Anda yakin ingin melanjutkan?
                </p>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setWoDeleteConfirmOpen(false)}
                    className="px-4 h-9 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAllWorkOrders}
                    disabled={woDeleting}
                    className="px-4 h-9 text-xs font-semibold bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-all shadow-md shadow-red-600/10 shrink-0 cursor-pointer"
                  >
                    {woDeleting ? 'Menghapus...' : `Ya, Hapus ${woCount} Work Orders`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DELETE ALL TOOLS CONFIRMATION */}
        {toolsDeleteConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-2xl shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
                  <h3 className="text-sm font-bold text-red-700 dark:text-red-300">
                    Konfirmasi Hapus Semua Tools
                  </h3>
                </div>
                <button onClick={() => setToolsDeleteConfirmOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl">
                  <p className="text-sm font-bold text-red-700 dark:text-red-300 mb-2">
                    ⚠️ PERHATIAN: Tindakan ini tidak dapat dibatalkan!
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
                    Anda akan menghapus <strong>{toolsCount} tools</strong> beserta semua data terkait, termasuk:
                  </p>
                  <ul className="mt-2 text-xs text-red-600 dark:text-red-400 list-disc list-inside space-y-1">
                    <li>Riwayat peminjaman tools</li>
                    <li>Semua data tools</li>
                  </ul>
                </div>

                <p className="text-xs text-slate-500 text-center">
                  Apakah Anda yakin ingin melanjutkan?
                </p>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setToolsDeleteConfirmOpen(false)}
                    className="px-4 h-9 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAllTools}
                    disabled={toolsDeleting}
                    className="px-4 h-9 text-xs font-semibold bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-all shadow-md shadow-red-600/10 shrink-0 cursor-pointer"
                  >
                    {toolsDeleting ? 'Menghapus...' : `Ya, Hapus ${toolsCount} Tools`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
  );
}

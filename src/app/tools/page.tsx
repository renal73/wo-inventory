'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import MinimalVodafoneHero from '@/components/machines/MinimalVodafoneHero';
import { motion } from 'motion/react';
import { 
  Plus, Edit2, Trash2, HelpCircle, User as UserIcon, AlertTriangle, PlayCircle, BarChart3, Wrench, RefreshCw, CheckCircle2, XCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ToolsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'MASTER' | 'TRANSACTIONS'>('DASHBOARD');

  const [tools, setTools] = useState<any[]>([]);
  const [borrowRecords, setBorrowRecords] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Master Tool
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [formToolId, setFormToolId] = useState('');
  const [formData, setFormData] = useState({ name: '', brand: '', stock: 0, picId: '' });

  // Modal Peminjaman
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [selectedToolToBorrow, setSelectedToolToBorrow] = useState<any>(null);
  const [borrowQuantity, setBorrowQuantity] = useState(1);
  const [borrowNotes, setBorrowNotes] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resTools, resRecords, resUsers] = await Promise.all([
        fetch('/api/tools').then(r => r.json()),
        fetch('/api/tools/borrow').then(r => r.json()),
        fetch('/api/users').then(r => r.json())
      ]);
      setTools(Array.isArray(resTools) ? resTools : []);
      setBorrowRecords(Array.isArray(resRecords) ? resRecords : []);
      setUsers(Array.isArray(resUsers) ? resUsers : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveTool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formMode === 'ADD') {
        await fetch('/api/tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch(`/api/tools/${formToolId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      setFormModalOpen(false);
      fetchData();
    } catch (error) {
      alert('Terjadi kesalahan saat menyimpan tool');
    }
  };

  const handleDeleteTool = async (id: string) => {
    if (!confirm('Yakin ingin menghapus tool ini?')) return;
    try {
      await fetch(`/api/tools/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      alert('Terjadi kesalahan saat menghapus tool');
    }
  };

  const handleBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedToolToBorrow) return;
    try {
      await fetch('/api/tools/borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: selectedToolToBorrow.id,
          userId: user?.id,
          quantity: borrowQuantity,
          notes: borrowNotes
        })
      });
      setBorrowModalOpen(false);
      alert('Pengajuan peminjaman berhasil dikirim! Menunggu konfirmasi admin.');
      fetchData();
    } catch (error) {
      alert('Gagal mengajukan peminjaman.');
    }
  };

  const handleActionRecord = async (id: string, action: string) => {
    let confirmMsg = '';
    if (action === 'approve') confirmMsg = 'Setujui peminjaman ini?';
    if (action === 'reject') confirmMsg = 'Tolak peminjaman ini?';
    if (action === 'return') confirmMsg = 'Ajukan pengembalian tool ini?';
    if (action === 'confirm-return') confirmMsg = 'Konfirmasi bahwa tool telah diterima kembali?';

    if (!confirm(confirmMsg)) return;

    try {
      await fetch(`/api/tools/borrow/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      fetchData();
    } catch (error) {
      alert('Terjadi kesalahan saat memproses data.');
    }
  };

  // Dashboard calculations
  const totalTools = tools.length;
  const totalItems = tools.reduce((sum, t) => sum + t.stock, 0);
  const borrowedRecords = borrowRecords.filter(r => r.status === 'BORROWED');
  const itemsCurrentlyBorrowed = borrowedRecords.reduce((sum, r) => sum + r.quantity, 0);
  const pendingBorrows = borrowRecords.filter(r => r.status === 'PENDING_BORROW').length;
  const pendingReturns = borrowRecords.filter(r => r.status === 'PENDING_RETURN').length;

  const chartData = borrowRecords
    .filter(r => r.status === 'BORROWED' || r.status === 'PENDING_RETURN' || r.status === 'RETURNED')
    .reduce((acc: any[], record) => {
      const toolName = record.tool?.name || 'Unknown';
      const existing = acc.find(item => item.name === toolName);
      if (existing) {
        existing.dipinjam += record.quantity;
      } else {
        acc.push({ name: toolName, dipinjam: record.quantity });
      }
      return acc;
    }, [])
    .sort((a, b) => b.dipinjam - a.dipinjam)
    .slice(0, 5); // Top 5

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
      <MinimalVodafoneHero
        eyebrow="TOOLS"
        title="Data Tools & Peminjaman"
        subtitle="Kelola inventaris peralatan dan pantau sirkulasi peminjaman"
      />

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit mb-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('DASHBOARD')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
            activeTab === 'DASHBOARD'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 size={14} />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('MASTER')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
            activeTab === 'MASTER'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Wrench size={14} />
          Master Tools
        </button>
        <button
          onClick={() => setActiveTab('TRANSACTIONS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
            activeTab === 'TRANSACTIONS'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <RefreshCw size={14} />
          Transaksi & Approval
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="animate-spin text-blue-500" size={32} />
        </div>
      ) : (
        <>
          {/* TAB: DASHBOARD */}
          {activeTab === 'DASHBOARD' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Wrench size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Jenis Tool</p>
                      <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{totalTools}</h3>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                      <RefreshCw size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sedang Dipinjam</p>
                      <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{itemsCurrentlyBorrowed} <span className="text-sm font-medium text-slate-500">item</span></h3>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center justify-center shrink-0">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Pinjam</p>
                      <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{pendingBorrows}</h3>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Kembali</p>
                      <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{pendingReturns}</h3>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-6">Top 5 Tools Paling Sering Dipinjam</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <RechartsTooltip 
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="dipinjam" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB: MASTER TOOLS */}
          {activeTab === 'MASTER' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Daftar Peralatan (Tools)</h2>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setFormMode('ADD');
                      setFormData({ name: '', brand: '', stock: 0, picId: '' });
                      setFormModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                  >
                    <Plus size={14} /> Tambah Tool
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider">Nama Tool</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider">Merk</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider">Stok Tersedia</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider">PIC (Penanggung Jawab)</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {tools.map(tool => (
                      <tr key={tool.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{tool.name}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{tool.brand || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${tool.stock > 0 ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
                            {tool.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <UserIcon size={14} />
                            {tool.pic ? tool.pic.name : <span className="text-slate-400 italic">Belum ditentukan</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedToolToBorrow(tool);
                                setBorrowQuantity(1);
                                setBorrowNotes('');
                                setBorrowModalOpen(true);
                              }}
                              disabled={tool.stock <= 0}
                              className="px-3 py-1 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-xs font-bold transition-colors"
                            >
                              Pinjam
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => {
                                    setFormMode('EDIT');
                                    setFormToolId(tool.id);
                                    setFormData({ name: tool.name, brand: tool.brand || '', stock: tool.stock, picId: tool.picId || '' });
                                    setFormModalOpen(true);
                                  }}
                                  className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteTool(tool.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                                  title="Hapus"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {tools.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                          Belum ada data tool.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: TRANSACTIONS */}
          {activeTab === 'TRANSACTIONS' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Riwayat & Status Peminjaman</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider">Tgl Pinjam</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider">Peminjam</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider">Tool</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider">Qty</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 font-bold uppercase tracking-wider text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {borrowRecords.map(record => {
                      const isOwnRecord = record.userId === user?.id;
                      
                      let statusBadge = '';
                      switch (record.status) {
                        case 'PENDING_BORROW': statusBadge = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400'; break;
                        case 'BORROWED': statusBadge = 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400'; break;
                        case 'PENDING_RETURN': statusBadge = 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400'; break;
                        case 'RETURNED': statusBadge = 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'; break;
                        case 'REJECTED': statusBadge = 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'; break;
                      }

                      return (
                        <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                            {new Date(record.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                            {record.user?.name || 'Unknown'} {isOwnRecord && <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1 rounded ml-1">(Anda)</span>}
                          </td>
                          <td className="px-4 py-3 text-slate-800 dark:text-slate-200">
                            {record.tool?.name || 'Unknown Tool'}
                            {record.notes && <div className="text-[10px] text-slate-500 mt-0.5">Catatan: {record.notes}</div>}
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">{record.quantity}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${statusBadge}`}>
                              {record.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              {/* Action for ADMIN */}
                              {isAdmin && record.status === 'PENDING_BORROW' && (
                                <>
                                  <button onClick={() => handleActionRecord(record.id, 'approve')} className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-[10px] font-bold">Approve Pinjam</button>
                                  <button onClick={() => handleActionRecord(record.id, 'reject')} className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-[10px] font-bold">Tolak</button>
                                </>
                              )}
                              
                              {isAdmin && record.status === 'PENDING_RETURN' && (
                                <button onClick={() => handleActionRecord(record.id, 'confirm-return')} className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-[10px] font-bold">Konfirmasi Kembali</button>
                              )}

                              {/* Action for USER/Borrower */}
                              {(isOwnRecord || isAdmin) && record.status === 'BORROWED' && (
                                <button onClick={() => handleActionRecord(record.id, 'return')} className="px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-[10px] font-bold">Ajukan Kembali</button>
                              )}
                              
                              {record.status === 'RETURNED' || record.status === 'REJECTED' ? (
                                <span className="text-[10px] text-slate-400">Selesai</span>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {borrowRecords.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                          Belum ada riwayat transaksi peminjaman.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Add/Edit Tool (Admin) */}
      {formModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                {formMode === 'ADD' ? 'Tambah Tool Baru' : 'Edit Tool'}
              </h3>
              <button onClick={() => setFormModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveTool} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Nama Tool *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Merk</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={e => setFormData({...formData, brand: e.target.value})}
                  className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Stok Tersedia *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.stock}
                  onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})}
                  className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">PIC (Penanggung Jawab)</label>
                <select
                  value={formData.picId}
                  onChange={e => setFormData({...formData, picId: e.target.value})}
                  className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
                >
                  <option value="">-- Pilih PIC (Opsional) --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setFormModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pinjam Tool (Semua User) */}
      {borrowModalOpen && selectedToolToBorrow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800 bg-teal-50 dark:bg-teal-500/10">
              <h3 className="text-sm font-bold text-teal-800 dark:text-teal-400">
                Pengajuan Peminjaman Tool
              </h3>
              <button onClick={() => setBorrowModalOpen(false)} className="text-teal-500 hover:text-teal-700">
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleBorrow} className="p-4 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                <p className="text-xs text-slate-500 dark:text-slate-400">Tool yang dipinjam:</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedToolToBorrow.name}</p>
                <p className="text-[10px] text-slate-500 mt-1">Stok saat ini: {selectedToolToBorrow.stock}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Jumlah Pinjam *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedToolToBorrow.stock}
                  value={borrowQuantity}
                  onChange={e => setBorrowQuantity(parseInt(e.target.value))}
                  className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Catatan / Keperluan</label>
                <textarea
                  rows={3}
                  value={borrowNotes}
                  onChange={e => setBorrowNotes(e.target.value)}
                  placeholder="Misal: Untuk perbaikan mesin A..."
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-teal-500"
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setBorrowModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm">Ajukan Pinjaman</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

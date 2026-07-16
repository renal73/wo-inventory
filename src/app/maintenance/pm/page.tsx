'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import MinimalVodafoneHero from '@/components/machines/MinimalVodafoneHero';
import { Plus, Search, ClipboardList, ShieldAlert } from 'lucide-react';

export default function PMPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    equipmentName: '',
    description: '',
    classification: 'MECHANIC',
    frequency: 'MONTHLY',
    estimatedDuration: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/pm/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Failed to fetch PM templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/pm/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setFormOpen(false);
        setFormData({ name: '', equipmentName: '', description: '', classification: 'MECHANIC', frequency: 'MONTHLY', estimatedDuration: '' });
        fetchTemplates();
      } else {
        alert('Gagal membuat Template PM');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.equipmentName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-5">
      
      {/* Minimal Vodafone Hero Header */}
      <MinimalVodafoneHero
        eyebrow="Preventive Maintenance"
        title="Template PM Schedules"
        subtitle="Manajemen jadwal pemeliharaan preventif mesin dan utilitas"
        stats={[
          { value: templates.length, label: 'Templates' },
          { value: filteredTemplates.length, label: 'Filtered' },
        ]}
        action={isAdmin ? (
          <button
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 h-8 text-[10px] font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all cursor-pointer"
          >
            <Plus size={13} />
            <span>Template</span>
          </button>
        ) : undefined}
      />

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Cari Template atau Nama Mesin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Grid Templates */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Memuat data...</div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center flex flex-col items-center justify-center gap-3">
          <ShieldAlert className="h-12 w-12 text-slate-300 dark:text-slate-700" />
          <p className="text-slate-500">Tidak ada template PM ditemukan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <div key={template.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col">
                  <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1">{template.name}</h3>
                  <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <ClipboardList size={12} /> {template.equipmentName}
                  </span>
                </div>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2 py-1 rounded-md">
                  {template.classification}
                </span>
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 h-10">
                {template.description || 'Tidak ada deskripsi'}
              </p>
              
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Frekuensi</span>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{template.frequency}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Durasi Est.</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {template.estimatedDuration ? `${template.estimatedDuration} Menit` : '-'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Buat Template */}
      {formOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus size={18} className="text-emerald-500" />
                Buat Template PM Baru
              </h3>
              <button 
                onClick={() => setFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nama Template (Tugas PM)</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="Contoh: Inspeksi Motor Utama"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nama Mesin / Equipment</label>
                <input
                  type="text"
                  required
                  value={formData.equipmentName}
                  onChange={e => setFormData({...formData, equipmentName: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="Contoh: Mesin Boiler 01"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Klasifikasi</label>
                  <select
                    value={formData.classification}
                    onChange={e => setFormData({...formData, classification: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="ELECTRIC">Electric</option>
                    <option value="MECHANIC">Mechanic</option>
                    <option value="OTHER">Lain-lain</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Frekuensi PM</label>
                  <select
                    value={formData.frequency}
                    onChange={e => setFormData({...formData, frequency: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="DAILY">Harian (Daily)</option>
                    <option value="WEEKLY">Mingguan (Weekly)</option>
                    <option value="MONTHLY">Bulanan (Monthly)</option>
                    <option value="QUARTERLY">Kuartal (Quarterly)</option>
                    <option value="YEARLY">Tahunan (Yearly)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Estimasi Durasi (Menit)</label>
                <input
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={e => setFormData({...formData, estimatedDuration: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="Contoh: 120"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Deskripsi / Standar Pengerjaan</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm min-h-[80px] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="Langkah-langkah pemeliharaan preventif..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

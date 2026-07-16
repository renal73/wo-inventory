'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { 
  FileText, Download, Printer, Calendar, Filter, 
  ChevronDown, CheckCircle2, Clock, AlertTriangle,
  Wrench, TrendingUp, Loader2, Eye, Send, Mail
} from 'lucide-react';

interface Report {
  id: string;
  title: string;
  type: 'work_order' | 'technician' | 'inventory' | 'pm' | 'summary';
  period: string;
  generatedAt: string;
  status: 'ready' | 'generating' | 'pending';
  fileUrl?: string;
}

interface LaporanItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  lastGenerated?: string;
  formats: string[];
}

export default function LaporanPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('june_2026');
  const [showPreview, setShowPreview] = useState<string | null>(null);

  const laporanTypes: LaporanItem[] = [
    {
      id: 'wo_summary',
      name: 'Laporan Ringkasan Work Orders',
      description: 'Rekapitulasi semua WO per periode dengan status dan prioritas',
      icon: <Wrench size={20} className="text-[var(--accent)]" />,
      lastGenerated: '2026-06-25',
      formats: ['PDF', 'Excel', 'CSV'],
    },
    {
      id: 'technician_performance',
      name: 'Laporan Performa Teknisi',
      description: 'Detail pekerjaan setiap teknisi: WO selesai, waktu rata-rata, efisiensi',
      icon: <TrendingUp size={20} className="text-blue-600" />,
      lastGenerated: '2026-06-20',
      formats: ['PDF', 'Excel'],
    },
    {
      id: 'inventory_usage',
      name: 'Laporan Penggunaan Suku Cadang',
      description: 'Riwayat pengambilan part per WO dan total suku cadang',
      icon: <FileText size={20} className="text-emerald-600" />,
      lastGenerated: '2026-06-15',
      formats: ['PDF', 'Excel', 'CSV'],
    },
    {
      id: 'pm_compliance',
      name: 'Laporan Kepatuhan PM',
      description: 'Status Preventive Maintenance: terjadwal vs terlaksana vs missed',
      icon: <CheckCircle2 size={20} className="text-amber-600" />,
      lastGenerated: '2026-06-10',
      formats: ['PDF'],
    },
    {
      id: 'monthly_summary',
      name: 'Laporan Bulanan Manajemen',
      description: 'Executive summary: KPI, tren, insight, dan rekomendasi',
      icon: <Calendar size={20} className="text-purple-600" />,
      lastGenerated: '2026-06-01',
      formats: ['PDF', 'PPT'],
    },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleGenerate = async (reportId: string) => {
    setGenerating(reportId);
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setGenerating(null);
    alert(`Laporan berhasil di生成! File siap diunduh.`);
  };

  const handleDownload = (reportId: string, format: string) => {
    alert(`Mengunduh laporan ${reportId} format ${format}...`);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-[var(--bg-base)]">
      {/* Header */}
      <div 
        className="bg-white dark:bg-[var(--surface)] border-b border-[var(--border)] px-4 sm:px-6 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 max-w-[1600px] mx-auto">
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
              <FileText className="text-[var(--accent)] shrink-0" size={22} />
              Laporan & Export
            </h1>
            <p className="text-[11px] sm:text-xs font-medium text-[var(--text-secondary)] mt-0.5 uppercase tracking-wide">
              Generate & unduh laporan maintenance dalam berbagai format
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 text-[13px] font-medium bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value="june_2026">Juni 2026</option>
              <option value="may_2026">Mei 2026</option>
              <option value="april_2026">April 2026</option>
              <option value="q2_2026">Q2 2026</option>
              <option value="ytd_2026">Year to Date 2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
          </div>
        ) : (
          <div className="max-w-[1600px] mx-auto space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="flex items-center gap-3 p-4 bg-white dark:bg-[var(--surface)] rounded-2xl border border-[var(--border)] hover:shadow-lg hover:border-[var(--accent)] transition-all group">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--accent-glow)' }}>
                  <FileText size={20} style={{ color: 'var(--accent)' }} />
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-bold text-[var(--text-primary)]">Export Semua Data</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">Full backup Excel</p>
                </div>
              </button>
              
              <button className="flex items-center gap-3 p-4 bg-white dark:bg-[var(--surface)] rounded-2xl border border-[var(--border)] hover:shadow-lg hover:border-blue-400 transition-all group">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100">
                  <Mail size={20} className="text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-bold text-[var(--text-primary)]">Kirim ke Email</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">Auto-email laporan</p>
                </div>
              </button>
              
              <button className="flex items-center gap-3 p-4 bg-white dark:bg-[var(--surface)] rounded-2xl border border-[var(--border)] hover:shadow-lg hover:border-emerald-400 transition-all group">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-100">
                  <Printer size={20} className="text-emerald-600" />
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-bold text-[var(--text-primary)]">Print Langsung</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">Cetak tanpa simpan</p>
                </div>
              </button>
            </div>

            {/* Report List */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide">
                Pilih Laporan
              </h2>
              
              {laporanTypes.map((laporan) => (
                <div 
                  key={laporan.id}
                  className="bg-white dark:bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden hover:shadow-lg transition-all"
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-xl bg-[var(--bg-base)] flex items-center justify-center shrink-0">
                        {laporan.icon}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h3 className="text-[14px] font-bold text-[var(--text-primary)] tracking-tight">
                              {laporan.name}
                            </h3>
                            <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                              {laporan.description}
                            </p>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button 
                              onClick={() => setShowPreview(showPreview === laporan.id ? null : laporan.id)}
                              className="p-2 rounded-lg hover:bg-[var(--bg-base)] transition-colors text-[var(--text-muted)] hover:text-blue-600"
                              title="Preview"
                            >
                              <Eye size={18} />
                            </button>
                            <button 
                              onClick={() => handleGenerate(laporan.id)}
                              disabled={generating === laporan.id}
                              className="flex items-center gap-2 px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                              style={{ backgroundColor: 'var(--accent)' }}
                            >
                              {generating === laporan.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Download size={14} />
                              )}
                              {generating === laporan.id ? '生成中...' : 'Generate'}
                            </button>
                          </div>
                        </div>
                        
                        {/* Meta & Formats */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-[11px] text-[var(--text-muted)]">
                              Terakhir: {laporan.lastGenerated ? formatDate(laporan.lastGenerated) : 'Belum pernah'}
                            </span>
                            <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                              Format:
                            </span>
                            <div className="flex items-center gap-1.5">
                              {laporan.formats.map((format) => (
                                <button
                                  key={format}
                                  onClick={() => handleDownload(laporan.id, format)}
                                  className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-[var(--bg-base)] text-[var(--text-secondary)] rounded-md hover:bg-[var(--accent)] hover:text-white transition-colors"
                                >
                                  {format}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Preview Panel */}
                  {showPreview === laporan.id && (
                    <div className="px-5 pb-5 pt-0">
                      <div className="p-4 bg-[var(--bg-base)] rounded-xl border border-[var(--border)]">
                        <div className="flex items-center gap-2 mb-3">
                          <Eye size={14} className="text-blue-600" />
                          <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wide">
                            Preview Singkat
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-white rounded-lg p-3 border border-[var(--border)]">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Total WO</p>
                            <p className="text-xl font-extrabold text-[var(--text-primary)]">247</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-[var(--border)]">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Selesai</p>
                            <p className="text-xl font-extrabold text-emerald-600">198</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-[var(--border)]">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Dikerjakan</p>
                            <p className="text-xl font-extrabold text-blue-600">32</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-[var(--border)]">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Pending</p>
                            <p className="text-xl font-extrabold text-amber-600">17</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Recent Downloads */}
            <div className="bg-white dark:bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Clock size={16} className="text-[var(--accent)]" />
                Download Terakhir
              </h3>
              <div className="space-y-2">
                {[
                  { name: 'Laporan_WO_Juni_2026.pdf', date: '2026-06-25 14:30', size: '2.4 MB' },
                  { name: 'Performa_Teknisi_Mei.pdf', date: '2026-06-20 09:15', size: '1.8 MB' },
                  { name: 'Inventory_Usage_Q2.xlsx', date: '2026-06-15 16:45', size: '3.1 MB' },
                ].map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[var(--bg-base)] rounded-xl">
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-[var(--accent)]" />
                      <div>
                        <p className="text-[12px] font-medium text-[var(--text-primary)]">{file.name}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{file.date} · {file.size}</p>
                      </div>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-[var(--surface)] transition-colors text-[var(--text-muted)] hover:text-[var(--accent)]">
                      <Download size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import MinimalVodafoneHero from '@/components/machines/MinimalVodafoneHero';
import { motion } from 'motion/react';
import { api } from '@/lib/api';
import confetti from 'canvas-confetti';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Info, 
  CheckCircle, 
  AlertCircle, 
  Package, 
  Cog,
  ChevronRight,
  Plus
} from 'lucide-react';

export default function TransactionsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // State tab aktif: OUTBOUND (Barang Keluar) atau INBOUND (Barang Masuk)
  const [activeTab, setActiveTab] = useState<'OUTBOUND' | 'INBOUND'>('OUTBOUND');

  // Master data
  const [parts, setParts] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [purposes, setPurposes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State OUTBOUND
  const [outboundPartQuery, setOutboundPartQuery] = useState('');
  const [selectedOutboundPart, setSelectedOutboundPart] = useState<any>(null);
  const [outboundFocused, setOutboundFocused] = useState(false);
  const [outboundQty, setOutboundQty] = useState(1);
  const [selectedPurposeId, setSelectedPurposeId] = useState('');
  const [selectedMachineId, setSelectedMachineId] = useState('');
  
  // State INBOUND
  const [inboundPartQuery, setInboundPartQuery] = useState('');
  const [selectedInboundPart, setSelectedInboundPart] = useState<any>(null);
  const [inboundFocused, setInboundFocused] = useState(false);
  const [isNewPart, setIsNewPart] = useState(false); // ID baru terdeteksi
  const [inboundQty, setInboundQty] = useState(1);
  const [inboundPrice, setInboundPrice] = useState(0);
  const [inboundVendor, setInboundVendor] = useState('');
  
  // Form registrasi part baru inline (jika ID baru di Inbound)
  const [newPartForm, setNewPartForm] = useState({
    name: '',
    description: '',
    categoryId: '',
    minStockAlert: 5,
    rackLocation: ''
  });

  // Feedbacks
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [partsData, machinesData, purposesData, categoriesData] = await Promise.all([
        api.parts.list(),
        api.machines.list(),
        api.purposes.list(),
        api.categories.list()
      ]);
      setParts(partsData);
      setMachines(machinesData);
      setPurposes(purposesData.filter((p: any) => p.isActive));
      setCategories(categoriesData);

      // Default value
      if (purposesData.length > 0) setSelectedPurposeId(purposesData[0].id);
      if (categoriesData.length > 0) {
        setNewPartForm(prev => ({ ...prev, categoryId: categoriesData[0].id }));
      }
    } catch (err) {
      console.error('Gagal memuat data transaksi:', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger perayaan kustom saat sukses
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 }
    });
  };

  // Handler memilih part di tab Outbound
  const handleSelectOutboundPart = (part: any) => {
    setSelectedOutboundPart(part);
    setOutboundPartQuery(`[${part.id}] ${part.name}`);
    setError('');
  };

  // Handler memilih part di tab Inbound
  const handleSelectInboundPart = (part: any) => {
    setSelectedInboundPart(part);
    setInboundPartQuery(part.id);
    setInboundPrice(part.price);
    setInboundVendor(part.vendor || '');
    setIsNewPart(false);
    setError('');
  };

  // Handler mengetik ID part di tab Inbound (deteksi ID baru)
  const handleInboundQueryChange = (val: string) => {
    setInboundPartQuery(val);
    setError('');
    
    // Coba cari kecocokan persis
    const found = parts.find(p => p.id.toUpperCase() === val.toUpperCase().trim());
    if (found) {
      setSelectedInboundPart(found);
      setIsNewPart(false);
      setInboundPrice(found.price);
      setInboundVendor(found.vendor || '');
    } else {
      setSelectedInboundPart(null);
      setInboundPrice(0);
      setInboundVendor('');
      // Jika panjang string menyerupai ID (e.g. EL-004), aktifkan registrasi baru
      const idFormat = /^[A-Z]{2}-\d{3,4}$/;
      if (idFormat.test(val.toUpperCase().trim())) {
        setIsNewPart(true);
      } else {
        setIsNewPart(false);
      }
    }
  };

  // Submit Transaksi Keluar
  const handleOutboundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedOutboundPart) {
      setError('Pilih suku cadang terlebih dahulu dari daftar');
      return;
    }
    if (outboundQty <= 0) {
      setError('Jumlah keluar harus lebih dari 0');
      return;
    }
    if (outboundQty > selectedOutboundPart.stock) {
      setError(`Stok fisik tidak mencukupi. Stok saat ini: ${selectedOutboundPart.stock} unit.`);
      return;
    }

    try {
      setSubmitLoading(true);
      const res = await api.transactions.createOutbound({
        partId: selectedOutboundPart.id,
        quantity: outboundQty,
        purposeId: selectedPurposeId,
        machineId: selectedMachineId || null
      });

      if (res.success) {
        setSuccess(`Berhasil mencatat pengambilan ${outboundQty} unit "${selectedOutboundPart.name}". Stok dikurangi.`);
        triggerConfetti();
        
        // Reset form
        setSelectedOutboundPart(null);
        setOutboundPartQuery('');
        setOutboundQty(1);
        setSelectedMachineId('');
        
        // Reload data suku cadang
        loadData();
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mencatat transaksi keluar');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Submit Transaksi Masuk
  const handleInboundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const finalPartId = inboundPartQuery.toUpperCase().trim();
    if (!finalPartId) {
      setError('Part ID wajib diisi');
      return;
    }

    try {
      setSubmitLoading(true);

      // 1. Jika ID baru, daftarkan suku cadang dulu
      if (isNewPart) {
        if (!newPartForm.name) {
          setError('Untuk suku cadang baru, kolom nama suku cadang wajib diisi');
          setSubmitLoading(false);
          return;
        }

        await api.parts.create({
          id: finalPartId,
          name: newPartForm.name,
          description: newPartForm.description,
          categoryId: newPartForm.categoryId,
          minStockAlert: newPartForm.minStockAlert,
          rackLocation: newPartForm.rackLocation
        });
      }

      // 2. Kirim transaksi masuk
      const res = await api.transactions.createInbound({
        partId: finalPartId,
        quantity: inboundQty,
        price: inboundPrice,
        vendor: inboundVendor
      });

      if (res.success) {
        setSuccess(
          isNewPart 
            ? `Berhasil meregistrasikan suku cadang "${newPartForm.name}" dan mencatat stok masuk ${inboundQty} unit.`
            : `Berhasil menambahkan stok masuk sebanyak ${inboundQty} unit. Harga rata-rata tertimbang diperbarui.`
        );
        triggerConfetti();

        // Reset form
        setInboundPartQuery('');
        setSelectedInboundPart(null);
        setIsNewPart(false);
        setInboundQty(1);
        setInboundPrice(0);
        setInboundVendor('');
        setNewPartForm({
          name: '',
          description: '',
          categoryId: categories[0]?.id || '',
          minStockAlert: 5,
          rackLocation: ''
        });

        // Reload data
        loadData();
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memproses transaksi masuk');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Memfilter daftar part di tab Outbound berdasarkan ketikan user
  const filteredOutboundParts = parts.filter(
    p =>
      !outboundPartQuery ||
      p.id.toLowerCase().includes(outboundPartQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(outboundPartQuery.toLowerCase())
  );

  // Memfilter daftar part di tab Inbound berdasarkan ketikan user
  const filteredInboundParts = parts.filter(
    p =>
      !inboundPartQuery ||
      p.id.toLowerCase().includes(inboundPartQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(inboundPartQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full min-h-screen bg-slate-50">
      <MinimalVodafoneHero
        eyebrow="TRANSACTIONS"
        title="Pencatatan Aliran Barang"
        subtitle="Catat barang masuk (Inbound) dan ambil suku cadang (Outbound)"
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-bold bg-white dark:bg-slate-900 p-1.5 rounded-xl gap-2 w-fit">
          <button
            onClick={() => {
              setActiveTab('OUTBOUND');
              setError('');
              setSuccess('');
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'OUTBOUND'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/10'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight size={14} />
            <span>Barang Keluar (Outbound)</span>
          </button>
          
          {isAdmin && (
            <button
              onClick={() => {
                setActiveTab('INBOUND');
                setError('');
                setSuccess('');
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'INBOUND'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft size={14} />
              <span>Barang Masuk (Inbound)</span>
            </button>
          )}
        </div>

        {/* Feedback Alert */}
        {error && (
          <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-900/50">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
            <CheckCircle size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* ================= OUTBOUND TAB ================= */}
        {activeTab === 'OUTBOUND' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Form Pengambilan Barang */}
            <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <form onSubmit={handleOutboundSubmit} className="space-y-4">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4">
                  Form Pengambilan Suku Cadang
                </h3>

                {/* Pilih Part */}
                <div className="space-y-1.5 relative">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Cari & Pilih Suku Cadang <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Ketik ID / nama barang (Contoh: EL-001)..."
                      value={outboundPartQuery}
                      onChange={(e) => {
                        setOutboundPartQuery(e.target.value);
                        setSelectedOutboundPart(null);
                      }}
                      onFocus={() => setOutboundFocused(true)}
                      onBlur={() => setTimeout(() => setOutboundFocused(false), 200)}
                      className="w-full h-9 pl-9 pr-4 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Dropdown Hasil Pencarian Suku Cadang */}
                  {((outboundFocused || outboundPartQuery) && !selectedOutboundPart) && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-40 overflow-y-auto z-20 text-xs">
                      {filteredOutboundParts.length === 0 ? (
                        <p className="p-3 text-slate-400">Suku cadang tidak terdaftar.</p>
                      ) : (
                        filteredOutboundParts.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => handleSelectOutboundPart(p)}
                            className="px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex justify-between items-center"
                          >
                            <span className="font-bold text-slate-800 dark:text-slate-100">
                              [{p.id}] {p.name}
                            </span>
                            <span className={`font-semibold ${p.stock <= p.minStockAlert ? 'text-red-500' : 'text-slate-400'}`}>
                              Stok: {p.stock} unit
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Kuantitas Keluar */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Jumlah Barang Diambil <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={outboundQty}
                    onChange={(e) => setOutboundQty(Number(e.target.value))}
                    className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
                    required
                  />
                </div>

                {/* Tujuan Penggunaan */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Tujuan Penggunaan Suku Cadang <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedPurposeId}
                    onChange={(e) => setSelectedPurposeId(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500 text-slate-600 dark:text-slate-300"
                    required
                  >
                    {purposes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.purpose}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Mesin Produksi */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Dipasang pada Mesin (Opsional)
                  </label>
                  <select
                    value={selectedMachineId}
                    onChange={(e) => setSelectedMachineId(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500 text-slate-600 dark:text-slate-300"
                  >
                    <option value="">-- Tidak Terhubung ke Mesin --</option>
                    {machines.map((m) => (
                      <option key={m.id} value={m.id}>
                        [{m.id}] {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Submit button */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitLoading || !selectedOutboundPart}
                    className="px-5 h-10 text-xs font-bold bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg transition-all shadow-md shadow-orange-600/10 cursor-pointer"
                  >
                    {submitLoading ? 'Menyimpan...' : 'Ambil Suku Cadang'}
                  </button>
                </div>
              </form>
            </div>

            {/* Sidebar Preview Part Terpilih */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs h-fit space-y-4">
              <h3 className="text-xs font-bold text-slate-950 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 pb-3">
                Detail Suku Cadang Terpilih
              </h3>

              {selectedOutboundPart ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Part ID</span>
                    <p className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200 tracking-wider mt-0.5">
                      {selectedOutboundPart.id}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Nama</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedOutboundPart.name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Stok Tersedia</span>
                      <p className={`font-bold mt-0.5 ${
                        selectedOutboundPart.stock <= selectedOutboundPart.minStockAlert
                          ? 'text-red-500 animate-pulse'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}>
                        {selectedOutboundPart.stock} unit
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Min. Stock Alert</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedOutboundPart.minStockAlert} unit</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Lokasi Rak</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedOutboundPart.rackLocation || '-'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Harga Satuan</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(selectedOutboundPart.price)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 flex flex-col items-center justify-center p-6 text-center text-xs">
                  <Info size={24} className="mb-2 text-slate-300" />
                  Pilih suku cadang pada form pencarian untuk melihat data sisa stok di sini.
                </div>
              )}
            </div>

          </div>
        )}

        {/* ================= INBOUND TAB ================= */}
        {activeTab === 'INBOUND' && isAdmin && (
          <div className="space-y-6">
            
            {/* Form Inbound */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <form onSubmit={handleInboundSubmit} className="space-y-4">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4">
                  Form Penambahan Stok / Inbound
                </h3>

                {/* Input Part ID dengan Autodetect */}
                <div className="space-y-1.5 relative">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Part ID / Cari Suku Cadang <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Masukkan Part ID / Nama (e.g. EL-001 atau masukkan ID baru e.g. EL-004)..."
                      value={inboundPartQuery}
                      onChange={(e) => handleInboundQueryChange(e.target.value)}
                      onFocus={() => setInboundFocused(true)}
                      onBlur={() => setTimeout(() => setInboundFocused(false), 200)}
                      className="w-full h-9 pl-9 pr-4 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500 uppercase font-mono tracking-wider"
                      required
                    />
                  </div>

                  {/* Dropdown Hasil Pencarian Suku Cadang (Inbound) */}
                  {((inboundFocused || inboundPartQuery) && !selectedInboundPart) && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-40 overflow-y-auto z-20 text-xs">
                      {filteredInboundParts.length === 0 ? (
                        <p className="p-3 text-slate-400">Suku cadang tidak terdaftar. Ketik format ID baru (e.g., EL-004) untuk meregistrasikan.</p>
                      ) : (
                        filteredInboundParts.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => handleSelectInboundPart(p)}
                            className="px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex justify-between items-center"
                          >
                            <span className="font-bold text-slate-800 dark:text-slate-100">
                              [{p.id}] {p.name}
                            </span>
                            <span className="font-semibold text-slate-400">
                              Stok: {p.stock} unit
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Feedback deteksi suku cadang */}
                  {inboundPartQuery && (
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold">
                      {selectedInboundPart ? (
                        <span className="text-emerald-600 flex items-center gap-0.5">
                          ✓ Suku Cadang Terdaftar: &quot;{selectedInboundPart.name}&quot; (Stok saat ini: {selectedInboundPart.stock} unit)
                        </span>
                      ) : isNewPart ? (
                        <span className="text-blue-600 flex items-center gap-0.5">
                          ✦ Part ID Baru Terdeteksi. Daftarkan detail suku cadang pada form di bawah.
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          Masukkan format Part ID yang valid (e.g., EL-004) untuk mendaftarkan barang baru.
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Form registrasi inline untuk Part Baru */}
                {isNewPart && (
                  <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/20 space-y-4">
                    <h4 className="text-[10px] font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1 border-b border-blue-200/50 pb-2">
                      <Plus size={12} />
                      Detail Registrasi Suku Cadang Baru
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Nama Suku Cadang */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Nama Suku Cadang <span className="text-blue-600">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Masukkan nama suku cadang baru..."
                          value={newPartForm.name}
                          onChange={(e) => setNewPartForm({ ...newPartForm, name: e.target.value })}
                          className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
                          required={isNewPart}
                        />
                      </div>

                      {/* Kategori */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Kategori <span className="text-blue-600">*</span>
                        </label>
                        <select
                          value={newPartForm.categoryId}
                          onChange={(e) => setNewPartForm({ ...newPartForm, categoryId: e.target.value })}
                          className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500 text-slate-600 dark:text-slate-300"
                          required={isNewPart}
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Lokasi Rak */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Lokasi Rak Gudang
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Rak A-04"
                          value={newPartForm.rackLocation}
                          onChange={(e) => setNewPartForm({ ...newPartForm, rackLocation: e.target.value })}
                          className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
                        />
                      </div>

                      {/* Min Stock Alert */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Batas Minimum Alert
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={newPartForm.minStockAlert}
                          onChange={(e) => setNewPartForm({ ...newPartForm, minStockAlert: Number(e.target.value) })}
                          className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
                          required={isNewPart}
                        />
                      </div>
                    </div>

                    {/* Deskripsi */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Deskripsi Teknis (Opsional)
                      </label>
                      <textarea
                        placeholder="Detail spesifikasi..."
                        value={newPartForm.description}
                        onChange={(e) => setNewPartForm({ ...newPartForm, description: e.target.value })}
                        className="w-full p-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500 h-16 resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Input Transaksi Masuk */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Jumlah Masuk */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Jumlah Unit Masuk <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={inboundQty}
                      onChange={(e) => setInboundQty(Number(e.target.value))}
                      className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Harga Beli Satuan */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Harga Beli Satuan (Rp) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={inboundPrice}
                      onChange={(e) => setInboundPrice(Number(e.target.value))}
                      className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Vendor / Supplier */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Vendor / Supplier Pemasok <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Masukkan nama vendor..."
                      value={inboundVendor}
                      onChange={(e) => setInboundVendor(e.target.value)}
                      className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitLoading || !inboundPartQuery}
                    className="px-5 h-10 text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-all shadow-md shadow-blue-600/10 cursor-pointer"
                  >
                    {submitLoading ? 'Menyimpan...' : 'Catat Barang Masuk'}
                  </button>
                </div>
              </form>
            </div>

            {/* Catatan Perhitungan Weighted Average */}
            <div className="bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/60 rounded-xl p-4 text-[10px] text-slate-500 leading-relaxed">
              <p className="font-bold uppercase tracking-wider mb-1 text-slate-600">Info Formula Weighted Average Cost (WAC):</p>
              Perhitungan harga satuan suku cadang menggunakan formula rata-rata tertimbang: <code className="font-mono bg-white dark:bg-slate-800 px-1 border border-slate-200 dark:border-slate-700 rounded-sm">((Stok Lama * Harga Lama) + (Qty Baru * Harga Baru)) / (Stok Lama + Qty Baru)</code>. 
              Formula ini memastikan valuasi aset inventaris tetap akurat dan mutakhir seiring dengan fluktuasi harga pembelian suku cadang dari vendor yang berbeda-beda.
            </div>

          </div>
        )}

        </div>
        </div>
      </div>
  );
}

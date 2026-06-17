'use client';

import React from 'react';
import Link from 'next/link';
import { Edit2, Trash2, ShieldAlert, CheckCircle, AlertTriangle, MapPin } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export interface AssignedPart {
  id: string; // mp-id
  partId: string;
  name: string;
  stock: number;
  recommendedMinQty: number;
  partType: 'ELECTRICAL' | 'MECHANICAL';
  notes?: string | null;
  status: 'OK' | 'WARNING' | 'CRITICAL';
  rackLocation: string;
}

interface MachinePartTableProps {
  parts: AssignedPart[];
  onEdit: (part: AssignedPart) => void;
  onUnassign: (partId: string) => void;
}

export function MachinePartTable({ parts, onEdit, onUnassign }: MachinePartTableProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  if (parts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500">
        <p className="text-xs font-semibold">Belum ada suku cadang terdaftar dalam kategori ini.</p>
        {isAdmin && (
          <p className="text-[10px] text-slate-400 mt-1">
            Klik tombol di bawah untuk menambahkan suku cadang.
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Tampilan Desktop (Tabel) */}
      <div className="hidden md:block overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
              <th className="p-4">Part ID</th>
              <th className="p-4">Nama Suku Cadang</th>
              <th className="p-4">Lokasi Rak</th>
              <th className="p-4 text-center">Stok Fisik</th>
              <th className="p-4 text-center">Rekomendasi Min.</th>
              <th className="p-4 text-center">Status</th>
              {isAdmin && <th className="p-4 text-center">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {parts.map((p) => {
              return (
                <tr key={p.partId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  {/* Part ID clickable */}
                  <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                    <Link href={`/inventory?search=${p.partId}`} className="hover:underline">
                      {p.partId}
                    </Link>
                  </td>
                  
                  {/* Nama Part & Notes */}
                  <td className="p-4">
                    <div className="font-bold text-slate-800 dark:text-slate-100">{p.name}</div>
                    {p.notes && (
                      <div className="text-[10px] text-slate-400 italic mt-0.5 max-w-[250px] truncate" title={p.notes}>
                        Catatan: {p.notes}
                      </div>
                    )}
                  </td>

                  {/* Lokasi Rak */}
                  <td className="p-4 text-slate-500 dark:text-slate-400 font-medium">
                    {p.rackLocation}
                  </td>

                  {/* Stok Fisik */}
                  <td className="p-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                    {p.stock} unit
                  </td>

                  {/* Rekomendasi Min */}
                  <td className="p-4 text-center font-semibold text-slate-500 dark:text-slate-400">
                    {p.recommendedMinQty} unit
                  </td>

                  {/* Status Badge */}
                  <td className="p-4 text-center">
                    <div className="inline-flex justify-center w-full">
                      {p.status === 'OK' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                          <CheckCircle size={10} />
                          Cukup
                        </span>
                      )}
                      {p.status === 'WARNING' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                          <AlertTriangle size={10} />
                          Menipis
                        </span>
                      )}
                      {p.status === 'CRITICAL' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 animate-pulse">
                          <ShieldAlert size={10} />
                          Kritis
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Aksi Edit/Delete (Admin only) */}
                  {isAdmin && (
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onEdit(p)}
                          title="Edit Rekomendasi"
                          className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => onUnassign(p.partId)}
                          title="Lepas Suku Cadang"
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Tampilan Seluler (Kartu/Card View) */}
      <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
        {parts.map((p) => {
          return (
            <div key={p.partId} className="p-4 space-y-3">
              {/* Baris Pertama: Part ID & Status */}
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400 tracking-wider hover:underline">
                  <Link href={`/inventory?search=${p.partId}`}>
                    {p.partId}
                  </Link>
                </span>
                
                <div>
                  {p.status === 'OK' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                      <CheckCircle size={10} />
                      Cukup
                    </span>
                  )}
                  {p.status === 'WARNING' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                      <AlertTriangle size={10} />
                      Menipis
                    </span>
                  )}
                  {p.status === 'CRITICAL' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 animate-pulse">
                      <ShieldAlert size={10} />
                      Kritis
                    </span>
                  )}
                </div>
              </div>

              {/* Baris Kedua: Nama & Catatan */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{p.name}</h4>
                {p.notes && (
                  <p className="text-[10px] text-slate-400 mt-1 italic leading-normal">
                    Catatan: {p.notes}
                  </p>
                )}
              </div>

              {/* Baris Ketiga: Lokasi Rak & Stok */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                <div className="space-y-0.5">
                  <span className="text-slate-400 block">Lokasi Rak:</span>
                  <span className="text-slate-700 dark:text-slate-300 flex items-center gap-0.5">
                    <MapPin size={10} className="text-slate-400 shrink-0" />
                    {p.rackLocation}
                  </span>
                </div>
                <div className="space-y-0.5 text-center">
                  <span className="text-slate-400 block">Stok Fisik:</span>
                  <span className="text-slate-700 dark:text-slate-300 block">{p.stock} unit</span>
                </div>
                <div className="space-y-0.5 text-right">
                  <span className="text-slate-400 block">Rek. Min:</span>
                  <span className="text-slate-700 dark:text-slate-300 block">{p.recommendedMinQty} unit</span>
                </div>
              </div>

              {/* Baris Keempat: Aksi Admin */}
              {isAdmin && (
                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={() => onEdit(p)}
                    title="Edit Rekomendasi"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 rounded-md transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    <Edit2 size={10} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => onUnassign(p.partId)}
                    title="Lepas Suku Cadang"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold bg-red-50 dark:bg-red-950/20 hover:bg-red-100/50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 rounded-md transition-colors cursor-pointer border border-red-200 dark:border-red-900/50"
                  >
                    <Trash2 size={10} />
                    <span>Lepas</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
export default MachinePartTable;

import fs from 'fs';
import path from 'path';

// Definisikan tipe data sesuai dengan PRD & Design Doc
export interface User {
  id: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'USER' | 'WAREHOUSE';
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string | null;
  createdAt: string;
}

export interface UsagePurpose {
  id: string;
  purpose: string;
  isActive: boolean;
  createdAt: string;
}

export interface Machine {
  id: string; // MCH-000
  name: string;
  description?: string | null;
  area?: string | null;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface MachinePart {
  id: string;
  machineId: string;
  partId: string;
  partType: 'ELECTRICAL' | 'MECHANICAL';
  recommendedMinQty: number;
  notes?: string | null;
  assignedAt: string;
}

export interface Part {
  id: string; // XX-000
  name: string;
  description?: string | null;
  categoryId: string;
  stock: number;
  minStockAlert: number;
  price: number; // Harga rata-rata tertimbang (weighted average)
  rackLocation?: string | null;
  vendor?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InboundTransaction {
  id: string;
  partId: string;
  quantity: number;
  price: number;
  vendor: string;
  createdBy: string; // userId
  date: string;
}

export interface OutboundTransaction {
  id: string;
  partId: string;
  quantity: number;
  purposeId: string;
  machineId?: string | null;
  createdBy: string; // userId
  date: string;
}

export interface DatabaseSchema {
  users: User[];
  categories: Category[];
  usagePurposes: UsagePurpose[];
  machines: Machine[];
  machineParts: MachinePart[];
  parts: Part[];
  inboundTransactions: InboundTransaction[];
  outboundTransactions: OutboundTransaction[];
}

const DB_FILE = path.join(process.cwd(), 'db.json');

// Data Awal untuk Seeding (Dummy Data Lengkap)
const SEED_DATA: DatabaseSchema = {
  users: [
    {
      id: 'usr-admin',
      username: 'admin',
      name: 'Supervisor Engineering',
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'usr-user',
      username: 'user',
      name: 'Teknisi Lapangan',
      role: 'USER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ],
  categories: [
    { id: 'cat-elec', name: 'Elektrik', icon: 'Zap', createdAt: new Date().toISOString() },
    { id: 'cat-mech', name: 'Mekanik', icon: 'Wrench', createdAt: new Date().toISOString() },
    { id: 'cat-instr', name: 'Instrumentasi', icon: 'Cpu', createdAt: new Date().toISOString() }
  ],
  usagePurposes: [
    { id: 'pur-pm', purpose: 'Preventive Maintenance (PM)', isActive: true, createdAt: new Date().toISOString() },
    { id: 'pur-bd', purpose: 'Breakdown', isActive: true, createdAt: new Date().toISOString() },
    { id: 'pur-mod', purpose: 'Modifikasi', isActive: true, createdAt: new Date().toISOString() },
    { id: 'pur-oh', purpose: 'Overhaul', isActive: true, createdAt: new Date().toISOString() }
  ],
  machines: [
    {
      id: 'MCH-001',
      name: 'Mesin Tablet Coating',
      description: 'Mesin coating tablet kapasitas 200kg/batch',
      area: 'Produksi Lantai 1',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'MCH-002',
      name: 'Mixing Tank',
      description: 'Tangki pencampur bahan baku cair',
      area: 'Produksi Lantai 1',
      status: 'MAINTENANCE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'MCH-003',
      name: 'Kompresor Udara',
      description: 'Kompresor penyuplai udara bertekanan',
      area: 'Utility',
      status: 'INACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ],
  parts: [
    {
      id: 'EL-001',
      name: 'Motor AC 5.5kW',
      description: 'Motor blower pengering utama',
      categoryId: 'cat-elec',
      stock: 8,
      minStockAlert: 3,
      price: 8500000,
      rackLocation: 'Rak A-01',
      vendor: 'PT Siemens Indonesia',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'EL-002',
      name: 'Inverter Omron 3.7kW',
      description: 'Drive blower pengatur RPM motor',
      categoryId: 'cat-elec',
      stock: 2,
      minStockAlert: 3, // Kritis (stok 2 <= minStockAlert 3)
      price: 4200000,
      rackLocation: 'Rak A-02',
      vendor: 'Omron Indonesia',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'EL-003',
      name: 'Kontaktor Schneider 25A',
      description: 'Kontaktor heater suhu pemanas',
      categoryId: 'cat-elec',
      stock: 1,
      minStockAlert: 2, // Kritis (stok 1 <= minStockAlert 2)
      price: 350000,
      rackLocation: 'Rak A-03',
      vendor: 'Schneider Electric',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'ME-001',
      name: 'V-Belt B52',
      description: 'Belt transmisi utama belt drive',
      categoryId: 'cat-mech',
      stock: 3,
      minStockAlert: 5, // Kritis (stok 3 <= minStockAlert 5)
      price: 85000,
      rackLocation: 'Rak B-01',
      vendor: 'Mitsuboshi',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'ME-002',
      name: 'Bearing SKF 6204',
      description: 'Bearing untuk poros mixer',
      categoryId: 'cat-mech',
      stock: 15,
      minStockAlert: 10,
      price: 120000,
      rackLocation: 'Rak B-02',
      vendor: 'SKF Bearings',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ],
  machineParts: [
    {
      id: 'mp-1',
      machineId: 'MCH-001',
      partId: 'EL-001',
      partType: 'ELECTRICAL',
      recommendedMinQty: 2,
      notes: 'Motor utama blower',
      assignedAt: new Date().toISOString()
    },
    {
      id: 'mp-2',
      machineId: 'MCH-001',
      partId: 'EL-002',
      partType: 'ELECTRICAL',
      recommendedMinQty: 1,
      notes: 'Drive blower',
      assignedAt: new Date().toISOString()
    },
    {
      id: 'mp-3',
      machineId: 'MCH-001',
      partId: 'EL-003',
      partType: 'ELECTRICAL',
      recommendedMinQty: 2,
      notes: 'Kontaktor heater',
      assignedAt: new Date().toISOString()
    },
    {
      id: 'mp-4',
      machineId: 'MCH-001',
      partId: 'ME-001',
      partType: 'MECHANICAL',
      recommendedMinQty: 2,
      notes: 'Belt transmisi utama',
      assignedAt: new Date().toISOString()
    },
    {
      id: 'mp-5',
      machineId: 'MCH-002',
      partId: 'EL-001',
      partType: 'ELECTRICAL',
      recommendedMinQty: 1,
      notes: 'Motor agitator tanki',
      assignedAt: new Date().toISOString()
    },
    {
      id: 'mp-6',
      machineId: 'MCH-002',
      partId: 'ME-002',
      partType: 'MECHANICAL',
      recommendedMinQty: 4,
      notes: 'Bearing poros agitator',
      assignedAt: new Date().toISOString()
    }
  ],
  inboundTransactions: [
    {
      id: 'tr-in-1',
      partId: 'EL-001',
      quantity: 5,
      price: 8500000,
      vendor: 'PT Siemens Indonesia',
      createdBy: 'usr-admin',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 hari lalu
    },
    {
      id: 'tr-in-2',
      partId: 'ME-002',
      quantity: 10,
      price: 120000,
      vendor: 'SKF Bearings',
      createdBy: 'usr-admin',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 hari lalu
    }
  ],
  outboundTransactions: [
    {
      id: 'tr-out-1',
      partId: 'EL-003',
      quantity: 1,
      purposeId: 'pur-bd',
      machineId: 'MCH-001',
      createdBy: 'usr-user',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 hari lalu
    },
    {
      id: 'tr-out-2',
      partId: 'ME-001',
      quantity: 2,
      purposeId: 'pur-pm',
      machineId: 'MCH-001',
      createdBy: 'usr-user',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 hari lalu
    }
  ]
};

// Fungsi membaca file database mock
export function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      writeDb(SEED_DATA);
      return SEED_DATA;
    }
    const rawData = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Gagal membaca database mock:', error);
    return SEED_DATA;
  }
}

// Fungsi menulis ke file database mock
export function writeDb(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Gagal menulis ke database mock:', error);
  }
}

// Fungsi reset database ke data bawaan (seeding)
export function resetDb(): DatabaseSchema {
  writeDb(SEED_DATA);
  return SEED_DATA;
}

// Fungsi hapus data (kosongkan semua transaksi & relasi, reset stok barang)
export function clearDb(): DatabaseSchema {
  const db = readDb();
  db.parts = db.parts.map(p => ({ ...p, stock: 0 }));
  db.machineParts = [];
  db.inboundTransactions = [];
  db.outboundTransactions = [];
  writeDb(db);
  return db;
}

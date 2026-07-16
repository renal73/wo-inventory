import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clearType = searchParams.get('clear');

    if (clearType === 'parts' || clearType === 'true') {
      await prisma.$transaction(async (tx) => {
        // Hapus transaksi & relasi
        await tx.outboundTransaction.deleteMany();
        await tx.inboundTransaction.deleteMany();
        await tx.machinePart.deleteMany();
        
        // Hapus seluruh data barang sampai kosong
        await tx.part.deleteMany();
      });

      return NextResponse.json({
        success: true,
        message: 'Data Barang (Suku Cadang) beserta log transaksi berhasil dikosongkan.'
      });
    } else if (clearType === 'machines') {
      await prisma.$transaction(async (tx) => {
        // Putuskan relasi transaksi dari mesin (hindari error foreign key)
        await tx.outboundTransaction.updateMany({
          data: { machineId: null }
        });
        
        // Hapus relasi pemetaan part dan data mesin
        await tx.machinePart.deleteMany();
        await tx.machine.deleteMany();
      });

      return NextResponse.json({
        success: true,
        message: 'Data Mesin Produksi berhasil dikosongkan.'
      });
    } else {
      // Reset database ke data bawaan (seeding)
      await prisma.$transaction(async (tx) => {
        // 1. Bersihkan database terlebih dahulu (Clean Up)
        await tx.outboundTransaction.deleteMany();
        await tx.inboundTransaction.deleteMany();
        await tx.machinePart.deleteMany();
        await tx.part.deleteMany();
        await tx.machine.deleteMany();
        await tx.usagePurpose.deleteMany();
        await tx.category.deleteMany();
        await tx.user.deleteMany();

        // 2. Seeding Users
        const adminHash = bcrypt.hashSync('admin123', 10);
        const userHash = bcrypt.hashSync('user123', 10);

        await tx.user.createMany({
          data: [
            {
              id: 'usr-admin',
              username: 'admin',
              name: 'Supervisor Engineering',
              passwordHash: adminHash,
              role: 'ADMIN'
            },
            {
              id: 'usr-user',
              username: 'user',
              name: 'Teknisi Lapangan',
              passwordHash: userHash,
              role: 'USER'
            }
          ]
        });

        // 3. Seeding Kategori
        await tx.category.createMany({
          data: [
            { id: 'cat-elec', name: 'Elektrik', icon: 'Zap' },
            { id: 'cat-mech', name: 'Mekanik', icon: 'Wrench' },
            { id: 'cat-instr', name: 'Instrumentasi', icon: 'Cpu' }
          ]
        });

        // 4. Seeding Tujuan Penggunaan
        await tx.usagePurpose.createMany({
          data: [
            { id: 'pur-pm', purpose: 'Preventive Maintenance (PM)', isActive: true },
            { id: 'pur-bd', purpose: 'Breakdown', isActive: true },
            { id: 'pur-mod', purpose: 'Modifikasi', isActive: true },
            { id: 'pur-oh', purpose: 'Overhaul', isActive: true }
          ]
        });

        // 5. Seeding Mesin
        await tx.machine.createMany({
          data: [
            {
              id: 'MCH-001',
              name: 'Mesin Tablet Coating',
              description: 'Mesin coating tablet kapasitas 200kg/batch',
              area: 'Produksi Lantai 1',
              status: 'ACTIVE'
            },
            {
              id: 'MCH-002',
              name: 'Mixing Tank',
              description: 'Tangki pencampur bahan baku cair',
              area: 'Produksi Lantai 1',
              status: 'MAINTENANCE'
            },
            {
              id: 'MCH-003',
              name: 'Kompresor Udara',
              description: 'Kompresor penyuplai udara bertekanan',
              area: 'Utility',
              status: 'INACTIVE'
            }
          ]
        });

        // 6. Seeding Suku Cadang
        await tx.part.createMany({
          data: [
            {
              id: 'EL-001',
              name: 'Motor AC 5.5kW',
              description: 'Motor blower pengering utama',
              categoryId: 'cat-elec',
              stock: 8,
              minStockAlert: 3,
              price: 8500000,
              rackLocation: 'Rak A-01',
              vendor: 'PT Siemens Indonesia'
            },
            {
              id: 'EL-002',
              name: 'Inverter Omron 3.7kW',
              description: 'Drive blower pengatur RPM motor',
              categoryId: 'cat-elec',
              stock: 2,
              minStockAlert: 3,
              price: 4200000,
              rackLocation: 'Rak A-02',
              vendor: 'Omron Indonesia'
            },
            {
              id: 'EL-003',
              name: 'Kontaktor Schneider 25A',
              description: 'Kontaktor heater suhu pemanas',
              categoryId: 'cat-elec',
              stock: 1,
              minStockAlert: 2,
              price: 350000,
              rackLocation: 'Rak A-03',
              vendor: 'Schneider Electric'
            },
            {
              id: 'ME-001',
              name: 'V-Belt B52',
              description: 'Belt transmisi utama belt drive',
              categoryId: 'cat-mech',
              stock: 3,
              minStockAlert: 5,
              price: 85000,
              rackLocation: 'Rak B-01',
              vendor: 'Mitsuboshi'
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
              vendor: 'SKF Bearings'
            }
          ]
        });

        // 7. Seeding MachinePart Hubungan
        await tx.machinePart.createMany({
          data: [
            {
              id: 'mp-1',
              machineId: 'MCH-001',
              partId: 'EL-001',
              partType: 'ELECTRICAL',
              recommendedMinQty: 2,
              notes: 'Motor utama blower'
            },
            {
              id: 'mp-2',
              machineId: 'MCH-001',
              partId: 'EL-002',
              partType: 'ELECTRICAL',
              recommendedMinQty: 1,
              notes: 'Drive blower'
            },
            {
              id: 'mp-3',
              machineId: 'MCH-001',
              partId: 'EL-003',
              partType: 'ELECTRICAL',
              recommendedMinQty: 2,
              notes: 'Kontaktor heater'
            },
            {
              id: 'mp-4',
              machineId: 'MCH-001',
              partId: 'ME-001',
              partType: 'MECHANICAL',
              recommendedMinQty: 2,
              notes: 'Belt transmisi utama'
            },
            {
              id: 'mp-5',
              machineId: 'MCH-002',
              partId: 'EL-001',
              partType: 'ELECTRICAL',
              recommendedMinQty: 1,
              notes: 'Motor agitator tanki'
            },
            {
              id: 'mp-6',
              machineId: 'MCH-002',
              partId: 'ME-002',
              partType: 'MECHANICAL',
              recommendedMinQty: 4,
              notes: 'Bearing poros agitator'
            }
          ]
        });

        // 8. Seeding Transaksi Inbound
        await tx.inboundTransaction.createMany({
          data: [
            {
              id: 'tr-in-1',
              partId: 'EL-001',
              quantity: 5,
              price: 8500000,
              vendor: 'PT Siemens Indonesia',
              createdBy: 'usr-admin',
              date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            },
            {
              id: 'tr-in-2',
              partId: 'ME-002',
              quantity: 10,
              price: 120000,
              vendor: 'SKF Bearings',
              createdBy: 'usr-admin',
              date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            }
          ]
        });

        // 9. Seeding Transaksi Outbound
        await tx.outboundTransaction.createMany({
          data: [
            {
              id: 'tr-out-1',
              partId: 'EL-003',
              quantity: 1,
              purposeId: 'pur-bd',
              machineId: 'MCH-001',
              createdBy: 'usr-user',
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
            },
            {
              id: 'tr-out-2',
              partId: 'ME-001',
              quantity: 2,
              purposeId: 'pur-pm',
              machineId: 'MCH-001',
              createdBy: 'usr-user',
              date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            }
          ]
        });
      });

      return NextResponse.json({
        success: true,
        message: 'Database berhasil di-reset ke data bawaan awal (seed data).'
      });
    }
  } catch (error) {
    console.error('Error POST /api/seed:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memproses database' },
      { status: 500 }
    );
  }
}

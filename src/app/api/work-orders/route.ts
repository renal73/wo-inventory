import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { createNotificationsForRoles } from '@/lib/notifications';

async function getUserSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie?.value) return null;
  try {
    const payloadJson = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}

// SLA overdue adalah 30 hari setelah penugasan (dalam milidetik)
const SLA_LIMIT = 30 * 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let whereClause: any = {};

    // Operator/QC hanya bisa lihat WO miliknya sendiri
    if (user.role === 'USER' || user.role === 'OPERATOR' || user.role === 'QC_ANALYST') {
      whereClause.requestedById = user.id;
    }

    // Teknisi hanya lihat WO yang di-assign ke dia, atau semua untuk Admin
    if (user.role === 'TECHNICIAN') {
      whereClause.assignedToIds = { has: user.id };
    }

    if (status) {
      whereClause.status = status;
    }

    const workOrders = await prisma.workOrder.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        requestedBy: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    const now = Date.now();
    const enriched = workOrders.map(wo => {
      let isSlaBreached = false;
      let slaPercent = 0;
      if (wo.assignedAt) {
        const elapsed = now - new Date(wo.assignedAt).getTime();
        isSlaBreached = 
          wo.status !== 'COMPLETED' && 
          wo.status !== 'CLOSED' && 
          elapsed > SLA_LIMIT;
        slaPercent = Math.min(100, Math.round((elapsed / SLA_LIMIT) * 100));
      }

      return {
        ...wo,
        slaBreached: isSlaBreached,
        slaPercent,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Error fetching work orders:', error);
    return NextResponse.json({ error: 'Failed to fetch work orders' }, { status: 500 });
  }
}

// Prefix WO berdasarkan kategori
const CATEGORY_PREFIX: Record<string, string> = {
  PERBAIKAN:   'A',
  PEMBUATAN:   'B',
  INSTALASI:   'C',
  MODIFIKASI:  'D',
  KESELAMATAN: 'E',
};

export async function POST(request: Request) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ 
        error: 'Sesi tidak ditemukan. Silakan login terlebih dahulu.',
        code: 'SESSION_MISSING'
      }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ 
        error: 'Format data tidak valid.',
        code: 'INVALID_JSON'
      }, { status: 400 });
    }

    const { title, description, location, category, classification, priority, jobCategory, attachments } = body;

    // Validasi field wajib
    if (!title || !description || !location) {
      return NextResponse.json({ 
        error: 'Field judul, deskripsi, dan lokasi wajib diisi.',
        code: 'MISSING_FIELDS'
      }, { status: 400 });
    }

    // Validasi priority harus sesuai enum Priority
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH'];
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json({ 
        error: `Priority tidak valid. Nilai yang diizinkan: ${validPriorities.join(', ')}`,
        code: 'INVALID_PRIORITY'
      }, { status: 400 });
    }

    // Validasi sesi: pastikan user masih ada di DB (cegah error dari sesi stale setelah DB reset)
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      return NextResponse.json(
        { 
          error: 'Sesi tidak valid setelah pembaruan sistem. Silakan logout dan login kembali.',
          code: 'SESSION_STALE'
        },
        { status: 401 }
      );
    }

    const cat = category || 'PERBAIKAN';
    const prefix = CATEGORY_PREFIX[cat] ?? 'A';

    // Ambil 2 digit terakhir tahun
    const year = String(new Date().getFullYear()).slice(-2);
    const woPrefix = `WO-${prefix}${year}/`;

    // Hitung jumlah WO dengan prefix yang sama untuk auto-increment
    const count = await prisma.workOrder.count({
      where: {
        woNumber: { startsWith: woPrefix }
      }
    });

    const sequence = String(count + 1).padStart(4, '0');
    const woNumber = `${woPrefix}${sequence}`;

    const workOrder = await prisma.workOrder.create({
      data: {
        woNumber,
        title,
        description,
        location,
        category: cat,
        classification: classification || null,
        jobCategory: jobCategory || null,
        priority: priority || 'LOW',
        status: 'OPEN',
        requestedById: user.id,
        assignedToIds: [],
        assignedNames: [],
        attachments: Array.isArray(attachments) ? attachments : [],
      },
      include: {
        requestedBy: { select: { id: true, name: true, role: true } }
      }
    });

    // Catat audit trail
    await prisma.woUpdate.create({
      data: {
        woId: workOrder.id,
        userId: user.id,
        action: 'CREATED',
        newStatus: 'OPEN',
        note: `Work order dibuat oleh ${user.name}`,
      }
    });

    // Kirim notifikasi ke Admin dan Warehouse
    createNotificationsForRoles(['ADMIN', 'WAREHOUSE'], {
      title: 'Work Order Baru',
      message: `${user.name} membuat WO baru "${title}" (${woNumber}) di ${location}. Kategori: ${cat}`,
      type: 'WO_CREATED',
      referenceId: workOrder.id,
      referenceType: 'WORK_ORDER',
    }).catch(console.error);

    return NextResponse.json(workOrder, { status: 201 });
  } catch (error: any) {
    console.error('Error creating work order:', error);
    // Tangani error Prisma specific
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: 'Data referensi tidak ditemukan. Pastikan semua field yang diperlukan valid.',
        code: 'INVALID_REFERENCE'
      }, { status: 400 });
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'Data duplikat terdeteksi. Silakan coba lagi.',
        code: 'DUPLICATE_ENTRY'
      }, { status: 409 });
    }
    return NextResponse.json({ 
      error: error.message || 'Gagal membuat Work Order. Silakan coba beberapa saat lagi.',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

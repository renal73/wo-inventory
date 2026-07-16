import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

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

// GET: Dashboard summary dengan data real-time dari Work Orders
export async function GET() {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // 1. Total all Work Orders (all statuses)
    const totalWO = await prisma.workOrder.count();

    // 2. Active Work Orders (OPEN + ASSIGNED + IN_PROGRESS)
    const activeWO = await prisma.workOrder.count({
      where: { status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] } }
    });

    // 3. Total Open Work Orders
    const totalOpenWO = await prisma.workOrder.count({
      where: { status: 'OPEN' }
    });

    // 2. Breakdown berdasarkan prioritas
    const priorityBreakdown = await prisma.workOrder.groupBy({
      by: ['priority'],
      where: { status: 'OPEN' },
      _count: { priority: true }
    });

    // 3. Breakdown berdasarkan kategori WO (Preventive/Corrective/Breakdown)
    // Map dari category: PERBAIKAN=Corrective, PEMBUATAN=New, INSTALASI=Installation, MODIFIKASI=Modification, KESELAMATAN=Safety
    const categoryBreakdown = await prisma.workOrder.groupBy({
      by: ['category'],
      where: { status: 'OPEN' },
      _count: { category: true }
    });

    // 4. Work Orders overdue (melewati dueDate dan masih open/assigned/in_progress)
    const overdueWO = await prisma.workOrder.count({
      where: {
        status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] },
        dueDate: { lt: now }
      }
    });

    // 5. WO yang sudah completed bulan ini
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const completedThisMonth = await prisma.workOrder.count({
      where: {
        status: { in: ['COMPLETED', 'CLOSED'] },
        completedAt: { gte: startOfMonth }
      }
    });

    // 6. Total WO bulan ini (untuk calculate completion rate)
    const totalWOMonth = await prisma.workOrder.count({
      where: {
        createdAt: { gte: startOfMonth }
      }
    });

    // 7. Calculate MTTR (Mean Time To Repair) - rata-rata waktu penyelesaian dalam jam
    const completedOrders = await prisma.workOrder.findMany({
      where: {
        status: { in: ['COMPLETED', 'CLOSED'] },
        startedAt: { not: null },
        completedAt: { not: null }
      },
      select: {
        startedAt: true,
        completedAt: true
      },
      take: 50, // Ambil 50 WO terakhir untuk sampling
      orderBy: { completedAt: 'desc' }
    });

    let avgMTTR = 0;
    if (completedOrders.length > 0) {
      const totalMinutes = completedOrders.reduce((sum, wo) => {
        if (wo.startedAt && wo.completedAt) {
          const diff = new Date(wo.completedAt).getTime() - new Date(wo.startedAt).getTime();
          return sum + diff / (1000 * 60); // Convert to minutes
        }
        return sum;
      }, 0);
      avgMTTR = Math.round((totalMinutes / completedOrders.length) / 60 * 10) / 10; // Convert to hours
    }

    // Completion rate bulan ini
    const completionRate = totalWOMonth > 0 
      ? Math.round((completedThisMonth / totalWOMonth) * 100) 
      : 0;

    // Transformasi data breakdown
    const priorityMap: Record<string, string> = {
      DARURAT: 'Darurat',
      PROSES_BERHENTI: 'Proses Berhenti',
      PROSES_BERJALAN: 'Proses Berjalan'
    };

    const categoryMap: Record<string, string> = {
      PERBAIKAN: 'Corrective',
      PEMBUATAN: 'New',
      INSTALASI: 'Installation',
      MODIFIKASI: 'Modification',
      KESELAMATAN: 'Safety'
    };

    const priorityData = priorityBreakdown.map(p => ({
      priority: p.priority,
      label: priorityMap[p.priority] || p.priority,
      count: p._count.priority
    }));

    const categoryData = categoryBreakdown.map(c => ({
      category: c.category,
      label: categoryMap[c.category] || c.category,
      count: c._count.category
    }));

    // 8. Breakdown berdasarkan klasifikasi masalah (Electric vs Mechanic vs Sipil vs Lain)
    const classificationBreakdown = await prisma.workOrder.groupBy({
      by: ['classification'],
      where: { 
        status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] },
        classification: { not: null }
      },
      _count: { classification: true }
    });

    const classificationMap: Record<string, string> = {
      ELECTRIC: 'Electric',
      MECHANIC: 'Mechanic',
      SIPIL: 'Sipil',
      OTHER: 'Lain-lain'
    };

    const classificationData = classificationBreakdown.map(c => ({
      classification: c.classification,
      label: classificationMap[c.classification || ''] || c.classification || 'Lain-lain',
      count: c._count.classification
    }));

    return NextResponse.json({
      totalWO,
      activeWO,
      totalOpenWO,
      overdueWO,
      avgMTTR,
      completionRate,
      completedThisMonth,
      totalWOMonth,
      priorityBreakdown: priorityData,
      categoryBreakdown: categoryData,
      classificationBreakdown: classificationData,
      generatedAt: now.toISOString()
    });
  } catch (error) {
    console.error('Error GET /api/mtc/dashboard/summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard summary' },
      { status: 500 }
    );
  }
}

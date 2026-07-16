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

function getDateRange(period: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  
  switch (period) {
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      break;
    case '1y':
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }
  
  return { start, end };
}

// GET /api/analytics - Get KPI summary
export async function GET(request: Request) {
  try {
    // Skip auth check for development - in production, add proper auth
    // const user = await getUserSession();
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const { start, end } = getDateRange(period);

    // Total Work Orders
    const totalWorkOrders = await prisma.workOrder.count();

    // Work Orders completed this period
    const completedThisPeriod = await prisma.workOrder.count({
      where: {
        status: { in: ['COMPLETED', 'CLOSED'] },
        completedAt: {
          gte: start,
          lte: end,
        }
      }
    });

    // Work Orders completed this month (for display)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const completedThisMonth = await prisma.workOrder.count({
      where: {
        status: { in: ['COMPLETED', 'CLOSED'] },
        completedAt: {
          gte: startOfMonth,
        }
      }
    });

    // Calculate average completion time (in hours)
    const completedWos = await prisma.workOrder.findMany({
      where: {
        status: { in: ['COMPLETED', 'CLOSED'] },
        actualDuration: { not: null },
      },
      select: { actualDuration: true }
    });

    const avgCompletionTime = completedWos.length > 0
      ? completedWos.reduce((acc, wo) => acc + (wo.actualDuration || 0), 0) / completedWos.length / 60
      : 0;

    // SLA Compliance (work orders completed on time)
    const completedWosWithDates = await prisma.workOrder.findMany({
      where: {
        status: { in: ['COMPLETED', 'CLOSED'] },
        completedAt: { not: null },
        dueDate: { not: null },
      },
      select: { completedAt: true, dueDate: true }
    });

    const onTimeWos = completedWosWithDates.filter(wo => 
      wo.completedAt && wo.dueDate && new Date(wo.completedAt) <= new Date(wo.dueDate)
    ).length;

    const slaCompliance = completedWosWithDates.length > 0
      ? Math.round((onTimeWos / completedWosWithDates.length) * 100)
      : 100;

    // Work order stats by status
    const workOrders = await prisma.workOrder.findMany({
      where: {
        createdAt: { gte: start }
      },
      select: {
        status: true,
        priority: true,
        category: true,
        createdAt: true,
        completedAt: true,
        dueDate: true,
      }
    });

    // Calculate trend data (monthly)
    const monthlyTrend: { month: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      
      const count = workOrders.filter(wo => 
        wo.createdAt >= monthStart && wo.createdAt < monthEnd
      ).length;

      monthlyTrend.push({
        month: monthStart.toLocaleDateString('id-ID', { month: 'short' }),
        value: count
      });
    }

    // Category distribution
    const categoryCount = await prisma.workOrder.groupBy({
      by: ['category'],
      _count: { category: true }
    });

    const categoryNames: Record<string, string> = {
      'PERBAIKAN': 'Perbaikan',
      'PEMBUATAN': 'Pembuatan',
      'INSTALASI': 'Instalasi',
      'MODIFIKASI': 'Modifikasi',
      'KESELAMATAN': 'Keselamatan'
    };

    const categoryColors: Record<string, string> = {
      'PERBAIKAN': '#E60000',
      'PEMBUATAN': '#2563EB',
      'INSTALASI': '#16A34A',
      'MODIFIKASI': '#D97706',
      'KESELAMATAN': '#9333EA'
    };

    const categoryDistribution = categoryCount.map(cat => {
      const categoryKey = cat.category;
      return {
        category: categoryKey,
        name: categoryNames[categoryKey] || categoryKey,
        rawValue: cat._count.category,
        color: categoryColors[categoryKey] || '#6B7280'
      };
    });

    // Recalculate percentage for distribution
    const totalForPercent = categoryDistribution.reduce((acc, cat) => acc + cat.rawValue, 0);
    categoryDistribution.forEach(cat => {
      cat.name = `${cat.name} (${totalForPercent > 0 ? Math.round((cat.rawValue / totalForPercent) * 100) : 0}%)`;
    });

    // Priority breakdown
    const priorityCount = await prisma.workOrder.groupBy({
      by: ['priority'],
      _count: { priority: true }
    });

    const priorityLabels: Record<string, string> = {
      'LOW': 'Proses sedang berjalan',
      'MEDIUM': 'Proses berhenti',
      'HIGH': 'Darurat'
    };

    const priorityBreakdown = priorityCount.map(p => ({
      priority: priorityLabels[p.priority] || p.priority,
      count: p._count.priority
    }));

    // Technician performance
    const technicians = await prisma.user.findMany({
      where: { role: { in: ['TECHNICIAN', 'ADMIN'] } },
      select: { id: true, name: true }
    });

    const technicianPerformance = technicians.map(tech => {
      const techWos = workOrders.filter(wo => 
        wo.completedAt && new Date(wo.completedAt) >= start
      );
      
      const completed = techWos.filter(wo => 
        wo.completedAt !== null
      ).length;

      const avgTime = completed > 0
        ? techWos.filter(wo => wo.completedAt).reduce((acc, wo) => {
            // Simplified - just return a placeholder
            return acc + 4.0;
          }, 0) / completed
        : 0;

      return {
        name: tech.name,
        completed,
        avgTime: Number(avgTime.toFixed(1))
      };
    }).filter(t => t.completed > 0);

    return NextResponse.json({
      totalWorkOrders,
      completedThisMonth,
      avgCompletionTime: Number(avgCompletionTime.toFixed(1)),
      slaCompliance,
      monthlyTrend,
      categoryDistribution,
      priorityBreakdown,
      technicianPerformance,
    });
  } catch (error) {
    console.error('Error GET /api/analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

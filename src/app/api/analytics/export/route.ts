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

// GET /api/analytics/export - Export analytics report
export async function GET(request: Request) {
  try {
    const user = await getUserSession();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const period = searchParams.get('period') || '30d';

    // Calculate date range
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

    // Get data
    const workOrders = await prisma.workOrder.findMany({
      where: {
        createdAt: { gte: start }
      },
      include: {
        requestedBy: { select: { name: true } },
      }
    });

    // Technician performance
    const technicians = await prisma.user.findMany({
      where: { role: { in: ['TECHNICIAN', 'ADMIN'] } },
      select: { id: true, name: true }
    });

    const technicianStats = technicians.map(tech => {
      const assigned = workOrders.filter(wo => wo.assignedToIds.includes(tech.id));
      const completed = assigned.filter(wo => 
        wo.status === 'COMPLETED' || wo.status === 'CLOSED'
      );
      const onTime = completed.filter(wo => {
        if (!wo.completedAt || !wo.dueDate) return true;
        return new Date(wo.completedAt) <= new Date(wo.dueDate);
      });

      return {
        name: tech.name,
        totalAssigned: assigned.length,
        completed: completed.length,
        onTime: onTime.length,
        efficiency: completed.length > 0 
          ? Math.round((onTime.length / completed.length) * 100) 
          : 100
      };
    });

    // Category stats
    const categoryStats = await prisma.workOrder.groupBy({
      by: ['category'],
      _count: true,
      where: { createdAt: { gte: start } }
    });

    // Priority stats
    const priorityStats = await prisma.workOrder.groupBy({
      by: ['priority'],
      _count: true,
      where: { createdAt: { gte: start } }
    });

    // Status stats
    const statusStats = await prisma.workOrder.groupBy({
      by: ['status'],
      _count: true,
      where: { createdAt: { gte: start } }
    });

    const report = {
      generatedAt: new Date().toISOString(),
      period: { start: start.toISOString(), end: end.toISOString() },
      summary: {
        totalWorkOrders: workOrders.length,
        completed: workOrders.filter(wo => 
          wo.status === 'COMPLETED' || wo.status === 'CLOSED'
        ).length,
        inProgress: workOrders.filter(wo => wo.status === 'IN_PROGRESS').length,
        onHold: workOrders.filter(wo => wo.status === 'ON_HOLD').length,
      },
      technicianPerformance: technicianStats,
      categoryBreakdown: categoryStats.map(c => ({
        category: c.category,
        count: c._count
      })),
      priorityBreakdown: priorityStats.map(p => ({
        priority: p.priority,
        count: p._count
      })),
      statusBreakdown: statusStats.map(s => ({
        status: s.status,
        count: s._count
      })),
      workOrders: workOrders.map(wo => ({
        woNumber: wo.woNumber,
        title: wo.title,
        category: wo.category,
        priority: wo.priority,
        status: wo.status,
        assignedNames: wo.assignedNames,
        requestedBy: wo.requestedBy?.name || 'System',
        createdAt: wo.createdAt,
        completedAt: wo.completedAt,
        dueDate: wo.dueDate,
      }))
    };

    if (format === 'csv') {
      // Generate CSV content
      const headers = ['WO Number', 'Title', 'Category', 'Priority', 'Status', 'Assigned To', 'Requested By', 'Created', 'Completed', 'Due Date'];
      const rows = report.workOrders.map(wo => [
        wo.woNumber,
        `"${wo.title}"`,
        wo.category,
        wo.priority,
        wo.status,
        `"${wo.assignedNames.join(', ')}"`,
        wo.requestedBy,
        new Date(wo.createdAt).toLocaleDateString('id-ID'),
        wo.completedAt ? new Date(wo.completedAt).toLocaleDateString('id-ID') : '-',
        wo.dueDate ? new Date(wo.dueDate).toLocaleDateString('id-ID') : '-'
      ].join(','));

      const csv = [headers.join(','), ...rows].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-report-${period}.csv"`
        }
      });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error GET /api/analytics/export:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

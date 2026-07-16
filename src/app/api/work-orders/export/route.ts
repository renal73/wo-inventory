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

export async function GET() {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can export
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin only.' }, { status: 403 });
    }

    const workOrders = await prisma.workOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        requestedBy: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    // CSV Headers
    const headers = [
      'WO Number',
      'Title',
      'Description',
      'Location',
      'Category',
      'Classification',
      'Job Category',
      'Priority',
      'Status',
      'Requested By',
      'Assigned Names',
      'Admin Notes',
      'Tech Notes',
      'Created At',
      'Updated At',
      'Assigned At',
      'Due Date',
      'Started At',
      'Completed At',
      'Closed At',
      'SLA Breached',
      'SLA Percent'
    ];

    // Convert to CSV rows
    const rows = workOrders.map(wo => [
      wo.woNumber,
      `"${(wo.title || '').replace(/"/g, '""')}"`,
      `"${(wo.description || '').replace(/"/g, '""')}"`,
      `"${(wo.location || '').replace(/"/g, '""')}"`,
      wo.category,
      wo.classification || '',
      wo.jobCategory || '',
      wo.priority,
      wo.status,
      wo.requestedBy?.name || '',
      `"${wo.assignedNames.join(', ')}"`,
      `"${(wo.adminNotes || '').replace(/"/g, '""')}"`,
      `"${(wo.techNotes || '').replace(/"/g, '""')}"`,
      wo.createdAt ? new Date(wo.createdAt).toISOString() : '',
      wo.updatedAt ? new Date(wo.updatedAt).toISOString() : '',
      wo.assignedAt ? new Date(wo.assignedAt).toISOString() : '',
      wo.dueDate ? new Date(wo.dueDate).toISOString() : '',
      wo.startedAt ? new Date(wo.startedAt).toISOString() : '',
      wo.completedAt ? new Date(wo.completedAt).toISOString() : '',
      wo.closedAt ? new Date(wo.closedAt).toISOString() : '',
      wo.status !== 'COMPLETED' && wo.status !== 'CLOSED' && wo.assignedAt
        ? (new Date().getTime() - new Date(wo.assignedAt).getTime() > 30 * 24 * 60 * 60 * 1000 ? 'YES' : 'NO')
        : 'N/A',
      wo.status !== 'COMPLETED' && wo.status !== 'CLOSED' && wo.assignedAt
        ? Math.min(100, Math.round((new Date().getTime() - new Date(wo.assignedAt).getTime()) / (30 * 24 * 60 * 60 * 1000) * 100))
        : wo.status === 'COMPLETED' || wo.status === 'CLOSED' ? 100 : 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Generate filename with date
    const date = new Date().toISOString().split('T')[0];
    const filename = `work-orders-export-${date}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting work orders:', error);
    return NextResponse.json({ error: 'Failed to export work orders' }, { status: 500 });
  }
}

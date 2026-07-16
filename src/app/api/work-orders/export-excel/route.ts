import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import * as XLSX from 'xlsx';

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

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin only.' }, { status: 403 });
    }

    const workOrders = await prisma.workOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        requestedBy: {
          select: { id: true, name: true, role: true }
        },
        closedBy: {
          select: { id: true, name: true }
        },
        room: {
          select: { id: true, name: true }
        },
        partsTaken: {
          select: { qtyTaken: true, part: { select: { name: true } } }
        }
      }
    });

    // Build rows for Excel
    const rows = workOrders.map(wo => ({
      'WO Number': wo.woNumber,
      'Title': wo.title || '',
      'Description': wo.description || '',
      'Location': wo.location || '',
      'Room': wo.room?.name || '',
      'Category': wo.category,
      'Classification': wo.classification || '',
      'Job Category': wo.jobCategory || '',
      'Priority': wo.priority,
      'Status': wo.status,
      'Requested Dept': wo.requestedDept || '',
      'Requested By': wo.requestedBy?.name || '',
      'Closed By': wo.closedBy?.name || '',
      'Duration (minutes)': wo.actualDuration || '',
      'Parts Used': wo.partsTaken?.length > 0 ? wo.partsTaken.map(p => `${p.part?.name || 'Part'}(${p.qtyTaken})`).join(', ') : '',
      'Assigned Names': wo.assignedNames.join(', '),
      'Admin Notes': wo.adminNotes || '',
      'Tech Notes': wo.techNotes || '',
      'Created At': wo.createdAt ? new Date(wo.createdAt).toISOString() : '',
      'Closed At': wo.closedAt ? new Date(wo.closedAt).toISOString() : '',
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Set column widths for better readability
    worksheet['!cols'] = [
      { wch: 16 },  // WO Number
      { wch: 30 },  // Title
      { wch: 40 },  // Description
      { wch: 25 },  // Location
      { wch: 25 },  // Room
      { wch: 14 },  // Category
      { wch: 14 },  // Classification
      { wch: 18 },  // Job Category
      { wch: 10 },  // Priority
      { wch: 12 },  // Status
      { wch: 15 },  // Requested Dept
      { wch: 18 },  // Requested By
      { wch: 18 },  // Closed By
      { wch: 18 },  // Duration (minutes)
      { wch: 30 },  // Parts Used
      { wch: 20 },  // Assigned Names
      { wch: 30 },  // Admin Notes
      { wch: 30 },  // Tech Notes
      { wch: 22 },  // Created At
      { wch: 22 },  // Closed At
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Work Orders');

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const date = new Date().toISOString().split('T')[0];
    const filename = `work-orders-export-${date}.xlsx`;

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting work orders to Excel:', error);
    return NextResponse.json({ error: 'Failed to export work orders' }, { status: 500 });
  }
}
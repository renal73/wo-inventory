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

// GET: Part usage log untuk dashboard
export async function GET(request: Request) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const technicianId = searchParams.get('technicianId') || '';
    const workOrderId = searchParams.get('workOrderId') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const where: any = {};

    if (technicianId) {
      where.takenById = technicianId;
    }

    if (workOrderId) {
      where.workOrderId = workOrderId;
    }

    if (startDate || endDate) {
      where.takenAt = {};
      if (startDate) {
        where.takenAt.gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.takenAt.lte = endDateTime;
      }
    }

    const partUsage = await prisma.workOrderPart.findMany({
      where,
      take: limit,
      orderBy: { takenAt: 'desc' },
      include: {
        part: {
          select: {
            id: true,
            name: true,
            rackLocation: true
          }
        },
        takenBy: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        workOrder: {
          select: {
            id: true,
            woNumber: true,
            title: true,
            location: true
          }
        }
      }
    });

    const enrichedData = partUsage.map(pu => ({
      id: pu.id,
      partName: pu.part.name,
      partCode: pu.part.id,
      rackLocation: pu.part.rackLocation,
      qtyTaken: pu.qtyTaken,
      locationNotes: pu.locationNotes,
      takenAt: pu.takenAt.toISOString(),
      technician: {
        id: pu.takenBy.id,
        name: pu.takenBy.name,
        role: pu.takenBy.role
      },
      workOrder: {
        id: pu.workOrder.id,
        woNumber: pu.workOrder.woNumber,
        title: pu.workOrder.title,
        location: pu.workOrder.location
      }
    }));

    return NextResponse.json(enrichedData);
  } catch (error) {
    console.error('Error GET /api/mtc/dashboard/part-usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch part usage log' },
      { status: 500 }
    );
  }
}

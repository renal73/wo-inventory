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

// GET /api/work-orders/[id] - Detail WO
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        requestedBy: { select: { id: true, name: true, role: true } },
        updates: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, name: true, role: true } }
          }
        }
      }
    });

    if (!workOrder) return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    return NextResponse.json(workOrder);
  } catch (error) {
    console.error('Error GET /api/work-orders/[id]:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Validasi transisi status
const VALID_TRANSITIONS: Record<string, string[]> = {
  OPEN:        ['IN_REVIEW', 'ASSIGNED', 'CLOSED'],
  IN_REVIEW:   ['ASSIGNED', 'CLOSED'],
  ASSIGNED:    ['IN_PROGRESS', 'ON_HOLD', 'CLOSED'],
  IN_PROGRESS: ['ON_HOLD', 'COMPLETED'],
  ON_HOLD:     ['IN_PROGRESS', 'CLOSED'],
  COMPLETED:   ['CLOSED', 'IN_PROGRESS'], // bisa dikembalikan jika verifikasi gagal
  CLOSED:      [],
};

// PUT /api/work-orders/[id] - Update status, assign teknisi, dll
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { status, assignedToIds, assignedNames, adminNotes, techNotes, note, classification, priority, assignedAt, dueDate, jobCategory, completionAttachments } = body;

    const current = await prisma.workOrder.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: 'Work order not found' }, { status: 404 });

    // Validasi perubahan status
    if (status && status !== current.status) {
      const allowed = VALID_TRANSITIONS[current.status] ?? [];
      if (!allowed.includes(status)) {
        return NextResponse.json(
          { error: `Transisi dari ${current.status} ke ${status} tidak diizinkan` },
          { status: 400 }
        );
      }

      // Assign ke Teknisi harus oleh Admin
      if (status === 'ASSIGNED' && user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Hanya Admin yang bisa menugaskan teknisi' }, { status: 403 });
      }

      // Teknisi mulai kerja
      if (status === 'IN_PROGRESS' && current.assignedToIds.length === 0) {
        return NextResponse.json({ error: 'Harus ada teknisi yang ditugaskan dahulu' }, { status: 400 });
      }
    }

    // Build update data
    const updateData: any = {};
    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (techNotes !== undefined) updateData.techNotes = techNotes;
    if (classification !== undefined) updateData.classification = classification;
    if (priority !== undefined) updateData.priority = priority;

    if (assignedToIds !== undefined) {
      updateData.assignedToIds = assignedToIds;
      updateData.assignedNames = assignedNames || [];
      // Auto-set assignedAt if technicians are assigned and not already set
      if (assignedToIds.length > 0 && !current.assignedAt && !assignedAt) {
        updateData.assignedAt = new Date();
      }
    }

    if (assignedAt !== undefined) {
      updateData.assignedAt = assignedAt ? new Date(assignedAt) : null;
    }
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }
    if (jobCategory !== undefined) {
      updateData.jobCategory = jobCategory || null;
    }
    if (completionAttachments !== undefined) {
      updateData.completionAttachments = Array.isArray(completionAttachments) ? completionAttachments : [];
    }

    // Timestamps otomatis
    if (status === 'IN_PROGRESS' && !current.startedAt) {
      updateData.startedAt = new Date();
    }
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
      const start = current.startedAt || updateData.startedAt;
      if (start) {
        const diffMs = updateData.completedAt.getTime() - new Date(start).getTime();
        updateData.actualDuration = Math.max(1, Math.round(diffMs / 60000));
      }
    }
    if (status === 'CLOSED') {
      updateData.closedAt = new Date();
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: updateData,
      include: {
        requestedBy: { select: { id: true, name: true, role: true } }
      }
    });

    // Audit Trail
    if (status && status !== current.status) {
      await prisma.woUpdate.create({
        data: {
          woId: id,
          userId: user.id,
          action: 'STATUS_CHANGED',
          oldStatus: current.status,
          newStatus: status,
          note: note || null,
        }
      });
    } else if (note) {
      await prisma.woUpdate.create({
        data: {
          woId: id,
          userId: user.id,
          action: 'NOTE_ADDED',
          note: note,
        }
      });
    }

    if (assignedToIds && assignedToIds.length > 0 && JSON.stringify(assignedToIds) !== JSON.stringify(current.assignedToIds)) {
      await prisma.woUpdate.create({
        data: {
          woId: id,
          userId: user.id,
          action: 'ASSIGNED',
          note: `Ditugaskan kepada: ${(assignedNames || []).join(', ')}`,
        }
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error PUT /api/work-orders/[id]:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// DELETE /api/work-orders/[id] - Hanya Admin
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserSession();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    await prisma.workOrder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error DELETE /api/work-orders/[id]:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

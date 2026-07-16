import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { hash } from 'bcryptjs';

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

// GET /api/technicians/team/[id] - Get single technician
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const technician = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        specialization: true,
        phone: true,
        email: true,
        createdAt: true,
      }
    });

    if (!technician) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 });
    }

    // Get work order stats
    const workOrders = await prisma.workOrder.findMany({
      where: { assignedToIds: { has: id } },
      select: { status: true }
    });

    const completed = workOrders.filter(wo => 
      wo.status === 'COMPLETED' || wo.status === 'CLOSED'
    ).length;
    const inProgress = workOrders.filter(wo => 
      wo.status === 'IN_PROGRESS' || wo.status === 'ASSIGNED'
    ).length;

    return NextResponse.json({
      id: technician.id,
      name: technician.name,
      username: technician.username,
      role: technician.role,
      specialization: technician.specialization 
        ? [technician.specialization === 'MACHINERY' ? 'Machinery' : 'Utility & Facility']
        : [],
      phone: technician.phone,
      email: technician.email,
      status: (inProgress > 0 || completed > 0) ? 'active' : 'inactive',
      joinedAt: technician.createdAt,
      workOrdersCompleted: completed,
      workOrdersInProgress: inProgress,
    });
  } catch (error) {
    console.error('Error GET /api/technicians/team/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/technicians/team/[id] - Update technician
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserSession();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, role, specialization, phone, email, password } = body;

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (specialization !== undefined) {
      updateData.specialization = specialization === 'MACHINERY' 
        ? 'MACHINERY' 
        : specialization === 'UTILITY_FACILITY' 
          ? 'UTILITY_FACILITY' 
          : null;
    }
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (password) {
      updateData.passwordHash = await hash(password, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        specialization: true,
        phone: true,
        email: true,
        createdAt: true,
      }
    });

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      username: updatedUser.username,
      role: updatedUser.role,
      specialization: updatedUser.specialization 
        ? [updatedUser.specialization === 'MACHINERY' ? 'Machinery' : 'Utility & Facility']
        : [],
      phone: updatedUser.phone,
      email: updatedUser.email,
      joinedAt: updatedUser.createdAt,
    });
  } catch (error) {
    console.error('Error PUT /api/technicians/team/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/technicians/team/[id] - Delete technician
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserSession();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Check if technician has assigned work orders
    const workOrders = await prisma.workOrder.findMany({
      where: { assignedToIds: { has: id } },
      select: { id: true }
    });

    if (workOrders.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete technician with assigned work orders. Reassign work orders first.'
      }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Technician deleted' });
  } catch (error) {
    console.error('Error DELETE /api/technicians/team/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

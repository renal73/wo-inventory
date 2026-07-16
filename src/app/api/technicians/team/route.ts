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

// GET /api/technicians/team - List all technicians with full details
export async function GET() {
  try {
    // Skip auth check for development - in production, add proper auth
    // const user = await getUserSession();
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const technicians = await prisma.user.findMany({
      where: {
        role: { in: ['TECHNICIAN', 'ADMIN'] }
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        specialization: true,
        phone: true,
        email: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' }
    });

    // Get work order stats for each technician
    const workOrders = await prisma.workOrder.findMany({
      select: {
        assignedToIds: true,
        status: true,
      }
    });

    const teamData = technicians.map((tech) => {
      const assignedWos = workOrders.filter(wo => wo.assignedToIds.includes(tech.id));
      const completed = assignedWos.filter(wo => 
        wo.status === 'COMPLETED' || wo.status === 'CLOSED'
      ).length;
      const inProgress = assignedWos.filter(wo => 
        wo.status === 'IN_PROGRESS' || wo.status === 'ASSIGNED'
      ).length;

      // Determine status (active if has work in progress or completed recently)
      const status = (inProgress > 0 || completed > 0) ? 'active' : 'inactive';

      // Get specializations as array
      const specialization = tech.specialization 
        ? [tech.specialization === 'MACHINERY' ? 'Machinery' : 'Utility & Facility']
        : [];

      return {
        id: tech.id,
        name: tech.name,
        username: tech.username,
        role: tech.role,
        specialization,
        phone: tech.phone,
        email: tech.email,
        status,
        joinedAt: tech.createdAt,
        workOrdersCompleted: completed,
        workOrdersInProgress: inProgress,
      };
    });

    return NextResponse.json(teamData);
  } catch (error) {
    console.error('Error GET /api/technicians/team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/technicians/team - Create new technician
export async function POST(request: Request) {
  try {
    const user = await getUserSession();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { username, name, password, role, specialization, phone, email } = body;

    // Validate required fields
    if (!username || !name || !password) {
      return NextResponse.json(
        { error: 'Username, name, and password are required' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hash(password, 12);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username,
        name,
        passwordHash,
        role: role || 'TECHNICIAN',
        specialization: specialization || null,
        phone: phone || null,
        email: email || null,
      },
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
      ...newUser,
      status: 'active',
      specialization: newUser.specialization 
        ? [newUser.specialization === 'MACHINERY' ? 'Machinery' : 'Utility & Facility']
        : [],
      workOrdersCompleted: 0,
      workOrdersInProgress: 0,
    }, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/technicians/team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

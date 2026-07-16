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

// GET /api/technicians/workload - Get workload stats for all technicians
export async function GET() {
  try {
    // Skip auth check for development - in production, add proper auth
    // const user = await getUserSession();
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Get all technicians
    const technicians = await prisma.user.findMany({
      where: {
        role: { in: ['TECHNICIAN', 'ADMIN'] }
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        specialization: true,
        phone: true,
        email: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' }
    });

    // Get all work orders
    const workOrders = await prisma.workOrder.findMany({
      select: {
        id: true,
        assignedToIds: true,
        status: true,
        dueDate: true,
        completedAt: true,
        actualDuration: true,
        createdAt: true,
      }
    });

    // Calculate workload stats for each technician
    const workloadData = technicians.map((tech) => {
      // Filter work orders assigned to this technician
      const assignedWos = workOrders.filter(wo => 
        wo.assignedToIds.includes(tech.id)
      );

      const totalAssigned = assignedWos.length;
      const inProgress = assignedWos.filter(wo => 
        wo.status === 'IN_PROGRESS' || wo.status === 'ASSIGNED'
      ).length;
      const completed = assignedWos.filter(wo => 
        wo.status === 'COMPLETED' || wo.status === 'CLOSED'
      ).length;
      const onHold = assignedWos.filter(wo => 
        wo.status === 'ON_HOLD'
      ).length;

      // Calculate on-time completion
      const completedWos = assignedWos.filter(wo => 
        wo.status === 'COMPLETED' || wo.status === 'CLOSED'
      );
      const onTime = completedWos.filter(wo => {
        if (!wo.completedAt || !wo.dueDate) return true; // Count as on-time if no due date
        return new Date(wo.completedAt) <= new Date(wo.dueDate);
      }).length;

      // Calculate average completion time
      const wosWithDuration = completedWos.filter(wo => wo.actualDuration);
      const avgCompletionTime = wosWithDuration.length > 0
        ? Math.round(wosWithDuration.reduce((acc, wo) => acc + (wo.actualDuration || 0), 0) / wosWithDuration.length)
        : 0;

      // Efficiency calculations
      const efficiencyByCompletion = totalAssigned > 0 
        ? Math.round((completed / totalAssigned) * 100) 
        : 0;
      const efficiencyByOnTime = completed > 0 
        ? Math.round((onTime / completed) * 100) 
        : 100;
      const overallEfficiency = Math.round((efficiencyByCompletion + efficiencyByOnTime) / 2);

      return {
        id: tech.id,
        name: tech.name,
        role: tech.role,
        specialization: tech.specialization,
        phone: tech.phone,
        email: tech.email,
        joinedAt: tech.createdAt,
        totalAssigned,
        inProgress,
        completed,
        onHold,
        onTime,
        avgCompletionTime,
        efficiencyByCompletion,
        efficiencyByOnTime,
        efficiency: overallEfficiency,
      };
    });

    return NextResponse.json(workloadData);
  } catch (error) {
    console.error('Error GET /api/technicians/workload:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

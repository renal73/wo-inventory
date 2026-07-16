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

// GET /api/technicians - List semua TECHNICIAN & ADMIN untuk keperluan penugasan
export async function GET() {
  try {
    const user = await getUserSession();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const technicians = await prisma.user.findMany({
      where: {
        role: { in: ['TECHNICIAN', 'ADMIN'] }
      },
      select: { id: true, name: true, username: true, role: true },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(technicians);
  } catch (error) {
    console.error('Error GET /api/technicians:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

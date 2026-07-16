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

// GET - List semua rooms
export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: { _count: { select: { workOrders: true } } },
    });
    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Failed to fetch rooms:', error);
    return NextResponse.json({ error: 'Gagal mengambil data ruangan' }, { status: 500 });
  }
}

// POST - Create room baru
export async function POST(request: Request) {
  try {
    const user = await getUserSession();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'WAREHOUSE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nama ruangan wajib diisi' }, { status: 400 });
    }

    const existing = await prisma.room.findFirst({ where: { name: name.trim() } });
    if (existing) {
      // Jika sudah ada tapi inactive, aktifkan kembali
      if (!existing.isActive) {
        const room = await prisma.room.update({
          where: { id: existing.id },
          data: { isActive: true, description: description || existing.description },
        });
        return NextResponse.json(room);
      }
      return NextResponse.json({ error: 'Nama ruangan sudah ada' }, { status: 409 });
    }

    const room = await prisma.room.create({
      data: {
        name: name.trim(),
        description: description || null,
      },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error('Failed to create room:', error);
    return NextResponse.json({ error: 'Gagal membuat ruangan' }, { status: 500 });
  }
}

// PUT - Update room
export async function PUT(request: Request) {
  try {
    const user = await getUserSession();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'WAREHOUSE')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID ruangan wajib diisi' }, { status: 400 });
    }

    const room = await prisma.room.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error('Failed to update room:', error);
    return NextResponse.json({ error: 'Gagal update ruangan' }, { status: 500 });
  }
}

// DELETE - Soft delete room
export async function DELETE(request: Request) {
  try {
    const user = await getUserSession();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID ruangan wajib diisi' }, { status: 400 });
    }

    await prisma.room.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: 'Ruangan berhasil dihapus' });
  } catch (error) {
    console.error('Failed to delete room:', error);
    return NextResponse.json({ error: 'Gagal menghapus ruangan' }, { status: 500 });
  }
}
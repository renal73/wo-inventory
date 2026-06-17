import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET: Ambil daftar semua user (Admin only)
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'asc'
      }
    });
    // Hilangkan password hash atau info sensitif saat mengembalikan data user
    const usersMapped = users.map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString()
    }));
    return NextResponse.json(usersMapped);
  } catch (error) {
    console.error('Error GET /api/users:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memuat daftar user' },
      { status: 500 }
    );
  }
}

// POST: Tambah user baru (Admin only)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, name, role } = body;

    if (!username || !name || !role) {
      return NextResponse.json(
        { message: 'Kolom username, nama, dan role wajib diisi' },
        { status: 400 }
      );
    }

    // Periksa apakah username sudah terdaftar
    const existingUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: username.toLowerCase().trim(),
          mode: 'insensitive'
        }
      }
    });
    if (existingUser) {
      return NextResponse.json(
        { message: 'Username sudah digunakan' },
        { status: 400 }
      );
    }

    // Hash password default: username + '123'
    const defaultPassword = username.toLowerCase().trim() + '123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        username: username.toLowerCase().trim(),
        name: name.trim(),
        role: role as 'ADMIN' | 'USER',
        passwordHash,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User berhasil ditambahkan. Password default adalah: ' + newUser.username + '123',
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/users:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat membuat user baru' },
      { status: 500 }
    );
  }
}

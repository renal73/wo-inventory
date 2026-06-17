import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT: Perbarui data user (Admin only)
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, role, resetPassword } = body;

    if (!name || !role) {
      return NextResponse.json(
        { message: 'Kolom nama dan role wajib diisi' },
        { status: 400 }
      );
    }

    const updateData: { name: string; role: 'ADMIN' | 'USER'; passwordHash?: string } = {
      name: name.trim(),
      role: role as 'ADMIN' | 'USER'
    };

    let message = 'User berhasil diperbarui';
    if (resetPassword) {
      const defaultPassword = user.username + '123';
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      updateData.passwordHash = passwordHash;
      message = `User berhasil diperbarui. Password telah di-reset ke default: ${user.username}123`;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.name,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('Error PUT /api/users/[id]:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memperbarui user' },
      { status: 500 }
    );
  }
}

// DELETE: Hapus user (Admin only)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Jangan izinkan penghapusan admin utama
    if (id === 'usr-admin') {
      return NextResponse.json(
        { message: 'Akun Administrator utama tidak dapat dihapus' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'User berhasil dihapus'
    });
  } catch (error) {
    console.error('Error DELETE /api/users/[id]:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat menghapus user' },
      { status: 500 }
    );
  }
}

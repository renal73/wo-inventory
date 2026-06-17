import { NextResponse } from 'next/server';
import { decryptSession } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Sesi tidak ditemukan' },
        { status: 401 }
      );
    }

    const user = decryptSession(token);

    if (!user) {
      return NextResponse.json(
        { message: 'Sesi telah kadaluarsa atau tidak valid' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error di GET /api/auth/me:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan internal server' },
      { status: 500 }
    );
  }
}

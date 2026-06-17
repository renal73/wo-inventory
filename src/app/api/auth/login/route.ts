import { NextResponse } from 'next/server';
import { loginUser, encryptSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username dan password wajib diisi' },
        { status: 400 }
      );
    }

    const user = await loginUser(username, password);

    if (!user) {
      return NextResponse.json(
        { message: 'Username atau password salah' },
        { status: 401 }
      );
    }

    const token = encryptSession(user);
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });

    // Set cookie sesi (durasi 8 jam)
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60, // 8 jam dalam detik
    });

    return response;
  } catch (error) {
    console.error('Error saat login:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan internal server' },
      { status: 500 }
    );
  }
}

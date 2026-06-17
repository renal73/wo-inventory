import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Berhasil keluar'
    });

    // Hapus cookie sesi
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Error saat logout:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat keluar' },
      { status: 500 }
    );
  }
}

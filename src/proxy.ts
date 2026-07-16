import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Fungsi helper untuk membaca sesi menggunakan Node.js Buffer (aman untuk UTF-8)
function parseSession(token: string) {
  try {
    const payloadJson = Buffer.from(token, 'base64').toString('utf-8');
    const parsed = JSON.parse(payloadJson);
    
    // Cek durasi (8 jam)
    const delapanJam = 8 * 60 * 60 * 1000;
    if (Date.now() - parsed.timestamp > delapanJam) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Lewati static files dan aset next
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Ambil token sesi dari cookie
  const sessionCookie = request.cookies.get('session');
  const token = sessionCookie?.value;
  const user = token ? parseSession(token) : null;

  // Halaman Login & API Auth Login
  const isLoginPage = pathname === '/login';
  const isAuthApi = pathname.startsWith('/api/auth');

  // Jika belum login dan mengakses halaman yang butuh proteksi
  if (!user && !isLoginPage && !isAuthApi && !pathname.startsWith('/api/health') && !pathname.startsWith('/api/test-users')) {
    // Jika itu request API, kembalikan JSON 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { message: 'Silakan login terlebih dahulu' },
        { status: 401 }
      );
    }
    // Jika request halaman, redirect ke /login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Jika sudah login tetapi mencoba mengakses /login kembali
  if (user && isLoginPage) {
    const dashboardUrl = new URL('/', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Proteksi Khusus Role ADMIN (Halaman /admin dan API Admin-only)
  const isAdminPage = pathname.startsWith('/admin');
  const isAdminApi = 
    pathname.startsWith('/api/users') ||
    (pathname.startsWith('/api/machines') && (request.method !== 'GET')) || // Tulis mesin (POST/PUT/DELETE)
    (pathname.startsWith('/api/categories') && request.method !== 'GET') ||
    (pathname.startsWith('/api/purposes') && request.method !== 'GET') ||
    (pathname.startsWith('/api/parts') && request.method !== 'GET' && !pathname.includes('/history')) || // Tambah/edit/hapus parts
    pathname.startsWith('/api/parts/export') || // Export CSV
    (pathname.startsWith('/api/transactions/inbound') && request.method === 'POST') ||
    pathname.startsWith('/api/import-csv') ||
    pathname.startsWith('/api/seed');

  if (user && user.role !== 'ADMIN') {
    if (isAdminPage) {
      // Redirect ke halaman 403 Forbidden (atau dashboard dengan warning)
      const forbiddenUrl = new URL('/', request.url);
      forbiddenUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(forbiddenUrl);
    }
    if (isAdminApi) {
      return NextResponse.json(
        { message: 'Akses ditolak. Anda memerlukan peran Administrator.' },
        { status: 403 }
      );
    }
  }

  // Proteksi Khusus Role OPERATOR & QC_ANALYST
  if (user && (user.role === 'OPERATOR' || user.role === 'QC_ANALYST')) {
    // Hanya boleh akses: /, /tools, /maintenance/work-orders, dan /api/work-orders
    const isAllowedPage = 
      pathname === '/' || 
      pathname.startsWith('/tools') || 
      pathname.startsWith('/maintenance/work-orders');
      
    const isAllowedApi = 
      pathname.startsWith('/api/work-orders') || 
      pathname.startsWith('/api/tools') ||
      pathname.startsWith('/api/parts/history') ||
      pathname.startsWith('/api/health');
      // Note: /api/technicians hanya untuk Admin (protected by API itself)
      
    if (!isAllowedPage && !pathname.startsWith('/api/')) {
      if (pathname === '/maintenance') {
        const redirectUrl = new URL('/maintenance/work-orders', request.url);
        return NextResponse.redirect(redirectUrl);
      }
      const forbiddenUrl = new URL('/', request.url);
      forbiddenUrl.searchParams.set('error', 'unauthorized_role');
      return NextResponse.redirect(forbiddenUrl);
    }
    
    if (pathname.startsWith('/api/') && !isAllowedApi && !isAuthApi) {
      return NextResponse.json(
        { message: 'Akses API ditolak untuk role Anda.' },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

// Konfigurasi matcher untuk memproses semua path kecuali aset statis
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

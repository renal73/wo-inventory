import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { AuthProvider } from '@/components/auth/AuthContext';
import { ThemeProvider } from '@/components/theme/ThemeContext';
import { Shell } from '@/components/layout/Shell';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Anvita System — Sistem Manajemen Inventaris Suku Cadang',
  description: 'Sistem tunggal pencatatan inventaris suku cadang engineering PT Anvita Pharma Indonesia',
  icons: {
    icon: '/favicon.ico',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="h-full bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-200">
        <ThemeProvider>
          <AuthProvider>
            <Shell>{children}</Shell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

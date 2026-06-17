import prisma from './prisma';
import { User } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Mengubah payload sesi ke base64 string
export function encryptSession(user: Partial<User>): string {
  const payload = JSON.stringify({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    timestamp: Date.now()
  });
  return Buffer.from(payload).toString('base64');
}

// Membaca payload sesi dari base64 string
export function decryptSession(token: string): Partial<User> | null {
  try {
    const payloadJson = Buffer.from(token, 'base64').toString('utf-8');
    const parsed = JSON.parse(payloadJson);
    
    // Cek kadaluarsa sesi (8 jam = 8 * 60 * 60 * 1000 ms)
    const delapanJam = 8 * 60 * 60 * 1000;
    if (Date.now() - parsed.timestamp > delapanJam) {
      console.log('Sesi kadaluarsa');
      return null;
    }
    
    return {
      id: parsed.id,
      username: parsed.username,
      name: parsed.name,
      role: parsed.role
    };
  } catch (e) {
    console.error('Gagal mendekripsi sesi:', e);
    return null;
  }
}

// Melakukan verifikasi login secara asinkron menggunakan Prisma & Bcrypt
export async function loginUser(username: string, password: string): Promise<User | null> {
  try {
    const normalizedUsername = username.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { username: normalizedUsername }
    });
    
    if (!user) return null;

    // Bandingkan password dengan hash yang tersimpan
    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) return null;

    return user;
  } catch (error) {
    console.error('Error saat verifikasi login di auth helper:', error);
    return null;
  }
}

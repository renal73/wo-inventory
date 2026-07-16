import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    // Test mapping safe
    const mapped = users.map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      hasCreatedAt: !!u.createdAt,
      hasUpdatedAt: !!u.updatedAt,
      isDate: u.createdAt instanceof Date,
      createdAtValue: u.createdAt
    }));
    
    return NextResponse.json(mapped);
  } catch (error: any) {
    console.error('DEBUG ERROR:', error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}

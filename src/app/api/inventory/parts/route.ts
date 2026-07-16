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

// GET: Daftar parts dari inventory dengan filter
export async function GET(request: Request) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const categoryId = searchParams.get('categoryId') || '';
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true';
    const includeOutOfStock = searchParams.get('includeOutOfStock') !== 'false'; // default true

    const where: any = {};

    // Filter pencarian (ID/Kode, Nama Part)
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filter kategori
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Filter stok rendah saja
    if (lowStockOnly) {
      where.AND = [
        { stock: { gt: 0 } },
        { stock: { lte: prisma.part.fields.minStockAlert } }
      ];
    }

    // Filter stok habis (opsional)
    if (!includeOutOfStock) {
      where.stock = { gt: 0 };
    }

    const parts = await prisma.part.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true
          }
        }
      },
      orderBy: [
        { stock: 'asc' },
        { name: 'asc' }
      ]
    });

    // Enrich dengan status stok
    const enrichedParts = parts.map(p => {
      let stockStatus: 'ok' | 'low' | 'critical' | 'out';
      if (p.stock === 0) {
        stockStatus = 'out';
      } else if (p.stock <= p.minStockAlert) {
        stockStatus = 'critical';
      } else if (p.stock <= p.minStockAlert * 2) {
        stockStatus = 'low';
      } else {
        stockStatus = 'ok';
      }

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        stock: p.stock,
        minStockAlert: p.minStockAlert,
        price: p.price,
        rackLocation: p.rackLocation,
        vendor: p.vendor,
        stockStatus,
        isLowStock: p.stock <= p.minStockAlert,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString()
      };
    });

    return NextResponse.json(enrichedParts);
  } catch (error) {
    console.error('Error GET /api/inventory/parts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parts inventory' },
      { status: 500 }
    );
  }
}

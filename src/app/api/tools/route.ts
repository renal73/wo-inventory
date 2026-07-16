import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const tools = await prisma.tool.findMany({
      include: {
        pic: {
          select: { id: true, name: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(tools);
  } catch (error) {
    console.error('Error GET /api/tools:', error);
    return NextResponse.json({ message: 'Error fetching tools' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, brand, stock, picId } = body;

    if (!name || stock === undefined) {
      return NextResponse.json({ message: 'Name and stock are required' }, { status: 400 });
    }

    const newTool = await prisma.tool.create({
      data: {
        name: name.trim(),
        brand: brand ? brand.trim() : null,
        stock: Number(stock),
        picId: picId || null
      },
      include: {
        pic: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    return NextResponse.json({ success: true, tool: newTool }, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/tools:', error);
    return NextResponse.json({ message: 'Error creating tool' }, { status: 500 });
  }
}

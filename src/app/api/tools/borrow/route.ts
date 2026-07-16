import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const records = await prisma.toolBorrowRecord.findMany({
      include: {
        tool: true,
        user: {
          select: { id: true, name: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error GET /api/tools/borrow:', error);
    return NextResponse.json({ message: 'Error fetching borrow records' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { toolId, userId, quantity, notes } = body;

    if (!toolId || !userId || !quantity) {
      return NextResponse.json({ message: 'toolId, userId, and quantity are required' }, { status: 400 });
    }

    // Check stock
    const tool = await prisma.tool.findUnique({ where: { id: toolId } });
    if (!tool) {
      return NextResponse.json({ message: 'Tool not found' }, { status: 404 });
    }

    if (tool.stock < quantity) {
      return NextResponse.json({ message: 'Insufficient stock' }, { status: 400 });
    }

    const record = await prisma.toolBorrowRecord.create({
      data: {
        toolId,
        userId,
        quantity: Number(quantity),
        notes: notes ? notes.trim() : null,
        status: 'PENDING_BORROW'
      },
      include: {
        tool: true,
        user: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    return NextResponse.json({ success: true, record }, { status: 201 });
  } catch (error) {
    console.error('Error POST /api/tools/borrow:', error);
    return NextResponse.json({ message: 'Error creating borrow record' }, { status: 500 });
  }
}

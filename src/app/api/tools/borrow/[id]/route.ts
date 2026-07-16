import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body; // action: 'approve', 'reject', 'return', 'confirm-return'

    const record = await prisma.toolBorrowRecord.findUnique({
      where: { id },
      include: { tool: true }
    });

    if (!record) {
      return NextResponse.json({ message: 'Record not found' }, { status: 404 });
    }

    let updatedRecord;

    if (action === 'approve') {
      if (record.status !== 'PENDING_BORROW') {
        return NextResponse.json({ message: 'Invalid status for approval' }, { status: 400 });
      }
      
      // Reduce tool stock
      if (record.tool.stock < record.quantity) {
        return NextResponse.json({ message: 'Insufficient stock to approve' }, { status: 400 });
      }

      await prisma.tool.update({
        where: { id: record.toolId },
        data: { stock: { decrement: record.quantity } }
      });

      updatedRecord = await prisma.toolBorrowRecord.update({
        where: { id },
        data: { status: 'BORROWED', borrowedAt: new Date() },
        include: { tool: true, user: { select: { id: true, name: true, role: true } } }
      });

    } else if (action === 'reject') {
      if (record.status !== 'PENDING_BORROW') {
        return NextResponse.json({ message: 'Invalid status for rejection' }, { status: 400 });
      }

      updatedRecord = await prisma.toolBorrowRecord.update({
        where: { id },
        data: { status: 'REJECTED' },
        include: { tool: true, user: { select: { id: true, name: true, role: true } } }
      });

    } else if (action === 'return') {
      if (record.status !== 'BORROWED') {
        return NextResponse.json({ message: 'Invalid status for return' }, { status: 400 });
      }

      updatedRecord = await prisma.toolBorrowRecord.update({
        where: { id },
        data: { status: 'PENDING_RETURN' },
        include: { tool: true, user: { select: { id: true, name: true, role: true } } }
      });

    } else if (action === 'confirm-return') {
      if (record.status !== 'PENDING_RETURN' && record.status !== 'BORROWED') {
        return NextResponse.json({ message: 'Invalid status for return confirmation' }, { status: 400 });
      }

      // Increase tool stock
      await prisma.tool.update({
        where: { id: record.toolId },
        data: { stock: { increment: record.quantity } }
      });

      updatedRecord = await prisma.toolBorrowRecord.update({
        where: { id },
        data: { status: 'RETURNED', returnedAt: new Date() },
        include: { tool: true, user: { select: { id: true, name: true, role: true } } }
      });

    } else {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, record: updatedRecord });
  } catch (error) {
    console.error('Error PUT /api/tools/borrow/[id]:', error);
    return NextResponse.json({ message: 'Error updating borrow record' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, brand, stock, picId } = body;

    if (!name || stock === undefined) {
      return NextResponse.json({ message: 'Name and stock are required' }, { status: 400 });
    }

    const updatedTool = await prisma.tool.update({
      where: { id },
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

    return NextResponse.json({ success: true, tool: updatedTool });
  } catch (error) {
    console.error('Error PUT /api/tools/[id]:', error);
    return NextResponse.json({ message: 'Error updating tool' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    await prisma.tool.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Tool deleted successfully' });
  } catch (error) {
    console.error('Error DELETE /api/tools/[id]:', error);
    return NextResponse.json({ message: 'Error deleting tool' }, { status: 500 });
  }
}

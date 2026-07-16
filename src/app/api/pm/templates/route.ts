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

export async function GET(request: Request) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await prisma.pmTemplate.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { name: true } },
        defaultTech: { select: { name: true } }
      }
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching PM templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserSession();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized or Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, equipmentName, description, classification, frequency, estimatedDuration, checklistItems, defaultTechId } = body;

    const template = await prisma.pmTemplate.create({
      data: {
        name,
        equipmentName,
        description,
        classification,
        frequency,
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : null,
        checklistItems: checklistItems ? (typeof checklistItems === 'string' ? checklistItems : JSON.stringify(checklistItems)) : "[]",
        defaultTechId: defaultTechId || null,
        createdById: user.id
      }
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating PM template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}

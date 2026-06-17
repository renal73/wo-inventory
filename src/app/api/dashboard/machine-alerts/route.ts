import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const machines = await prisma.machine.findMany({
      include: {
        machineParts: {
          include: {
            part: true
          }
        }
      }
    });

    const alerts: any[] = [];

    machines.forEach(machine => {
      const criticalParts: any[] = [];

      machine.machineParts.forEach(mp => {
        if (mp.part && mp.part.stock < mp.recommendedMinQty) {
          criticalParts.push({
            partId: mp.partId,
            name: mp.part.name,
            stock: mp.part.stock,
            recommendedMinQty: mp.recommendedMinQty
          });
        }
      });

      if (criticalParts.length > 0) {
        alerts.push({
          id: machine.id,
          name: machine.name,
          area: machine.area || 'Tanpa Area',
          status: machine.status,
          criticalCount: criticalParts.length,
          criticalParts
        });
      }
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Error GET /api/dashboard/machine-alerts:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat memuat alert mesin' },
      { status: 500 }
    );
  }
}

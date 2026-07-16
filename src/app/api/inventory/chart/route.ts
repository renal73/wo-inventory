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

// GET /api/inventory/chart - Get inbound/outbound chart data
export async function GET(request: Request) {
  try {
    // Skip auth for development
    // const user = await getUserSession();
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    
    // Calculate date range
    const end = new Date();
    const start = new Date();
    
    switch (period) {
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setDate(start.getDate() - 30);
    }

    // Get inbound transactions
    const inboundTransactions = await prisma.inboundTransaction.findMany({
      where: { date: { gte: start } },
      select: { quantity: true, price: true, date: true }
    });

    // Get outbound transactions
    const outboundTransactions = await prisma.outboundTransaction.findMany({
      where: { date: { gte: start } },
      select: { quantity: true, date: true }
    });

    // Calculate daily data for the last 30 days
    const dailyData: { date: string; inbound: number; outbound: number; inboundValue: number }[] = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayInbound = inboundTransactions.filter((t) => 
        t.date.toISOString().split('T')[0] === dateStr
      );
      const dayOutbound = outboundTransactions.filter((t) => 
        t.date.toISOString().split('T')[0] === dateStr
      );
      
      dailyData.push({
        date: dateStr,
        inbound: dayInbound.reduce((acc, t) => acc + t.quantity, 0),
        outbound: dayOutbound.reduce((acc, t) => acc + t.quantity, 0),
        inboundValue: dayInbound.reduce((acc, t) => acc + (t.quantity * t.price), 0)
      });
    }

    // Monthly aggregation for comparison
    const monthlyData: { month: string; inbound: number; outbound: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      
      const monthInbound = inboundTransactions.filter((t) => 
        t.date >= monthStart && t.date < monthEnd
      ).reduce((acc, t) => acc + t.quantity, 0);
      
      const monthOutbound = outboundTransactions.filter((t) => 
        t.date >= monthStart && t.date < monthEnd
      ).reduce((acc, t) => acc + t.quantity, 0);
      
      monthlyData.push({
        month: monthStart.toLocaleDateString('id-ID', { month: 'short' }),
        inbound: monthInbound,
        outbound: monthOutbound
      });
    }

    // Get all parts for summary
    const allParts = await prisma.part.findMany({
      select: { 
        id: true, 
        name: true, 
        stock: true, 
        minStockAlert: true, 
        price: true 
      }
    });

    const totalParts = allParts.length;
    const totalPartValue = allParts.reduce((acc, p) => acc + ((p.stock || 0) * (p.price || 0)), 0);
    const lowStockParts = allParts.filter(p => (p.stock || 0) < (p.minStockAlert || 0)).length;
    const totalTransactions = inboundTransactions.length + outboundTransactions.length;

    // Summary stats
    const totalInbound = inboundTransactions.reduce((acc, t) => acc + t.quantity, 0);
    const totalOutbound = outboundTransactions.reduce((acc, t) => acc + t.quantity, 0);
    const totalValue = inboundTransactions.reduce((acc, t) => acc + (t.quantity * t.price), 0);
    const avgDailyInbound = Math.round(totalInbound / 30);
    const avgDailyOutbound = Math.round(totalOutbound / 30);

    // Top inbound parts
    const inboundByPart = await prisma.inboundTransaction.groupBy({
      by: ['partId'],
      where: { date: { gte: start } },
      _sum: { quantity: true }
    });

    const topInboundParts = await Promise.all(
      inboundByPart
        .sort((a, b) => ((b._sum.quantity || 0) as number) - ((a._sum.quantity || 0) as number))
        .slice(0, 5)
        .map(async (item) => {
          const part = await prisma.part.findUnique({
            where: { id: item.partId },
            select: { id: true, name: true }
          });
          return {
            partId: item.partId,
            partName: part?.name || item.partId,
            quantity: (item._sum.quantity || 0) as number
          };
        })
    );

    // Top outbound parts
    const outboundByPart = await prisma.outboundTransaction.groupBy({
      by: ['partId'],
      where: { date: { gte: start } },
      _sum: { quantity: true }
    });

    const topOutboundParts = await Promise.all(
      outboundByPart
        .sort((a, b) => ((b._sum.quantity || 0) as number) - ((a._sum.quantity || 0) as number))
        .slice(0, 5)
        .map(async (item) => {
          const part = await prisma.part.findUnique({
            where: { id: item.partId },
            select: { id: true, name: true }
          });
          return {
            partId: item.partId,
            partName: part?.name || item.partId,
            quantity: (item._sum.quantity || 0) as number
          };
        })
    );

    return NextResponse.json({
      dailyData,
      monthlyData,
      summary: {
        totalInbound,
        totalOutbound,
        totalValue,
        avgDailyInbound,
        avgDailyOutbound,
        netFlow: totalInbound - totalOutbound
      },
      topInboundParts,
      topOutboundParts,
      // Additional summary data for dashboard
      totalParts,
      totalValue: totalPartValue,
      lowStockParts,
      totalTransactions
    });
  } catch (error) {
    console.error('Error GET /api/inventory/chart:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

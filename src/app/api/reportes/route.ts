import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/reportes
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'summary';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dateFilter: any = {};
  if (dateFrom) dateFilter.gte = new Date(dateFrom);
  if (dateTo) dateFilter.lte = new Date(dateTo + 'T23:59:59');

  try {
    if (type === 'summary') {
      const [byCategory, byStatus, byProvider, totals] = await Promise.all([
        prisma.contract.groupBy({
          by: ['category'],
          where: { isDeleted: false, ...(dateFrom || dateTo ? { createdAt: dateFilter } : {}) },
          _count: { id: true },
          _sum: { amount: true },
        }),
        prisma.contract.groupBy({
          by: ['status'],
          where: { isDeleted: false, ...(dateFrom || dateTo ? { createdAt: dateFilter } : {}) },
          _count: { id: true },
        }),
        prisma.contract.findMany({
          where: { isDeleted: false, ...(dateFrom || dateTo ? { createdAt: dateFilter } : {}) },
          select: {
            providerId: true,
            amount: true,
            provider: { select: { name: true } },
          },
        }),
        prisma.contract.aggregate({
          where: { isDeleted: false, ...(dateFrom || dateTo ? { createdAt: dateFilter } : {}) },
          _count: { id: true },
          _sum: { amount: true },
        }),
      ]);

      // Agrupar montos por proveedor
      const providerTotals = byProvider.reduce((acc, c) => {
        const key = c.providerId;
        if (!acc[key]) acc[key] = { name: c.provider.name, total: 0, count: 0 };
        acc[key].total += Number(c.amount);
        acc[key].count++;
        return acc;
      }, {} as Record<string, { name: string; total: number; count: number }>);

      return NextResponse.json({
        byCategory: byCategory.map(c => ({
          category: c.category,
          count: c._count.id,
          totalAmount: c._sum.amount ? Number(c._sum.amount) : 0,
        })),
        byStatus: byStatus.map(s => ({ status: s.status, count: s._count.id })),
        byProvider: Object.values(providerTotals).sort((a, b) => b.total - a.total).slice(0, 10),
        totals: {
          count: totals._count.id,
          totalAmount: totals._sum.amount ? Number(totals._sum.amount) : 0,
        },
      });
    }

    if (type === 'expiring') {
      const now = new Date();
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const contracts = await prisma.contract.findMany({
        where: { status: 'ACTIVO', isDeleted: false, endDate: { gte: now, lte: in30Days } },
        include: { provider: { select: { name: true } } },
        orderBy: { endDate: 'asc' },
      });
      return NextResponse.json({ contracts });
    }

    if (type === 'rescinded') {
      const contracts = await prisma.contract.findMany({
        where: { status: 'RESCINDIDO', isDeleted: false, ...(dateFrom || dateTo ? { updatedAt: dateFilter } : {}) },
        include: {
          provider: { select: { name: true } },
          rescission: { select: { reason: true, date: true, user: { select: { name: true } } } },
        },
        orderBy: { updatedAt: 'desc' },
      });
      return NextResponse.json({ contracts });
    }

    return NextResponse.json({ error: 'Tipo de reporte no válido' }, { status: 400 });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Error al generar reporte' }, { status: 500 });
  }
}

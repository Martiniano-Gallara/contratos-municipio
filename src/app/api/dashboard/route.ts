import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      totalContracts,
      activeContracts,
      expiringContracts,
      expiredContracts,
      draftContracts,
      rescindedContracts,
      byCategory,
      totalProviders,
      recentActivity,
      ipcPendingContracts,
    ] = await Promise.all([
      // Total de contratos (no eliminados)
      prisma.contract.count({ where: { isDeleted: false } }),
      // Contratos activos
      prisma.contract.count({ where: { status: 'ACTIVO', isDeleted: false } }),
      // Por vencer (activos con endDate en próximos 30 días)
      prisma.contract.count({
        where: {
          status: 'ACTIVO',
          isDeleted: false,
          endDate: { gte: now, lte: in30Days },
        },
      }),
      // Vencidos
      prisma.contract.count({ where: { status: 'VENCIDO', isDeleted: false } }),
      // Borradores
      prisma.contract.count({ where: { status: 'BORRADOR', isDeleted: false } }),
      // Rescindidos
      prisma.contract.count({ where: { status: 'RESCINDIDO', isDeleted: false } }),
      // Por categoría
      prisma.contract.groupBy({
        by: ['category'],
        where: { isDeleted: false },
        _count: { id: true },
      }),
      // Total proveedores activos
      prisma.provider.count({ where: { active: true } }),
      // Últimos movimientos (auditoría reciente)
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } },
      }),
      // Contratos con ajuste IPC pendiente (activos, ipc habilitado, fecha de ajuste ya pasada)
      prisma.contract.findMany({
        where: {
          isDeleted: false,
          status: 'ACTIVO',
          ipcEnabled: true,
          ipcNextAdjustment: { lte: now },
        },
        select: {
          id: true,
          code: true,
          description: true,
          amount: true,
          currency: true,
          ipcPeriodMonths: true,
          ipcLastAdjustment: true,
          ipcNextAdjustment: true,
          provider: { select: { name: true } },
        },
        orderBy: { ipcNextAdjustment: 'asc' },
      }),
    ]);

    // Contratos por vencer (detalle)
    const expiringDetails = await prisma.contract.findMany({
      where: {
        status: 'ACTIVO',
        isDeleted: false,
        endDate: { gte: now, lte: in30Days },
      },
      select: {
        id: true,
        code: true,
        description: true,
        endDate: true,
        provider: { select: { name: true } },
      },
      orderBy: { endDate: 'asc' },
      take: 5,
    });

    return NextResponse.json({
      stats: {
        totalContracts,
        activeContracts,
        expiringContracts,
        expiredContracts,
        draftContracts,
        rescindedContracts,
        totalProviders,
        ipcPendingCount: ipcPendingContracts.length,
        byCategory: byCategory.map(c => ({
          category: c.category,
          count: c._count.id,
        })),
      },
      expiringDetails,
      ipcPendingDetails: ipcPendingContracts.map(c => ({
        id: c.id,
        code: c.code,
        description: c.description,
        amount: c.amount,
        currency: c.currency,
        ipcPeriodMonths: c.ipcPeriodMonths,
        ipcLastAdjustment: c.ipcLastAdjustment,
        ipcNextAdjustment: c.ipcNextAdjustment,
        provider: c.provider,
      })),
      recentActivity: recentActivity.map(log => ({
        id: log.id,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        user: log.user.name,
        createdAt: log.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos del dashboard' },
      { status: 500 }
    );
  }
}

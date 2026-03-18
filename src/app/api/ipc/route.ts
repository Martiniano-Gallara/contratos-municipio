import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/ipc — Listar todos los contratos con IPC habilitado
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const now = new Date();

    const contracts = await prisma.contract.findMany({
      where: {
        isDeleted: false,
        ipcEnabled: true,
      },
      include: {
        provider: { select: { id: true, name: true } },
      },
      orderBy: { ipcNextAdjustment: 'asc' },
    });

    const pending = contracts.filter(
      (c) => c.ipcNextAdjustment && c.ipcNextAdjustment <= now && c.status === 'ACTIVO'
    );
    const upcoming = contracts.filter(
      (c) => c.ipcNextAdjustment && c.ipcNextAdjustment > now && c.status === 'ACTIVO'
    );

    return NextResponse.json({
      pending: pending.map((c) => ({
        id: c.id,
        code: c.code,
        description: c.description,
        amount: c.amount,
        isHourly: c.isHourly,
        currency: c.currency,
        status: c.status,
        ipcPeriodMonths: c.ipcPeriodMonths,
        ipcLastAdjustment: c.ipcLastAdjustment,
        ipcNextAdjustment: c.ipcNextAdjustment,
        startDate: c.startDate,
        endDate: c.endDate,
        provider: c.provider,
      })),
      upcoming: upcoming.map((c) => ({
        id: c.id,
        code: c.code,
        description: c.description,
        amount: c.amount,
        isHourly: c.isHourly,
        currency: c.currency,
        status: c.status,
        ipcPeriodMonths: c.ipcPeriodMonths,
        ipcLastAdjustment: c.ipcLastAdjustment,
        ipcNextAdjustment: c.ipcNextAdjustment,
        startDate: c.startDate,
        endDate: c.endDate,
        provider: c.provider,
      })),
      totalIpc: contracts.length,
      pendingCount: pending.length,
    });
  } catch (error) {
    console.error('Error fetching IPC data:', error);
    return NextResponse.json({ error: 'Error al obtener datos IPC' }, { status: 500 });
  }
}

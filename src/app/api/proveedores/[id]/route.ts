import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;

  try {
    const provider = await prisma.provider.findUnique({
      where: { id },
      include: {
        contracts: {
          where: { isDeleted: false },
          include: {
            _count: { select: { documents: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    const totalAmount = provider.contracts.reduce((sum, c) => sum + Number(c.amount), 0);
    const totalTime = provider.contracts.reduce((sum, c) => {
      const start = new Date(c.startDate).getTime();
      const end = new Date(c.endDate).getTime();
      return sum + (end - start);
    }, 0);
    const totalDays = Math.round(totalTime / (1000 * 60 * 60 * 24));

    return NextResponse.json({
      ...provider,
      totalAmount,
      totalDays,
      totalContracts: provider.contracts.length,
    });
  } catch (error) {
    console.error('Error fetching provider:', error);
    return NextResponse.json({ error: 'Error al obtener proveedor' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!hasPermission(session.user.role, 'providers.update')) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const provider = await prisma.provider.update({
      where: { id },
      data: {
        name: body.name,
        tradeName: body.tradeName,
        sector: body.sector,
        phone: body.phone,
        email: body.email,
        address: body.address,
        active: body.active,
        notes: body.notes,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: 'UPDATE',
      entity: 'Provider',
      entityId: id,
      newValue: body,
    });

    return NextResponse.json(provider);
  } catch (error) {
    console.error('Error updating provider:', error);
    return NextResponse.json({ error: 'Error al actualizar proveedor' }, { status: 500 });
  }
}

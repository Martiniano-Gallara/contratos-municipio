import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';

// GET /api/contratos/[id] - Obtener contrato con detalle completo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;

  try {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        provider: true,
        createdBy: { select: { name: true, email: true } },
        updatedBy: { select: { name: true, email: true } },
        documents: {
          orderBy: { createdAt: 'desc' },
          include: { uploadedBy: { select: { name: true } } },
        },
        history: {
          orderBy: { createdAt: 'desc' },
          include: { changedBy: { select: { name: true } } },
        },
        rescission: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    if (!contract || contract.isDeleted) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    return NextResponse.json(contract);
  } catch (error) {
    console.error('Error fetching contract:', error);
    return NextResponse.json({ error: 'Error al obtener contrato' }, { status: 500 });
  }
}

// PUT /api/contratos/[id] - Actualizar contrato
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!hasPermission(session.user.role, 'contracts.update')) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const fields = ['category', 'status', 'description', 'observations', 'amount', 'currency', 'startDate', 'endDate', 'providerId', 'isHourly', 'paymentMethod', 'ipcEnabled', 'ipcPeriodMonths'];

    // Registrar cambios en historial
    const historyRecords = [];
    for (const field of fields) {
      if (body[field] !== undefined) {
        const oldVal = String((existing as Record<string, unknown>)[field] ?? '');
        const newVal = String(body[field]);
        if (oldVal !== newVal) {
          historyRecords.push({
            contractId: id,
            field,
            oldValue: oldVal,
            newValue: newVal,
            changedById: session.user.id,
          });
        }
      }
    }

    // Preparar datos actualizados
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { updatedById: session.user.id };
    if (body.category) updateData.category = body.category;
    if (body.status) updateData.status = body.status;
    if (body.description) updateData.description = body.description;
    if (body.observations !== undefined) updateData.observations = body.observations;
    if (body.amount) updateData.amount = parseFloat(body.amount);
    if (body.currency) updateData.currency = body.currency;
    if (body.startDate) updateData.startDate = new Date(body.startDate);
    if (body.endDate) updateData.endDate = new Date(body.endDate);
    if (body.providerId) updateData.providerId = body.providerId;
    if (body.isHourly !== undefined) updateData.isHourly = body.isHourly;
    if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod;
    if (body.ipcEnabled !== undefined) updateData.ipcEnabled = body.ipcEnabled;
    if (body.ipcPeriodMonths !== undefined) updateData.ipcPeriodMonths = parseInt(body.ipcPeriodMonths);

    const [contract] = await Promise.all([
      prisma.contract.update({
        where: { id },
        data: updateData,
        include: { provider: true },
      }),
      historyRecords.length > 0
        ? prisma.contractHistory.createMany({ data: historyRecords })
        : Promise.resolve(),
    ]);

    await createAuditLog({
      userId: session.user.id,
      action: 'UPDATE',
      entity: 'Contract',
      entityId: id,
      oldValue: historyRecords.map(h => ({ field: h.field, oldValue: h.oldValue })),
      newValue: historyRecords.map(h => ({ field: h.field, newValue: h.newValue })),
    });

    return NextResponse.json(contract);
  } catch (error) {
    console.error('Error updating contract:', error);
    return NextResponse.json({ error: 'Error al actualizar contrato' }, { status: 500 });
  }
}

// DELETE /api/contratos/[id] - Borrado lógico
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!hasPermission(session.user.role, 'contracts.delete')) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing || existing.isDeleted) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    await prisma.contract.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    await createAuditLog({
      userId: session.user.id,
      action: 'DELETE',
      entity: 'Contract',
      entityId: id,
      oldValue: { code: existing.code, status: existing.status },
    });

    return NextResponse.json({ message: 'Contrato eliminado' });
  } catch (error) {
    console.error('Error deleting contract:', error);
    return NextResponse.json({ error: 'Error al eliminar contrato' }, { status: 500 });
  }
}

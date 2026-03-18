import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';

// POST /api/contratos/[id]/rescindir - Rescindir contrato
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!hasPermission(session.user.role, 'contracts.rescind')) {
    return NextResponse.json({ error: 'Sin permisos para rescindir' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const contract = await prisma.contract.findUnique({ where: { id } });
    if (!contract || contract.isDeleted) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    if (contract.status === 'RESCINDIDO') {
      return NextResponse.json({ error: 'El contrato ya está rescindido' }, { status: 400 });
    }

    const body = await request.json();
    const { reason, justification, date } = body;

    if (!reason || !justification) {
      return NextResponse.json({
        error: 'Motivo y justificación son obligatorios para rescindir',
      }, { status: 400 });
    }

    // Transacción: actualizar estado + crear registro de rescisión + historial
    const [updated] = await prisma.$transaction([
      prisma.contract.update({
        where: { id },
        data: {
          status: 'RESCINDIDO',
          updatedById: session.user.id,
        },
      }),
      prisma.rescissionRecord.create({
        data: {
          contractId: id,
          reason,
          justification,
          date: date ? new Date(date) : new Date(),
          userId: session.user.id,
        },
      }),
      prisma.contractHistory.create({
        data: {
          contractId: id,
          field: 'status',
          oldValue: contract.status,
          newValue: 'RESCINDIDO',
          changedById: session.user.id,
        },
      }),
    ]);

    await createAuditLog({
      userId: session.user.id,
      action: 'RESCIND',
      entity: 'Contract',
      entityId: id,
      oldValue: { status: contract.status },
      newValue: { status: 'RESCINDIDO', reason, justification },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error rescinding contract:', error);
    return NextResponse.json({ error: 'Error al rescindir contrato' }, { status: 500 });
  }
}

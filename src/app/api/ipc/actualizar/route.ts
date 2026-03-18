import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';

// POST /api/ipc/actualizar — Actualización masiva por porcentaje IPC
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!hasPermission(session.user.role, 'contracts.update')) {
    return NextResponse.json({ error: 'Sin permisos para actualizar contratos' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { contractIds, percentage } = body;

    if (!contractIds || !Array.isArray(contractIds) || contractIds.length === 0) {
      return NextResponse.json({ error: 'Debe seleccionar al menos un contrato' }, { status: 400 });
    }
    if (percentage === undefined || percentage === null || isNaN(Number(percentage)) || Number(percentage) <= 0) {
      return NextResponse.json({ error: 'Debe ingresar un porcentaje válido mayor a 0' }, { status: 400 });
    }

    const pct = Number(percentage);
    const multiplier = 1 + pct / 100;
    const now = new Date();

    const results = [];

    for (const id of contractIds) {
      const contract = await prisma.contract.findUnique({ where: { id } });
      if (!contract || contract.isDeleted || !contract.ipcEnabled) continue;

      const oldAmount = contract.amount;
      const newAmount = Math.round(oldAmount * multiplier * 100) / 100;

      // Calcular próxima fecha de ajuste
      const nextAdj = new Date(now);
      nextAdj.setMonth(nextAdj.getMonth() + contract.ipcPeriodMonths);

      // Actualizar contrato
      await prisma.contract.update({
        where: { id },
        data: {
          amount: newAmount,
          ipcLastAdjustment: now,
          ipcNextAdjustment: nextAdj,
        },
      });

      // Registrar en historial
      await prisma.contractHistory.create({
        data: {
          contractId: id,
          field: 'amount (Ajuste IPC)',
          oldValue: `$${oldAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
          newValue: `$${newAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })} (+${pct}% IPC)`,
          changedById: session.user.id,
        },
      });

      // Audit log
      await createAuditLog({
        userId: session.user.id,
        action: 'UPDATE',
        entity: 'Contract',
        entityId: id,
        oldValue: { amount: oldAmount },
        newValue: { amount: newAmount, ipcPercentage: pct },
      });

      results.push({ id, code: contract.code, oldAmount, newAmount });
    }

    return NextResponse.json({
      message: `${results.length} contrato(s) actualizado(s) con ${pct}% IPC`,
      updated: results,
    });
  } catch (error) {
    console.error('Error updating IPC:', error);
    return NextResponse.json({ error: 'Error al actualizar contratos' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';

// GET /api/contratos - Listar contratos con filtros y paginación
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const category = searchParams.get('category') || '';
  const providerId = searchParams.get('providerId') || '';
  const startDateFrom = searchParams.get('startDateFrom') || '';
  const startDateTo = searchParams.get('startDateTo') || '';
  const endDateFrom = searchParams.get('endDateFrom') || '';
  const endDateTo = searchParams.get('endDateTo') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const expiring = searchParams.get('expiring') === 'true';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { isDeleted: false };

  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { provider: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  if (status) where.status = status;
  if (category) where.category = category;
  if (providerId) where.providerId = providerId;

  if (startDateFrom || startDateTo) {
    where.startDate = {};
    if (startDateFrom) where.startDate.gte = new Date(startDateFrom);
    if (startDateTo) where.startDate.lte = new Date(startDateTo);
  }

  if (endDateFrom || endDateTo) {
    where.endDate = {};
    if (endDateFrom) where.endDate.gte = new Date(endDateFrom);
    if (endDateTo) where.endDate.lte = new Date(endDateTo);
  }

  if (expiring) {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    where.status = 'ACTIVO';
    where.endDate = { gte: now, lte: in30Days };
  }

  try {
    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        include: {
          provider: { select: { id: true, name: true, tradeName: true } },
          createdBy: { select: { name: true } },
          _count: { select: { documents: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contract.count({ where }),
    ]);

    return NextResponse.json({
      contracts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error listing contracts:', error);
    return NextResponse.json({ error: 'Error al listar contratos' }, { status: 500 });
  }
}

// POST /api/contratos - Crear contrato
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!hasPermission(session.user.role, 'contracts.create')) {
    return NextResponse.json({ error: 'Sin permisos para crear contratos' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { code, category, status, description, observations, amount, currency, paymentMethod, isHourly, startDate, endDate, providerId, ipcEnabled, ipcPeriodMonths } = body;

    // Validaciones
    if (!code || !category || !description || !amount || !startDate || !endDate || !providerId) {
      return NextResponse.json({ error: 'Campos obligatorios faltantes' }, { status: 400 });
    }

    // Verificar código único
    const existing = await prisma.contract.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: 'El código de contrato ya existe' }, { status: 409 });
    }

    // Calcular fecha de próximo ajuste IPC si está habilitado
    const startDateObj = new Date(startDate);
    let ipcNextAdj: Date | null = null;
    if (ipcEnabled) {
      const period = parseInt(ipcPeriodMonths) || 3;
      ipcNextAdj = new Date(startDateObj);
      ipcNextAdj.setMonth(ipcNextAdj.getMonth() + period);
    }

    const contract = await prisma.contract.create({
      data: {
        code,
        category,
        status: status || 'BORRADOR',
        description,
        observations: observations || null,
        amount: parseFloat(amount),
        currency: currency || 'ARS',
        paymentMethod: paymentMethod || null,
        isHourly: !!isHourly,
        startDate: startDateObj,
        endDate: new Date(endDate),
        providerId,
        createdById: session.user.id,
        ipcEnabled: !!ipcEnabled,
        ipcPeriodMonths: parseInt(ipcPeriodMonths) || 3,
        ipcLastAdjustment: ipcEnabled ? startDateObj : null,
        ipcNextAdjustment: ipcNextAdj,
      },
      include: {
        provider: true,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: 'CREATE',
      entity: 'Contract',
      entityId: contract.id,
      newValue: { code, category, amount, providerId },
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error('Error creating contract:', error);
    return NextResponse.json({ error: 'Error al crear contrato' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';

// GET /api/proveedores
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const active = searchParams.get('active');
  const sector = searchParams.get('sector') || '';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { tradeName: { contains: search, mode: 'insensitive' } },
      { dniCuit: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (active !== null && active !== undefined && active !== '') where.active = active === 'true';
  if (sector) where.sector = sector;

  try {
    const [providers, total] = await Promise.all([
      prisma.provider.findMany({
        where,
        include: {
          _count: { select: { contracts: true } },
          contracts: {
            where: { isDeleted: false },
            select: { amount: true, status: true, endDate: true },
            orderBy: { endDate: 'desc' },
          },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.provider.count({ where }),
    ]);

    const enriched = providers.map(p => {
      const totalAmount = p.contracts.reduce((sum, c) => sum + Number(c.amount), 0);
      const activeContracts = p.contracts.filter(c => c.status === 'ACTIVO').length;
      const lastContract = p.contracts[0];
      const nextExpiry = p.contracts
        .filter(c => c.status === 'ACTIVO' && new Date(c.endDate) > new Date())
        .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())[0];

      return {
        ...p,
        contracts: undefined,
        totalAmount,
        activeContracts,
        totalContracts: p._count.contracts,
        lastContractDate: lastContract?.endDate || null,
        nextExpiry: nextExpiry?.endDate || null,
      };
    });

    return NextResponse.json({
      providers: enriched,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error listing providers:', error);
    return NextResponse.json({ error: 'Error al listar proveedores' }, { status: 500 });
  }
}

// POST /api/proveedores
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!hasPermission(session.user.role, 'providers.create')) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, tradeName, dniCuit, sector, phone, email, address, notes } = body;

    if (!name || !dniCuit) {
      return NextResponse.json({ error: 'Nombre y DNI/CUIT son obligatorios' }, { status: 400 });
    }

    const existing = await prisma.provider.findUnique({ where: { dniCuit } });
    if (existing) {
      return NextResponse.json({ error: 'Ya existe un proveedor con ese DNI/CUIT' }, { status: 409 });
    }

    const provider = await prisma.provider.create({
      data: { name, tradeName, dniCuit, sector, phone, email, address, notes },
    });

    await createAuditLog({
      userId: session.user.id,
      action: 'CREATE',
      entity: 'Provider',
      entityId: provider.id,
      newValue: { name, dniCuit },
    });

    return NextResponse.json(provider, { status: 201 });
  } catch (error) {
    console.error('Error creating provider:', error);
    return NextResponse.json({ error: 'Error al crear proveedor' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// POST /api/documentos/upload
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const contractId = formData.get('contractId') as string;
    const name = formData.get('name') as string;
    const type = formData.get('type') as string || 'CONTRATO_ORIGINAL';

    if (!file || !contractId || !name) {
      return NextResponse.json({ error: 'Archivo, contrato y nombre son obligatorios' }, { status: 400 });
    }

    // Validar tipo de archivo
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Solo se permiten archivos PDF' }, { status: 400 });
    }

    // Validar tamaño (10MB max)
    const maxSize = parseInt(process.env.MAX_FILE_SIZE_MB || '10') * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'El archivo excede el tamaño máximo permitido' }, { status: 400 });
    }

    // Crear directorio de uploads si no existe
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', contractId);
    await mkdir(uploadDir, { recursive: true });

    // Generar nombre de archivo seguro
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${safeName}`;
    const filePath = path.join(uploadDir, fileName);

    // Guardar archivo
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Registrar en base de datos
    const document = await prisma.document.create({
      data: {
        name,
        type: type as 'CONTRATO_ORIGINAL' | 'ADENDA' | 'ANEXO' | 'RESCISION' | 'COMPROBANTE' | 'OTRO',
        filePath: `/uploads/${contractId}/${fileName}`,
        fileSize: file.size,
        mimeType: file.type,
        contractId,
        uploadedById: session.user.id,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: 'UPLOAD',
      entity: 'Document',
      entityId: document.id,
      newValue: { name, type, contractId },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Error al subir documento' }, { status: 500 });
  }
}

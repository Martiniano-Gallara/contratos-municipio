import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function d(day: number, month: number, year: number): Date {
  return new Date(year, month - 1, day);
}

// [nombre, cuit, startDate, endDate, amount, isHourly, paymentMethod, ipcEnabled, ipcPeriodMonths, observations, category]
type ContractRow = [string, string, Date, Date, number, boolean, string | null, boolean, number, string | null, string];

const contracts: ContractRow[] = [
  ['ACOSTA EDUARDO DAMIAN',       '20-10000001-0', d(1,3,2026),  d(28,2,2027),  716000,     false, null, true,  3, null, 'SERVICIOS'],
  ['ALGARBES MARTIN ARIEL',       '20-10000002-0', d(1,12,2025), d(30,6,2026),  398412,     false, null, false, 3, null, 'SERVICIOS'],
  ['APONOSOVICH MARIO OSCAR',     '20-10000003-0', d(1,1,2026),  d(30,6,2026),  800000,     false, null, false, 3, null, 'SERVICIOS'],
  ['ARROYO LOS LEONES S.A.S.',    '30-10000004-0', d(1,2,2026),  d(30,6,2026),  3500000,    false, null, false, 3, null, 'SERVICIOS'],
  ['ARROYO NESTOR DANIEL',        '20-10000005-0', d(1,3,2026),  d(30,6,2026),  1200000,    false, null, false, 3, null, 'SERVICIOS'],
  ['BALLATORE MARIELA BEATRIZ',   '27-10000006-0', d(1,3,2026),  d(30,6,2026),  1600000,    false, null, false, 3, null, 'SERVICIOS'],
  ['BARBIAN DELIA',                '27-10000007-0', d(1,1,2024),  d(10,12,2027), 300000,     false, null, false, 3, null, 'SERVICIOS'],
  ['BERSANO MARIA AGOSTINA',      '27-10000008-0', d(27,2,2026), d(30,6,2026),  368000,     false, null, false, 3, null, 'SERVICIOS'],
  ['BOCCARDI LUCAS EMANUEL',      '20-10000009-0', d(1,1,2026),  d(31,5,2026),  1250000,    false, null, false, 3, null, 'SERVICIOS'],
  ['BONETTO MARIA BELEN',         '27-10000010-0', d(1,3,2026),  d(30,6,2026),  15000,      true,  'Por hora',  true,  3, null, 'SERVICIOS'],
  ['BOZZANA ANABELLA',             '27-10000011-0', d(1,12,2025), d(30,6,2026),  1800000,    false, null, false, 3, null, 'SERVICIOS'],
  ['BRIOLINI ROLDAN LUCILA',      '27-10000012-0', d(1,1,2026),  d(30,6,2026),  360000,     false, null, false, 3, null, 'SERVICIOS'],
  ['BUSTOS LUCAS GABRIEL',        '20-10000013-0', d(1,1,2026),  d(30,6,2026),  960000,     false, null, false, 3, null, 'SERVICIOS'],
  ['CABRERA FERNANDO ARIEL',      '20-10000014-0', d(15,12,2025),d(14,12,2026), 2500000,    false, null, false, 3, null, 'SERVICIOS'],
  ['CAPDEVILA MARTIN EDUARDO',    '20-10000015-0', d(1,4,2025),  d(31,3,2026),  395000,     false, null, false, 3, null, 'SERVICIOS'],
  ['CARRI AGUSTIN',                '20-10000016-0', d(1,12,2025), d(30,6,2026),  478094,     false, null, false, 3, null, 'SERVICIOS'],
  ['CASTILLO SOLEDAD',             '27-10000017-0', d(1,3,2026),  d(30,6,2026),  2200000,    false, null, false, 3, null, 'SERVICIOS'],
  ['CASTRO MARIO RAMON',           '20-10000018-0', d(1,3,2026),  d(30,6,2026),  1600000,    false, null, false, 3, null, 'SERVICIOS'],
  ['COMELLI AGUSTINA',             '27-10000019-0', d(1,1,2026),  d(30,6,2026),  960000,     false, null, false, 3, null, 'SERVICIOS'],
  ['COSTAMAGNA FLAVIA ANDREA',    '27-10000020-0', d(1,3,2026),  d(30,6,2026),  1349000,    false, null, false, 3, null, 'SERVICIOS'],
  ['CUELLO JULIO CESAR',           '20-10000021-0', d(1,3,2026),  d(30,6,2026),  547000,     false, null, false, 3, null, 'SERVICIOS'],
  ['DURANDO DARIO NELSO',          '20-10000022-0', d(1,3,2026),  d(31,5,2026),  0,          false, '33L Combustible p/hora', false, 3, null, 'SERVICIOS'],
  ['FERREYRA JULIO ARGENTINO',    '20-10000023-0', d(1,1,2026),  d(30,6,2026),  1200000,    false, null, false, 3, null, 'SERVICIOS'],
  ['FERREYRA NICOLAS SANTIAGO',   '20-10000024-0', d(1,1,2026),  d(31,5,2026),  1250000,    false, null, false, 3, null, 'SERVICIOS'],
  ['GALLESE NATALIA',              '27-10000025-0', d(1,1,2026),  d(30,6,2026),  360000,     false, null, false, 3, null, 'SERVICIOS'],
  ['GARRONE FLORENCIA',            '27-10000026-0', d(1,3,2026),  d(30,6,2026),  1480000,    false, null, false, 3, null, 'SERVICIOS'],
  ['GOMEZ FEDERICO',               '20-10000027-0', d(1,1,2026),  d(30,6,2026),  960000,     false, null, false, 3, null, 'SERVICIOS'],
  ['GOMEZ VERONICA LILIANA',      '27-10000028-0', d(1,5,2025),  d(30,4,2026),  500000,     false, null, true,  3, null, 'SERVICIOS'],
  ['GUIBERTI YANINA SOLEDAD',     '27-10000029-0', d(1,1,2026),  d(30,6,2026),  2900000,    false, null, false, 3, null, 'SERVICIOS'],
  ['GUTIERREZ SERGIO OSCAR',      '20-10000030-0', d(1,1,2026),  d(30,6,2026),  1500000,    false, null, false, 3, null, 'SERVICIOS'],
  ['GUYON EVANGELINA VERONICA',   '27-10000031-0', d(1,3,2026),  d(30,6,2026),  400000,     false, null, false, 3, null, 'SERVICIOS'],
  ['ITALIANO INES MARIANA',       '27-10000032-0', d(1,3,2026),  d(30,6,2026),  2681000,    false, null, false, 3, null, 'SERVICIOS'],
  ['JANS CARLA',                   '27-10000033-0', d(1,12,2025), d(31,5,2026),  1050000,    false, null, false, 3, null, 'SERVICIOS'],
  ['JUAREZ MARIA ALEJANDRA',      '27-10000034-0', d(1,3,2026),  d(30,6,2026),  2000000,    false, null, false, 3, null, 'SERVICIOS'],
  ['LEIVA JORGE MARIO',            '20-10000035-0', d(1,1,2026),  d(30,6,2026),  600000,     false, null, false, 3, null, 'SERVICIOS'],
  ['LEMOS LEANDRO',                '20-10000036-0', d(1,12,2025), d(30,6,2026),  478094,     false, null, false, 3, null, 'SERVICIOS'],
  ['LOZURIAGA SANTIAGO',           '20-10000037-0', d(1,12,2025), d(30,6,2026),  398412,     false, null, false, 3, null, 'SERVICIOS'],
  ['LUQUE JESICA',                 '27-10000038-0', d(1,3,2026),  d(28,6,2026),  1900000,    false, null, false, 3, null, 'SERVICIOS'],
  ['MALTESE CARLOS MIGUEL',       '20-10000039-0', d(1,2,2026),  d(30,6,2026),  2617000,    true,  'Por hora', true,  3, null, 'SERVICIOS'],
  ['MARASINI MARIA BELEN',        '27-10000040-0', d(27,2,2026), d(30,6,2026),  368000,     false, null, false, 3, null, 'SERVICIOS'],
  ['MORENO ARIEL ANTONIO',        '20-10000041-0', d(1,3,2026),  d(30,6,2026),  290000,     false, null, false, 3, null, 'SERVICIOS'],
  ['NOE ANA JULIA',                '27-10000042-0', d(12,1,2025), d(30,4,2026),  450000,     false, null, false, 3, null, 'SERVICIOS'],
  ['PICCO YAMILA BETIANA',        '27-10000043-0', d(1,3,2026),  d(31,5,2026),  0,          false, '33L Combustible p/hora', false, 3, null, 'SERVICIOS'],
  ['PISSANE MARIA FERNANDA',      '27-10000044-0', d(1,3,2026),  d(30,6,2026),  2680000,    false, null, false, 3, null, 'SERVICIOS'],
  ['PUCHETA RAUL ERMINIO',        '20-10000045-0', d(1,1,2026),  d(30,6,2026),  1100000,    false, null, false, 3, null, 'SERVICIOS'],
  ['QUEVEDO VIRGINIA',             '27-10000046-0', d(29,1,2026), d(30,6,2026),  180000,     false, null, false, 3, null, 'SERVICIOS'],
  ['QUINTEROS FACUNDO',            '20-10000047-0', d(30,1,2026), d(30,6,2026),  384000,     false, null, false, 3, null, 'SERVICIOS'],
  ['RIVAROLA HECTOR HUGO',        '20-10000048-0', d(1,1,2026),  d(30,6,2026),  1300000,    false, null, false, 3, null, 'SERVICIOS'],
  ['RUIZ MARCOS JAVIER',          '20-10000049-0', d(1,3,2026),  d(30,6,2026),  1560000,    false, null, false, 3, null, 'SERVICIOS'],
  ['SALGUERO MARCELO ARIEL',      '20-10000050-0', d(1,1,2026),  d(30,6,2026),  1650000,    false, null, false, 3, null, 'SERVICIOS'],
  ['SANCHEZ JORGE RAMON',         '20-10000051-0', d(1,1,2026),  d(30,3,2026),  1800000,    false, null, false, 3, null, 'SERVICIOS'],
  ['SCHIAVONI CAMILA',             '27-10000052-0', d(30,1,2026), d(30,6,2026),  13000,      true,  'Por hora', false, 3, null, 'SERVICIOS'],
  ['TEVEZ JOSE LAUTARO',          '20-10000053-0', d(30,12,2025),d(30,6,2026),  900000,     false, null, false, 3, null, 'SERVICIOS'],
  ['TOLEDO LAURA LORENA',         '27-10000054-0', d(1,1,2026),  d(30,6,2026),  900000,     false, null, false, 3, null, 'SERVICIOS'],
  ['URAVICH MARIANA',              '27-10000055-0', d(27,2,2026), d(30,6,2026),  1300000,    false, null, false, 3, null, 'SERVICIOS'],
  ['VIDELA FERNANDA DEL LOURDES', '27-10000056-0', d(1,3,2026),  d(1,3,2027),   2143000,    false, null, true,  3, null, 'SERVICIOS'],
  ['ZAZZETTI JUAN CARLOS',        '20-10000057-0', d(1,2,2026),  d(30,6,2026),  2800000,    false, null, false, 3, null, 'SERVICIOS'],
  // Alquileres
  ['BERTONE, HELIDE NOEMI (LUDUEÑA)', '27-20000001-0', d(1,4,2024), d(31,3,2027), 970536.00, false, null, false, 3, 'Se actualiza por: GASOIL YPF (24°-30° MES)', 'ALQUILER'],
  ['FASOLIS, EDUARDO ANTONIO (MORENO)', '20-20000002-0', d(1,11,2024), d(31,10,2026), 498200.00, false, null, true, 4, null, 'ALQUILER'],
  ['FERACE, HUGO LUCIANO', '20-20000003-0', d(1,1,2026), d(31,12,2027), 483314.00, false, null, true, 4, null, 'ALQUILER'],
  ['FERREYRA, MARISEL ELIZABET', '27-20000004-0', d(1,2,2026), d(30,6,2026), 900000.00, false, null, false, 3, null, 'ALQUILER'],
  ['FONTI, DANIEL JOSE', '20-20000005-0', d(1,2,2025), d(31,1,2028), 958530.00, false, null, true, 4, null, 'ALQUILER'],
  ['GISBERT, LUIS OSVALDO / LESTA, JUAN EDUARDO', '30-20000006-0', d(20,1,2025), d(20,6,2026), 15097657.00, false, null, true, 1, 'Se actualiza por: ICC - MENSUALMENTE', 'ALQUILER'],
  ['MAZZONI, CARLOS ENRIQUE', '20-20000007-0', d(1,1,2025), d(31,12,2026), 473575.54, false, null, true, 4, null, 'ALQUILER'],
  ['PERIOTTI, VICTOR HUGO', '20-20000008-0', d(1,10,2024), d(1,10,2027), 909005.00, false, null, true, 4, null, 'ALQUILER'],
  ['SANCHEZ, NOEMI MARIA', '27-20000009-0', d(1,3,2026), d(28,2,2027), 350000.00, false, null, false, 3, null, 'ALQUILER'],
  ['SOLA, NELVA / FENOGLIO, JORGE', '30-20000010-0', d(1,4,2025), d(31,3,2026), 829200.00, false, null, true, 4, null, 'ALQUILER'],
  ['SOSA, EMILIANO ADRIAN', '20-20000011-0', d(1,1,2026), d(30,6,2026), 1500000.00, false, null, false, 3, null, 'ALQUILER'],
];

async function main() {
  console.log('Borrando base de datos existente...');
  await prisma.auditLog.deleteMany();
  await prisma.document.deleteMany();
  await prisma.contractHistory.deleteMany();
  await prisma.rescissionRecord.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.user.deleteMany();
  await prisma.templateText.deleteMany();

  console.log('Creando usuarios base...');
  const pwdAdmin = await bcrypt.hash('admin123', 10);
  const pwdOp = await bcrypt.hash('operador123', 10);
  const pwdRead = await bcrypt.hash('visor123', 10);

  const admin = await prisma.user.create({ data: { email: 'admin@municipio.gob.ar', name: 'Hebe Benedetti', password: pwdAdmin, role: 'ADMIN' } });
  await prisma.user.create({ data: { email: 'operador@municipio.gob.ar', name: 'Carolina Operadora', password: pwdOp, role: 'OPERATOR' } });
  await prisma.user.create({ data: { email: 'lectura@municipio.gob.ar', name: 'Héctor Auditor', password: pwdRead, role: 'READONLY' } });

  console.log(`Creando ${contracts.length} proveedores y contratos de servicios y alquileres...`);

  for (let i = 0; i < contracts.length; i++) {
    const [name, cuit, startDate, endDate, amount, isHourly, paymentMethod, ipcEnabled, ipcPeriodMonths, observations, category] = contracts[i];
    const prefix = category === 'ALQUILER' ? 'ALQU' : 'SERV';
    const code = `${prefix}-2026-${String(i + 1).padStart(3, '0')}`;

    const provider = await prisma.provider.create({
      data: {
        name,
        dniCuit: cuit,
        sector: category === 'ALQUILER' ? 'Bienes Raíces' : 'Servicios',
        active: true,
      },
    });

    // Calcular próximo ajuste IPC
    let ipcNextAdj: Date | null = null;
    if (ipcEnabled) {
      ipcNextAdj = new Date(startDate);
      ipcNextAdj.setMonth(ipcNextAdj.getMonth() + ipcPeriodMonths);
    }

    await prisma.contract.create({
      data: {
        code,
        category: category,
        status: 'ACTIVO',
        description: `Contrato de ${category.toLowerCase()} — ${name}`,
        observations,
        amount,
        isHourly,
        paymentMethod,
        currency: 'ARS',
        startDate,
        endDate,
        providerId: provider.id,
        createdById: admin.id,
        ipcEnabled,
        ipcPeriodMonths,
        ipcLastAdjustment: ipcEnabled ? startDate : null,
        ipcNextAdjustment: ipcNextAdj,
      },
    });
  }

  console.log(`Seed completado: ${contracts.length} contratos creados.`);
  console.log('Admin: admin@municipio.gob.ar / admin123');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });

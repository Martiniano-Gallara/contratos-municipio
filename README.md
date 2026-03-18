# Sistema de Gestión de Contratos Municipales

Aplicación web administrativa profesional para gestión de contratos de una municipalidad o entidad pública. Moderna, segura e intuitiva.

## Stack Tecnológico

| Tecnología | Uso |
|---|---|
| **Next.js 15** | Framework fullstack (App Router) |
| **TypeScript** | Tipado estático |
| **Tailwind CSS v4** | Estilos |
| **Prisma v7** | ORM |
| **PostgreSQL** | Base de datos (Supabase/Neon) |
| **NextAuth.js v4** | Autenticación JWT |
| **Lucide React** | Iconografía |
| **xlsx** | Exportación a Excel |

## Requisitos Previos

- Node.js 18+ 
- Base de datos PostgreSQL (Supabase, Neon, o local)

## Instalación

```bash
# 1. Clonar o acceder al proyecto
cd contratos-municipio

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
#    Copiar .env.example a .env y completar con tus credenciales
cp .env.example .env

# 4. Editar .env con tu DATABASE_URL real
#    Ejemplo Supabase: postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
#    Ejemplo Neon: postgresql://[USER]:[PASSWORD]@[HOST]/[DATABASE]?sslmode=require

# 5. Generar el cliente Prisma
npx prisma generate

# 6. Aplicar esquema a la base de datos
npx prisma db push

# 7. Cargar datos de ejemplo
npm run db:seed

# 8. Iniciar en desarrollo
npm run dev
```

## Usuarios del Seed

| Rol | Email | Contraseña |
|---|---|---|
| **Administrador** | admin@municipio.gob.ar | admin123 |
| **Operador** | operador@municipio.gob.ar | operador123 |
| **Solo Lectura** | lectura@municipio.gob.ar | visor123 |

> ⚠️ Cambiar contraseñas antes de usar en producción.

## Estructura del Proyecto

```
contratos-municipio/
├── prisma/
│   ├── schema.prisma     # Esquema de base de datos
│   └── seed.ts           # Datos de ejemplo
├── src/
│   ├── app/
│   │   ├── api/           # API Routes (contratos, proveedores, etc.)
│   │   ├── dashboard/     # Páginas del panel principal
│   │   └── login/         # Pantalla de login
│   ├── components/        # Componentes reutilizables
│   ├── generated/prisma/  # Cliente Prisma generado
│   └── lib/               # Utilidades (auth, audit, permissions, etc.)
├── public/uploads/        # PDFs almacenados localmente
└── .env.example           # Template de variables de entorno
```

## Módulos

- **Dashboard** — Resumen con indicadores, alertas y actividad reciente
- **Contratos** — CRUD completo con filtros, búsqueda, paginación, rescisión y borrado lógico
- **Proveedores** — Gestión de fichas con estadísticas acumuladas
- **Documentos** — Upload y gestión de PDFs por contrato
- **Historial** — Vista cronológica de contratos
- **Reportes** — Reportes por categoría/proveedor con exportación Excel
- **Auditoría** — Registro inmutable de todas las acciones
- **Plantillas** — Textos predefinidos para agilizar la carga
- **Configuración** — Info del sistema

## Roles y Permisos

| Permiso | Admin | Operador | Solo Lectura |
|---|:---:|:---:|:---:|
| Ver contratos | ✅ | ✅ | ✅ |
| Crear contratos | ✅ | ✅ | ❌ |
| Editar contratos | ✅ | ✅ | ❌ |
| Eliminar contratos | ✅ | ❌ | ❌ |
| Rescindir contratos | ✅ | ✅ | ❌ |
| Gestionar proveedores | ✅ | ✅ | ❌ |
| Ver reportes | ✅ | ✅ | ✅ |
| Exportar datos | ✅ | ✅ | ❌ |
| Ver auditoría | ✅ | ❌ | ❌ |
| Gestionar plantillas | ✅ | ❌ | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ |

## Seguridad Implementada

- ✅ Contraseñas hasheadas con bcrypt
- ✅ Sesiones JWT con expiración (8 horas)
- ✅ Rate limiting en login (5 intentos/minuto)
- ✅ Middleware de protección de rutas
- ✅ Validación backend en todos los endpoints
- ✅ Borrado lógico (los datos nunca se eliminan físicamente)
- ✅ Registro de auditoría de acciones sensibles
- ✅ Confirmación obligatoria en acciones destructivas
- ✅ Roles con permisos granulares

## Producción

```bash
npm run build
npm start
```

## Mejoras Futuras Sugeridas

1. **Gestión de usuarios** desde el panel admin
2. **Notificaciones por email** para vencimientos
3. **Cloud storage (S3)** para documentos
4. **Firma digital** de contratos
5. **Dashboard con gráficos** (Chart.js o Recharts)
6. **Búsqueda full-text** con PostgreSQL
7. **API de exportación PDF** con diseño institucional
8. **Backup automático** de base de datos
9. **Two-factor authentication** para admins
10. **Integración con AFIP** para validar CUIT

## Licencia

Uso interno — Municipalidad

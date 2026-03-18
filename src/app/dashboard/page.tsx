'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  FileText,
  AlertTriangle,
  Clock,
  XCircle,
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  Home,
  Wrench,
  CalendarClock,
  ArrowRight,
} from 'lucide-react';

interface DashboardData {
  stats: {
    totalContracts: number;
    activeContracts: number;
    expiringContracts: number;
    expiredContracts: number;
    draftContracts: number;
    rescindedContracts: number;
    totalProviders: number;
    ipcPendingCount: number;
    byCategory: { category: string; count: number }[];
  };
  expiringDetails: {
    id: string;
    code: string;
    description: string;
    endDate: string;
    provider: { name: string };
  }[];
  ipcPendingDetails: {
    id: string;
    code: string;
    description: string;
    amount: number;
    currency: string;
    ipcPeriodMonths: number;
    ipcLastAdjustment: string | null;
    ipcNextAdjustment: string | null;
    provider: { name: string };
  }[];
  recentActivity: {
    id: string;
    action: string;
    entity: string;
    entityId: string;
    user: string;
    createdAt: string;
  }[];
}

const categoryLabels: Record<string, string> = {
  SERVICIOS: 'Servicios',
  ALQUILER: 'Alquiler',
  OBRA: 'Obra',
};

const categoryIcons: Record<string, React.ReactNode> = {
  SERVICIOS: <Wrench className="w-5 h-5" />,
  ALQUILER: <Home className="w-5 h-5" />,
  OBRA: <Briefcase className="w-5 h-5" />,
};

const actionLabels: Record<string, string> = {
  CREATE: 'Creó',
  UPDATE: 'Editó',
  DELETE: 'Eliminó',
  RESCIND: 'Rescindió',
  LOGIN: 'Inició sesión',
  UPLOAD: 'Subió documento',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function daysSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function ipcPeriodLabel(months: number): string {
  if (months === 1) return 'Mensual';
  if (months === 3) return 'Trimestral';
  if (months === 6) return 'Semestral';
  if (months === 12) return 'Anual';
  return `Cada ${months} meses`;
}

function formatCurrencyDash(amount: number, currency: string) {
  const symbol = currency === 'USD' ? 'US$' : currency === 'EUR' ? '\u20ac' : '$';
  return `${symbol} ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-slate-500">
        Error al cargar los datos. Intente recargar la página.
      </div>
    );
  }

  const { stats } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Bienvenido, {session?.user?.name}
          </p>
        </div>
        <div className="text-sm text-slate-400">
          {new Date().toLocaleDateString('es-AR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </div>

      {/* Alert Banner - Contratos por vencer */}
      {stats.expiringContracts > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              {stats.expiringContracts} contrato{stats.expiringContracts !== 1 ? 's' : ''} por vencer en los próximos 30 días
            </p>
          </div>
          <a href="/dashboard/contratos?status=ACTIVO&expiring=true" className="text-sm font-medium text-amber-700 hover:text-amber-900 flex items-center gap-1">
            Ver <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* IPC Alert Banner */}
      {stats.ipcPendingCount > 0 && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-center gap-3">
          <TrendingDown className="w-5 h-5 text-violet-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-violet-800">
              ⚠️ {stats.ipcPendingCount} contrato{stats.ipcPendingCount !== 1 ? 's' : ''} con ajuste por IPC pendiente
            </p>
            <p className="text-xs text-violet-600 mt-0.5">
              El monto de estos contratos debe actualizarse según el índice IPC
            </p>
          </div>
          <a href="#ipc-section" className="text-sm font-medium text-violet-700 hover:text-violet-900 flex items-center gap-1">
            Ver detalle <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Contratos Activos"
          value={stats.activeContracts}
          icon={<FileText className="w-5 h-5" />}
          color="blue"
          href="/dashboard/contratos?status=ACTIVO"
        />
        <StatCard
          title="Por Vencer"
          value={stats.expiringContracts}
          icon={<Clock className="w-5 h-5" />}
          color="amber"
          href="/dashboard/contratos?expiring=true"
        />
        <StatCard
          title="Vencidos"
          value={stats.expiredContracts}
          icon={<XCircle className="w-5 h-5" />}
          color="red"
          href="/dashboard/contratos?status=VENCIDO"
        />
        <StatCard
          title="Proveedores"
          value={stats.totalProviders}
          icon={<Users className="w-5 h-5" />}
          color="emerald"
          href="/dashboard/proveedores"
        />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Contratos"
          value={stats.totalContracts}
          icon={<TrendingUp className="w-5 h-5" />}
          color="slate"
        />
        <StatCard
          title="Borradores"
          value={stats.draftContracts}
          icon={<FileText className="w-5 h-5" />}
          color="slate"
          href="/dashboard/contratos?status=BORRADOR"
        />
        <StatCard
          title="Rescindidos"
          value={stats.rescindedContracts}
          icon={<XCircle className="w-5 h-5" />}
          color="slate"
          href="/dashboard/contratos?status=RESCINDIDO"
        />
      </div>

      {/* IPC Pending Section */}
      {data.ipcPendingDetails && data.ipcPendingDetails.length > 0 && (
        <div id="ipc-section" className="bg-white rounded-xl border-2 border-violet-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-violet-500" />
            Contratos Pendientes de Ajuste por IPC
            <span className="ml-auto bg-violet-100 text-violet-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {data.ipcPendingDetails.length}
            </span>
          </h3>
          <div className="space-y-3">
            {data.ipcPendingDetails.map((contract) => {
              const overdueDays = contract.ipcNextAdjustment ? daysSince(contract.ipcNextAdjustment) : 0;
              return (
                <a
                  key={contract.id}
                  href={`/dashboard/contratos/${contract.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-violet-100 bg-violet-50/30 hover:bg-violet-50 transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-700 group-hover:text-violet-700">
                        {contract.code}
                      </p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 font-medium">
                        {ipcPeriodLabel(contract.ipcPeriodMonths)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {contract.provider.name} — {contract.description}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Monto actual: <span className="font-medium text-slate-600">{formatCurrencyDash(contract.amount, contract.currency)}</span>
                      {contract.ipcLastAdjustment && (
                        <> &middot; Último ajuste: {formatDate(contract.ipcLastAdjustment)}</>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      overdueDays > 30 ? 'bg-red-100 text-red-700' : overdueDays > 7 ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-700'
                    }`}>
                      {overdueDays > 0 ? `${overdueDays}d vencido` : 'Hoy'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Debía ajustarse el {contract.ipcNextAdjustment ? formatDate(contract.ipcNextAdjustment) : '-'}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Categories + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por Categoría */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Contratos por Categoría</h3>
          <div className="space-y-3">
            {['SERVICIOS', 'ALQUILER', 'OBRA'].map((cat) => {
              const item = stats.byCategory.find(c => c.category === cat);
              const count = item?.count ?? 0;
              const total = stats.totalContracts || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={cat} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    {categoryIcons[cat]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">{categoryLabels[cat]}</span>
                      <span className="text-sm text-slate-500">{count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Próximos Vencimientos */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-amber-500" />
            Próximos Vencimientos
          </h3>
          {data.expiringDetails.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No hay contratos por vencer en los próximos 30 días</p>
          ) : (
            <div className="space-y-3">
              {data.expiringDetails.map((contract) => {
                const days = daysUntil(contract.endDate);
                return (
                  <a
                    key={contract.id}
                    href={`/dashboard/contratos/${contract.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700 truncate group-hover:text-blue-600">
                        {contract.code} — {contract.provider.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{contract.description}</p>
                    </div>
                    <div className={`text-xs font-medium px-2 py-1 rounded-full ml-3 whitespace-nowrap ${
                      days <= 7 ? 'bg-red-100 text-red-700' : days <= 15 ? 'bg-amber-100 text-amber-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {days} día{days !== 1 ? 's' : ''}
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Últimos Movimientos</h3>
        {data.recentActivity.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No hay movimientos recientes</p>
        ) : (
          <div className="space-y-2">
            {data.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">
                    <span className="font-medium">{activity.user}</span>{' '}
                    {actionLabels[activity.action] || activity.action}{' '}
                    <span className="text-slate-500">{activity.entity}</span>
                  </p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {formatDateTime(activity.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  href,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  href?: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-100',
  };

  const Card = (
    <div className={`rounded-xl border p-5 ${colorClasses[color] || colorClasses.slate} ${href ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium opacity-80">{title}</span>
        {icon}
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );

  return href ? <a href={href}>{Card}</a> : Card;
}

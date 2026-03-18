'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Edit, Printer, Download, FileText,
  Calendar, DollarSign, User, Building, Clock, AlertCircle, Upload,
} from 'lucide-react';

interface ContractDetail {
  id: string;
  code: string;
  category: string;
  status: string;
  description: string;
  observations: string | null;
  amount: string;
  currency: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  provider: {
    id: string; name: string; tradeName: string | null;
    dniCuit: string; phone: string | null; email: string | null;
  };
  createdBy: { name: string; email: string };
  updatedBy: { name: string; email: string } | null;
  documents: {
    id: string; name: string; type: string; filePath: string;
    createdAt: string; uploadedBy: { name: string };
  }[];
  history: {
    id: string; field: string; oldValue: string | null;
    newValue: string | null; createdAt: string; changedBy: { name: string };
  }[];
  rescission: {
    reason: string; justification: string; date: string;
    user: { name: string };
  } | null;
}

const statusLabels: Record<string, string> = {
  ACTIVO: 'Activo', BORRADOR: 'Borrador', FINALIZADO: 'Finalizado',
  RESCINDIDO: 'Rescindido', VENCIDO: 'Vencido',
};
const categoryLabels: Record<string, string> = {
  SERVICIOS: 'Servicios', ALQUILER: 'Alquiler', OBRA: 'Obra',
};
const statusColors: Record<string, string> = {
  ACTIVO: 'bg-emerald-100 text-emerald-700', BORRADOR: 'bg-slate-100 text-slate-600',
  FINALIZADO: 'bg-blue-100 text-blue-700', RESCINDIDO: 'bg-red-100 text-red-700',
  VENCIDO: 'bg-amber-100 text-amber-700',
};
const docTypeLabels: Record<string, string> = {
  CONTRATO_ORIGINAL: 'Contrato Original', ADENDA: 'Adenda', ANEXO: 'Anexo',
  RESCISION: 'Rescisión', COMPROBANTE: 'Comprobante', OTRO: 'Otro',
};
const fieldLabels: Record<string, string> = {
  status: 'Estado', amount: 'Monto', category: 'Categoría', description: 'Descripción',
  observations: 'Observaciones', startDate: 'Fecha inicio', endDate: 'Fecha fin',
  currency: 'Moneda', providerId: 'Proveedor',
};

function formatDate(d: string) { return new Date(d).toLocaleDateString('es-AR'); }
function formatDateTime(d: string) { return new Date(d).toLocaleString('es-AR'); }
function formatCurrency(a: string, c: string) {
  const s = c === 'USD' ? 'US$' : c === 'EUR' ? '€' : '$';
  return `${s} ${parseFloat(a).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
}

export default function ContratoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'docs' | 'history'>('info');

  useEffect(() => {
    fetch(`/api/contratos/${id}`)
      .then(r => r.json())
      .then(data => { setContract(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  if (!contract) return <div className="text-center py-12 text-slate-500">Contrato no encontrado</div>;

  const timeline = [
    { date: contract.createdAt, label: 'Creado', user: contract.createdBy.name, color: 'bg-blue-500' },
    ...contract.history
      .filter(h => h.field === 'status')
      .map(h => ({
        date: h.createdAt,
        label: `Estado: ${statusLabels[h.oldValue || ''] || h.oldValue} → ${statusLabels[h.newValue || ''] || h.newValue}`,
        user: h.changedBy.name,
        color: h.newValue === 'RESCINDIDO' ? 'bg-red-500' : 'bg-emerald-500',
      })),
    ...(contract.rescission ? [{
      date: contract.rescission.date,
      label: `Rescindido: ${contract.rescission.reason}`,
      user: contract.rescission.user.name,
      color: 'bg-red-500',
    }] : []),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">{contract.code}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[contract.status]}`}>
                {statusLabels[contract.status]}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{categoryLabels[contract.category]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push(`/dashboard/contratos/${id}/editar`)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
            <Edit className="w-4 h-4" /> Editar
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
            <Printer className="w-4 h-4" /> Imprimir
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {[
          { key: 'info' as const, label: 'Información' },
          { key: 'docs' as const, label: `Documentos (${contract.documents.length})` },
          { key: 'history' as const, label: 'Historial' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Datos del Contrato</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={<FileText className="w-4 h-4" />} label="Código" value={contract.code} />
                <InfoRow icon={<DollarSign className="w-4 h-4" />} label="Monto" value={formatCurrency(contract.amount, contract.currency)} />
                <InfoRow icon={<Calendar className="w-4 h-4" />} label="Inicio" value={formatDate(contract.startDate)} />
                <InfoRow icon={<Calendar className="w-4 h-4" />} label="Fin" value={formatDate(contract.endDate)} />
                <InfoRow icon={<Clock className="w-4 h-4" />} label="Creado" value={formatDateTime(contract.createdAt)} />
                <InfoRow icon={<User className="w-4 h-4" />} label="Creado por" value={contract.createdBy.name} />
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-1">Descripción / Objeto</p>
                <p className="text-sm text-slate-700">{contract.description}</p>
              </div>
              {contract.observations && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-slate-500 mb-1">Observaciones</p>
                  <p className="text-sm text-slate-600">{contract.observations}</p>
                </div>
              )}
            </div>

            {/* Rescission Info */}
            {contract.rescission && (
              <div className="bg-red-50 rounded-xl border border-red-200 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <h3 className="text-sm font-semibold text-red-700">Contrato Rescindido</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium text-red-600">Motivo:</span> <span className="text-red-700">{contract.rescission.reason}</span></p>
                  <p><span className="font-medium text-red-600">Justificación:</span> <span className="text-red-700">{contract.rescission.justification}</span></p>
                  <p><span className="font-medium text-red-600">Fecha:</span> <span className="text-red-700">{formatDate(contract.rescission.date)}</span></p>
                  <p><span className="font-medium text-red-600">Responsable:</span> <span className="text-red-700">{contract.rescission.user.name}</span></p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Provider Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-400" /> Proveedor
              </h3>
              <div className="space-y-2">
                <p className="font-medium text-slate-700">{contract.provider.name}</p>
                {contract.provider.tradeName && <p className="text-sm text-slate-500">{contract.provider.tradeName}</p>}
                <p className="text-sm text-slate-500">CUIT/DNI: {contract.provider.dniCuit}</p>
                {contract.provider.phone && <p className="text-sm text-slate-500">Tel: {contract.provider.phone}</p>}
                {contract.provider.email && <p className="text-sm text-slate-500">{contract.provider.email}</p>}
                <a href={`/dashboard/proveedores/${contract.provider.id}`} className="text-sm text-blue-600 hover:underline block mt-2">Ver ficha completa →</a>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Línea de Tiempo</h3>
              <div className="space-y-4">
                {timeline.map((event, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${event.color}`} />
                      {i < timeline.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 mt-1" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm text-slate-700">{event.label}</p>
                      <p className="text-xs text-slate-400">{formatDateTime(event.date)} — {event.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'docs' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Documentos Asociados</h3>
            <button
              onClick={() => router.push(`/dashboard/contratos/${id}/documentos`)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
            >
              <Upload className="w-4 h-4" /> Subir Documento
            </button>
          </div>
          {contract.documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Sin documentos adjuntos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contract.documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">{doc.name}</p>
                      <p className="text-xs text-slate-400">{docTypeLabels[doc.type] || doc.type} — {doc.uploadedBy.name} — {formatDate(doc.createdAt)}</p>
                    </div>
                  </div>
                  <a href={doc.filePath} download className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Historial de Cambios</h3>
          {contract.history.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">Sin cambios registrados</p>
          ) : (
            <div className="space-y-3">
              {contract.history.map(h => (
                <div key={h.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">{fieldLabels[h.field] || h.field}:</span>{' '}
                      <span className="line-through text-slate-400">{h.oldValue || '(vacío)'}</span>{' '}
                      → <span className="text-emerald-600">{h.newValue}</span>
                    </p>
                    <p className="text-xs text-slate-400">{h.changedBy.name} — {formatDateTime(h.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-400 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-700">{value}</p>
      </div>
    </div>
  );
}

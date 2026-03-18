'use client';

import { useEffect, useState } from 'react';
import { History, FileText, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HistoryContract {
  id: string;
  code: string;
  category: string;
  status: string;
  description: string;
  amount: string;
  currency: string;
  startDate: string;
  endDate: string;
  provider: { name: string };
}

const statusLabels: Record<string, string> = { ACTIVO: 'Activo', BORRADOR: 'Borrador', FINALIZADO: 'Finalizado', RESCINDIDO: 'Rescindido', VENCIDO: 'Vencido' };
const statusColors: Record<string, string> = { ACTIVO: 'bg-emerald-100 text-emerald-700', BORRADOR: 'bg-slate-100 text-slate-600', FINALIZADO: 'bg-blue-100 text-blue-700', RESCINDIDO: 'bg-red-100 text-red-700', VENCIDO: 'bg-amber-100 text-amber-700' };
const categoryLabels: Record<string, string> = { SERVICIOS: 'Servicios', ALQUILER: 'Alquiler', OBRA: 'Obra' };

export default function HistorialPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<HistoryContract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/contratos?limit=50&sortBy=updatedAt&sortOrder=desc')
      .then(r => r.json())
      .then(data => { setContracts(data.contracts || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center"><History className="w-5 h-5 text-slate-600" /></div>
        <div><h1 className="text-2xl font-bold text-slate-800">Historial General</h1><p className="text-sm text-slate-500">Todos los contratos ordenados por última modificación</p></div>
      </div>
      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" /></div>
      ) : (
        <div className="space-y-3">
          {contracts.map(c => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between cursor-pointer" onClick={() => router.push(`/dashboard/contratos/${c.id}`)}>
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{c.code}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.status]}`}>{statusLabels[c.status]}</span>
                    <span className="text-xs text-slate-400">{categoryLabels[c.category]}</span>
                  </div>
                  <p className="text-sm text-slate-500 truncate">{c.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{c.provider?.name} — {new Date(c.startDate).toLocaleDateString('es-AR')} a {new Date(c.endDate).toLocaleDateString('es-AR')}</p>
                </div>
              </div>
              <Eye className="w-4 h-4 text-slate-300" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

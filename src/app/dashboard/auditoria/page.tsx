'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Shield, Search, Calendar, User, Activity, FileText } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: { name: string; email: string };
}

const actionLabels: Record<string, string> = {
  CREATE: 'Creación',
  UPDATE: 'Actualización',
  DELETE: 'Visual Eliminación',
  RESCIND: 'Rescisión',
  LOGIN: 'Inicio de Sesión',
  UPLOAD: 'Subida Documento',
};

const actionColors: Record<string, string> = {
  CREATE: 'bg-emerald-100 text-emerald-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  RESCIND: 'bg-amber-100 text-amber-700',
  LOGIN: 'bg-slate-100 text-slate-700',
  UPLOAD: 'bg-indigo-100 text-indigo-700',
};

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

function truncateVal(val: string | null) {
  if (!val) return 'Ninguno';
  const shortened = val.length > 50 ? val.substring(0, 50) + '...' : val;
  return shortened;
}

export default function AuditoriaPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ entity: '', action: '', dateFrom: '', dateTo: '' });
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
      
      const res = await fetch(`/api/auditoria?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  if (session?.user?.role === 'READONLY') {
    return <div className="text-center py-12 text-slate-500">No tienes permisos para ver esta sección</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Historial de Cambios</h1>
            <p className="text-sm text-slate-500 mt-0.5">Historial completo con nombre de usuario, fecha y hora</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap gap-3">
        <select name="entity" value={filters.entity} onChange={handleFilterChange} className="px-3 py-2 border rounded-lg text-sm flex-1 min-w-[150px]">
          <option value="">Todas las Entidades</option>
          <option value="Contract">Contratos</option>
          <option value="Provider">Proveedores</option>
          <option value="Document">Documentos</option>
          <option value="User">Usuarios</option>
        </select>
        <select name="action" value={filters.action} onChange={handleFilterChange} className="px-3 py-2 border rounded-lg text-sm flex-1 min-w-[150px]">
          <option value="">Todas las Acciones</option>
          {Object.entries(actionLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className="px-3 py-2 border rounded-lg text-sm flex-1 min-w-[130px]" title="Fecha Inicio" />
        <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} className="px-3 py-2 border rounded-lg text-sm flex-1 min-w-[130px]" title="Fecha Fin" />
        <button onClick={() => fetchLogs()} className="px-5 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition">Filtrar</button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-sm">
        {loading ? (
           <div className="p-12 text-center text-slate-400">Cargando registros...</div>
        ) : logs.length === 0 ? (
           <div className="p-12 text-center text-slate-400">Sin movimientos para los filtros actuales</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600">Fecha y Hora</th>
                <th className="px-4 py-3 font-medium text-slate-600">Usuario</th>
                <th className="px-4 py-3 font-medium text-slate-600">Acción</th>
                <th className="px-4 py-3 font-medium text-slate-600">Entidad</th>
                <th className="px-4 py-3 font-medium text-slate-600 truncate max-w-xs">Detalles Clave (Post-Cambio)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">{log.user.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${actionColors[log.action] || 'bg-slate-100'}`}>
                      {actionLabels[log.action] || log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{log.entity} <span className="text-xs text-slate-400">ID: {log.entityId?.substring(0, 8)}</span></td>
                  <td className="px-4 py-3 text-xs text-slate-500 truncate max-w-xs" title={log.newValue || ''}>
                    {truncateVal(log.newValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
            <span className="text-sm text-slate-500">Página {pagination.page} de {pagination.totalPages}</span>
            <div className="flex gap-2">
              <button 
                onClick={() => fetchLogs(pagination.page - 1)} disabled={pagination.page === 1}
                className="px-3 py-1 border rounded bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >Anterior</button>
              <button 
                onClick={() => fetchLogs(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border rounded bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

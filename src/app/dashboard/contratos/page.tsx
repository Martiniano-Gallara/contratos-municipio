'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Plus, Search, Filter, Eye, Edit, Printer, Trash2,
  ChevronLeft, ChevronRight, FileText, X, AlertTriangle, Scissors, TrendingDown,
} from 'lucide-react';
import { hasPermission } from '@/lib/permissions';
import type { Role } from '@/lib/permissions';

interface Contract {
  id: string;
  code: string;
  category: string;
  status: string;
  description: string;
  amount: string;
  currency: string;
  startDate: string;
  endDate: string;
  ipcEnabled: boolean;
  ipcNextAdjustment: string | null;
  provider: { id: string; name: string; tradeName: string | null };
  createdBy: { name: string };
  _count: { documents: number };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const statusColors: Record<string, string> = {
  ACTIVO: 'bg-emerald-100 text-emerald-700',
  BORRADOR: 'bg-slate-100 text-slate-600',
  FINALIZADO: 'bg-blue-100 text-blue-700',
  RESCINDIDO: 'bg-red-100 text-red-700',
  VENCIDO: 'bg-amber-100 text-amber-700',
};

const statusLabels: Record<string, string> = {
  ACTIVO: 'Activo',
  BORRADOR: 'Borrador',
  FINALIZADO: 'Finalizado',
  RESCINDIDO: 'Rescindido',
  VENCIDO: 'Vencido',
};

const categoryLabels: Record<string, string> = {
  SERVICIOS: 'Servicios',
  ALQUILER: 'Alquiler',
  OBRA: 'Obra',
};

function formatCurrency(amount: string, currency: string) {
  const num = parseFloat(amount);
  const symbol = currency === 'USD' ? 'US$' : currency === 'EUR' ? '€' : '$';
  return `${symbol} ${num.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-AR');
}

function ContratosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '');
  const [filterCategory, setFilterCategory] = useState(searchParams.get('category') || '');
  const [sortOption, setSortOption] = useState('createdAt-desc');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [rescindId, setRescindId] = useState<string | null>(null);
  const [rescindReason, setRescindReason] = useState('');
  const [rescindJustification, setRescindJustification] = useState('');

  const role = session?.user?.role as Role;
  const canCreate = hasPermission(role, 'contracts.create');
  const canEdit = hasPermission(role, 'contracts.update');
  const canDelete = hasPermission(role, 'contracts.delete');
  const canRescind = hasPermission(role, 'contracts.rescind');

  const fetchContracts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      if (filterCategory) params.set('category', filterCategory);
      if (searchParams.get('expiring') === 'true') params.set('expiring', 'true');
      
      const [sortBy, sortOrder] = sortOption.split('-');
      if (sortBy) params.set('sortBy', sortBy);
      if (sortOrder) params.set('sortOrder', sortOrder);

      const res = await fetch(`/api/contratos?${params}`);
      const data = await res.json();
      setContracts(data.contracts || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterCategory, sortOption, searchParams]);

  useEffect(() => {
    fetchContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only fetch manually (on mount or when clicking search)

  const handleDelete = async () => {
    if (!deleteId || !deleteConfirm) return;
    try {
      await fetch(`/api/contratos/${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      setDeleteConfirm(false);
      fetchContracts(pagination.page);
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleRescind = async () => {
    if (!rescindId || !rescindReason || !rescindJustification) return;
    try {
      await fetch(`/api/contratos/${rescindId}/rescindir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rescindReason, justification: rescindJustification }),
      });
      setRescindId(null);
      setRescindReason('');
      setRescindJustification('');
      fetchContracts(pagination.page);
    } catch (error) {
      console.error('Error rescinding:', error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Contratos</h1>
          <p className="text-sm text-slate-500 mt-1">{pagination.total} contratos registrados</p>
        </div>
        {canCreate && (
          <button
            onClick={() => router.push('/dashboard/contratos/nuevo')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Nuevo Contrato
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchContracts()}
              placeholder="Buscar por código, descripción o proveedor..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
              showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" /> Filtros
          </button>
          <button
            onClick={() => fetchContracts()}
            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
          >
            Buscar
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Todos los estados</option>
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Todas las categorías</option>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="createdAt-desc">Más Recientes</option>
              <option value="endDate-asc">Vencimiento (Próximos a vencer)</option>
              <option value="endDate-desc">Vencimiento (Más lejanos)</option>
              <option value="amount-desc">Monto (Mayor a menor)</option>
              <option value="amount-asc">Monto (Menor a mayor)</option>
              <option value="code-asc">Alfabético (Código A-Z)</option>
            </select>
            <button
              onClick={() => { setFilterStatus(''); setFilterCategory(''); setSearch(''); setSortOption('createdAt-desc'); fetchContracts(); }}
              className="flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-slate-700 sm:col-span-3"
            >
              <X className="w-3 h-3" /> Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No se encontraron contratos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Código</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Proveedor</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Categoría</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Estado</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Monto</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Vencimiento</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-700">{contract.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-slate-700">{contract.provider.name}</p>
                        {contract.provider.tradeName && (
                          <p className="text-xs text-slate-400">{contract.provider.tradeName}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-slate-600">{categoryLabels[contract.category]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[contract.status]}`}>
                          {statusLabels[contract.status]}
                        </span>
                        {contract.ipcEnabled && contract.ipcNextAdjustment && new Date(contract.ipcNextAdjustment) <= new Date() && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700" title="Ajuste por IPC pendiente">
                            <TrendingDown className="w-3 h-3" /> IPC
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="text-slate-700 font-medium">{formatCurrency(contract.amount, contract.currency)}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-slate-600">{formatDate(contract.endDate)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => router.push(`/dashboard/contratos/${contract.id}`)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => router.push(`/dashboard/contratos/${contract.id}/editar`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => window.print()}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                          title="Imprimir"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {canRescind && contract.status === 'ACTIVO' && (
                          <button
                            onClick={() => setRescindId(contract.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Rescindir"
                          >
                            <Scissors className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => { setDeleteId(contract.id); setDeleteConfirm(false); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
            <span className="text-sm text-slate-500">
              Mostrando {(pagination.page - 1) * pagination.limit + 1} a{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchContracts(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-600 px-2">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchContracts(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Eliminar Contrato</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Esta acción no se puede deshacer fácilmente. El contrato será marcado como eliminado.
            </p>
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.checked)}
                className="rounded border-slate-300"
              />
              <span className="text-sm text-slate-600">Confirmo que deseo eliminar este contrato</span>
            </label>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={!deleteConfirm}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rescind Modal */}
      {rescindId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRescindId(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Scissors className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Rescindir Contrato</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Motivo *</label>
                <input
                  type="text"
                  value={rescindReason}
                  onChange={(e) => setRescindReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Incumplimiento, mutuo acuerdo, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Justificación detallada *</label>
                <textarea
                  value={rescindJustification}
                  onChange={(e) => setRescindJustification(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                  placeholder="Detalle los motivos de la rescisión..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setRescindId(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleRescind}
                disabled={!rescindReason || !rescindJustification}
                className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm hover:bg-amber-700 disabled:opacity-50"
              >
                Confirmar Rescisión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContratosPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ContratosContent />
    </Suspense>
  );
}

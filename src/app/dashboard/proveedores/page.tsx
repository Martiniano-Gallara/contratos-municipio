'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Plus, Search, Users, Building, Phone, Mail, Eye, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { hasPermission } from '@/lib/permissions';
import type { Role } from '@/lib/permissions';

interface Provider {
  id: string;
  name: string;
  tradeName: string | null;
  dniCuit: string;
  sector: string | null;
  phone: string | null;
  email: string | null;
  active: boolean;
  totalAmount: number;
  activeContracts: number;
  totalContracts: number;
}

interface Pagination { total: number; page: number; limit: number; totalPages: number; }

export default function ProveedoresPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 9, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const role = session?.user?.role as Role;
  const canCreate = hasPermission(role, 'providers.create');

  const fetchProviders = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '9');
      if (search) params.set('search', search);
      if (filterActive) params.set('active', filterActive);
      const res = await fetch(`/api/proveedores?${params}`);
      const data = await res.json();
      setProviders(data.providers || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 9, totalPages: 0 });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [search, filterActive]);

  useEffect(() => { fetchProviders(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Proveedores / Contratados</h1>
          <p className="text-sm text-slate-500 mt-1">{pagination.total} proveedores registrados</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium">
            <Plus className="w-4 h-4" /> Nuevo Proveedor
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchProviders()} placeholder="Buscar por nombre, razón social o CUIT..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
          <button onClick={() => fetchProviders()} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-sm">Buscar</button>
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" /></div>
      ) : providers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No se encontraron proveedores</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800">{p.name}</h3>
                    {p.tradeName && <p className="text-xs text-slate-400">{p.tradeName}</p>}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {p.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="space-y-1 text-sm text-slate-500 mb-4">
                <p>CUIT/DNI: {p.dniCuit}</p>
                {p.sector && <p>Rubro: {p.sector}</p>}
                {p.phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {p.phone}</p>}
                {p.email && <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {p.email}</p>}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="text-xs text-slate-400">
                  <span className="font-medium text-slate-600">{p.totalContracts}</span> contratos · <span className="font-medium text-slate-600">${p.totalAmount.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => router.push(`/dashboard/proveedores/${p.id}`)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50" title="Ver ficha">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => router.push(`/dashboard/proveedores/${p.id}/editar`)} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50" title="Editar">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 mt-6 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                Mostrando página <span className="font-medium">{pagination.page}</span> de <span className="font-medium">{pagination.totalPages}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchProviders(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => fetchProviders(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && <CreateProviderModal onClose={() => setShowCreateModal(false)} onCreated={() => { setShowCreateModal(false); fetchProviders(); }} />}
    </div>
  );
}

function CreateProviderModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', tradeName: '', dniCuit: '', sector: '', phone: '', email: '', address: '', notes: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/proveedores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Nuevo Proveedor</h3>
        {error && <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-sm font-medium text-slate-600 mb-1">Nombre / Razón Social *</label><input name="name" value={form.name} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Nombre Fantasía</label><input name="tradeName" value={form.tradeName} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">DNI / CUIT *</label><input name="dniCuit" value={form.dniCuit} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Rubro</label><input name="sector" value={form.sector} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Teléfono</label><input name="phone" value={form.phone} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Email</label><input name="email" type="email" value={form.email} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Domicilio</label><input name="address" value={form.address} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-slate-600 mb-1">Notas internas</label><textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" /></div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50">{loading ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

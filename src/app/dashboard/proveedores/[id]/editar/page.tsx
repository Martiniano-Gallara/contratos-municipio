'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Save, Building } from 'lucide-react';

export default function ProviderEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [id, setId] = useState<string>('');
  
  const [form, setForm] = useState({
    name: '', tradeName: '', dniCuit: '', sector: '', phone: '', email: '', address: '', notes: '', active: true,
  });

  useEffect(() => {
    params.then(p => {
      setId(p.id);
      fetchProvider(p.id);
    });
  }, [params]);

  const fetchProvider = async (providerId: string) => {
    try {
      const res = await fetch(`/api/proveedores/${providerId}`);
      if (!res.ok) throw new Error('Proveedor no encontrado');
      const data = await res.json();
      setForm({
        name: data.name || '',
        tradeName: data.tradeName || '',
        dniCuit: data.dniCuit || '',
        sector: data.sector || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        notes: data.notes || '',
        active: data.active ?? true,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar proveedor');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/proveedores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Error al actualizar');
      }
      router.push(`/dashboard/proveedores/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Building className="w-6 h-6 text-blue-500" /> Editar Proveedor
          </h1>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-200 text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre / Razón Social *</label>
              <input name="name" value={form.name} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de Fantasía</label>
              <input name="tradeName" value={form.tradeName} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CUIT / DNI *</label>
              <input name="dniCuit" value={form.dniCuit} onChange={handleChange} disabled className="w-full px-4 py-2 border border-slate-100 bg-slate-50 rounded-xl text-slate-500 cursor-not-allowed" />
              <p className="text-xs text-slate-400 mt-1">El documento no se puede modificar.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rubro / Categoría</label>
              <input name="sector" value={form.sector} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
              <select name="active" value={form.active.toString()} onChange={(e) => setForm({ ...form, active: e.target.value === 'true' })} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Domicilio</label>
              <input name="address" value={form.address} onChange={handleChange} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Notas u Observaciones</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
          </div>
          
          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
            <button type="button" onClick={() => router.back()} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

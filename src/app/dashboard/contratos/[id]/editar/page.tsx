'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Save, FileText } from 'lucide-react';

export default function ContractEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [id, setId] = useState<string>('');
  
  const [form, setForm] = useState({
    category: '', status: '', description: '', observations: '',
    amount: '', isHourly: false, paymentMethod: '', currency: 'ARS',
    startDate: '', endDate: '', providerId: '',
    ipcEnabled: false, ipcPeriodMonths: 3
  });

  const [providers, setProviders] = useState<{ id: string, name: string }[]>([]);

  useEffect(() => {
    params.then(p => {
      setId(p.id);
      fetchData(p.id);
    });
  }, [params]);

  const fetchData = async (contractId: string) => {
    try {
      const [resCont, resProv] = await Promise.all([
        fetch(`/api/contratos/${contractId}`),
        fetch(`/api/proveedores?limit=1000`)
      ]);
      
      if (!resCont.ok) throw new Error('Contrato no encontrado');
      
      const contData = await resCont.json();
      const provData = await resProv.json();
      
      setProviders(provData.providers || []);
      
      setForm({
        category: contData.category || 'SERVICIOS',
        status: contData.status || 'ACTIVO',
        description: contData.description || '',
        observations: contData.observations || '',
        amount: contData.amount?.toString() || '',
        isHourly: contData.isHourly || false,
        paymentMethod: contData.paymentMethod || '',
        currency: contData.currency || 'ARS',
        startDate: contData.startDate ? new Date(contData.startDate).toISOString().split('T')[0] : '',
        endDate: contData.endDate ? new Date(contData.endDate).toISOString().split('T')[0] : '',
        providerId: contData.providerId || '',
        ipcEnabled: contData.ipcEnabled || false,
        ipcPeriodMonths: contData.ipcPeriodMonths || 3
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar datos');
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
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        ipcPeriodMonths: parseInt(form.ipcPeriodMonths.toString())
      };

      const res = await fetch(`/api/contratos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Error al actualizar');
      }
      router.push(`/dashboard/contratos/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-violet-500" /> Editar Contrato
          </h1>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-200 text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripción / Concepto *</label>
              <input name="description" value={form.description} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor / Contratado *</label>
              <select name="providerId" value={form.providerId} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500">
                <option value="">Seleccione un proveedor...</option>
                {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoría *</label>
              <select name="category" value={form.category} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500">
                <option value="SERVICIOS">Servicios</option>
                <option value="OBRA_PUBLICA">Obra Pública</option>
                <option value="SUMINISTROS">Suministros</option>
                <option value="ALQUILER">Alquileres</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
              <select name="status" value={form.status} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500">
                <option value="ACTIVO">Activo</option>
                <option value="VENCIDO">Vencido</option>
                <option value="RESCINDIDO">Rescindido</option>
                <option value="SUSPENDIDO">Suspendido</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Monto Base *</label>
              <div className="flex items-center gap-2">
                <select name="currency" value={form.currency} onChange={handleChange} className="w-24 px-3 py-2 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500">
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
                <input type="number" step="0.01" name="amount" value={form.amount} onChange={handleChange} required className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Forma de Pago / Metodología especial</label>
              <input name="paymentMethod" value={form.paymentMethod} onChange={handleChange} placeholder="Ej: 33L de Combustible por Hora" className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Inicio *</label>
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Finalización *</label>
              <input type="date" name="endDate" value={form.endDate} onChange={handleChange} required className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500" />
            </div>

          </div>

          <div className="bg-violet-50 border border-violet-100 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-violet-800">Ajuste por IPC</h3>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="ipcEnabled" checked={form.ipcEnabled} onChange={handleChange} className="w-5 h-5 rounded border-violet-300 text-violet-600 focus:ring-violet-500" />
                <span className="text-sm font-medium text-slate-700">Habilitar ajustes por IPC</span>
              </label>
              
              {form.ipcEnabled && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Frecuencia:</span>
                  <select name="ipcPeriodMonths" value={form.ipcPeriodMonths} onChange={handleChange} className="px-3 py-1.5 border border-violet-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white">
                    <option value="1">Mensual</option>
                    <option value="3">Trimestral</option>
                    <option value="4">Cuatrimestral (C/4 Meses)</option>
                    <option value="6">Semestral</option>
                    <option value="12">Anual</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input type="checkbox" name="isHourly" checked={form.isHourly} onChange={handleChange} className="w-5 h-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500" />
                <span className="text-sm font-medium text-slate-700">El pago es por Hora / Jornada</span>
              </label>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas u Observaciones</label>
            <textarea name="observations" value={form.observations} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500" />
          </div>
          
          <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
            <button type="button" onClick={() => router.back()} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

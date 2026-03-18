'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  tradeName: string | null;
  dniCuit: string;
}

export default function NuevoContratoPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    code: '',
    category: 'SERVICIOS',
    status: 'BORRADOR',
    description: '',
    observations: '',
    amount: '',
    currency: 'ARS',
    startDate: '',
    endDate: '',
    providerId: '',
    isHourly: false,
    paymentMethod: '',
    ipcEnabled: false,
    ipcPeriodMonths: '3',
  });

  useEffect(() => {
    fetch('/api/proveedores?limit=100')
      .then(r => r.json())
      .then(data => setProviders(data.providers || []))
      .catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/contratos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear contrato');
      }

      setSuccess(true);
      setTimeout(() => router.push('/dashboard/contratos'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Nuevo Contrato</h1>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-700">
          ✓ Contrato creado exitosamente. Redirigiendo...
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        {/* Código y Categoría */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Código *</label>
            <input name="code" value={form.code} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" placeholder="CONT-2026-001" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Categoría *</label>
            <select name="category" value={form.category} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="SERVICIOS">Servicios</option>
              <option value="ALQUILER">Alquiler</option>
              <option value="OBRA">Obra</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Estado</label>
            <select name="status" value={form.status} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="BORRADOR">Borrador</option>
              <option value="ACTIVO">Activo</option>
            </select>
          </div>
        </div>

        {/* Proveedor */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Proveedor / Contratado *</label>
          <select name="providerId" value={form.providerId} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="">Seleccionar proveedor...</option>
            {providers.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} {p.tradeName ? `(${p.tradeName})` : ''} — {p.dniCuit}
              </option>
            ))}
          </select>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Objeto / Descripción del Contrato *</label>
          <textarea name="description" value={form.description} onChange={handleChange} required rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" placeholder="Descripción del objeto del contrato..." />
        </div>

        {/* Monto y Moneda */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Monto Base *</label>
            <input name="amount" type="number" step="0.01" min="0" value={form.amount} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="0.00" />
            <label className="flex items-center gap-2 mt-2">
              <input type="checkbox" checked={form.isHourly} onChange={(e) => setForm({ ...form, isHourly: e.target.checked })} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-slate-600">Es monto por hora</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Forma de Pago / Metodología especial</label>
            <input name="paymentMethod" value={form.paymentMethod} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Ej: 33 Litros Combustible por Hora" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Moneda</label>
            <select name="currency" value={form.currency} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="ARS">ARS (Pesos)</option>
              <option value="USD">USD (Dólares)</option>
              <option value="EUR">EUR (Euros)</option>
            </select>
          </div>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Fecha de Inicio *</label>
            <input name="startDate" type="date" value={form.startDate} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Fecha de Finalización *</label>
            <input name="endDate" type="date" value={form.endDate} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
        </div>

        {/* Ajuste por IPC */}
        <div className="bg-violet-50/50 rounded-xl border border-violet-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-slate-700">Ajuste por IPC</label>
              <p className="text-xs text-slate-400 mt-0.5">Activar aviso de actualización periódica por Índice de Precios al Consumidor</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, ipcEnabled: !form.ipcEnabled })}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                form.ipcEnabled ? 'bg-violet-500' : 'bg-slate-300'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                form.ipcEnabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
          {form.ipcEnabled && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Frecuencia de ajuste</label>
              <select
                name="ipcPeriodMonths"
                value={form.ipcPeriodMonths}
                onChange={handleChange}
                className="w-full sm:w-48 px-3 py-2 border border-violet-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-white"
              >
                <option value="1">Mensual</option>
                <option value="3">Trimestral (cada 3 meses)</option>
                <option value="4">Cuatrimestral (cada 4 meses)</option>
                <option value="6">Semestral (cada 6 meses)</option>
                <option value="12">Anual</option>
              </select>
            </div>
          )}
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Observaciones</label>
          <textarea name="observations" value={form.observations} onChange={handleChange} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" placeholder="Observaciones opcionales..." />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50">
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            <Save className="w-4 h-4" /> {loading ? 'Guardando...' : 'Guardar Contrato'}
          </button>
        </div>
      </form>
    </div>
  );
}

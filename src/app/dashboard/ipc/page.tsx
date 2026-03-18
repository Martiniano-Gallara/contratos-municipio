'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  TrendingDown, TrendingUp, Check, AlertTriangle, Clock, Percent,
  CheckSquare, Square, ArrowRight, RefreshCw, Hammer
} from 'lucide-react';
import { hasPermission } from '@/lib/permissions';
import type { Role } from '@/lib/permissions';

interface IpcContract {
  id: string;
  code: string;
  description: string;
  amount: number;
  isHourly: boolean;
  currency: string;
  status: string;
  ipcPeriodMonths: number;
  ipcLastAdjustment: string | null;
  ipcNextAdjustment: string | null;
  startDate: string;
  endDate: string;
  provider: { id: string; name: string };
}

function formatCurrency(amount: number, currency: string) {
  const symbol = currency === 'USD' ? 'US$' : currency === 'EUR' ? '€' : '$';
  return `${symbol} ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-AR');
}

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function periodLabel(months: number): string {
  if (months === 1) return 'Mensual';
  if (months === 3) return 'Trimestral';
  if (months === 6) return 'Semestral';
  if (months === 12) return 'Anual';
  return `Cada ${months} meses`;
}

export default function IpcPage() {
  const { data: session } = useSession();
  const [pending, setPending] = useState<IpcContract[]>([]);
  const [upcoming, setUpcoming] = useState<IpcContract[]>([]);
  const [totalIpc, setTotalIpc] = useState(0);
  const [loading, setLoading] = useState(true);
  const [percentage, setPercentage] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const role = session?.user?.role as Role;
  const canUpdate = hasPermission(role, 'contracts.update');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ipc');
      const data = await res.json();
      setPending(data.pending || []);
      setUpcoming(data.upcoming || []);
      setTotalIpc(data.totalIpc || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === pending.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pending.map(c => c.id)));
    }
  };

  const handleUpdate = async () => {
    if (!percentage || Number(percentage) <= 0) {
      setErrorMsg('Debe ingresar un porcentaje válido mayor a 0');
      return;
    }
    const ids = Array.from(selected);
    if (ids.length === 0) {
      setErrorMsg('Debe seleccionar al menos un contrato');
      return;
    }
    setUpdating(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/ipc/actualizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractIds: ids, percentage: Number(percentage) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMsg(data.message);
      setSelected(new Set());
      setPercentage('');
      fetchData();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Error al actualizar');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  const previewAmount = (amount: number): string => {
    if (!percentage || Number(percentage) <= 0) return '-';
    const newAmt = amount * (1 + Number(percentage) / 100);
    return formatCurrency(Math.round(newAmt * 100) / 100, 'ARS');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-violet-500" />
            Ajustes por IPC
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestión de actualizaciones de montos por Índice de Precios al Consumidor
          </p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50">
          <RefreshCw className="w-4 h-4" /> Actualizar
        </button>
      </div>

      {/* Stats e ICC */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-5">
            <p className="text-sm font-medium text-violet-600">Total con IPC</p>
            <p className="text-3xl font-bold text-violet-700 mt-1">{totalIpc}</p>
          </div>
          <div className={`rounded-xl p-5 border ${pending.length > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <p className={`text-sm font-medium ${pending.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>Pendientes de ajuste</p>
            <p className={`text-3xl font-bold mt-1 ${pending.length > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{pending.length}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <p className="text-sm font-medium text-blue-600">Próximos ajustes</p>
            <p className="text-3xl font-bold text-blue-700 mt-1">{upcoming.length}</p>
          </div>
        </div>
        
        {/* ICC Section */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 md:col-span-1 shadow-sm relative overflow-hidden flex flex-col justify-center">
          <Hammer className="w-20 h-20 text-amber-500/10 absolute -right-2 -bottom-2" />
          <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-1.5 mb-2">
            Índice ICC
          </h3>
          <p className="text-xs text-amber-700 mb-3">
             Índice del Costo de la Construcción. Los ajustes de contratos de obra y anexos utilizan este referencial.
          </p>
          <a href="https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-33" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 hover:underline">
            Consultar último ICC <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-500" />
          <p className="text-sm font-medium text-emerald-700">{successMsg}</p>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <p className="text-sm font-medium text-red-700">{errorMsg}</p>
        </div>
      )}

      {/* Update Panel */}
      {canUpdate && pending.length > 0 && (
        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border-2 border-violet-200 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Percent className="w-5 h-5 text-violet-500" />
            Actualización Masiva por IPC
          </h3>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Porcentaje de aumento (%)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="Ej: 3.5"
                className="w-40 px-4 py-2.5 border-2 border-violet-200 rounded-xl text-lg font-bold text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 bg-white"
              />
            </div>
            <button onClick={selectAll} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-violet-200 text-sm font-medium text-violet-700 hover:bg-violet-100 transition-colors">
              {selected.size === pending.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              {selected.size === pending.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </button>
            <button
              onClick={handleUpdate}
              disabled={updating || selected.size === 0 || !percentage}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 transition-colors shadow-lg shadow-violet-200"
            >
              <TrendingUp className="w-4 h-4" />
              {updating ? 'Actualizando...' : `Actualizar ${selected.size} contrato${selected.size !== 1 ? 's' : ''}`}
            </button>
          </div>
          {percentage && Number(percentage) > 0 && selected.size > 0 && (
            <p className="text-xs text-violet-600 mt-1">
              Vista previa: los montos seleccionados aumentarán un <span className="font-bold">{percentage}%</span>
            </p>
          )}
        </div>
      )}

      {/* Pending Contracts Table */}
      {pending.length > 0 && (
        <div className="bg-white rounded-xl border-2 border-red-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-red-100 bg-red-50/50">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Contratos Pendientes de Ajuste
              <span className="ml-auto bg-red-100 text-red-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{pending.length}</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {canUpdate && <th className="w-10 px-4 py-3"></th>}
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Código</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Proveedor</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Monto actual</th>
                  {percentage && Number(percentage) > 0 && (
                    <th className="text-right px-4 py-3 font-medium text-violet-600">Nuevo monto</th>
                  )}
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Frecuencia</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Último ajuste</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Vencido hace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pending.map((c) => {
                  const overdue = c.ipcNextAdjustment ? daysSince(c.ipcNextAdjustment) : 0;
                  const isSelected = selected.has(c.id);
                  return (
                    <tr key={c.id} className={`transition-colors ${isSelected ? 'bg-violet-50/50' : 'hover:bg-slate-50/50'}`}>
                      {canUpdate && (
                        <td className="px-4 py-3">
                          <button onClick={() => toggleSelect(c.id)} className="text-violet-500 hover:text-violet-700">
                            {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                          </button>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <a href={`/dashboard/contratos/${c.id}`} className="font-medium text-slate-700 hover:text-violet-600">{c.code}</a>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{c.provider.name}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">
                        {c.isHourly ? `${formatCurrency(c.amount, c.currency)}/h` : formatCurrency(c.amount, c.currency)}
                      </td>
                      {percentage && Number(percentage) > 0 && (
                        <td className="px-4 py-3 text-right font-bold text-violet-600">
                          {isSelected ? (c.isHourly ? `${previewAmount(c.amount)}/h` : previewAmount(c.amount)) : '-'}
                        </td>
                      )}
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 font-medium">
                          {periodLabel(c.ipcPeriodMonths)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500 text-xs">
                        {c.ipcLastAdjustment ? formatDate(c.ipcLastAdjustment) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${overdue > 30 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {overdue}d
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No pending */}
      {pending.length === 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
          <Check className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-emerald-700 font-medium">No hay contratos pendientes de ajuste por IPC</p>
          <p className="text-sm text-emerald-500 mt-1">Todos los contratos están al día</p>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Próximos Ajustes Programados
              <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{upcoming.length}</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Código</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Proveedor</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Monto</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Frecuencia</th>
                  <th className="text-center px-4 py-3 font-medium text-slate-600">Próximo ajuste</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcoming.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <a href={`/dashboard/contratos/${c.id}`} className="font-medium text-slate-700 hover:text-blue-600">{c.code}</a>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.provider.name}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                      {c.isHourly ? `${formatCurrency(c.amount, c.currency)}/h` : formatCurrency(c.amount, c.currency)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-medium">
                        {periodLabel(c.ipcPeriodMonths)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500 text-xs">
                      {c.ipcNextAdjustment ? formatDate(c.ipcNextAdjustment) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { BarChart3, PieChart, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface SummaryData {
  byCategory: { category: string; count: number; totalAmount: number }[];
  byStatus: { status: string; count: number }[];
  byProvider: { name: string; total: number; count: number }[];
  totals: { count: number; totalAmount: number };
}


const categoryLabels: Record<string, string> = { SERVICIOS: 'Servicios', ALQUILER: 'Alquiler', OBRA: 'Obra' };

export default function ReportesPage() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '' });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ type: 'summary' });
      if (filters.dateFrom) p.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) p.set('dateTo', filters.dateTo);
      const res = await fetch(`/api/reportes?${p}`);
      setData(await res.json());
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, []);

  const exportExcel = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();
    
    // Categorias
    const catData = data.byCategory.map(c => ({ 
      Categoría: categoryLabels[c.category] || c.category, 
      Cantidad: c.count, 
      'Monto Acumulado': c.totalAmount 
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(catData), "Categorías");

    // Proveedores Top
    const provData = data.byProvider.map(p => ({
      Proveedor: p.name,
      'Contratos': p.count,
      'Monto Total': p.total
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(provData), "Top Proveedores");

    XLSX.writeFile(wb, `Reporte_Contratos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Reportes Financieros y Operativos</h1>
        <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm transition-colors shadow-sm">
          <Download className="w-4 h-4" /> Exportar Excel
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex gap-4 items-end shadow-sm">
        <div className="flex-1">
          <label className="block text-xs text-slate-500 mb-1">Creados desde</label>
          <input type="date" value={filters.dateFrom} onChange={e => setFilters({...filters, dateFrom: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-slate-500 mb-1">Creados hasta</label>
          <input type="date" value={filters.dateTo} onChange={e => setFilters({...filters, dateTo: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <button onClick={fetchReports} className="px-5 py-2 bg-slate-800 text-white rounded-lg text-sm mb-0.5">Generar</button>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" /></div>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-700 flex gap-2 items-center mb-6"><PieChart className="w-5 h-5" /> Distribución Monetaria por Categoría</h3>
              <div className="space-y-4">
                {data.byCategory.map(c => (
                  <div key={c.category} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div>
                      <p className="font-medium text-slate-700">{categoryLabels[c.category] || c.category}</p>
                      <p className="text-xs text-slate-500">{c.count} contratos</p>
                    </div>
                    <span className="font-bold text-blue-700 text-lg">${c.totalAmount.toLocaleString('es-AR')}</span>
                  </div>
                ))}
                <div className="pt-2 border-t font-semibold flex justify-between text-slate-800">
                  <span>Total Consolidado</span>
                  <span>${data.totals.totalAmount.toLocaleString('es-AR')}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-semibold text-slate-700 flex gap-2 items-center mb-6"><BarChart3 className="w-5 h-5" /> Top 10 Proveedores por Monto</h3>
              <div className="space-y-3">
                {data.byProvider.map((p, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="flex gap-3 items-center w-2/3">
                      <span className="w-6 text-slate-400 font-medium text-sm">{i+1}.</span>
                      <p className="font-medium text-sm text-slate-700 truncate">{p.name}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-800">${p.total.toLocaleString('es-AR')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { FileType, Plus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { hasPermission } from '@/lib/permissions';
import type { Role } from '@/lib/permissions';

interface Template {
  id: string;
  category: string;
  name: string;
  content: string;
  active: boolean;
}

const categoryLabels: Record<string, string> = { RESCISION: 'Rescisión', OBSERVACION: 'Observación', CLAUSULA: 'Cláusula', NOTA_INTERNA: 'Nota Interna' };

export default function PlantillasPage() {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ category: 'RESCISION', name: '', content: '' });

  const role = session?.user?.role as Role;
  const canManage = hasPermission(role, 'templates.create');

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      setShowCreate(false);
      setForm({ category: 'RESCISION', name: '', content: '' });
      fetchTemplates();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center"><FileType className="w-5 h-5 text-slate-600" /></div>
          <div><h1 className="text-2xl font-bold text-slate-800">Plantillas de Texto</h1><p className="text-sm text-slate-500">Textos predefinidos para agilizar la carga</p></div>
        </div>
        {canManage && (
          <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Nueva Plantilla
          </button>
        )}
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Categoría</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Nombre</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Contenido</label>
            <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={4} required className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-lg text-sm text-slate-600">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Guardar</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" /></div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border"><FileType className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">Sin plantillas. Crea la primera para agilizar la carga de datos.</p></div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {templates.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">{categoryLabels[t.category]}</span>
                <span className={`text-xs ${t.active ? 'text-emerald-600' : 'text-slate-400'}`}>{t.active ? 'Activa' : 'Inactiva'}</span>
              </div>
              <h3 className="font-medium text-slate-800 mb-1">{t.name}</h3>
              <p className="text-sm text-slate-500 line-clamp-3">{t.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

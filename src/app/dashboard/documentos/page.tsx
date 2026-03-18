'use client';

import { useEffect, useState } from 'react';
import { FolderOpen, FileText, Download } from 'lucide-react';

interface Doc {
  id: string;
  name: string;
  type: string;
  filePath: string;
  createdAt: string;
  contract: { code: string };
  uploadedBy: { name: string };
}

const typeLabels: Record<string, string> = { CONTRATO_ORIGINAL: 'Contrato', ADENDA: 'Adenda', ANEXO: 'Anexo', RESCISION: 'Rescisión', COMPROBANTE: 'Comprobante', OTRO: 'Otro' };

export default function DocumentosPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/documentos')
      .then(r => r.json())
      .then(data => { setDocs(data.documents || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center"><FolderOpen className="w-5 h-5 text-slate-600" /></div>
        <div><h1 className="text-2xl font-bold text-slate-800">Documentos</h1><p className="text-sm text-slate-500">Todos los archivos PDF adjuntos a contratos</p></div>
      </div>
      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" /></div>
      ) : docs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
          <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Sin documentos. Los documentos se adjuntan desde el detalle de cada contrato.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b"><tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Documento</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Tipo</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Contrato</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Subido por</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Fecha</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">Acción</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {docs.map(d => (
                <tr key={d.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 flex items-center gap-2"><FileText className="w-4 h-4 text-red-500" />{d.name}</td>
                  <td className="px-4 py-3 text-slate-500">{typeLabels[d.type] || d.type}</td>
                  <td className="px-4 py-3 font-medium">{d.contract?.code}</td>
                  <td className="px-4 py-3 text-slate-500">{d.uploadedBy?.name}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(d.createdAt).toLocaleDateString('es-AR')}</td>
                  <td className="px-4 py-3 text-center"><a href={d.filePath} download className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 inline-flex"><Download className="w-4 h-4" /></a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

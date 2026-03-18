'use client';

import { Settings, Info } from 'lucide-react';

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center"><Settings className="w-5 h-5 text-slate-600" /></div>
        <div><h1 className="text-2xl font-bold text-slate-800">Configuración</h1><p className="text-sm text-slate-500">Ajustes del sistema</p></div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Información del Sistema</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">Versión</span><span className="font-medium text-slate-700">1.0.0</span></div>
          <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">Stack</span><span className="font-medium text-slate-700">Next.js + Prisma + PostgreSQL</span></div>
          <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">Almacenamiento</span><span className="font-medium text-slate-700">Local (/uploads)</span></div>
          <div className="flex justify-between py-2"><span className="text-slate-500">Sesión</span><span className="font-medium text-slate-700">JWT - 8 horas</span></div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-xl border border-blue-200 p-5 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-1">Gestión de usuarios</p>
          <p>Los usuarios se gestionan vía seed o directamente en la base de datos. En futuras versiones, los administradores podrán gestionar usuarios desde esta sección.</p>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Plus, Download, Printer, Settings, FileSpreadsheet } from 'lucide-react';

interface HeaderProps {
  activeTab: 'oficial' | 'prenomina' | 'calculadora' | 'analisis';
  setActiveTab: (tab: 'oficial' | 'prenomina' | 'calculadora' | 'analisis') => void;
  onOpenNewEmployee: () => void;
  onOpenSettings: () => void;
  onExportCSV: () => void;
  periodoNombre: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewEmployee,
  onOpenSettings,
  onExportCSV,
  periodoNombre
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 no-print shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-slate-800" />
              <span>Prenómina de Salario</span>
            </span>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              · {periodoNombre}
            </span>
          </div>

          {/* Zone 2: 4 clean single-line text navigation links */}
          <nav className="flex items-center gap-5 text-sm font-medium text-slate-600 overflow-x-auto">
            <button
              onClick={() => setActiveTab('oficial')}
              className={`whitespace-nowrap pb-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'oficial'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Formato Oficial (PDF)
            </button>
            <button
              onClick={() => setActiveTab('prenomina')}
              className={`whitespace-nowrap pb-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'prenomina'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Liquidación General
            </button>
            <button
              onClick={() => setActiveTab('calculadora')}
              className={`whitespace-nowrap pb-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'calculadora'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Calculadora Rápida
            </button>
            <button
              onClick={() => setActiveTab('analisis')}
              className={`whitespace-nowrap pb-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'analisis'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Análisis & Costos
            </button>
          </nav>

          {/* Zone 3: Actions area */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={onExportCSV}
              title="Descargar datos en CSV"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden md:inline">Exportar CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              title="Imprimir formato oficial o resumen"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden md:inline">Imprimir</span>
            </button>

            <button
              onClick={onOpenSettings}
              title="Configuración de tasas y reglas"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenNewEmployee}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Trabajador</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

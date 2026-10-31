import React, { useState } from 'react';
import { Plus, Download, Upload, Printer, Settings, FileSpreadsheet, HardDrive, Palette } from 'lucide-react';

import { AppTabId } from './ArchiveFolderNav';
import { PWAInstallButton } from './PWAInstallButton';
import { ColorTheme } from '../types/payroll';

interface HeaderProps {
  activeTab: AppTabId;
  setActiveTab: (tab: AppTabId) => void;
  onOpenNewEmployee: () => void;
  onOpenSettings: () => void;
  onExportCSV: () => void;
  onCreateBackup: () => void;
  onRestoreBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  periodoNombre: string;
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewEmployee,
  onOpenSettings,
  onExportCSV,
  onCreateBackup,
  onRestoreBackup,
  periodoNombre,
  colorTheme,
  setColorTheme
}) => {
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 no-print shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-slate-800" />
              <span>Prenómina de Salario</span>
            </span>
            <PWAInstallButton />
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              · {periodoNombre}
            </span>
          </div>

          {/* Zone 2: Navigation Links for quick access */}
          <nav className="hidden lg:flex items-center gap-4 text-xs font-semibold text-slate-600 overflow-x-auto">
            <button
              onClick={() => setActiveTab('oficial')}
              className={`whitespace-nowrap pb-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'oficial'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Prenómina Oficial
            </button>
            <button
              onClick={() => setActiveTab('cierre')}
              className={`whitespace-nowrap pb-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'cierre'
                  ? 'border-emerald-600 text-emerald-900 font-bold'
                  : 'border-transparent text-emerald-700/80 hover:text-emerald-900'
              }`}
            >
              Cierre Empresa
            </button>
            <button
              onClick={() => setActiveTab('prenomina')}
              className={`whitespace-nowrap pb-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'prenomina'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Planilla General
            </button>
            <button
              onClick={() => setActiveTab('salarioPromedio')}
              className={`whitespace-nowrap pb-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'salarioPromedio'
                  ? 'border-indigo-600 text-indigo-900 font-bold'
                  : 'border-transparent text-indigo-700/80 hover:text-indigo-900'
              }`}
            >
              Salario Promedio
            </button>
            <button
              onClick={() => setActiveTab('controlClaves')}
              className={`whitespace-nowrap pb-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'controlClaves'
                  ? 'border-rose-600 text-rose-900 font-bold'
                  : 'border-transparent text-rose-700/80 hover:text-rose-900'
              }`}
            >
              Control de Claves
            </button>
            <button
              onClick={() => setActiveTab('analisis')}
              className={`whitespace-nowrap pb-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'analisis'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Auditoría & Costos
            </button>
            <button
              onClick={() => setActiveTab('calculadora')}
              className={`whitespace-nowrap pb-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'calculadora'
                  ? 'border-slate-900 text-slate-900 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Calculadora
            </button>
            <button
              onClick={() => setActiveTab('certificados')}
              className={`whitespace-nowrap pb-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'certificados'
                  ? 'border-teal-600 text-teal-900 font-bold'
                  : 'border-transparent text-teal-700/80 hover:text-teal-900'
              }`}
            >
              Certificados
            </button>
          </nav>

          {/* Zone 3: Actions area */}
          <div className="flex items-center gap-2 sm:gap-2 shrink-0">
            {/* Crear Salva */}
            <button
              onClick={onCreateBackup}
              title="Crear y descargar archivo de salva local (.json)"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <HardDrive className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden xl:inline">Crear Salva</span>
            </button>

            {/* Restaurar Salva */}
            <label
              title="Restaurar datos desde un archivo de salva local (.json)"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden xl:inline">Restaurar</span>
              <input
                type="file"
                accept=".json"
                onChange={onRestoreBackup}
                className="hidden"
              />
            </label>

            <button
              onClick={onExportCSV}
              title="Descargar datos en CSV"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden lg:inline">CSV</span>
            </button>

            {/* Selector de Tema Claro */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                title="Seleccionar modo de color claro"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                <Palette className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden xl:inline">
                  {colorTheme === 'white' && 'Blanco Puro'}
                  {colorTheme === 'ivory' && 'Marfil Clásico'}
                  {colorTheme === 'slate' && 'Gris Ejecutivo'}
                  {colorTheme === 'blue' && 'Azul Corporativo'}
                  {colorTheme === 'mint' && 'Verde Menta'}
                </span>
              </button>

              {showThemeDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-xl border border-slate-200 py-1.5 z-50 text-xs font-medium text-slate-700">
                  <div className="px-3 py-1.5 text-3xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Modos de Color Claro
                  </div>
                  <button
                    onClick={() => { setColorTheme('white'); setShowThemeDropdown(false); }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 cursor-pointer ${colorTheme === 'white' ? 'bg-slate-100 font-bold text-slate-900' : ''}`}
                  >
                    <span>Blanco Puro (Clásico)</span>
                    {colorTheme === 'white' && <span className="w-2 h-2 rounded-full bg-slate-900"></span>}
                  </button>
                  <button
                    onClick={() => { setColorTheme('ivory'); setShowThemeDropdown(false); }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-amber-50/50 cursor-pointer ${colorTheme === 'ivory' ? 'bg-amber-50 font-bold text-stone-900' : ''}`}
                  >
                    <span>Marfil Clásico</span>
                    {colorTheme === 'ivory' && <span className="w-2 h-2 rounded-full bg-amber-600"></span>}
                  </button>
                  <button
                    onClick={() => { setColorTheme('slate'); setShowThemeDropdown(false); }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 cursor-pointer ${colorTheme === 'slate' ? 'bg-slate-100 font-bold text-slate-900' : ''}`}
                  >
                    <span>Gris Ejecutivo</span>
                    {colorTheme === 'slate' && <span className="w-2 h-2 rounded-full bg-slate-700"></span>}
                  </button>
                  <button
                    onClick={() => { setColorTheme('blue'); setShowThemeDropdown(false); }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-sky-50 cursor-pointer ${colorTheme === 'blue' ? 'bg-sky-50 font-bold text-sky-900' : ''}`}
                  >
                    <span>Azul Corporativo</span>
                    {colorTheme === 'blue' && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
                  </button>
                  <button
                    onClick={() => { setColorTheme('mint'); setShowThemeDropdown(false); }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-emerald-50 cursor-pointer ${colorTheme === 'mint' ? 'bg-emerald-50 font-bold text-emerald-900' : ''}`}
                  >
                    <span>Verde Menta</span>
                    {colorTheme === 'mint' && <span className="w-2 h-2 rounded-full bg-emerald-600"></span>}
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onOpenSettings}
              title="Configuración de tasas y reglas"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenNewEmployee}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Trabajador</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

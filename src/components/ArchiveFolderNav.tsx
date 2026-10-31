import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FolderCheck,
  Building2,
  FileSpreadsheet,
  BarChart3,
  Calculator,
  Award,
  Archive,
  ChevronDown,
  Layers,
  Sparkles,
  ShieldCheck,
  FileText,
  Scale,
  TrendingUp,
  KeyRound
} from 'lucide-react';

export type AppTabId = 'oficial' | 'cierre' | 'prenomina' | 'salarioPromedio' | 'controlClaves' | 'analisis' | 'calculadora' | 'certificados' | 'evolucion';

interface FolderTabDefinition {
  id: AppTabId;
  label: string;
  shortLabel: string;
  category: 'principal' | 'adicional';
  description: string;
  badge?: string;
  icon: React.ElementType;
  tabColor: {
    activeBorder: string;
    activeBg: string;
    activeText: string;
    badgeBg: string;
    badgeText: string;
    tagBg: string;
    tagText: string;
  };
}

interface ArchiveFolderNavProps {
  activeTab: AppTabId;
  setActiveTab: (tab: AppTabId) => void;
  totalOfficialWorkers: number;
  totalCentrosCosto: number;
  totalGeneralWorkers: number;
  periodoNombre: string;
  activeCCName: string;
  onOpenSettings?: () => void;
}

export const ArchiveFolderNav: React.FC<ArchiveFolderNavProps> = ({
  activeTab,
  setActiveTab,
  totalOfficialWorkers,
  totalCentrosCosto,
  totalGeneralWorkers,
  periodoNombre,
  activeCCName
}) => {
  const [isAdditionalMenuOpen, setIsAdditionalMenuOpen] = useState(false);

  // Definición de las carpetas guardadas en el archivo
  const folders: FolderTabDefinition[] = [
    {
      id: 'oficial',
      label: 'Prenómina Oficial',
      shortLabel: 'Oficial PDF',
      category: 'principal',
      description: 'Control de tiempo 1-31 días, asistencia y firmas',
      badge: `${totalOfficialWorkers} trab.`,
      icon: FileSpreadsheet,
      tabColor: {
        activeBorder: 'border-slate-800',
        activeBg: 'bg-white',
        activeText: 'text-slate-900',
        badgeBg: 'bg-slate-100',
        badgeText: 'text-slate-700',
        tagBg: 'bg-slate-900',
        tagText: 'text-white'
      }
    },
    {
      id: 'cierre',
      label: 'Cierre Final Empresa',
      shortLabel: 'Cierre Empresa',
      category: 'adicional',
      description: 'Consolidación de todos los Centros de Costo y liquidación global',
      badge: `${totalCentrosCosto} CCs Consolidado`,
      icon: Building2,
      tabColor: {
        activeBorder: 'border-emerald-600',
        activeBg: 'bg-white',
        activeText: 'text-emerald-950',
        badgeBg: 'bg-emerald-100',
        badgeText: 'text-emerald-800',
        tagBg: 'bg-emerald-700',
        tagText: 'text-white'
      }
    },
    {
      id: 'prenomina',
      label: 'Liquidación General',
      shortLabel: 'Planilla General',
      category: 'principal',
      description: 'Listado general con estados de cobro y colillas',
      badge: `${totalGeneralWorkers} reg.`,
      icon: FolderCheck,
      tabColor: {
        activeBorder: 'border-blue-600',
        activeBg: 'bg-white',
        activeText: 'text-blue-950',
        badgeBg: 'bg-blue-100',
        badgeText: 'text-blue-800',
        tagBg: 'bg-blue-700',
        tagText: 'text-white'
      }
    },
    {
      id: 'salarioPromedio',
      label: 'Salario Promedio',
      shortLabel: 'Salario Promedio',
      category: 'principal',
      description: 'Determinación según Ley 116 y Dec. 326 (vacaciones, defensa, donaciones, interrupciones)',
      badge: 'Ley 116',
      icon: Scale,
      tabColor: {
        activeBorder: 'border-indigo-600',
        activeBg: 'bg-white',
        activeText: 'text-indigo-950',
        badgeBg: 'bg-indigo-100',
        badgeText: 'text-indigo-800',
        tagBg: 'bg-indigo-700',
        tagText: 'text-white'
      }
    },
    {
      id: 'controlClaves',
      label: 'Control de Claves',
      shortLabel: 'Claves & Bajas',
      category: 'principal',
      description: 'Resumen de todas las claves configuradas y control de bajas C-27',
      badge: 'C-27 Bajas',
      icon: KeyRound,
      tabColor: {
        activeBorder: 'border-rose-600',
        activeBg: 'bg-white',
        activeText: 'text-rose-950',
        badgeBg: 'bg-rose-100',
        badgeText: 'text-rose-800',
        tagBg: 'bg-rose-700',
        tagText: 'text-white'
      }
    },
    {
      id: 'analisis',
      label: 'Auditoría & Costos',
      shortLabel: 'Estadísticas',
      category: 'adicional',
      description: 'Estructura salarial, indicadores y gráficos',
      badge: 'Métricas',
      icon: BarChart3,
      tabColor: {
        activeBorder: 'border-violet-600',
        activeBg: 'bg-white',
        activeText: 'text-violet-950',
        badgeBg: 'bg-violet-100',
        badgeText: 'text-violet-800',
        tagBg: 'bg-violet-700',
        tagText: 'text-white'
      }
    },
    {
      id: 'calculadora',
      label: 'Calculadora & Simulador',
      shortLabel: 'Calculadora',
      category: 'adicional',
      description: 'Simulador con escala, antigüedad, títulos y nocturnidad',
      badge: 'Tasas 2026',
      icon: Calculator,
      tabColor: {
        activeBorder: 'border-amber-600',
        activeBg: 'bg-white',
        activeText: 'text-amber-950',
        badgeBg: 'bg-amber-100',
        badgeText: 'text-amber-800',
        tagBg: 'bg-amber-600',
        tagText: 'text-white'
      }
    },
    {
      id: 'certificados',
      label: 'Certificados & Constancias',
      shortLabel: 'Certificados',
      category: 'adicional',
      description: 'Generación de cartas de ingresos y constancias salariales',
      badge: 'Módulo Nuevo',
      icon: Award,
      tabColor: {
        activeBorder: 'border-teal-600',
        activeBg: 'bg-white',
        activeText: 'text-teal-950',
        badgeBg: 'bg-teal-100',
        badgeText: 'text-teal-800',
        tagBg: 'bg-teal-700',
        tagText: 'text-white'
      }
    },
    {
      id: 'evolucion',
      label: 'Evolución Salarial',
      shortLabel: 'Evolución Bruta',
      category: 'principal',
      description: 'Evolución del salario devengado mensual por empleado (sin retenciones)',
      badge: 'Historial',
      icon: TrendingUp,
      tabColor: {
        activeBorder: 'border-amber-600',
        activeBg: 'bg-white',
        activeText: 'text-amber-950',
        badgeBg: 'bg-amber-100',
        badgeText: 'text-amber-800',
        tagBg: 'bg-amber-700',
        tagText: 'text-white'
      }
    }
  ];

  return (
    <div className="w-full no-print">
      
      {/* Barra archivadora superior: Simula la gaveta de archivo físico */}
      <div className="bg-slate-900 text-slate-300 rounded-t-2xl px-4 pt-3 pb-2.5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
        
        {/* Identificador del archivador */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800/90 rounded-lg text-amber-400 border border-slate-700 flex items-center justify-center">
            <Archive className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-100">
                Archivo del Sistema Salarial de AGESP
              </span>
              <span className="bg-amber-400/20 text-amber-300 text-3xs font-mono font-bold px-1.5 py-0.5 rounded border border-amber-400/30">
                SISTEMA DOCUMENTAL
              </span>
            </div>
            <p className="text-3xs text-slate-400 font-mono">
              Expediente: {periodoNombre} · Centro Activo: {activeCCName}
            </p>
          </div>
        </div>

        {/* Indicadores rápidos de archivo y selector de módulos adicionales */}
        <div className="flex items-center gap-2 relative">
          <div className="text-3xs text-slate-400 hidden xl:flex items-center gap-3 mr-2 font-mono">
            <span>📁 {folders.length} Carpetas en gaveta</span>
            <span>·</span>
            <span>✓ Datos sincronizados</span>
          </div>

          {/* Botón de Gaveta de Módulos Adicionales */}
          <div className="relative">
            <button
              onClick={() => setIsAdditionalMenuOpen(!isAdditionalMenuOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Explorar Gaveta (+ Módulos)</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isAdditionalMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Menú flotante de la gaveta de módulos adicionales */}
            {isAdditionalMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-50 text-slate-900 animate-in fade-in slide-in-from-top-2 duration-150"
                onMouseLeave={() => setIsAdditionalMenuOpen(false)}
              >
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 block">
                    Carpetas y Módulos Adicionales
                  </span>
                  <p className="text-3xs text-slate-500 mt-0.5">
                    Seleccione una carpeta para abrirla directamente en la mesa de trabajo:
                  </p>
                </div>

                <div className="space-y-1">
                  {folders.map(f => {
                    const Icon = f.icon;
                    const isActive = activeTab === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => {
                          setActiveTab(f.id);
                          setIsAdditionalMenuOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg flex items-start gap-2.5 transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-slate-100 font-bold text-slate-900'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className={`p-1.5 rounded-md mt-0.5 ${isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold leading-tight">{f.label}</span>
                            {f.badge && (
                              <span className="text-3xs font-mono font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                {f.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-3xs text-slate-500 truncate mt-0.5">{f.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 px-3 py-1 bg-amber-50/50 rounded-lg">
                  <div className="flex items-center gap-1.5 text-3xs font-bold text-amber-900">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>Módulos de cálculo ampliables</span>
                  </div>
                  <p className="text-4xs text-amber-800 mt-0.5">
                    Organización modular para incorporar nuevos formatos de nómina y cálculos futuros.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Riel de Carpetas Físicas (Filing Folder Tabs) */}
      <div className="bg-slate-800/90 px-2 sm:px-4 pt-2.5 flex items-end gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar border-x border-slate-800 shadow-inner">
        {folders.map(folder => {
          const isActive = activeTab === folder.id;
          const Icon = folder.icon;

          return (
            <button
              key={folder.id}
              onClick={() => setActiveTab(folder.id)}
              className={`group relative flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-t-xl transition-all cursor-pointer whitespace-nowrap select-none border-t-2 ${
                isActive
                  ? `${folder.tabColor.activeBg} ${folder.tabColor.activeBorder} ${folder.tabColor.activeText} shadow-md translate-y-0.5 z-10 font-bold border-l border-r border-slate-300`
                  : 'bg-slate-700/80 hover:bg-slate-700 border-transparent text-slate-300 hover:text-white border-l border-r border-slate-600/60 mb-0.5'
              }`}
              title={folder.description}
            >
              {/* Oreja visual de carpeta */}
              <div className="flex items-center gap-1.5">
                {isActive ? (
                  <FolderOpen className={`w-4 h-4 ${folder.id === 'cierre' ? 'text-emerald-700' : 'text-slate-900'}`} />
                ) : (
                  <Folder className="w-4 h-4 text-slate-400 group-hover:text-slate-200" />
                )}
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'opacity-90' : 'opacity-60'}`} />
              </div>

              {/* Título de la Carpeta */}
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs tracking-tight">
                    {folder.label}
                  </span>
                  {folder.badge && (
                    <span
                      className={`text-3xs font-mono font-semibold px-1.5 py-0.5 rounded ${
                        isActive
                          ? `${folder.tabColor.badgeBg} ${folder.tabColor.badgeText}`
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {folder.badge}
                    </span>
                  )}
                </div>
              </div>

              {/* Pestaña indicadora si está activa */}
              {isActive && (
                <span className={`w-1.5 h-1.5 rounded-full ${folder.tabColor.tagBg}`} />
              )}
            </button>
          );
        })}
      </div>

    </div>
  );
};

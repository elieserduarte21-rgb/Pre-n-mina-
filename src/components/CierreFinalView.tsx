import React, { useState } from 'react';
import { EmployeeWithPrenominaCalc, PayrollSettings, CentroCosto } from '../types/payroll';
import {
  Building2,
  Printer,
  Download,
  Users,
  Clock,
  Moon,
  Coins,
  ShieldCheck,
  FileCheck,
  ChevronRight,
  Filter,
  CheckCircle2,
  Calculator,
  Briefcase,
  FileSpreadsheet
} from 'lucide-react';
import { exportWorkbookToExcel } from '../utils/excelHelper';

interface CierreFinalViewProps {
  allEmployees: EmployeeWithPrenominaCalc[];
  settings: PayrollSettings;
  periodoNombre: string;
  onGoToCC?: (ccId: string) => void;
  onOpenSettings?: () => void;
}

interface ResumenCC {
  cc: CentroCosto;
  totalTrabajadores: number;
  totalHorasLaboradas: number;
  totalNocturnidad: number;
  totalHorasExtra: number;
  totalImporteExtra: number;
  totalActivAjenas: number;
  totalVacacionesC25: number;
  totalDeduccionesHoras: number;
  totalSalario: number;
  trabajadores: EmployeeWithPrenominaCalc[];
}

export const CierreFinalView: React.FC<CierreFinalViewProps> = ({
  allEmployees,
  settings,
  periodoNombre,
  onGoToCC,
  onOpenSettings
}) => {
  const [selectedFilterCC, setSelectedFilterCC] = useState<string>('todos');
  const [expandedCCId, setExpandedCCId] = useState<string | null>(null);

  const centrosCosto = settings.centrosCosto || [];

  // Consolidación de datos por Centro de Costo
  const resumenPorCC: ResumenCC[] = centrosCosto.map(cc => {
    const empsCC = allEmployees.filter(e => {
      if (e.centroCostoId) return e.centroCostoId === cc.id;
      return cc.id === 'cc-101';
    });

    const totalTrabajadores = empsCC.length;
    const totalHorasLaboradas = empsCC.reduce((sum, e) => sum + e.tiempoRealLaborado, 0);
    const totalNocturnidad = empsCC.reduce((sum, e) => sum + (e.nocturnidad?.totalNocturnidad || 0), 0);
    const totalHorasExtra = empsCC.reduce((sum, e) => sum + (e.trabajoExtra?.horas || 0), 0);
    const totalImporteExtra = empsCC.reduce((sum, e) => sum + (e.trabajoExtra?.importe || 0), 0);
    const totalActivAjenas = empsCC.reduce((sum, e) => sum + (e.activAjenas || 0), 0);
    const totalVacacionesC25 = empsCC.reduce(
      (sum, e) => sum + (e.deducciones?.vacacPlanifC25 || e.horasVacacionesCalculadas || 0),
      0
    );
    const totalDeduccionesHoras = empsCC.reduce((sum, e) => sum + (e.totalDeduccionesHoras || 0), 0);
    const totalSalario = empsCC.reduce((sum, e) => sum + e.salarioTotalEstimado, 0);

    return {
      cc,
      totalTrabajadores,
      totalHorasLaboradas: Math.round(totalHorasLaboradas * 100) / 100,
      totalNocturnidad: Math.round(totalNocturnidad * 100) / 100,
      totalHorasExtra: Math.round(totalHorasExtra * 10) / 10,
      totalImporteExtra: Math.round(totalImporteExtra * 100) / 100,
      totalActivAjenas: Math.round(totalActivAjenas * 100) / 100,
      totalVacacionesC25: Math.round(totalVacacionesC25 * 10) / 10,
      totalDeduccionesHoras: Math.round(totalDeduccionesHoras * 10) / 10,
      totalSalario: Math.round(totalSalario * 100) / 100,
      trabajadores: empsCC
    };
  });

  // Gran Total Empresa
  const granTotal = resumenPorCC.reduce(
    (acc, item) => {
      acc.totalTrabajadores += item.totalTrabajadores;
      acc.totalHorasLaboradas += item.totalHorasLaboradas;
      acc.totalNocturnidad += item.totalNocturnidad;
      acc.totalHorasExtra += item.totalHorasExtra;
      acc.totalImporteExtra += item.totalImporteExtra;
      acc.totalActivAjenas += item.totalActivAjenas;
      acc.totalVacacionesC25 += item.totalVacacionesC25;
      acc.totalDeduccionesHoras += item.totalDeduccionesHoras;
      acc.totalSalario += item.totalSalario;
      return acc;
    },
    {
      totalTrabajadores: 0,
      totalHorasLaboradas: 0,
      totalNocturnidad: 0,
      totalHorasExtra: 0,
      totalImporteExtra: 0,
      totalActivAjenas: 0,
      totalVacacionesC25: 0,
      totalDeduccionesHoras: 0,
      totalSalario: 0
    }
  );

  // Totales por Categoría Ocupacional (T, C, O, A, S)
  const resumenPorCat = ['T', 'C', 'O', 'A', 'S'].map(cat => {
    const emps = allEmployees.filter(e => (e.catOcupacional || 'T') === cat);
    const count = emps.length;
    const salario = emps.reduce((sum, e) => sum + e.salarioTotalEstimado, 0);
    const label =
      cat === 'T' ? 'Técnicos (T)' :
      cat === 'C' ? 'Cuadros / Dirigentes (C)' :
      cat === 'O' ? 'Operarios (O)' :
      cat === 'A' ? 'Administrativos (A)' : 'Servicios (S)';
    return { cat, label, count, salario };
  });

  // Estimaciones tributarias y de seguridad social
  const contribucionSegSocial12_5 = granTotal.totalSalario * 0.125;
  const impuestoFuerzaTrabajo5 = granTotal.totalSalario * 0.05;
  const retencionIngresosPers5 = granTotal.totalSalario * 0.05;
  const costoTotalEmpresa = granTotal.totalSalario + contribucionSegSocial12_5 + impuestoFuerzaTrabajo5;

  // Exportar a CSV
  const handleExportCSV = () => {
    const headers = [
      'Código CC',
      'Nombre Centro de Costo',
      'Confecciona',
      'Chequea',
      'Trabajadores',
      'Horas Reales Laboradas',
      'Total Nocturnidad ($)',
      'Horas Extras (C-74)',
      'Importe Horas Extras ($)',
      'Actividades Ajenas ($)',
      'Vacaciones Planificadas C-25 (h)',
      'Total Deducciones (h)',
      'Salario Total Liquidado ($)'
    ];

    const rows = resumenPorCC.map(r => [
      `"${r.cc.codigoCC}"`,
      `"${r.cc.nombre}"`,
      `"${r.cc.confecciona}"`,
      `"${r.cc.chequea}"`,
      r.totalTrabajadores,
      r.totalHorasLaboradas,
      r.totalNocturnidad.toFixed(2),
      r.totalHorasExtra,
      r.totalImporteExtra.toFixed(2),
      r.totalActivAjenas.toFixed(2),
      r.totalVacacionesC25,
      r.totalDeduccionesHoras,
      r.totalSalario.toFixed(2)
    ]);

    rows.push([
      '"GRAN TOTAL EMPRESA"',
      '"CONSOLIDADO TODOS LOS CC"',
      '""',
      '""',
      granTotal.totalTrabajadores,
      granTotal.totalHorasLaboradas.toFixed(2),
      granTotal.totalNocturnidad.toFixed(2),
      granTotal.totalHorasExtra,
      granTotal.totalImporteExtra.toFixed(2),
      granTotal.totalActivAjenas.toFixed(2),
      granTotal.totalVacacionesC25,
      granTotal.totalDeduccionesHoras,
      granTotal.totalSalario.toFixed(2)
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Acta_Cierre_Final_Empresa_${periodoNombre.replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Exportar a Excel (.xlsx)
  const handleExportExcel = () => {
    const dataCC = resumenPorCC.map(r => ({
      'Código CC': r.cc.codigoCC,
      'Nombre Centro de Costo': r.cc.nombre,
      'Trabajadores': r.totalTrabajadores,
      'Horas Reales Laboradas': r.totalHorasLaboradas,
      'Nocturnidad ($)': r.totalNocturnidad,
      'Horas Extras (C-74)': r.totalHorasExtra,
      'Importe Horas Extras ($)': r.totalImporteExtra,
      'Actividades Ajenas ($)': r.totalActivAjenas,
      'Vacaciones Planificadas C-25 (h)': r.totalVacacionesC25,
      'Total Deducciones (h)': r.totalDeduccionesHoras,
      'Salario Total Liquidado ($)': r.totalSalario
    }));

    dataCC.push({
      'Código CC': 'GRAN TOTAL',
      'Nombre Centro de Costo': 'CONSOLIDADO EMPRESA',
      'Trabajadores': granTotal.totalTrabajadores,
      'Horas Reales Laboradas': Number(granTotal.totalHorasLaboradas.toFixed(2)),
      'Nocturnidad ($)': Number(granTotal.totalNocturnidad.toFixed(2)),
      'Horas Extras (C-74)': granTotal.totalHorasExtra,
      'Importe Horas Extras ($)': Number(granTotal.totalImporteExtra.toFixed(2)),
      'Actividades Ajenas ($)': Number(granTotal.totalActivAjenas.toFixed(2)),
      'Vacaciones Planificadas C-25 (h)': granTotal.totalVacacionesC25,
      'Total Deducciones (h)': granTotal.totalDeduccionesHoras,
      'Salario Total Liquidado ($)': Number(granTotal.totalSalario.toFixed(2))
    });

    const dataAportes = [
      { Concepto: 'Salario Devengado Total', Base: granTotal.totalSalario, Tasa: '—', Importe: granTotal.totalSalario },
      { Concepto: 'Contribución Especial Seguridad Social (CESS)', Base: granTotal.totalSalario, Tasa: '5.0%', Importe: retencionIngresosPers5 },
      { Concepto: 'Seguridad Social Patronal (Empresa)', Base: granTotal.totalSalario, Tasa: '12.5%', Importe: contribucionSegSocial12_5 },
      { Concepto: 'Impuesto por Utilización Fuerza de Trabajo (IUFT)', Base: granTotal.totalSalario, Tasa: '5.0%', Importe: impuestoFuerzaTrabajo5 },
      { Concepto: 'Costo Laboral Total Empresa', Base: granTotal.totalSalario, Tasa: '—', Importe: costoTotalEmpresa }
    ];

    exportWorkbookToExcel(`Cierre_Final_Consolidado_Empresa_${periodoNombre.replace(/\s+/g, '_')}`, [
      { name: 'Consolidado Centros de Costo', data: dataCC },
      { name: 'Costo Laboral y Aportes', data: dataAportes }
    ]);
  };

  const listaFiltrada = selectedFilterCC === 'todos'
    ? resumenPorCC
    : resumenPorCC.filter(r => r.cc.id === selectedFilterCC);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Portada de la Carpeta de Cierre */}
      <div className="bg-white rounded-2xl border border-emerald-900/15 shadow-sm p-5 sm:p-6 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-sm shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-3xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Carpeta de Archivo Oficial · Expediente de Cierre
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {periodoNombre}
                </span>
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                Cierre Final de Empresa · Consolidación de Todos los Centros de Costo
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Auditoría general, integración total de horas laboradas, nocturnidad global, deducciones autorizadas y liquidación total.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center flex-wrap">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-900 bg-emerald-100/90 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-800" />
              <span>Exportar Excel (.xlsx)</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Cierre</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards de Resumen Gerencial */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 no-print">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-3xs font-bold uppercase tracking-wider">Centros de Costo</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {centrosCosto.length} <span className="text-xs font-normal text-slate-500">unidades</span>
          </div>
          <p className="text-3xs text-slate-500 mt-1">
            {granTotal.totalTrabajadores} trabajadores activos
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200/80 bg-amber-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-3xs font-bold uppercase tracking-wider">Horas Laboradas</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-950">
            {granTotal.totalHorasLaboradas.toLocaleString('es-ES', { maximumFractionDigits: 1 })} <span className="text-xs font-normal text-amber-700">h</span>
          </div>
          <p className="text-3xs text-amber-700 mt-1">
            Base mensual: {settings.divisorHorasMes || 190.6} h/mes
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-yellow-200/80 bg-yellow-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-yellow-800 mb-1">
            <span className="text-3xs font-bold uppercase tracking-wider">Nocturnidad Total</span>
            <Moon className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="text-2xl font-black font-mono text-yellow-950">
            ${granTotal.totalNocturnidad.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-3xs text-yellow-700 mt-1">
            Noches $100 + Horas $5 / $10
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-300 bg-emerald-50/40 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-3xs font-bold uppercase tracking-wider">Fondo Salario Total</span>
            <Coins className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-950">
            ${granTotal.totalSalario.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-3xs text-emerald-700 mt-1 font-semibold">
            Salario bruto liquidado en empresa
          </p>
        </div>
      </div>

      {/* Documento Formal de Acta de Cierre */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* Cabecera Impresa */}
        <div className="border-b-2 border-slate-900 pb-4 text-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <span className="text-3xs font-mono font-bold uppercase tracking-widest text-slate-500 block">
                REPÚBLICA DE CUBA · CONTROL DE NÓMINAS Y SALARIOS
              </span>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900 mt-0.5">
                ACTA DE CONSOLIDACIÓN Y CIERRE FINAL DE LA EMPRESA
              </h2>
              <p className="text-xs text-slate-600 font-mono mt-1">
                Resumen Económico y de Tiempo Laboral de Todos los Centros de Costo · Divisor Legal: {settings.divisorHorasMes || 190.6} horas
              </p>
            </div>
            <div className="text-left sm:text-right text-xs font-mono shrink-0">
              <span className="font-bold text-slate-900">Periodo:</span> {periodoNombre}
              <br />
              <span className="text-slate-500 text-2xs">Emisión: {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              <br />
              <span className="text-emerald-700 font-bold text-2xs">ESTADO: CONCILIADO Y CERRADO</span>
            </div>
          </div>
        </div>

        {/* Filtro / Selector de Centro de Costo (no-print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700">Visualizar Detalle:</span>
            <select
              value={selectedFilterCC}
              onChange={e => setSelectedFilterCC(e.target.value)}
              className="text-xs font-medium bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="todos">Todos los Centros de Costo ({resumenPorCC.length})</option>
              {resumenPorCC.map(r => (
                <option key={r.cc.id} value={r.cc.id}>
                  {r.cc.codigoCC} - {r.cc.nombre} ({r.totalTrabajadores} trab.)
                </option>
              ))}
            </select>
          </div>

          <div className="text-2xs text-slate-500">
            Haga clic en un Centro de Costo para expandir la lista de sus trabajadores.
          </div>
        </div>

        {/* Tabla Principal de Consolidación por CC */}
        <div className="border border-slate-900 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left border-collapse text-3xs font-mono">
            <thead>
              <tr className="bg-slate-200 text-slate-950 border-b border-slate-900 font-bold uppercase tracking-tight">
                <th className="py-2.5 px-3 border-r border-slate-900">Centro de Costo</th>
                <th className="py-2.5 px-2 border-r border-slate-900">Responsables (Confecciona / Chequea)</th>
                <th className="py-2.5 px-1.5 text-center border-r border-slate-900 w-14">Trab.</th>
                <th className="py-2.5 px-2 text-right border-r border-slate-900 bg-amber-100">Horas Reales</th>
                <th className="py-2.5 px-2 text-right border-r border-slate-900 bg-yellow-100">Nocturnidad ($)</th>
                <th className="py-2.5 px-2 text-right border-r border-slate-900 bg-orange-100">Extra C-74 ($)</th>
                <th className="py-2.5 px-1.5 text-center border-r border-slate-900 bg-rose-100">Vac. C-25 (h)</th>
                <th className="py-2.5 px-2 text-right border-r border-slate-900">Deducciones (h)</th>
                <th className="py-2.5 px-3 text-right bg-emerald-100 text-emerald-950 font-black">Salario Total ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {listaFiltrada.map(item => {
                const isExpanded = expandedCCId === item.cc.id;
                return (
                  <React.Fragment key={item.cc.id}>
                    <tr
                      onClick={() => setExpandedCCId(isExpanded ? null : item.cc.id)}
                      className={`hover:bg-emerald-50/30 transition-colors cursor-pointer ${isExpanded ? 'bg-emerald-50/40' : ''}`}
                    >
                      <td className="py-2.5 px-3 border-r border-slate-400 font-sans font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-90 text-emerald-700' : ''}`} />
                          <span className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded text-3xs font-mono">
                            {item.cc.codigoCC}
                          </span>
                          <span className="font-semibold">{item.cc.nombre}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 border-r border-slate-400 text-slate-700 font-sans">
                        <div className="text-3xs uppercase leading-tight font-medium">
                          <span>{item.cc.confecciona || '—'}</span>
                          <span className="text-slate-400 block text-4xs">Rev: {item.cc.chequea || '—'}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-1.5 text-center border-r border-slate-400 font-bold text-slate-900">
                        {item.totalTrabajadores}
                      </td>
                      <td className="py-2.5 px-2 text-right border-r border-slate-400 font-bold text-amber-950 bg-amber-50/40 tabular-nums">
                        {item.totalHorasLaboradas.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-2 text-right border-r border-slate-400 font-bold text-yellow-950 bg-yellow-50/40 tabular-nums">
                        ${item.totalNocturnidad.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2 text-right border-r border-slate-400 font-bold text-orange-950 bg-orange-50/40 tabular-nums">
                        ${item.totalImporteExtra.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-1.5 text-center border-r border-slate-400 font-bold text-rose-950 bg-rose-50/40 tabular-nums">
                        {item.totalVacacionesC25}
                      </td>
                      <td className="py-2.5 px-2 text-right border-r border-slate-400 text-slate-600 tabular-nums">
                        {item.totalDeduccionesHoras}h
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-950 bg-emerald-50 tabular-nums">
                        ${item.totalSalario.toFixed(2)}
                      </td>
                    </tr>

                    {/* Fila desplegable con el detalle de los trabajadores del CC */}
                    {isExpanded && (
                      <tr className="bg-slate-50/90 no-print">
                        <td colSpan={9} className="p-3 border-r border-slate-400">
                          <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-2xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-emerald-700" />
                                Trabajadores en {item.cc.codigoCC} - {item.cc.nombre} ({item.trabajadores.length})
                              </span>
                              {onGoToCC && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onGoToCC(item.cc.id);
                                  }}
                                  className="text-3xs font-semibold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                                >
                                  Abrir Hoja de Prenómina de este CC →
                                </button>
                              )}
                            </div>
                            
                            {item.trabajadores.length === 0 ? (
                              <p className="text-2xs text-slate-400 italic">No hay trabajadores registrados en este Centro de Costo.</p>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-3xs font-mono">
                                  <thead>
                                    <tr className="border-b border-slate-200 text-slate-500">
                                      <th className="py-1">Trabajador</th>
                                      <th className="py-1">Cargo</th>
                                      <th className="py-1 text-center">Cat.</th>
                                      <th className="py-1 text-right">Escala + Antig.</th>
                                      <th className="py-1 text-right">Horas Reales</th>
                                      <th className="py-1 text-right">Nocturnidad</th>
                                      <th className="py-1 text-right">Salario Estimado</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {item.trabajadores.map(w => (
                                      <tr key={w.id} className="hover:bg-slate-50">
                                        <td className="py-1 font-sans font-bold text-slate-800">{w.nombreApellidos}</td>
                                        <td className="py-1 font-sans text-slate-600">{w.cargo}</td>
                                        <td className="py-1 text-center font-bold text-slate-700">{w.catOcupacional || 'T'}</td>
                                        <td className="py-1 text-right">${w.salarioBasicoTotal || w.salarioBasicoEscala || 0}</td>
                                        <td className="py-1 text-right text-amber-900 font-semibold">{w.tiempoRealLaborado.toFixed(1)}h</td>
                                        <td className="py-1 text-right text-yellow-900 font-semibold">${(w.nocturnidad?.totalNocturnidad || 0).toFixed(2)}</td>
                                        <td className="py-1 text-right font-black text-emerald-900">${w.salarioTotalEstimado.toFixed(2)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-200 border-t-2 border-slate-900 font-bold text-slate-950 text-2xs uppercase">
                <td colSpan={2} className="py-3 px-3 border-r border-slate-900 font-black">
                  GRAN TOTAL EMPRESA (CONSOLIDADO TODOS LOS CC)
                </td>
                <td className="py-3 px-1.5 text-center border-r border-slate-900 font-black">
                  {granTotal.totalTrabajadores}
                </td>
                <td className="py-3 px-2 text-right border-r border-slate-900 font-black bg-amber-200 tabular-nums">
                  {granTotal.totalHorasLaboradas.toFixed(1)}
                </td>
                <td className="py-3 px-2 text-right border-r border-slate-900 font-black bg-yellow-200 tabular-nums">
                  ${granTotal.totalNocturnidad.toFixed(2)}
                </td>
                <td className="py-3 px-2 text-right border-r border-slate-900 font-black bg-orange-200 tabular-nums">
                  ${granTotal.totalImporteExtra.toFixed(2)}
                </td>
                <td className="py-3 px-1.5 text-center border-r border-slate-900 font-black bg-rose-200 tabular-nums">
                  {granTotal.totalVacacionesC25}
                </td>
                <td className="py-3 px-2 text-right border-r border-slate-900 font-black tabular-nums">
                  {granTotal.totalDeduccionesHoras}h
                </td>
                <td className="py-3 px-3 text-right font-black text-emerald-950 bg-emerald-200 tabular-nums">
                  ${granTotal.totalSalario.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Sección Adicional de Cierre: Categorías Ocupacionales y Aportes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          
          {/* Desglose por Categoría Ocupacional */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase text-slate-800 mb-2 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-600" />
              Desglose por Categoría Ocupacional
            </h3>
            <div className="space-y-1.5">
              {resumenPorCat.map(catItem => {
                const pct = granTotal.totalSalario > 0
                  ? ((catItem.salario / granTotal.totalSalario) * 100).toFixed(1)
                  : '0.0';
                return (
                  <div key={catItem.cat} className="flex items-center justify-between text-2xs font-mono py-1 border-b border-slate-200/60 last:border-0">
                    <span className="font-sans text-slate-700">
                      {catItem.label} ({catItem.count})
                    </span>
                    <span className="font-bold text-slate-900">
                      ${catItem.salario.toFixed(2)} <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Liquidación de Cargas Impositivas y Aportes Patronales */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase text-slate-800 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              Estimación de Aportes Patronales & Retenciones
            </h3>
            <div className="space-y-1.5 text-2xs font-mono">
              <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                <span className="font-sans text-slate-700">Contribución Seg. Social Patronal (12.5%):</span>
                <span className="font-bold text-slate-900">${contribucionSegSocial12_5.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                <span className="font-sans text-slate-700">Impuesto Uso Fuerza de Trabajo (5%):</span>
                <span className="font-bold text-slate-900">${impuestoFuerzaTrabajo5.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                <span className="font-sans text-slate-700">Retención Estimada Ingresos Personales (5%):</span>
                <span className="font-bold text-amber-800">-${retencionIngresosPers5.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-1 pt-2 font-bold text-slate-900">
                <span className="font-sans">Costo Laboral Total Empresa:</span>
                <span className="text-emerald-900 font-black">${costoTotalEmpresa.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Firmas Formales de Cierre */}
        <div className="pt-4 print:pt-2 border-t border-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs font-mono print:text-[8px]">
          <div className="border-t-2 border-slate-900 pt-2 print:pt-1">
            <span className="font-black block text-slate-900 uppercase">Confecciona</span>
            <span className="text-2xs text-slate-600 uppercase block">Especialista Nóminas</span>
            <span className="text-xs font-bold text-slate-950 mt-1 block uppercase">{settings.firmasGlobales?.confecciona || 'DAYSI REYES DÍAZ'}</span>
            <span className="text-3xs text-slate-400 mt-2 block print:hidden">Firma y Cuño Oficial</span>
          </div>
          <div className="border-t-2 border-slate-900 pt-2 print:pt-1">
            <span className="font-black block text-slate-900 uppercase">Chequea</span>
            <span className="text-2xs text-slate-600 uppercase block">Económico / Finanzas</span>
            <span className="text-xs font-bold text-slate-950 mt-1 block uppercase">{settings.firmasGlobales?.chequea || 'PEDRO ALBERTO GALBÁN LOPEZ'}</span>
            <span className="text-3xs text-slate-400 mt-2 block print:hidden">Firma y Cuño Oficial</span>
          </div>
          <div className="border-t-2 border-slate-900 pt-2 print:pt-1">
            <span className="font-black block text-slate-900 uppercase">Aprueba</span>
            <span className="text-2xs text-slate-600 uppercase block">Director de la Empresa</span>
            <span className="text-xs font-bold text-slate-950 mt-1 block uppercase">{settings.firmasGlobales?.aprueba || 'ZUNILDA MENDEZ LINARES'}</span>
            <span className="text-3xs text-slate-400 mt-2 block print:hidden">Firma y Cuño Oficial</span>
          </div>
          <div className="border-t-2 border-slate-900 pt-2 print:pt-1">
            <span className="font-black block text-slate-900 uppercase">Anota</span>
            <span className="text-2xs text-slate-600 uppercase block">Control y Asistencia</span>
            <span className="text-xs font-bold text-slate-950 mt-1 block uppercase">{settings.firmasGlobales?.anota || 'ELIESER DUARTES LÓPEZ'}</span>
            <span className="text-3xs text-slate-400 mt-2 block print:hidden">Firma y Cuño Oficial</span>
          </div>
        </div>

      </div>

    </div>
  );
};

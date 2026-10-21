import React from 'react';
import { EmployeeWithPrenominaCalc, PayrollSettings, CentroCosto } from '../types/payroll';
import { X, Printer, Download, FileSpreadsheet, Building2, CheckCircle2 } from 'lucide-react';

interface CierreFinalModalProps {
  isOpen: boolean;
  onClose: () => void;
  allEmployees: EmployeeWithPrenominaCalc[];
  settings: PayrollSettings;
  periodoNombre: string;
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
}

export const CierreFinalModal: React.FC<CierreFinalModalProps> = ({
  isOpen,
  onClose,
  allEmployees,
  settings,
  periodoNombre
}) => {
  if (!isOpen) return null;

  const centrosCosto = settings.centrosCosto || [];

  // Calcular consolidación por cada Centro de Costo
  const resumenPorCC: ResumenCC[] = centrosCosto.map(cc => {
    // Si el trabajador tiene centroCostoId igual, o si no tiene y es el primer CC
    const empsCC = allEmployees.filter(e => {
      if (e.centroCostoId) return e.centroCostoId === cc.id;
      return cc.id === 'cc-101'; // Default
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
      totalSalario: Math.round(totalSalario * 100) / 100
    };
  });

  // Totales Generales de la Empresa (Suma de todos los CC)
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

  // Exportar Cierre Final a CSV
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

    // Fila totalizadora
    rows.push([
      '"GRAN TOTAL EMPRESA"',
      '"CONSOLIDADO TODOS LOS CC"',
      '""',
      '""',
      granTotal.totalTrabajadores,
      granTotal.totalHorasLaboradas,
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
    link.download = `Cierre_Final_Empresa_Prenomina_${periodoNombre.replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-white rounded-lg">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Cierre Final de Empresa · Consolidación de Todos los Centros de Costo (CC)
              </h2>
              <p className="text-xs text-slate-500">
                {periodoNombre} · Integración total de horas, nocturnidad, extras y salarios devengados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Archivo Final (CSV)</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Cierre</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido Imprimible del Cierre Final */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 print:p-0">
          
          {/* Encabezado Formal del Documento de Cierre */}
          <div className="border-b-2 border-slate-900 pb-3 text-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-base font-black uppercase tracking-tight">
                  ACTA DE CIERRE FINAL DE PRENÓMINA DE LA EMPRESA
                </h1>
                <p className="text-xs text-slate-600 font-mono mt-0.5">
                  Resumen Económico y de Tiempo Laboral por Centros de Costo · Divisor Legal: {settings.divisorHorasMes || 190.6} horas
                </p>
              </div>
              <div className="text-right text-xs font-mono">
                <span className="font-bold">Periodo:</span> {periodoNombre}
                <br />
                <span className="text-slate-500 text-2xs">Emisión: {new Date().toLocaleDateString('es-ES')}</span>
              </div>
            </div>
          </div>

          {/* Tarjetas Resumen de Totales Generales */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Centros de Costo
              </span>
              <span className="text-xl font-bold font-mono text-slate-900">
                {centrosCosto.length} <span className="text-xs font-normal text-slate-500">unidades</span>
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Total Trabajadores
              </span>
              <span className="text-xl font-bold font-mono text-slate-900">
                {granTotal.totalTrabajadores} <span className="text-xs font-normal text-slate-500">activos</span>
              </span>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-2xs font-bold text-amber-800 uppercase tracking-wider block mb-1">
                Horas Reales Laboradas
              </span>
              <span className="text-xl font-bold font-mono text-amber-950">
                {granTotal.totalHorasLaboradas.toLocaleString('es-ES')} <span className="text-xs font-normal text-amber-800">horas</span>
              </span>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-2xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                Gran Total Nómina ($)
              </span>
              <span className="text-xl font-black font-mono text-emerald-950">
                ${granTotal.totalSalario.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Tabla de Consolidación por CC */}
          <div className="border border-slate-900 rounded-lg overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-3xs font-mono">
              <thead>
                <tr className="bg-slate-200 text-slate-950 border-b border-slate-900 font-bold uppercase">
                  <th className="py-2 px-2 border-r border-slate-900">Centro de Costo</th>
                  <th className="py-2 px-2 border-r border-slate-900">Responsable Confección</th>
                  <th className="py-2 px-1 text-center border-r border-slate-900 w-12">Trab.</th>
                  <th className="py-2 px-2 text-right border-r border-slate-900 bg-amber-100">Horas Reales</th>
                  <th className="py-2 px-2 text-right border-r border-slate-900 bg-yellow-100">Nocturnidad ($)</th>
                  <th className="py-2 px-2 text-right border-r border-slate-900 bg-orange-100">Extra C-74 ($)</th>
                  <th className="py-2 px-1 text-center border-r border-slate-900 bg-rose-100">Vac. C-25 (h)</th>
                  <th className="py-2 px-2 text-right border-r border-slate-900">Otras Ded. (h)</th>
                  <th className="py-2 px-2 text-right bg-emerald-100 text-emerald-950 font-black">Salario Total ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {resumenPorCC.map(item => (
                  <tr key={item.cc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-2 border-r border-slate-400 font-sans font-bold text-slate-900">
                      <span className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded text-3xs font-mono mr-1.5">
                        {item.cc.codigoCC}
                      </span>
                      <span>{item.cc.nombre}</span>
                    </td>
                    <td className="py-2 px-2 border-r border-slate-400 uppercase text-slate-700 font-sans">
                      {item.cc.confecciona}
                    </td>
                    <td className="py-2 px-1 text-center border-r border-slate-400 font-bold text-slate-900">
                      {item.totalTrabajadores}
                    </td>
                    <td className="py-2 px-2 text-right border-r border-slate-400 font-bold text-amber-950 bg-amber-50/50 tabular-nums">
                      {item.totalHorasLaboradas.toFixed(1)}
                    </td>
                    <td className="py-2 px-2 text-right border-r border-slate-400 font-bold text-yellow-950 bg-yellow-50/50 tabular-nums">
                      ${item.totalNocturnidad.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-right border-r border-slate-400 font-bold text-orange-950 bg-orange-50/50 tabular-nums">
                      ${item.totalImporteExtra.toFixed(2)}
                    </td>
                    <td className="py-2 px-1 text-center border-r border-slate-400 font-bold text-rose-950 bg-rose-50/50 tabular-nums">
                      {item.totalVacacionesC25}
                    </td>
                    <td className="py-2 px-2 text-right border-r border-slate-400 text-slate-600 tabular-nums">
                      {item.totalDeduccionesHoras}h
                    </td>
                    <td className="py-2 px-2 text-right font-black text-emerald-950 bg-emerald-50 tabular-nums">
                      ${item.totalSalario.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-200 border-t-2 border-slate-900 font-bold text-slate-950 text-2xs uppercase">
                  <td colSpan={2} className="py-2.5 px-2 border-r border-slate-900 font-black">
                    GRAN TOTAL EMPRESA (CONSOLIDADO)
                  </td>
                  <td className="py-2.5 px-1 text-center border-r border-slate-900 font-black">
                    {granTotal.totalTrabajadores}
                  </td>
                  <td className="py-2.5 px-2 text-right border-r border-slate-900 font-black bg-amber-200 tabular-nums">
                    {granTotal.totalHorasLaboradas.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-2 text-right border-r border-slate-900 font-black bg-yellow-200 tabular-nums">
                    ${granTotal.totalNocturnidad.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2 text-right border-r border-slate-900 font-black bg-orange-200 tabular-nums">
                    ${granTotal.totalImporteExtra.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-1 text-center border-r border-slate-900 font-black bg-rose-200 tabular-nums">
                    {granTotal.totalVacacionesC25}
                  </td>
                  <td className="py-2.5 px-2 text-right border-r border-slate-900 font-black tabular-nums">
                    {granTotal.totalDeduccionesHoras}h
                  </td>
                  <td className="py-2.5 px-2 text-right font-black text-emerald-950 bg-emerald-200 tabular-nums">
                    ${granTotal.totalSalario.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Firmas de Autorización y Cierre */}
          <div className="pt-6 grid grid-cols-3 gap-6 text-center text-xs font-mono">
            <div className="border-t border-slate-400 pt-1">
              <span className="font-bold block text-slate-800">Confeccionó Cierre</span>
              <span className="text-2xs text-slate-500 uppercase">Especialista Principal de Nóminas</span>
            </div>
            <div className="border-t border-slate-400 pt-1">
              <span className="font-bold block text-slate-800">Revisó y Concilió</span>
              <span className="text-2xs text-slate-500 uppercase">Director de Contabilidad y Finanzas</span>
            </div>
            <div className="border-t border-slate-400 pt-1">
              <span className="font-bold block text-slate-800">Aprobó Pago Total</span>
              <span className="text-2xs text-slate-500 uppercase">Director General</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

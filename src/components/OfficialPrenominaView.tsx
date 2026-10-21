import React, { useState } from 'react';
import { 
  EmployeeWithPrenominaCalc, 
  HeaderPrenomina, 
  TotalesPrenomina, 
  PayrollSettings,
  ClaveDeduccion,
  TarifaNocturnidad,
  ClaveActividadAjena
} from '../types/payroll';
import { 
  DEFAULT_TARIFAS_NOCTURNIDAD, 
  DEFAULT_CLAVES_DEDUCCION, 
  DEFAULT_CLAVES_ACTIVIDADES_AJENAS 
} from '../data/defaultData';
import { getDeduccionValue, getNocturnidadCantidad } from '../utils/prenominaCalculator';
import { Edit3, Plus, Trash2, Printer, Save, RotateCcw, Building2, ChevronLeft, ChevronRight, FileSpreadsheet, Settings } from 'lucide-react';

interface OfficialPrenominaViewProps {
  header: HeaderPrenomina;
  onUpdateHeader: (newHeader: HeaderPrenomina) => void;
  employees: EmployeeWithPrenominaCalc[];
  totals: TotalesPrenomina;
  settings: PayrollSettings;
  selectedCCId: string;
  onSelectCC: (ccId: string) => void;
  onOpenCierreFinal: () => void;
  onOpenSettings: () => void;
  onUpdateDay: (employeeId: string, dayIndex: number, value: string) => void;
  onUpdateEmployeeField: (employeeId: string, updates: Partial<EmployeeWithPrenominaCalc>) => void;
  onAddNewEmployee: () => void;
  onEditEmployee: (worker: EmployeeWithPrenominaCalc) => void;
  onDeleteEmployee: (employeeId: string) => void;
  onResetToPdfSample: () => void;
}

export const OfficialPrenominaView: React.FC<OfficialPrenominaViewProps> = ({
  header,
  onUpdateHeader,
  employees,
  totals,
  settings,
  selectedCCId,
  onSelectCC,
  onOpenCierreFinal,
  onOpenSettings,
  onUpdateDay,
  onUpdateEmployeeField,
  onAddNewEmployee,
  onEditEmployee,
  onDeleteEmployee,
  onResetToPdfSample
}) => {
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [headerForm, setHeaderForm] = useState<HeaderPrenomina>(header);

  // Paginación oficial: 20 trabajadores por hoja
  const WORKERS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(employees.length / WORKERS_PER_PAGE));
  const validCurrentPage = Math.min(currentPage, totalPages);
  
  const startIndex = (validCurrentPage - 1) * WORKERS_PER_PAGE;
  const currentEmployees = employees.slice(startIndex, startIndex + WORKERS_PER_PAGE);

  // Claves y tarifas activas configurables
  const activeClavesDeduccion: ClaveDeduccion[] = (settings.clavesDeduccion || DEFAULT_CLAVES_DEDUCCION).filter(
    c => c.activa !== false
  );

  const activeTarifasNoct: TarifaNocturnidad[] = (settings.tarifasNocturnidad || DEFAULT_TARIFAS_NOCTURNIDAD).filter(
    t => t.activa !== false
  );

  const activeClavesActivAjenas: ClaveActividadAjena[] = (settings.clavesActividadesAjenas || DEFAULT_CLAVES_ACTIVIDADES_AJENAS).filter(
    a => a.activa !== false
  );

  const handleSaveHeader = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateHeader(headerForm);
    setIsEditingHeader(false);
  };

  const activeCC = (settings.centrosCosto || []).find(c => c.id === selectedCCId) || {
    id: selectedCCId,
    codigoCC: header.direccionCC || 'CC 101',
    nombre: 'DIRECCIÓN'
  };

  // Actualizador para deducción dinámica
  const handleUpdateDeduccion = (emp: EmployeeWithPrenominaCalc, codigo: string, valStr: string) => {
    const val = parseFloat(valStr) || 0;
    const newDedValores = { ...(emp.deduccionesValores || {}), [codigo]: val };

    // Sincronizar también con campos legados para máxima retrocompatibilidad
    const legacyUpdates: any = {};
    if (codigo === 'C-25') legacyUpdates.vacacPlanifC25 = val;
    if (codigo === 'C-20') legacyUpdates.cMedC20 = val;
    if (codigo === 'C-10' || codigo === 'C-11') legacyUpdates.ausInjustJustC10_C11 = val;
    if (codigo === 'C-82') legacyUpdates.vacacSimultanC82 = val;
    if (codigo === 'C-27') legacyUpdates.bajaC27 = val;
    if (codigo === 'C-30') legacyUpdates.nuevoIngC30 = val;
    if (codigo === 'C-31') legacyUpdates.trasladoC31 = val;

    onUpdateEmployeeField(emp.id, {
      deduccionesValores: newDedValores,
      deducciones: { ...(emp.deducciones || {}), ...legacyUpdates }
    });
  };

  // Actualizador para nocturnidad dinámica
  const handleUpdateNocturnidad = (emp: EmployeeWithPrenominaCalc, codigo: string, cantStr: string) => {
    const cant = parseFloat(cantStr) || 0;
    const newNoctValores = { ...(emp.nocturnidadValores || {}), [codigo]: cant };

    // Calcular el total monetario de nocturnidad
    let total = 0;
    activeTarifasNoct.forEach(t => {
      const c = t.codigo === codigo ? cant : (newNoctValores[t.codigo] ?? getNocturnidadCantidad(emp, t.codigo));
      total += c * t.tarifa;
    });

    const legacyUpdates: any = {};
    if (codigo === 'nochesComp100') legacyUpdates.nochesComp100 = cant;
    if (codigo === 'horas5') legacyUpdates.horas5 = cant;
    if (codigo === 'horas10') legacyUpdates.horas10 = cant;

    onUpdateEmployeeField(emp.id, {
      nocturnidadValores: newNoctValores,
      nocturnidad: {
        ...(emp.nocturnidad || {}),
        ...legacyUpdates,
        totalNocturnidad: Math.round(total * 100) / 100
      }
    });
  };

  // Actualizador para horas extras / doblajes C-74 (Horas arriba, calcula importe abajo)
  const handleUpdateHorasC74 = (emp: EmployeeWithPrenominaCalc, horasStr: string) => {
    const horas = parseFloat(horasStr) || 0;
    const divisor = settings.divisorHorasMes || 190.6;
    const factor = settings.factorExtraFestiva || 2.0;
    const tarifa = emp.tarifaHoraria || ((emp.salarioBasicoEscala || 4800) / divisor);
    const importe = Math.round(horas * tarifa * factor * 100) / 100;

    onUpdateEmployeeField(emp.id, {
      trabajoExtra: { horas, importe }
    });
  };

  return (
    <div className="space-y-4">
      
      {/* Controles de Vista, Selector de CC y Acciones Rápidas (Excluidos de Impresión) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-xl no-print shadow-xs">
        
        {/* Selector de Centro de Costo (CC) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <Building2 className="w-4 h-4 text-slate-700" />
            <span className="text-2xs font-bold uppercase text-slate-600">Centro de Costo:</span>
            <select
              value={selectedCCId}
              onChange={e => {
                onSelectCC(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent font-bold text-xs text-slate-900 focus:outline-none cursor-pointer"
            >
              {(settings.centrosCosto || []).map(cc => (
                <option key={cc.id} value={cc.id}>
                  {cc.codigoCC} — {cc.nombre}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-500 font-mono">
            · REEUP: {header.codigoREEUP} · {employees.length} trabajadores en {activeCC.codigoCC}
          </span>
        </div>

        {/* Acciones principales */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Botón Cierre Final Consolidado */}
          <button
            onClick={onOpenCierreFinal}
            title="Consolidar todos los Centros de Costo en el Cierre Final"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Cierre Final de Empresa</span>
          </button>

          {/* Botón para Configurar Escaque y Claves de Deducciones / Nocturnidad */}
          <button
            onClick={onOpenSettings}
            title="Modificar escaques, claves de deducción, tarifas de nocturnidad y actividades ajenas"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>Configurar Escaques & Claves</span>
          </button>

          <button
            onClick={() => setIsEditingHeader(!isEditingHeader)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditingHeader ? 'Cerrar Datos' : 'Firmas & Datos'}</span>
          </button>

          <button
            onClick={onResetToPdfSample}
            title="Cargar datos exactos del modelo PDF adjunto"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer PDF</span>
          </button>

          <button
            onClick={() => window.print()}
            title="Imprimir hoja oficial (solo área obligatoria: de Nombre a Deducciones)"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Hoja (Área Oficial)</span>
          </button>

          <button
            onClick={onAddNewEmployee}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Trabajador</span>
          </button>
        </div>
      </div>

      {/* Barra de Paginación (20 trabajadores por hoja) */}
      <div className="flex items-center justify-between bg-white px-4 py-2 border border-slate-200 rounded-xl no-print text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800">
            Hoja {validCurrentPage} de {totalPages}
          </span>
          <span className="text-slate-500 text-2xs">
            (Mostrando {employees.length === 0 ? 0 : startIndex + 1} a {Math.min(startIndex + WORKERS_PER_PAGE, employees.length)} de {employees.length} trabajadores · Máximo 20 por hoja)
          </span>
          <span className="text-2xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 ml-2">
            Área de Impresión: Nombre hasta Deducciones (el Salario Total es solo informativo en web)
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={validCurrentPage <= 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="p-1 rounded border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors cursor-pointer text-slate-700"
            title="Hoja anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx + 1}
              onClick={() => setCurrentPage(idx + 1)}
              className={`px-2.5 py-0.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                validCurrentPage === idx + 1
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {idx + 1}
            </button>
          ))}

          <button
            type="button"
            disabled={validCurrentPage >= totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className="p-1 rounded border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors cursor-pointer text-slate-700"
            title="Hoja siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor del Encabezado de Control (Si está activo) */}
      {isEditingHeader && (
        <form onSubmit={handleSaveHeader} className="bg-slate-50 border border-slate-200 rounded-xl p-4 no-print space-y-3 text-xs">
          <div className="font-bold text-slate-800 uppercase tracking-wider text-2xs">
            Editar Firmas y Parámetros del Formato Oficial
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-2xs text-slate-600 mb-0.5">Confecciona:</label>
              <input
                type="text"
                value={headerForm.confecciona}
                onChange={e => setHeaderForm({ ...headerForm, confecciona: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-2xs text-slate-600 mb-0.5">Chequea:</label>
              <input
                type="text"
                value={headerForm.chequea}
                onChange={e => setHeaderForm({ ...headerForm, chequea: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-2xs text-slate-600 mb-0.5">Aprueba:</label>
              <input
                type="text"
                value={headerForm.aprueba}
                onChange={e => setHeaderForm({ ...headerForm, aprueba: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-2xs text-slate-600 mb-0.5">Anota:</label>
              <input
                type="text"
                value={headerForm.anota}
                onChange={e => setHeaderForm({ ...headerForm, anota: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <div>
              <label className="block text-2xs text-slate-600 mb-0.5">Periodo:</label>
              <input
                type="text"
                value={headerForm.periodoCorresponde}
                onChange={e => setHeaderForm({ ...headerForm, periodoCorresponde: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-2xs text-slate-600 mb-0.5">Consecutivo:</label>
              <input
                type="text"
                value={headerForm.numeroConsecutivo}
                onChange={e => setHeaderForm({ ...headerForm, numeroConsecutivo: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-2xs text-slate-600 mb-0.5">Desde:</label>
              <input
                type="text"
                value={headerForm.fechaDesde}
                onChange={e => setHeaderForm({ ...headerForm, fechaDesde: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs"
              />
            </div>
            <div>
              <label className="block text-2xs text-slate-600 mb-0.5">Hasta:</label>
              <input
                type="text"
                value={headerForm.fechaHasta}
                onChange={e => setHeaderForm({ ...headerForm, fechaHasta: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs"
              />
            </div>
            <div>
              <label className="block text-2xs text-slate-600 mb-0.5">Código REEUP:</label>
              <input
                type="text"
                value={headerForm.codigoREEUP}
                onChange={e => setHeaderForm({ ...headerForm, codigoREEUP: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-2xs text-slate-600 mb-0.5">Dirección / CC:</label>
              <input
                type="text"
                value={headerForm.direccionCC}
                onChange={e => setHeaderForm({ ...headerForm, direccionCC: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-md text-xs font-semibold cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Encabezado</span>
            </button>
          </div>
        </form>
      )}

      {/* DOCUMENTO OFICIAL PRENÓMINA */}
      <div className="bg-white border-2 border-slate-900 rounded-lg p-3 sm:p-5 text-slate-900 shadow-sm overflow-x-auto print:border-none print:p-0">
        
        {/* Cabecera del Documento Oficial con separación de rótulos */}
        <div className="border-b-2 border-slate-900 pb-2 mb-3 text-2xs leading-tight">
          <div className="grid grid-cols-12 gap-3">
            
            {/* Bloque Izquierdo: Responsables */}
            <div className="col-span-7 space-y-1.5 border-r border-slate-400 pr-3">
              <div className="flex items-center gap-3">
                <span className="w-28 font-bold text-slate-800 text-3xs tracking-wider uppercase">
                  Confecciona :
                </span>
                <span className="font-black text-slate-950 uppercase bg-slate-100 px-2 py-0.5 rounded border border-slate-300 tracking-wide text-2xs">
                  {header.confecciona || '—'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-28 font-bold text-slate-800 text-3xs tracking-wider uppercase">
                  Chequea :
                </span>
                <span className="font-bold text-slate-900 uppercase bg-slate-50 px-2 py-0.5 rounded border border-slate-200 tracking-wide text-2xs">
                  {header.chequea || '—'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-28 font-bold text-slate-800 text-3xs tracking-wider uppercase">
                  Aprueba :
                </span>
                <span className="font-bold text-slate-900 uppercase bg-slate-50 px-2 py-0.5 rounded border border-slate-200 tracking-wide text-2xs">
                  {header.aprueba || '—'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-28 font-bold text-slate-800 text-3xs tracking-wider uppercase">
                  Anota :
                </span>
                <span className="font-bold text-slate-900 uppercase bg-slate-50 px-2 py-0.5 rounded border border-slate-200 tracking-wide text-2xs">
                  {header.anota || '—'}
                </span>
              </div>
            </div>

            {/* Bloque Derecho: Periodo y Fechas */}
            <div className="col-span-5 space-y-1 pl-1 font-mono text-2xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700">Periodo a que Corresponde:</span>
                <span className="font-black bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                  {header.periodoCorresponde}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-700">Número consecutivo:</span>
                <span className="font-bold">{header.numeroConsecutivo} (Hoja {validCurrentPage} de {totalPages})</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-700">Desde:</span>
                <span>{header.fechaDesde}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-700">Hasta:</span>
                <span>{header.fechaHasta}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-300 font-mono text-2xs">
            <div>
              <span className="font-bold">Código REEUP:</span> {header.codigoREEUP}
            </div>
            <div>
              <span className="font-bold">DIRECCIÓN:</span> <span className="font-bold uppercase">{header.direccionCC} ({activeCC.nombre})</span>
            </div>
            <div>
              <span className="font-bold">Fecha de conclusión:</span> {header.fechaConclusion}
            </div>
          </div>
        </div>

        {/* TABLA PRINCIPAL DEL FORMATO OFICIAL */}
        <table className="w-full text-center border-collapse border border-slate-900 text-3xs font-mono">
          <thead>
            <tr className="bg-slate-200/90 text-slate-900 border-b border-slate-900 font-bold">
              
              {/* 1. Nombre y Apellidos */}
              <th rowSpan={2} className="border border-slate-900 py-1 px-2 text-left w-48">
                Nombre y Apellidos
              </th>

              {/* 2. Categoría Ocupacional */}
              <th rowSpan={2} className="border border-slate-900 py-1 px-1 w-7 text-center" title="Categoría Ocupacional">
                Cat.
              </th>
              
              {/* 3. Distribución del tiempo (Días 1 a 15 y 16 a 31) */}
              <th colSpan={16} className="border border-slate-900 py-0.5 text-center bg-slate-100">
                Distribución del tiempo (Días del Mes)
              </th>

              {/* 4. Tiempo Real Laborado */}
              <th rowSpan={2} className="border border-slate-900 py-1 px-1 w-14 bg-amber-100 text-slate-900 font-black text-2xs" title="Tiempo Real Laborado en Horas">
                TIEMPO REAL
              </th>

              {/* 5. Nocturnidad Configurable */}
              <th colSpan={activeTarifasNoct.length + 1} className="border border-slate-900 py-0.5 text-center bg-yellow-50">
                NOCTURNIDAD
              </th>

              {/* 6. Doblajes (C-74): Horas arriba y monto debajo en 1 sola columna */}
              <th rowSpan={2} className="border border-slate-900 py-0.5 px-1 w-16 bg-orange-100 text-slate-900 font-bold" title="Trabajo Extraordinario / Doblajes C-74 (Horas arriba / Monto debajo)">
                <div className="py-0.5 border-b border-slate-400 font-black text-3xs uppercase">C-74 Extra</div>
                <div className="py-0.5 text-3xs font-mono font-bold text-orange-950">Horas / $</div>
              </th>

              {/* 7. Actividades Ajenas */}
              <th colSpan={activeClavesActivAjenas.length} className="border border-slate-900 py-0.5 text-center bg-slate-100">
                Activ. ajenas
              </th>

              {/* 8. Deducciones Dinámicas (Último escaque del área de impresión) */}
              <th colSpan={activeClavesDeduccion.length} className="border border-slate-900 py-0.5 text-center bg-rose-50 text-rose-900">
                Deducciones
              </th>

              {/* --- LÍMITE DEL ÁREA DE IMPRESIÓN OFICIAL --- */}
              {/* Columnas Informativas solo visibles en Web (no-print) */}
              <th rowSpan={2} className="border border-slate-900 py-1 px-2 w-24 bg-emerald-100 font-black text-emerald-950 no-print text-2xs">
                Salario Total
              </th>
              <th rowSpan={2} className="border border-slate-900 py-1 px-1 w-20 bg-slate-100 font-bold text-slate-900 no-print">
                Acciones
              </th>
            </tr>

            {/* Sub-encabezados de columnas de días, nocturnidad y deducciones */}
            <tr className="bg-slate-100 border-b border-slate-900 text-3xs font-semibold">
              {/* Días 1 al 15 arriba y 16 al 30 debajo */}
              {Array.from({ length: 15 }).map((_, i) => (
                <th key={i + 1} className="border border-slate-900 w-5 p-0 text-center font-bold">
                  <div className="py-0.5 border-b border-slate-400 bg-slate-200/90 text-slate-950 font-bold text-3xs">
                    {i + 1}
                  </div>
                  <div className="py-0.5 bg-slate-100 text-slate-800 font-bold text-3xs">
                    {i + 16}
                  </div>
                </th>
              ))}
              {/* Columna 16: guión arriba y día 31 debajo */}
              <th className="border border-slate-900 w-5 p-0 text-center font-bold">
                <div className="py-0.5 border-b border-slate-400 bg-slate-200/50 text-slate-400 text-3xs">
                  —
                </div>
                <div className="py-0.5 bg-slate-100 text-slate-800 font-bold text-3xs">
                  31
                </div>
              </th>

              {/* Columnas de Nocturnidad Dinámicas */}
              {activeTarifasNoct.map(t => (
                <th key={t.id} className="border border-slate-900 px-0.5 w-8 font-normal" title={`Tarifa: $${t.tarifa.toFixed(2)}`}>
                  {t.nombre}
                </th>
              ))}
              <th className="border border-slate-900 px-0.5 w-11 font-bold bg-yellow-100">Total Noct.</th>

              {/* Columnas de Actividades Ajenas Dinámicas */}
              {activeClavesActivAjenas.map(a => (
                <th key={a.id} className="border border-slate-900 px-0.5 w-8 font-normal" title={a.nombre}>
                  {a.codigo}
                </th>
              ))}

              {/* Columnas de Deducciones Dinámicas */}
              {activeClavesDeduccion.map(clave => (
                <th 
                  key={clave.codigo} 
                  className={`border border-slate-900 px-0.5 w-7 text-2xs ${clave.codigo === 'C-25' ? 'bg-rose-100 font-bold text-rose-950' : ''}`}
                  title={`${clave.nombre} (${clave.codigo})`}
                >
                  {clave.codigo}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {currentEmployees.length === 0 ? (
              <tr>
                <td colSpan={25 + activeTarifasNoct.length + activeClavesDeduccion.length + activeClavesActivAjenas.length} className="py-8 text-center text-slate-500 font-sans">
                  No hay trabajadores registrados en este Centro de Costo ({activeCC.codigoCC}). Haz clic en "+ Trabajador" para registrar personal.
                </td>
              </tr>
            ) : (
              currentEmployees.map((emp, index) => {
                const row1Days = emp.dias.slice(0, 15);
                const row2Days = emp.dias.slice(15, 31);
                const globalIndex = startIndex + index + 1;

                return (
                  <React.Fragment key={emp.id}>
                    {/* FILA 1 DEL TRABAJADOR (Días 1 al 15 y C-74 Horas arriba) */}
                    <tr className="border-t border-slate-900 hover:bg-slate-50 transition-colors">
                      {/* Nombre y Apellidos (abarca 2 filas visualmente) */}
                      <td rowSpan={2} className="border border-slate-900 text-left px-2 py-1 font-sans font-bold text-slate-950 align-top">
                        <div className="flex items-center gap-1.5">
                          <span className="text-3xs font-mono text-slate-400 font-normal">
                            #{globalIndex}
                          </span>
                          <span
                            onClick={() => onEditEmployee(emp)}
                            className="leading-snug text-xs hover:text-blue-700 cursor-pointer transition-colors"
                            title="Haz clic para abrir el menú completo de este trabajador"
                          >
                            {emp.nombreApellidos}
                          </span>
                        </div>
                        <div className="text-3xs text-slate-600 font-sans font-normal mt-0.5">
                          {settings?.escalaCargos && settings.escalaCargos.length > 0 ? (
                            <select
                              value={emp.cargo || ''}
                              onChange={e => {
                                const newCargoName = e.target.value;
                                const cargoItem = settings.escalaCargos?.find(c => c.nombre === newCargoName);
                                if (cargoItem) {
                                  const divisor = settings.divisorHorasMes || 190.6;
                                  onUpdateEmployeeField(emp.id, {
                                    cargo: newCargoName,
                                    catOcupacional: cargoItem.catOcupacionalDefault,
                                    salarioBasicoEscala: cargoItem.salarioEscala,
                                    tarifaHoraria: Math.round((cargoItem.salarioEscala / divisor) * 100) / 100
                                  });
                                } else {
                                  onUpdateEmployeeField(emp.id, { cargo: newCargoName });
                                }
                              }}
                              title="Cargo del trabajador (determina el salario de la escala)"
                              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-1 py-0.5 text-3xs text-slate-700 font-medium cursor-pointer focus:outline-none max-w-[155px] truncate"
                            >
                              <option value="">(Asignar Cargo)</option>
                              {settings.escalaCargos.map(c => (
                                <option key={c.id} value={c.nombre}>
                                  {c.nombre}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-slate-500">{emp.cargo || ''}</span>
                          )}
                        </div>
                      </td>

                      {/* Categoría Ocupacional (T, C, O, A, S) */}
                      <td rowSpan={2} className="border border-slate-900 py-1 text-center font-bold text-slate-900 align-middle">
                        <select
                          value={emp.catOcupacional}
                          onChange={e => onUpdateEmployeeField(emp.id, { catOcupacional: e.target.value as any })}
                          className="bg-transparent text-center font-bold cursor-pointer focus:outline-none text-2xs"
                        >
                          <option value="T">T</option>
                          <option value="C">C</option>
                          <option value="O">O</option>
                          <option value="A">A</option>
                          <option value="S">S</option>
                        </select>
                      </td>

                      {/* Días 1 al 15 (Fila superior) */}
                      {row1Days.map((val, idx) => {
                        const trimmed = (val || '').trim().toUpperCase();
                        const isRest = trimmed === 'D';
                        const isVac = trimmed === 'V';
                        return (
                          <td key={idx} className={`border border-slate-900 p-0 text-center w-5 h-5 ${isRest ? 'bg-slate-100' : ''}`}>
                            <input
                              type="text"
                              maxLength={4}
                              value={val || ''}
                              onChange={e => onUpdateDay(emp.id, idx, e.target.value)}
                              className={`w-full h-full text-center font-mono font-bold text-3xs border-none focus:outline-none tabular-nums ${
                                isVac
                                  ? 'bg-rose-100 text-rose-800 font-black'
                                  : isRest
                                  ? 'bg-slate-200/80 text-slate-600 font-black'
                                  : val
                                  ? 'text-slate-950 font-bold'
                                  : 'bg-transparent text-slate-400'
                              }`}
                            />
                          </td>
                        );
                      })}

                      {/* Espacio superior de la columna 16 */}
                      <td className="border border-slate-900 text-center bg-slate-100 text-slate-300 text-3xs p-0 w-5 h-5">
                        —
                      </td>

                      {/* TIEMPO REAL LABORADO */}
                      <td rowSpan={2} className="border border-slate-900 py-1 text-center font-black font-mono text-xs bg-amber-100 text-slate-950 align-middle tabular-nums">
                        {emp.tiempoRealLaborado}
                      </td>

                      {/* Nocturnidad Dinámica (Valores) */}
                      {activeTarifasNoct.map(t => (
                        <td key={t.id} rowSpan={2} className="border border-slate-900 py-1 text-center font-mono align-middle">
                          <input
                            type="number"
                            value={getNocturnidadCantidad(emp, t.codigo) || ''}
                            placeholder="0"
                            onChange={e => handleUpdateNocturnidad(emp, t.codigo, e.target.value)}
                            className="w-7 text-center bg-transparent border-none focus:outline-none tabular-nums text-3xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </td>
                      ))}

                      {/* Total Nocturnidad ($) */}
                      <td rowSpan={2} className="border border-slate-900 py-1 text-center font-bold font-mono bg-yellow-50 text-slate-900 align-middle">
                        <input
                          type="number"
                          step="0.01"
                          value={emp.nocturnidad.totalNocturnidad || ''}
                          placeholder="0.00"
                          onChange={e => onUpdateEmployeeField(emp.id, {
                            nocturnidad: { ...emp.nocturnidad, totalNocturnidad: parseFloat(e.target.value) || 0 }
                          })}
                          className="w-11 text-center font-bold bg-transparent border-none focus:outline-none tabular-nums text-3xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>

                      {/* C-74 (DOBLAJES): HORAS ARRIBA (Fila 1) */}
                      <td className="border border-slate-900 p-0 text-center bg-orange-50/50 w-16 h-5">
                        <div className="flex items-center justify-center h-full px-0.5">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={emp.trabajoExtra.horas || ''}
                            placeholder="0h"
                            title="Ingresa las horas de doblaje / trabajo extraordinario C-74 (se suma al importe)"
                            onChange={e => handleUpdateHorasC74(emp, e.target.value)}
                            className="w-full h-full text-center font-bold font-mono text-orange-950 bg-transparent border-none focus:outline-none tabular-nums text-3xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </td>

                      {/* Actividades Ajenas Dinámicas */}
                      {activeClavesActivAjenas.map(a => (
                        <td key={a.id} rowSpan={2} className="border border-slate-900 py-1 text-center font-mono align-middle">
                          <input
                            type="number"
                            step="0.01"
                            value={emp.activAjenasValores?.[a.codigo] ?? (emp.activAjenas || '')}
                            placeholder="0"
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              const newAct = { ...(emp.activAjenasValores || {}), [a.codigo]: val };
                              onUpdateEmployeeField(emp.id, { 
                                activAjenasValores: newAct,
                                activAjenas: val 
                              });
                            }}
                            className="w-7 text-center bg-transparent border-none focus:outline-none tabular-nums text-3xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </td>
                      ))}

                      {/* Deducciones Dinámicas (Horas por Clave) */}
                      {activeClavesDeduccion.map(clave => {
                        const val = getDeduccionValue(emp, clave.codigo);
                        const isVac = clave.codigo === 'C-25';
                        return (
                          <td 
                            key={clave.codigo} 
                            rowSpan={2} 
                            className={`border border-slate-900 py-1 text-center font-mono align-middle ${isVac ? 'bg-rose-100 font-bold text-rose-950' : ''}`}
                          >
                            <input
                              type="number"
                              min="0"
                              value={val || ''}
                              placeholder="0"
                              title={`${clave.nombre} (${clave.codigo})`}
                              onChange={e => handleUpdateDeduccion(emp, clave.codigo, e.target.value)}
                              className={`w-6 text-center bg-transparent border-none focus:outline-none tabular-nums text-3xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isVac ? 'font-black text-rose-950' : ''}`}
                            />
                          </td>
                        );
                      })}

                      {/* --- LÍMITE DEL ÁREA DE IMPRESIÓN OFICIAL --- */}
                      {/* Salario Total (SOLO WEB, no-print) */}
                      <td rowSpan={2} className="border border-slate-900 py-1 px-2 text-right font-black font-mono text-emerald-950 bg-emerald-50 align-middle no-print print:hidden text-2xs tabular-nums">
                        ${emp.salarioTotalEstimado.toFixed(2)}
                      </td>

                      {/* Acciones (SOLO WEB, no-print) */}
                      <td rowSpan={2} className="border border-slate-900 py-1 px-1 text-center align-middle no-print print:hidden bg-slate-50/50">
                        <div className="flex flex-col gap-1 items-center justify-center">
                          <button
                            type="button"
                            onClick={() => onEditEmployee(emp)}
                            title="Abrir menú para ver y editar datos completos del trabajador"
                            className="inline-flex items-center justify-center gap-1 w-full px-1.5 py-0.5 text-3xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded shadow-2xs transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-2.5 h-2.5 text-slate-600" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteEmployee(emp.id)}
                            title={`Eliminar a ${emp.nombreApellidos} de la prenómina`}
                            className="inline-flex items-center justify-center gap-1 w-full px-1.5 py-0.5 text-3xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded shadow-2xs transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-2.5 h-2.5 text-rose-600" />
                            <span>Quitar</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* FILA 2 DEL TRABAJADOR (Días 16 al 31 y C-74 Monto a pagar abajo) */}
                    <tr className="border-b-2 border-slate-900 hover:bg-slate-50 transition-colors bg-slate-50/30">
                      {/* Días 16 al 30 (15 celdas) */}
                      {row2Days.slice(0, 15).map((val, idx) => {
                        const actualDayIndex = 15 + idx;
                        const trimmed = (val || '').trim().toUpperCase();
                        const isRest = trimmed === 'D';
                        const isVac = trimmed === 'V';
                        return (
                          <td key={actualDayIndex} className={`border border-slate-900 p-0 text-center w-5 h-5 ${isRest ? 'bg-slate-100' : ''}`}>
                            <input
                              type="text"
                              maxLength={4}
                              value={val || ''}
                              onChange={e => onUpdateDay(emp.id, actualDayIndex, e.target.value)}
                              className={`w-full h-full text-center font-mono font-bold text-3xs border-none focus:outline-none tabular-nums ${
                                isVac
                                  ? 'bg-rose-100 text-rose-800 font-black'
                                  : isRest
                                  ? 'bg-slate-200/80 text-slate-600 font-black'
                                  : val
                                  ? 'text-slate-950 font-bold'
                                  : 'bg-transparent text-slate-400'
                              }`}
                            />
                          </td>
                        );
                      })}

                      {/* Día 31 */}
                      {(() => {
                        const val = row2Days[15] || '';
                        const trimmed = val.trim().toUpperCase();
                        const isRest = trimmed === 'D';
                        const isVac = trimmed === 'V';
                        return (
                          <td className={`border border-slate-900 p-0 text-center w-5 h-5 ${isRest ? 'bg-slate-100' : 'bg-slate-100/50'}`}>
                            <input
                              type="text"
                              maxLength={4}
                              value={val}
                              onChange={e => onUpdateDay(emp.id, 30, e.target.value)}
                              className={`w-full h-full text-center font-mono font-bold text-3xs border-none focus:outline-none tabular-nums ${
                                isVac
                                  ? 'bg-rose-100 text-rose-800 font-black'
                                  : isRest
                                  ? 'bg-slate-200/80 text-slate-600 font-black'
                                  : 'text-slate-950'
                              }`}
                            />
                          </td>
                        );
                      })()}

                      {/* C-74 (DOBLAJES): MONTO A PAGAR ($) DEBAJO (Fila 2) */}
                      <td className="border border-slate-900 p-0 text-center bg-orange-100/70 w-16 h-5">
                        <div className="flex items-center justify-center h-full px-0.5">
                          <span className="text-3xs text-orange-800 font-mono font-bold mr-0.5">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={emp.trabajoExtra.importe || ''}
                            placeholder="0.00"
                            title="Monto a pagar por horas extras C-74 (calculado o editable manualmente)"
                            onChange={e => onUpdateEmployeeField(emp.id, {
                              trabajoExtra: { ...emp.trabajoExtra, importe: parseFloat(e.target.value) || 0 }
                            })}
                            className="w-full h-full text-center font-black font-mono text-orange-950 bg-transparent border-none focus:outline-none tabular-nums text-3xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })
            )}
          </tbody>

          {/* FILA DE TOTALES GENERALES (Termina en Deducciones para Impresión) */}
          <tfoot>
            <tr className="bg-slate-200 border-t-2 border-slate-900 font-bold text-slate-950">
              <td colSpan={2} className="border border-slate-900 py-1.5 px-2 text-left text-2xs uppercase font-black">
                TOTAL ({totals.totalEmpleados} Trab.)
              </td>

              {/* Total Días (Espacio) */}
              <td colSpan={16} className="border border-slate-900 text-center text-3xs text-slate-600 font-bold">
                Cómputo Horas Mes ({activeCC.codigoCC})
              </td>

              {/* Total Tiempo Real Laborado */}
              <td className="border border-slate-900 py-1 text-center font-black bg-amber-200 text-xs tabular-nums">
                {totals.totalTiempoRealLaborado}
              </td>

              {/* Totales Nocturnidad Dinámica */}
              {activeTarifasNoct.map(t => {
                const totalCant = currentEmployees.reduce((sum, e) => sum + getNocturnidadCantidad(e, t.codigo), 0);
                return (
                  <td key={t.id} className="border border-slate-900 text-center font-mono tabular-nums">
                    {totalCant}
                  </td>
                );
              })}
              <td className="border border-slate-900 text-center font-mono font-bold bg-yellow-300 tabular-nums">
                ${totals.totalImporteNocturnidad.toFixed(2)}
              </td>

              {/* Totales C-74 (Doblaje): Horas arriba y monto debajo en la misma celda */}
              <td className="border border-slate-900 text-center font-mono font-bold bg-orange-200 tabular-nums p-0">
                <div className="border-b border-slate-400 py-0.5 text-3xs font-black text-orange-950">
                  {totals.totalHorasExtra} h
                </div>
                <div className="py-0.5 text-2xs font-black text-orange-950 bg-orange-300/60">
                  ${totals.totalImporteTrabajoExtra.toFixed(2)}
                </div>
              </td>

              {/* Activ Ajenas Dinámicas */}
              {activeClavesActivAjenas.map(a => {
                const totalAct = currentEmployees.reduce((sum, e) => sum + (e.activAjenasValores?.[a.codigo] ?? e.activAjenas ?? 0), 0);
                return (
                  <td key={a.id} className="border border-slate-900 text-center font-mono tabular-nums">
                    ${totalAct.toFixed(2)}
                  </td>
                );
              })}

              {/* Totales Deducciones Dinámicas */}
              {activeClavesDeduccion.map(clave => {
                const sumDed = currentEmployees.reduce((sum, e) => sum + getDeduccionValue(e, clave.codigo), 0);
                return (
                  <td 
                    key={clave.codigo} 
                    className={`border border-slate-900 text-center font-mono tabular-nums font-bold ${clave.codigo === 'C-25' ? 'bg-rose-200 text-rose-950 font-black' : ''}`}
                  >
                    {sumDed}
                  </td>
                );
              })}

              {/* --- LÍMITE DEL ÁREA DE IMPRESIÓN OFICIAL --- */}
              {/* Gran Total Importe (SOLO WEB, no-print) */}
              <td className="border border-slate-900 py-1 px-2 text-right font-black text-xs bg-emerald-200 text-emerald-950 no-print print:hidden tabular-nums">
                ${totals.granTotalImporte.toFixed(2)}
              </td>
              <td className="border border-slate-900 no-print print:hidden"></td>
            </tr>
          </tfoot>
        </table>

        {/* Leyenda y Claves de Deducción Oficiales al pie */}
        <div className="mt-4 pt-3 border-t border-slate-300 flex flex-wrap items-center justify-between gap-3 text-3xs text-slate-700 print-break-inside-avoid">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="font-black text-slate-900">Leyenda Oficial:</span>
            <span className="bg-slate-100 px-1 rounded font-bold"><strong>D:</strong> Descanso Semanal</span>
            <span className="bg-orange-50 px-1 rounded font-bold text-orange-950"><strong>C-74:</strong> Doblaje / Horas Extraordinarias</span>
            {activeClavesDeduccion.map(clave => (
              <span key={clave.codigo} className={clave.codigo === 'C-25' ? 'bg-rose-50 px-1 rounded font-bold text-rose-900' : ''}>
                <strong>{clave.codigo}:</strong> {clave.nombre}
              </span>
            ))}
            <span><strong>T:</strong> Técnico</span>
            <span><strong>C:</strong> Cuadro</span>
            <span><strong>O:</strong> Operario</span>
          </div>

          <div className="text-right font-mono text-2xs text-slate-600 font-bold">
            <span>{header.direccionCC} · Hoja {validCurrentPage} de {totalPages} · Conclusión: {header.fechaConclusion}</span>
          </div>
        </div>

      </div>

    </div>
  );
};

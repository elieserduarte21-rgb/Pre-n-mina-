import React, { useState } from 'react';
import { 
  EmployeeWithPrenominaCalc, 
  EmployeePrenomina,
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
import { 
  getDeduccionValue, 
  getDeduccionHoursFromDays, 
  getNocturnidadCantidad, 
  calculateC74HoursFromDays, 
  getC82Hours, 
  calculateC82HoursFromDays, 
  getC70Hours, 
  getC54Hours,
  calculateC54HoursFromDays,
  parseMonthFromHeader,
  getCubanHolidaysForMonth,
  getWorkerAverageHourlyRate,
  isClaveTiempoRealAjena,
  normalizeClaveTiempoReal,
  getActividadAjenaHours,
  calculateActividadAjenaHoursFromDays,
  CLAVES_TIEMPO_REAL_AJENAS,
  dayCellMatchesClave,
  getWorkerScheduledShiftForDay,
  extractHoursFromDayCell
} from '../utils/prenominaCalculator';
import { exportOfficialEmployeesToExcel, parseOfficialEmployeesFromExcel } from '../utils/excelHelper';
import { ExcelActions } from './ExcelActions';
import { Edit3, Plus, Trash2, Printer, Save, Building2, ChevronLeft, ChevronRight, FileSpreadsheet, Settings, Eye } from 'lucide-react';
import { useTableResize } from '../hooks/useTableResize';

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
  onImportEmployees?: (employees: EmployeePrenomina[]) => void;
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
  onImportEmployees
}) => {
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [headerForm, setHeaderForm] = useState<HeaderPrenomina>(header);

  // Paginación oficial: 8 trabajadores por hoja (para coincidir con 1 hoja de impresión)
  const WORKERS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(employees.length / WORKERS_PER_PAGE));
  const validCurrentPage = Math.min(currentPage, totalPages);
  
  const startIndex = (validCurrentPage - 1) * WORKERS_PER_PAGE;
  const currentEmployees = employees.slice(startIndex, startIndex + WORKERS_PER_PAGE);

  // Claves y tarifas activas configurables: C-82, C-85, C-57, C-72 EXCLUIDAS de deducciones
  const activeClavesDeduccion: ClaveDeduccion[] = (settings.clavesDeduccion || DEFAULT_CLAVES_DEDUCCION).filter(
    c => c.activa !== false && !isClaveTiempoRealAjena(c.codigo)
  );

  const activeTarifasNoct: TarifaNocturnidad[] = (settings.tarifasNocturnidad || DEFAULT_TARIFAS_NOCTURNIDAD).filter(
    t => t.activa !== false
  );

  // C-82, C-85, C-57, C-72 se ubican en Actividades Ajenas y sus horas se suman al tiempo real trabajado
  const rawActivAjenas = settings.clavesActividadesAjenas || DEFAULT_CLAVES_ACTIVIDADES_AJENAS;
  const ensureAjenas = [...rawActivAjenas];
  const requiredAjenas = [
    { id: 'act-c82', codigo: 'C-82', nombre: 'C-82 Vacac. Simultáneas', descripcion: 'Horas C-82 que suman al tiempo real laborado', activa: true },
    { id: 'act-c85', codigo: 'C-85', nombre: 'C-85 Movilizados / Defensa', descripcion: 'Horas C-85 que suman al tiempo real laborado', activa: true },
    { id: 'act-c57', codigo: 'C-57', nombre: 'C-57 Interrupción autorizada', descripcion: 'Horas C-57 que suman al tiempo real laborado', activa: true },
    { id: 'act-c72', codigo: 'C-72', nombre: 'C-72 Capacitación / Comisión', descripcion: 'Horas C-72 que suman al tiempo real laborado', activa: true },
    { id: 'act-c69', codigo: 'C-69', nombre: 'C-69 Categoría Ocupacional', descripcion: 'Horas C-69 Categoría Ocupacional que suman al tiempo real laborado (se edita en datos complejos)', activa: true },
    { id: 'act-c54', codigo: 'C-54', nombre: 'C-54 Movilización Militar', descripcion: 'Horas C-54 pagadas por tarifa de horas promedio', activa: true },
    { id: 'act-c70', codigo: 'C-70', nombre: 'C-70 Feriados no trabajados', descripcion: 'Feriados y conmemoración nacional pagados por salario promedio', activa: true },
  ];
  requiredAjenas.forEach(req => {
    if (!ensureAjenas.some(a => a.codigo.replace('-', '').toUpperCase() === req.codigo.replace('-', '').toUpperCase())) {
      ensureAjenas.push(req);
    }
  });

  const activeClavesActivAjenas: ClaveActividadAjena[] = ensureAjenas.filter(
    a => a.activa !== false
  );

  const parseDateAndAutoUpdateHeader = (conclusionStr: string, header: HeaderPrenomina): HeaderPrenomina => {
    const parts = conclusionStr.split(/[\/\-\.\s]/);
    let date = new Date(NaN);

    if (parts.length >= 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed for JS Date
      let year = parseInt(parts[2], 10);
      if (parts[2].length === 2) {
        year = 2000 + year;
      }
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        date = new Date(year, month, day);
      }
    }

    if (isNaN(date.getTime())) {
      date = new Date(conclusionStr);
    }

    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const monthIndex = date.getMonth();
      const monthNum = monthIndex + 1;
      const monthNames = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ];
      const monthName = monthNames[monthIndex];

      const firstDayStr = `1 ${monthName} ${year}`;
      const lastDayObj = new Date(year, monthNum, 0);
      const lastDayNum = lastDayObj.getDate();
      const lastDayStr = `${lastDayNum} ${monthName} ${year}`;

      return {
        ...header,
        fechaConclusion: conclusionStr,
        periodoCorresponde: String(monthNum),
        fechaDesde: firstDayStr,
        fechaHasta: lastDayStr
      };
    }

    return {
      ...header,
      fechaConclusion: conclusionStr
    };
  };

  const handleSaveHeader = (e: React.FormEvent) => {
    e.preventDefault();
    const finalHeader = {
      ...headerForm,
      numeroConsecutivo: `${validCurrentPage} de ${totalPages}`
    };
    onUpdateHeader(finalHeader);
    setIsEditingHeader(false);
  };

  const activeCC = (settings.centrosCosto || []).find(c => c.id === selectedCCId) || {
    id: selectedCCId,
    codigoCC: header.direccionCC || 'CC 101',
    nombre: 'DIRECCIÓN'
  };

  // Actualizador para deducción dinámica
  const handleUpdateDeduccion = (emp: EmployeeWithPrenominaCalc, codigo: string, valStr: string) => {
    const totalInputVal = parseFloat(valStr) || 0;
    const autoFromDays = getDeduccionHoursFromDays(emp, codigo);
    const manualVal = Math.max(0, Math.round((totalInputVal - autoFromDays) * 100) / 100);

    const newDedValores = { ...(emp.deduccionesValores || {}), [codigo]: manualVal };

    // Sincronizar también con campos legados para máxima retrocompatibilidad
    const legacyUpdates: any = {};
    if (codigo === 'C-25') legacyUpdates.vacacPlanifC25 = manualVal;
    if (codigo === 'C-20') legacyUpdates.cMedC20 = manualVal;
    if (codigo === 'C-10' || codigo === 'C-11') legacyUpdates.ausInjustJustC10_C11 = manualVal;
    if (codigo === 'C-82') legacyUpdates.vacacSimultanC82 = manualVal;
    if (codigo === 'C-27') legacyUpdates.bajaC27 = manualVal;
    if (codigo === 'C-30') legacyUpdates.nuevoIngC30 = manualVal;
    if (codigo === 'C-31') legacyUpdates.trasladoC31 = manualVal;

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

  const columns = React.useMemo(() => [
    { id: 'nombre', label: 'Nombre y Apellidos', width: 200 },
    { id: 'cat', label: 'Cat.', width: 35 },
    ...Array.from({ length: 31 }).map((_, i) => ({ id: `dia-${i + 1}`, label: `${i + 1}`, width: 25 })),
    { id: 'tiempo-real', label: 'TIEMPO REAL', width: 60 },
    ...activeTarifasNoct.map(t => ({ id: `noct-${t.codigo}`, label: t.nombre, width: 40 })),
    { id: 'total-noct', label: 'Total Noct.', width: 50 },
    { id: 'c74-extras', label: 'C-74 & Extras', width: 80 },
    ...activeClavesActivAjenas.map(a => ({ id: `ajena-${a.codigo}`, label: a.codigo, width: 40 })),
    ...activeClavesDeduccion.map(d => ({ id: `ded-${d.codigo}`, label: d.codigo, width: 30 })),
    { id: 'salario-total', label: 'Salario Total', width: 90 },
    { id: 'acciones', label: 'Acciones', width: 80 },
  ], [activeTarifasNoct, activeClavesActivAjenas, activeClavesDeduccion]);

  const { widths, startResizing } = useTableResize('prenomina-table', Object.fromEntries(columns.map(c => [c.id, c.width])));

  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printConfig, setPrintConfig] = useState({
    orientation: 'landscape' as 'landscape' | 'portrait',
    fontSize: 'normal' as 'compact' | 'normal',
    showSignatures: true
  });

  // Actualizador para horas extras / doblajes C-74
  const handleUpdateHorasC74 = (emp: EmployeeWithPrenominaCalc, horasStr: string) => {
    const horasExtras = parseFloat(horasStr) || 0;
    const divisor = settings.divisorHorasMes || 190.6;
    const factor = settings.factorExtraFestiva || 2.0;
    const tarifa = emp.tarifaHoraria || ((emp.salarioBasicoEscala || 4800) / divisor);
    
    const horasC74 = calculateC74HoursFromDays(emp);
    const importeC74 = horasC74 * tarifa * factor;
    const importeExtras = horasExtras * tarifa * factor;
    const importeTotal = Math.round((importeC74 + importeExtras) * 100) / 100;

    onUpdateEmployeeField(emp.id, {
      trabajoExtra: { horas: horasExtras, importe: importeTotal }
    });
  };

  // Días feriados oficiales y de conmemoración nacional (Código de Trabajo Cuba - Ley 116)
  const currentMonthNum = parseMonthFromHeader(header, settings);
  const cubanHolidaysMap = getCubanHolidaysForMonth(currentMonthNum);
  const hasHolidaysInMonth = Object.keys(cubanHolidaysMap).length > 0;

  const checkDayValidity = (val: string): boolean => {
    if (!val || !val.trim()) return false;
    const trimmed = val.trim();
    const upper = trimmed.toUpperCase();
    if (upper === 'D' || upper === 'V') return false;
    if (upper.startsWith('C-') || upper.startsWith('C')) {
      const parts = trimmed.split(/[:\s]+/);
      if (parts.length > 1) {
        const num = parseFloat(parts[1]);
        if (!isNaN(num) && (num < 0 || num > 24)) return true;
      }
      return false;
    }
    const num = parseFloat(trimmed);
    if (!isNaN(num)) {
      if (num < 0 || num > 24) return true;
    }
    return false;
  };

  const getDayInputClass = (val: string, dayNum?: number) => {
    const trimmed = (val || '').trim().toUpperCase();
    const isInvalid = checkDayValidity(val);
    const isRest = trimmed === 'D';
    const isVac = trimmed === 'V';
    const isAjena = isClaveTiempoRealAjena(trimmed) 
      || dayCellMatchesClave(trimmed, 'C-54') 
      || dayCellMatchesClave(trimmed, 'C-70') 
      || CLAVES_TIEMPO_REAL_AJENAS.some(k => dayCellMatchesClave(trimmed, k));
    const isHoliday = dayNum !== undefined && Boolean(cubanHolidaysMap[dayNum]);
    const isLong = trimmed.length >= 3;
    
    let bg = 'bg-transparent text-slate-400';
    if (isInvalid) bg = 'bg-rose-950 text-rose-100 font-black';
    else if (isVac) bg = 'bg-rose-950 text-rose-100 font-black';
    else if (isRest) bg = 'bg-slate-700/80 text-slate-300 font-black';
    else if (isAjena) bg = 'bg-amber-950 text-amber-100 font-black';
    else if (isHoliday) bg = 'bg-rose-900 text-rose-100 font-black border-rose-700';
    else if (val) bg = 'text-slate-100 font-bold';

    const textSize = isLong ? 'text-[8px] print:text-[6px] tracking-tighter' : 'text-[10px] print:text-[7.5px]';
    const borderStyle = isInvalid ? 'border-2 border-rose-600 ring-2 ring-rose-500' : 'border-none';

    return `w-full h-full text-center font-['Arial'] font-bold ${textSize} focus:outline-none tabular-nums print:p-0 print:m-0 print:leading-none ${bg} ${borderStyle}`;
  };

  return (
    <div className="space-y-4 font-['Arial'] text-[10px]">
      
      {/* Controles de Vista, Selector de CC y Acciones Rápidas (Excluidos de Impresión) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-white p-4 border border-slate-300 rounded-xl no-print shadow-xs text-slate-900">
        
        {/* Selector de Centro de Costo (CC) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300">
            <Building2 className="w-4 h-4 text-slate-700" />
            <span className="text-2xs font-bold uppercase text-slate-700">Centro de Costo:</span>
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

          {hasHolidaysInMonth && (
            <span 
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-950 border border-rose-300 text-3xs font-bold shadow-2xs" 
              title={`Días Feriados y Conmemoración Nacional en este mes: ${Object.values(cubanHolidaysMap).join(' | ')}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
              Feriados Ley 116: {Object.keys(cubanHolidaysMap).join(', ')} ({Object.values(cubanHolidaysMap).map(h => h.split('—')[0]).join(', ')})
            </span>
          )}
        </div>

        {/* Acciones principales */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Botón Cierre Final Consolidado */}
          <button
            onClick={onOpenCierreFinal}
            title="Consolidar todos los Centros de Costo en el Cierre Final"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 rounded-lg transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Cierre Final de Empresa</span>
          </button>

          {/* Botón para Configurar Escaque y Claves de Deducciones / Nocturnidad */}
          <button
            onClick={onOpenSettings}
            title="Modificar escaques, claves de deducción, tarifas de nocturnidad y actividades ajenas"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>Configurar Escaques & Claves</span>
          </button>

          <button
            onClick={() => setIsEditingHeader(!isEditingHeader)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditingHeader ? 'Cerrar Datos' : 'Firmas & Datos'}</span>
          </button>

          <ExcelActions
            label="Trabajadores"
            exportTitle="Exportar la lista completa de trabajadores y días del Centro de Costo a Excel (.xlsx)"
            importTitle="Importar trabajadores, cargos y días desde archivo Excel (.xlsx / .csv)"
            onExport={() => exportOfficialEmployeesToExcel(employees, activeCC.codigoCC)}
            onImport={(rows) => {
              if (onImportEmployees) {
                const parsed = parseOfficialEmployeesFromExcel(rows, activeCC.id);
                if (parsed.length > 0) {
                  onImportEmployees(parsed);
                  alert(`Se importaron ${parsed.length} trabajadores exitosamente desde Excel.`);
                } else {
                  alert('No se encontraron trabajadores válidos en el archivo Excel.');
                }
              }
            }}
          />

          <button
            onClick={() => setShowPrintPreview(true)}
            title="Abrir vista previa de impresión interactiva y configurable"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-600" />
            <span>Vista Previa</span>
          </button>

          <button
            onClick={() => window.print()}
            title="Imprimir hoja oficial (solo área obligatoria: de Nombre a Deducciones)"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer shadow-sm"
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

      {/* Barra de Paginación (8 trabajadores por hoja) */}
      <div className="flex items-center justify-between bg-white px-4 py-2 border border-slate-300 rounded-xl no-print text-xs text-slate-900">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800">
            Hoja {validCurrentPage} de {totalPages}
          </span>
          <span className="text-slate-500 text-2xs">
            (Mostrando {employees.length === 0 ? 0 : startIndex + 1} a {Math.min(startIndex + WORKERS_PER_PAGE, employees.length)} de {employees.length} trabajadores · Máximo 8 por hoja para impresión perfecta)
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
          <div className="font-bold text-slate-800 uppercase tracking-wider text-2xs flex items-center justify-between">
            <span>Editar Firmas y Parámetros del Formato Oficial</span>
            <span className="text-emerald-700 font-normal">Al cambiar la Fecha de Conclusión, el Periodo, Desde y Hasta se calculan automáticamente.</span>
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

          <div className="grid grid-cols-2 sm:grid-cols-7 gap-3">
            <div>
              <label className="block text-2xs text-slate-600 mb-0.5">Fecha Conclusión:</label>
              <input
                type="text"
                value={headerForm.fechaConclusion}
                onChange={e => {
                  const val = e.target.value;
                  const updated = parseDateAndAutoUpdateHeader(val, headerForm);
                  setHeaderForm(updated);
                }}
                placeholder="Ej. 01/08/2026"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-mono font-bold text-emerald-950"
              />
            </div>
            <div>
              <label className="block text-2xs text-slate-600 mb-0.5">Periodo (Mes):</label>
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
                value={`${validCurrentPage} de ${totalPages}`}
                readOnly
                className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-md text-xs font-mono text-slate-600 cursor-not-allowed font-bold"
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
            <div className="col-span-5 space-y-1 pl-1 font-mono text-2xs text-right">
              <div className="flex justify-end items-center gap-2">
                <span className="font-bold text-slate-700">Periodo a que Corresponde:</span>
                <span className="font-black bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                  {header.periodoCorresponde}
                </span>
              </div>
              <div className="flex justify-end items-center gap-2">
                <span className="font-bold text-slate-700">Número consecutivo:</span>
                <span className="font-bold">{validCurrentPage} de {totalPages}</span>
              </div>
              <div className="flex justify-end items-center gap-2">
                <span className="font-bold text-slate-700">Desde:</span>
                <span>{header.fechaDesde}</span>
              </div>
              <div className="flex justify-end items-center gap-2">
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
        <div className="bg-white text-slate-900 border border-slate-300 rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-center border-collapse border border-slate-300 font-['Arial'] text-[10px] table-fixed">
            <colgroup>
              {columns.map(col => (
                <col key={col.id} style={{ width: widths[col.id] }} />
              ))}
            </colgroup>
            <thead>
              <tr className="bg-slate-100 text-slate-900 border-b border-slate-300 font-bold">
              
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

              {/* 6. Doblajes C-74 (desde días) y Horas Extras (manuales) */}
              <th rowSpan={2} className="border border-slate-900 py-0.5 px-1 w-20 bg-orange-100 text-slate-900 font-bold" title="Doblajes C-74 (automáticos desde días) y Horas Extras (manuales) con su Importe Total">
                <div className="py-0.5 border-b border-slate-400 font-black text-3xs uppercase">C-74 & Extras</div>
                <div className="py-0.5 text-3xs font-mono font-bold text-orange-950">C74h+Ext / $</div>
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
              {Array.from({ length: 15 }).map((_, i) => {
                const dayTop = i + 1;
                const dayBottom = i + 16;
                const isHolidayTop = Boolean(cubanHolidaysMap[dayTop]);
                const isHolidayBottom = Boolean(cubanHolidaysMap[dayBottom]);

                return (
                  <th key={i + 1} className="border border-slate-900 w-5 p-0 text-center font-bold">
                    <div 
                      className={`py-0.5 border-b border-slate-400 text-3xs font-bold ${
                        isHolidayTop 
                          ? 'bg-rose-300 text-rose-950 font-black' 
                          : 'bg-slate-200/90 text-slate-950'
                      }`}
                      title={isHolidayTop ? `🚩 ${cubanHolidaysMap[dayTop]} (Día Feriado Oficial)` : `Día ${dayTop}`}
                    >
                      {dayTop}
                    </div>
                    <div 
                      className={`py-0.5 text-3xs font-bold ${
                        isHolidayBottom 
                          ? 'bg-rose-300 text-rose-950 font-black' 
                          : 'bg-slate-100 text-slate-800'
                      }`}
                      title={isHolidayBottom ? `🚩 ${cubanHolidaysMap[dayBottom]} (Día Feriado Oficial)` : `Día ${dayBottom}`}
                    >
                      {dayBottom}
                    </div>
                  </th>
                );
              })}
              {/* Columna 16: guión arriba y día 31 debajo */}
              {(() => {
                const isHoliday31 = Boolean(cubanHolidaysMap[31]);
                return (
                  <th className="border border-slate-900 w-5 p-0 text-center font-bold">
                    <div className="py-0.5 border-b border-slate-400 bg-slate-200/50 text-slate-400 text-3xs">
                      —
                    </div>
                    <div 
                      className={`py-0.5 text-3xs font-bold ${
                        isHoliday31 
                          ? 'bg-rose-300 text-rose-950 font-black' 
                          : 'bg-slate-100 text-slate-800'
                      }`}
                      title={isHoliday31 ? `🚩 ${cubanHolidaysMap[31]} (Día Feriado Oficial)` : `Día 31`}
                    >
                      31
                    </div>
                  </th>
                );
              })()}

              {/* Columnas de Nocturnidad Dinámicas */}
              {activeTarifasNoct.map(t => (
                <th key={t.id} className="border border-slate-900 px-0.5 w-8 font-normal" title={`Tarifa: $${t.tarifa.toFixed(2)}`}>
                  {t.nombre}
                </th>
              ))}
              <th className="border border-slate-900 px-0.5 w-11 font-bold bg-yellow-100">Total Noct.</th>

              {/* Columnas de Actividades Ajenas Dinámicas */}
              {activeClavesActivAjenas.map(a => {
                const isTiempoReal = isClaveTiempoRealAjena(a.codigo);
                const normCode = normalizeClaveTiempoReal(a.codigo);
                const isC70 = a.codigo === 'C-70' || a.codigo === 'C70';
                const isC54 = a.codigo === 'C-54' || a.codigo === 'C54';
                return (
                  <th 
                    key={a.id} 
                    className={`border border-slate-900 px-1 py-0.5 font-normal text-center align-middle ${isTiempoReal ? 'bg-amber-100 font-bold text-amber-950' : ''} ${isC70 || isC54 ? 'bg-emerald-100 font-bold text-emerald-950' : ''}`} 
                    title={a.descripcion || a.nombre}
                  >
                    <div className="h-16 flex items-center justify-center mx-auto text-center">
                      <span 
                        className="text-[9px] font-bold tracking-tight leading-none inline-block select-none whitespace-nowrap text-center" 
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        {isTiempoReal ? `${normCode} (h)` : isC54 ? 'C-54 ($)' : isC70 ? 'C-70 ($)' : a.codigo}
                      </span>
                    </div>
                  </th>
                );
              })}

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
                        <div className="text-3xs text-slate-700 font-mono font-bold mt-0.5 flex items-center gap-1">
                          <span className="text-slate-500 font-normal">Exp:</span>
                          <input
                            type="text"
                            value={emp.numeroExpediente || ''}
                            onChange={e => onUpdateEmployeeField(emp.id, { numeroExpediente: e.target.value })}
                            placeholder="—"
                            className="w-16 bg-transparent hover:bg-slate-100 focus:bg-white border-b border-transparent hover:border-slate-300 focus:border-slate-800 px-0.5 text-3xs font-mono font-bold text-slate-900 focus:outline-none"
                            title="Número de expediente del trabajador"
                          />
                        </div>
                      </td>

                      {/* Categoría Ocupacional (T, C, O, A, S) */}
                      <td rowSpan={2} className="border border-slate-900 py-1 text-center font-bold text-slate-900 align-middle">
                        <select
                          value={emp.catOcupacional || 'T'}
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
                        const dayNum = idx + 1;
                        const isHoliday = Boolean(cubanHolidaysMap[dayNum]);
                        const holidayName = cubanHolidaysMap[dayNum];
                        const trimmed = (val || '').trim().toUpperCase();
                        const isRest = trimmed === 'D';
                        const isVac = trimmed === 'V';
                        const isAjena = isClaveTiempoRealAjena(trimmed) || CLAVES_TIEMPO_REAL_AJENAS.some(k => dayCellMatchesClave(trimmed, k));
                        const shift = getWorkerScheduledShiftForDay(emp, idx);
                        const ajenaHours = isAjena ? extractHoursFromDayCell(trimmed, shift) : null;

                        return (
                          <td 
                            key={idx} 
                            className={`border border-slate-900 p-0 text-center w-5 h-5 ${
                              isRest 
                                ? 'bg-slate-100' 
                                : (isAjena ? 'bg-amber-50' : (isHoliday ? 'bg-rose-100/90' : ''))
                            }`}
                          >
                            <input
                              type="text"
                              maxLength={6}
                              value={val || ''}
                              onChange={e => onUpdateDay(emp.id, idx, e.target.value)}
                              className={getDayInputClass(val, dayNum)}
                              title={
                                checkDayValidity(val)
                                  ? `⚠️ Valor inválido: Ingrese un valor entre 0 y 24 horas por día`
                                  : isHoliday
                                  ? `🚩 ${holidayName} (Día Feriado Oficial Ley 116)${val ? ` — ${val}h` : ''}`
                                  : isAjena
                                  ? `${val}: Corresponde a ${ajenaHours}h laborables (Actividad Ajena que suma al tiempo real)`
                                  : isRest
                                  ? `Día ${dayNum}: Descanso semanal (D)`
                                  : isVac
                                  ? `Día ${dayNum}: Vacaciones (V)`
                                  : val
                                  ? `Día ${dayNum}: ${val} horas`
                                  : `Día ${dayNum}`
                              }
                            />
                          </td>
                        );
                      })}

                      {/* Espacio superior de la columna 16 */}
                      <td className="border border-slate-900 text-center bg-slate-100 text-slate-300 text-3xs p-0 w-5 h-5">
                        —
                      </td>

                      {/* TIEMPO REAL LABORADO */}
                      <td rowSpan={2} className="border border-slate-900 py-1 px-1 text-center font-black font-mono text-xs bg-amber-100 text-slate-950 align-middle tabular-nums whitespace-nowrap">
                        {emp.tiempoRealLaborado}
                      </td>

                      {/* Nocturnidad Dinámica (Valores) */}
                      {activeTarifasNoct.map(t => (
                        <td key={t.id} rowSpan={2} className="border border-slate-900 py-1 px-1 text-center font-mono align-middle whitespace-nowrap">
                          <input
                            type="number"
                            value={getNocturnidadCantidad(emp, t.codigo) || ''}
                            placeholder="0"
                            onChange={e => handleUpdateNocturnidad(emp, t.codigo, e.target.value)}
                            className="w-full min-w-[28px] text-center bg-transparent border-none focus:outline-none tabular-nums text-3xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </td>
                      ))}

                      {/* Total Nocturnidad ($) */}
                      <td rowSpan={2} className="border border-slate-900 py-1 px-1 text-center font-bold font-mono bg-yellow-50 text-slate-900 align-middle whitespace-nowrap">
                        <input
                          type="number"
                          step="0.01"
                          value={emp.nocturnidad.totalNocturnidad || ''}
                          placeholder="0.00"
                          onChange={e => onUpdateEmployeeField(emp.id, {
                            nocturnidad: { ...emp.nocturnidad, totalNocturnidad: parseFloat(e.target.value) || 0 }
                          })}
                          className="w-full min-w-[44px] text-center font-bold bg-transparent border-none focus:outline-none tabular-nums text-3xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>

                      {/* C-74 (Doblajes desde días) + Horas Extras (manuales) (Fila 1) */}
                      <td className="border border-slate-900 p-0 text-center bg-orange-50/50 w-20 h-5">
                        <div className="flex items-center justify-between px-1 h-full text-3xs font-mono font-bold text-orange-950">
                          <span title="Doblajes C-74 automáticos desde la distribución de días" className="text-orange-900 font-bold">
                            C74:{calculateC74HoursFromDays(emp)}h
                          </span>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={emp.trabajoExtra.horas || ''}
                            placeholder="Ext"
                            title="Horas Extras manuales"
                            onChange={e => handleUpdateHorasC74(emp, e.target.value)}
                            className="w-8 text-center font-bold font-mono text-orange-950 bg-white border border-orange-300 rounded text-3xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </td>

                      {/* Actividades Ajenas Dinámicas (incluye C-82, C-85, C-57, C-72, C-69, C-54 y C-70) */}
                      {activeClavesActivAjenas.map(a => {
                        const isTiempoReal = isClaveTiempoRealAjena(a.codigo);
                        const normCode = normalizeClaveTiempoReal(a.codigo);
                        const isC70 = a.codigo === 'C-70' || a.codigo === 'C70';
                        const isC54 = a.codigo === 'C-54' || a.codigo === 'C54';
                        const isC69 = a.codigo === 'C-69' || a.codigo === 'C69';
                        
                        let val: any = '';
                        if (isTiempoReal) {
                          val = getActividadAjenaHours(emp, normCode);
                        } else if (isC70) {
                          const h70 = getC70Hours(emp);
                          const rate = getWorkerAverageHourlyRate(emp) || emp.tarifaHoraria || 25;
                          val = Math.round(h70 * rate * 100) / 100;
                        } else if (isC54) {
                          const h54 = getC54Hours(emp);
                          const rate = getWorkerAverageHourlyRate(emp) || emp.tarifaHoraria || 25;
                          val = Math.round(h54 * rate * 100) / 100;
                        } else {
                          val = emp.activAjenasValores?.[a.codigo] ?? (emp.activAjenas || '');
                        }

                        const rateWorker = getWorkerAverageHourlyRate(emp) || emp.tarifaHoraria || 25;

                        return (
                          <td 
                            key={a.id} 
                            rowSpan={2} 
                            className={`border border-slate-900 px-1 py-1 text-center font-mono align-middle whitespace-nowrap ${isTiempoReal ? 'bg-amber-50/80 font-bold' : ''} ${isC70 || isC54 ? 'bg-emerald-50/80 font-bold text-emerald-950' : ''}`}
                            title={isC54 
                              ? `C-54 Movilización Militar: ${getC54Hours(emp)}h × Tarifa Promedio $${rateWorker.toFixed(4)}/h = $${Number(val).toFixed(2)}`
                              : isC70 
                              ? `C-70 Feriados no trabajados: ${getC70Hours(emp)}h × Tarifa Promedio $${rateWorker.toFixed(4)}/h = $${Number(val).toFixed(2)}` 
                              : isC69
                              ? `C-69: ${val} horas (Suma al tiempo real. Se edita desde el botón 'Editar' del trabajador)`
                              : (isTiempoReal ? `${normCode}: ${val} horas (actividad ajena que debió trabajar y suma al tiempo real)` : a.nombre)}
                          >
                            {isC70 || isC54 ? (
                              <div className="flex flex-col items-center justify-center">
                                <span className="inline-block px-1 py-0.5 text-3xs font-mono font-bold text-emerald-950 bg-emerald-100/70 rounded tabular-nums whitespace-nowrap">
                                  ${typeof val === 'number' ? val.toFixed(2) : (parseFloat(val) || 0).toFixed(2)}
                                </span>
                                <span className="text-[8px] text-slate-500 font-normal">
                                  ({isC54 ? getC54Hours(emp) : getC70Hours(emp)}h)
                                </span>
                              </div>
                            ) : isC69 ? (
                              <button
                                type="button"
                                onClick={() => onEditEmployee(emp)}
                                className="w-full text-center px-1 py-0.5 text-3xs font-mono font-bold text-amber-950 bg-amber-100/90 hover:bg-amber-200/90 rounded border border-amber-300 transition-colors"
                                title="Haz clic para editar C-69 en los datos complejos del trabajador"
                              >
                                {val || 0} h
                              </button>
                            ) : (
                              <input
                                type="number"
                                step={isTiempoReal ? '0.5' : '0.01'}
                                value={val || ''}
                                placeholder="0"
                                onChange={e => {
                                  const num = parseFloat(e.target.value) || 0;
                                  if (isTiempoReal) {
                                    const autoFromDays = calculateActividadAjenaHoursFromDays(emp, normCode);
                                    const manualVal = Math.max(0, Math.round((num - autoFromDays) * 100) / 100);
                                    const newAct = { 
                                      ...(emp.activAjenasValores || {}), 
                                      [normCode]: manualVal,
                                      [a.codigo]: manualVal 
                                    };
                                    const updateObj: Partial<EmployeePrenomina> = { activAjenasValores: newAct };
                                    if (normCode === 'C-82') {
                                      updateObj.deducciones = { ...(emp.deducciones || {}), vacacSimultanC82: manualVal };
                                    }
                                    onUpdateEmployeeField(emp.id, updateObj);
                                  } else {
                                    const newAct = { ...(emp.activAjenasValores || {}), [a.codigo]: num };
                                    onUpdateEmployeeField(emp.id, { 
                                      activAjenasValores: newAct, 
                                      activAjenas: num 
                                    });
                                  }
                                }}
                                className={`w-full min-w-[36px] text-center bg-transparent border-0 px-0.5 py-0.5 focus:outline-none tabular-nums text-3xs font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isTiempoReal ? 'text-amber-950 font-black' : ''}`}
                              />
                            )}
                          </td>
                        );
                      })}

                      {/* Deducciones Dinámicas (Horas por Clave) */}
                      {activeClavesDeduccion.map(clave => {
                        const val = getDeduccionValue(emp, clave.codigo);
                        const isVac = clave.codigo === 'C-25';
                        return (
                          <td 
                            key={clave.codigo} 
                            rowSpan={2} 
                            className={`border border-slate-900 py-1 px-1 text-center font-mono align-middle whitespace-nowrap ${isVac ? 'bg-rose-100 font-bold text-rose-950' : ''}`}
                          >
                            <input
                              type="number"
                              min="0"
                              value={val || ''}
                              placeholder="0"
                              title={`${clave.nombre} (${clave.codigo})`}
                              onChange={e => handleUpdateDeduccion(emp, clave.codigo, e.target.value)}
                              className={`w-full min-w-[32px] text-center bg-transparent border-none focus:outline-none tabular-nums text-3xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isVac ? 'font-black text-rose-950' : ''}`}
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
                        const dayNum = actualDayIndex + 1;
                        const isHoliday = Boolean(cubanHolidaysMap[dayNum]);
                        const holidayName = cubanHolidaysMap[dayNum];
                        const trimmed = (val || '').trim().toUpperCase();
                        const isRest = trimmed === 'D';
                        const isVac = trimmed === 'V';
                        const isAjena = isClaveTiempoRealAjena(trimmed) || CLAVES_TIEMPO_REAL_AJENAS.some(k => dayCellMatchesClave(trimmed, k));
                        const shift = getWorkerScheduledShiftForDay(emp, actualDayIndex);
                        const ajenaHours = isAjena ? extractHoursFromDayCell(trimmed, shift) : null;

                        return (
                          <td 
                            key={actualDayIndex} 
                            className={`border border-slate-900 p-0 text-center w-5 h-5 ${
                              isRest 
                                ? 'bg-slate-100' 
                                : (isAjena ? 'bg-amber-50' : (isHoliday ? 'bg-rose-100/90' : ''))
                            }`}
                          >
                            <input
                              type="text"
                              maxLength={6}
                              value={val || ''}
                              onChange={e => onUpdateDay(emp.id, actualDayIndex, e.target.value)}
                              className={getDayInputClass(val, dayNum)}
                              title={
                                checkDayValidity(val)
                                  ? `⚠️ Valor inválido: Ingrese un valor entre 0 y 24 horas por día`
                                  : isHoliday
                                  ? `🚩 ${holidayName} (Día Feriado Oficial Ley 116)${val ? ` — ${val}h` : ''}`
                                  : isAjena
                                  ? `${val}: Corresponde a ${ajenaHours}h laborables (Actividad Ajena que suma al tiempo real)`
                                  : isRest
                                  ? `Día ${dayNum}: Descanso semanal (D)`
                                  : isVac
                                  ? `Día ${dayNum}: Vacaciones (V)`
                                  : val
                                  ? `Día ${dayNum}: ${val} horas`
                                  : `Día ${dayNum}`
                              }
                            />
                          </td>
                        );
                      })}

                      {/* Día 31 */}
                      {(() => {
                        const val = row2Days[15] || '';
                        const dayNum = 31;
                        const isHoliday = Boolean(cubanHolidaysMap[dayNum]);
                        const holidayName = cubanHolidaysMap[dayNum];
                        const trimmed = val.trim().toUpperCase();
                        const isRest = trimmed === 'D';
                        const isVac = trimmed === 'V';
                        const isAjena = isClaveTiempoRealAjena(trimmed) || CLAVES_TIEMPO_REAL_AJENAS.some(k => dayCellMatchesClave(trimmed, k));
                        const shift = getWorkerScheduledShiftForDay(emp, 30);
                        const ajenaHours = isAjena ? extractHoursFromDayCell(trimmed, shift) : null;

                        return (
                          <td 
                            className={`border border-slate-900 p-0 text-center w-5 h-5 ${
                              isRest 
                                ? 'bg-slate-100' 
                                : (isAjena ? 'bg-amber-50' : (isHoliday ? 'bg-rose-100/90' : 'bg-slate-100/50'))
                            }`}
                          >
                            <input
                              type="text"
                              maxLength={6}
                              value={val}
                              onChange={e => onUpdateDay(emp.id, 30, e.target.value)}
                              className={getDayInputClass(val, dayNum)}
                              title={
                                checkDayValidity(val)
                                  ? `⚠️ Valor inválido: Ingrese un valor entre 0 y 24 horas por día`
                                  : isHoliday
                                  ? `🚩 ${holidayName} (Día Feriado Oficial Ley 116)${val ? ` — ${val}h` : ''}`
                                  : isAjena
                                  ? `${val}: Corresponde a ${ajenaHours}h laborables (Actividad Ajena que suma al tiempo real)`
                                  : isRest
                                  ? 'Día 31: Descanso semanal (D)'
                                  : isVac
                                  ? 'Día 31: Vacaciones (V)'
                                  : val
                                  ? `Día 31: ${val} horas`
                                  : 'Día 31'
                              }
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
              <td className="border border-slate-900 px-1 text-center font-mono font-bold bg-yellow-300 tabular-nums whitespace-nowrap text-3xs">
                ${totals.totalImporteNocturnidad.toFixed(2)}
              </td>

              {/* Totales C-74 (Doblajes desde días + Horas Extras manuales) */}
              <td className="border border-slate-900 text-center font-mono font-bold bg-orange-200 tabular-nums p-0">
                <div className="border-b border-slate-400 py-0.5 text-3xs font-black text-orange-950">
                  {currentEmployees.reduce((sum, e) => sum + calculateC74HoursFromDays(e) + (e.trabajoExtra?.horas || 0), 0)} h
                </div>
                <div className="py-0.5 text-2xs font-black text-orange-950 bg-orange-300/60">
                  ${totals.totalImporteTrabajoExtra.toFixed(2)}
                </div>
              </td>

              {/* Activ Ajenas Dinámicas (con C-82, C-85, C-57, C-72 en horas) */}
              {activeClavesActivAjenas.map(a => {
                const isTiempoReal = isClaveTiempoRealAjena(a.codigo);
                const normCode = normalizeClaveTiempoReal(a.codigo);
                const isC70 = a.codigo === 'C-70' || a.codigo === 'C70';

                if (isTiempoReal) {
                  const totalHoras = currentEmployees.reduce((sum, e) => sum + getActividadAjenaHours(e, normCode), 0);
                  return (
                    <td 
                      key={a.id} 
                      className="border border-slate-900 px-1 py-1 text-center font-mono tabular-nums font-black bg-amber-200 text-amber-950 text-3xs whitespace-nowrap" 
                      title={`Total Horas ${normCode} sumadas al tiempo real trabajado: ${totalHoras} h`}
                    >
                      {totalHoras} h
                    </td>
                  );
                }
                const totalAct = currentEmployees.reduce((sum, e) => {
                  if (isC70) {
                    const h70 = getC70Hours(e);
                    const rate = getWorkerAverageHourlyRate(e) || e.tarifaHoraria || 25;
                    return sum + Math.round(h70 * rate * 100) / 100;
                  }
                  return sum + (e.activAjenasValores?.[a.codigo] ?? e.activAjenas ?? 0);
                }, 0);
                return (
                  <td 
                    key={a.id} 
                    className={`border border-slate-900 px-1 py-1 text-center font-mono tabular-nums font-bold text-3xs whitespace-nowrap ${isC70 ? 'bg-emerald-200 text-emerald-950 font-black' : ''}`}
                    title={`Total ${a.codigo}: $${totalAct.toFixed(2)}`}
                  >
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
                    className={`border border-slate-900 px-1 py-1 text-center font-mono tabular-nums font-bold whitespace-nowrap text-3xs ${clave.codigo === 'C-25' ? 'bg-rose-200 text-rose-950 font-black' : ''}`}
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
        </div>

        {/* Leyenda y Claves de Deducción Oficiales al pie (Solo en la última hoja) */}
        {validCurrentPage === totalPages && (
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
        )}

      </div>

      {/* Modal de Vista Previa de Impresión Configurable */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold">Vista Previa de Impresión Oficial (Prenómina)</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Ahora</span>
                </button>
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Opciones de Configuración */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-100 border-b border-slate-200 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-700">Orientación:</span>
                <label className="flex items-center gap-1.5 font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="orientation"
                    checked={printConfig.orientation === 'landscape'}
                    onChange={() => setPrintConfig({ ...printConfig, orientation: 'landscape' })}
                  />
                  <span>Horizontal (Recomendado para 31 días)</span>
                </label>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-700">Densidad / Letra:</span>
                <select
                  value={printConfig.fontSize}
                  onChange={e => setPrintConfig({ ...printConfig, fontSize: e.target.value as any })}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-medium cursor-pointer"
                >
                  <option value="normal">Normal Oficial (Compacto)</option>
                  <option value="compact">Ultra Compacto (Ajuste Extremo)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={printConfig.showSignatures}
                    onChange={e => setPrintConfig({ ...printConfig, showSignatures: e.target.checked })}
                  />
                  <span>Incluir Firmas y Bloque de Cierre</span>
                </label>
              </div>
            </div>

            {/* Vista Previa Interactiva */}
            <div className="flex-1 overflow-auto p-6 bg-slate-200/80">
              <div className="bg-white p-6 shadow-2xl rounded-xl border border-slate-300 mx-auto max-w-[1200px]">
                <div className="text-center font-bold text-slate-900 text-sm mb-1 uppercase">
                  EMPRESA DE ASEO Y SERVICIOS COMUNALES · {activeCC.codigoCC}: {activeCC.nombre}
                </div>
                <div className="text-center text-2xs text-slate-600 mb-4 font-mono">
                  PRENÓMINA DE SALARIO — Período: {header.periodoCorresponde} | REEUP: {header.codigoREEUP} | Hoja {validCurrentPage} de {totalPages}
                </div>
                
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 font-medium text-center mb-4">
                  ✓ Configuración lista: El documento impreso incluye estrictamente desde "Nombre y Apellidos" hasta la última columna de "Deducciones". Las columnas de control web ("Salario Total" y "Acciones") están ocultas para la impresión.
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setShowPrintPreview(false);
                      window.print();
                    }}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shadow-md"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Confirmar y Enviar a Impresión / PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  EmployeeWithPrenominaCalc, 
  PayrollSettings, 
  EmployeePrenomina,
  ClaveDeduccion,
  ClaveActividadAjena,
  TarifaNocturnidad
} from '../types/payroll';
import { 
  getDeduccionHoursFromDays, 
  getDeduccionValue,
  calculateActividadAjenaHoursFromDays,
  getActividadAjenaHours,
  isClaveTiempoRealAjena,
  getC54Hours,
  calculateC54HoursFromDays,
  getC70Hours,
  calculateC70HoursFromDays,
  calculateC74HoursFromDays,
  getWorkerAverageHourlyRate
} from '../utils/prenominaCalculator';
import { 
  KeyRound, 
  UserMinus, 
  Search, 
  Download, 
  Printer, 
  Plus, 
  Check, 
  Calendar, 
  FileText, 
  Clock, 
  AlertTriangle, 
  Building2, 
  Filter,
  UserCheck,
  Briefcase,
  HelpCircle,
  Trash2,
  Edit3
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ControlClavesViewProps {
  employees: EmployeeWithPrenominaCalc[];
  allEmployees: EmployeeWithPrenominaCalc[];
  settings: PayrollSettings;
  periodoNombre: string;
  selectedCCId: string;
  onSelectCC: (ccId: string) => void;
  onUpdateEmployee: (id: string, updates: Partial<EmployeeWithPrenominaCalc>) => void;
  onOpenWorkerModal?: (worker: EmployeeWithPrenominaCalc) => void;
  onGoToPrenomina?: () => void;
}

interface ClaveSummaryItem {
  codigo: string;
  nombre: string;
  categoria: 'deduccion' | 'ajena_tiempo_real' | 'promedio' | 'adicional';
  categoriaLabel: string;
  descripcion: string;
  horasDias: number;
  horasManuales: number;
  totalHoras: number;
  importeEstimado: number;
  trabajadoresAfectados: number;
  listaTrabajadores: { id: string; nombre: string; expediente: string; horas: number; cc: string }[];
  impactoNomina: string;
}

export const ControlClavesView: React.FC<ControlClavesViewProps> = ({
  employees,
  allEmployees,
  settings,
  periodoNombre,
  selectedCCId,
  onSelectCC,
  onUpdateEmployee,
  onOpenWorkerModal,
  onGoToPrenomina
}) => {
  // Filtro de alcance: CC Activo o Todos los CC
  const [scope, setScope] = useState<'cc' | 'todos'>('cc');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'todas' | 'deduccion' | 'ajena_tiempo_real' | 'promedio' | 'adicional'>('todas');
  const [searchTerm, setSearchTerm] = useState('');

  // Selector para registrar nueva baja
  const [selectedWorkerForBaja, setSelectedWorkerForBaja] = useState<string>('');
  const [newBajaFecha, setNewBajaFecha] = useState<string>(new Date().toISOString().slice(0, 10));
  const [newBajaMotivo, setNewBajaMotivo] = useState<string>('Renuncia voluntaria');
  const [newBajaHoras, setNewBajaHoras] = useState<number>(8);
  const [showAddBajaModal, setShowAddBajaModal] = useState<boolean>(false);



  const [promedioTrabajadoresFechas, setPromedioTrabajadoresFechas] = useState([
    { desde: '01/07/2021', hasta: '09/07/2021', cantidad: 150 },
    { desde: '10/07/2021', hasta: '10/07/2021', cantidad: 149 },
    { desde: '11/07/2021', hasta: '16/07/2021', cantidad: 148 },
    { desde: '17/07/2021', hasta: '31/07/2021', cantidad: 147 },
  ]);

  const [resumenSalarioMeta, setResumenSalarioMeta] = useState({
    agencia: 'AGENCIA # 3 CASA BLANCA',
    mes: 'Julio',
    certificadosIniciales: 16,
    importeTotalCertificados: 9401.06,
    hombresPrenomina: 13,
    mujeresPrenomina: 59,
    porcentajeCompletamiento: 98.71
  });

  const [parteDirTerr, setParteDirTerr] = useState([
    { categoria: 'CE', plan: 2, real: 2 },
    { categoria: 'T', plan: 5, real: 5 },
    { categoria: 'S', plan: 148, real: 146 },
    { categoria: 'O', plan: 0, real: 0 },
  ]);

  // Lista de trabajadores a evaluar según el alcance
  const currentWorkerList = useMemo(() => {
    return scope === 'cc' ? employees : allEmployees;
  }, [scope, employees, allEmployees]);

  // Parte de Completamiento calculado dinámicamente desde la Plantilla en Opciones y la nómina real
  const parteCompletamiento = useMemo(() => {
    const configPlantilla = settings.plantillaCargos || [];
    return configPlantilla.map(p => {
      const realCount = currentWorkerList.filter(w => 
        (w.cargo || '').trim().toLowerCase() === p.cargo.trim().toLowerCase()
      ).length;
      const plan = p.cantidadPlan;
      const vacantes = Math.max(0, plan - realCount);
      return {
        cargo: p.cargo,
        real: realCount,
        vacantes: vacantes,
        plantilla: plan
      };
    });
  }, [settings.plantillaCargos, currentWorkerList]);

  const parteCompletamientoTotals = useMemo(() => {
    return parteCompletamiento.reduce((acc, curr) => ({
      real: acc.real + curr.real,
      vacantes: acc.vacantes + curr.vacantes,
      plantilla: acc.plantilla + curr.plantilla
    }), { real: 0, vacantes: 0, plantilla: 0 });
  }, [parteCompletamiento]);

  // Motivos frecuentes de baja según legislación laboral cubana (Ley 116)
  const motivosFrecuentesBaja = [
    'Renuncia voluntaria',
    'Jubilación por edad',
    'Traslado definitivo a otra entidad',
    'Invalidez total / Peritaje médico',
    'Vencimiento de contrato determinado',
    'Sanción disciplinaria de separación definitiva',
    'Fallecimiento del trabajador',
    'Baja por reordenamiento o amortización de plaza'
  ];

  // =========================================================================
  // 1. CÁLCULO Y RESUMEN DE TODAS LAS CLAVES CONFIGURADAS EN LA PRENÓMINA
  // =========================================================================
  const resumenClaves: ClaveSummaryItem[] = useMemo(() => {
    const list: ClaveSummaryItem[] = [];

    // Mapas de Centros de Costo para nombres
    const ccMap = new Map((settings.centrosCosto || []).map(c => [c.id, c.codigoCC]));

    // --- A. DEDUCCIONES OFICIALES CONFIGURADAS ---
    const clavesDeduccion = settings.clavesDeduccion || [];
    clavesDeduccion.forEach(cd => {
      // Ignorar si por error estuviera una de tiempo real ajena
      if (isClaveTiempoRealAjena(cd.codigo)) return;

      let totalDias = 0;
      let totalManual = 0;
      const trabList: { id: string; nombre: string; expediente: string; horas: number; cc: string }[] = [];

      currentWorkerList.forEach(w => {
        const fromDays = getDeduccionHoursFromDays(w, cd.codigo);
        // Manuales
        let manual = 0;
        if (w.deduccionesValores && w.deduccionesValores[cd.codigo] !== undefined) {
          manual = w.deduccionesValores[cd.codigo] || 0;
        } else {
          switch (cd.codigo) {
            case 'C-25': manual = w.deducciones?.vacacPlanifC25 || 0; break;
            case 'C-20': manual = w.deducciones?.cMedC20 || 0; break;
            case 'C-10':
            case 'C-11': manual = w.deducciones?.ausInjustJustC10_C11 || 0; break;
            case 'C-27': manual = w.deducciones?.bajaC27 || 0; break;
            case 'C-30': manual = w.deducciones?.nuevoIngC30 || 0; break;
            case 'C-31': manual = w.deducciones?.trasladoC31 || 0; break;
          }
        }

        const workerTotal = fromDays + manual;
        if (workerTotal > 0) {
          totalDias += fromDays;
          totalManual += manual;
          trabList.push({
            id: w.id,
            nombre: w.nombreApellidos,
            expediente: w.numeroExpediente || w.id,
            horas: workerTotal,
            cc: ccMap.get(w.centroCostoId || '') || 'CC 101'
          });
        }
      });

      const totalH = Math.round((totalDias + totalManual) * 100) / 100;
      let impacto = 'Resta horas al fondo de tiempo laborado';
      if (cd.codigo === 'C-20') impacto = 'Incapacidad médica (subsidio exento de CESS/ISIP)';
      else if (cd.codigo === 'C-25') impacto = 'Vacaciones anuales remuneradas';
      else if (cd.codigo === 'C-27') impacto = 'Desvinculación definitiva del trabajador';

      list.push({
        codigo: cd.codigo,
        nombre: cd.nombre,
        categoria: 'deduccion',
        categoriaLabel: 'Deducción Oficial',
        descripcion: cd.descripcion || 'Deducción e incidencia en jornada mensual',
        horasDias: Math.round(totalDias * 100) / 100,
        horasManuales: Math.round(totalManual * 100) / 100,
        totalHoras: totalH,
        importeEstimado: 0, // Las deducciones descuentan tiempo
        trabajadoresAfectados: trabList.length,
        listaTrabajadores: trabList,
        impactoNomina: impacto
      });
    });

    // --- B. ACTIVIDADES AJENAS QUE SUMAN AL TIEMPO REAL LABORADO (C-82, C-85, C-57, C-72, C-69) ---
    const clavesTiempoReal = [
      { codigo: 'C-82', nombre: 'C-82 Vacaciones Simultáneas', desc: 'Vacaciones simultáneas autorizadas que se suman directamente al tiempo real' },
      { codigo: 'C-85', nombre: 'C-85 Movilizados / Defensa', desc: 'Tareas de defensa de la patria y movilización que suman al tiempo real' },
      { codigo: 'C-57', nombre: 'C-57 Interrupción Autorizada', desc: 'Interrupción laboral con retribución que suma al tiempo real' },
      { codigo: 'C-72', nombre: 'C-72 Capacitación / Comisión', desc: 'Cursos de superación y comisiones de servicio que suman al tiempo real' },
      { codigo: 'C-69', nombre: 'C-69 Categoría Ocupacional', desc: 'Horas de categoría ocupacional que suman al tiempo real laborado' },
    ];

    clavesTiempoReal.forEach(item => {
      let totalDias = 0;
      let totalManual = 0;
      const trabList: { id: string; nombre: string; expediente: string; horas: number; cc: string }[] = [];

      currentWorkerList.forEach(w => {
        const fromDays = calculateActividadAjenaHoursFromDays(w, item.codigo);
        let manual = 0;
        if (w.activAjenasValores) {
          manual = w.activAjenasValores[item.codigo] ?? w.activAjenasValores[item.codigo.replace('-', '')] ?? 0;
        }
        if (item.codigo === 'C-82' && manual === 0) {
          manual = w.deducciones?.vacacSimultanC82 || w.deduccionesValores?.['C-82'] || 0;
        }

        const workerTotal = fromDays + manual;
        if (workerTotal > 0) {
          totalDias += fromDays;
          totalManual += manual;
          trabList.push({
            id: w.id,
            nombre: w.nombreApellidos,
            expediente: w.numeroExpediente || w.id,
            horas: workerTotal,
            cc: ccMap.get(w.centroCostoId || '') || 'CC 101'
          });
        }
      });

      const totalH = Math.round((totalDias + totalManual) * 100) / 100;
      list.push({
        codigo: item.codigo,
        nombre: item.nombre,
        categoria: 'ajena_tiempo_real',
        categoriaLabel: 'Actividad Ajena (+ Tiempo Real)',
        descripcion: item.desc,
        horasDias: Math.round(totalDias * 100) / 100,
        horasManuales: Math.round(totalManual * 100) / 100,
        totalHoras: totalH,
        importeEstimado: 0,
        trabajadoresAfectados: trabList.length,
        listaTrabajadores: trabList,
        impactoNomina: 'SUMA directamente a las horas de tiempo real laborado y a la tarifa horaria'
      });
    });

    // --- C. ACTIVIDADES AJENAS PAGADAS POR SALARIO PROMEDIO (C-54, C-70) ---
    // C-54 Movilización Militar
    let totalC54Dias = 0;
    let totalC54Manual = 0;
    let importeC54Total = 0;
    const trabC54List: { id: string; nombre: string; expediente: string; horas: number; cc: string }[] = [];

    currentWorkerList.forEach(w => {
      const fromDays = calculateC54HoursFromDays(w);
      const manual = w.activAjenasValores?.['C-54'] ?? w.activAjenasValores?.['C54'] ?? 0;
      const workerTotal = fromDays + manual;
      if (workerTotal > 0) {
        totalC54Dias += fromDays;
        totalC54Manual += manual;
        const rateProm = getWorkerAverageHourlyRate(w) || w.tarifaHoraria || (w.salarioBasicoEscala ? w.salarioBasicoEscala / 190.6 : 25);
        importeC54Total += workerTotal * rateProm;
        trabC54List.push({
          id: w.id,
          nombre: w.nombreApellidos,
          expediente: w.numeroExpediente || w.id,
          horas: workerTotal,
          cc: ccMap.get(w.centroCostoId || '') || 'CC 101'
        });
      }
    });

    list.push({
      codigo: 'C-54',
      nombre: 'C-54 Movilización Militar',
      categoria: 'promedio',
      categoriaLabel: 'Salario Promedio',
      descripcion: 'Movilización militar remunerada mediante la tarifa promedio por hora del trabajador',
      horasDias: Math.round(totalC54Dias * 100) / 100,
      horasManuales: Math.round(totalC54Manual * 100) / 100,
      totalHoras: Math.round((totalC54Dias + totalC54Manual) * 100) / 100,
      importeEstimado: Math.round(importeC54Total * 100) / 100,
      trabajadoresAfectados: trabC54List.length,
      listaTrabajadores: trabC54List,
      impactoNomina: 'Se liquida multiplicando las horas por la tarifa horaria promedio'
    });

    // C-70 Feriados no trabajados
    let totalC70Dias = 0;
    let totalC70Manual = 0;
    let importeC70Total = 0;
    const trabC70List: { id: string; nombre: string; expediente: string; horas: number; cc: string }[] = [];

    currentWorkerList.forEach(w => {
      const fromDays = calculateC70HoursFromDays(w);
      const manual = w.activAjenasValores?.['C-70'] ?? w.deduccionesValores?.['C-70'] ?? 0;
      const workerTotal = fromDays + manual;
      if (workerTotal > 0) {
        totalC70Dias += fromDays;
        totalC70Manual += manual;
        const rateProm = getWorkerAverageHourlyRate(w) || w.tarifaHoraria || 25;
        importeC70Total += workerTotal * rateProm;
        trabC70List.push({
          id: w.id,
          nombre: w.nombreApellidos,
          expediente: w.numeroExpediente || w.id,
          horas: workerTotal,
          cc: ccMap.get(w.centroCostoId || '') || 'CC 101'
        });
      }
    });

    list.push({
      codigo: 'C-70',
      nombre: 'C-70 Feriados / Conmemoración Nacional',
      categoria: 'promedio',
      categoriaLabel: 'Salario Promedio',
      descripcion: 'Días feriados oficiales según Código de Trabajo no laborados pagados por promedio',
      horasDias: Math.round(totalC70Dias * 100) / 100,
      horasManuales: Math.round(totalC70Manual * 100) / 100,
      totalHoras: Math.round((totalC70Dias + totalC70Manual) * 100) / 100,
      importeEstimado: Math.round(importeC70Total * 100) / 100,
      trabajadoresAfectados: trabC70List.length,
      listaTrabajadores: trabC70List,
      impactoNomina: 'Pago de feriado oficial liquidado por salario promedio'
    });

    // --- D. HORAS EXTRAS (C-74) Y NOCTURNIDAD ---
    // C-74 Horas Extraordinarias
    let totalC74Horas = 0;
    let importeC74Total = 0;
    const trabC74List: { id: string; nombre: string; expediente: string; horas: number; cc: string }[] = [];

    currentWorkerList.forEach(w => {
      const fromDaysC74 = calculateC74HoursFromDays(w);
      const hExtras = (w.trabajoExtra?.horas || 0) + fromDaysC74;
      const imp = w.trabajoExtra?.importe || 0;
      if (hExtras > 0 || imp > 0) {
        totalC74Horas += hExtras;
        importeC74Total += imp;
        trabC74List.push({
          id: w.id,
          nombre: w.nombreApellidos,
          expediente: w.numeroExpediente || w.id,
          horas: hExtras,
          cc: ccMap.get(w.centroCostoId || '') || 'CC 101'
        });
      }
    });

    list.push({
      codigo: 'C-74',
      nombre: 'C-74 Horas Extraordinarias / Doblajes',
      categoria: 'adicional',
      categoriaLabel: 'Trabajo Extraordinario',
      descripcion: 'Trabajo prestado fuera de la jornada regular o doblajes en turnos rotativos',
      horasDias: 0,
      horasManuales: Math.round(totalC74Horas * 100) / 100,
      totalHoras: Math.round(totalC74Horas * 100) / 100,
      importeEstimado: Math.round(importeC74Total * 100) / 100,
      trabajadoresAfectados: trabC74List.length,
      listaTrabajadores: trabC74List,
      impactoNomina: 'Ingreso computable remunerado al doble (factor 2.0x)'
    });

    // C-05 Nocturnidad Consolidada
    let totalNoctHoras = 0;
    let importeNoctTotal = 0;
    const trabNoctList: { id: string; nombre: string; expediente: string; horas: number; cc: string }[] = [];

    currentWorkerList.forEach(w => {
      const h5 = w.nocturnidad?.horas5 || 0;
      const h10 = w.nocturnidad?.horas10 || 0;
      const n100 = w.nocturnidad?.nochesComp100 || 0;
      const imp = w.nocturnidad?.totalNocturnidad || 0;
      const sumH = h5 + h10;
      if (sumH > 0 || n100 > 0 || imp > 0) {
        totalNoctHoras += sumH;
        importeNoctTotal += imp;
        trabNoctList.push({
          id: w.id,
          nombre: w.nombreApellidos,
          expediente: w.numeroExpediente || w.id,
          horas: sumH,
          cc: ccMap.get(w.centroCostoId || '') || 'CC 101'
        });
      }
    });

    list.push({
      codigo: 'C-05',
      nombre: 'C-05 Pagos de Nocturnidad',
      categoria: 'adicional',
      categoriaLabel: 'Nocturnidad Oficial',
      descripcion: 'Horas y noches laboradas en turno nocturno ($5.00/h, $10.00/h y $100/noche)',
      horasDias: 0,
      horasManuales: Math.round(totalNoctHoras * 100) / 100,
      totalHoras: Math.round(totalNoctHoras * 100) / 100,
      importeEstimado: Math.round(importeNoctTotal * 100) / 100,
      trabajadoresAfectados: trabNoctList.length,
      listaTrabajadores: trabNoctList,
      impactoNomina: 'Compensación fija adicional por nocturnidad'
    });

    // Ocultar claves que se encuentren en cero (0 horas, 0 importe, 0 afectados) para optimizar espacio
    return list.filter(item => item.totalHoras > 0 || item.importeEstimado > 0 || item.trabajadoresAfectados > 0);
  }, [currentWorkerList, settings]);

  // Claves filtradas por categoría y término de búsqueda
  const clavesFiltradas = useMemo(() => {
    return resumenClaves.filter(c => {
      const matchesCategory = activeCategoryFilter === 'todas' || c.categoria === activeCategoryFilter;
      const matchesSearch = searchTerm.trim() === '' || 
        c.codigo.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [resumenClaves, activeCategoryFilter, searchTerm]);

  // Manejadores para edición manual del Promedio de Trabajadores por Fechas
  const handleUpdatePromedioFecha = (index: number, field: 'desde' | 'hasta' | 'cantidad', value: string | number) => {
    setPromedioTrabajadoresFechas(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddPromedioRow = () => {
    setPromedioTrabajadoresFechas(prev => [
      ...prev,
      { desde: '01/08/2021', hasta: '31/08/2021', cantidad: 150 }
    ]);
  };

  const handleRemovePromedioRow = (index: number) => {
    setPromedioTrabajadoresFechas(prev => prev.filter((_, i) => i !== index));
  };

  // =========================================================================
  // 2. CONTROL DE BAJAS: TRABAJADORES CON CLAVE C-27 EN LA PRENÓMINA
  // =========================================================================
  const trabajadoresBajas = useMemo(() => {
    return currentWorkerList.filter(w => {
      // Detección exhaustiva de trabajadores con C-27
      const hoursFromDays = getDeduccionHoursFromDays(w, 'C-27');
      const manualBaja = w.deducciones?.bajaC27 || 0;
      const dictBaja = w.deduccionesValores?.['C-27'] || w.deduccionesValores?.['C27'] || 0;
      const hasC27InDays = w.dias?.some(d => {
        const text = (d || '').trim().toUpperCase();
        return text === 'C-27' || text === 'C27' || text === 'B' || text === 'BAJA' || text.startsWith('C-27:');
      });
      const hasBajaFields = Boolean((w.fechaBaja && w.fechaBaja.trim() !== '') || (w.motivoBaja && w.motivoBaja.trim() !== ''));

      return hoursFromDays > 0 || manualBaja > 0 || dictBaja > 0 || hasC27InDays || hasBajaFields;
    });
  }, [currentWorkerList]);

  // Manejador para actualizar fecha de baja de un trabajador (editable)
  const handleFechaBajaChange = (workerId: string, fecha: string) => {
    onUpdateEmployee(workerId, { fechaBaja: fecha });
  };

  // Manejador para actualizar motivo de baja de un trabajador (editable)
  const handleMotivoBajaChange = (workerId: string, motivo: string) => {
    onUpdateEmployee(workerId, { motivoBaja: motivo });
  };

  // Manejador para asignar C-27 a un trabajador desde el modal rápido
  const handleAssignBaja = () => {
    if (!selectedWorkerForBaja) {
      alert('Por favor seleccione un trabajador de la lista.');
      return;
    }
    const worker = allEmployees.find(w => w.id === selectedWorkerForBaja);
    if (!worker) return;

    onUpdateEmployee(worker.id, {
      fechaBaja: newBajaFecha,
      motivoBaja: newBajaMotivo,
      deducciones: {
        ...(worker.deducciones || {}),
        bajaC27: newBajaHoras > 0 ? newBajaHoras : (worker.deducciones?.bajaC27 || 8)
      },
      deduccionesValores: {
        ...(worker.deduccionesValores || {}),
        'C-27': newBajaHoras > 0 ? newBajaHoras : 8
      }
    });

    setShowAddBajaModal(false);
    setSelectedWorkerForBaja('');
  };

  // Manejador para retirar marca de baja C-27
  const handleRemoveBaja = (workerId: string) => {
    const worker = allEmployees.find(w => w.id === workerId);
    if (!worker) return;
    if (confirm(`¿Confirma que desea retirar la marca de baja (C-27) del trabajador "${worker.nombreApellidos}"?`)) {
      onUpdateEmployee(workerId, {
        fechaBaja: '',
        motivoBaja: '',
        deducciones: {
          ...(worker.deducciones || {}),
          bajaC27: 0
        },
        deduccionesValores: {
          ...(worker.deduccionesValores || {}),
          'C-27': 0
        }
      });
    }
  };

  // Exportar a Excel (.xlsx) el Control de Claves y Control de Bajas
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Hoja 1: Resumen de Claves
    const clavesData = resumenClaves.map(c => ({
      'Código': c.codigo,
      'Denominación de la Clave': c.nombre,
      'Clasificación': c.categoriaLabel,
      'Trabajadores': c.trabajadoresAfectados,
      'Horas en Días': c.horasDias,
      'Horas Manuales': c.horasManuales,
      'Total Horas': c.totalHoras,
      'Importe ($)': c.importeEstimado > 0 ? c.importeEstimado : '-',
      'Impacto en Nómina': c.impactoNomina
    }));
    const wsClaves = XLSX.utils.json_to_sheet(clavesData);
    XLSX.utils.book_append_sheet(wb, wsClaves, 'Control de Claves');

    // Hoja 2: Control de Bajas (C-27)
    const bajasData = trabajadoresBajas.map(w => {
      const totalBajaH = getDeduccionHoursFromDays(w, 'C-27') + (w.deducciones?.bajaC27 || 0);
      const ccName = settings.centrosCosto?.find(c => c.id === w.centroCostoId)?.codigoCC || 'CC 101';
      return {
        'Expediente': w.numeroExpediente || w.id,
        'Nombre del Trabajador': w.nombreApellidos,
        'Centro de Costo': ccName,
        'Cargo': w.cargo || 'Técnico',
        'Fecha de la Baja': w.fechaBaja || 'Pendiente de registrar',
        'Motivo de la Baja': w.motivoBaja || 'Baja definitiva C-27',
        'Horas C-27': totalBajaH,
        'Fondo de Tiempo': w.fondoTiempoIndividual || 185
      };
    });
    const wsBajas = XLSX.utils.json_to_sheet(bajasData.length > 0 ? bajasData : [{ 'Aviso': 'No hay trabajadores con baja C-27 registrados' }]);
    XLSX.utils.book_append_sheet(wb, wsBajas, 'Control de Bajas C-27');

    XLSX.writeFile(wb, `Control_Claves_y_Bajas_${periodoNombre.replace(/\s+/g, '_')}.xlsx`);
  };

  // Métricas de encabezado
  const totalHorasClaves = useMemo(() => {
    return resumenClaves.reduce((acc, c) => acc + c.totalHoras, 0);
  }, [resumenClaves]);

  const totalImporteClaves = useMemo(() => {
    return resumenClaves.reduce((acc, c) => acc + c.importeEstimado, 0);
  }, [resumenClaves]);

  const { mujeresCount, hombresCount, porcentajeMujeres } = useMemo(() => {
    const mujeres = currentWorkerList.filter(w => w.sexo === 'F').length;
    const hombres = currentWorkerList.filter(w => w.sexo !== 'F').length;
    const total = currentWorkerList.length;
    const porc = total > 0 ? ((mujeres / total) * 100).toFixed(1) : '0.0';
    return { mujeresCount: mujeres, hombresCount: hombres, porcentajeMujeres: porc };
  }, [currentWorkerList]);

  return (
    <div className="space-y-6">
      
      {/* Sección 0: Modelo Oficial del Control de Claves (Basado en PDF) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">RESUMEN DE SALARIO & PARTE OFICIAL</div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              AGENCIA: {resumenSalarioMeta.agencia} — Mes: {resumenSalarioMeta.mes}
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-900 font-bold rounded-lg border border-emerald-200">
              % Completamiento: {resumenSalarioMeta.porcentajeCompletamiento}%
            </span>
            <span className="px-3 py-1 bg-blue-50 text-blue-900 font-bold rounded-lg border border-blue-200">
              Hombres en prenóminas: {hombresCount} | Mujeres: {mujeresCount} ({porcentajeMujeres}%)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* 1. Parte de Completamiento (Cargo, Real, Vacantes, Plantilla) */}
          <div className="lg:col-span-5 bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Parte de Completamiento</h4>
              <span className="text-3xs text-slate-500 font-mono">Plantilla / Real</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-slate-500 text-3xs border-b border-slate-200">
                    <th className="py-1">Cargo</th>
                    <th className="py-1 text-center">Real</th>
                    <th className="py-1 text-center">Vac</th>
                    <th className="py-1 text-center">Plan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 font-medium">
                  {parteCompletamiento.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-100/60">
                      <td className="py-1.5 text-slate-900 font-medium">{item.cargo}</td>
                      <td className="py-1.5 text-center font-mono font-bold text-slate-900">{item.real}</td>
                      <td className="py-1.5 text-center font-mono text-slate-600">{item.vacantes}</td>
                      <td className="py-1.5 text-center font-mono font-bold text-slate-700">{item.plantilla}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-200/70 font-black text-slate-950 border-t-2 border-slate-300">
                    <td className="py-1.5">Total</td>
                    <td className="py-1.5 text-center font-mono">{parteCompletamientoTotals.real}</td>
                    <td className="py-1.5 text-center font-mono">{parteCompletamientoTotals.vacantes}</td>
                    <td className="py-1.5 text-center font-mono">{parteCompletamientoTotals.plantilla}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="text-3xs text-slate-600 font-medium pt-1 flex justify-between">
              <span>Total Mujeres: {mujeresCount} ({porcentajeMujeres}%)</span>
              <span>Total Trabajadores: {currentWorkerList.length} Real</span>
            </div>
          </div>

          {/* 2. Certificados Médicos y Promedio de Trabajadores por Fechas */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Certificados Médicos */}
            <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 space-y-1.5">
              <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-700" />
                <span>Certificados Médicos</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-amber-200/80">
                  <span className="text-3xs text-slate-500 block">Cant. Iniciales:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">16</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-amber-200/80">
                  <span className="text-3xs text-slate-500 block">Importe Total:</span>
                  <span className="font-mono font-bold text-emerald-700 text-xs">$9,401.06</span>
                </div>
              </div>
            </div>

            {/* Promedio de Trabajadores (Fechas y Cantidad editables manualmente) */}
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Promedio de Trabajadores</h4>
                <button
                  type="button"
                  onClick={handleAddPromedioRow}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-3xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors cursor-pointer"
                  title="Añadir nuevo rango de fechas"
                >
                  <Plus className="w-3 h-3" /> Añadir Rango
                </button>
              </div>
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-slate-500 text-3xs border-b border-slate-200">
                    <th className="py-1">Desde</th>
                    <th className="py-1">Hasta</th>
                    <th className="py-1 text-center">Cantidad</th>
                    <th className="py-1 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 font-mono text-xs">
                  {promedioTrabajadoresFechas.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-100/60">
                      <td className="py-1 pr-1">
                        <input
                          type="text"
                          value={p.desde}
                          onChange={e => handleUpdatePromedioFecha(idx, 'desde', e.target.value)}
                          className="w-full px-1.5 py-0.5 bg-white border border-slate-300 rounded text-3xs font-mono font-bold text-slate-900"
                        />
                      </td>
                      <td className="py-1 pr-1">
                        <input
                          type="text"
                          value={p.hasta}
                          onChange={e => handleUpdatePromedioFecha(idx, 'hasta', e.target.value)}
                          className="w-full px-1.5 py-0.5 bg-white border border-slate-300 rounded text-3xs font-mono font-bold text-slate-900"
                        />
                      </td>
                      <td className="py-1 text-center pr-1 w-16">
                        <input
                          type="number"
                          value={p.cantidad}
                          onChange={e => handleUpdatePromedioFecha(idx, 'cantidad', parseInt(e.target.value) || 0)}
                          className="w-full px-1 py-0.5 bg-white border border-slate-300 rounded text-3xs font-mono font-bold text-center text-slate-900"
                        />
                      </td>
                      <td className="py-1 text-center w-8">
                        {promedioTrabajadoresFechas.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePromedioRow(idx)}
                            className="p-0.5 text-rose-600 hover:text-rose-900 rounded transition-colors cursor-pointer"
                            title="Eliminar rango"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

          {/* 3. Parte Dir. Terr. (Plan vs Real) */}
          <div className="lg:col-span-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Parte Dir. Terr.</h4>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-500 text-3xs border-b border-slate-200">
                  <th className="py-1">Categoría</th>
                  <th className="py-1 text-center">Plan</th>
                  <th className="py-1 text-center">Real</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 font-medium">
                {parteDirTerr.map((d, idx) => (
                  <tr key={idx} className="hover:bg-slate-100/60">
                    <td className="py-1.5 font-bold text-slate-900">{d.categoria}</td>
                    <td className="py-1.5 text-center font-mono text-slate-700">{d.plan}</td>
                    <td className="py-1.5 text-center font-mono font-bold text-slate-900">{d.real}</td>
                  </tr>
                ))}
                <tr className="bg-slate-200/70 font-black text-slate-950 border-t-2 border-slate-300">
                  <td className="py-1.5">TOTAL</td>
                  <td className="py-1.5 text-center font-mono">155</td>
                  <td className="py-1.5 text-center font-mono">153</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* Encabezado del Módulo original */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-600 text-white rounded-xl shadow-xs">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Control de Claves & Registro de Bajas (C-27)
              </h1>
              <span className="text-3xs font-mono font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200">
                OFICIAL
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {periodoNombre} · Resumen integral de claves configuradas, totalización de valores y control de bajas de personal.
            </p>
          </div>
        </div>

        {/* Acciones principales y switch de alcance */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Switch CC Activo vs Todos */}
          <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100 text-2xs font-semibold">
            <button
              onClick={() => setScope('cc')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                scope === 'cc' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>CC Activo ({employees.length} trab.)</span>
            </button>
            <button
              onClick={() => setScope('todos')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                scope === 'todos' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Toda la Empresa ({allEmployees.length} trab.)</span>
            </button>
          </div>

          {/* Exportar Excel */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Exportar resumen de claves y control de bajas a Excel (.xlsx)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exportar Excel</span>
          </button>

          {/* Imprimir */}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Imprimir reporte oficial de claves y bajas"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 no-print">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Claves Monitoreadas</span>
            <span className="p-1.5 bg-slate-100 rounded-lg text-slate-700">
              <KeyRound className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{resumenClaves.length}</span>
            <span className="text-2xs text-slate-500">claves activas</span>
          </div>
          <p className="text-3xs text-slate-400 mt-1">Deducciones, ajenas y nocturnidad</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Total Horas en Claves</span>
            <span className="p-1.5 bg-blue-100 rounded-lg text-blue-700">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-950 font-mono">{totalHorasClaves.toFixed(1)} h</span>
          </div>
          <p className="text-3xs text-slate-400 mt-1">Computadas en el período activo</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs bg-rose-50/20">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-rose-900">Control de Bajas (C-27)</span>
            <span className="p-1.5 bg-rose-100 rounded-lg text-rose-700">
              <UserMinus className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-950 font-mono">{trabajadoresBajas.length}</span>
            <span className="text-2xs text-rose-700 font-medium">trabajador(es) con baja</span>
          </div>
          <p className="text-3xs text-rose-700/80 mt-1">Tabla de seguimiento editable debajo</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">Importe Computado</span>
            <span className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-950 font-mono">${totalImporteClaves.toFixed(2)}</span>
          </div>
          <p className="text-3xs text-slate-400 mt-1">C-74, C-54, C-70 y nocturnidad</p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN 1: RESUMEN DE TODAS LAS CLAVES CONFIGURADAS EN LA PRENÓMINA       */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Cabecera y Filtros de la Tabla de Claves */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-rose-600" />
                <span>Resumen de Todas las Claves Configuradas en la Prenómina</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Consolidado de horas en días (almanaque), horas manuales e importe total por cada clave oficial.
              </p>
            </div>

            {/* Barra de búsqueda rápida */}
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar clave o descripción..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {/* Categorías / Tabs de Filtro */}
          <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-3 border-t border-slate-200/80 text-2xs">
            <span className="font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filtrar por:
            </span>
            <button
              onClick={() => setActiveCategoryFilter('todas')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                activeCategoryFilter === 'todas'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Todas ({resumenClaves.length})
            </button>
            <button
              onClick={() => setActiveCategoryFilter('deduccion')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                activeCategoryFilter === 'deduccion'
                  ? 'bg-rose-700 text-white'
                  : 'bg-white text-rose-800 border border-rose-200 hover:bg-rose-50'
              }`}
            >
              Deducciones Oficiales (C-25, C-20, C-10, C-27...)
            </button>
            <button
              onClick={() => setActiveCategoryFilter('ajena_tiempo_real')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                activeCategoryFilter === 'ajena_tiempo_real'
                  ? 'bg-amber-700 text-white'
                  : 'bg-white text-amber-900 border border-amber-200 hover:bg-amber-50'
              }`}
            >
              Actividades Ajenas (+ Tiempo Real C-82, C-85, C-69...)
            </button>
            <button
              onClick={() => setActiveCategoryFilter('promedio')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                activeCategoryFilter === 'promedio'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white text-emerald-900 border border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              Salario Promedio (C-54, C-70)
            </button>
            <button
              onClick={() => setActiveCategoryFilter('adicional')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                activeCategoryFilter === 'adicional'
                  ? 'bg-blue-700 text-white'
                  : 'bg-white text-blue-900 border border-blue-200 hover:bg-blue-50'
              }`}
            >
              Horas Extras & Nocturnidad (C-74, C-05)
            </button>
          </div>
        </div>

        {/* Tabla de Claves Configuradas */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-2xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200">
                <th className="py-2.5 px-3.5">Código</th>
                <th className="py-2.5 px-3.5">Denominación Oficial</th>
                <th className="py-2.5 px-3.5">Clasificación / Naturaleza</th>
                <th className="py-2.5 px-3.5 text-center">Trabajadores</th>
                <th className="py-2.5 px-3.5 text-right font-mono">Horas Días (Alm.)</th>
                <th className="py-2.5 px-3.5 text-right font-mono">Horas Manuales</th>
                <th className="py-2.5 px-3.5 text-right font-mono">Valor Total</th>
                <th className="py-2.5 px-3.5 text-right font-mono">Importe ($)</th>
                <th className="py-2.5 px-3.5">Efecto en Prenómina</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clavesFiltradas.length > 0 ? (
                clavesFiltradas.map(c => {
                  const hasHours = c.totalHoras > 0;
                  return (
                    <tr 
                      key={c.codigo} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        c.codigo === 'C-27' ? 'bg-rose-50/30 font-medium' : ''
                      }`}
                    >
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-2xs ${
                          c.codigo === 'C-27'
                            ? 'bg-rose-200 text-rose-950 border border-rose-300'
                            : c.categoria === 'ajena_tiempo_real'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : c.categoria === 'promedio'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            : 'bg-slate-200/80 text-slate-900'
                        }`}>
                          {c.codigo}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 font-semibold text-slate-900">
                        <div>{c.nombre}</div>
                        <div className="text-3xs text-slate-500 font-normal truncate max-w-xs">{c.descripcion}</div>
                      </td>

                      <td className="py-3 px-3.5">
                        <span className={`inline-block text-3xs font-bold px-2 py-0.5 rounded-full ${
                          c.categoria === 'deduccion'
                            ? 'bg-rose-100 text-rose-800'
                            : c.categoria === 'ajena_tiempo_real'
                            ? 'bg-amber-100 text-amber-900'
                            : c.categoria === 'promedio'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {c.categoriaLabel}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-center">
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded font-mono text-2xs font-bold ${
                          c.trabajadoresAfectados > 0
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {c.trabajadoresAfectados}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-right font-mono text-slate-600">
                        {c.horasDias > 0 ? `${c.horasDias.toFixed(1)} h` : '-'}
                      </td>

                      <td className="py-3 px-3.5 text-right font-mono text-slate-600">
                        {c.horasManuales > 0 ? `${c.horasManuales.toFixed(1)} h` : '-'}
                      </td>

                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                        <span className={hasHours ? 'text-slate-950 font-black' : 'text-slate-400'}>
                          {c.totalHoras > 0 ? `${c.totalHoras.toFixed(1)} h` : '0.0 h'}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-right font-mono font-bold">
                        {c.importeEstimado > 0 ? (
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            ${c.importeEstimado.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3.5 text-2xs text-slate-600 max-w-xs">
                        <span className="line-clamp-2">{c.impactoNomina}</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                    No se encontraron claves que coincidan con el filtro seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN 2: CONTROL DE BAJAS (DENTRO DEL MISMO DOCUMENTO Y DEBAJO)         */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-rose-200 shadow-sm overflow-hidden">
        
        {/* Encabezado de la Sección de Control de Bajas */}
        <div className="p-5 bg-rose-50/70 border-b border-rose-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs">
              <UserMinus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-rose-950 tracking-tight">
                  Control de Bajas (Clave C-27)
                </h2>
                <span className="bg-rose-200 text-rose-950 text-2xs font-mono font-bold px-2 py-0.5 rounded-full border border-rose-300">
                  {trabajadoresBajas.length} con C-27
                </span>
              </div>
              <p className="text-xs text-rose-800/90 mt-0.5">
                Listado de todos los trabajadores con baja laboral (C-27). 
                <strong> Los campos de fecha y motivo son directamente editables</strong> en esta tabla.
              </p>
            </div>
          </div>

          {/* Botón para asignar nueva baja a un trabajador */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddBajaModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar / Asignar Baja (C-27)</span>
            </button>
          </div>
        </div>

        {/* Modal Desplegable Rápido para Asignar Baja a Cualquier Trabajador */}
        {showAddBajaModal && (
          <div className="p-4 bg-rose-100/60 border-b border-rose-200 animate-in fade-in duration-150 text-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-rose-950 text-xs flex items-center gap-1.5">
                <UserMinus className="w-4 h-4 text-rose-700" />
                <span>Asignar Registro de Baja C-27 a un Trabajador</span>
              </span>
              <button
                onClick={() => setShowAddBajaModal(false)}
                className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1">
                  Seleccionar Trabajador:
                </label>
                <select
                  value={selectedWorkerForBaja}
                  onChange={e => setSelectedWorkerForBaja(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-rose-300 rounded-lg font-medium text-slate-900 cursor-pointer"
                >
                  <option value="">-- Seleccionar de la nómina --</option>
                  {allEmployees.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.nombreApellidos} ({w.numeroExpediente ? `Exp. ${w.numeroExpediente}` : w.id}) - {w.cargo || 'Trabajador'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1">
                  Fecha de la Baja:
                </label>
                <input
                  type="date"
                  value={newBajaFecha}
                  onChange={e => setNewBajaFecha(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-rose-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1">
                  Motivo de la Baja:
                </label>
                <input
                  type="text"
                  list="motivos-sugeridos"
                  value={newBajaMotivo}
                  onChange={e => setNewBajaMotivo(e.target.value)}
                  placeholder="Ej. Renuncia voluntaria, Jubilación..."
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-rose-300 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="w-24">
                  <label className="block text-2xs font-bold text-slate-700 mb-1">
                    Horas C-27:
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={newBajaHoras}
                    onChange={e => setNewBajaHoras(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 text-xs bg-white border border-rose-300 rounded-lg font-mono font-bold text-right"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAssignBaja}
                  className="flex-1 py-1.5 px-3 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg transition-colors cursor-pointer h-8 mt-auto flex items-center justify-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Aplicar Baja</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Datalist con motivos frecuentes de baja */}
        <datalist id="motivos-sugeridos">
          {motivosFrecuentesBaja.map(m => (
            <option key={m} value={m} />
          ))}
        </datalist>

        {/* TABLA OFICIAL DE CONTROL DE BAJAS */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-rose-100/80 text-2xs font-bold uppercase tracking-wider text-rose-950 border-b border-rose-200">
                <th className="py-3 px-4">Nombre del Trabajador</th>
                <th className="py-3 px-4">Expediente (Exp.)</th>
                <th className="py-3 px-4 min-w-[170px]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-rose-700" />
                    <span>Fecha de la Baja</span>
                    <span className="text-3xs text-rose-800 font-normal font-sans">(Editable)</span>
                  </span>
                </th>
                <th className="py-3 px-4 min-w-[240px]">
                  <span className="flex items-center gap-1">
                    <Edit3 className="w-3.5 h-3.5 text-rose-700" />
                    <span>Motivo de la Baja</span>
                    <span className="text-3xs text-rose-800 font-normal font-sans">(Editable)</span>
                  </span>
                </th>
                <th className="py-3 px-3.5 text-center">Centro Costo</th>
                <th className="py-3 px-3.5 text-right font-mono">Horas C-27</th>
                <th className="py-3 px-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-100">
              {trabajadoresBajas.length > 0 ? (
                trabajadoresBajas.map(worker => {
                  const ccName = settings.centrosCosto?.find(c => c.id === worker.centroCostoId)?.codigoCC || 'CC 101';
                  const hoursFromDays = getDeduccionHoursFromDays(worker, 'C-27');
                  const manualBaja = worker.deducciones?.bajaC27 || 0;
                  const totalBajaH = hoursFromDays + manualBaja;

                  return (
                    <tr key={worker.id} className="hover:bg-rose-50/40 transition-colors">
                      {/* 1. Nombre del Trabajador */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{worker.nombreApellidos}</span>
                          <span className="text-3xs font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                            {worker.catOcupacional}
                          </span>
                        </div>
                        <div className="text-3xs text-slate-500 font-normal">{worker.cargo || 'Técnico'}</div>
                      </td>

                      {/* 2. Expediente */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {worker.numeroExpediente || worker.id}
                      </td>

                      {/* 3. Fecha de la Baja (EDITABLE) */}
                      <td className="py-2.5 px-4">
                        <div className="relative">
                          <input
                            type="date"
                            value={worker.fechaBaja || ''}
                            onChange={e => handleFechaBajaChange(worker.id, e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-rose-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-600 focus:border-rose-600 shadow-2xs"
                            title="Haga clic para editar la fecha de la baja laboral"
                          />
                          {!worker.fechaBaja && (
                            <span className="text-3xs text-rose-600 italic block mt-0.5">
                              Sin fecha asignada (indicar fecha)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Motivo de la Baja (EDITABLE) */}
                      <td className="py-2.5 px-4">
                        <div className="relative">
                          <input
                            type="text"
                            list="motivos-sugeridos"
                            value={worker.motivoBaja || ''}
                            onChange={e => handleMotivoBajaChange(worker.id, e.target.value)}
                            placeholder="Escriba o seleccione el motivo oficial de la baja..."
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-rose-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-600 focus:border-rose-600 shadow-2xs font-medium"
                            title="Haga clic para editar el motivo oficial de la baja laboral"
                          />
                          <div className="flex flex-wrap gap-1 mt-1">
                            {['Renuncia', 'Jubilación', 'Traslado'].map(quickTag => (
                              <button
                                key={quickTag}
                                type="button"
                                onClick={() => handleMotivoBajaChange(worker.id, quickTag === 'Renuncia' ? 'Renuncia voluntaria' : quickTag === 'Jubilación' ? 'Jubilación por edad' : 'Traslado a otra entidad')}
                                className="text-4xs px-1.5 py-0.5 rounded bg-rose-100 text-rose-900 hover:bg-rose-200 transition-colors cursor-pointer"
                              >
                                + {quickTag}
                              </button>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Centro de Costo */}
                      <td className="py-3 px-3.5 text-center">
                        <span className="text-3xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {ccName}
                        </span>
                      </td>

                      {/* Horas C-27 */}
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-rose-950">
                        {totalBajaH > 0 ? (
                          <span className="bg-rose-100 text-rose-900 px-2 py-0.5 rounded border border-rose-200">
                            {totalBajaH.toFixed(1)} h
                          </span>
                        ) : (
                          <span className="text-slate-400">0.0 h</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {onOpenWorkerModal && (
                            <button
                              onClick={() => onOpenWorkerModal(worker)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                              title="Editar ficha completa de este trabajador"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveBaja(worker.id)}
                            className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-100 rounded-md transition-colors cursor-pointer"
                            title="Quitar marca de baja (C-27) de este trabajador"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-2">
                      <UserMinus className="w-8 h-8 text-rose-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">
                        No hay trabajadores con baja (C-27) registrados en la prenómina actualmente.
                      </p>
                      <p className="text-2xs text-slate-500">
                        Puede hacer clic en <strong>"Registrar / Asignar Baja (C-27)"</strong> para vincular a cualquier trabajador que cause baja laboral definitiva, o ingresar la clave <strong>'C-27'</strong> en los días del trabajador en la prenómina oficial.
                      </p>
                      <button
                        onClick={() => setShowAddBajaModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-800 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Asignar Baja a un Trabajador Ahora</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pie informativo de la tabla de bajas */}
        <div className="p-3.5 bg-rose-50/50 border-t border-rose-200/80 text-3xs text-rose-900 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-rose-700 shrink-0" />
            <span>
              <strong>Ley 116 de Cuba:</strong> La fecha y motivo de la baja quedan guardados automáticamente en el expediente digital del trabajador y se sincronizan con las deducciones oficiales.
            </span>
          </div>
          <div className="font-mono font-bold text-rose-950 shrink-0">
            Total Bajas Registradas: {trabajadoresBajas.length}
          </div>
        </div>

      </div>

      {/* Datos Informativos para el Operador (Al final, solo uso interno, excluido de impresión) */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm no-print space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Datos Informativos para el Operador (Uso Interno — Excluido de Impresión)
            </h3>
          </div>
          <span className="text-3xs font-mono text-slate-400">Panel de Control General</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700">
            <span className="text-3xs font-bold uppercase text-slate-400 block">Claves Monitoreadas</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-white font-mono">{resumenClaves.length}</span>
              <span className="text-3xs text-slate-400">claves activas</span>
            </div>
          </div>

          <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700">
            <span className="text-3xs font-bold uppercase text-slate-400 block">Total Horas en Claves</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-blue-300 font-mono">{totalHorasClaves.toFixed(1)} h</span>
            </div>
          </div>

          <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700">
            <span className="text-3xs font-bold uppercase text-slate-400 block">Control de Bajas (C-27)</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-rose-300 font-mono">{trabajadoresBajas.length}</span>
              <span className="text-3xs text-rose-200">trabajadores</span>
            </div>
          </div>

          <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700">
            <span className="text-3xs font-bold uppercase text-slate-400 block">Importe Computado</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-black text-emerald-300 font-mono">${totalImporteClaves.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

import React, { useState, useMemo, useEffect } from 'react';
import { 
  EmployeeWithPrenominaCalc, 
  PayrollSettings, 
  HeaderPrenomina,
  MesSalarioPromedio,
  MotivoPromedioLey116,
  ConceptoMotivoPromedio,
  RegistroLiquidacionPromedio
} from '../types/payroll';
import {
  Scale,
  Calculator,
  Calendar,
  Printer,
  FileText,
  UserCheck,
  Building2,
  Sparkles,
  Info,
  CheckCircle2,
  RotateCcw,
  Plus,
  Trash2,
  Clock,
  Shield,
  Search,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Save,
  Check,
  Sun,
  LayoutGrid,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { exportSalarioPromedioToExcel, parseSalarioPromedioFromExcel } from '../utils/excelHelper';
import { ExcelActions } from './ExcelActions';

interface SalarioPromedioViewProps {
  employees: EmployeeWithPrenominaCalc[];
  settings: PayrollSettings;
  headerPrenomina: HeaderPrenomina;
  selectedCCId?: string;
  periodoNombre: string;
}

// Catálogo legal completo de motivos según Ley 116 y Decreto 326 (incluye Días Feriados no trabajados)
const MOTIVOS_LEY_116: ConceptoMotivoPromedio[] = [
  {
    id: 'vacaciones',
    nombre: 'Vacaciones Anuales Pagadas',
    articuloLey: 'Artículos 101 al 104 de la Ley No. 116',
    porcentajeDefault: 100,
    descripcion: 'Descanso anual retribuido a razón de un mes por cada once meses de labor efectiva o proporción correspondiente.',
    unidadDefault: 'dias'
  },
  {
    id: 'dias_feriados',
    nombre: 'Días Feriados y de Conmemoración Nacional no laborados',
    articuloLey: 'Artículos 94 al 97 de la Ley No. 116',
    porcentajeDefault: 100,
    descripcion: 'Pago del salario promedio por los días feriados o de conmemoración nacional (1ro de Enero, 1ro de Mayo, 25, 26 y 27 de Julio, 10 de Octubre, 25 y 31 de Diciembre) que coinciden con la jornada habitual y no se laboran.',
    unidadDefault: 'dias'
  },
  {
    id: 'movilizacion_defensa',
    nombre: 'Movilización Militar / Defensa Nacional (Bastión, MTT)',
    articuloLey: 'Artículo 117 de la Ley No. 116',
    porcentajeDefault: 100,
    descripcion: 'Llamamiento al servicio militar activo de la reserva, ejercicios de la defensa, DAAFAR o Milicias de Tropas Territoriales.',
    unidadDefault: 'dias'
  },
  {
    id: 'donacion_sangre',
    nombre: 'Donación Voluntaria de Sangre',
    articuloLey: 'Decreto No. 326 y Disposiciones del MINSAP / MTSS',
    porcentajeDefault: 100,
    descripcion: 'Garantía del día de descanso retribuido al trabajador donante con presentación de constancia del Banco de Sangre.',
    unidadDefault: 'dias'
  },
  {
    id: 'citacion_judicial',
    nombre: 'Citación Judicial / Órgano de Justicia Laboral (OJL)',
    articuloLey: 'Artículo 118 de la Ley No. 116',
    porcentajeDefault: 100,
    descripcion: 'Comparecencia como testigo, demandante, perito judicial o cumplimiento de funciones como miembro del OJL.',
    unidadDefault: 'dias'
  },
  {
    id: 'capacitacion_estatal',
    nombre: 'Capacitación y Superación Técnica de Interés Estatal',
    articuloLey: 'Artículos 39 al 42 de la Ley No. 116',
    porcentajeDefault: 100,
    descripcion: 'Cursos, entrenamientos y recalificaciones de interés de la entidad con dispensa total o parcial de labor autorizada.',
    unidadDefault: 'dias'
  },
  {
    id: 'interrupcion_30dias',
    nombre: 'Interrupción Laboral (Primeros 30 días continuos)',
    articuloLey: 'Artículo 75 de la Ley No. 116 y Res. 138/2021 MTSS',
    porcentajeDefault: 100,
    descripcion: 'Paralización de actividades no imputable al trabajador sin posibilidad de reubicación, abono del 100% del salario promedio básico.',
    unidadDefault: 'dias'
  },
  {
    id: 'interrupcion_mayor30',
    nombre: 'Interrupción Laboral (A partir del día 31 continuo)',
    articuloLey: 'Artículo 77 de la Ley No. 116',
    porcentajeDefault: 60,
    descripcion: 'Prolongación de la paralización sin reubicación más allá de 30 días hábiles continuos, garantía económica al 60%.',
    unidadDefault: 'dias'
  },
  {
    id: 'reubicacion_temporal',
    nombre: 'Reubicación Temporal por Salud / Peritaje Médico',
    articuloLey: 'Artículo 53 de la Ley No. 116',
    porcentajeDefault: 100,
    descripcion: 'Puesto transitorio de menor remuneración mientras se evalúa peritaje o restablecimiento médico temporal.',
    unidadDefault: 'dias'
  },
  {
    id: 'licencia_retribuida',
    nombre: 'Licencia Retribuida Especial (Duelo de 1er Grado, etc.)',
    articuloLey: 'Código de Trabajo y Convenio Colectivo de Trabajo',
    porcentajeDefault: 100,
    descripcion: 'Licencias con sueldo autorizadas por la administración o legislación especial (fallecimiento de padres/hijos/cónyuge).',
    unidadDefault: 'dias'
  },
  {
    id: 'comision_servicio',
    nombre: 'Comisión de Servicio Oficial / Misión Técnica',
    articuloLey: 'Artículo 116 de la Ley No. 116',
    porcentajeDefault: 100,
    descripcion: 'Traslado temporal ordenado por la entidad a otra localidad para cumplir tareas de interés estatal.',
    unidadDefault: 'dias'
  }
];

const STORAGE_KEY_LIQUIDACIONES = 'salario_promedio_liquidaciones_v2';
const STORAGE_KEY_HISTORICOS_TRABAJADORES = 'salario_promedio_historico_trabajadores_v2';

export const SalarioPromedioView: React.FC<SalarioPromedioViewProps> = ({
  employees,
  settings,
  headerPrenomina,
  selectedCCId,
  periodoNombre
}) => {
  // Trabajador seleccionado para el cálculo
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(employees[0]?.id || '');
  const [filtroTexto, setFiltroTexto] = useState('');
  const [mostrarGuiaLegal, setMostrarGuiaLegal] = useState(false);

  // Opciones de configuración de la vista y del reporte imprimible
  // 1. Modalidad de cálculo: por Días o por Horas
  const [modalidadCalculo, setModalidadCalculo] = useState<'dias' | 'horas'>('dias');

  // 2. Modo de entrada en la tabla: Detallada (conceptos) o Directa (devengado total)
  const [modoEntradaDirecta, setModoEntradaDirecta] = useState<boolean>(false);

  // 3. Optimización de espacio en informe impreso: mostrar solo el devengado total (compacto)
  const [printSoloDevengado, setPrintSoloDevengado] = useState<boolean>(true);

  // Indicador visual de guardado
  const [mensajeGuardado, setMensajeGuardado] = useState<string | null>(null);

  // Trabajador activo
  const worker = useMemo(() => {
    return employees.find(e => e.id === selectedWorkerId) || employees[0];
  }, [employees, selectedWorkerId]);

  // Nombres de los últimos 6 meses respecto a la fecha actual o período
  const nombresMesesReferencia = useMemo(() => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const hoy = new Date();
    const mesActualIdx = hoy.getMonth();
    const anioActual = hoy.getFullYear();

    const resultado: string[] = [];
    for (let i = 6; i >= 1; i--) {
      let mIdx = mesActualIdx - i;
      let anio = anioActual;
      if (mIdx < 0) {
        mIdx += 12;
        anio -= 1;
      }
      resultado.push(`${meses[mIdx]} ${anio}`);
    }
    return resultado;
  }, []);

  // Función para obtener los datos guardados de un trabajador en localStorage
  const obtenerHistoricoGuardado = (workerId: string): MesSalarioPromedio[] | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HISTORICOS_TRABAJADORES);
      if (raw) {
        const mapa = JSON.parse(raw);
        if (mapa && mapa[workerId] && Array.isArray(mapa[workerId]) && mapa[workerId].length === 6) {
          return mapa[workerId];
        }
      }
    } catch (e) {
      console.warn('Error leyendo histórico de trabajador', e);
    }
    return null;
  };

  // Función para guardar los datos de 6 meses del trabajador actual
  const guardarHistoricoEnStorage = (workerId: string, datos: MesSalarioPromedio[]) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HISTORICOS_TRABAJADORES);
      const mapa = raw ? JSON.parse(raw) : {};
      mapa[workerId] = datos;
      localStorage.setItem(STORAGE_KEY_HISTORICOS_TRABAJADORES, JSON.stringify(mapa));
      setMensajeGuardado('✓ Datos de los 6 meses guardados en el expediente');
      setTimeout(() => setMensajeGuardado(null), 3000);
    } catch (e) {
      console.warn('Error guardando histórico de trabajador', e);
    }
  };

  // Inicializar estado para la tabla de 6 meses
  const [mesesData, setMesesData] = useState<MesSalarioPromedio[]>(() => {
    if (employees[0]?.id) {
      const guardado = obtenerHistoricoGuardado(employees[0].id);
      if (guardado) return guardado;
    }
    return Array.from({ length: 6 }, (_, idx) => ({
      id: `m-${idx + 1}`,
      mesNumero: idx + 1,
      mesNombre: `Mes ${idx + 1}`,
      salarioEscala: 3410,
      antiguedadYGrado: 0,
      nocturnidad: 0,
      horasExtras: 0,
      estimulacionResultados: 0,
      otrosDevengosComputables: 0,
      subsidioC20Excluido: 0,
      diasLaborados: 24,
      horasLaboradas: 190.6
    }));
  });

  // Autocompletar con salario vigente cuando el usuario lo pida
  const autocompletarConSalarioVigente = () => {
    if (!worker) return;

    const salarioEscala = worker.salarioBasicoEscala || 3410;
    const antiguedad = worker.montoAntiguedadCalculado || worker.montoAntiguedadManual || 0;
    const grado = worker.montoGradoAcademicoCalculado || worker.montoGradoAcademicoManual || 0;
    const nocturnidadTotal = worker.nocturnidad?.totalNocturnidad || 0;
    const horasExtrasImporte = worker.trabajoExtra?.importe || 0;
    const horasFondo = worker.fondoTiempoIndividual || settings.divisorHorasMes || 190.6;
    const diasEfectivos = Math.min(24, Math.max(1, Math.round(worker.tiempoRealLaborado / 8) || 24));

    const nuevosMeses = nombresMesesReferencia.map((nombreMes, idx) => ({
      id: `m-${idx + 1}`,
      mesNumero: idx + 1,
      mesNombre: nombreMes,
      salarioEscala: Math.round(salarioEscala * 100) / 100,
      antiguedadYGrado: Math.round((antiguedad + grado) * 100) / 100,
      nocturnidad: Math.round((nocturnidadTotal * (idx % 2 === 0 ? 1 : 0.8)) * 100) / 100,
      horasExtras: Math.round((horasExtrasImporte * (idx === 2 || idx === 4 ? 1 : 0)) * 100) / 100,
      estimulacionResultados: 0,
      otrosDevengosComputables: 0,
      subsidioC20Excluido: 0,
      diasLaborados: diasEfectivos,
      horasLaboradas: horasFondo
    }));

    setMesesData(nuevosMeses);
    guardarHistoricoEnStorage(worker.id, nuevosMeses);
  };

  // Al cambiar de trabajador: cargar de localStorage si existe, o autocompletar
  useEffect(() => {
    if (!worker) return;
    const historicoGuardado = obtenerHistoricoGuardado(worker.id);
    if (historicoGuardado) {
      setMesesData(historicoGuardado);
      setMensajeGuardado('✓ Histórico recuperado del expediente local');
      setTimeout(() => setMensajeGuardado(null), 2500);
    } else {
      autocompletarConSalarioVigente();
    }
  }, [worker?.id]);

  // Manejar cambio en un campo de un mes y persistir automáticamente
  const handleMesChange = (id: string, field: keyof MesSalarioPromedio, val: number | string) => {
    setMesesData(prev => {
      const updated = prev.map(m => {
        if (m.id !== id) return m;
        return { ...m, [field]: val };
      });
      if (worker?.id) {
        guardarHistoricoEnStorage(worker.id, updated);
      }
      return updated;
    });
  };

  // Manejar cambio directo del devengado total (para cuando el operador no quiera detallar conceptos)
  const handleDevengadoDirectoChange = (id: string, nuevoDevengado: number) => {
    setMesesData(prev => {
      const updated = prev.map(m => {
        if (m.id !== id) return m;
        return {
          ...m,
          salarioEscala: nuevoDevengado,
          antiguedadYGrado: 0,
          nocturnidad: 0,
          horasExtras: 0,
          estimulacionResultados: 0,
          otrosDevengosComputables: 0
        };
      });
      if (worker?.id) {
        guardarHistoricoEnStorage(worker.id, updated);
      }
      return updated;
    });
  };

  // Cálculo de totales de los 6 meses
  const totalesCalculados = useMemo(() => {
    let totalDevengadoComputable = 0;
    let totalDiasLaborados = 0;
    let totalHorasLaboradas = 0;
    let totalSubsidioC20Excluido = 0;

    const desgloseMeses = mesesData.map(m => {
      // Ingresos computables según Ley 116 (excluyendo subsidios de seguridad social)
      const devengadoMes = 
        (Number(m.salarioEscala) || 0) +
        (Number(m.antiguedadYGrado) || 0) +
        (Number(m.nocturnidad) || 0) +
        (Number(m.horasExtras) || 0) +
        (Number(m.estimulacionResultados) || 0) +
        (Number(m.otrosDevengosComputables) || 0);

      const dias = Number(m.diasLaborados) || 0;
      const horas = Number(m.horasLaboradas) || 0;
      const c20 = Number(m.subsidioC20Excluido) || 0;

      totalDevengadoComputable += devengadoMes;
      totalDiasLaborados += dias;
      totalHorasLaboradas += horas;
      totalSubsidioC20Excluido += c20;

      const promedioDiarioMes = dias > 0 ? Math.round((devengadoMes / dias) * 100) / 100 : 0;

      return {
        ...m,
        devengadoMes,
        promedioDiarioMes
      };
    });

    const salarioPromedioDiario = totalDiasLaborados > 0 
      ? Math.round((totalDevengadoComputable / totalDiasLaborados) * 100) / 100 
      : 0;

    const tarifaHorariaPromedio = totalHorasLaboradas > 0 
      ? Math.round((totalDevengadoComputable / totalHorasLaboradas) * 100) / 100 
      : (salarioPromedioDiario > 0 ? Math.round((salarioPromedioDiario / 8) * 100) / 100 : 0);

    const promedioMensual = Math.round((salarioPromedioDiario * 24) * 100) / 100;

    return {
      desgloseMeses,
      totalDevengadoComputable: Math.round(totalDevengadoComputable * 100) / 100,
      totalDiasLaborados,
      totalHorasLaboradas: Math.round(totalHorasLaboradas * 10) / 10,
      totalSubsidioC20Excluido: Math.round(totalSubsidioC20Excluido * 100) / 100,
      salarioPromedioDiario,
      tarifaHorariaPromedio,
      promedioMensual
    };
  }, [mesesData]);

  // Formulario de liquidación del evento
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<MotivoPromedioLey116>('vacaciones');
  const [diasALiquidar, setDiasALiquidar] = useState<number>(15);
  const [horasALiquidar, setHorasALiquidar] = useState<number>(120);
  const [porcentajeManual, setPorcentajeManual] = useState<number>(100);
  const [observaciones, setObservaciones] = useState<string>('');

  // Sincronizar días y horas cuando el usuario cambia de modo
  const cambiarModalidad = (nuevaMod: 'dias' | 'horas') => {
    setModalidadCalculo(nuevaMod);
    if (nuevaMod === 'horas' && diasALiquidar > 0) {
      setHorasALiquidar(Math.round(diasALiquidar * 8 * 10) / 10);
    } else if (nuevaMod === 'dias' && horasALiquidar > 0) {
      setDiasALiquidar(Math.round((horasALiquidar / 8) * 10) / 10);
    }
  };

  // Actualizar porcentaje y valores default al cambiar de motivo
  const handleMotivoChange = (mId: MotivoPromedioLey116) => {
    setMotivoSeleccionado(mId);
    const motivoDef = MOTIVOS_LEY_116.find(m => m.id === mId);
    if (motivoDef) {
      setPorcentajeManual(motivoDef.porcentajeDefault);
      if (mId === 'dias_feriados') {
        setDiasALiquidar(1);
        setHorasALiquidar(8);
        setObservaciones('Feriado nacional / Día de conmemoración oficial no laborado');
      } else if (mId === 'donacion_sangre') {
        setDiasALiquidar(1);
        setHorasALiquidar(8);
        setObservaciones('Acreditada donación en Banco de Sangre Municipal');
      } else if (mId === 'vacaciones') {
        setDiasALiquidar(15);
        setHorasALiquidar(120);
        setObservaciones('Programación de vacaciones período ordinario (Clave C-25)');
      } else if (mId === 'interrupcion_30dias') {
        setDiasALiquidar(5);
        setHorasALiquidar(40);
        setObservaciones('Afectación por interrupción de energía / materia prima');
      } else if (mId === 'movilizacion_defensa') {
        setDiasALiquidar(3);
        setHorasALiquidar(24);
        setObservaciones('Orden de movilización para ejercicios de la defensa');
      } else if (mId === 'citacion_judicial') {
        setDiasALiquidar(1);
        setHorasALiquidar(8);
        setObservaciones('Comparecencia oficial en calidad de testigo');
      }
    }
  };

  const motivoInfo = useMemo(() => {
    return MOTIVOS_LEY_116.find(m => m.id === motivoSeleccionado) || MOTIVOS_LEY_116[0];
  }, [motivoSeleccionado]);

  // Cálculo de la liquidación en tiempo real (por Días o por Horas según elija el operador)
  const liquidacionActual = useMemo(() => {
    const factorPorcentaje = (porcentajeManual || 100) / 100;
    let montoBruto = 0;

    if (modalidadCalculo === 'dias') {
      montoBruto = Math.round((diasALiquidar * totalesCalculados.salarioPromedioDiario * factorPorcentaje) * 100) / 100;
    } else {
      montoBruto = Math.round((horasALiquidar * totalesCalculados.tarifaHorariaPromedio * factorPorcentaje) * 100) / 100;
    }
    
    // Contribución Especial a la Seguridad Social (CESS) 5% para el sector estatal
    const tasaCESS = 0.05;
    const deduccionCESS = Math.round((montoBruto * tasaCESS) * 100) / 100;
    const montoNeto = Math.round((montoBruto - deduccionCESS) * 100) / 100;

    return {
      modalidad: modalidadCalculo,
      cantidadUnidades: modalidadCalculo === 'dias' ? diasALiquidar : horasALiquidar,
      unidadTexto: modalidadCalculo === 'dias' ? 'días' : 'horas',
      tarifaAplicada: modalidadCalculo === 'dias' ? totalesCalculados.salarioPromedioDiario : totalesCalculados.tarifaHorariaPromedio,
      tarifaTexto: modalidadCalculo === 'dias' ? 'CUP/día' : 'CUP/hora',
      diasEquivalentes: modalidadCalculo === 'dias' ? diasALiquidar : Math.round((horasALiquidar / 8) * 10) / 10,
      horasEquivalentes: modalidadCalculo === 'horas' ? horasALiquidar : Math.round(diasALiquidar * 8 * 10) / 10,
      porcentaje: porcentajeManual,
      montoBruto,
      deduccionCESS,
      montoNeto
    };
  }, [modalidadCalculo, diasALiquidar, horasALiquidar, porcentajeManual, totalesCalculados]);

  // Historial de liquidaciones registradas en el período
  const [historialLiquidaciones, setHistorialLiquidaciones] = useState<RegistroLiquidacionPromedio[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LIQUIDACIONES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error loading liquidaciones', e);
    }
    return [];
  });

  // Guardar liquidación actual en el historial
  const handleGuardarLiquidacion = () => {
    if (!worker) return;
    const tieneUnidades = modalidadCalculo === 'dias' ? diasALiquidar > 0 : horasALiquidar > 0;
    if (!tieneUnidades) return;

    const nuevoRegistro: RegistroLiquidacionPromedio = {
      id: `liq-${Date.now()}`,
      fechaRegistro: new Date().toLocaleDateString('es-CU', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      trabajadorId: worker.id,
      nombreApellidos: worker.nombreApellidos,
      numeroExpediente: worker.numeroExpediente || worker.id,
      cargo: worker.cargo || 'Especialista',
      centroCostoId: worker.centroCostoId || headerPrenomina.direccionCC || 'CC 101',
      centroCostoNombre: headerPrenomina.direccionCC || 'CC 101',
      motivo: motivoSeleccionado,
      motivoNombre: motivoInfo.nombre,
      articuloLey: motivoInfo.articuloLey,
      modalidadCalculo,
      diasLiquidar: liquidacionActual.diasEquivalentes,
      horasLiquidar: liquidacionActual.horasEquivalentes,
      porcentajePago: porcentajeManual,
      salarioPromedioDiario: totalesCalculados.salarioPromedioDiario,
      tarifaPromedioHora: totalesCalculados.tarifaHorariaPromedio,
      montoBruto: liquidacionActual.montoBruto,
      deduccionCESS: liquidacionActual.deduccionCESS,
      montoNeto: liquidacionActual.montoNeto,
      observaciones
    };

    const updated = [nuevoRegistro, ...historialLiquidaciones];
    setHistorialLiquidaciones(updated);
    try {
      localStorage.setItem(STORAGE_KEY_LIQUIDACIONES, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleEliminarRegistro = (id: string) => {
    const updated = historialLiquidaciones.filter(l => l.id !== id);
    setHistorialLiquidaciones(updated);
    try {
      localStorage.setItem(STORAGE_KEY_LIQUIDACIONES, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleLimpiarHistorial = () => {
    if (window.confirm('¿Desea limpiar todo el historial de liquidaciones registradas?')) {
      setHistorialLiquidaciones([]);
      try {
        localStorage.removeItem(STORAGE_KEY_LIQUIDACIONES);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  // Filtrado de trabajadores
  const filteredWorkers = useMemo(() => {
    if (!filtroTexto.trim()) return employees;
    const q = filtroTexto.toLowerCase();
    return employees.filter(e => 
      e.nombreApellidos.toLowerCase().includes(q) ||
      (e.numeroExpediente && e.numeroExpediente.toLowerCase().includes(q)) ||
      (e.cargo && e.cargo.toLowerCase().includes(q))
    );
  }, [employees, filtroTexto]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Portada Superior de la Carpeta de Salario Promedio */}
      <div className="bg-white rounded-2xl border border-indigo-900/15 shadow-sm p-5 sm:p-6 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-700 text-white flex items-center justify-center shadow-md shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-3xs font-black uppercase tracking-wider bg-indigo-100 text-indigo-900 border border-indigo-200">
                  Código de Trabajo de Cuba · Ley No. 116 / Dec. 326
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Base 6 Meses · Días Efectivos y Horas
                </span>
                {mensajeGuardado && (
                  <span className="px-2 py-0.5 rounded text-3xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-in fade-in">
                    {mensajeGuardado}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
                <span>Determinación del Salario Promedio</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  Sector Estatal
                </span>
              </h1>
              <p className="text-xs text-slate-600 mt-1 max-w-3xl">
                Cálculo legal por <strong>Días</strong> o por <strong>Horas</strong> para vacaciones, días feriados no laborados, movilizaciones militares, donaciones de sangre, comparecencias judiciales e interrupciones laborales.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Selector de modo de impresión */}
            <button
              onClick={() => setPrintSoloDevengado(!printSoloDevengado)}
              title="Alternar entre formato compacto (solo devengado total para ahorrar espacio en 1 página) o formato extendido"
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                printSoloDevengado
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-xs'
                  : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              {printSoloDevengado ? <Minimize2 className="w-3.5 h-3.5 text-emerald-700" /> : <Maximize2 className="w-3.5 h-3.5 text-slate-500" />}
              <span>{printSoloDevengado ? 'Impresión: Solo Devengado (1 pág.)' : 'Impresión: Detallada'}</span>
            </button>

            <ExcelActions
              label="Excel (Historial & Liquidación)"
              exportTitle="Exportar acumulados de 12 meses y liquidaciones a Excel (.xlsx)"
              importTitle="Importar devengados, horas y días de los 12 meses desde Excel (.xlsx / .csv)"
              onExport={() => {
                exportSalarioPromedioToExcel(
                  worker?.nombreApellidos || 'Trabajador',
                  worker?.numeroExpediente || '',
                  totalesCalculados.desgloseMeses,
                  historialLiquidaciones
                );
              }}
              onImport={(rows) => {
                const parsed = parseSalarioPromedioFromExcel(rows);
                if (parsed.length > 0 && worker?.id) {
                  const newMeses = mesesData.map(m => {
                    const match = parsed.find(p => p.mesNumero === m.mesNumero);
                    if (match) {
                      return {
                        ...m,
                        salarioEscala: match.totalDevengado,
                        antiguedadYGrado: 0,
                        nocturnidad: 0,
                        horasExtras: 0,
                        estimulacionResultados: 0,
                        otrosDevengosComputables: 0,
                        diasLaborados: match.diasLaborados || m.diasLaborados,
                        horasLaboradas: match.horasLaboradas || m.horasLaboradas,
                        mesNombre: match.mesNombre || m.mesNombre
                      };
                    }
                    return m;
                  });
                  setMesesData(newMeses);
                  guardarHistoricoEnStorage(worker.id, newMeses);
                  alert(`Se importaron y actualizaron los datos de ${parsed.length} meses exitosamente desde Excel.`);
                } else {
                  alert('No se encontraron registros de meses válidos en el archivo Excel.');
                }
              }}
            />

            <button
              onClick={() => setMostrarGuiaLegal(!mostrarGuiaLegal)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
            >
              <Info className="w-4 h-4 text-indigo-700" />
              <span>{mostrarGuiaLegal ? 'Ocultar Fundamento' : 'Fundamento Legal Ley 116'}</span>
              {mostrarGuiaLegal ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Dictamen Oficial</span>
            </button>
          </div>
        </div>

        {/* Acordeón de Fundamento Legal */}
        {mostrarGuiaLegal && (
          <div className="mt-5 pt-5 border-t border-slate-100 bg-slate-50/70 p-4 rounded-xl text-xs text-slate-700 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Normativa Salarial Vigente en la República de Cuba</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-2xs leading-relaxed">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="font-bold text-indigo-900 block mb-1">Período de Referencia (6 Meses)</span>
                Decreto No. 326 (Reglamento Ley 116 Art. 78): Se toman los salarios devengados en los <strong>seis meses naturales</strong> anteriores a aquel en que se produce el hecho generador del pago.
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="font-bold text-indigo-900 block mb-1">Días Feriados No Trabajados</span>
                Artículos 94 al 97 de la Ley No. 116: Los feriados y de conmemoración nacional (1ro de mayo, 26 de julio, etc.) que coincidan con la jornada habitual y no se trabajen se pagan <strong>al promedio</strong> al 100%.
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="font-bold text-indigo-900 block mb-1">Cálculo por Días o por Horas</span>
                Permite liquidar tanto por jornada completa (Salario Promedio Diario) como por turnos o fracciones de tiempo (Tarifa Horaria Promedio) según convenga a la naturaleza del puesto.
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="font-bold text-amber-900 block mb-1">Exclusión de Subsidios C-20</span>
                Los subsidios por enfermedad común o maternidad <strong>NO constituyen salario computable</strong>. No se suman al devengado ni sus días cuentan como efectivamente laborados.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Barra de Selección y Datos del Trabajador */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 no-print">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          
          {/* Selector de Trabajador */}
          <div className="lg:col-span-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-2xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Trabajador a Liquidar</span>
              </label>
              <span className="text-3xs text-emerald-700 font-mono font-bold">
                ✓ Memoria persistente activa
              </span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <select
                  value={selectedWorkerId}
                  onChange={e => setSelectedWorkerId(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {filteredWorkers.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.numeroExpediente ? `[Exp. ${w.numeroExpediente}] ` : ''}{w.nombreApellidos} — {w.cargo || 'Especialista'} ({formatCurrency(w.salarioBasicoEscala || 0, settings)})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={autocompletarConSalarioVigente}
                title="Rellenar los 6 meses con la escala, antigüedad y nocturnidad del trabajador"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Recalcular Salario Base</span>
              </button>
            </div>
          </div>

          {/* Ficha Resumen del Trabajador Seleccionado */}
          {worker && (
            <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-3xs uppercase text-slate-500 font-bold block">Expediente / CI</span>
                <span className="font-mono font-bold text-slate-900">{worker.numeroExpediente || worker.id.slice(0, 8)}</span>
              </div>
              <div>
                <span className="text-3xs uppercase text-slate-500 font-bold block">Escala Básica</span>
                <span className="font-mono font-bold text-indigo-700">{formatCurrency(worker.salarioBasicoEscala || 0, settings)}</span>
              </div>
              <div>
                <span className="text-3xs uppercase text-slate-500 font-bold block">Plus Antigüedad</span>
                <span className="font-mono font-bold text-slate-800">
                  {worker.aniosAntiguedad || 0} años ({formatCurrency(worker.montoAntiguedadCalculado || worker.montoAntiguedadManual || 0, settings)})
                </span>
              </div>
              <div>
                <span className="text-3xs uppercase text-slate-500 font-bold block">Grado Científico</span>
                <span className="font-bold text-slate-800 capitalize truncate block">
                  {worker.gradoAcademico && worker.gradoAcademico !== 'ninguno' 
                    ? `${worker.gradoAcademico} (+${formatCurrency(worker.montoGradoAcademicoCalculado || worker.montoGradoAcademicoManual || 0, settings)})`
                    : 'Sin grado'}
                </span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Grid de 2 Columnas: Tabla Histórica de 6 Meses + Panel de Liquidación */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start no-print">
        
        {/* Columna Izquierda: Tabla Detallada de los 6 Meses */}
        <div className="xl:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                  1. Registro Histórico de Salarios (Últimos 6 Meses)
                </h2>
              </div>
              <p className="text-2xs text-slate-500 mt-0.5">
                Los datos que modifique quedan <strong>guardados permanentemente</strong> en el expediente de este trabajador.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Selector de modo de captura rápida: por conceptos o directo devengado total */}
              <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100 text-3xs font-bold">
                <button
                  type="button"
                  onClick={() => setModoEntradaDirecta(false)}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    !modoEntradaDirecta ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Desglose de Conceptos
                </button>
                <button
                  type="button"
                  onClick={() => setModoEntradaDirecta(true)}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    modoEntradaDirecta ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Directo: Devengado Total
                </button>
              </div>

              <button
                onClick={() => {
                  if (worker?.id) {
                    guardarHistoricoEnStorage(worker.id, mesesData);
                  }
                }}
                className="inline-flex items-center gap-1 text-2xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              >
                <Save className="w-3 h-3 text-emerald-700" />
                <span>Guardar Ficha</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-3xs uppercase font-black tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3">Mes Referencia</th>
                  {!modoEntradaDirecta ? (
                    <>
                      <th className="py-2.5 px-2 text-right">Salario Escala</th>
                      <th className="py-2.5 px-2 text-right">Antig. + Títulos</th>
                      <th className="py-2.5 px-2 text-right">Nocturnidad</th>
                      <th className="py-2.5 px-2 text-right">Sobret. / Extras</th>
                      <th className="py-2.5 px-2 text-right">Estimulación</th>
                      <th className="py-2.5 px-2 text-right bg-amber-50/70 text-amber-900 border-x border-amber-200/60" title="Subsidios C-20 de Seguridad Social NO computan para promedio">
                        C-20 (No Computa)
                      </th>
                      <th className="py-2.5 px-2 text-right bg-indigo-50/60 text-indigo-900">Devengado Computable</th>
                    </>
                  ) : (
                    <>
                      <th className="py-2.5 px-3 text-right bg-indigo-50/80 text-indigo-950 font-bold text-xs">
                        Devengado Total Computable (CUP)
                      </th>
                      <th className="py-2.5 px-2 text-right bg-amber-50/70 text-amber-900 border-x border-amber-200/60" title="Subsidios C-20 de Seguridad Social NO computan para promedio">
                        C-20 (No Computa)
                      </th>
                    </>
                  )}
                  <th className="py-2.5 px-2 text-center bg-slate-50 font-bold">Días Laborados</th>
                  <th className="py-2.5 px-2 text-center bg-slate-50 font-bold">Horas Laboradas</th>
                  <th className="py-2.5 px-2 text-right text-slate-500 font-mono">Prom. Diario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {totalesCalculados.desgloseMeses.map((mes, idx) => (
                  <tr key={mes.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Nombre del Mes */}
                    <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-3xs font-mono font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={mes.mesNombre}
                          onChange={e => handleMesChange(mes.id, 'mesNombre', e.target.value)}
                          className="bg-transparent border-b border-dashed border-slate-300 hover:border-slate-500 focus:border-indigo-600 focus:outline-none text-xs font-bold text-slate-800 w-28"
                        />
                      </div>
                    </td>

                    {!modoEntradaDirecta ? (
                      <>
                        {/* Salario Escala */}
                        <td className="py-1.5 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={mes.salarioEscala || ''}
                            onChange={e => handleMesChange(mes.id, 'salarioEscala', parseFloat(e.target.value) || 0)}
                            className="w-20 text-right font-mono bg-white border border-slate-200 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </td>

                        {/* Antigüedad + Grado */}
                        <td className="py-1.5 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={mes.antiguedadYGrado || ''}
                            onChange={e => handleMesChange(mes.id, 'antiguedadYGrado', parseFloat(e.target.value) || 0)}
                            className="w-18 text-right font-mono bg-white border border-slate-200 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </td>

                        {/* Nocturnidad */}
                        <td className="py-1.5 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="5"
                            value={mes.nocturnidad || ''}
                            onChange={e => handleMesChange(mes.id, 'nocturnidad', parseFloat(e.target.value) || 0)}
                            className="w-16 text-right font-mono bg-white border border-slate-200 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </td>

                        {/* Horas Extras */}
                        <td className="py-1.5 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="5"
                            value={mes.horasExtras || ''}
                            onChange={e => handleMesChange(mes.id, 'horasExtras', parseFloat(e.target.value) || 0)}
                            className="w-16 text-right font-mono bg-white border border-slate-200 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </td>

                        {/* Estimulación */}
                        <td className="py-1.5 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={mes.estimulacionResultados || ''}
                            onChange={e => handleMesChange(mes.id, 'estimulacionResultados', parseFloat(e.target.value) || 0)}
                            className="w-16 text-right font-mono bg-white border border-slate-200 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </td>

                        {/* Subsidio C-20 (Excluido de la base) */}
                        <td className="py-1.5 px-2 text-right bg-amber-50/40 border-x border-amber-200/50">
                          <input
                            type="number"
                            min="0"
                            step="10"
                            placeholder="0.00"
                            value={mes.subsidioC20Excluido || ''}
                            onChange={e => handleMesChange(mes.id, 'subsidioC20Excluido', parseFloat(e.target.value) || 0)}
                            className="w-16 text-right font-mono text-amber-900 bg-amber-50/60 border border-amber-200 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                            title="Subsidio médico C-20: informativo, excluido por ley del salario promedio"
                          />
                        </td>

                        {/* Total Computable del Mes */}
                        <td className="py-1.5 px-2 text-right font-mono font-bold text-indigo-900 bg-indigo-50/40 whitespace-nowrap">
                          {formatCurrency(mes.devengadoMes, settings)}
                        </td>
                      </>
                    ) : (
                      <>
                        {/* Entrada Directa del Devengado Total */}
                        <td className="py-1.5 px-3 text-right bg-indigo-50/30">
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={mes.salarioEscala || ''}
                            onChange={e => handleDevengadoDirectoChange(mes.id, parseFloat(e.target.value) || 0)}
                            placeholder="Devengado Total CUP"
                            className="w-36 text-right font-mono font-bold text-indigo-950 bg-white border-2 border-indigo-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </td>

                        {/* Subsidio C-20 */}
                        <td className="py-1.5 px-2 text-right bg-amber-50/40 border-x border-amber-200/50">
                          <input
                            type="number"
                            min="0"
                            step="10"
                            placeholder="0.00"
                            value={mes.subsidioC20Excluido || ''}
                            onChange={e => handleMesChange(mes.id, 'subsidioC20Excluido', parseFloat(e.target.value) || 0)}
                            className="w-16 text-right font-mono text-amber-900 bg-amber-50/60 border border-amber-200 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                            title="Subsidio médico C-20: informativo, excluido por ley"
                          />
                        </td>
                      </>
                    )}

                    {/* Días Efectivamente Laborados */}
                    <td className="py-1.5 px-2 text-center bg-slate-50/50">
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={mes.diasLaborados || ''}
                        onChange={e => handleMesChange(mes.id, 'diasLaborados', parseInt(e.target.value) || 0)}
                        className="w-12 text-center font-mono font-bold bg-white border border-slate-200 rounded px-1 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </td>

                    {/* Horas Laboradas */}
                    <td className="py-1.5 px-2 text-center bg-slate-50/50">
                      <input
                        type="number"
                        min="1"
                        max="240"
                        step="0.5"
                        value={mes.horasLaboradas || ''}
                        onChange={e => handleMesChange(mes.id, 'horasLaboradas', parseFloat(e.target.value) || 0)}
                        className="w-14 text-center font-mono bg-white border border-slate-200 rounded px-1 py-1 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      />
                    </td>

                    {/* Promedio diario de ese mes específico */}
                    <td className="py-1.5 px-2 text-right font-mono text-3xs text-slate-500">
                      {formatCurrency(mes.promedioDiarioMes, settings)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td className="py-3 px-3 uppercase text-2xs tracking-wider">
                    Totales (6 Meses):
                  </td>
                  {!modoEntradaDirecta ? (
                    <>
                      <td colSpan={5} className="py-3 px-2 text-right text-slate-500 text-3xs font-normal">
                        Base Salarial Acumulada
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-amber-900 bg-amber-100/50 border-x border-amber-200/60">
                        {formatCurrency(totalesCalculados.totalSubsidioC20Excluido, settings)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-sm text-indigo-950 bg-indigo-100/70 whitespace-nowrap">
                        {formatCurrency(totalesCalculados.totalDevengadoComputable, settings)}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 px-3 text-right font-mono text-sm text-indigo-950 bg-indigo-100/70 whitespace-nowrap">
                        {formatCurrency(totalesCalculados.totalDevengadoComputable, settings)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-amber-900 bg-amber-100/50 border-x border-amber-200/60">
                        {formatCurrency(totalesCalculados.totalSubsidioC20Excluido, settings)}
                      </td>
                    </>
                  )}
                  <td className="py-3 px-2 text-center font-mono text-sm text-slate-900 bg-slate-100">
                    {totalesCalculados.totalDiasLaborados} d
                  </td>
                  <td className="py-3 px-2 text-center font-mono text-xs text-slate-700 bg-slate-100">
                    {totalesCalculados.totalHorasLaboradas} h
                  </td>
                  <td className="py-3 px-2 text-right font-mono text-xs text-slate-700">
                    —
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Tarjetas de Indicadores Derivados de la Fórmula Legal */}
          <div className="p-4 bg-slate-900 text-white grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
              <span className="text-3xs uppercase font-mono text-slate-400 block font-semibold">
                Suma Salarios 6 Meses
              </span>
              <span className="text-lg font-black font-mono text-emerald-400">
                {formatCurrency(totalesCalculados.totalDevengadoComputable, settings)}
              </span>
              <p className="text-4xs text-slate-400 mt-0.5">Ingresos computables Ley 116</p>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
              <span className="text-3xs uppercase font-mono text-slate-400 block font-semibold">
                Días / Horas Totales
              </span>
              <span className="text-lg font-black font-mono text-white">
                {totalesCalculados.totalDiasLaborados} d · <span className="text-sm font-normal text-slate-400">{totalesCalculados.totalHorasLaboradas} h</span>
              </span>
              <p className="text-4xs text-slate-400 mt-0.5">Divisores legales</p>
            </div>

            <div className={`p-3 rounded-xl border transition-all ${
              modalidadCalculo === 'dias' 
                ? 'bg-indigo-950/90 border-indigo-400 ring-2 ring-indigo-500/40' 
                : 'bg-slate-800/80 border-slate-700'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-3xs uppercase font-mono text-indigo-200 block font-bold">
                  Salario Promedio Diario
                </span>
                {modalidadCalculo === 'dias' && (
                  <span className="text-4xs bg-indigo-500 text-white font-bold px-1.5 py-0.2 rounded">Activo</span>
                )}
              </div>
              <span className="text-xl font-black font-mono text-amber-300">
                {formatCurrency(totalesCalculados.salarioPromedioDiario, settings)}
              </span>
              <p className="text-4xs text-indigo-300 mt-0.5">Base de liquidación por días</p>
            </div>

            <div className={`p-3 rounded-xl border transition-all ${
              modalidadCalculo === 'horas' 
                ? 'bg-indigo-950/90 border-indigo-400 ring-2 ring-indigo-500/40' 
                : 'bg-slate-800/80 border-slate-700'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-3xs uppercase font-mono text-slate-400 block font-semibold">
                  Tarifa Horaria Promedio
                </span>
                {modalidadCalculo === 'horas' && (
                  <span className="text-4xs bg-indigo-500 text-white font-bold px-1.5 py-0.2 rounded">Activo</span>
                )}
              </div>
              <span className="text-xl font-black font-mono text-sky-300">
                {totalesCalculados.tarifaHorariaPromedio.toFixed(4)} {settings.simboloMoneda}/h
              </span>
              <p className="text-4xs text-slate-400 mt-0.5">Base de liquidación por horas</p>
            </div>
          </div>

        </div>

        {/* Columna Derecha: Liquidador del Evento Legal (Días o Horas) */}
        <div className="xl:col-span-4 space-y-5">
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-800">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                    2. Liquidación del Evento
                  </h3>
                  <p className="text-2xs text-slate-500">
                    Según Código de Trabajo Ley 116
                  </p>
                </div>
              </div>
            </div>

            {/* Selector de Modalidad: Por Días vs Por Horas */}
            <div className="mb-4">
              <label className="text-2xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Modalidad de Cálculo de la Liquidación
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => cambiarModalidad('dias')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    modalidadCalculo === 'dias'
                      ? 'bg-white text-indigo-950 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Por Días</span>
                </button>
                <button
                  type="button"
                  onClick={() => cambiarModalidad('horas')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    modalidadCalculo === 'horas'
                      ? 'bg-white text-indigo-950 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  <span>Por Horas</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              
              {/* Selector de Motivo Legal */}
              <div>
                <label className="text-2xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Motivo de Liquidación (Código de Trabajo)
                </label>
                <select
                  value={motivoSeleccionado}
                  onChange={e => handleMotivoChange(e.target.value as MotivoPromedioLey116)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  {MOTIVOS_LEY_116.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nombre} ({m.porcentajeDefault}%)
                    </option>
                  ))}
                </select>
                <div className="mt-1.5 p-2 bg-indigo-50/60 rounded-lg border border-indigo-100 text-3xs text-indigo-900 leading-snug">
                  <span className="font-bold block text-indigo-950">{motivoInfo.articuloLey}</span>
                  <span>{motivoInfo.descripcion}</span>
                </div>
              </div>

              {/* Input Dinámico: Días o Horas a liquidar según modalidad */}
              <div className="grid grid-cols-2 gap-3">
                {modalidadCalculo === 'dias' ? (
                  <div>
                    <label className="text-2xs font-bold uppercase tracking-wider text-slate-500 block mb-1 flex items-center justify-between">
                      <span>Días a Liquidar</span>
                      <span className="text-3xs text-indigo-600 font-mono">({horasALiquidar} h eq.)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0.5"
                        max="365"
                        step="0.5"
                        value={diasALiquidar}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setDiasALiquidar(val);
                          setHorasALiquidar(Math.round(val * 8 * 10) / 10);
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">días</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-2xs font-bold uppercase tracking-wider text-slate-500 block mb-1 flex items-center justify-between">
                      <span>Horas a Liquidar</span>
                      <span className="text-3xs text-indigo-600 font-mono">({diasALiquidar} d eq.)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0.5"
                        max="1000"
                        step="0.5"
                        value={horasALiquidar}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setHorasALiquidar(val);
                          setDiasALiquidar(Math.round((val / 8) * 10) / 10);
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">horas</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-2xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Porcentaje de Pago
                  </label>
                  <div className="relative">
                    <select
                      value={porcentajeManual}
                      onChange={e => setPorcentajeManual(parseInt(e.target.value) || 100)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                    >
                      <option value={100}>100% (Feriados, Vac., Defensa)</option>
                      <option value={60}>60% (Interrupción {'>'} 30d)</option>
                      <option value={70}>70%</option>
                      <option value={80}>80%</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Observaciones o Documento de Respaldo */}
              <div>
                <label className="text-2xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Referencia / Observaciones
                </label>
                <input
                  type="text"
                  placeholder="ej. Feriado 1ro de Mayo, Banco Sangre, Orden Defensa..."
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Cuadro de Desglose Económico de la Liquidación */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5">
                
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Fórmula Aplicada:</span>
                  <span className="font-mono text-3xs font-semibold text-slate-700">
                    {modalidadCalculo === 'dias' ? (
                      <>{diasALiquidar} d × {formatCurrency(totalesCalculados.salarioPromedioDiario, settings)} × {porcentajeManual}%</>
                    ) : (
                      <>{horasALiquidar} h × {totalesCalculados.tarifaHorariaPromedio.toFixed(4)} {settings.simboloMoneda}/h × {porcentajeManual}%</>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-slate-800 pt-1 border-t border-slate-200">
                  <span>Importe Bruto ({modalidadCalculo === 'dias' ? 'Días' : 'Horas'}):</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatCurrency(liquidacionActual.montoBruto, settings)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-amber-800">
                  <span className="flex items-center gap-1">
                    <span>Retención CESS (5%):</span>
                    <span className="text-3xs text-amber-600" title="Contribución Especial a la Seguridad Social">[Estatal]</span>
                  </span>
                  <span className="font-mono font-bold text-amber-900">
                    - {formatCurrency(liquidacionActual.deduccionCESS, settings)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t-2 border-indigo-200 bg-indigo-50/70 -mx-4 -mb-4 p-4 rounded-b-xl">
                  <div>
                    <span className="text-2xs uppercase tracking-wider font-black text-indigo-950 block">
                      Neto a Pagar
                    </span>
                    <span className="text-3xs text-indigo-700">A percibir por el trabajador</span>
                  </div>
                  <span className="font-mono text-xl font-black text-indigo-900">
                    {formatCurrency(liquidacionActual.montoNeto, settings)}
                  </span>
                </div>

              </div>

              {/* Botón de Guardar en Historial */}
              <button
                onClick={handleGuardarLiquidacion}
                disabled={modalidadCalculo === 'dias' ? diasALiquidar <= 0 : horasALiquidar <= 0}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar en Historial de Liquidaciones</span>
              </button>

            </div>
          </div>

        </div>

      </div>

      {/* Historial de Liquidaciones Registradas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden no-print">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                3. Expediente de Liquidaciones Registradas
              </h2>
            </div>
            <p className="text-2xs text-slate-500 mt-0.5">
              Control acumulado de pagos por salario promedio aprobados en el período.
            </p>
          </div>

          {historialLiquidaciones.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-2xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                {historialLiquidaciones.length} registros
              </span>
              <button
                onClick={handleLimpiarHistorial}
                className="inline-flex items-center gap-1 text-2xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Limpiar</span>
              </button>
            </div>
          )}
        </div>

        {historialLiquidaciones.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Scale className="w-10 h-10 mx-auto text-slate-300 mb-2 opacity-50" />
            <p className="text-xs font-semibold text-slate-600">No hay liquidaciones registradas en este período.</p>
            <p className="text-3xs text-slate-400 mt-0.5">
              Seleccione un trabajador, establezca el motivo y presione "Registrar en Historial".
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-3xs uppercase font-black tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Trabajador & Expediente</th>
                  <th className="py-2.5 px-3">Motivo Legal</th>
                  <th className="py-2.5 px-2 text-center">Base</th>
                  <th className="py-2.5 px-2 text-right">Tarifa Promedio</th>
                  <th className="py-2.5 px-2 text-right">Bruto</th>
                  <th className="py-2.5 px-2 text-right text-amber-800">CESS (5%)</th>
                  <th className="py-2.5 px-3 text-right text-indigo-900 font-black">Neto a Percibir</th>
                  <th className="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {historialLiquidaciones.map(reg => (
                  <tr key={reg.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 font-mono text-3xs text-slate-500 whitespace-nowrap">
                      {reg.fechaRegistro}
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-bold text-slate-900 block">{reg.nombreApellidos}</span>
                      <span className="text-3xs text-slate-500 font-mono">Exp: {reg.numeroExpediente} · {reg.cargo}</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-semibold text-slate-800 block">{reg.motivoNombre}</span>
                      <span className="text-3xs text-indigo-600 font-mono">{reg.articuloLey}</span>
                      {reg.observaciones && (
                        <p className="text-4xs text-slate-400 italic truncate max-w-xs">{reg.observaciones}</p>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center font-mono font-bold text-slate-800">
                      {reg.modalidadCalculo === 'horas' ? (
                        <span>{reg.horasLiquidar || Math.round(reg.diasLiquidar * 8)} h</span>
                      ) : (
                        <span>{reg.diasLiquidar} d</span>
                      )}
                      {reg.porcentajePago !== 100 && (
                        <span className="block text-4xs text-amber-600 font-normal">({reg.porcentajePago}%)</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-slate-700">
                      {reg.modalidadCalculo === 'horas' ? (
                        <>{Number(reg.tarifaPromedioHora || 0).toFixed(4)} {settings.simboloMoneda}/h</>
                      ) : (
                        <>{formatCurrency(reg.salarioPromedioDiario, settings)}/d</>
                      )}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-slate-800">
                      {formatCurrency(reg.montoBruto, settings)}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-amber-800">
                      -{formatCurrency(reg.deduccionCESS, settings)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-indigo-950 bg-indigo-50/30 whitespace-nowrap">
                      {formatCurrency(reg.montoNeto, settings)}
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleEliminarRegistro(reg.id)}
                        title="Eliminar este registro"
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* VISTA OFICIAL DE DICTAMEN IMPRIMIBLE (DOCUMENTO OFICIAL LEY 116 / DEC 326) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border-2 border-slate-800 p-8 shadow-sm space-y-5 print:border-none print:shadow-none print:p-0">
        
        {/* Barra superior de control del informe (solo pantalla) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 no-print text-xs">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="font-bold text-slate-900">Vista Previa del Dictamen Oficial Imprimible</span>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 text-xs">
              <input
                type="checkbox"
                checked={printSoloDevengado}
                onChange={e => setPrintSoloDevengado(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span>Optimizar espacio: Solo Devengado Total (1 página)</span>
            </label>
            <button
              onClick={() => window.print()}
              className="px-3 py-1 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-slate-800 cursor-pointer"
            >
              Imprimir
            </button>
          </div>
        </div>

        {/* Encabezado Institucional de la República de Cuba */}
        <div className="text-center border-b-2 border-slate-900 pb-3">
          <span className="text-xs uppercase font-serif tracking-widest text-slate-700 font-bold block">
            REPÚBLICA DE CUBA
          </span>
          <span className="text-sm uppercase font-black text-slate-900 tracking-wider block">
            MINISTERIO DE TRABAJO Y SEGURIDAD SOCIAL
          </span>
          <h2 className="text-base sm:text-lg font-black uppercase text-slate-900 tracking-tight mt-0.5">
            DICTAMEN OFICIAL DE DETERMINACIÓN Y LIQUIDACIÓN DE SALARIO PROMEDIO
          </h2>
          <span className="text-3xs font-mono text-slate-600 block">
            Conforme a la Ley No. 116 "Código de Trabajo" y Decreto No. 326 · Liquidación por {modalidadCalculo === 'dias' ? 'Días' : 'Horas'}
          </span>
        </div>

        {/* Metadatos de la Entidad y Período */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50/50">
          <div>
            <span className="text-3xs uppercase font-bold text-slate-500 block">Código REEUP</span>
            <span className="font-mono font-bold text-slate-900">{headerPrenomina.codigoREEUP || '101.1.00245'}</span>
          </div>
          <div>
            <span className="text-3xs uppercase font-bold text-slate-500 block">Centro de Costo</span>
            <span className="font-mono font-bold text-slate-900">{headerPrenomina.direccionCC || 'CC 101'}</span>
          </div>
          <div>
            <span className="text-3xs uppercase font-bold text-slate-500 block">Período de Referencia</span>
            <span className="font-mono font-bold text-slate-900">Últimos 6 meses naturales</span>
          </div>
          <div>
            <span className="text-3xs uppercase font-bold text-slate-500 block">Fecha de Emisión</span>
            <span className="font-mono font-bold text-slate-900">
              {new Date().toLocaleDateString('es-CU', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Datos Personales y Laborales del Trabajador */}
        {worker && (
          <div className="border border-slate-300 rounded-lg p-3 space-y-1.5">
            <span className="text-3xs uppercase font-black text-slate-800 tracking-wider block border-b border-slate-200 pb-0.5">
              I. Generales del Trabajador
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-3xs uppercase text-slate-500 font-bold block">Nombres y Apellidos:</span>
                <span className="font-bold text-slate-900">{worker.nombreApellidos}</span>
              </div>
              <div>
                <span className="text-3xs uppercase text-slate-500 font-bold block">Expediente / CI:</span>
                <span className="font-mono font-bold text-slate-900">{worker.numeroExpediente || worker.id}</span>
              </div>
              <div>
                <span className="text-3xs uppercase text-slate-500 font-bold block">Cargo / Cat. Ocupacional:</span>
                <span className="font-bold text-slate-800">{worker.cargo || 'Especialista'} ({worker.catOcupacional})</span>
              </div>
              <div>
                <span className="text-3xs uppercase text-slate-500 font-bold block">Salario Escala Actual:</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(worker.salarioBasicoEscala || 0, settings)}</span>
              </div>
              <div>
                <span className="text-3xs uppercase text-slate-500 font-bold block">Antigüedad Reconocida:</span>
                <span className="font-mono font-bold text-slate-900">{worker.aniosAntiguedad || 0} años</span>
              </div>
              <div>
                <span className="text-3xs uppercase text-slate-500 font-bold block">Grado Académico:</span>
                <span className="font-bold text-slate-900 capitalize">{worker.gradoAcademico || 'Ninguno'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tabla Imprimible de los 6 Meses Computables (Compacta o Detallada) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-3xs uppercase font-black text-slate-800 tracking-wider block">
              II. Desglose Salarial de los Seis (6) Meses Anteriores (Decreto No. 326 Art. 78)
            </span>
            {printSoloDevengado && (
              <span className="text-4xs text-slate-500 font-mono italic">
                Formato optimizado de espacio: Solo Devengado Total
              </span>
            )}
          </div>

          {printSoloDevengado ? (
            /* TABLA COMPACTA: Solo Devengado Total, Días y Horas (Ahorro máximo de espacio para 1 página) */
            <table className="w-full text-left text-xs border border-slate-400 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 text-3xs uppercase font-bold border-b border-slate-400">
                  <th className="py-1 px-2 border-r border-slate-300">Mes Natural</th>
                  <th className="py-1 px-2 text-right border-r border-slate-300">Devengado Total Computable (CUP)</th>
                  <th className="py-1 px-2 text-center border-r border-slate-300">Días Laborados</th>
                  <th className="py-1 px-2 text-center border-r border-slate-300">Horas Laboradas</th>
                  <th className="py-1 px-2 text-right">Promedio Diario del Mes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-mono text-2xs">
                {totalesCalculados.desgloseMeses.map((m) => (
                  <tr key={m.id}>
                    <td className="py-0.5 px-2 font-bold font-sans border-r border-slate-300">{m.mesNombre}</td>
                    <td className="py-0.5 px-2 text-right font-bold border-r border-slate-300">{formatNumber(m.devengadoMes, 2)}</td>
                    <td className="py-0.5 px-2 text-center font-bold border-r border-slate-300">{m.diasLaborados}</td>
                    <td className="py-0.5 px-2 text-center border-r border-slate-300">{m.horasLaboradas}</td>
                    <td className="py-0.5 px-2 text-right">{formatCurrency(m.promedioDiarioMes, settings)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-mono font-bold text-2xs border-t-2 border-slate-400">
                  <td className="py-1 px-2 text-left font-sans font-bold border-r border-slate-300">TOTALES 6 MESES:</td>
                  <td className="py-1 px-2 text-right border-r border-slate-300 text-slate-900">
                    {formatCurrency(totalesCalculados.totalDevengadoComputable, settings)}
                  </td>
                  <td className="py-1 px-2 text-center border-r border-slate-300 text-slate-900">
                    {totalesCalculados.totalDiasLaborados} días
                  </td>
                  <td className="py-1 px-2 text-center border-r border-slate-300 text-slate-900">
                    {totalesCalculados.totalHorasLaboradas} horas
                  </td>
                  <td className="py-1 px-2 text-right font-bold text-indigo-950">
                    Prom. General: {formatCurrency(totalesCalculados.salarioPromedioDiario, settings)}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            /* TABLA EXTENDIDA: Con Desglose Completo de Conceptos */
            <table className="w-full text-left text-xs border border-slate-400 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 text-3xs uppercase font-bold border-b border-slate-400">
                  <th className="py-1 px-2 border-r border-slate-300">Mes</th>
                  <th className="py-1 px-2 text-right border-r border-slate-300">Sal. Escala</th>
                  <th className="py-1 px-2 text-right border-r border-slate-300">Antig. + Grado</th>
                  <th className="py-1 px-2 text-right border-r border-slate-300">Nocturnidad</th>
                  <th className="py-1 px-2 text-right border-r border-slate-300">Extras</th>
                  <th className="py-1 px-2 text-right border-r border-slate-300">Estimulación</th>
                  <th className="py-1 px-2 text-right border-r border-slate-300">Total Devengado</th>
                  <th className="py-1 px-2 text-center border-r border-slate-300">Días</th>
                  <th className="py-1 px-2 text-center">Horas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-mono text-2xs">
                {totalesCalculados.desgloseMeses.map((m) => (
                  <tr key={m.id}>
                    <td className="py-0.5 px-2 font-bold font-sans border-r border-slate-300">{m.mesNombre}</td>
                    <td className="py-0.5 px-2 text-right border-r border-slate-300">{formatNumber(m.salarioEscala, 2)}</td>
                    <td className="py-0.5 px-2 text-right border-r border-slate-300">{formatNumber(m.antiguedadYGrado, 2)}</td>
                    <td className="py-0.5 px-2 text-right border-r border-slate-300">{formatNumber(m.nocturnidad, 2)}</td>
                    <td className="py-0.5 px-2 text-right border-r border-slate-300">{formatNumber(m.horasExtras, 2)}</td>
                    <td className="py-0.5 px-2 text-right border-r border-slate-300">{formatNumber(m.estimulacionResultados, 2)}</td>
                    <td className="py-0.5 px-2 text-right font-bold border-r border-slate-300">{formatNumber(m.devengadoMes, 2)}</td>
                    <td className="py-0.5 px-2 text-center font-bold border-r border-slate-300">{m.diasLaborados}</td>
                    <td className="py-0.5 px-2 text-center">{m.horasLaboradas}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-mono font-bold text-2xs border-t-2 border-slate-400">
                  <td colSpan={6} className="py-1 px-2 text-right font-sans font-bold">TOTALES ACUMULADOS:</td>
                  <td className="py-1 px-2 text-right border-r border-slate-300 text-slate-900">
                    {formatCurrency(totalesCalculados.totalDevengadoComputable, settings)}
                  </td>
                  <td className="py-1 px-2 text-center border-r border-slate-300 text-slate-900">
                    {totalesCalculados.totalDiasLaborados}
                  </td>
                  <td className="py-1 px-2 text-center text-slate-900">
                    {totalesCalculados.totalHorasLaboradas}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Determinación de la Fórmula Legal y Resultado */}
        <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50 space-y-1.5">
          <span className="text-3xs uppercase font-black text-slate-800 tracking-wider block">
            III. Determinación de Tarifas Promedio Legales (Decreto No. 326)
          </span>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className={`p-2 rounded border ${modalidadCalculo === 'dias' ? 'bg-white border-slate-900 font-bold' : 'bg-white/80 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className="text-3xs uppercase font-bold text-slate-800">1. Salario Promedio Diario (Días):</span>
                {modalidadCalculo === 'dias' && <span className="text-4xs uppercase bg-slate-900 text-white px-1.5 py-0.2 rounded font-mono">Modalidad Activa</span>}
              </div>
              <p className="font-mono text-3xs text-slate-600 mt-0.5">
                {formatNumber(totalesCalculados.totalDevengadoComputable, 2)} CUP ÷ {totalesCalculados.totalDiasLaborados} días = <span className="text-sm font-black text-slate-900">{formatCurrency(totalesCalculados.salarioPromedioDiario, settings)} / día</span>
              </p>
            </div>

            <div className={`p-2 rounded border ${modalidadCalculo === 'horas' ? 'bg-white border-slate-900 font-bold' : 'bg-white/80 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className="text-3xs uppercase font-bold text-slate-800">2. Tarifa Horaria Promedio (Horas):</span>
                {modalidadCalculo === 'horas' && <span className="text-4xs uppercase bg-slate-900 text-white px-1.5 py-0.2 rounded font-mono">Modalidad Activa</span>}
              </div>
              <p className="font-mono text-3xs text-slate-600 mt-0.5">
                {formatNumber(totalesCalculados.totalDevengadoComputable, 2)} CUP ÷ {totalesCalculados.totalHorasLaboradas} h = <span className="text-sm font-black text-slate-900">{formatCurrency(totalesCalculados.tarifaHorariaPromedio, settings)} / hora</span>
              </p>
            </div>
          </div>
        </div>

        {/* Liquidación Económica del Evento Aprobado */}
        <div className="border border-slate-300 rounded-lg p-3 space-y-1.5">
          <span className="text-3xs uppercase font-black text-slate-800 tracking-wider block border-b border-slate-200 pb-0.5">
            IV. Liquidación Económica por Concepto de {motivoInfo.nombre}
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
            <div>
              <span className="text-3xs uppercase text-slate-500 font-bold block">Concepto / Motivo:</span>
              <span className="font-bold text-slate-900 block leading-tight">{motivoInfo.nombre}</span>
              <span className="text-3xs font-mono text-indigo-700 block">{motivoInfo.articuloLey}</span>
            </div>
            <div>
              <span className="text-3xs uppercase text-slate-500 font-bold block">Unidades a Liquidar:</span>
              <span className="font-mono font-bold text-slate-900 block">
                {modalidadCalculo === 'dias' ? `${diasALiquidar} días (${porcentajeManual}%)` : `${horasALiquidar} horas (${porcentajeManual}%)`}
              </span>
              <span className="text-3xs text-slate-500 font-mono">
                Tarifa: {modalidadCalculo === 'dias' ? `${formatCurrency(totalesCalculados.salarioPromedioDiario, settings)}/d` : `${formatCurrency(totalesCalculados.tarifaHorariaPromedio, settings)}/h`}
              </span>
            </div>
            <div>
              <span className="text-3xs uppercase text-slate-500 font-bold block">Importe Bruto:</span>
              <span className="font-mono font-bold text-slate-900 block">{formatCurrency(liquidacionActual.montoBruto, settings)}</span>
              <span className="text-3xs text-amber-800 font-mono block">CESS 5%: -{formatCurrency(liquidacionActual.deduccionCESS, settings)}</span>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded p-1.5 text-right">
              <span className="text-3xs uppercase text-indigo-900 font-bold block">Neto a Liquidar:</span>
              <span className="font-mono font-black text-base text-indigo-950 block">
                {formatCurrency(liquidacionActual.montoNeto, settings)}
              </span>
            </div>
          </div>
          {observaciones && (
            <p className="text-3xs text-slate-600 mt-1 italic bg-slate-50 p-1.5 rounded">
              Observaciones / Justificante: {observaciones}
            </p>
          )}
        </div>

        {/* Firmas de Autorización Oficial */}
        <div className="pt-2 print:pt-1 border-t border-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs print:text-[8px]">
          <div className="space-y-3 print:space-y-1">
            <div className="border-b border-slate-400 h-6 print:h-3"></div>
            <div>
              <span className="font-bold text-slate-900 block text-3xs print:text-[7.5px] uppercase">Confecciona</span>
              <span className="text-4xs text-slate-500 block">Técnico de Nóminas / RRHH</span>
              <span className="text-4xs font-mono font-bold text-slate-800 mt-0.5 block">{headerPrenomina.confecciona || 'Firma y Cuño'}</span>
            </div>
          </div>

          <div className="space-y-3 print:space-y-1">
            <div className="border-b border-slate-400 h-6 print:h-3"></div>
            <div>
              <span className="font-bold text-slate-900 block text-3xs print:text-[7.5px] uppercase">Chequea</span>
              <span className="text-4xs text-slate-500 block">Especialista Económico</span>
              <span className="text-4xs font-mono font-bold text-slate-800 mt-0.5 block">{headerPrenomina.chequea || 'Firma y Cuño'}</span>
            </div>
          </div>

          <div className="space-y-3 print:space-y-1">
            <div className="border-b border-slate-400 h-6 print:h-3"></div>
            <div>
              <span className="font-bold text-slate-900 block text-3xs print:text-[7.5px] uppercase">Aprueba</span>
              <span className="text-4xs text-slate-500 block">Director / Administrador</span>
              <span className="text-4xs font-mono font-bold text-slate-800 mt-0.5 block">{headerPrenomina.aprueba || 'Firma y Cuño'}</span>
            </div>
          </div>

          <div className="space-y-3 print:space-y-1">
            <div className="border-b border-slate-400 h-6 print:h-3"></div>
            <div>
              <span className="font-bold text-slate-900 block text-3xs print:text-[7.5px] uppercase">Anota / Conforme</span>
              <span className="text-4xs text-slate-500 block">Firma del Trabajador</span>
              <span className="text-4xs font-mono text-slate-600 mt-0.5 block">{headerPrenomina.anota ? `Anota: ${headerPrenomina.anota}` : 'Fecha: ___/___/2026'}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

// ==========================================
// TIPOS DEL FORMATO OFICIAL (PRENÓMINA CUBANA)
// ==========================================

export type CatOcupacional = 'T' | 'C' | 'O' | 'A' | 'S';

export interface CentroCosto {
  id: string;
  codigoCC: string; // ej. "CC 101"
  nombre: string;   // ej. "DIRECCION", "OPERACIONES", "MANTENIMIENTO"
  confecciona: string;
  chequea: string;
  aprueba: string;
  anota: string;
  codigoREEUP?: string;
  descripcion?: string;
}

export interface ClaveDeduccion {
  codigo: string;       // ej. "C-25", "C-20", "C-10", "C-82"
  nombre: string;       // ej. "Vacaciones Planificadas"
  descripcion?: string;
  tipo: 'vacaciones' | 'medico' | 'ausencia' | 'baja' | 'otro';
  activa?: boolean;
}

export interface TarifaNocturnidad {
  id: string;
  codigo: string;       // ej. "nochesComp100", "horas5", "horas10"
  nombre: string;       // ej. "Noches comp.", "Horas $5", "Horas $10"
  tarifa: number;       // tarifa a pagar ej. 100, 5, 10
  tipo: 'noche' | 'hora';
  activa: boolean;
}

export interface ClaveActividadAjena {
  id: string;
  codigo: string;       // ej. "ACT-01", "ACT-02"
  nombre: string;       // ej. "Actividades Ajenas Generales"
  descripcion?: string;
  activa: boolean;
}

export interface HeaderPrenomina {
  confecciona: string;
  chequea: string;
  aprueba: string;
  anota: string;
  periodoCorresponde: string;
  numeroConsecutivo: string;
  fechaDesde: string;
  fechaHasta: string;
  codigoREEUP: string;
  direccionCC: string; // ej. "CC 101"
  fechaConclusion: string;
}

export interface NocturnidadData {
  nochesComp100: number;
  horas5: number;
  horas10: number;
  totalNocturnidad: number;
}

export interface TrabajoExtraData {
  horas: number;
  importe: number;
}

export interface DeduccionesOficiales {
  vacacSimultanC82: number;
  ausInjustJustC10_C11: number;
  cMedC20: number;
  vacacPlanifC25: number;
  bajaC27: number;
  nuevoIngC30: number;
  trasladoC31: number;
}

export interface EscalaSalarialCargo {
  id: string;
  nombre: string;
  salarioEscala: number;
  catOcupacionalDefault: CatOcupacional;
  grupoEscala?: string;
  descripcion?: string;
}

export interface EmployeePrenomina {
  id: string;
  nombreApellidos: string;
  cargo?: string;
  catOcupacional: CatOcupacional;
  centroCostoId?: string; // ID del Centro de Costo al que pertenece
  fondoTiempoIndividual?: number;
  dias: string[]; // 31 días
  nocturnidad: NocturnidadData;
  nocturnidadValores?: Record<string, number>; // Cantidades por clave de nocturnidad
  trabajoExtra: TrabajoExtraData;
  activAjenas: number;
  activAjenasValores?: Record<string, number>; // Montos por clave de actividades ajenas
  deducciones: DeduccionesOficiales;
  deduccionesValores?: Record<string, number>; // Horas por clave de deducción (ej. "C-25": 97)
  salarioBasicoEscala?: number;
  tarifaHoraria?: number;
  notas?: string;
}

export interface EmployeeWithPrenominaCalc extends EmployeePrenomina {
  tiempoRealLaborado: number;
  horasVacacionesCalculadas: number;
  totalPagosAdicionales: number;
  totalDeduccionesHoras: number;
  salarioTiempoLaborado: number;
  salarioVacaciones: number;
  salarioTotalEstimado: number;
}

export interface TotalesPrenomina {
  totalEmpleados: number;
  totalFondoTiempo: number;
  totalTiempoRealLaborado: number;
  totalNochesComp100: number;
  totalHoras5: number;
  totalHoras10: number;
  totalImporteNocturnidad: number;
  totalHorasExtra: number;
  totalImporteTrabajoExtra: number;
  totalActivAjenas: number;
  totalVacacSimultanC82: number;
  totalAusInjustJustC10: number;
  totalCMedC20: number;
  totalVacacPlanifC25: number;
  totalBajaC27: number;
  totalNuevoIngC30: number;
  totalTrasladoC31: number;
  granTotalImporte: number;
}

// ==========================================
// CONFIGURACIÓN Y PARÁMETROS GLOBALES
// ==========================================

export type ContractType = 'indefinido' | 'fijo' | 'obra' | 'practicas';
export type PayrollStatus = 'borrador' | 'revisado' | 'aprobado' | 'pagado';

export interface Employee {
  id: string;
  identificacion: string;
  nombre: string;
  apellidos: string;
  cargo: string;
  departamento: string;
  tipoContrato: ContractType;
  fechaIngreso: string;
  salarioBase: number;
  diasTrabajados: number;
  diasAusencia: number;
  horasExtrasDiurnas: number;
  horasExtrasNocturnas: number;
  horasExtrasFestivas: number;
  bonoPuntualidad: number;
  comisiones: number;
  otrosIngresos: number;
  aplicaSubsidioTransporte: boolean;
  anticipos: number;
  prestamos: number;
  otrasDeducciones: number;
  retencionFuenteManual?: number | null;
  estado: PayrollStatus;
  notas?: string;
  email?: string;
}

export interface PayrollSettings {
  moneda: string;
  simboloMoneda: string;
  periodoNombre: string;
  diasBaseMes: number;
  horasJornadaMensual: number;
  
  // Divisor legal código de trabajo cubano (190.6 horas)
  divisorHorasMes: number;
  
  factorExtraDiurna: number;
  factorExtraNocturna: number;
  factorExtraFestiva: number;
  tasaSaludTrabajador: number;
  tasaPensionTrabajador: number;
  tasaFondoSolidaridad: number;
  umbralFondoSolidaridad: number;
  subsidioTransporteMensual: number;
  topeSubsidioTransporte: number;
  aplicarRetencionAutomatica: boolean;
  tasaRetencionEstimada: number;
  umbralRetencion: number;
  tasaSaludPatronal: number;
  tasaPensionPatronal: number;
  tasaRiesgosLaborales: number;
  tasaPrestacionesSociales: number;
  
  // Escala salarial y configuraciones avanzadas
  escalaCargos?: EscalaSalarialCargo[];
  centrosCosto?: CentroCosto[];
  clavesDeduccion?: ClaveDeduccion[];
  tarifasNocturnidad?: TarifaNocturnidad[];
  clavesActividadesAjenas?: ClaveActividadAjena[];
}

export interface CalculationBreakdown {
  salarioDiario: number;
  valorHoraOrdinaria: number;
  sueldoBasicoDevengado: number;
  descuentoAusencias: number;
  valorExtrasDiurnas: number;
  valorExtrasNocturnas: number;
  valorExtrasFestivas: number;
  totalHorasExtras: number;
  subsidioTransporteEfectivo: number;
  totalBonosYComisiones: number;
  totalDevengado: number;
  baseCotizacion: number;
  deduccionSalud: number;
  deduccionPension: number;
  deduccionFondoSolidaridad: number;
  deduccionRetencionFuente: number;
  totalDeduccionesLey: number;
  totalOtrasDeducciones: number;
  totalDeducciones: number;
  salarioNeto: number;
  costoSaludPatronal: number;
  costoPensionPatronal: number;
  costoRiesgosLaborales: number;
  costoPrestacionesSociales: number;
  totalCargasPatronales: number;
  costoTotalEmpresa: number;
}

export interface EmployeeWithCalculation extends Employee {
  calculo: CalculationBreakdown;
}

export interface PayrollTotals {
  totalEmpleados: number;
  totalSalarioBase: number;
  totalDevengado: number;
  totalHorasExtras: number;
  totalSubsidioTransporte: number;
  totalBonos: number;
  totalSaludTrabajador: number;
  totalPensionTrabajador: number;
  totalRetencionFuente: number;
  totalDeducciones: number;
  totalNetoPagar: number;
  totalCargasPatronales: number;
  costoTotalEmpresa: number;
}

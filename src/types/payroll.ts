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

export interface PlantillaCargoConfig {
  id: string;
  cargo: string;
  cantidadPlan: number;
}

export interface SeniorityTier {
  id: string;
  minYears: number;
  maxYears: number;
  amount: number;
  label: string;
}

export type GradoAcademico = 'ninguno' | 'licenciatura' | 'especialidad' | 'maestria' | 'doctorado';

export interface EmployeePrenomina {
  id: string;
  nombreApellidos: string;
  numeroExpediente?: string; // Número de expediente (Exp.) del trabajador
  sexo?: 'M' | 'F'; // Sexo del trabajador ('M' = Masculino, 'F' = Femenino)
  cargo?: string;
  catOcupacional: CatOcupacional;
  centroCostoId?: string; // ID del Centro de Costo al que pertenece
  fondoTiempoIndividual?: number;
  fechaIngreso?: string; // Fecha de incorporación a la empresa (para antigüedad)
  fechaBaja?: string; // Fecha de la baja C-27 (editable)
  motivoBaja?: string; // Motivo de la baja C-27 (editable)
  montoAntiguedadManual?: number; // Monto manual o sobrescrito de antigüedad
  gradoAcademico?: GradoAcademico; // Grado académico (Licenciatura, Maestría, Doctorado, etc.)
  montoGradoAcademicoManual?: number; // Monto manual o sobrescrito por grado académico
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
  aniosAntiguedad: number;
  montoAntiguedadCalculado: number;
  montoGradoAcademicoCalculado: number;
  salarioBasicoTotal: number;
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
  aplicaSubsidioTransporte?: boolean; // Deprecado: No aplica en el sector estatal cubano
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
  
  // IMPUESTOS Y RETENCIONES DEL TRABAJADOR ESTATAL (Ley 116 / Ley 113 de Cuba)
  tasaCESS: number; // 5% Contribución Especial a la Seguridad Social
  aplicarISIP: boolean; // Retención mensual del Impuesto sobre los Ingresos Personales
  tasaISIP: number; // Tasa impositiva ISIP estatal sobre exceso de mínimo exento (ej: 5.0%)
  umbralExentoISIP: number; // Mínimo exento legal mensual para ISIP (ej: 3260 CUP)

  // APORTES PATRONALES ESTATALES DE LA ENTIDAD EMPLEADORA (Cuba)
  tasaSeguridadSocialPatronal: number; // 12.5% Aporte Patronal a la Seguridad Social
  tasaFuerzaTrabajoPatronal: number; // 5.0% Impuesto por Utilización de la Fuerza de Trabajo (IUFT)

  // Campos de compatibilidad (deprecados/inactivos)
  tasaSaludTrabajador?: number;
  tasaPensionTrabajador?: number;
  tasaFondoSolidaridad?: number;
  umbralFondoSolidaridad?: number;
  subsidioTransporteMensual?: number;
  topeSubsidioTransporte?: number;
  aplicarRetencionAutomatica?: boolean;
  tasaRetencionEstimada?: number;
  umbralRetencion?: number;
  tasaSaludPatronal?: number;
  tasaPensionPatronal?: number;
  tasaRiesgosLaborales?: number;
  tasaPrestacionesSociales?: number;
  
  // Responsables oficiales unificados para todos los CC
  firmasGlobales?: {
    confecciona: string;
    chequea: string;
    aprueba: string;
    anota: string;
  };

  // Escala salarial y configuraciones avanzadas
  escalaCargos?: EscalaSalarialCargo[];
  escalasAntiguedad?: SeniorityTier[];
  montosGradosAcademicos?: {
    licenciatura: number;
    especialidad: number;
    maestria: number;
    doctorado: number;
  };
  centrosCosto?: CentroCosto[];
  clavesDeduccion?: ClaveDeduccion[];
  tarifasNocturnidad?: TarifaNocturnidad[];
  clavesActividadesAjenas?: ClaveActividadAjena[];
  plantillaCargos?: PlantillaCargoConfig[];
}

// ==========================================
// TIPOS DE SALARIO PROMEDIO (LEY 116 / DEC. 326 CUBA)
// ==========================================

export interface MesSalarioPromedio {
  id: string;
  mesNumero: number; // 1 a 6
  mesNombre: string; // ej. "Mes 1", "Enero 2026"
  salarioEscala: number;
  antiguedadYGrado: number;
  nocturnidad: number;
  horasExtras: number;
  estimulacionResultados: number;
  otrosDevengosComputables: number;
  subsidioC20Excluido: number; // Certificado médico C-20 (informativo, excluido de la base)
  diasLaborados: number;
  horasLaboradas: number;
}

export type MotivoPromedioLey116 = 
  | 'vacaciones'
  | 'dias_feriados'
  | 'movilizacion_defensa'
  | 'donacion_sangre'
  | 'citacion_judicial'
  | 'capacitacion_estatal'
  | 'interrupcion_30dias'
  | 'interrupcion_mayor30'
  | 'reubicacion_temporal'
  | 'licencia_retribuida'
  | 'comision_servicio';

export interface ConceptoMotivoPromedio {
  id: MotivoPromedioLey116;
  nombre: string;
  articuloLey: string;
  porcentajeDefault: number;
  descripcion: string;
  unidadDefault: 'dias' | 'horas';
}

export interface RegistroLiquidacionPromedio {
  id: string;
  fechaRegistro: string;
  trabajadorId: string;
  nombreApellidos: string;
  numeroExpediente: string;
  cargo: string;
  centroCostoId: string;
  centroCostoNombre: string;
  motivo: MotivoPromedioLey116;
  motivoNombre: string;
  articuloLey: string;
  modalidadCalculo?: 'dias' | 'horas';
  diasLiquidar: number;
  horasLiquidar?: number;
  porcentajePago: number; // 100 o 60
  salarioPromedioDiario: number;
  tarifaPromedioHora: number;
  montoBruto: number;
  deduccionCESS: number; // 5% Contribución Especial a la Seguridad Social
  montoNeto: number;
  observaciones?: string;
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
  subsidioTransporteEfectivo: number; // 0 en sector estatal
  totalBonosYComisiones: number;
  totalDevengado: number;
  baseCotizacion: number;
  
  // Impuestos Estatales de Cuba
  deduccionCESS: number; // 5% Contribución Especial a la Seguridad Social
  deduccionISIP: number; // Impuesto sobre Ingresos Personales estatal

  // Compatibilidad
  deduccionSalud: number;
  deduccionPension: number;
  deduccionFondoSolidaridad: number;
  deduccionRetencionFuente: number;

  totalDeduccionesLey: number;
  totalOtrasDeducciones: number;
  totalDeducciones: number;
  salarioNeto: number;

  // Aportes Patronales Estatales (12.5% + 5.0%)
  costoSeguridadSocialPatronal: number;
  costoFuerzaTrabajoPatronal: number;

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
  
  // Impuestos Estatales Cubanos
  totalCESS: number;
  totalISIP: number;
  totalSeguridadSocialPatronal: number;
  totalFuerzaTrabajoPatronal: number;

  totalSaludTrabajador: number;
  totalPensionTrabajador: number;
  totalRetencionFuente: number;
  totalDeducciones: number;
  totalNetoPagar: number;
  totalCargasPatronales: number;
  costoTotalEmpresa: number;
}

export interface PeriodoHistoricoSnapshot {
  id: string;
  nombrePeriodo: string;
  fechaGuardado: string;
  empleados: EmployeePrenomina[];
  header: HeaderPrenomina;
}

export type ColorTheme = 'white' | 'ivory' | 'slate' | 'blue' | 'mint';


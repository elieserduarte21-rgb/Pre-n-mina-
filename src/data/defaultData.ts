import { Employee, PayrollSettings, CentroCosto, ClaveDeduccion, TarifaNocturnidad, ClaveActividadAjena, SeniorityTier } from '../types/payroll';

export const DEFAULT_SENIORITY_TIERS: SeniorityTier[] = [
  { id: 'sent-1', minYears: 1, maxYears: 2, amount: 150, label: '1 a 2 años' },
  { id: 'sent-2', minYears: 3, maxYears: 5, amount: 300, label: '3 a 5 años' },
  { id: 'sent-3', minYears: 6, maxYears: 10, amount: 500, label: '6 a 10 años' },
  { id: 'sent-4', minYears: 11, maxYears: 15, amount: 750, label: '11 a 15 años' },
  { id: 'sent-5', minYears: 16, maxYears: 99, amount: 1000, label: 'Más de 15 años' }
];

export const DEFAULT_CENTROS_COSTO: CentroCosto[] = [
  {
    id: 'cc-101',
    codigoCC: 'CC 101',
    nombre: 'DIRECCIÓN & ADMINISTRACIÓN',
    confecciona: 'DAYSI REYES DÍAZ',
    chequea: 'PEDRO ALBERTO GALBÁN LOPEZ',
    aprueba: 'ZUNILDA MENDEZ LINARES',
    anota: 'ELIESER DUARTES LÓPEZ',
    codigoREEUP: '151.0.4897',
    descripcion: 'Oficina Central, Contabilidad y Dirección'
  },
  {
    id: 'cc-102',
    codigoCC: 'CC 102',
    nombre: 'OPERACIONES & PRODUCCIÓN',
    confecciona: 'MARÍA TERESA BLANCO',
    chequea: 'JUAN CARLOS VALDÉS',
    aprueba: 'ZUNILDA MENDEZ LINARES',
    anota: 'ELIESER DUARTES LÓPEZ',
    codigoREEUP: '151.0.4897',
    descripcion: 'Línea de producción y turnos de operaciones'
  },
  {
    id: 'cc-103',
    codigoCC: 'CC 103',
    nombre: 'MANTENIMIENTO & ELECTROMECÁNICA',
    confecciona: 'ERNESTO GUERRA LEÓN',
    chequea: 'CARLOS MANUEL SOTO',
    aprueba: 'ZUNILDA MENDEZ LINARES',
    anota: 'ELIESER DUARTES LÓPEZ',
    codigoREEUP: '151.0.4897',
    descripcion: 'Mantenimiento técnico, guardias y talleres'
  }
];

export const DEFAULT_CLAVES_DEDUCCION: ClaveDeduccion[] = [
  { codigo: 'C-25', nombre: 'Vacaciones Planificadas', tipo: 'vacaciones', descripcion: 'Horas de disfrute de vacaciones anuales remuneradas', activa: true },
  { codigo: 'C-20', nombre: 'Certificado Médico', tipo: 'medico', descripcion: 'Incapacidad médica certificada por MINSAP', activa: true },
  { codigo: 'C-10', nombre: 'Ausencia Injustificada', tipo: 'ausencia', descripcion: 'Inasistencia sin causa justificada sujeta a descuento', activa: true },
  { codigo: 'C-11', nombre: 'Ausencia Justificada', tipo: 'ausencia', descripcion: 'Permisos oficiales y justificaciones laborales', activa: true },
  { codigo: 'C-84', nombre: 'Prestación Social Simultánea (PSS)', tipo: 'otro', descripcion: 'Prestaciones sociales autorizadas simultáneas', activa: true },
  { codigo: 'C-27', nombre: 'Baja Definitiva', tipo: 'baja', descripcion: 'Desvinculación laboral definitiva del centro', activa: true },
  { codigo: 'C-30', nombre: 'Nuevo Ingreso', tipo: 'otro', descripcion: 'Incorporación o alta de nuevo trabajador en el mes', activa: true },
  { codigo: 'C-31', nombre: 'Traslado', tipo: 'otro', descripcion: 'Traslado oficial a otra unidad o centro de costo', activa: true }
];

export const DEFAULT_TARIFAS_NOCTURNIDAD: TarifaNocturnidad[] = [
  { id: 'noc-100', codigo: 'nochesComp100', nombre: 'Noches comp.', tarifa: 100, tipo: 'noche', activa: true },
  { id: 'hor-5', codigo: 'horas5', nombre: 'Horas $5', tarifa: 5, tipo: 'hora', activa: true },
  { id: 'hor-10', codigo: 'horas10', nombre: 'Horas $10', tarifa: 10, tipo: 'hora', activa: true }
];

export const DEFAULT_CLAVES_ACTIVIDADES_AJENAS: ClaveActividadAjena[] = [
  { id: 'act-c82', codigo: 'C-82', nombre: 'C-82 Vacac. Simultáneas', descripcion: 'Horas de C-82 / Actividad ajena que suma al tiempo real laborado', activa: true },
  { id: 'act-c85', codigo: 'C-85', nombre: 'C-85 Movilizados / Defensa', descripcion: 'Horas de C-85 / Actividad ajena que suma al tiempo real laborado', activa: true },
  { id: 'act-c57', codigo: 'C-57', nombre: 'C-57 Interrupción autorizada', descripcion: 'Horas de C-57 / Actividad ajena que suma al tiempo real laborado', activa: true },
  { id: 'act-c72', codigo: 'C-72', nombre: 'C-72 Capacitación / Comisión', descripcion: 'Horas de C-72 / Actividad ajena que suma al tiempo real laborado', activa: true },
  { id: 'act-c69', codigo: 'C-69', nombre: 'C-69 Categoría Ocupacional', descripcion: 'Horas de C-69 Categoría Ocupacional que suman al tiempo real laborado', activa: true },
  { id: 'act-c54', codigo: 'C-54', nombre: 'C-54 Movilización Militar', descripcion: 'Movilización militar pagada por tarifa de horas promedio', activa: true },
  { id: 'act-c70', codigo: 'C-70', nombre: 'C-70 Feriados no trabajados', descripcion: 'Feriados y conmemoración nacional pagados por salario promedio', activa: true },
  { id: 'act-01', codigo: 'ACT-01', nombre: 'Otras Activ. Ajenas', descripcion: 'Otras actividades ajenas e ingresos autorizados', activa: false }
];

export const DEFAULT_ESCALA_SALARIAL = [
  { id: 'cargo-1', nombre: 'Cuadro de Dirección', salarioEscala: 6500, catOcupacionalDefault: 'C' as const, grupoEscala: 'Grupo XVI', descripcion: 'Personal de dirección y cuadros' },
  { id: 'cargo-2', nombre: 'Especialista Principal', salarioEscala: 5200, catOcupacionalDefault: 'T' as const, grupoEscala: 'Grupo XIII', descripcion: 'Técnicos superiores y especialistas' },
  { id: 'cargo-3', nombre: 'Técnico de Nivel Medio', salarioEscala: 4800, catOcupacionalDefault: 'T' as const, grupoEscala: 'Grupo XI', descripcion: 'Técnicos medios e inspectores' },
  { id: 'cargo-4', nombre: 'Operario de Mantenimiento', salarioEscala: 4200, catOcupacionalDefault: 'O' as const, grupoEscala: 'Grupo VIII', descripcion: 'Mantenimiento y electromecánica' },
  { id: 'cargo-5', nombre: 'Operario Calificado', salarioEscala: 3800, catOcupacionalDefault: 'O' as const, grupoEscala: 'Grupo VI', descripcion: 'Operadores de planta y logística' },
  { id: 'cargo-6', nombre: 'Analista de Finanzas', salarioEscala: 5100, catOcupacionalDefault: 'T' as const, grupoEscala: 'Grupo XII', descripcion: 'Contabilidad y tesorería' },
  { id: 'cargo-7', nombre: 'Auxiliar Administrativo', salarioEscala: 3600, catOcupacionalDefault: 'A' as const, grupoEscala: 'Grupo V', descripcion: 'Gestión documental y apoyo' },
  { id: 'cargo-8', nombre: 'Auxiliar de Servicios', salarioEscala: 3200, catOcupacionalDefault: 'S' as const, grupoEscala: 'Grupo III', descripcion: 'Servicios generales y custodia' }
];

export const DEFAULT_PAYROLL_SETTINGS: PayrollSettings = {
  moneda: 'USD',
  simboloMoneda: '$',
  periodoNombre: 'Agosto 2026',
  diasBaseMes: 30,
  horasJornadaMensual: 190.6,
  
  // Divisor legal Código de Trabajo Cubano: 190.6 horas
  divisorHorasMes: 190.6,
  
  // Factores de Horas Extras
  factorExtraDiurna: 1.25, // 25% recargo
  factorExtraNocturna: 1.75, // 75% recargo
  factorExtraFestiva: 2.0, // 100% recargo (doble)
  
  // Impuestos y Contribuciones - Código Laboral y Ley Tributaria de Cuba (Sector Estatal)
  tasaCESS: 5.0, // 5% Contribución Especial a la Seguridad Social (Ley 113)
  aplicarISIP: true,
  tasaISIP: 5.0, // 5% Impuesto sobre Ingresos Personales sobre exceso de mínimo exento
  umbralExentoISIP: 3260, // Mínimo exento legal mensual del sector estatal cubano

  // Aportes Patronales Estatales de la Entidad Empleadora (Cuba)
  tasaSeguridadSocialPatronal: 12.5, // 12.5% Contribución a la Seguridad Social Patronal
  tasaFuerzaTrabajoPatronal: 5.0, // 5.0% Impuesto por la Utilización de la Fuerza de Trabajo (IUFT)

  // Subsidio de transporte: 0 (no existe en sector estatal cubano)
  subsidioTransporteMensual: 0,
  topeSubsidioTransporte: 0,
  
  // Escala Salarial por Cargo y Antigüedad
  escalaCargos: DEFAULT_ESCALA_SALARIAL,
  escalasAntiguedad: DEFAULT_SENIORITY_TIERS,
  montosGradosAcademicos: {
    licenciatura: 300,
    especialidad: 450,
    maestria: 600,
    doctorado: 900
  },

  // Responsables oficiales unificados para todos los Centros de Costo (se configuran una sola vez)
  firmasGlobales: {
    confecciona: 'DAYSI REYES DÍAZ',
    chequea: 'PEDRO ALBERTO GALBÁN LOPEZ',
    aprueba: 'ZUNILDA MENDEZ LINARES',
    anota: 'ELIESER DUARTES LÓPEZ'
  },

  // Centros de Costo de la empresa
  centrosCosto: DEFAULT_CENTROS_COSTO,

  // Claves y leyendas de deducciones
  clavesDeduccion: DEFAULT_CLAVES_DEDUCCION,

  // Tarifas de nocturnidad configurables
  tarifasNocturnidad: DEFAULT_TARIFAS_NOCTURNIDAD,

  // Claves de actividades ajenas configurables
  clavesActividadesAjenas: DEFAULT_CLAVES_ACTIVIDADES_AJENAS
};

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-001',
    identificacion: '1098452101',
    nombre: 'Carlos Andrés',
    apellidos: 'Gómez Restrepo',
    cargo: 'Líder Técnico de Software',
    departamento: 'Tecnología',
    tipoContrato: 'indefinido',
    fechaIngreso: '2023-03-15',
    salarioBase: 4200,
    diasTrabajados: 30,
    diasAusencia: 0,
    horasExtrasDiurnas: 0,
    horasExtrasNocturnas: 4,
    horasExtrasFestivas: 0,
    bonoPuntualidad: 150,
    comisiones: 0,
    otrosIngresos: 0,
    aplicaSubsidioTransporte: false,
    anticipos: 0,
    prestamos: 0,
    otrasDeducciones: 0,
    estado: 'aprobado',
    email: 'carlos.gomez@empresa.com',
    notas: 'Horas nocturnas por guardia técnica.'
  },
  {
    id: 'emp-002',
    identificacion: '1023849502',
    nombre: 'Valeria',
    apellidos: 'Martínez Silva',
    cargo: 'Ejecutiva Senior de Cuentas',
    departamento: 'Ventas',
    tipoContrato: 'indefinido',
    fechaIngreso: '2023-08-01',
    salarioBase: 2100,
    diasTrabajados: 30,
    diasAusencia: 0,
    horasExtrasDiurnas: 0,
    horasExtrasNocturnas: 0,
    horasExtrasFestivas: 0,
    bonoPuntualidad: 100,
    comisiones: 850,
    otrosIngresos: 0,
    aplicaSubsidioTransporte: false,
    anticipos: 0,
    prestamos: 0,
    otrasDeducciones: 0,
    estado: 'revisado',
    email: 'valeria.martinez@empresa.com',
    notas: 'Comisión por cumplimiento de plan de servicios.'
  },
  {
    id: 'emp-003',
    identificacion: '1074928193',
    nombre: 'Mateo Alejandro',
    apellidos: 'Morales Vargas',
    cargo: 'Técnico de Mantenimiento y Planta',
    departamento: 'Operaciones',
    tipoContrato: 'fijo',
    fechaIngreso: '2024-01-10',
    salarioBase: 1450,
    diasTrabajados: 30,
    diasAusencia: 0,
    horasExtrasDiurnas: 12,
    horasExtrasNocturnas: 8,
    horasExtrasFestivas: 6,
    bonoPuntualidad: 80,
    comisiones: 0,
    otrosIngresos: 0,
    aplicaSubsidioTransporte: false,
    anticipos: 0,
    prestamos: 0,
    otrasDeducciones: 0,
    estado: 'aprobado',
    email: 'mateo.morales@empresa.com',
    notas: 'Guardia técnica en fin de semana festivo.'
  },
  {
    id: 'emp-004',
    identificacion: '1048291034',
    nombre: 'Camila Sofía',
    apellidos: 'Herrera Ortiz',
    cargo: 'Analista de Talento Humano',
    departamento: 'Recursos Humanos',
    tipoContrato: 'indefinido',
    fechaIngreso: '2024-05-18',
    salarioBase: 1950,
    diasTrabajados: 30,
    diasAusencia: 0,
    horasExtrasDiurnas: 2,
    horasExtrasNocturnas: 0,
    horasExtrasFestivas: 0,
    bonoPuntualidad: 70,
    comisiones: 0,
    otrosIngresos: 0,
    aplicaSubsidioTransporte: false,
    anticipos: 0,
    prestamos: 0,
    otrasDeducciones: 0,
    estado: 'revisado',
    email: 'camila.herrera@empresa.com',
    notas: 'Especialista en recursos humanos.'
  },
  {
    id: 'emp-005',
    identificacion: '1019284755',
    nombre: 'Diego Fernando',
    apellidos: 'Castro Pineda',
    cargo: 'Operador Logístico',
    departamento: 'Operaciones',
    tipoContrato: 'fijo',
    fechaIngreso: '2024-09-01',
    salarioBase: 1300,
    diasTrabajados: 29,
    diasAusencia: 1,
    horasExtrasDiurnas: 8,
    horasExtrasNocturnas: 0,
    horasExtrasFestivas: 4,
    bonoPuntualidad: 0,
    comisiones: 0,
    otrosIngresos: 0,
    aplicaSubsidioTransporte: false,
    anticipos: 0,
    prestamos: 0,
    otrasDeducciones: 0,
    estado: 'borrador',
    email: 'diego.castro@empresa.com',
    notas: '1 día de ausencia no justificada el día 14.'
  },
  {
    id: 'emp-006',
    identificacion: '1063948276',
    nombre: 'Lucía Elena',
    apellidos: 'Cifuentes Rojas',
    cargo: 'Contadora General',
    departamento: 'Finanzas',
    tipoContrato: 'indefinido',
    fechaIngreso: '2022-11-01',
    salarioBase: 3600,
    diasTrabajados: 30,
    diasAusencia: 0,
    horasExtrasDiurnas: 0,
    horasExtrasNocturnas: 0,
    horasExtrasFestivas: 0,
    bonoPuntualidad: 120,
    comisiones: 0,
    otrosIngresos: 200,
    aplicaSubsidioTransporte: false,
    anticipos: 0,
    prestamos: 0,
    otrasDeducciones: 0,
    estado: 'aprobado',
    email: 'lucia.cifuentes@empresa.com',
    notas: 'Bono extraordinario por cierre fiscal de periodo.'
  },
  {
    id: 'emp-007',
    identificacion: '1088293747',
    nombre: 'Javier Andrés',
    apellidos: 'Navarro Benítez',
    cargo: 'Diseñador de Producto UI/UX',
    departamento: 'Tecnología',
    tipoContrato: 'indefinido',
    fechaIngreso: '2024-03-01',
    salarioBase: 2800,
    diasTrabajados: 30,
    diasAusencia: 0,
    horasExtrasDiurnas: 0,
    horasExtrasNocturnas: 0,
    horasExtrasFestivas: 0,
    bonoPuntualidad: 100,
    comisiones: 0,
    otrosIngresos: 0,
    aplicaSubsidioTransporte: false,
    anticipos: 0,
    prestamos: 0,
    otrasDeducciones: 0,
    estado: 'revisado',
    email: 'javier.navarro@empresa.com',
    notas: 'Diseñador de aplicaciones.'
  },
  {
    id: 'emp-008',
    identificacion: '1038491828',
    nombre: 'Daniela',
    apellidos: 'Pérez Quintero',
    cargo: 'Auxiliar Administrativa',
    departamento: 'Administración',
    tipoContrato: 'fijo',
    fechaIngreso: '2025-02-15',
    salarioBase: 1250,
    diasTrabajados: 30,
    diasAusencia: 0,
    horasExtrasDiurnas: 4,
    horasExtrasNocturnas: 0,
    horasExtrasFestivas: 0,
    bonoPuntualidad: 60,
    comisiones: 0,
    otrosIngresos: 0,
    aplicaSubsidioTransporte: false,
    anticipos: 0,
    prestamos: 0,
    otrasDeducciones: 0,
    estado: 'aprobado',
    email: 'daniela.perez@empresa.com',
    notas: 'Trabajadora estatal con retención oficial CESS (5%).'
  }
];

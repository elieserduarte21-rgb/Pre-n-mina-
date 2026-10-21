import { Employee, PayrollSettings, CalculationBreakdown, EmployeeWithCalculation, PayrollTotals } from '../types/payroll';

/**
 * Redondea un número a 2 decimales para precisión contable
 */
export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Calcula el desglose completo de nómina para un empleado según la configuración activa
 */
export function calculateEmployeePayroll(employee: Employee, settings: PayrollSettings): CalculationBreakdown {
  const diasBase = settings.diasBaseMes || 30;
  const horasMes = settings.horasJornadaMensual || 240;
  
  // Salario diario y valor hora ordinaria
  const salarioDiario = employee.salarioBase > 0 ? employee.salarioBase / diasBase : 0;
  const valorHoraOrdinaria = employee.salarioBase > 0 ? employee.salarioBase / horasMes : 0;
  
  // Días trabajados y ausencias
  const diasEfectivos = Math.max(0, Math.min(diasBase, employee.diasTrabajados - employee.diasAusencia));
  const sueldoBasicoDevengado = roundCurrency(salarioDiario * diasEfectivos);
  const descuentoAusencias = roundCurrency(salarioDiario * employee.diasAusencia);
  
  // Cálculo de horas extras
  const valorExtrasDiurnas = roundCurrency(
    (employee.horasExtrasDiurnas || 0) * valorHoraOrdinaria * settings.factorExtraDiurna
  );
  const valorExtrasNocturnas = roundCurrency(
    (employee.horasExtrasNocturnas || 0) * valorHoraOrdinaria * settings.factorExtraNocturna
  );
  const valorExtrasFestivas = roundCurrency(
    (employee.horasExtrasFestivas || 0) * valorHoraOrdinaria * settings.factorExtraFestiva
  );
  const totalHorasExtras = roundCurrency(valorExtrasDiurnas + valorExtrasNocturnas + valorExtrasFestivas);
  
  // Subsidio de transporte de ley (aplica si está marcado o si el salario base es menor o igual al tope establecido)
  const aplicaSubsidio = employee.aplicaSubsidioTransporte || 
    (settings.topeSubsidioTransporte > 0 && employee.salarioBase <= settings.topeSubsidioTransporte);
  
  const subsidioTransporteEfectivo = aplicaSubsidio && diasEfectivos > 0
    ? roundCurrency((settings.subsidioTransporteMensual / diasBase) * diasEfectivos)
    : 0;
  
  // Bonos, comisiones y otros devengados
  const totalBonosYComisiones = roundCurrency(
    (employee.bonoPuntualidad || 0) + (employee.comisiones || 0) + (employee.otrosIngresos || 0)
  );
  
  // TOTAL DEVENGADO (Ingreso Bruto del empleado)
  const totalDevengado = roundCurrency(
    sueldoBasicoDevengado + totalHorasExtras + subsidioTransporteEfectivo + totalBonosYComisiones
  );
  
  // Base de cotización para aportes de seguridad social (el auxilio de transporte no es factor salarial)
  const baseCotizacion = roundCurrency(
    Math.max(0, totalDevengado - subsidioTransporteEfectivo)
  );
  
  // Deducciones de ley del trabajador
  const deduccionSalud = roundCurrency(baseCotizacion * (settings.tasaSaludTrabajador / 100));
  const deduccionPension = roundCurrency(baseCotizacion * (settings.tasaPensionTrabajador / 100));
  
  // Fondo de solidaridad pensional (aplica sobre bases altas)
  const deduccionFondoSolidaridad = (settings.umbralFondoSolidaridad > 0 && baseCotizacion >= settings.umbralFondoSolidaridad)
    ? roundCurrency(baseCotizacion * (settings.tasaFondoSolidaridad / 100))
    : 0;
  
  // Retención en la fuente (IRPF / ISR)
  let deduccionRetencionFuente = 0;
  if (employee.retencionFuenteManual !== null && employee.retencionFuenteManual !== undefined) {
    deduccionRetencionFuente = roundCurrency(employee.retencionFuenteManual);
  } else if (settings.aplicarRetencionAutomatica && baseCotizacion > settings.umbralRetencion) {
    const baseGravable = baseCotizacion - settings.umbralRetencion;
    deduccionRetencionFuente = roundCurrency(baseGravable * (settings.tasaRetencionEstimada / 100));
  }
  
  const totalDeduccionesLey = roundCurrency(
    deduccionSalud + deduccionPension + deduccionFondoSolidaridad + deduccionRetencionFuente
  );
  
  // Otras deducciones (anticipos, préstamos, deducciones adicionales)
  const totalOtrasDeducciones = roundCurrency(
    (employee.anticipos || 0) + (employee.prestamos || 0) + (employee.otrasDeducciones || 0)
  );
  
  // TOTAL DEDUCCIONES
  const totalDeducciones = roundCurrency(totalDeduccionesLey + totalOtrasDeducciones);
  
  // SALARIO NETO A PAGAR AL TRABAJADOR
  const salarioNeto = roundCurrency(Math.max(0, totalDevengado - totalDeducciones));
  
  // CARGAS PATRONALES (Aportes que paga el empleador por ley)
  const costoSaludPatronal = roundCurrency(baseCotizacion * (settings.tasaSaludPatronal / 100));
  const costoPensionPatronal = roundCurrency(baseCotizacion * (settings.tasaPensionPatronal / 100));
  const costoRiesgosLaborales = roundCurrency(baseCotizacion * (settings.tasaRiesgosLaborales / 100));
  const costoPrestacionesSociales = roundCurrency(baseCotizacion * (settings.tasaPrestacionesSociales / 100));
  
  const totalCargasPatronales = roundCurrency(
    costoSaludPatronal + costoPensionPatronal + costoRiesgosLaborales + costoPrestacionesSociales
  );
  
  const costoTotalEmpresa = roundCurrency(totalDevengado + totalCargasPatronales);
  
  return {
    salarioDiario: roundCurrency(salarioDiario),
    valorHoraOrdinaria: roundCurrency(valorHoraOrdinaria),
    sueldoBasicoDevengado,
    descuentoAusencias,
    valorExtrasDiurnas,
    valorExtrasNocturnas,
    valorExtrasFestivas,
    totalHorasExtras,
    subsidioTransporteEfectivo,
    totalBonosYComisiones,
    totalDevengado,
    baseCotizacion,
    deduccionSalud,
    deduccionPension,
    deduccionFondoSolidaridad,
    deduccionRetencionFuente,
    totalDeduccionesLey,
    totalOtrasDeducciones,
    totalDeducciones,
    salarioNeto,
    costoSaludPatronal,
    costoPensionPatronal,
    costoRiesgosLaborales,
    costoPrestacionesSociales,
    totalCargasPatronales,
    costoTotalEmpresa
  };
}

/**
 * Calcula los totales consolidados de la prenómina para la lista completa de empleados
 */
export function calculatePayrollTotals(employees: EmployeeWithCalculation[]): PayrollTotals {
  return employees.reduce<PayrollTotals>(
    (acc, emp) => {
      acc.totalEmpleados += 1;
      acc.totalSalarioBase += emp.salarioBase;
      acc.totalDevengado += emp.calculo.totalDevengado;
      acc.totalHorasExtras += emp.calculo.totalHorasExtras;
      acc.totalSubsidioTransporte += emp.calculo.subsidioTransporteEfectivo;
      acc.totalBonos += emp.calculo.totalBonosYComisiones;
      acc.totalSaludTrabajador += emp.calculo.deduccionSalud;
      acc.totalPensionTrabajador += emp.calculo.deduccionPension;
      acc.totalRetencionFuente += emp.calculo.deduccionRetencionFuente;
      acc.totalDeducciones += emp.calculo.totalDeducciones;
      acc.totalNetoPagar += emp.calculo.salarioNeto;
      acc.totalCargasPatronales += emp.calculo.totalCargasPatronales;
      acc.costoTotalEmpresa += emp.calculo.costoTotalEmpresa;
      return acc;
    },
    {
      totalEmpleados: 0,
      totalSalarioBase: 0,
      totalDevengado: 0,
      totalHorasExtras: 0,
      totalSubsidioTransporte: 0,
      totalBonos: 0,
      totalSaludTrabajador: 0,
      totalPensionTrabajador: 0,
      totalRetencionFuente: 0,
      totalDeducciones: 0,
      totalNetoPagar: 0,
      totalCargasPatronales: 0,
      costoTotalEmpresa: 0
    }
  );
}

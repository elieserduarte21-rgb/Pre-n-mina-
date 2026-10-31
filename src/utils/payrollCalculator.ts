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
  
  // Subsidio de transporte: NO EXISTE en el sector estatal cubano (Ley 116 Código de Trabajo)
  const subsidioTransporteEfectivo = 0;
  
  // Bonos, comisiones y otros devengados
  const totalBonosYComisiones = roundCurrency(
    (employee.bonoPuntualidad || 0) + (employee.comisiones || 0) + (employee.otrosIngresos || 0)
  );
  
  // TOTAL DEVENGADO (Ingreso Bruto del empleado estatal)
  const totalDevengado = roundCurrency(
    sueldoBasicoDevengado + totalHorasExtras + totalBonosYComisiones
  );
  
  // Base imponible para tributos estatales (la totalidad de los ingresos devengados)
  const baseCotizacion = totalDevengado;
  
  // =========================================================================
  // IMPUESTOS Y CONTRIBUCIONES DEL TRABAJADOR ESTATAL (Ley 116 y Ley 113 de Cuba)
  // =========================================================================
  
  // 1. Contribución Especial a la Seguridad Social (CESS) - 5% sobre ingresos devengados
  const tasaCESS = settings.tasaCESS ?? 5.0;
  const deduccionCESS = roundCurrency(baseCotizacion * (tasaCESS / 100));
  
  // 2. Impuesto sobre los Ingresos Personales (ISIP)
  // Retención mensual según escala tributaria del sector estatal sobre ingresos que superen el mínimo exento legal
  let deduccionISIP = 0;
  if (employee.retencionFuenteManual !== null && employee.retencionFuenteManual !== undefined) {
    deduccionISIP = roundCurrency(employee.retencionFuenteManual);
  } else {
    const aplicarISIP = settings.aplicarISIP ?? settings.aplicarRetencionAutomatica ?? true;
    const umbral = settings.umbralExentoISIP ?? settings.umbralRetencion ?? 3260;
    const tasa = settings.tasaISIP ?? settings.tasaRetencionEstimada ?? 5.0;
    if (aplicarISIP && baseCotizacion > umbral) {
      const baseGravable = baseCotizacion - umbral;
      deduccionISIP = roundCurrency(baseGravable * (tasa / 100));
    }
  }
  
  // Mapeos de retrocompatibilidad
  const deduccionSalud = deduccionCESS;
  const deduccionPension = 0;
  const deduccionFondoSolidaridad = 0;
  const deduccionRetencionFuente = deduccionISIP;
  
  // TOTAL DEDUCCIONES DE LEY ESTATALES
  const totalDeduccionesLey = roundCurrency(deduccionCESS + deduccionISIP);
  
  // Otras deducciones (anticipos, préstamos y otras deducciones descartados para trabajadores estatales)
  const totalOtrasDeducciones = 0;
  
  // TOTAL DEDUCCIONES (estrictamente retenciones de ley: CESS + ISIP)
  const totalDeducciones = totalDeduccionesLey;
  
  // SALARIO NETO A PAGAR AL TRABAJADOR
  const salarioNeto = roundCurrency(Math.max(0, totalDevengado - totalDeducciones));
  
  // =========================================================================
  // CARGAS PATRONALES ESTATALES DE LA ENTIDAD EMPLEADORA (Cuba)
  // =========================================================================
  // Contribución a la Seguridad Social Patronal: 12.5%
  const tasaSSPatronal = settings.tasaSeguridadSocialPatronal ?? 12.5;
  const costoSeguridadSocialPatronal = roundCurrency(baseCotizacion * (tasaSSPatronal / 100));
  
  // Impuesto por la Utilización de la Fuerza de Trabajo (IUFT): 5.0%
  const tasaFTPatronal = settings.tasaFuerzaTrabajoPatronal ?? 5.0;
  const costoFuerzaTrabajoPatronal = roundCurrency(baseCotizacion * (tasaFTPatronal / 100));
  
  // Total cargas patronales (12.5% + 5.0% = 17.5% de la masa salarial)
  const totalCargasPatronales = roundCurrency(costoSeguridadSocialPatronal + costoFuerzaTrabajoPatronal);
  
  // Mapeos de compatibilidad
  const costoSaludPatronal = costoSeguridadSocialPatronal;
  const costoPensionPatronal = costoFuerzaTrabajoPatronal;
  const costoRiesgosLaborales = 0;
  const costoPrestacionesSociales = 0;
  
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
    deduccionCESS,
    deduccionISIP,
    deduccionSalud,
    deduccionPension,
    deduccionFondoSolidaridad,
    deduccionRetencionFuente,
    totalDeduccionesLey,
    totalOtrasDeducciones,
    totalDeducciones,
    salarioNeto,
    costoSeguridadSocialPatronal,
    costoFuerzaTrabajoPatronal,
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
      acc.totalSubsidioTransporte += 0;
      acc.totalBonos += emp.calculo.totalBonosYComisiones;
      acc.totalCESS += emp.calculo.deduccionCESS;
      acc.totalISIP += emp.calculo.deduccionISIP;
      acc.totalSeguridadSocialPatronal += emp.calculo.costoSeguridadSocialPatronal;
      acc.totalFuerzaTrabajoPatronal += emp.calculo.costoFuerzaTrabajoPatronal;
      acc.totalSaludTrabajador += emp.calculo.deduccionCESS;
      acc.totalPensionTrabajador += 0;
      acc.totalRetencionFuente += emp.calculo.deduccionISIP;
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
      totalCESS: 0,
      totalISIP: 0,
      totalSeguridadSocialPatronal: 0,
      totalFuerzaTrabajoPatronal: 0,
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

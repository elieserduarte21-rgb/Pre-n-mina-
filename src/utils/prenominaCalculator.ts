import { 
  EmployeePrenomina, 
  EmployeeWithPrenominaCalc, 
  TotalesPrenomina, 
  PayrollSettings,
  ClaveDeduccion,
  TarifaNocturnidad
} from '../types/payroll';
import { DEFAULT_TARIFAS_NOCTURNIDAD, DEFAULT_CLAVES_DEDUCCION } from '../data/defaultData';

/**
 * Divisor oficial establecido en el Código de Trabajo cubano: 190.6 horas
 */
export const DIVISOR_HORAS_TRABAJO_CUBA = 190.6;

/**
 * Obtiene el valor en horas de una deducción específica para un trabajador,
 * con soporte para claves dinámicas y compatibilidad con campos legados.
 */
export function getDeduccionValue(emp: EmployeePrenomina, codigo: string): number {
  if (emp.deduccionesValores && emp.deduccionesValores[codigo] !== undefined) {
    return emp.deduccionesValores[codigo] || 0;
  }
  // Mapeo retrocompatible
  switch (codigo) {
    case 'C-82':
      return emp.deducciones?.vacacSimultanC82 || 0;
    case 'C-10':
    case 'C-11':
      return emp.deducciones?.ausInjustJustC10_C11 || 0;
    case 'C-20':
      return emp.deducciones?.cMedC20 || 0;
    case 'C-25':
      return emp.deducciones?.vacacPlanifC25 || 0;
    case 'C-27':
      return emp.deducciones?.bajaC27 || 0;
    case 'C-30':
      return emp.deducciones?.nuevoIngC30 || 0;
    case 'C-31':
      return emp.deducciones?.trasladoC31 || 0;
    default:
      return 0;
  }
}

/**
 * Obtiene la cantidad de una tarifa de nocturnidad para un trabajador.
 */
export function getNocturnidadCantidad(emp: EmployeePrenomina, codigo: string): number {
  if (emp.nocturnidadValores && emp.nocturnidadValores[codigo] !== undefined) {
    return emp.nocturnidadValores[codigo] || 0;
  }
  if (codigo === 'nochesComp100') return emp.nocturnidad?.nochesComp100 || 0;
  if (codigo === 'horas5') return emp.nocturnidad?.horas5 || 0;
  if (codigo === 'horas10') return emp.nocturnidad?.horas10 || 0;
  return 0;
}

/**
 * Calcula el tiempo real laborado sumando los valores numéricos de los días 1 al 31.
 * Los descansos 'D' no suman horas trabajadas.
 * 'V' indica Vacaciones.
 */
export function calculateEmployeeTime(emp: EmployeePrenomina): { tiempoRealLaborado: number; horasVacaciones: number } {
  let horasLaboradas = 0;
  let countV = 0;

  emp.dias.forEach(d => {
    const trimmed = (d || '').trim().toUpperCase();
    if (trimmed === 'V') {
      countV++;
    } else if (trimmed === 'D') {
      // Descanso semanal programado
    } else {
      const num = parseFloat(trimmed);
      if (!isNaN(num) && num > 0) {
        horasLaboradas += num;
      }
    }
  });

  // Vacaciones C-25 registradas o estimadas
  const vacRegistradas = getDeduccionValue(emp, 'C-25');
  const horasVacaciones = vacRegistradas > 0 ? vacRegistradas : (countV > 0 ? countV * 8 : 0);

  const tiempoRealLaborado = Math.round(horasLaboradas * 100) / 100;

  return { tiempoRealLaborado, horasVacaciones };
}

/**
 * Calcula el desglose monetario según horas trabajadas y divisor legal (190.6),
 * aplicando tarifas de nocturnidad y deducciones configuradas.
 */
export function calculatePrenominaEmployee(emp: EmployeePrenomina, settings?: PayrollSettings): EmployeeWithPrenominaCalc {
  const { tiempoRealLaborado, horasVacaciones } = calculateEmployeeTime(emp);

  const divisorLegal = settings?.divisorHorasMes || DIVISOR_HORAS_TRABAJO_CUBA;
  const salarioBasico = emp.salarioBasicoEscala || 4800;
  
  // Tarifa horaria legal: Salario del cargo / 190.6 horas
  const tarifaHoraria = Math.round((salarioBasico / divisorLegal) * 10000) / 10000;

  // Cálculo de nocturnidad según tarifas configuradas
  const tarifasNoct: TarifaNocturnidad[] = settings?.tarifasNocturnidad || DEFAULT_TARIFAS_NOCTURNIDAD;
  let totalNocturnidadCalc = 0;
  let hasDynamicNoct = false;

  tarifasNoct.filter(t => t.activa).forEach(t => {
    const cant = getNocturnidadCantidad(emp, t.codigo);
    if (cant > 0) {
      totalNocturnidadCalc += cant * t.tarifa;
      hasDynamicNoct = true;
    }
  });

  const totalNocturnidad = hasDynamicNoct 
    ? Math.round(totalNocturnidadCalc * 100) / 100
    : (emp.nocturnidad?.totalNocturnidad || 0);

  // Pagos adicionales (Nocturnidad + Trabajo Extra C-74 / Doblajes + Actividades Ajenas)
  const totalPagosAdicionales = Math.round(
    (totalNocturnidad + (emp.trabajoExtra?.importe || 0) + (emp.activAjenas || 0)) * 100
  ) / 100;

  // Deducciones en horas dinámicas según claves configuradas
  const clavesDed: ClaveDeduccion[] = settings?.clavesDeduccion || DEFAULT_CLAVES_DEDUCCION;
  let totalDeduccionesHoras = 0;
  clavesDed.filter(c => c.activa !== false).forEach(c => {
    const val = getDeduccionValue(emp, c.codigo);
    totalDeduccionesHoras += val;
  });

  // Salario por horas efectivas trabajadas
  const salarioTiempoLaborado = Math.round(tiempoRealLaborado * tarifaHoraria * 100) / 100;
  const salarioVacaciones = Math.round(horasVacaciones * tarifaHoraria * 100) / 100;
  
  const salarioTotalEstimado = Math.round((salarioTiempoLaborado + salarioVacaciones + totalPagosAdicionales) * 100) / 100;

  return {
    ...emp,
    tiempoRealLaborado,
    horasVacacionesCalculadas: horasVacaciones,
    totalPagosAdicionales,
    totalDeduccionesHoras,
    salarioTiempoLaborado,
    salarioVacaciones,
    tarifaHoraria: Math.round(tarifaHoraria * 100) / 100,
    salarioTotalEstimado
  };
}

/**
 * Calcula los totales consolidados de la hoja de prenómina oficial
 */
export function calculateOfficialPrenominaTotals(employees: EmployeeWithPrenominaCalc[]): TotalesPrenomina {
  return employees.reduce<TotalesPrenomina>(
    (acc, emp) => {
      acc.totalEmpleados += 1;
      acc.totalFondoTiempo += emp.fondoTiempoIndividual || 185;
      acc.totalTiempoRealLaborado += emp.tiempoRealLaborado;
      acc.totalNochesComp100 += emp.nocturnidad?.nochesComp100 || 0;
      acc.totalHoras5 += emp.nocturnidad?.horas5 || 0;
      acc.totalHoras10 += emp.nocturnidad?.horas10 || 0;
      acc.totalImporteNocturnidad += emp.nocturnidad?.totalNocturnidad || 0;
      acc.totalHorasExtra += emp.trabajoExtra?.horas || 0;
      acc.totalImporteTrabajoExtra += emp.trabajoExtra?.importe || 0;
      acc.totalActivAjenas += emp.activAjenas || 0;
      acc.totalVacacSimultanC82 += getDeduccionValue(emp, 'C-82');
      acc.totalAusInjustJustC10 += getDeduccionValue(emp, 'C-10') || getDeduccionValue(emp, 'C-11');
      acc.totalCMedC20 += getDeduccionValue(emp, 'C-20');
      acc.totalVacacPlanifC25 += getDeduccionValue(emp, 'C-25') || emp.horasVacacionesCalculadas || 0;
      acc.totalBajaC27 += getDeduccionValue(emp, 'C-27');
      acc.totalNuevoIngC30 += getDeduccionValue(emp, 'C-30');
      acc.totalTrasladoC31 += getDeduccionValue(emp, 'C-31');
      acc.granTotalImporte += emp.salarioTotalEstimado;
      return acc;
    },
    {
      totalEmpleados: 0,
      totalFondoTiempo: 0,
      totalTiempoRealLaborado: 0,
      totalNochesComp100: 0,
      totalHoras5: 0,
      totalHoras10: 0,
      totalImporteNocturnidad: 0,
      totalHorasExtra: 0,
      totalImporteTrabajoExtra: 0,
      totalActivAjenas: 0,
      totalVacacSimultanC82: 0,
      totalAusInjustJustC10: 0,
      totalCMedC20: 0,
      totalVacacPlanifC25: 0,
      totalBajaC27: 0,
      totalNuevoIngC30: 0,
      totalTrasladoC31: 0,
      granTotalImporte: 0
    }
  );
}

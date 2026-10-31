import { 
  EmployeePrenomina, 
  EmployeeWithPrenominaCalc, 
  HeaderPrenomina,
  TotalesPrenomina, 
  PayrollSettings,
  ClaveDeduccion,
  TarifaNocturnidad,
  SeniorityTier,
  GradoAcademico
} from '../types/payroll';
import { DEFAULT_TARIFAS_NOCTURNIDAD, DEFAULT_CLAVES_DEDUCCION, DEFAULT_SENIORITY_TIERS } from '../data/defaultData';

/**
 * Divisor oficial establecido en el Código de Trabajo cubano: 190.6 horas
 */
export const DIVISOR_HORAS_TRABAJO_CUBA = 190.6;

/**
 * Suma las horas de deducción derivadas automáticamente de las claves presentes en los días del mes (dias).
 * Responde siempre a la cantidad de horas según la jornada del trabajador para ese día.
 */
export function getDeduccionHoursFromDays(emp: EmployeePrenomina, codigo: string): number {
  let countHours = 0;
  const defaultShift = getWorkerDefaultShiftHours(emp);
  const targetCode = codigo.toUpperCase().replace('-', '');

  emp.dias.forEach((d, idx) => {
    const text = (d || '').trim().toUpperCase();
    if (!text) return;

    let isMatch = false;
    if (codigo.toUpperCase() === 'C-25' && text === 'V') {
      isMatch = true;
    } else {
      const normalizedCell = text.replace('-', '');
      if (normalizedCell === targetCode || normalizedCell.startsWith(targetCode)) {
        isMatch = true;
      }
    }

    if (isMatch) {
      // Si la celda trae un número explícito fuera del código (ej. C-25:4), usar ese número
      const cellWithoutCode = text
        .replace('C-25', '')
        .replace('C25', '')
        .replace('V', '')
        .replace(codigo.toUpperCase(), '')
        .replace('-', '')
        .trim();
      const explicitNum = cellWithoutCode ? parseFloat(cellWithoutCode.replace(/[^0-9.]/g, '')) : NaN;

      if (!isNaN(explicitNum) && explicitNum > 0) {
        countHours += explicitNum;
      } else {
        // Horas según la jornada del trabajador para ese día
        let dayShift = defaultShift;
        if (emp.fondoTiempoIndividual === 185) {
          if ([6, 13, 19, 26].includes(idx)) {
            dayShift = 8; // Viernes en jornada 185h
          } else {
            dayShift = 9; // Lunes a Jueves en jornada 185h
          }
        }
        countHours += dayShift;
      }
    }
  });

  return Math.round(countHours * 100) / 100;
}

/**
 * Claves de actividades ajenas que se computan en horas (tiempo que debió trabajar el trabajador)
 * y SE SUMAN al tiempo real trabajado (C-82, C-85, C-57, C-72 y sus variantes sin guion).
 */
export const CLAVES_TIEMPO_REAL_AJENAS = ['C-82', 'C-85', 'C-57', 'C-72', 'C-69'] as const;

export function isClaveTiempoRealAjena(codigo: string): boolean {
  if (!codigo) return false;
  const norm = codigo.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return ['C82', 'C85', 'C57', 'C72', 'C69'].includes(norm);
}

export function normalizeClaveTiempoReal(codigo: string): string {
  const norm = (codigo || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (norm === 'C82') return 'C-82';
  if (norm === 'C85') return 'C-85';
  if (norm === 'C57') return 'C-57';
  if (norm === 'C72') return 'C-72';
  if (norm === 'C69') return 'C-69';
  return codigo;
}

export function getWorkerScheduledShiftForDay(emp: EmployeePrenomina, dayIdx: number): number {
  if (emp.fondoTiempoIndividual === 192 || emp.dias?.some(d => (d || '').trim() === '24')) {
    return 24;
  }
  if (emp.fondoTiempoIndividual === 200) {
    return 12.5;
  }
  if (emp.fondoTiempoIndividual === 188) {
    return 8;
  }
  if (emp.fondoTiempoIndividual === 185) {
    const dayOfWeek = (dayIdx + 5) % 7;
    // En jornada 185h los viernes son de 8h, Lunes a Jueves son de 9h
    if (dayOfWeek === 4 || [6, 13, 20, 27].includes(dayIdx)) {
      return 8;
    }
    return 9;
  }

  // Si no está especificado el fondo individual, inferir del resto de días del trabajador
  const typicalShift = getWorkerDefaultShiftHours(emp);
  if (typicalShift === 24) return 24;
  if (typicalShift === 9 || emp.dias?.some(d => (d || '').trim() === '9')) {
    const dayOfWeek = (dayIdx + 5) % 7;
    if (dayOfWeek === 4 || [6, 13, 20, 27].includes(dayIdx)) return 8;
    return 9;
  }
  if (typicalShift === 12.5 || emp.dias?.some(d => (d || '').trim() === '12.5')) {
    return 12.5;
  }

  return typicalShift > 0 ? typicalShift : 8;
}

export function extractHoursFromDayCell(text: string, defaultHours: number, targetCodigo?: string): number {
  if (!text) return defaultHours;
  let clean = text.trim().toUpperCase();

  // Eliminar el código de la clave para que sus dígitos no se confundan con horas
  // (ej. C-82, C82, C-85, C85, C-57, C57, C-72, C72, C-70, C-74, C-25, etc.)
  if (targetCodigo) {
    const rawNum = targetCodigo.toUpperCase().replace(/[^0-9]/g, '');
    if (rawNum) {
      clean = clean.replace(new RegExp(`C\\-?${rawNum}`, 'gi'), ' ').trim();
    }
  } else {
    clean = clean.replace(/C\-?\d+/gi, ' ').trim();
  }

  // Quitar separadores y letras
  const withoutLetters = clean.replace(/[A-Z\-:_()\/]/g, ' ').trim();
  const parts = withoutLetters.split(/\s+/).filter(Boolean);

  if (parts.length > 0) {
    const parsed = parseFloat(parts[0]);
    // Si queda un número explícito válido (ej. "4" en "4 C-82" o "C-82:4")
    if (!isNaN(parsed) && parsed > 0 && parsed <= 24) {
      return parsed;
    }
  }

  // Si solo venía el código (ej. "C-82"), corresponde la jornada que debió trabajar ese día
  return defaultHours;
}

export function dayCellMatchesClave(cellText: string, targetCodigo: string): boolean {
  const textNorm = (cellText || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const targetNorm = (targetCodigo || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!textNorm || !targetNorm) return false;
  return textNorm.includes(targetNorm);
}

/**
 * Calcula las horas derivadas de días para actividades ajenas (C-82, C-85, C-57, C-72).
 * Si la celda trae horas explícitas las usa; si no, aplica el tiempo que debió trabajar ese día.
 */
export function calculateActividadAjenaHoursFromDays(emp: EmployeePrenomina, codigo: string): number {
  let countHours = 0;
  const targetNorm = normalizeClaveTiempoReal(codigo);
  emp.dias.forEach((d, idx) => {
    const text = (d || '').trim();
    if (!text) return;
    if (dayCellMatchesClave(text, targetNorm)) {
      const scheduledShift = getWorkerScheduledShiftForDay(emp, idx);
      const hours = extractHoursFromDayCell(text, scheduledShift, targetNorm);
      countHours += hours;
    }
  });
  return Math.round(countHours * 100) / 100;
}

/**
 * Obtiene las horas totales de una actividad ajena de tiempo real (C-82, C-85, C-57, C-72),
 * sumando las horas de días con las ingresadas manualmente en la columna.
 */
export function getActividadAjenaHours(emp: EmployeePrenomina, codigo: string): number {
  const norm = normalizeClaveTiempoReal(codigo);
  let manual = 0;
  if (emp.activAjenasValores) {
    if (emp.activAjenasValores[norm] !== undefined) {
      manual = emp.activAjenasValores[norm] || 0;
    } else if (emp.activAjenasValores[codigo] !== undefined) {
      manual = emp.activAjenasValores[codigo] || 0;
    } else {
      const withoutHyphen = norm.replace('-', '');
      if (emp.activAjenasValores[withoutHyphen] !== undefined) {
        manual = emp.activAjenasValores[withoutHyphen] || 0;
      }
    }
  }
  // Compatibilidad histórica para C-82
  if (norm === 'C-82' && manual === 0) {
    if (emp.deduccionesValores?.['C-82']) {
      manual = emp.deduccionesValores['C-82'];
    } else if (emp.deducciones?.vacacSimultanC82) {
      manual = emp.deducciones.vacacSimultanC82;
    }
  }

  const fromDays = calculateActividadAjenaHoursFromDays(emp, norm);
  return Math.round((manual + fromDays) * 100) / 100;
}

/**
 * Calcula las horas de C-82 (Vacaciones Simultáneas / Actividad Ajena)
 * derivadas de las celdas de días que contengan "C-82" o "C82".
 */
export function calculateC82HoursFromDays(emp: EmployeePrenomina): number {
  return calculateActividadAjenaHoursFromDays(emp, 'C-82');
}

/**
 * Obtiene las horas totales de C-82 (como Actividad Ajena que suma al tiempo real trabajado),
 * combinando horas de días y horas ingresadas en la columna de actividades ajenas.
 */
export function getC82Hours(emp: EmployeePrenomina): number {
  return getActividadAjenaHours(emp, 'C-82');
}

export function getWorkerAverageHourlyRate(emp: EmployeePrenomina): number | null {
  try {
    const raw = localStorage.getItem('salario_promedio_historico_trabajadores_v2');
    if (!raw) return null;
    const mapa = JSON.parse(raw);
    const workerKey = emp.id;
    const expedienteKey = emp.numeroExpediente;
    const meses = mapa[workerKey] || (expedienteKey ? mapa[expedienteKey] : null);

    if (Array.isArray(meses) && meses.length > 0) {
      let totalDevengado = 0;
      let totalHoras = 0;
      let totalDias = 0;

      meses.forEach((m: any) => {
        const dev = (Number(m.salarioEscala) || 0) +
          (Number(m.antiguedadYGrado) || 0) +
          (Number(m.nocturnidad) || 0) +
          (Number(m.horasExtras) || 0) +
          (Number(m.estimulacionResultados) || 0) +
          (Number(m.otrosDevengosComputables) || 0);
        totalDevengado += dev;
        totalHoras += Number(m.horasLaboradas) || 0;
        totalDias += Number(m.diasLaborados) || 0;
      });

      if (totalHoras > 0) {
        return Math.round((totalDevengado / totalHoras) * 10000) / 10000;
      } else if (totalDias > 0) {
        const diario = totalDevengado / totalDias;
        return Math.round((diario / 8) * 10000) / 10000;
      }
    }
  } catch (e) {
    console.warn('Error reading average salary rate for worker', e);
  }
  return null;
}

/**
 * Calcula las horas de C-54 Movilización Militar derivadas de los días.
 */
export function calculateC54HoursFromDays(emp: EmployeePrenomina): number {
  let countHours = 0;
  emp.dias.forEach((d, idx) => {
    const text = (d || '').trim();
    if (!text) return;
    if (dayCellMatchesClave(text, 'C-54')) {
      const scheduledShift = getWorkerScheduledShiftForDay(emp, idx);
      const hours = extractHoursFromDayCell(text, scheduledShift, 'C-54');
      countHours += hours;
    }
  });
  return Math.round(countHours * 100) / 100;
}

/**
 * Obtiene las horas totales de C-54 (Movilización Militar pagada por tarifa promedio).
 */
export function getC54Hours(emp: EmployeePrenomina): number {
  let manual = 0;
  if (emp.activAjenasValores) {
    if (emp.activAjenasValores['C-54'] !== undefined) {
      manual = emp.activAjenasValores['C-54'] || 0;
    } else if (emp.activAjenasValores['C54'] !== undefined) {
      manual = emp.activAjenasValores['C54'] || 0;
    }
  }
  const fromDays = calculateC54HoursFromDays(emp);
  return Math.round((manual + fromDays) * 100) / 100;
}

export function calculateC70HoursFromDays(emp: EmployeePrenomina): number {
  let c70Hours = 0;
  const defaultHours = getWorkerDefaultShiftHours(emp);
  emp.dias.forEach(d => {
    const text = (d || '').trim().toUpperCase();
    if (text.includes('C-70') || text.includes('C70')) {
      const numMatch = text.match(/^([\d.]+)/);
      if (numMatch) {
        const val = parseFloat(numMatch[1]);
        c70Hours += (!isNaN(val) && val > 0 ? val : defaultHours);
      } else {
        c70Hours += defaultHours;
      }
    }
  });
  return Math.round(c70Hours * 100) / 100;
}

export function getC70Hours(emp: EmployeePrenomina): number {
  let manual = 0;
  if (emp.activAjenasValores && emp.activAjenasValores['C-70'] !== undefined) {
    manual = emp.activAjenasValores['C-70'] || 0;
  } else if (emp.deduccionesValores && emp.deduccionesValores['C-70'] !== undefined) {
    manual = emp.deduccionesValores['C-70'] || 0;
  }
  const fromDays = calculateC70HoursFromDays(emp);
  return Math.round((manual + fromDays) * 100) / 100;
}

/**
 * Obtiene el valor total en horas de una deducción específica para un trabajador.
 * IMPORTANTE: C-82 ha sido reclasificada como Actividad Ajena que suma al tiempo trabajado,
 * por lo que queda excluida de las deducciones oficiales.
 */
export function getDeduccionValue(emp: EmployeePrenomina, codigo: string): number {
  // C-82, C-85, C-57, C-72 NO son deducciones, son Actividades Ajenas que suman al tiempo trabajado
  if (isClaveTiempoRealAjena(codigo)) {
    return 0;
  }

  let manualValue = 0;
  if (emp.deduccionesValores && emp.deduccionesValores[codigo] !== undefined) {
    manualValue = emp.deduccionesValores[codigo] || 0;
  } else {
    // Mapeo retrocompatible
    switch (codigo) {
      case 'C-10':
      case 'C-11':
        manualValue = emp.deducciones?.ausInjustJustC10_C11 || 0;
        break;
      case 'C-20':
        manualValue = emp.deducciones?.cMedC20 || 0;
        break;
      case 'C-25':
        manualValue = emp.deducciones?.vacacPlanifC25 || 0;
        break;
      case 'C-27':
        manualValue = emp.deducciones?.bajaC27 || 0;
        break;
      case 'C-30':
        manualValue = emp.deducciones?.nuevoIngC30 || 0;
        break;
      case 'C-31':
        manualValue = emp.deducciones?.trasladoC31 || 0;
        break;
      default:
        manualValue = 0;
    }
  }

  const daysValue = getDeduccionHoursFromDays(emp, codigo);
  return Math.round((manualValue + daysValue) * 100) / 100;
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
 * Determina la duración de la jornada / turno del trabajador para calcular C-74 por defecto.
 */
export function getWorkerDefaultShiftHours(emp: EmployeePrenomina): number {
  if (emp.fondoTiempoIndividual === 192 || emp.dias?.some(d => (d || '').trim() === '24')) {
    return 24;
  }
  if (emp.fondoTiempoIndividual === 200) {
    return 12.5;
  }
  if (emp.fondoTiempoIndividual === 188) {
    return 8;
  }
  // Buscar en los días un número típico de jornada (ej. 24, 12.5, 9 u 8)
  for (const d of emp.dias) {
    const text = (d || '').trim().toUpperCase();
    if (text !== 'V' && text !== 'D' && !text.includes('C-74') && !text.includes('C74')) {
      const num = parseFloat(text);
      if (!isNaN(num) && num > 0) {
        return num;
      }
    }
  }
  return emp.fondoTiempoIndividual === 185 ? 9 : 8;
}

/**
 * Calcula las horas de doblaje C-74 derivadas de las celdas de días que contengan "C-74" o "C74".
 */
export function calculateC74HoursFromDays(emp: EmployeePrenomina): number {
  let c74Hours = 0;
  const defaultHours = getWorkerDefaultShiftHours(emp);
  emp.dias.forEach(d => {
    const text = (d || '').trim().toUpperCase();
    if (text.includes('C-74') || text.includes('C74')) {
      const numMatch = text.match(/^([\d.]+)/);
      if (numMatch) {
        const val = parseFloat(numMatch[1]);
        if (!isNaN(val) && val > 0) {
          c74Hours += val;
        } else {
          c74Hours += defaultHours;
        }
      } else {
        c74Hours += defaultHours;
      }
    }
  });
  return Math.round(c74Hours * 100) / 100;
}

/**
 * Calcula el tiempo real laborado sumando los valores numéricos de los días 1 al 31.
 * Los descansos 'D' no suman horas trabajadas.
 * 'V' indica Vacaciones.
 * C-74 indica Doblajes / Horas Extras.
 * C-82, C-85, C-57, C-72 son ACTIVIDADES AJENAS y sus horas SE SUMAN al tiempo real trabajado.
 */
export function calculateEmployeeTime(emp: EmployeePrenomina): { 
  tiempoRealLaborado: number; 
  horasVacaciones: number; 
  horasC74: number; 
  horasC82: number;
  horasC54: number;
  horasActivAjenasTiempoReal: Record<string, number>;
} {
  let horasLaboradas = 0;
  let countV = 0;
  let horasC74 = 0;
  const defaultHours = getWorkerDefaultShiftHours(emp);

  const horasFromDaysByClave: Record<string, number> = {
    'C-82': 0,
    'C-85': 0,
    'C-57': 0,
    'C-72': 0,
    'C-69': 0
  };

  emp.dias.forEach((d, idx) => {
    const text = (d || '').trim().toUpperCase();
    if (text === 'V') {
      countV++;
    } else if (text === 'D') {
      // Descanso semanal programado
    } else if (text.includes('C-74') || text.includes('C74')) {
      const numMatch = text.match(/^([\d.]+)/);
      const val = numMatch ? parseFloat(numMatch[1]) : defaultHours;
      horasC74 += (!isNaN(val) && val > 0 ? val : defaultHours);
    } else if (dayCellMatchesClave(text, 'C-54') || dayCellMatchesClave(text, 'C-70')) {
      // C-54 (Movilización Militar) y C-70 (Feriados no trabajados) se pagan por tarifa promedio en pagos adicionales
    } else {
      // Verificar si es alguna de las actividades ajenas de tiempo real: C-82, C-85, C-57, C-72
      let matchedClave: string | null = null;
      for (const clave of CLAVES_TIEMPO_REAL_AJENAS) {
        if (dayCellMatchesClave(text, clave)) {
          matchedClave = clave;
          break;
        }
      }

      if (matchedClave) {
        const scheduledShift = getWorkerScheduledShiftForDay(emp, idx);
        const h = extractHoursFromDayCell(text, scheduledShift, matchedClave);
        horasFromDaysByClave[matchedClave] = (horasFromDaysByClave[matchedClave] || 0) + h;
        // SE SUMA AL TIEMPO TOTAL REAL LABORADO
        horasLaboradas += h;
      } else {
        const num = parseFloat(text);
        if (!isNaN(num) && num > 0) {
          horasLaboradas += num;
        }
      }
    }
  });

  // Horas manuales ingresadas en actividades ajenas para C-82, C-85, C-57, C-72
  let totalManualAjeno = 0;
  const horasTotalByClave: Record<string, number> = {};

  for (const clave of CLAVES_TIEMPO_REAL_AJENAS) {
    let manualVal = 0;
    if (emp.activAjenasValores) {
      if (emp.activAjenasValores[clave] !== undefined) {
        manualVal = emp.activAjenasValores[clave] || 0;
      } else {
        const withoutHyphen = clave.replace('-', '');
        if (emp.activAjenasValores[withoutHyphen] !== undefined) {
          manualVal = emp.activAjenasValores[withoutHyphen] || 0;
        }
      }
    }
    if (clave === 'C-82' && manualVal === 0) {
      if (emp.deduccionesValores?.['C-82']) {
        manualVal = emp.deduccionesValores['C-82'];
      } else if (emp.deducciones?.vacacSimultanC82) {
        manualVal = emp.deducciones.vacacSimultanC82;
      }
    }
    totalManualAjeno += manualVal;
    horasTotalByClave[clave] = Math.round(((horasFromDaysByClave[clave] || 0) + manualVal) * 100) / 100;
  }

  // Las horas de actividades ajenas (C-82, C-85, C-57, C-72) tanto de días como manuales
  // SE SUMAN AL TIEMPO TOTAL REAL LABORADO
  const tiempoRealLaborado = Math.round((horasLaboradas + totalManualAjeno) * 100) / 100;
  const totalHorasC82 = horasTotalByClave['C-82'] || 0;

  // Vacaciones C-25 registradas o estimadas
  const vacRegistradas = getDeduccionValue(emp, 'C-25');
  const horasVacaciones = vacRegistradas > 0 ? vacRegistradas : (countV > 0 ? countV * 8 : 0);

  const horasC54 = getC54Hours(emp);

  return { 
    tiempoRealLaborado, 
    horasVacaciones, 
    horasC74: Math.round(horasC74 * 100) / 100, 
    horasC82: totalHorasC82,
    horasC54,
    horasActivAjenasTiempoReal: horasTotalByClave 
  };
}

/**
 * Calcula los años de antigüedad y el monto correspondiente según la fecha de ingreso y las escalas configuradas.
 */
export function calculateWorkerSeniority(emp: EmployeePrenomina, settings?: PayrollSettings): { anios: number; monto: number } {
  if (!emp.fechaIngreso) {
    return { anios: 0, monto: emp.montoAntiguedadManual || 0 };
  }

  const ingresoDate = new Date(emp.fechaIngreso);
  if (isNaN(ingresoDate.getTime())) {
    return { anios: 0, monto: emp.montoAntiguedadManual || 0 };
  }

  const now = new Date();
  const diffTime = now.getTime() - ingresoDate.getTime();
  const anios = Math.max(0, Math.floor(diffTime / (365.25 * 24 * 60 * 60 * 1000)));

  if (emp.montoAntiguedadManual !== undefined && emp.montoAntiguedadManual > 0) {
    return { anios, monto: emp.montoAntiguedadManual };
  }

  const tiers: SeniorityTier[] = settings?.escalasAntiguedad || DEFAULT_SENIORITY_TIERS;
  let monto = 0;
  for (const tier of tiers) {
    if (anios >= tier.minYears && anios <= tier.maxYears) {
      monto = tier.amount;
      break;
    } else if (anios > tier.maxYears && tier.maxYears >= 15) {
      monto = tier.amount;
    }
  }

  return { anios, monto };
}

/**
 * Calcula el monto correspondiente por grado académico (Licenciatura, Maestría, Doctorado, Especialidad).
 */
export function calculateWorkerGradoAcademico(emp: EmployeePrenomina, settings?: PayrollSettings): { grado: GradoAcademico; monto: number } {
  const grado = emp.gradoAcademico || 'ninguno';
  if (grado === 'ninguno') {
    return { grado, monto: emp.montoGradoAcademicoManual !== undefined ? emp.montoGradoAcademicoManual : 0 };
  }
  if (emp.montoGradoAcademicoManual !== undefined && emp.montoGradoAcademicoManual >= 0) {
    return { grado, monto: emp.montoGradoAcademicoManual };
  }
  const montos = settings?.montosGradosAcademicos || {
    licenciatura: 300,
    especialidad: 450,
    maestria: 600,
    doctorado: 900
  };
  return { grado, monto: montos[grado] || 0 };
}

/**
 * Calcula el desglose monetario según horas trabajadas y divisor legal (190.6),
 * aplicando tarifas de nocturnidad y deducciones configuradas.
 */
export function calculatePrenominaEmployee(emp: EmployeePrenomina, settings?: PayrollSettings): EmployeeWithPrenominaCalc {
  const { tiempoRealLaborado, horasVacaciones, horasC74 } = calculateEmployeeTime(emp);

  const divisorLegal = settings?.divisorHorasMes || DIVISOR_HORAS_TRABAJO_CUBA;
  const { anios: aniosAntiguedad, monto: montoAntiguedadCalculado } = calculateWorkerSeniority(emp, settings);
  const { grado: gradoAcademicoVal, monto: montoGradoAcademicoCalculado } = calculateWorkerGradoAcademico(emp, settings);

  const salarioBaseEscala = emp.salarioBasicoEscala || 4800;
  const salarioBasicoTotal = salarioBaseEscala + montoAntiguedadCalculado + montoGradoAcademicoCalculado;
  
  // Tarifa horaria legal: (Salario Escala + Antigüedad + Grado Académico) / Divisor horas (190.6)
  const tarifaHoraria = Math.round((salarioBasicoTotal / divisorLegal) * 10000) / 10000;

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

  // Doblajes C-74 (desde días) + Horas Extras (manuales)
  const factor = settings?.factorExtraFestiva || 2.0;
  const horasExtrasManuales = emp.trabajoExtra?.horas || 0;
  
  const importeC74 = Math.round(horasC74 * tarifaHoraria * factor * 100) / 100;
  const importeExtras = (emp.trabajoExtra?.importe && emp.trabajoExtra.importe > 0 && horasExtrasManuales === 0)
    ? emp.trabajoExtra.importe
    : Math.round(horasExtrasManuales * tarifaHoraria * factor * 100) / 100;
  
  const totalTrabajoExtraImporte = Math.round((importeC74 + importeExtras) * 100) / 100;

  // Pagos adicionales (Nocturnidad + Trabajo Extra / C-74 + Actividades Ajenas)
  // NOTA: Las horas de C-82, C-85, C-57, C-72 ya están integradas y remuneradas dentro de tiempoRealLaborado * tarifaHoraria.
  // Otras actividades ajenas en importe ($) que no sean claves de tiempo real ni C-70 ni C-54:
  let otrasActivAjenasImporte = 0;
  if (emp.activAjenasValores) {
    Object.entries(emp.activAjenasValores).forEach(([k, v]) => {
      const normK = k.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (!isClaveTiempoRealAjena(k) && normK !== 'C70' && normK !== 'C54') {
        otrasActivAjenasImporte += Number(v) || 0;
      }
    });
  } else if (emp.activAjenas) {
    otrasActivAjenasImporte = emp.activAjenas;
  }

  // Clave C-54 (Movilización Militar) y C-70 (Feriados no trabajados) pagados por Salario Promedio
  const tarifaPromedioWorker = getWorkerAverageHourlyRate(emp) || tarifaHoraria;

  const horasC70 = getC70Hours(emp);
  const importeC70 = Math.round(horasC70 * tarifaPromedioWorker * 100) / 100;

  const horasC54 = getC54Hours(emp);
  const importeC54 = Math.round(horasC54 * tarifaPromedioWorker * 100) / 100;

  const totalPagosAdicionales = Math.round(
    (totalNocturnidad + totalTrabajoExtraImporte + otrasActivAjenasImporte + importeC70 + importeC54) * 100
  ) / 100;

  // Deducciones en horas dinámicas según claves configuradas (C-82, C-85, C-57, C-72 excluidas de deducciones)
  const clavesDed: ClaveDeduccion[] = settings?.clavesDeduccion || DEFAULT_CLAVES_DEDUCCION;
  let totalDeduccionesHoras = 0;
  clavesDed.filter(c => c.activa !== false && !isClaveTiempoRealAjena(c.codigo)).forEach(c => {
    const val = getDeduccionValue(emp, c.codigo);
    totalDeduccionesHoras += val;
  });

  // Salario por horas efectivas trabajadas (incluyendo horas de C-82)
  const salarioTiempoLaborado = Math.round(tiempoRealLaborado * tarifaHoraria * 100) / 100;
  const salarioVacaciones = Math.round(horasVacaciones * tarifaHoraria * 100) / 100;
  
  const salarioTotalEstimado = Math.round((salarioTiempoLaborado + salarioVacaciones + totalPagosAdicionales) * 100) / 100;

  return {
    ...emp,
    catOcupacional: emp.catOcupacional || 'T',
    gradoAcademico: gradoAcademicoVal,
    tiempoRealLaborado,
    horasVacacionesCalculadas: horasVacaciones,
    totalPagosAdicionales,
    totalDeduccionesHoras,
    salarioTiempoLaborado,
    salarioVacaciones,
    tarifaHoraria: Math.round(tarifaHoraria * 100) / 100,
    salarioTotalEstimado,
    aniosAntiguedad,
    montoAntiguedadCalculado,
    montoGradoAcademicoCalculado,
    salarioBasicoTotal: Math.round(salarioBasicoTotal * 100) / 100
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
      acc.totalVacacSimultanC82 += getC82Hours(emp);
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

/**
 * Extrae el número de mes (1 al 12) a partir del encabezado de la prenómina o configuración.
 */
export function parseMonthFromHeader(header?: HeaderPrenomina, settings?: PayrollSettings): number {
  if (header?.periodoCorresponde) {
    const str = header.periodoCorresponde.toString().trim().toLowerCase();
    const num = parseInt(str, 10);
    if (!isNaN(num) && num >= 1 && num <= 12) return num;
    if (str.includes('enero') || str.includes('jan')) return 1;
    if (str.includes('febrero') || str.includes('feb')) return 2;
    if (str.includes('marzo') || str.includes('mar')) return 3;
    if (str.includes('abril') || str.includes('apr')) return 4;
    if (str.includes('mayo') || str.includes('may')) return 5;
    if (str.includes('junio') || str.includes('jun')) return 6;
    if (str.includes('julio') || str.includes('jul')) return 7;
    if (str.includes('agosto') || str.includes('ago')) return 8;
    if (str.includes('septiembre') || str.includes('sep')) return 9;
    if (str.includes('octubre') || str.includes('oct')) return 10;
    if (str.includes('noviembre') || str.includes('nov')) return 11;
    if (str.includes('diciembre') || str.includes('dic')) return 12;
  }
  if (header?.fechaDesde) {
    const str = header.fechaDesde.toString().trim().toLowerCase();
    if (str.includes('enero')) return 1;
    if (str.includes('febrero')) return 2;
    if (str.includes('marzo')) return 3;
    if (str.includes('abril')) return 4;
    if (str.includes('mayo')) return 5;
    if (str.includes('junio')) return 6;
    if (str.includes('julio')) return 7;
    if (str.includes('agosto')) return 8;
    if (str.includes('septiembre')) return 9;
    if (str.includes('octubre')) return 10;
    if (str.includes('noviembre')) return 11;
    if (str.includes('diciembre')) return 12;
    const parts = str.split(/[\/\-\.]/);
    if (parts.length >= 2) {
      const m = parseInt(parts[1], 10);
      if (!isNaN(m) && m >= 1 && m <= 12) return m;
    }
  }
  if (settings?.periodoNombre) {
    const str = settings.periodoNombre.toLowerCase();
    if (str.includes('enero')) return 1;
    if (str.includes('febrero')) return 2;
    if (str.includes('marzo')) return 3;
    if (str.includes('abril')) return 4;
    if (str.includes('mayo')) return 5;
    if (str.includes('junio')) return 6;
    if (str.includes('julio')) return 7;
    if (str.includes('agosto')) return 8;
    if (str.includes('septiembre')) return 9;
    if (str.includes('octubre')) return 10;
    if (str.includes('noviembre')) return 11;
    if (str.includes('diciembre')) return 12;
  }
  return 8; // Por defecto Agosto
}

/**
 * Obtiene el mapa de Días Feriados Oficiales y de Conmemoración Nacional en Cuba (Ley No. 116 Código de Trabajo).
 * Retorna un objeto donde la clave es el número de día (1 al 31) y el valor es el nombre oficial del feriado.
 */
export function getCubanHolidaysForMonth(month: number): Record<number, string> {
  const holidays: Record<number, string> = {};
  if (month === 1) {
    holidays[1] = '1 de Enero — Día de la Liberación / Aniversario de la Revolución';
    holidays[2] = '2 de Enero — Día de la Victoria';
  } else if (month === 5) {
    holidays[1] = '1ro de Mayo — Día Internacional de los Trabajadores';
  } else if (month === 7) {
    holidays[25] = '25 de Julio — Conmemoración del Asalto al Cuartel Moncada';
    holidays[26] = '26 de Julio — Día de la Rebeldía Nacional';
    holidays[27] = '27 de Julio — Conmemoración del Asalto al Cuartel Moncada';
  } else if (month === 10) {
    holidays[10] = '10 de Octubre — Inicio de las Guerras de Independencia (1868)';
  } else if (month === 12) {
    holidays[25] = '25 de Diciembre — Navidad';
    holidays[31] = '31 de Diciembre — Fin de Año';
  }
  return holidays;
}

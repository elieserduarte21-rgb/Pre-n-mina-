import * as XLSX from 'xlsx';
import { EmployeePrenomina, CentroCosto, EscalaSalarialCargo, ClaveDeduccion, TarifaNocturnidad, ClaveActividadAjena } from '../types/payroll';
import { getActividadAjenaHours } from './prenominaCalculator';

/**
 * Utility to download genuine Excel (.xlsx) workbooks with multiple or single sheets.
 */
export function exportWorkbookToExcel(
  filename: string,
  sheets: { name: string; data: Record<string, any>[] }[]
) {
  const wb = XLSX.utils.book_new();

  sheets.forEach(({ name, data }) => {
    const sanitizedName = (name || 'Hoja1').replace(/[*?:/\\\[\]]/g, '').slice(0, 31);
    const ws = XLSX.utils.json_to_sheet(data.length > 0 ? data : [{ Info: 'Sin registros' }]);

    if (data.length > 0) {
      const keys = Object.keys(data[0]);
      ws['!cols'] = keys.map(k => {
        let maxLen = k.length;
        data.forEach(row => {
          const valStr = row[k] !== undefined && row[k] !== null ? String(row[k]) : '';
          if (valStr.length > maxLen) maxLen = Math.min(valStr.length, 40);
        });
        return { wch: Math.max(maxLen + 3, 10) };
      });
    }

    XLSX.utils.book_append_sheet(wb, ws, sanitizedName);
  });

  const fullFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, fullFilename);
}

/**
 * Reads any .xlsx, .xls, or .csv file and parses all sheets as JSON arrays.
 */
export async function readExcelFile(file: File): Promise<Record<string, Record<string, any>[]>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = e => {
      try {
        const buffer = e.target?.result;
        if (!buffer) {
          resolve({});
          return;
        }
        const wb = XLSX.read(buffer, { type: 'array' });
        const result: Record<string, Record<string, any>[]> = {};

        wb.SheetNames.forEach(sheetName => {
          const ws = wb.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });
          result[sheetName] = json;
        });

        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = err => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

// ==========================================
// TRABAJADORES (PRENÓMINA OFICIAL / ASIGNACIÓN)
// ==========================================

export function exportOfficialEmployeesToExcel(employees: EmployeePrenomina[], ccCodigo: string = 'CC') {
  const data = employees.map((emp, index) => {
    const row: Record<string, any> = {
      'No': index + 1,
      'Centro Costo': emp.centroCostoId || ccCodigo,
      'Expediente': emp.numeroExpediente || '',
      'Nombre y Apellidos': emp.nombreApellidos || '',
      'Cargo': emp.cargo || '',
      'Categoría': emp.catOcupacional || 'O',
      'Salario Escala ($)': emp.salarioBasicoEscala || 4800,
      'Antigüedad ($)': emp.montoAntiguedadManual || 0,
      'Fecha Ingreso': emp.fechaIngreso || '2015-01-01'
    };

    for (let d = 1; d <= 31; d++) {
      row[`Día ${d}`] = emp.dias && emp.dias[d - 1] !== undefined ? emp.dias[d - 1] : '';
    }

    row['Noct. Noches ($100)'] = emp.nocturnidad?.nochesComp100 || 0;
    row['Noct. Horas ($5)'] = emp.nocturnidad?.horas5 || 0;
    row['Noct. Horas ($10)'] = emp.nocturnidad?.horas10 || 0;

    row['C-82 Horas (Act. Ajena)'] = getActividadAjenaHours(emp, 'C-82');
    row['C-85 Horas (Act. Ajena)'] = getActividadAjenaHours(emp, 'C-85');
    row['C-57 Horas (Act. Ajena)'] = getActividadAjenaHours(emp, 'C-57');
    row['C-72 Horas (Act. Ajena)'] = getActividadAjenaHours(emp, 'C-72');
    row['C-25 Vacaciones ($/h)'] = emp.deduccionesValores?.['C-25'] ?? emp.deducciones?.vacacPlanifC25 ?? 0;
    row['C-20 Médico ($/h)'] = emp.deduccionesValores?.['C-20'] ?? emp.deducciones?.cMedC20 ?? 0;
    row['C-10 Ausencias ($/h)'] = emp.deduccionesValores?.['C-10'] ?? emp.deducciones?.ausInjustJustC10_C11 ?? 0;
    row['C-27 Bajas ($/h)'] = emp.deduccionesValores?.['C-27'] ?? emp.deducciones?.bajaC27 ?? 0;
    row['Fecha Baja'] = emp.fechaBaja || '';
    row['Motivo Baja'] = emp.motivoBaja || '';
    row['C-74 Sindical ($/h)'] = emp.activAjenasValores?.['C-74'] ?? 0;

    return row;
  });

  exportWorkbookToExcel(`Prenomina_Trabajadores_${ccCodigo}_${new Date().toISOString().slice(0, 10)}`, [
    { name: 'Trabajadores', data }
  ]);
}

export function parseOfficialEmployeesFromExcel(
  rows: Record<string, any>[],
  targetCCId: string
): EmployeePrenomina[] {
  return rows
    .filter(r => r['Nombre y Apellidos'] || r['nombre'] || r['Nombre'] || r['Trabajador'])
    .map((r, idx) => {
      const nombre = (r['Nombre y Apellidos'] || r['nombre'] || r['Nombre'] || r['Trabajador'] || `Trabajador ${idx + 1}`).toString().trim();
      const expediente = (r['Expediente'] || r['expediente'] || r['No'] || `${idx + 1}`).toString().trim();
      const cargo = (r['Cargo'] || r['cargo'] || 'Operario').toString().trim();
      const categoria = (r['Categoría'] || r['categoria'] || r['Cat'] || 'O').toString().trim().toUpperCase() as any;
      const salarioEscala = parseFloat(r['Salario Escala ($)'] || r['Salario Escala'] || r['salario'] || r['Salario'] || 0) || 4800;
      const montoAntiguedad = parseFloat(r['Antigüedad ($)'] || r['antiguedad'] || 0) || 0;
      const fechaIncorporacion = (r['Fecha Ingreso'] || r['fechaIngreso'] || '2015-01-01').toString();

      const dias: string[] = [];
      for (let d = 1; d <= 31; d++) {
        const val = r[`Día ${d}`] !== undefined ? String(r[`Día ${d}`]).trim() : (r[`dia_${d}`] !== undefined ? String(r[`dia_${d}`]).trim() : '8');
        dias.push(val);
      }

      const c82Hours = parseFloat(r['C-82 Horas (Act. Ajena)'] || r['C-82'] || r['c82'] || 0) || 0;
      const c85Hours = parseFloat(r['C-85 Horas (Act. Ajena)'] || r['C-85'] || r['c85'] || 0) || 0;
      const c57Hours = parseFloat(r['C-57 Horas (Act. Ajena)'] || r['C-57'] || r['c57'] || 0) || 0;
      const c72Hours = parseFloat(r['C-72 Horas (Act. Ajena)'] || r['C-72'] || r['c72'] || 0) || 0;
      const c25Val = parseFloat(r['C-25 Vacaciones ($/h)'] || r['C-25'] || 0) || 0;
      const c20Val = parseFloat(r['C-20 Médico ($/h)'] || r['C-20'] || 0) || 0;
      const c10Val = parseFloat(r['C-10 Ausencias ($/h)'] || r['C-10'] || 0) || 0;
      const c74Val = parseFloat(r['C-74 Sindical ($/h)'] || r['C-74'] || 0) || 0;

      const emp: EmployeePrenomina = {
        id: `emp-imp-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        numeroExpediente: expediente,
        nombreApellidos: nombre,
        cargo: cargo,
        catOcupacional: ['T', 'C', 'O', 'A', 'S'].includes(categoria) ? categoria : 'O',
        salarioBasicoEscala: salarioEscala,
        montoAntiguedadManual: montoAntiguedad,
        fechaIngreso: fechaIncorporacion,
        dias: dias,
        centroCostoId: targetCCId,
        nocturnidad: {
          nochesComp100: parseFloat(r['Noct. Noches ($100)'] || 0) || 0,
          horas5: parseFloat(r['Noct. Horas ($5)'] || 0) || 0,
          horas10: parseFloat(r['Noct. Horas ($10)'] || 0) || 0,
          totalNocturnidad: 0
        },
        trabajoExtra: {
          horas: 0,
          importe: 0
        },
        activAjenas: 0,
        activAjenasValores: {
          'C-82': c82Hours,
          'C-85': c85Hours,
          'C-57': c57Hours,
          'C-72': c72Hours,
          'C-74': c74Val
        },
        deduccionesValores: {
          'C-25': c25Val,
          'C-20': c20Val,
          'C-10': c10Val
        },
        deducciones: {
          vacacPlanifC25: c25Val,
          cMedC20: c20Val,
          ausInjustJustC10_C11: c10Val,
          bajaC27: 0,
          nuevoIngC30: 0,
          trasladoC31: 0,
          vacacSimultanC82: c82Hours
        }
      };

      return emp;
    });
}

// ==========================================
// ESCALA SALARIAL
// ==========================================

export function exportEscalaToExcel(escala: EscalaSalarialCargo[]) {
  const data = escala.map(e => ({
    'Grupo Complejidad': e.grupoEscala || '',
    'Denominación Cargo': e.nombre || '',
    'Salario Escala ($)': e.salarioEscala || 0,
    'Tarifa Horaria ($/h)': Number(((e.salarioEscala || 0) / 190.6).toFixed(4))
  }));

  exportWorkbookToExcel('Escala_Salarial_Cargos', [{ name: 'Escala Salarial', data }]);
}

export function parseEscalaFromExcel(rows: Record<string, any>[]): EscalaSalarialCargo[] {
  return rows
    .filter(r => r['Denominación Cargo'] || r['Cargo'] || r['cargo'])
    .map((r, idx) => ({
      id: `escala-${Date.now()}-${idx}`,
      grupoEscala: (r['Grupo Complejidad'] || r['Grupo'] || r['grupo'] || `G-${idx + 1}`).toString().trim(),
      nombre: (r['Denominación Cargo'] || r['Cargo'] || r['cargo'] || '').toString().trim(),
      salarioEscala: parseFloat(r['Salario Escala ($)'] || r['Salario'] || r['salario'] || 0) || 4800,
      catOcupacionalDefault: 'O'
    }));
}

// ==========================================
// CENTROS DE COSTO
// ==========================================

export function exportCentrosCostoToExcel(ccs: CentroCosto[]) {
  const data = ccs.map(cc => ({
    'Código CC': cc.codigoCC,
    'Nombre del Centro': cc.nombre,
    'Descripción / Área': cc.descripcion || '',
    'Código REEUP': cc.codigoREEUP || '151.0.4897'
  }));

  exportWorkbookToExcel('Centros_de_Costo_Empresa', [{ name: 'Centros de Costo', data }]);
}

export function parseCentrosCostoFromExcel(rows: Record<string, any>[]): Partial<CentroCosto>[] {
  return rows
    .filter(r => r['Código CC'] || r['Nombre del Centro'] || r['nombre'])
    .map((r, idx) => ({
      id: `cc-${Date.now()}-${idx}`,
      codigoCC: (r['Código CC'] || r['codigo'] || `CC ${100 + idx}`).toString().trim(),
      nombre: (r['Nombre del Centro'] || r['nombre'] || 'ÁREA').toString().trim().toUpperCase(),
      descripcion: (r['Descripción / Área'] || r['descripcion'] || '').toString().trim(),
      codigoREEUP: (r['Código REEUP'] || r['reeup'] || '151.0.4897').toString().trim()
    }));
}

// ==========================================
// CLAVES Y TARIFAS
// ==========================================

export function exportClavesAndTarifasToExcel(
  deducciones: ClaveDeduccion[],
  nocturnidad: TarifaNocturnidad[],
  activAjenas: ClaveActividadAjena[]
) {
  const dataDed = deducciones.map(d => ({
    'Código': d.codigo,
    'Nombre': d.nombre,
    'Tipo': d.tipo,
    'Descripción': d.descripcion || '',
    'Activa': d.activa !== false ? 'SÍ' : 'NO'
  }));

  const dataNoct = nocturnidad.map(n => ({
    'Código ID': n.codigo,
    'Nombre': n.nombre,
    'Tarifa ($)': n.tarifa,
    'Tipo': n.tipo === 'noche' ? 'Por Noche' : 'Por Hora',
    'Activa': n.activa !== false ? 'SÍ' : 'NO'
  }));

  const dataAct = activAjenas.map(a => ({
    'Código': a.codigo,
    'Nombre': a.nombre,
    'Descripción': a.descripcion || '',
    'Activa': a.activa !== false ? 'SÍ' : 'NO'
  }));

  exportWorkbookToExcel('Claves_Deducciones_Tarifas_Nocturnidad', [
    { name: 'Deducciones', data: dataDed },
    { name: 'Nocturnidad', data: dataNoct },
    { name: 'Actividades Ajenas', data: dataAct }
  ]);
}

// ==========================================
// SALARIO PROMEDIO (12 MESES & LIQUIDACIONES)
// ==========================================

export function exportSalarioPromedioToExcel(
  trabajadorNombre: string,
  expediente: string,
  meses: {
    mesNumero: number;
    mesNombre: string;
    salarioEscala: number;
    antiguedadYGrado: number;
    nocturnidad: number;
    horasExtras: number;
    estimulacionResultados: number;
    otrosDevengosComputables: number;
    totalDevengado?: number;
    devengadoMes?: number;
    horasLaboradas: number;
    diasLaborados: number;
  }[],
  liquidaciones: any[]
) {
  const dataMeses = meses.map(m => ({
    'Mes No': m.mesNumero,
    'Período': m.mesNombre,
    'Devengado Total ($)': m.devengadoMes !== undefined ? m.devengadoMes : (m.totalDevengado || 0),
    'Horas Trabajadas': m.horasLaboradas,
    'Días Trabajados': m.diasLaborados,
    'Salario Escala ($)': m.salarioEscala,
    'Antigüedad y Título ($)': m.antiguedadYGrado,
    'Nocturnidad ($)': m.nocturnidad,
    'Horas Extras ($)': m.horasExtras,
    'Estimulación ($)': m.estimulacionResultados,
    'Otros Devengos ($)': m.otrosDevengosComputables
  }));

  const dataLiq = liquidaciones.map((l, idx) => ({
    'No': idx + 1,
    'Fecha': l.fechaRegistro || '',
    'Trabajador': l.nombreApellidos || '',
    'Expediente': l.numeroExpediente || '',
    'Concepto / Motivo': l.motivoNombre || l.motivo || '',
    'Artículo Ley 116': l.articuloLey || '',
    'Modalidad': l.modalidadCalculo || 'dias',
    'Unidades': l.modalidadCalculo === 'horas' ? (l.horasLiquidar || 0) : (l.diasLiquidar || 0),
    'Tarifa Base ($)': l.modalidadCalculo === 'horas' ? (l.tarifaPromedioHora || 0) : (l.salarioPromedioDiario || 0),
    'Bruto ($)': l.montoBruto || 0,
    'CESS 5% ($)': l.deduccionCESS || 0,
    'Neto a Cobrar ($)': l.montoNeto || 0
  }));

  exportWorkbookToExcel(`Salario_Promedio_${trabajadorNombre.replace(/\s+/g, '_') || 'Historial'}`, [
    { name: '12 Meses Acumulados', data: dataMeses },
    { name: 'Liquidaciones Promedio', data: dataLiq.length > 0 ? dataLiq : [{ Info: 'Sin liquidaciones registradas' }] }
  ]);
}

export function parseSalarioPromedioFromExcel(rows: Record<string, any>[]): {
  mesNumero: number;
  totalDevengado: number;
  horasLaboradas: number;
  diasLaborados: number;
  mesNombre?: string;
}[] {
  return rows.map((r, idx) => {
    const mesNum = parseInt(r['Mes No'] || r['Mes'] || r['mes'] || `${idx + 1}`, 10) || (idx + 1);
    const devengado = parseFloat(r['Devengado Total ($)'] || r['Devengado Total'] || r['Devengado'] || r['devengado'] || r['Total Devengado'] || 0) || 0;
    const horas = parseFloat(r['Horas Trabajadas'] || r['Horas'] || r['horas'] || 0) || 0;
    const dias = parseFloat(r['Días Trabajados'] || r['Días'] || r['dias'] || 0) || 0;
    const mesNombre = (r['Período'] || r['Periodo'] || r['Mes'] || `Mes ${mesNum}`).toString();

    return {
      mesNumero: mesNum,
      totalDevengado: devengado,
      horasLaboradas: horas,
      diasLaborados: dias,
      mesNombre
    };
  });
}

export function exportEmployeeEvolutionToExcel(
  workerName: string,
  expediente: string,
  evolutionData: {
    periodoNombre: string;
    fecha: string;
    cargo: string;
    salarioEscala: number;
    antiguedad: number;
    gradoAcademico: number;
    salarioBasicoTotal: number;
    tiempoRealLaborado: number;
    salarioTiempoLaborado: number;
    salarioVacaciones: number;
    totalPagosAdicionales: number;
    devengadoBruto: number;
  }[]
) {
  const data = evolutionData.map((item, idx) => ({
    'No': idx + 1,
    'Período': item.periodoNombre,
    'Fecha': item.fecha,
    'Cargo': item.cargo,
    'Salario Escala ($)': item.salarioEscala,
    'Antigüedad ($)': item.antiguedad,
    'Grado Académico ($)': item.gradoAcademico,
    'Salario Básico Total ($)': item.salarioBasicoTotal,
    'Tiempo Laborado (h)': item.tiempoRealLaborado,
    'Importe Tiempo Laborado ($)': item.salarioTiempoLaborado,
    'Importe Vacaciones ($)': item.salarioVacaciones,
    'Pagos Adicionales ($)': item.totalPagosAdicionales,
    'Devengado Bruto por Mes ($)': item.devengadoBruto
  }));

  exportWorkbookToExcel(`Evolucion_Salarial_${workerName.replace(/\s+/g, '_') || 'Trabajador'}`, [
    { name: 'Evolución Devengado Mensual', data }
  ]);
}

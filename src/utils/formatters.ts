import { EmployeeWithCalculation, PayrollSettings } from '../types/payroll';

/**
 * Formatea un número como moneda con el símbolo configurado
 */
export function formatCurrency(amount: number, settings?: PayrollSettings): string {
  const symbol = settings?.simboloMoneda || '$';
  const formatted = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
  
  return `${symbol} ${formatted}`;
}

/**
 * Formatea un número con separadores de miles
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Exporta la prenómina actual a un archivo CSV descargable
 */
export function exportPayrollToCSV(employees: EmployeeWithCalculation[], settings: PayrollSettings) {
  const headers = [
    'Documento',
    'Nombres',
    'Apellidos',
    'Cargo',
    'Departamento',
    'Tipo Contrato',
    'Salario Base',
    'Días Trab.',
    'Días Faltas',
    'Horas Ext. Diurnas',
    'Horas Ext. Nocturnas',
    'Horas Ext. Festivas',
    'Total Horas Extras',
    'Auxilio Transporte',
    'Bonos y Comisiones',
    'TOTAL DEVENGADO',
    'Deducción Salud',
    'Deducción Pensión',
    'Fondo Solidaridad',
    'Retención Fuente',
    'Anticipos y Préstamos',
    'TOTAL DEDUCCIONES',
    'SALARIO NETO',
    'Costo Cargas Patronales',
    'COSTO TOTAL EMPRESA',
    'Estado'
  ];

  const rows = employees.map(emp => [
    `"${emp.identificacion}"`,
    `"${emp.nombre}"`,
    `"${emp.apellidos}"`,
    `"${emp.cargo}"`,
    `"${emp.departamento}"`,
    `"${emp.tipoContrato}"`,
    emp.salarioBase.toFixed(2),
    emp.diasTrabajados,
    emp.diasAusencia,
    emp.horasExtrasDiurnas,
    emp.horasExtrasNocturnas,
    emp.horasExtrasFestivas,
    emp.calculo.totalHorasExtras.toFixed(2),
    emp.calculo.subsidioTransporteEfectivo.toFixed(2),
    emp.calculo.totalBonosYComisiones.toFixed(2),
    emp.calculo.totalDevengado.toFixed(2),
    emp.calculo.deduccionSalud.toFixed(2),
    emp.calculo.deduccionPension.toFixed(2),
    emp.calculo.deduccionFondoSolidaridad.toFixed(2),
    emp.calculo.deduccionRetencionFuente.toFixed(2),
    emp.calculo.totalOtrasDeducciones.toFixed(2),
    emp.calculo.totalDeducciones.toFixed(2),
    emp.calculo.salarioNeto.toFixed(2),
    emp.calculo.totalCargasPatronales.toFixed(2),
    emp.calculo.costoTotalEmpresa.toFixed(2),
    `"${emp.estado}"`
  ]);

  const csvContent = [
    `# Prenómina de Salario - Periodo: ${settings.periodoNombre} - Moneda: ${settings.moneda}`,
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\r\n');

  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `prenomina_salarios_${settings.periodoNombre.toLowerCase().replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

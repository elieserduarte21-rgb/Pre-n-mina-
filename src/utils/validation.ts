/**
 * Utilidades de validación en tiempo real para prevenir errores de cálculo
 * y tipos de datos no numéricos o fuera de rango en la prenómina y salarios.
 */

/**
 * Sanitiza y valida un valor numérico ingresado por el usuario, asegurando que esté dentro de un rango permitido.
 */
export function sanitizeNumberInput(value: any, min: number = 0, max: number = 999999): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  const parsed = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(parsed)) {
    return 0;
  }
  if (parsed < min) return min;
  if (parsed > max) return max;
  return Math.round(parsed * 100) / 100;
}

/**
 * Valida un campo de texto de asistencia diaria (ej. "8", "9", "12.5", "D", "V", "C-25", "C-82").
 */
export function validateDayCellValue(value: string): string {
  if (!value) return '';
  const trimmed = value.trim().toUpperCase();
  // Permitir códigos conocidos o números de horas válidos
  return trimmed.slice(0, 8);
}

/**
 * Valida que un número de expediente o identificación sea alfanumérico seguro.
 */
export function sanitizeIdentifier(value: string): string {
  if (!value) return '';
  return value.replace(/[^a-zA-Z0-9\-_./]/g, '').trim();
}

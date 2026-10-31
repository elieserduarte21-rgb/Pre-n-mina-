import React from 'react';
import { EmployeeWithCalculation, PayrollSettings } from '../types/payroll';
import { formatCurrency } from '../utils/formatters';
import { X, Printer, CheckCircle2 } from 'lucide-react';

interface PayslipModalProps {
  employee: EmployeeWithCalculation | null;
  settings: PayrollSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({
  employee,
  settings,
  isOpen,
  onClose
}) => {
  if (!isOpen || !employee) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabecera superior interactiva (oculta al imprimir) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 no-print">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">
              Comprobante de Prenómina de Salario
            </h2>
            <span className="text-2xs text-slate-500 font-mono">
              · {employee.identificacion}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Recibo</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido imprimible del recibo */}
        <div className="flex-1 overflow-y-auto p-8 bg-white print:p-4 text-slate-800" id="payslip-print-area">
          
          {/* Encabezado del Recibo */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  EMPRESA S.A.S.
                </h1>
                <p className="text-xs text-slate-500 font-mono">
                  NIT / Identificación Tributaria: 900.824.119-3
                </p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                  Desprendible de Salario
                </span>
                <span className="text-sm font-bold text-slate-900 font-mono">
                  Periodo: {settings.periodoNombre}
                </span>
              </div>
            </div>
          </div>

          {/* Ficha del Trabajador */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-2xs text-slate-500 block">Empleado</span>
              <span className="font-bold text-slate-900 text-sm">
                {employee.nombre} {employee.apellidos}
              </span>
            </div>

            <div>
              <span className="text-2xs text-slate-500 block">Identificación / Cédula</span>
              <span className="font-mono font-medium text-slate-900">
                {employee.identificacion}
              </span>
            </div>

            <div>
              <span className="text-2xs text-slate-500 block">Cargo</span>
              <span className="font-medium text-slate-900">
                {employee.cargo}
              </span>
            </div>

            <div>
              <span className="text-2xs text-slate-500 block">Departamento</span>
              <span className="font-medium text-slate-900">
                {employee.departamento}
              </span>
            </div>

            <div>
              <span className="text-2xs text-slate-500 block">Salario Base Mensual</span>
              <span className="font-mono font-semibold text-slate-900">
                {formatCurrency(employee.salarioBase, settings)}
              </span>
            </div>

            <div>
              <span className="text-2xs text-slate-500 block">Días Liquidados</span>
              <span className="font-mono text-slate-900">
                {employee.diasTrabajados} días {employee.diasAusencia > 0 ? `(-${employee.diasAusencia} ausencias)` : ''}
              </span>
            </div>
          </div>

          {/* Tabla de Devengados vs Deducciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            
            {/* Columna DEVENGADOS (Ingresos) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Conceptos Devengados
                </h3>
              </div>

              <div className="p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-600">Sueldo Básico ({employee.diasTrabajados - employee.diasAusencia} días)</span>
                  <span className="font-mono tabular-nums font-medium text-slate-900">
                    {formatCurrency(employee.calculo.sueldoBasicoDevengado, settings)}
                  </span>
                </div>

                {employee.horasExtrasDiurnas > 0 && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">H. Extras Diurnas ({employee.horasExtrasDiurnas}h)</span>
                    <span className="font-mono tabular-nums text-slate-900">
                      {formatCurrency(employee.calculo.valorExtrasDiurnas, settings)}
                    </span>
                  </div>
                )}

                {employee.horasExtrasNocturnas > 0 && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">H. Extras Nocturnas ({employee.horasExtrasNocturnas}h)</span>
                    <span className="font-mono tabular-nums text-slate-900">
                      {formatCurrency(employee.calculo.valorExtrasNocturnas, settings)}
                    </span>
                  </div>
                )}

                {employee.horasExtrasFestivas > 0 && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">H. Extras Festivas ({employee.horasExtrasFestivas}h)</span>
                    <span className="font-mono tabular-nums text-slate-900">
                      {formatCurrency(employee.calculo.valorExtrasFestivas, settings)}
                    </span>
                  </div>
                )}

                {employee.bonoPuntualidad > 0 && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">Bono de Asistencia / Estimulación</span>
                    <span className="font-mono tabular-nums text-slate-900">
                      {formatCurrency(employee.bonoPuntualidad, settings)}
                    </span>
                  </div>
                )}

                {employee.comisiones > 0 && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">Comisiones por Ventas / Servicios</span>
                    <span className="font-mono tabular-nums text-slate-900">
                      {formatCurrency(employee.comisiones, settings)}
                    </span>
                  </div>
                )}

                {employee.otrosIngresos > 0 && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">Otros Ingresos Salariales</span>
                    <span className="font-mono tabular-nums text-slate-900">
                      {formatCurrency(employee.otrosIngresos, settings)}
                    </span>
                  </div>
                )}

                <div className="pt-2 flex justify-between items-center font-bold text-slate-900 text-sm">
                  <span>Total Devengado (Bruto)</span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(employee.calculo.totalDevengado, settings)}
                  </span>
                </div>
              </div>
            </div>

            {/* Columna DEDUCCIONES */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800">
                  Conceptos Deducidos (Cuba)
                </h3>
                <span className="text-3xs font-mono font-bold bg-rose-100 text-rose-900 px-2 py-0.5 rounded">
                  Ley 113 / 116
                </span>
              </div>

              <div className="p-4 space-y-2 text-xs">
                {/* CESS 5% */}
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-600">Contribución Especial Seg. Social (CESS {settings.tasaCESS || 5}%)</span>
                  <span className="font-mono tabular-nums text-rose-700">
                    -{formatCurrency(employee.calculo.deduccionCESS, settings)}
                  </span>
                </div>

                {/* ISIP Estatal */}
                {employee.calculo.deduccionISIP > 0 && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">Impuesto Ingresos Personales (ISIP)</span>
                    <span className="font-mono tabular-nums text-rose-700">
                      -{formatCurrency(employee.calculo.deduccionISIP, settings)}
                    </span>
                  </div>
                )}


                <div className="pt-2 flex justify-between items-center font-bold text-rose-700 text-sm">
                  <span>Total Deducciones</span>
                  <span className="font-mono tabular-nums">
                    -{formatCurrency(employee.calculo.totalDeducciones, settings)}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* TOTAL NETO A PAGAR (Recuadro Principal) */}
          <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-xl mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                Neto a Recibir por el Trabajador
              </span>
              <span className="text-2xs text-emerald-700">
                Valor líquido transferido a cuenta bancaria
              </span>
            </div>
            <div className="text-2xl font-bold text-emerald-950 font-mono tabular-nums">
              {formatCurrency(employee.calculo.salarioNeto, settings)}
            </div>
          </div>

          {/* Espacio para Firmas */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-300 print-break-inside-avoid">
            <div className="text-center">
              <div className="border-b border-slate-400 mb-2 w-3/4 mx-auto"></div>
              <p className="text-xs font-semibold text-slate-800">Firma del Empleador</p>
              <p className="text-2xs text-slate-500">Recursos Humanos / Nómina</p>
            </div>

            <div className="text-center">
              <div className="border-b border-slate-400 mb-2 w-3/4 mx-auto"></div>
              <p className="text-xs font-semibold text-slate-800">Firma del Trabajador</p>
              <p className="text-2xs text-slate-500 font-mono">{employee.identificacion}</p>
            </div>
          </div>

          {/* Nota Legal Código de Trabajo de Cuba */}
          <div className="mt-6 pt-3 border-t border-dashed border-slate-200 text-center text-3xs text-slate-400">
            Comprobante oficial expedido según la Ley 116 (Código de Trabajo) y Ley 113 (Del Sistema Tributario) de la República de Cuba.
            Las prestaciones por certificado médico (C-20) y subsidios de Seguridad Social están completamente exentos de deducciones impositivas.
          </div>

        </div>

      </div>
    </div>
  );
};

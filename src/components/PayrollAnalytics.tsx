import React, { useMemo } from 'react';
import { EmployeeWithCalculation, PayrollSettings, PayrollTotals } from '../types/payroll';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { PieChart, TrendingUp, DollarSign, Building2, Layers } from 'lucide-react';

interface PayrollAnalyticsProps {
  employees: EmployeeWithCalculation[];
  settings: PayrollSettings;
  totals: PayrollTotals;
}

export const PayrollAnalytics: React.FC<PayrollAnalyticsProps> = ({
  employees,
  settings,
  totals
}) => {
  // Distribución por departamento
  const deptBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; devengado: number; neto: number; costoEmpresa: number }>();
    
    employees.forEach(emp => {
      const d = emp.departamento || 'General';
      const current = map.get(d) || { count: 0, devengado: 0, neto: 0, costoEmpresa: 0 };
      current.count += 1;
      current.devengado += emp.calculo.totalDevengado;
      current.neto += emp.calculo.salarioNeto;
      current.costoEmpresa += emp.calculo.costoTotalEmpresa;
      map.set(d, current);
    });

    return Array.from(map.entries())
      .map(([dept, data]) => ({
        departamento: dept,
        ...data,
        porcentajeNeto: totals.totalNetoPagar > 0 ? (data.neto / totals.totalNetoPagar) * 100 : 0
      }))
      .sort((a, b) => b.devengado - a.devengado);
  }, [employees, totals]);

  // Desglose de componentes del devengado
  const devengadoParts = useMemo(() => {
    const total = totals.totalDevengado || 1;
    const baseDevengado = Math.max(0, totals.totalDevengado - totals.totalHorasExtras - totals.totalSubsidioTransporte - totals.totalBonos);
    return [
      { label: 'Sueldo Básico', amount: baseDevengado, pct: (baseDevengado / total) * 100, color: 'bg-slate-800' },
      { label: 'Horas Extras', amount: totals.totalHorasExtras, pct: (totals.totalHorasExtras / total) * 100, color: 'bg-amber-600' },
      { label: 'Auxilio Transporte', amount: totals.totalSubsidioTransporte, pct: (totals.totalSubsidioTransporte / total) * 100, color: 'bg-blue-600' },
      { label: 'Bonos y Comisiones', amount: totals.totalBonos, pct: (totals.totalBonos / total) * 100, color: 'bg-emerald-600' }
    ];
  }, [totals]);

  // Desglose de deducciones
  const deduccionesParts = useMemo(() => {
    const total = totals.totalDeducciones || 1;
    const otras = Math.max(0, totals.totalDeducciones - totals.totalSaludTrabajador - totals.totalPensionTrabajador - totals.totalRetencionFuente);
    return [
      { label: 'Salud Trabajador', amount: totals.totalSaludTrabajador, pct: (totals.totalSaludTrabajador / total) * 100, color: 'bg-rose-600' },
      { label: 'Pensión Trabajador', amount: totals.totalPensionTrabajador, pct: (totals.totalPensionTrabajador / total) * 100, color: 'bg-rose-500' },
      { label: 'Retención Impuesto', amount: totals.totalRetencionFuente, pct: (totals.totalRetencionFuente / total) * 100, color: 'bg-rose-400' },
      { label: 'Anticipos y Préstamos', amount: otras, pct: (otras / total) * 100, color: 'bg-rose-700' }
    ];
  }, [totals]);

  return (
    <div className="space-y-6">
      
      {/* Encabezado */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-slate-700" />
          <span>Análisis y Estructura de Costos de la Prenómina</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Consolidado financiero mensual del periodo {settings.periodoNombre}. Visualiza la distribución presupuestal por departamento, componentes de ingreso y cargas patronales.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Distribución por Departamentos */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-500" />
              <span>Gasto Salarial por Departamento</span>
            </h3>
            <span className="text-2xs text-slate-400 font-mono">
              {deptBreakdown.length} áreas
            </span>
          </div>

          <div className="space-y-3">
            {deptBreakdown.map(dept => (
              <div key={dept.departamento} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-800">
                    {dept.departamento}{' '}
                    <span className="text-2xs font-normal text-slate-500">
                      ({dept.count} emp{dept.count > 1 ? 's' : ''})
                    </span>
                  </span>
                  <div className="text-right">
                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                      {formatCurrency(dept.neto, settings)}
                    </span>
                    <span className="text-2xs text-slate-500 ml-2 font-mono">
                      {dept.porcentajeNeto.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Barra de progreso visual */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-slate-800 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(3, dept.porcentajeNeto))}%` }}
                  />
                </div>
                <div className="text-2xs text-slate-500 flex justify-between">
                  <span>Devengado Bruto: {formatCurrency(dept.devengado, settings)}</span>
                  <span>Costo Empresa: {formatCurrency(dept.costoEmpresa, settings)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estructura del Devengado vs Deducciones */}
        <div className="space-y-6">
          
          {/* Componentes del Ingreso Bruto */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-slate-500" />
              <span>Composición del Total Devengado ({formatCurrency(totals.totalDevengado, settings)})</span>
            </h3>

            {/* Barra apilada */}
            <div className="w-full h-3 rounded-full flex overflow-hidden bg-slate-100">
              {devengadoParts.map((item, idx) => (
                <div
                  key={idx}
                  className={`${item.color} h-full`}
                  style={{ width: `${item.pct}%` }}
                  title={`${item.label}: ${item.pct.toFixed(1)}%`}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {devengadoParts.map((item, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-xs ${item.color}`} />
                    <span className="text-2xs font-semibold text-slate-700">{item.label}</span>
                  </div>
                  <div className="font-mono tabular-nums font-bold text-slate-900 text-xs">
                    {formatCurrency(item.amount, settings)}
                  </div>
                  <span className="text-2xs text-slate-500 font-mono">
                    {item.pct.toFixed(1)}% del total
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Componentes de las Deducciones */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-rose-500" />
              <span>Composición de Deducciones (-{formatCurrency(totals.totalDeducciones, settings)})</span>
            </h3>

            {/* Barra apilada deducciones */}
            <div className="w-full h-3 rounded-full flex overflow-hidden bg-slate-100">
              {deduccionesParts.map((item, idx) => (
                <div
                  key={idx}
                  className={`${item.color} h-full`}
                  style={{ width: `${item.pct}%` }}
                  title={`${item.label}: ${item.pct.toFixed(1)}%`}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {deduccionesParts.map((item, idx) => (
                <div key={idx} className="p-2.5 bg-rose-50/50 border border-rose-100 rounded-lg">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-xs ${item.color}`} />
                    <span className="text-2xs font-semibold text-slate-700">{item.label}</span>
                  </div>
                  <div className="font-mono tabular-nums font-bold text-rose-700 text-xs">
                    -{formatCurrency(item.amount, settings)}
                  </div>
                  <span className="text-2xs text-slate-500 font-mono">
                    {item.pct.toFixed(1)}% del total
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Relación de Nómina Neta vs Sobrecostos de Ley de la Empresa */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
          Comparativa Financiera Consolidada
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <span className="text-2xs font-semibold text-emerald-800 uppercase block">1. Desembolso Neto Empleados</span>
            <span className="text-xl font-bold font-mono tabular-nums text-emerald-950 mt-1 block">
              {formatCurrency(totals.totalNetoPagar, settings)}
            </span>
            <p className="text-2xs text-emerald-700 mt-1">
              Dinero que reciben los colaboradores directamente en sus cuentas bancarias.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-2xs font-semibold text-slate-600 uppercase block">2. Retenciones y Aportes de Ley</span>
            <span className="text-xl font-bold font-mono tabular-nums text-rose-700 mt-1 block">
              {formatCurrency(totals.totalDeducciones, settings)}
            </span>
            <p className="text-2xs text-slate-500 mt-1">
              Monto retenido a los empleados por concepto de salud, pensión e impuestos.
            </p>
          </div>

          <div className="p-4 bg-slate-900 text-white rounded-xl">
            <span className="text-2xs font-semibold text-slate-300 uppercase block">3. Presupuesto Total Empresa</span>
            <span className="text-xl font-bold font-mono tabular-nums text-white mt-1 block">
              {formatCurrency(totals.costoTotalEmpresa, settings)}
            </span>
            <p className="text-2xs text-slate-300 mt-1">
              Incluye salario bruto + {formatCurrency(totals.totalCargasPatronales, settings)} en cargas patronales y provisiones.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

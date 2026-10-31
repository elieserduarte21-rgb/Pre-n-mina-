import React, { useState, useMemo } from 'react';
import { PayrollSettings, Employee } from '../types/payroll';
import { calculateEmployeePayroll } from '../utils/payrollCalculator';
import { formatCurrency } from '../utils/formatters';
import { Calculator, ArrowRight, CheckCircle2, Plus, Info, RefreshCw } from 'lucide-react';

interface QuickCalculatorProps {
  settings: PayrollSettings;
  onAddSimulatedToPayroll: (employee: Employee) => void;
}

export const QuickCalculator: React.FC<QuickCalculatorProps> = ({
  settings,
  onAddSimulatedToPayroll
}) => {
  const [salarioBase, setSalarioBase] = useState<number>(2000);
  const [diasTrabajados, setDiasTrabajados] = useState<number>(30);
  const [diasAusencia, setDiasAusencia] = useState<number>(0);
  const [horasExtrasDiurnas, setHorasExtrasDiurnas] = useState<number>(0);
  const [horasExtrasNocturnas, setHorasExtrasNocturnas] = useState<number>(0);
  const [horasExtrasFestivas, setHorasExtrasFestivas] = useState<number>(0);
  const [bonoPuntualidad, setBonoPuntualidad] = useState<number>(0);
  const [comisiones, setComisiones] = useState<number>(0);
  const [otrosIngresos, setOtrosIngresos] = useState<number>(0);
  // Nombre simulado opcional
  const [workerName, setWorkerName] = useState<string>('Nuevo Colaborador');
  const [workerRole, setWorkerRole] = useState<string>('Especialista');

  // Objeto empleado temporal para cálculo
  const tempEmployee: Employee = useMemo(() => ({
    id: `sim-${Date.now()}`,
    identificacion: 'SIMULADO',
    nombre: workerName,
    apellidos: '',
    cargo: workerRole,
    departamento: 'Operaciones',
    tipoContrato: 'indefinido',
    fechaIngreso: new Date().toISOString().split('T')[0],
    salarioBase,
    diasTrabajados,
    diasAusencia,
    horasExtrasDiurnas,
    horasExtrasNocturnas,
    horasExtrasFestivas,
    bonoPuntualidad,
    comisiones,
    otrosIngresos,
    aplicaSubsidioTransporte: false,
    anticipos: 0,
    prestamos: 0,
    otrasDeducciones: 0,
    estado: 'borrador'
  }), [
    salarioBase,
    diasTrabajados,
    diasAusencia,
    horasExtrasDiurnas,
    horasExtrasNocturnas,
    horasExtrasFestivas,
    bonoPuntualidad,
    comisiones,
    otrosIngresos,
    workerName,
    workerRole
  ]);

  const calculation = useMemo(() => {
    return calculateEmployeePayroll(tempEmployee, settings);
  }, [tempEmployee, settings]);

  const handleReset = () => {
    setSalarioBase(2000);
    setDiasTrabajados(30);
    setDiasAusencia(0);
    setHorasExtrasDiurnas(0);
    setHorasExtrasNocturnas(0);
    setHorasExtrasFestivas(0);
    setBonoPuntualidad(0);
    setComisiones(0);
    setOtrosIngresos(0);
    setWorkerName('Nuevo Colaborador');
  };

  const handleTransfer = () => {
    onAddSimulatedToPayroll({
      ...tempEmployee,
      id: `emp-${Date.now().toString().slice(-4)}`,
      identificacion: `${Math.floor(1000000000 + Math.random() * 900000000)}`
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Encabezado de la Calculadora */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-slate-700" />
            <span>Base de Cálculo y Simulador Rápido de Salario</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Modifica cualquier variable salarial (salario base, horas extras, bonos, ausencias, deducciones) para calcular el salario mensual neto exacto en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>
          <button
            onClick={handleTransfer}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar a la Prenómina</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Panel de Entradas (7 columnas) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Tarjeta 1: Salario Base y Jornada */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              1. Salario Base y Días Laborados
            </h3>

            {settings.escalaCargos && settings.escalaCargos.length > 0 && (
              <div className="pb-3 border-b border-slate-100">
                <label className="block text-2xs font-semibold text-slate-700 mb-1">
                  Seleccionar Cargo de la Escala Salarial (Asigna Salario Base Automático)
                </label>
                <select
                  value={workerRole}
                  onChange={e => {
                    const cargoName = e.target.value;
                    setWorkerRole(cargoName);
                    const cargoItem = settings.escalaCargos?.find(c => c.nombre === cargoName);
                    if (cargoItem) {
                      setSalarioBase(cargoItem.salarioEscala);
                    }
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium cursor-pointer"
                >
                  <option value="">Personalizado / Ingreso manual</option>
                  {settings.escalaCargos.map(c => (
                    <option key={c.id} value={c.nombre}>
                      {c.nombre} · Escala: {settings.simboloMoneda}{c.salarioEscala} ({c.catOcupacionalDefault})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Salario Base Mensual ({settings.simboloMoneda})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">
                    {settings.simboloMoneda}
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    value={salarioBase}
                    onChange={e => setSalarioBase(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full pl-8 pr-3 py-2 text-sm font-bold font-mono tabular-nums border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                  />
                </div>
                <div className="flex items-center justify-between text-2xs text-slate-500 mt-1">
                  <span>Diario: {formatCurrency(calculation.salarioDiario, settings)}</span>
                  <span>Hora: {formatCurrency(calculation.valorHoraOrdinaria, settings)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Días Trabajados en el Mes
                </label>
                <input
                  type="number"
                  min="1"
                  max={settings.diasBaseMes}
                  value={diasTrabajados}
                  onChange={e => setDiasTrabajados(Math.min(settings.diasBaseMes, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                />
                <span className="text-2xs text-slate-400 mt-1 block">
                  Base estándar mensual: {settings.diasBaseMes} días
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-rose-700 mb-1">
                  Faltas o Ausencias Injustificadas (Días)
                </label>
                <input
                  type="number"
                  min="0"
                  max={diasTrabajados}
                  value={diasAusencia}
                  onChange={e => setDiasAusencia(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums border border-slate-200 rounded-lg focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                />
                {diasAusencia > 0 && (
                  <span className="text-2xs text-rose-600 mt-1 block font-mono">
                    Descuento: -{formatCurrency(calculation.descuentoAusencias, settings)}
                  </span>
                )}
              </div>

              <div className="flex flex-col justify-end">
                <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-xs">
                  <span className="font-semibold text-blue-950 block">Régimen Estatal Cubano (Ley 116 / 113)</span>
                  <span className="text-2xs text-blue-800 block">
                    Retención CESS 5% e ISIP estatal. Sin impuestos por transporte ni por certificados médicos.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Horas Extras */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                2. Novedades de Horas Extras
              </h3>
              <span className="text-xs font-mono font-semibold text-slate-900">
                Total: +{formatCurrency(calculation.totalHorasExtras, settings)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="block text-2xs font-bold text-slate-700 mb-1">
                  Diurna (×{settings.factorExtraDiurna})
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={horasExtrasDiurnas || ''}
                    placeholder="0"
                    onChange={e => setHorasExtrasDiurnas(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-2 py-1 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded"
                  />
                  <span className="text-2xs text-slate-500">h</span>
                </div>
                <span className="text-2xs font-mono text-slate-600 mt-1 block">
                  {formatCurrency(calculation.valorExtrasDiurnas, settings)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="block text-2xs font-bold text-slate-700 mb-1">
                  Nocturna (×{settings.factorExtraNocturna})
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={horasExtrasNocturnas || ''}
                    placeholder="0"
                    onChange={e => setHorasExtrasNocturnas(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-2 py-1 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded"
                  />
                  <span className="text-2xs text-slate-500">h</span>
                </div>
                <span className="text-2xs font-mono text-slate-600 mt-1 block">
                  {formatCurrency(calculation.valorExtrasNocturnas, settings)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="block text-2xs font-bold text-slate-700 mb-1">
                  Festiva (×{settings.factorExtraFestiva})
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={horasExtrasFestivas || ''}
                    placeholder="0"
                    onChange={e => setHorasExtrasFestivas(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-2 py-1 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded"
                  />
                  <span className="text-2xs text-slate-500">h</span>
                </div>
                <span className="text-2xs font-mono text-slate-600 mt-1 block">
                  {formatCurrency(calculation.valorExtrasFestivas, settings)}
                </span>
              </div>
            </div>
          </div>

          {/* Tarjeta 3: Bonos y Deducciones */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              3. Bonificaciones y Deducciones Voluntarias
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-2xs font-medium text-slate-700 mb-1">
                  Bono de Asistencia
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={bonoPuntualidad || ''}
                  placeholder="0.00"
                  onChange={e => setBonoPuntualidad(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-2xs font-medium text-slate-700 mb-1">
                  Comisiones
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={comisiones || ''}
                  placeholder="0.00"
                  onChange={e => setComisiones(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-2xs font-medium text-slate-700 mb-1">
                  Otros Ingresos
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={otrosIngresos || ''}
                  placeholder="0.00"
                  onChange={e => setOtrosIngresos(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Panel de Resultados y Desglose Matemático (5 columnas) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Tarjeta Principal de Salario Neto */}
          <div className="bg-emerald-950 text-white rounded-xl p-6 shadow-md border border-emerald-800">
            <span className="text-2xs font-bold uppercase tracking-wider text-emerald-300 block">
              Salario Neto Mensual a Pagar
            </span>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-white mt-1">
              {formatCurrency(calculation.salarioNeto, settings)}
            </div>
            <p className="text-xs text-emerald-200/80 mt-1">
              Monto líquido a dispersar al empleado después de devengos y retenciones legales.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-emerald-800/80 text-xs">
              <div>
                <span className="text-2xs text-emerald-300/80 block">Total Devengado (Bruto)</span>
                <span className="font-mono tabular-nums font-bold text-white text-sm">
                  {formatCurrency(calculation.totalDevengado, settings)}
                </span>
              </div>
              <div>
                <span className="text-2xs text-emerald-300/80 block">Total Deducciones</span>
                <span className="font-mono tabular-nums font-bold text-rose-300 text-sm">
                  -{formatCurrency(calculation.totalDeducciones, settings)}
                </span>
              </div>
            </div>
          </div>

          {/* Desglose Matemático Transparente */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-4 h-4 text-slate-500" />
              <span>Desglose de la Base de Cálculo</span>
            </h3>

            <div className="space-y-2 text-xs divide-y divide-slate-100">
              
              <div className="pt-2 flex justify-between items-center text-slate-600">
                <span>Sueldo Básico ({diasTrabajados - diasAusencia} días):</span>
                <span className="font-mono tabular-nums font-medium text-slate-900">
                  {formatCurrency(calculation.sueldoBasicoDevengado, settings)}
                </span>
              </div>

              {calculation.totalHorasExtras > 0 && (
                <div className="pt-2 flex justify-between items-center text-slate-600">
                  <span>Horas Extras Totales:</span>
                  <span className="font-mono tabular-nums font-medium text-slate-900">
                    +{formatCurrency(calculation.totalHorasExtras, settings)}
                  </span>
                </div>
              )}

              {calculation.totalBonosYComisiones > 0 && (
                <div className="pt-2 flex justify-between items-center text-slate-600">
                  <span>Bonificaciones / Estimulación:</span>
                  <span className="font-mono tabular-nums font-medium text-slate-900">
                    +{formatCurrency(calculation.totalBonosYComisiones, settings)}
                  </span>
                </div>
              )}

              {/* Deducciones de Ley Estatales de Cuba (Ley 116 / Ley 113) */}
              <div className="pt-2 flex justify-between items-center text-rose-700">
                <span>Contribución Especial Seg. Social (CESS {settings.tasaCESS || 5}%):</span>
                <span className="font-mono tabular-nums font-medium">
                  -{formatCurrency(calculation.deduccionCESS, settings)}
                </span>
              </div>

              {calculation.deduccionISIP > 0 && (
                <div className="pt-2 flex justify-between items-center text-rose-700">
                  <span>Impuesto sobre Ingresos Personales (ISIP):</span>
                  <span className="font-mono tabular-nums font-medium">
                    -{formatCurrency(calculation.deduccionISIP, settings)}
                  </span>
                </div>
              )}

            </div>
          </div>

          {/* Tarjeta de Costo Empleador Estatal (Entidad Empleadora Cuba) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 block">
              Aportes Patronales Estatales (Entidad Empleadora en Cuba)
            </span>
            <div className="flex justify-between items-center text-slate-600">
              <span>Seguridad Social Patronal ({settings.tasaSeguridadSocialPatronal || 12.5}%):</span>
              <span className="font-mono tabular-nums font-medium text-slate-800">
                {formatCurrency(calculation.costoSeguridadSocialPatronal, settings)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Utilización Fuerza de Trabajo ({settings.tasaFuerzaTrabajoPatronal || 5.0}%):</span>
              <span className="font-mono tabular-nums font-medium text-slate-800">
                {formatCurrency(calculation.costoFuerzaTrabajoPatronal, settings)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-bold text-slate-900">
              <span>Costo Total Empresa:</span>
              <span className="font-mono tabular-nums text-sm">
                {formatCurrency(calculation.costoTotalEmpresa, settings)}
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

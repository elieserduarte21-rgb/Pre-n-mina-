import React, { useState, useEffect, useMemo } from 'react';
import { Employee, PayrollSettings, ContractType, PayrollStatus } from '../types/payroll';
import { calculateEmployeePayroll } from '../utils/payrollCalculator';
import { formatCurrency } from '../utils/formatters';
import { X, User, DollarSign, Clock, ShieldCheck, FileCheck } from 'lucide-react';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Employee) => void;
  initialEmployee?: Employee | null;
  settings: PayrollSettings;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEmployee,
  settings
}) => {
  const [formData, setFormData] = useState<Employee>({
    id: '',
    identificacion: '',
    nombre: '',
    apellidos: '',
    cargo: '',
    departamento: 'Operaciones',
    tipoContrato: 'indefinido',
    fechaIngreso: new Date().toISOString().split('T')[0],
    salarioBase: 1500,
    diasTrabajados: 30,
    diasAusencia: 0,
    horasExtrasDiurnas: 0,
    horasExtrasNocturnas: 0,
    horasExtrasFestivas: 0,
    bonoPuntualidad: 0,
    comisiones: 0,
    otrosIngresos: 0,
    aplicaSubsidioTransporte: false,
    anticipos: 0,
    prestamos: 0,
    otrasDeducciones: 0,
    retencionFuenteManual: null,
    estado: 'borrador',
    notas: '',
    email: ''
  });

  const [activeTab, setActiveTab] = useState<'info' | 'devengados' | 'deducciones'>('info');

  useEffect(() => {
    if (initialEmployee) {
      setFormData(initialEmployee);
    } else {
      setFormData({
        id: `emp-${Date.now().toString().slice(-4)}`,
        identificacion: '',
        nombre: '',
        apellidos: '',
        cargo: '',
        departamento: 'Operaciones',
        tipoContrato: 'indefinido',
        fechaIngreso: new Date().toISOString().split('T')[0],
        salarioBase: 1600,
        diasTrabajados: 30,
        diasAusencia: 0,
        horasExtrasDiurnas: 0,
        horasExtrasNocturnas: 0,
        horasExtrasFestivas: 0,
        bonoPuntualidad: 0,
        comisiones: 0,
        otrosIngresos: 0,
        aplicaSubsidioTransporte: false,
        anticipos: 0,
        prestamos: 0,
        otrasDeducciones: 0,
        retencionFuenteManual: null,
        estado: 'borrador',
        notas: '',
        email: ''
      });
    }
  }, [initialEmployee, isOpen]);

  // Cálculo en vivo
  const liveCalculation = useMemo(() => {
    return calculateEmployeePayroll(formData, settings);
  }, [formData, settings]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.identificacion.trim()) {
      alert('Por favor ingrese el nombre y número de documento del trabajador.');
      return;
    }
    onSave(formData);
  };

  const updateNumberField = (field: keyof Employee, value: string) => {
    const num = parseFloat(value);
    setFormData((prev: Employee) => ({
      ...prev,
      [field]: isNaN(num) ? 0 : Math.max(0, num)
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {initialEmployee ? 'Editar Trabajador y Novedades' : 'Registrar Nuevo Trabajador'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Periodo de cálculo activo: {settings.periodoNombre} · Base {settings.diasBaseMes} días
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Navegación del Formulario */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-200 bg-white text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'info'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>1. Datos del Empleado</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('devengados')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'devengados'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>2. Horas Extras & Devengados</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('deducciones')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'deducciones'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>3. Deducciones & Anticipos</span>
          </button>
        </div>

        {/* Cuerpo del Formulario con Split de Cálculo en Vivo */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col lg:flex-row">
          
          {/* Columna Izquierda: Entradas de datos */}
          <div className="flex-1 p-6 space-y-4">
            
            {/* PESTAÑA 1: DATOS GENERALES */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nombres <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Juan Carlos"
                      value={formData.nombre}
                      onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Apellidos <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Pérez Rodríguez"
                      value={formData.apellidos}
                      onChange={e => setFormData({ ...formData, apellidos: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Identificación / Cédula / DNI <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. 1023849102"
                      value={formData.identificacion}
                      onChange={e => setFormData({ ...formData, identificacion: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      placeholder="trabajador@empresa.com"
                      value={formData.email || ''}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cargo / Puesto
                    </label>
                    {settings.escalaCargos && settings.escalaCargos.length > 0 ? (
                      <select
                        value={formData.cargo}
                        onChange={e => {
                          const selectedCargoName = e.target.value;
                          const cargoItem = settings.escalaCargos?.find(c => c.nombre === selectedCargoName);
                          setFormData(prev => ({
                            ...prev,
                            cargo: selectedCargoName,
                            salarioBase: cargoItem ? cargoItem.salarioEscala : prev.salarioBase
                          }));
                        }}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-medium"
                      >
                        <option value="">Seleccionar de la escala...</option>
                        {settings.escalaCargos.map(c => (
                          <option key={c.id} value={c.nombre}>
                            {c.nombre} ({settings.simboloMoneda}{c.salarioEscala})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Ej. Técnico de Mantenimiento"
                        value={formData.cargo}
                        onChange={e => setFormData({ ...formData, cargo: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Departamento
                    </label>
                    <select
                      value={formData.departamento}
                      onChange={e => setFormData({ ...formData, departamento: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                    >
                      <option value="Tecnología">Tecnología</option>
                      <option value="Operaciones">Operaciones</option>
                      <option value="Ventas">Ventas</option>
                      <option value="Finanzas">Finanzas</option>
                      <option value="Recursos Humanos">Recursos Humanos</option>
                      <option value="Administración">Administración</option>
                      <option value="Logística">Logística</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tipo de Contrato
                    </label>
                    <select
                      value={formData.tipoContrato}
                      onChange={e => setFormData({ ...formData, tipoContrato: e.target.value as ContractType })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                    >
                      <option value="indefinido">Término Indefinido</option>
                      <option value="fijo">Término Fijo</option>
                      <option value="obra">Por Obra o Labor</option>
                      <option value="practicas">Prácticas / Aprendizaje</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Salario Base Mensual ({settings.simboloMoneda}) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">
                          {settings.simboloMoneda}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={formData.salarioBase || ''}
                          onChange={e => updateNumberField('salarioBase', e.target.value)}
                          className="w-full pl-7 pr-3 py-2 text-xs font-mono tabular-nums border border-slate-200 rounded-lg font-semibold focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Estado en la Prenómina
                      </label>
                      <select
                        value={formData.estado}
                        onChange={e => setFormData({ ...formData, estado: e.target.value as PayrollStatus })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-medium"
                      >
                        <option value="borrador">Borrador</option>
                        <option value="revisado">Revisado</option>
                        <option value="aprobado">Aprobado</option>
                        <option value="pagado">Pagado</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Notas u Observaciones del Periodo
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Comentarios sobre novedades, permisos, justificaciones..."
                    value={formData.notas || ''}
                    onChange={e => setFormData({ ...formData, notas: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                  />
                </div>
              </div>
            )}

            {/* PESTAÑA 2: DEVENGADOS Y HORAS EXTRAS */}
            {activeTab === 'devengados' && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900">Valor de Hora Ordinaria:</span>{' '}
                    <span className="font-mono tabular-nums text-slate-800">
                      {formatCurrency(liveCalculation.valorHoraOrdinaria, settings)}/h
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">Salario Diario:</span>{' '}
                    <span className="font-mono tabular-nums text-slate-800">
                      {formatCurrency(liveCalculation.salarioDiario, settings)}/día
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Días Trabajados en el Mes
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={settings.diasBaseMes}
                      value={formData.diasTrabajados}
                      onChange={e => updateNumberField('diasTrabajados', e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono tabular-nums border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                    />
                    <span className="text-2xs text-slate-400 mt-0.5 block">Máximo estándar: {settings.diasBaseMes} días</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-rose-700 mb-1">
                      Faltas / Ausencias Injustificadas
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={formData.diasTrabajados}
                      value={formData.diasAusencia}
                      onChange={e => updateNumberField('diasAusencia', e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono tabular-nums border border-slate-200 rounded-lg focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                    />
                    <span className="text-2xs text-rose-600 mt-0.5 block">
                      Descuento: -{formatCurrency(liveCalculation.descuentoAusencias, settings)}
                    </span>
                  </div>
                </div>

                {/* Horas Extras */}
                <div className="border border-slate-200 rounded-xl p-3.5 space-y-3">
                  <div className="text-xs font-semibold text-slate-800">
                    Registro de Horas Extras
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-2xs font-medium text-slate-600 mb-1">
                        Extras Diurnas (×{settings.factorExtraDiurna})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="0"
                        value={formData.horasExtrasDiurnas || ''}
                        onChange={e => updateNumberField('horasExtrasDiurnas', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums border border-slate-200 rounded-lg"
                      />
                      <span className="text-2xs text-slate-500 font-mono mt-0.5 block">
                        = {formatCurrency(liveCalculation.valorExtrasDiurnas, settings)}
                      </span>
                    </div>

                    <div>
                      <label className="block text-2xs font-medium text-slate-600 mb-1">
                        Extras Nocturnas (×{settings.factorExtraNocturna})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="0"
                        value={formData.horasExtrasNocturnas || ''}
                        onChange={e => updateNumberField('horasExtrasNocturnas', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums border border-slate-200 rounded-lg"
                      />
                      <span className="text-2xs text-slate-500 font-mono mt-0.5 block">
                        = {formatCurrency(liveCalculation.valorExtrasNocturnas, settings)}
                      </span>
                    </div>

                    <div>
                      <label className="block text-2xs font-medium text-slate-600 mb-1">
                        Festivas / Dominicales (×{settings.factorExtraFestiva})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="0"
                        value={formData.horasExtrasFestivas || ''}
                        onChange={e => updateNumberField('horasExtrasFestivas', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums border border-slate-200 rounded-lg"
                      />
                      <span className="text-2xs text-slate-500 font-mono mt-0.5 block">
                        = {formatCurrency(liveCalculation.valorExtrasFestivas, settings)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bonos, Comisiones y Auxilio de Transporte */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Bono Asistencia / Puntualidad
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.bonoPuntualidad || ''}
                      onChange={e => updateNumberField('bonoPuntualidad', e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono tabular-nums border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Comisiones por Ventas
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.comisiones || ''}
                      onChange={e => updateNumberField('comisiones', e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono tabular-nums border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Otros Ingresos / Gratificación
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.otrosIngresos || ''}
                      onChange={e => updateNumberField('otrosIngresos', e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono tabular-nums border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                {/* Subsidio de Transporte Checkbox */}
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={
                        formData.aplicaSubsidioTransporte ||
                        (settings.topeSubsidioTransporte > 0 && formData.salarioBase <= settings.topeSubsidioTransporte)
                      }
                      onChange={e => setFormData({ ...formData, aplicaSubsidioTransporte: e.target.checked })}
                      className="w-4 h-4 rounded text-slate-900 border-slate-300 focus:ring-slate-900"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-slate-900">Aplicar Auxilio / Subsidio de Transporte de Ley</span>
                      <span className="text-slate-500 block text-2xs">
                        Valor estándar: {formatCurrency(settings.subsidioTransporteMensual, settings)} mensual (proporcional a días trabajados: {formatCurrency(liveCalculation.subsidioTransporteEfectivo, settings)})
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* PESTAÑA 3: DEDUCCIONES Y ANTICIPOS */}
            {activeTab === 'deducciones' && (
              <div className="space-y-4">
                {/* Desglose de Deducciones de Ley (Automáticas) */}
                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 space-y-2">
                  <div className="text-xs font-semibold text-slate-800">
                    Deducciones de Ley del Trabajador
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-2xs text-slate-500 block">Salud ({settings.tasaSaludTrabajador}%)</span>
                      <span className="font-mono tabular-nums font-semibold text-rose-600">
                        -{formatCurrency(liveCalculation.deduccionSalud, settings)}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-2xs text-slate-500 block">Pensión ({settings.tasaPensionTrabajador}%)</span>
                      <span className="font-mono tabular-nums font-semibold text-rose-600">
                        -{formatCurrency(liveCalculation.deduccionPension, settings)}
                      </span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
                      <span className="text-2xs text-slate-500 block">Retención Estimada</span>
                      <span className="font-mono tabular-nums font-semibold text-rose-600">
                        -{formatCurrency(liveCalculation.deduccionRetencionFuente, settings)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deducciones Variables / Novedades del Empleado */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Anticipos de Salario Otorgados
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">
                        {settings.simboloMoneda}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.anticipos || ''}
                        onChange={e => updateNumberField('anticipos', e.target.value)}
                        className="w-full pl-7 pr-3 py-2 text-xs font-mono tabular-nums border border-slate-200 rounded-lg"
                      />
                    </div>
                    <span className="text-2xs text-slate-400 mt-0.5 block">Adelanto entregado en quincena</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cuota Préstamo de Empresa / Libranza
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">
                        {settings.simboloMoneda}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.prestamos || ''}
                        onChange={e => updateNumberField('prestamos', e.target.value)}
                        className="w-full pl-7 pr-3 py-2 text-xs font-mono tabular-nums border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Otras Deducciones (Sindicato, Seguro, Fondos)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">
                        {settings.simboloMoneda}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.otrasDeducciones || ''}
                        onChange={e => updateNumberField('otrasDeducciones', e.target.value)}
                        className="w-full pl-7 pr-3 py-2 text-xs font-mono tabular-nums border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Retención en la Fuente Fija (Opcional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">
                        {settings.simboloMoneda}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Automático por regla"
                        value={formData.retencionFuenteManual ?? ''}
                        onChange={e => {
                          const val = e.target.value === '' ? null : parseFloat(e.target.value);
                          setFormData({ ...formData, retencionFuenteManual: isNaN(val as number) ? null : val });
                        }}
                        className="w-full pl-7 pr-3 py-2 text-xs font-mono tabular-nums border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha: Panel de Pre-Cálculo en Vivo */}
          <div className="w-full lg:w-80 bg-slate-50 border-t lg:border-t-0 lg:border-l border-slate-200 p-6 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Pre-Cálculo en Vivo</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Sueldo Básico:</span>
                  <span className="font-mono tabular-nums font-medium text-slate-800">
                    {formatCurrency(liveCalculation.sueldoBasicoDevengado, settings)}
                  </span>
                </div>

                {liveCalculation.totalHorasExtras > 0 && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Horas Extras:</span>
                    <span className="font-mono tabular-nums text-slate-800">
                      +{formatCurrency(liveCalculation.totalHorasExtras, settings)}
                    </span>
                  </div>
                )}

                {liveCalculation.subsidioTransporteEfectivo > 0 && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Auxilio Transporte:</span>
                    <span className="font-mono tabular-nums text-slate-800">
                      +{formatCurrency(liveCalculation.subsidioTransporteEfectivo, settings)}
                    </span>
                  </div>
                )}

                {liveCalculation.totalBonosYComisiones > 0 && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Bonos / Comisiones:</span>
                    <span className="font-mono tabular-nums text-slate-800">
                      +{formatCurrency(liveCalculation.totalBonosYComisiones, settings)}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-semibold text-slate-900">
                  <span>Total Devengado:</span>
                  <span className="font-mono tabular-nums text-slate-900">
                    {formatCurrency(liveCalculation.totalDevengado, settings)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-rose-700">
                  <span>Deducciones de Ley:</span>
                  <span className="font-mono tabular-nums">
                    -{formatCurrency(liveCalculation.totalDeduccionesLey, settings)}
                  </span>
                </div>

                {liveCalculation.totalOtrasDeducciones > 0 && (
                  <div className="flex justify-between items-center text-rose-700">
                    <span>Otras Deducciones:</span>
                    <span className="font-mono tabular-nums">
                      -{formatCurrency(liveCalculation.totalOtrasDeducciones, settings)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-rose-800 font-medium">
                  <span>Total Deducciones:</span>
                  <span className="font-mono tabular-nums">
                    -{formatCurrency(liveCalculation.totalDeducciones, settings)}
                  </span>
                </div>
              </div>

              {/* Recuadro de Salario Neto */}
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-2xs font-semibold text-emerald-800 uppercase tracking-wider block">
                  Salario Neto Mensual
                </span>
                <span className="text-xl font-bold text-emerald-900 font-mono tabular-nums mt-0.5 block">
                  {formatCurrency(liveCalculation.salarioNeto, settings)}
                </span>
                <span className="text-2xs text-emerald-700 mt-1 block">
                  Líquido a consignar al trabajador
                </span>
              </div>

              {/* Costo Patronal */}
              <div className="mt-3 p-2.5 bg-slate-100 rounded-lg text-2xs text-slate-600">
                <div className="flex justify-between">
                  <span>Costo empresa (cargas):</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {formatCurrency(liveCalculation.costoTotalEmpresa, settings)}
                  </span>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                Guardar Trabajador
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { EmployeeWithCalculation, PayrollSettings, PayrollStatus } from '../types/payroll';
import { formatCurrency } from '../utils/formatters';
import { Search, Filter, FileText, Edit2, Trash2, ChevronDown, CheckCircle2, Clock, AlertCircle, RotateCcw } from 'lucide-react';

interface PayrollTableProps {
  employees: EmployeeWithCalculation[];
  settings: PayrollSettings;
  onEditEmployee: (employee: EmployeeWithCalculation) => void;
  onViewPayslip: (employee: EmployeeWithCalculation) => void;
  onDeleteEmployee: (id: string) => void;
  onStatusChange: (id: string, newStatus: PayrollStatus) => void;
  onAddNewEmployee: () => void;
  onResetDefaults: () => void;
}

export const PayrollTable: React.FC<PayrollTableProps> = ({
  employees,
  settings,
  onEditEmployee,
  onViewPayslip,
  onDeleteEmployee,
  onStatusChange,
  onAddNewEmployee,
  onResetDefaults
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');

  // Departamentos únicos para el filtro
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach(e => {
      if (e.departamento) set.add(e.departamento);
    });
    return Array.from(set).sort();
  }, [employees]);

  // Filtrado de empleados
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchSearch =
        emp.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.identificacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.cargo.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = selectedDept === 'todos' || emp.departamento === selectedDept;
      const matchStatus = selectedStatus === 'todos' || emp.estado === selectedStatus;

      return matchSearch && matchDept && matchStatus;
    });
  }, [employees, searchTerm, selectedDept, selectedStatus]);

  // Totales de la vista actual filtrada
  const filteredTotals = useMemo(() => {
    return filteredEmployees.reduce(
      (acc, emp) => {
        acc.base += emp.salarioBase;
        acc.devengado += emp.calculo.totalDevengado;
        acc.deducciones += emp.calculo.totalDeducciones;
        acc.neto += emp.calculo.salarioNeto;
        acc.extras += emp.calculo.totalHorasExtras;
        return acc;
      },
      { base: 0, devengado: 0, deducciones: 0, neto: 0, extras: 0 }
    );
  }, [filteredEmployees]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
      {/* Barra de Filtros y Controles de la Tabla */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex flex-1 items-center gap-3">
          {/* Búsqueda en vivo */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, cargo o ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>

          {/* Filtro por Departamento */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="todos">Todos los departamentos</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Estado */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="todos">Todos los estados</option>
            <option value="borrador">Borrador</option>
            <option value="revisado">Revisado</option>
            <option value="aprobado">Aprobado</option>
            <option value="pagado">Pagado</option>
          </select>
        </div>

        {/* Resumen numérico de filas */}
        <div className="text-xs text-slate-500 flex items-center gap-3">
          <span>Mostrando <strong className="font-semibold text-slate-700">{filteredEmployees.length}</strong> de {employees.length} trabajadores</span>
          <button
            onClick={onResetDefaults}
            title="Restablecer lista inicial de ejemplo"
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors p-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-2xs">Restablecer</span>
          </button>
        </div>
      </div>

      {/* Contenedor de la Tabla con scroll horizontal */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-2xs">
              <th className="py-3 px-4">Trabajador / Cargo</th>
              <th className="py-3 px-3 text-right">Salario Base</th>
              <th className="py-3 px-3 text-center">Días</th>
              <th className="py-3 px-3 text-right">Horas Extras</th>
              <th className="py-3 px-3 text-right">Otros Deveng.</th>
              <th className="py-3 px-3 text-right bg-slate-200/50">Total Devengado</th>
              <th className="py-3 px-3 text-right">Deducc. Ley</th>
              <th className="py-3 px-3 text-right">Otras Deduc.</th>
              <th className="py-3 px-3 text-right bg-slate-200/50">Total Deducc.</th>
              <th className="py-3 px-4 text-right bg-emerald-50 text-emerald-900 font-bold">Salario Neto</th>
              <th className="py-3 px-3 text-center">Estado</th>
              <th className="py-3 px-3 text-right">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200/80">
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-slate-500">
                  <div className="max-w-xs mx-auto flex flex-col items-center">
                    <AlertCircle className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm font-medium text-slate-700">No se encontraron trabajadores</p>
                    <p className="text-xs text-slate-500 mt-1 mb-4">
                      {searchTerm ? 'Intenta modificar el término de búsqueda o filtros.' : 'Comienza agregando un trabajador a la prenómina.'}
                    </p>
                    <button
                      onClick={onAddNewEmployee}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      + Agregar Trabajador
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredEmployees.map(emp => {
                const totalExtrasQty = (emp.horasExtrasDiurnas || 0) + (emp.horasExtrasNocturnas || 0) + (emp.horasExtrasFestivas || 0);

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Trabajador / Cargo */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {emp.nombre} {emp.apellidos}
                      </div>
                      <div className="text-2xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span>{emp.cargo}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{emp.identificacion}</span>
                        <span aria-hidden="true">·</span>
                        <span>{emp.departamento}</span>
                      </div>
                    </td>

                    {/* Salario Base */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                      {formatCurrency(emp.salarioBase, settings)}
                    </td>

                    {/* Días trabajados / ausencias */}
                    <td className="py-3 px-3 text-center text-slate-600">
                      <span className="font-mono tabular-nums font-medium">{emp.diasTrabajados}</span>
                      {emp.diasAusencia > 0 && (
                        <span className="text-rose-600 font-mono tabular-nums text-2xs block">
                          -{emp.diasAusencia} falta{emp.diasAusencia > 1 ? 's' : ''}
                        </span>
                      )}
                    </td>

                    {/* Horas Extras */}
                    <td className="py-3 px-3 text-right">
                      {emp.calculo.totalHorasExtras > 0 ? (
                        <div>
                          <div className="font-mono tabular-nums font-medium text-slate-900">
                            {formatCurrency(emp.calculo.totalHorasExtras, settings)}
                          </div>
                          <div className="text-2xs text-slate-500 font-mono">
                            {totalExtrasQty}h extras
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono">—</span>
                      )}
                    </td>

                    {/* Otros Devengados (Aux Transporte + Bonos + Comisiones) */}
                    <td className="py-3 px-3 text-right">
                      <div className="font-mono tabular-nums text-slate-700">
                        {formatCurrency(emp.calculo.subsidioTransporteEfectivo + emp.calculo.totalBonosYComisiones, settings)}
                      </div>
                      <div className="text-2xs text-slate-500">
                        {emp.calculo.subsidioTransporteEfectivo > 0 && <span>Aux. T. </span>}
                        {emp.calculo.totalBonosYComisiones > 0 && <span>Bonos</span>}
                      </div>
                    </td>

                    {/* Total Devengado (Bruto) */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 bg-slate-50/50">
                      {formatCurrency(emp.calculo.totalDevengado, settings)}
                    </td>

                    {/* Deducciones de Ley (Salud + Pensión + Retención) */}
                    <td className="py-3 px-3 text-right text-rose-700">
                      <div className="font-mono tabular-nums">
                        -{formatCurrency(emp.calculo.totalDeduccionesLey, settings)}
                      </div>
                      <div className="text-2xs text-slate-500 font-mono">
                        S: {formatCurrency(emp.calculo.deduccionSalud, settings)} · P: {formatCurrency(emp.calculo.deduccionPension, settings)}
                      </div>
                    </td>

                    {/* Otras Deducciones (Anticipos + Préstamos) */}
                    <td className="py-3 px-3 text-right text-rose-700">
                      {emp.calculo.totalOtrasDeducciones > 0 ? (
                        <span className="font-mono tabular-nums">
                          -{formatCurrency(emp.calculo.totalOtrasDeducciones, settings)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">—</span>
                      )}
                    </td>

                    {/* Total Deducciones */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-medium text-rose-600 bg-slate-50/50">
                      -{formatCurrency(emp.calculo.totalDeducciones, settings)}
                    </td>

                    {/* SALARIO NETO (Destacado) */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-sm text-emerald-800 bg-emerald-50/60">
                      {formatCurrency(emp.calculo.salarioNeto, settings)}
                    </td>

                    {/* Estado de la prenómina */}
                    <td className="py-3 px-3 text-center">
                      <div className="relative inline-block">
                        <select
                          value={emp.estado}
                          onChange={e => onStatusChange(emp.id, e.target.value as PayrollStatus)}
                          className={`text-2xs font-semibold px-2 py-0.5 rounded cursor-pointer border appearance-none pr-5 transition-colors ${
                            emp.estado === 'aprobado'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : emp.estado === 'revisado'
                              ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                              : emp.estado === 'pagado'
                              ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <option value="borrador">Borrador</option>
                          <option value="revisado">Revisado</option>
                          <option value="aprobado">Aprobado</option>
                          <option value="pagado">Pagado</option>
                        </select>
                        <ChevronDown className="w-2.5 h-2.5 absolute right-1.5 top-2 pointer-events-none text-slate-500" />
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onViewPayslip(emp)}
                          title="Ver recibo de nómina individual"
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditEmployee(emp)}
                          title="Editar novedades y salario"
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteEmployee(emp.id)}
                          title="Eliminar de la prenómina"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Fila de Totales de la Vista */}
          {filteredEmployees.length > 0 && (
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-300 font-semibold text-slate-900 text-xs">
                <td className="py-3 px-4">
                  <span>Totales ({filteredEmployees.length} registros)</span>
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">
                  {formatCurrency(filteredTotals.base, settings)}
                </td>
                <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-500">
                  —
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">
                  {formatCurrency(filteredTotals.extras, settings)}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">
                  —
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-900 bg-slate-200/50">
                  {formatCurrency(filteredTotals.devengado, settings)}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-rose-700">
                  —
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-rose-700">
                  —
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-rose-700 bg-slate-200/50">
                  -{formatCurrency(filteredTotals.deducciones, settings)}
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-sm text-emerald-800 bg-emerald-100/60">
                  {formatCurrency(filteredTotals.neto, settings)}
                </td>
                <td colSpan={2} className="py-3 px-3 text-right text-2xs text-slate-500">
                  Consolidado activo
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

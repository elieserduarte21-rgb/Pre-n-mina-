import React, { useState, useMemo } from 'react';
import { EmployeeWithCalculation, PayrollSettings, PayrollStatus } from '../types/payroll';
import { formatCurrency } from '../utils/formatters';
import { Search, Filter, FileText, Edit2, Trash2, ChevronDown, AlertCircle, RotateCcw, MoreHorizontal } from 'lucide-react';
import { useTableResize } from '../hooks/useTableResize';

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

  const columns = useMemo(() => [
    { id: 'trabajador', label: 'Trabajador / Cargo', width: 300 },
    { id: 'salario', label: 'Salario Base', width: 120 },
    { id: 'dias', label: 'Días', width: 80 },
    { id: 'extras', label: 'Horas Extras', width: 100 },
    { id: 'bonos', label: 'Bonos / Estím.', width: 100 },
    { id: 'devengado', label: 'Total Devengado', width: 120 },
    { id: 'retenciones', label: 'Retenciones Ley (CESS / ISIP)', width: 160 },
    { id: 'neto', label: 'Salario Neto', width: 120 },
    { id: 'estado', label: 'Estado', width: 100 },
    { id: 'acciones', label: 'Acciones', width: 80 },
  ], []);

  const { widths, startResizing } = useTableResize('payroll-table', Object.fromEntries(columns.map(c => [c.id, c.width])));

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

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse text-xs table-fixed bg-slate-950 text-slate-200">
          <colgroup>
            {columns.map(col => (
              <col key={col.id} style={{ width: widths[col.id] }} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-slate-900 border-b border-slate-700 text-slate-100 font-semibold uppercase tracking-wider text-2xs">
              {columns.map(col => (
                <th key={col.id} className="py-3 px-4 relative select-none truncate" style={{ width: widths[col.id] }}>
                  {col.label}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-slate-500"
                    onMouseDown={() => startResizing(col.id)}
                  />
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800">
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-400">
                  <div className="max-w-xs mx-auto flex flex-col items-center">
                    <AlertCircle className="w-8 h-8 text-slate-600 mb-2" />
                    <p className="text-sm font-medium text-slate-200">No se encontraron trabajadores</p>
                    <p className="text-xs text-slate-400 mt-1 mb-4">
                      {searchTerm ? 'Intenta modificar el término de búsqueda o filtros.' : 'Comienza agregando un trabajador a la prenómina.'}
                    </p>
                    <button
                      onClick={onAddNewEmployee}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-slate-100 rounded-lg hover:bg-white transition-colors"
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
                  <tr key={emp.id} className="hover:bg-slate-900 transition-colors group">
                    {/* Trabajador / Cargo */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-50">
                        {emp.nombre} {emp.apellidos}
                      </div>
                      <div className="text-2xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{emp.cargo}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{emp.identificacion}</span>
                        <span aria-hidden="true">·</span>
                        <span>{emp.departamento}</span>
                      </div>
                    </td>

                    {/* Salario Base */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300">
                      {formatCurrency(emp.salarioBase, settings)}
                    </td>

                    {/* Días trabajados / ausencias */}
                    <td className="py-3 px-3 text-center text-slate-300">
                      <span className="font-mono tabular-nums font-medium">{emp.diasTrabajados}</span>
                      {emp.diasAusencia > 0 && (
                        <span className="text-rose-400 font-mono tabular-nums text-2xs block">
                          -{emp.diasAusencia} falta{emp.diasAusencia > 1 ? 's' : ''}
                        </span>
                      )}
                    </td>

                    {/* Horas Extras */}
                    <td className="py-3 px-3 text-right">
                      {emp.calculo.totalHorasExtras > 0 ? (
                        <div>
                          <div className="font-mono tabular-nums font-medium text-slate-100">
                            {formatCurrency(emp.calculo.totalHorasExtras, settings)}
                          </div>
                          <div className="text-2xs text-slate-400 font-mono">
                            {totalExtrasQty}h extras
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-600 font-mono">—</span>
                      )}
                    </td>

                    {/* Bonos y Estimulación */}
                    <td className="py-3 px-3 text-right">
                      <div className="font-mono tabular-nums text-slate-300">
                        {formatCurrency(emp.calculo.totalBonosYComisiones, settings)}
                      </div>
                      <div className="text-2xs text-slate-400">
                        {emp.calculo.totalBonosYComisiones > 0 && <span>Estímulo</span>}
                      </div>
                    </td>

                    {/* Total Devengado (Bruto) */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-50 bg-slate-900">
                      {formatCurrency(emp.calculo.totalDevengado, settings)}
                    </td>

                    {/* Retenciones de Ley Estatales (CESS 5% + ISIP) */}
                    <td className="py-3 px-3 text-right text-rose-300 bg-rose-950/20">
                      <div className="font-mono tabular-nums font-semibold">
                        -{formatCurrency(emp.calculo.totalDeduccionesLey, settings)}
                      </div>
                      <div className="text-2xs text-slate-400 font-mono">
                        CESS: {formatCurrency(emp.calculo.deduccionCESS, settings)}
                        {emp.calculo.deduccionISIP > 0 && ` · ISIP: ${formatCurrency(emp.calculo.deduccionISIP, settings)}`}
                      </div>
                    </td>

                    {/* SALARIO NETO (Destacado) */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-sm text-emerald-300 bg-emerald-950/30">
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
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : emp.estado === 'revisado'
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : emp.estado === 'pagado'
                              ? 'bg-blue-950 text-blue-300 border-blue-800'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          <option value="borrador">Borrador</option>
                          <option value="revisado">Revisado</option>
                          <option value="aprobado">Aprobado</option>
                          <option value="pagado">Pagado</option>
                        </select>
                        <ChevronDown className="w-2.5 h-2.5 absolute right-1.5 top-2 pointer-events-none text-slate-400" />
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onViewPayslip(emp)}
                          title="Ver recibo de nómina individual"
                          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditEmployee(emp)}
                          title="Editar novedades y salario"
                          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteEmployee(emp.id)}
                          title="Eliminar de la prenómina"
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950 rounded-md transition-colors"
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
              <tr className="bg-slate-800 border-t-2 border-slate-600 font-semibold text-slate-100 text-xs">
                <td className="py-3 px-4">
                  <span>Totales ({filteredEmployees.length} registros)</span>
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">
                  {formatCurrency(filteredTotals.base, settings)}
                </td>
                <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-400">
                  —
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">
                  {formatCurrency(filteredTotals.extras, settings)}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums">
                  —
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-50 bg-slate-700/50">
                  {formatCurrency(filteredTotals.devengado, settings)}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-rose-300 bg-rose-950/30">
                  -{formatCurrency(filteredTotals.deducciones, settings)}
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-sm text-emerald-300 bg-emerald-950/40">
                  {formatCurrency(filteredTotals.neto, settings)}
                </td>
                <td colSpan={2} className="py-3 px-3 text-right text-2xs text-slate-400">
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

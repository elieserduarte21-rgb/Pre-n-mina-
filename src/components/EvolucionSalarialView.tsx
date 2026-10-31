import React, { useState, useMemo } from 'react';
import { 
  EmployeePrenomina, 
  PayrollSettings, 
  HeaderPrenomina, 
  PeriodoHistoricoSnapshot 
} from '../types/payroll';
import { calculatePrenominaEmployee } from '../utils/prenominaCalculator';
import { exportEmployeeEvolutionToExcel } from '../utils/excelHelper';
import { 
  TrendingUp, 
  Calendar, 
  User, 
  Download, 
  Plus, 
  Trash2, 
  Award, 
  Briefcase, 
  FileSpreadsheet,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface EvolucionSalarialViewProps {
  currentEmployees: EmployeePrenomina[];
  currentHeader: HeaderPrenomina;
  settings: PayrollSettings;
  periodosHistoricos: PeriodoHistoricoSnapshot[];
  onSaveCurrentPeriod: (nombrePeriodo: string) => void;
  onDeletePeriod: (id: string) => void;
}

export const EvolucionSalarialView: React.FC<EvolucionSalarialViewProps> = ({
  currentEmployees,
  currentHeader,
  settings,
  periodosHistoricos,
  onSaveCurrentPeriod,
  onDeletePeriod
}) => {
  // Input para nuevo periodo a guardar
  const [nuevoPeriodoNombre, setNuevoPeriodoNombre] = useState(
    currentHeader.periodoCorresponde || `Período ${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`
  );
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Obtener lista única de todos los trabajadores (identificados por expediente o nombre y apellidos)
  const allWorkersMap = useMemo(() => {
    const map = new Map<string, { expediente: string; nombre: string; cargo: string }>();

    // Agregar de periodos históricos
    periodosHistoricos.forEach(snapshot => {
      snapshot.empleados.forEach(emp => {
        const key = (emp.numeroExpediente || emp.nombreApellidos).trim().toLowerCase();
        if (key && !map.has(key)) {
          map.set(key, {
            expediente: emp.numeroExpediente || 'S/N',
            nombre: emp.nombreApellidos,
            cargo: emp.cargo || 'Operario'
          });
        }
      });
    });

    // Agregar de empleados actuales
    currentEmployees.forEach(emp => {
      const key = (emp.numeroExpediente || emp.nombreApellidos).trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, {
          expediente: emp.numeroExpediente || 'S/N',
          nombre: emp.nombreApellidos,
          cargo: emp.cargo || 'Operario'
        });
      }
    });

    return Array.from(map.values());
  }, [periodosHistoricos, currentEmployees]);

  const [selectedWorkerKey, setSelectedWorkerKey] = useState<string>(() => {
    const first = allWorkersMap[0];
    return first ? (first.expediente !== 'S/N' ? first.expediente : first.nombre) : '';
  });

  // Datos de evolución salarial para el trabajador seleccionado a través de todos los periodos
  const workerEvolution = useMemo(() => {
    if (!selectedWorkerKey) return [];

    const historyList: {
      periodoId: string;
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
    }[] = [];

    // Combinar periodos históricos y periodo actual en una lista cronológica
    const allSnapshots = [
      ...periodosHistoricos,
      {
        id: 'current-active',
        nombrePeriodo: currentHeader.periodoCorresponde || 'Período Actual (En curso)',
        fechaGuardado: currentHeader.fechaConclusion || new Date().toISOString().slice(0, 10),
        empleados: currentEmployees,
        header: currentHeader
      }
    ];

    allSnapshots.forEach(snapshot => {
      const foundEmp = snapshot.empleados.find(e => 
        (e.numeroExpediente && e.numeroExpediente.trim().toLowerCase() === selectedWorkerKey.toLowerCase()) ||
        (e.nombreApellidos && e.nombreApellidos.trim().toLowerCase() === selectedWorkerKey.toLowerCase())
      );

      if (foundEmp) {
        const calc = calculatePrenominaEmployee(foundEmp, settings);
        historyList.push({
          periodoId: snapshot.id,
          periodoNombre: snapshot.nombrePeriodo,
          fecha: snapshot.fechaGuardado,
          cargo: calc.cargo || 'Operario',
          salarioEscala: calc.salarioBasicoEscala || 4800,
          antiguedad: calc.montoAntiguedadCalculado || 0,
          gradoAcademico: calc.montoGradoAcademicoCalculado || 0,
          salarioBasicoTotal: calc.salarioBasicoTotal || 4800,
          tiempoRealLaborado: calc.tiempoRealLaborado || 0,
          salarioTiempoLaborado: calc.salarioTiempoLaborado || 0,
          salarioVacaciones: calc.salarioVacaciones || 0,
          totalPagosAdicionales: calc.totalPagosAdicionales || 0,
          devengadoBruto: calc.salarioTotalEstimado || 0 // El devengado bruto sin restar impuestos
        });
      }
    });

    return historyList;
  }, [selectedWorkerKey, periodosHistoricos, currentEmployees, currentHeader, settings]);

  // Datos del trabajador actual seleccionado para cabecera
  const selectedWorkerInfo = allWorkersMap.find(w => 
    w.expediente.toLowerCase() === selectedWorkerKey.toLowerCase() || 
    w.nombre.toLowerCase() === selectedWorkerKey.toLowerCase()
  );

  // Estadísticas resumen de evolución
  const stats = useMemo(() => {
    if (workerEvolution.length === 0) return { avgDevengado: 0, maxDevengado: 0, minDevengado: 0, totalPeriodos: 0 };
    const devengados = workerEvolution.map(w => w.devengadoBruto);
    const sum = devengados.reduce((a, b) => a + b, 0);
    return {
      avgDevengado: Math.round((sum / devengados.length) * 100) / 100,
      maxDevengado: Math.max(...devengados),
      minDevengado: Math.min(...devengados),
      totalPeriodos: workerEvolution.length
    };
  }, [workerEvolution]);

  const handleSaveSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoPeriodoNombre.trim()) return;
    onSaveCurrentPeriod(nuevoPeriodoNombre.trim());
    setShowSaveModal(false);
    alert(`Período "${nuevoPeriodoNombre}" guardado exitosamente en el historial de almacenamiento local.`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Cabecera de la sección */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-700 font-semibold text-xs uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Control Histórico de Nómina (Ley 116)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Evolución Salarial por Empleado (Devengado Bruto)</h2>
          <p className="text-xs text-slate-500 mt-1">
            Visualiza el salario devengado mensual de cada trabajador a través de los diferentes períodos guardados en el almacenamiento local, excluyendo deducciones estatales obligatorias.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSaveModal(true)}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Guardar Período Actual en Historial</span>
          </button>

          {workerEvolution.length > 0 && selectedWorkerInfo && (
            <button
              onClick={() => exportEmployeeEvolutionToExcel(selectedWorkerInfo.nombre, selectedWorkerInfo.expediente, workerEvolution)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Evolución (.xlsx)</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal para guardar periodo actual */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">Guardar Período Actual en Historial</h3>
            <p className="text-xs text-slate-500 mb-4">
              Esto creará una instantánea (snapshot) de todos los trabajadores oficiales actuales y sus datos en el almacenamiento local para su análisis evolutivo.
            </p>
            <form onSubmit={handleSaveSnapshot} className="space-y-4">
              <div>
                <label className="block text-2xs font-semibold text-slate-700 uppercase mb-1">Nombre del Período</label>
                <input
                  type="text"
                  value={nuevoPeriodoNombre}
                  onChange={e => setNuevoPeriodoNombre(e.target.value)}
                  placeholder="ej. Febrero 2026"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition"
                >
                  Guardar en LocalStorage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selector de Trabajador */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <label className="block text-2xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Seleccionar Empleado para Analizar Evolución Salarial:
        </label>
        {allWorkersMap.length === 0 ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>No hay trabajadores registrados ni en el período actual ni en el historial guardado.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <select
                value={selectedWorkerKey}
                onChange={e => setSelectedWorkerKey(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-white font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                {allWorkersMap.map(w => (
                  <option key={w.expediente !== 'S/N' ? w.expediente : w.nombre} value={w.expediente !== 'S/N' ? w.expediente : w.nombre}>
                    Exp. {w.expediente} - {w.nombre} ({w.cargo})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
              <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Períodos en historial: <strong className="text-slate-800">{periodosHistoricos.length}</strong> + Actual</span>
            </div>
          </div>
        )}
      </div>

      {/* Tarjetas de Resumen Estadístico */}
      {selectedWorkerInfo && workerEvolution.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <span className="text-2xs font-semibold text-slate-500 uppercase">Devengado Promedio Mensual</span>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              $ {stats.avgDevengado.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-3xs text-slate-400 mt-1 block">Salario devengado bruto sin retenciones</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <span className="text-2xs font-semibold text-slate-500 uppercase">Máximo Devengado Registrado</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              $ {stats.maxDevengado.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-3xs text-slate-400 mt-1 block">Pico salarial en el período</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <span className="text-2xs font-semibold text-slate-500 uppercase">Mínimo Devengado Registrado</span>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              $ {stats.minDevengado.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-3xs text-slate-400 mt-1 block">Base salarial mínima en el período</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <span className="text-2xs font-semibold text-slate-500 uppercase">Períodos Analizados</span>
            <div className="text-2xl font-bold text-slate-800 mt-1">
              {stats.totalPeriodos} meses
            </div>
            <span className="text-3xs text-slate-400 mt-1 block">Historial en localStorage</span>
          </div>
        </div>
      )}

      {/* Tabla detallada de evolución salarial */}
      {selectedWorkerInfo && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Desglose de Salario Devengado: {selectedWorkerInfo.nombre} (Exp. {selectedWorkerInfo.expediente})
              </h3>
              <p className="text-2xs text-slate-500 mt-0.5">
                Cargo: {selectedWorkerInfo.cargo} | Muestra exclusivamente el salario devengado bruto por meses (sin aplicar impuestos estatales)
              </p>
            </div>
            <div className="text-2xs font-semibold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
              {workerEvolution.length} períodos evaluados
            </div>
          </div>

          {workerEvolution.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No hay datos registrados para este trabajador en los períodos seleccionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold text-2xs uppercase">
                    <th className="py-3 px-4">Período / Mes</th>
                    <th className="py-3 px-4">Cargo</th>
                    <th className="py-3 px-3 text-right">Salario Escala</th>
                    <th className="py-3 px-3 text-right">Antigüedad</th>
                    <th className="py-3 px-3 text-right">Grado Ac.</th>
                    <th className="py-3 px-3 text-right">Básico Total</th>
                    <th className="py-3 px-3 text-right">Tiempo Trab. (h)</th>
                    <th className="py-3 px-3 text-right">Imp. Tiempo</th>
                    <th className="py-3 px-3 text-right">Vacaciones</th>
                    <th className="py-3 px-3 text-right">Adicionales</th>
                    <th className="py-3 px-4 text-right font-bold bg-amber-50 text-amber-900">Devengado Bruto</th>
                    <th className="py-3 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {workerEvolution.map((item, idx) => (
                    <tr key={item.periodoId + idx} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{item.periodoNombre}</span>
                        </div>
                        <span className="text-3xs text-slate-400 block font-normal">{item.fecha}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{item.cargo}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">$ {item.salarioEscala.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">$ {item.antiguedad.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">$ {item.gradoAcademico.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">$ {item.salarioBasicoTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">{item.tiempoRealLaborado} h</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">$ {item.salarioTiempoLaborado.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">$ {item.salarioVacaciones.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">$ {item.totalPagosAdicionales.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-700 bg-amber-50/60 text-sm">
                        $ {item.devengadoBruto.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {item.periodoId !== 'current-active' && (
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar el período histórico "${item.periodoNombre}" del almacenamiento local?`)) {
                                onDeletePeriod(item.periodoId);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 transition rounded-md hover:bg-red-50"
                            title="Eliminar período del historial"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Gráfico de barras visual de evolución */}
          {workerEvolution.length > 0 && (
            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
                Gráfico de Tendencia del Devengado Bruto Mensual
              </h4>
              <div className="space-y-3">
                {workerEvolution.map((item, idx) => {
                  const maxVal = stats.maxDevengado > 0 ? stats.maxDevengado : 1;
                  const percentage = Math.max(8, Math.min(100, (item.devengadoBruto / maxVal) * 100));
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-2xs">
                        <span className="font-semibold text-slate-700">{item.periodoNombre}</span>
                        <span className="font-mono font-bold text-amber-800">
                          $ {item.devengadoBruto.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-amber-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

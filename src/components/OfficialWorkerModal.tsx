import React, { useState, useEffect } from 'react';
import { EmployeePrenomina, PayrollSettings, CatOcupacional } from '../types/payroll';
import { X, UserPlus, Briefcase, Clock, Moon, AlertTriangle, Trash2, Check, FileText } from 'lucide-react';

interface OfficialWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (worker: EmployeePrenomina) => void;
  onDelete?: (workerId: string) => void;
  initialWorker?: EmployeePrenomina | null;
  settings: PayrollSettings;
}

export const OfficialWorkerModal: React.FC<OfficialWorkerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialWorker,
  settings
}) => {
  // Generador de plantilla de días según horario
  const generateDaysSchedule = (type: '185' | '200' | '8h' | 'blank'): string[] => {
    if (type === 'blank') {
      return Array(31).fill('');
    }
    if (type === '200') {
      // 200 horas: turnos rotativos de 12.5h, 2 de trabajo y 2 de descanso con 'D'
      // 16 días × 12.5h = 200 horas
      return [
        '12.5', '12.5', 'D', 'D', '12.5', '12.5', 'D', 'D', '12.5', '12.5', 'D', 'D', '12.5', '12.5', 'D',
        'D', '12.5', '12.5', 'D', 'D', '12.5', '12.5', 'D', 'D', '12.5', '12.5', 'D', 'D', '12.5', '12.5', 'D'
      ];
    }
    if (type === '8h') {
      // 8 horas lunes a viernes, sáb y dom vacíos (aprox 22 días * 8h = 176h)
      return [
        '', '', '8', '8', '8', '8', '8', '', '', '8', '8', '8', '8', '8', '',
        '8', '8', '8', '8', '8', '', '', '8', '8', '8', '8', '8', '', '', '8', ''
      ];
    }
    // Estándar 185h (Lunes-Jueves 9h, Viernes 8h)
    return [
      '', '', '9', '9', '9', '9', '8', '', '', '9', '9', '9', '9', '8', '',
      '9', '9', '9', '9', '8', '', '', '9', '9', '9', '9', '8', '', '', '9', ''
    ];
  };

  const divisorLegal = settings.divisorHorasMes || 190.6;

  const [formData, setFormData] = useState<EmployeePrenomina>({
    id: '',
    nombreApellidos: '',
    cargo: '',
    catOcupacional: 'T',
    centroCostoId: settings.centrosCosto?.[0]?.id || 'cc-101',
    fondoTiempoIndividual: 185,
    dias: generateDaysSchedule('185'),
    nocturnidad: {
      nochesComp100: 0,
      horas5: 0,
      horas10: 0,
      totalNocturnidad: 0
    },
    trabajoExtra: {
      horas: 0,
      importe: 0
    },
    activAjenas: 0,
    deducciones: {
      vacacSimultanC82: 0,
      ausInjustJustC10_C11: 0,
      cMedC20: 0,
      vacacPlanifC25: 0,
      bajaC27: 0,
      nuevoIngC30: 0,
      trasladoC31: 0
    },
    salarioBasicoEscala: 4800,
    tarifaHoraria: Math.round((4800 / divisorLegal) * 100) / 100,
    notas: ''
  });

  const [horarioPlantilla, setHorarioPlantilla] = useState<'185' | '200' | '8h' | 'blank'>('185');
  const [activeSection, setActiveSection] = useState<'general' | 'adicionales' | 'deducciones'>('general');

  useEffect(() => {
    if (initialWorker) {
      setFormData(initialWorker);
      // Detectar si tiene horario de 200h
      if (initialWorker.dias.includes('12.5') || initialWorker.dias.includes('D')) {
        setHorarioPlantilla('200');
      } else {
        setHorarioPlantilla('185');
      }
    } else {
      const defaultCargo = settings.escalaCargos && settings.escalaCargos.length > 0
        ? settings.escalaCargos[2] || settings.escalaCargos[0]
        : { nombre: 'Técnico de Nivel Medio', salarioEscala: 4800, catOcupacionalDefault: 'T' as CatOcupacional };

      setFormData({
        id: `emp-${Date.now().toString().slice(-4)}`,
        nombreApellidos: '',
        cargo: defaultCargo.nombre,
        catOcupacional: defaultCargo.catOcupacionalDefault,
        centroCostoId: settings.centrosCosto?.[0]?.id || 'cc-101',
        fondoTiempoIndividual: 185,
        dias: generateDaysSchedule('185'),
        nocturnidad: {
          nochesComp100: 0,
          horas5: 0,
          horas10: 0,
          totalNocturnidad: 0
        },
        trabajoExtra: {
          horas: 0,
          importe: 0
        },
        activAjenas: 0,
        deducciones: {
          vacacSimultanC82: 0,
          ausInjustJustC10_C11: 0,
          cMedC20: 0,
          vacacPlanifC25: 0,
          bajaC27: 0,
          nuevoIngC30: 0,
          trasladoC31: 0
        },
        salarioBasicoEscala: defaultCargo.salarioEscala,
        tarifaHoraria: Math.round((defaultCargo.salarioEscala / divisorLegal) * 100) / 100,
        notas: ''
      });
      setHorarioPlantilla('185');
    }
  }, [initialWorker, isOpen, settings]);

  if (!isOpen) return null;

  // Manejador al seleccionar cargo de la escala
  const handleCargoChange = (cargoName: string) => {
    const cargoItem = settings.escalaCargos?.find(c => c.nombre === cargoName);
    if (cargoItem) {
      setFormData(prev => ({
        ...prev,
        cargo: cargoName,
        catOcupacional: cargoItem.catOcupacionalDefault,
        salarioBasicoEscala: cargoItem.salarioEscala,
        tarifaHoraria: Math.round((cargoItem.salarioEscala / divisorLegal) * 100) / 100
      }));
    } else {
      setFormData(prev => ({ ...prev, cargo: cargoName }));
    }
  };

  const handlePlantillaHorarioChange = (tipo: '185' | '200' | '8h' | 'blank') => {
    setHorarioPlantilla(tipo);
    setFormData(prev => ({
      ...prev,
      fondoTiempoIndividual: tipo === '200' ? 200 : 185,
      dias: generateDaysSchedule(tipo)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombreApellidos.trim()) {
      alert('Por favor ingrese el nombre y apellidos del trabajador.');
      return;
    }
    onSave(formData);
    onClose();
  };

  const handleDeleteSelf = () => {
    if (!initialWorker?.id || !onDelete) return;
    if (confirm(`¿Confirma que desea eliminar definitivamente a "${formData.nombreApellidos}" de la prenómina?`)) {
      onDelete(initialWorker.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabecera del Menú / Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-white rounded-lg">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {initialWorker ? 'Editar Datos del Trabajador para la Prenómina' : 'Crear y Registrar Trabajador en la Prenómina'}
              </h2>
              <p className="text-xs text-slate-500">
                Periodo activo: {settings.periodoNombre} · Control de Tiempo Oficial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Secciones */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-white text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveSection('general')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'general'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>1. Datos, Cargo & Jornada</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('adicionales')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'adicionales'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>2. Nocturnidad & Horas Extra (C-74)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('deducciones')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'deducciones'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>3. Deducciones & Vacaciones (C-25)</span>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          
          {/* SECCIÓN 1: DATOS GENERALES, CARGO Y JORNADA */}
          {activeSection === 'general' && (
            <div className="space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Nombre y Apellidos del Trabajador <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Roberto Martínez Valdés"
                  value={formData.nombreApellidos}
                  onChange={e => setFormData({ ...formData, nombreApellidos: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-slate-900 focus:ring-1 focus:ring-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Centro de Costo (CC) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.centroCostoId || 'cc-101'}
                    onChange={e => setFormData({ ...formData, centroCostoId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-slate-900 font-bold bg-white cursor-pointer"
                  >
                    {(settings.centrosCosto || []).map(cc => (
                      <option key={cc.id} value={cc.id}>
                        {cc.codigoCC} - {cc.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Cargo del Trabajador (Escala) <span className="text-rose-500">*</span>
                  </label>
                  {settings.escalaCargos && settings.escalaCargos.length > 0 ? (
                    <select
                      value={formData.cargo}
                      onChange={e => handleCargoChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-slate-900 font-semibold text-slate-900 cursor-pointer bg-slate-50/50"
                    >
                      <option value="">-- Seleccionar Cargo --</option>
                      {settings.escalaCargos.map(c => (
                        <option key={c.id} value={c.nombre}>
                          {c.nombre} · ${c.salarioEscala} ({c.catOcupacionalDefault})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Ej. Técnico de Mantenimiento"
                      value={formData.cargo || ''}
                      onChange={e => setFormData({ ...formData, cargo: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Categoría Ocupacional (Cat.)
                  </label>
                  <select
                    value={formData.catOcupacional}
                    onChange={e => setFormData({ ...formData, catOcupacional: e.target.value as CatOcupacional })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-slate-900 font-bold bg-white cursor-pointer"
                  >
                    <option value="T">T - Técnico</option>
                    <option value="C">C - Cuadro / Dirección</option>
                    <option value="O">O - Operario</option>
                    <option value="A">A - Administrativo</option>
                    <option value="S">S - Servicio</option>
                  </select>
                </div>
              </div>

              {/* Salario por Horas y Divisor Legal 190.6 (Código del Trabajo Cubano) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-2xs uppercase tracking-wider text-slate-800">
                    Base de Cálculo: Salario por Horas de Trabajo (Código del Trabajo Cubano)
                  </span>
                  <span className="text-2xs bg-blue-100 text-blue-900 px-2 py-0.5 rounded font-mono font-bold">
                    Divisor: {divisorLegal} horas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 mb-1">
                      Salario Escala del Cargo ($)
                    </label>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      value={formData.salarioBasicoEscala || ''}
                      onChange={e => {
                        const sal = parseFloat(e.target.value) || 0;
                        setFormData({
                          ...formData,
                          salarioBasicoEscala: sal,
                          tarifaHoraria: Math.round((sal / divisorLegal) * 100) / 100
                        });
                      }}
                      className="w-full px-2.5 py-1.5 font-mono font-bold text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                    <span className="text-2xs text-slate-500 mt-0.5 block">Asignado por el cargo</span>
                  </div>

                  <div>
                    <label className="block text-2xs font-bold text-slate-700 mb-1">
                      Divisor Legal Mensual (Horas)
                    </label>
                    <div className="px-2.5 py-1.5 font-mono font-bold text-xs bg-white border border-slate-200 rounded-lg text-slate-700">
                      {divisorLegal} horas/mes
                    </div>
                    <span className="text-2xs text-slate-500 mt-0.5 block">Ley laboral vigente</span>
                  </div>

                  <div>
                    <label className="block text-2xs font-bold text-slate-700 mb-1">
                      Tarifa Horaria Legal
                    </label>
                    <div className="px-2.5 py-1.5 font-mono font-bold text-xs bg-emerald-100/70 border border-emerald-300 rounded-lg text-emerald-950">
                      ${((formData.salarioBasicoEscala || 4800) / divisorLegal).toFixed(2)} / hora
                    </div>
                    <span className="text-2xs text-emerald-800 mt-0.5 block">Salario / {divisorLegal}h</span>
                  </div>
                </div>

                <div className="text-2xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-800">Cálculo de Salario:</span> El salario mensual de cada trabajador se liquida multiplicando las <strong>horas efectivas de trabajo</strong> por la tarifa horaria (salario del cargo dividido entre {divisorLegal} horas). Los días con descanso semanal <strong>'D'</strong> no computan horas trabajadas.
                </div>
              </div>

              {/* Plantilla de Horario Inicial */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Distribución Inicial de Jornada (Días 1 al 31)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlantillaHorarioChange('200')}
                    className={`p-2.5 text-left border rounded-lg transition-colors cursor-pointer ${
                      horarioPlantilla === '200'
                        ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>Jornada 200 Horas</span>
                      <span className="text-2xs px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black">Rotativa</span>
                    </div>
                    <div className="text-2xs opacity-90 mt-1">
                      Turnos rotativos 12.5h (2 de trabajo y 2 de descanso con 'D')
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePlantillaHorarioChange('185')}
                    className={`p-2.5 text-left border rounded-lg transition-colors cursor-pointer ${
                      horarioPlantilla === '185'
                        ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">Jornada 185 Horas</div>
                    <div className="text-2xs opacity-80 mt-1">Lunes a Jueves 9h, Viernes 8h</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePlantillaHorarioChange('blank')}
                    className={`p-2.5 text-left border rounded-lg transition-colors cursor-pointer ${
                      horarioPlantilla === 'blank'
                        ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">En Blanco</div>
                    <div className="text-2xs opacity-80 mt-1">Completar días en la hoja</div>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* SECCIÓN 2: NOCTURNIDAD Y HORAS EXTRAORDINARIAS */}
          {activeSection === 'adicionales' && (
            <div className="space-y-4">
              
              {/* Nocturnidad */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-yellow-50/40">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-amber-600" />
                  <span>Pagos de Nocturnidad</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-2xs font-semibold text-slate-700 mb-1">
                      Noches Comp. de $100
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.nocturnidad.nochesComp100 || ''}
                      placeholder="0"
                      onChange={e => setFormData({
                        ...formData,
                        nocturnidad: { ...formData.nocturnidad, nochesComp100: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-semibold text-slate-700 mb-1">
                      Horas Nocturnas de $5.00
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.nocturnidad.horas5 || ''}
                      placeholder="0"
                      onChange={e => {
                        const h5 = parseFloat(e.target.value) || 0;
                        const total = h5 * 5.00 + (formData.nocturnidad.horas10 || 0) * 10.00;
                        setFormData({
                          ...formData,
                          nocturnidad: { ...formData.nocturnidad, horas5: h5, totalNocturnidad: total }
                        });
                      }}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-semibold text-slate-700 mb-1">
                      Horas Nocturnas de $10.00
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.nocturnidad.horas10 || ''}
                      placeholder="0"
                      onChange={e => {
                        const h10 = parseFloat(e.target.value) || 0;
                        const total = (formData.nocturnidad.horas5 || 0) * 5.00 + h10 * 10.00;
                        setFormData({
                          ...formData,
                          nocturnidad: { ...formData.nocturnidad, horas10: h10, totalNocturnidad: total }
                        });
                      }}
                      className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-yellow-200/80 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Total Importe Nocturnidad ($):</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.nocturnidad.totalNocturnidad || ''}
                    placeholder="0.00"
                    onChange={e => setFormData({
                      ...formData,
                      nocturnidad: { ...formData.nocturnidad, totalNocturnidad: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-28 text-right px-2.5 py-1 font-mono font-bold text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Trabajo Extra C-74 */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-orange-50/40">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span>Trabajo Extraordinario (Código C-74)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-2xs font-semibold text-slate-700 mb-1">
                      Horas Extraordinarias Realizadas
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={formData.trabajoExtra.horas || ''}
                      placeholder="0"
                      onChange={e => {
                        const horas = parseFloat(e.target.value) || 0;
                        const tarifa = formData.tarifaHoraria || ((formData.salarioBasicoEscala || 4800) / divisorLegal);
                        const importeEst = Math.round(horas * tarifa * 2.0 * 100) / 100;
                        setFormData({
                          ...formData,
                          trabajoExtra: {
                            horas,
                            importe: formData.trabajoExtra.importe > 0 ? formData.trabajoExtra.importe : importeEst
                          }
                        });
                      }}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-semibold text-slate-700 mb-1">
                      Importe Total Trabajo Extra C-74 ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.trabajoExtra.importe || ''}
                      placeholder="0.00"
                      onChange={e => setFormData({
                        ...formData,
                        trabajoExtra: { ...formData.trabajoExtra, importe: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Actividades Ajenas */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Actividades Ajenas (Importe $)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.activAjenas || ''}
                  placeholder="0.00"
                  onChange={e => setFormData({ ...formData, activAjenas: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                />
              </div>

            </div>
          )}

          {/* SECCIÓN 3: DEDUCCIONES E INCIDENCIAS OFICIALES */}
          {activeSection === 'deducciones' && (
            <div className="space-y-4">
              
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-2xs text-slate-600">
                Ingresa las horas de deducciones o incidencias según los códigos de nómina de la empresa.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* C-25 Vacaciones */}
                <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl">
                  <label className="block text-xs font-bold text-rose-900 mb-1">
                    Vacaciones Planificadas (Código C-25)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.deducciones.vacacPlanifC25 || ''}
                    placeholder="0 horas"
                    onChange={e => setFormData({
                      ...formData,
                      deducciones: { ...formData.deducciones, vacacPlanifC25: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-white border border-rose-300 rounded-lg"
                  />
                  <span className="text-2xs text-rose-700 mt-1 block">
                    Horas de disfrute de vacaciones (ej. 97 horas).
                  </span>
                </div>

                {/* C-20 Certificado Médico */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Certificado Médico (Código C-20)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.deducciones.cMedC20 || ''}
                    placeholder="0 horas"
                    onChange={e => setFormData({
                      ...formData,
                      deducciones: { ...formData.deducciones, cMedC20: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                  />
                  <span className="text-2xs text-slate-500 mt-1 block">
                    Horas de baja temporal médica.
                  </span>
                </div>

                {/* C-10 y C-11 Ausencias */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Ausencias Justif. e Injustif. (C-10, C-11)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.deducciones.ausInjustJustC10_C11 || ''}
                    placeholder="0 horas"
                    onChange={e => setFormData({
                      ...formData,
                      deducciones: { ...formData.deducciones, ausInjustJustC10_C11: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                {/* C-82 / C-84 Vacaciones Simultáneas */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Vacaciones Simultáneas (C-82 / C-84)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.deducciones.vacacSimultanC82 || ''}
                    placeholder="0 horas"
                    onChange={e => setFormData({
                      ...formData,
                      deducciones: { ...formData.deducciones, vacacSimultanC82: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                {/* C-27 Baja */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Baja Definitiva (Código C-27)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.deducciones.bajaC27 || ''}
                    placeholder="0 horas"
                    onChange={e => setFormData({
                      ...formData,
                      deducciones: { ...formData.deducciones, bajaC27: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                {/* C-30 Nuevo Ingreso */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nuevo Ingreso (Código C-30)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.deducciones.nuevoIngC30 || ''}
                    placeholder="0 horas"
                    onChange={e => setFormData({
                      ...formData,
                      deducciones: { ...formData.deducciones, nuevoIngC30: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                  />
                </div>

              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notas u Observaciones
                </label>
                <textarea
                  rows={2}
                  value={formData.notas || ''}
                  onChange={e => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Detalles sobre turnos, justificaciones, guardias..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

            </div>
          )}

          {/* Botones de Acción al Pie del Modal */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {initialWorker && onDelete ? (
              <button
                type="button"
                onClick={handleDeleteSelf}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Eliminar Trabajador</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>{initialWorker ? 'Guardar Cambios' : 'Registrar en Prenómina'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

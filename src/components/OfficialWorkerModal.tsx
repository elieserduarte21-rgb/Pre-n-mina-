import React, { useState, useEffect } from 'react';
import { EmployeePrenomina, PayrollSettings, CatOcupacional } from '../types/payroll';
import { 
  getDeduccionHoursFromDays, 
  calculateWorkerSeniority, 
  calculateWorkerGradoAcademico, 
  calculateC82HoursFromDays, 
  getC82Hours,
  calculateC54HoursFromDays,
  getC54Hours,
  getWorkerAverageHourlyRate,
  isClaveTiempoRealAjena,
  normalizeClaveTiempoReal,
  getActividadAjenaHours,
  calculateActividadAjenaHoursFromDays,
  CLAVES_TIEMPO_REAL_AJENAS
} from '../utils/prenominaCalculator';
import { exportOfficialEmployeesToExcel, parseOfficialEmployeesFromExcel } from '../utils/excelHelper';
import { ExcelActions } from './ExcelActions';
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
  // Generador de plantilla de días según horario y almanaque del mes
  const [rotationStart, setRotationStart] = useState<'DD' | 'DT' | 'TT' | 'TD'>('TT');
  const [rotation192Start, setRotation192Start] = useState<'C1' | 'C2' | 'C3' | 'C4'>('C1');

  const generateDaysSchedule = (
    type: '185' | '200' | '192' | '188' | '8h' | 'blank', 
    startCycle200: 'DD' | 'DT' | 'TT' | 'TD' = 'TT',
    startCycle192: 'C1' | 'C2' | 'C3' | 'C4' = 'C1'
  ): string[] => {
    if (type === 'blank') {
      return Array(31).fill('');
    }
    if (type === '188') {
      // 188 horas: 8h Lunes a Viernes, D en Sábados y Domingos
      const days = Array(31).fill('');
      for (let i = 0; i < 31; i++) {
        const dayOfWeek = (i + 5) % 7;
        if (dayOfWeek === 5 || dayOfWeek === 6) {
          days[i] = 'D'; // Sábados y Domingos D
        } else {
          days[i] = '8'; // Lunes a Viernes 8h
        }
      }
      return days;
    }
    if (type === '200') {
      // 200 horas: turnos rotativos de 12.5h según inicio del mes (DD, DT, TT, TD)
      let cycle = ['12.5', '12.5', 'D', 'D']; // TT default
      if (startCycle200 === 'DD') cycle = ['D', 'D', '12.5', '12.5'];
      else if (startCycle200 === 'DT') cycle = ['D', '12.5', '12.5', 'D'];
      else if (startCycle200 === 'TD') cycle = ['12.5', 'D', 'D', '12.5'];
      else if (startCycle200 === 'TT') cycle = ['12.5', '12.5', 'D', 'D'];

      const days = [];
      for (let i = 0; i < 31; i++) {
        days.push(cycle[i % 4]);
      }
      return days;
    }
    if (type === '192') {
      // 192 horas: turnos rotativos de 24h trabajo x 72h descanso (1 día trabaja '24', 3 días descansa 'D')
      let cycle = ['24', 'D', 'D', 'D']; // C1 (Trabaja Día 1) default
      if (startCycle192 === 'C2') cycle = ['D', '24', 'D', 'D']; // Trabaja Día 2
      else if (startCycle192 === 'C3') cycle = ['D', 'D', '24', 'D']; // Trabaja Día 3
      else if (startCycle192 === 'C4') cycle = ['D', 'D', 'D', '24']; // Trabaja Día 4

      const days = [];
      for (let i = 0; i < 31; i++) {
        days.push(cycle[i % 4]);
      }
      return days;
    }
    if (type === '8h' || type === '185') {
      // 185 horas (o 8h): L-J 9h (o 8h), Viernes 8h, Sábados y Domingos D
      const days = Array(31).fill('');
      const is185 = type === '185';
      for (let i = 0; i < 31; i++) {
        const dayOfWeek = (i + 5) % 7;
        if (dayOfWeek === 5 || dayOfWeek === 6) {
          days[i] = 'D'; // Sábados y Domingos D
        } else if (is185 && dayOfWeek === 4) {
          days[i] = '8'; // Viernes 8h
        } else if (is185) {
          days[i] = '9'; // Lunes a Jueves 9h
        } else {
          days[i] = '8'; // L-V 8h
        }
      }
      return days;
    }
    return Array(31).fill('');
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

  const [horarioPlantilla, setHorarioPlantilla] = useState<'185' | '200' | '192' | '188' | '8h' | 'blank'>('185');
  const [activeSection, setActiveSection] = useState<'general' | 'adicionales' | 'deducciones'>('general');

  useEffect(() => {
    if (initialWorker) {
      setFormData(initialWorker);
      if (initialWorker.dias.includes('24')) {
        setHorarioPlantilla('192');
      } else if (initialWorker.dias.includes('12.5') || initialWorker.dias.includes('D')) {
        setHorarioPlantilla('200');
      } else if (initialWorker.dias.includes('4')) {
        setHorarioPlantilla('188');
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

  const handlePlantillaHorarioChange = (
    tipo: '185' | '200' | '192' | '188' | '8h' | 'blank', 
    cycle200: 'DD' | 'DT' | 'TT' | 'TD' = rotationStart,
    cycle192: 'C1' | 'C2' | 'C3' | 'C4' = rotation192Start
  ) => {
    setHorarioPlantilla(tipo);
    setFormData(prev => ({
      ...prev,
      fondoTiempoIndividual: tipo === '200' ? 200 : (tipo === '192' ? 192 : (tipo === '188' ? 188 : 185)),
      dias: generateDaysSchedule(tipo, cycle200, cycle192)
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
          <div className="flex items-center gap-2">
            <ExcelActions
              compact
              label="Ficha"
              exportTitle="Exportar datos de este trabajador a Excel (.xlsx)"
              importTitle="Importar datos de este trabajador desde Excel (.xlsx / .csv)"
              onExport={() => {
                exportOfficialEmployeesToExcel([formData], formData.centroCostoId || 'CC');
              }}
              onImport={(rows) => {
                const parsed = parseOfficialEmployeesFromExcel(rows, formData.centroCostoId || 'cc-101');
                if (parsed.length > 0) {
                  const imported = parsed[0];
                  setFormData(prev => ({
                    ...prev,
                    ...imported,
                    id: prev.id || imported.id
                  }));
                  alert(`Datos del trabajador "${imported.nombreApellidos}" importados exitosamente.`);
                } else {
                  alert('No se encontraron datos válidos de trabajador en el archivo Excel.');
                }
              }}
            />
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Número de Expediente (Exp.)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 1042"
                    value={formData.numeroExpediente || ''}
                    onChange={e => setFormData({ ...formData, numeroExpediente: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Sexo / Género
                  </label>
                  <select
                    value={formData.sexo || 'M'}
                    onChange={e => setFormData({ ...formData, sexo: e.target.value as 'M' | 'F' })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-slate-900 font-bold bg-white cursor-pointer"
                  >
                    <option value="M">Masculino (Hombre)</option>
                    <option value="F">Femenino (Mujer)</option>
                  </select>
                </div>
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

              {/* Fecha de Incorporación, Grado Académico y Salario Básico */}
              {(() => {
                const seniorityResult = calculateWorkerSeniority(formData, settings);
                const gradoResult = calculateWorkerGradoAcademico(formData, settings);
                const salarioBaseEscala = formData.salarioBasicoEscala || 4800;
                const salarioBasicoTotal = salarioBaseEscala + seniorityResult.monto + gradoResult.monto;
                const tarifaCalculada = Math.round((salarioBasicoTotal / divisorLegal) * 100) / 100;

                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                      <div>
                        <label className="block text-2xs font-bold text-amber-900 mb-1">
                          Fecha de Ingreso (Incorporación a la Empresa)
                        </label>
                        <input
                          type="date"
                          value={formData.fechaIngreso || ''}
                          onChange={e => setFormData({ ...formData, fechaIngreso: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-amber-300 rounded-lg text-slate-900"
                        />
                        <span className="text-3xs text-amber-800 mt-0.5 block">
                          {seniorityResult.anios > 0 ? `Antigüedad: ${seniorityResult.anios} año(s) en la empresa` : 'Sin antigüedad registrada'}
                        </span>
                      </div>
                      <div>
                        <label className="block text-2xs font-bold text-amber-900 mb-1">
                          Monto de Antigüedad ($) [Automático o Manual]
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            step="25"
                            value={formData.montoAntiguedadManual !== undefined ? formData.montoAntiguedadManual : seniorityResult.monto}
                            placeholder={`Calculado: $${seniorityResult.monto}`}
                            onChange={e => setFormData({
                              ...formData,
                              montoAntiguedadManual: e.target.value === '' ? undefined : parseFloat(e.target.value) || 0
                            })}
                            className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-amber-300 rounded-lg text-amber-950"
                          />
                          {formData.montoAntiguedadManual !== undefined && (
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, montoAntiguedadManual: undefined })}
                              className="text-2xs text-amber-700 underline shrink-0 cursor-pointer"
                              title="Volver al cálculo automático por años"
                            >
                              Auto
                            </button>
                          )}
                        </div>
                        <span className="text-3xs text-amber-800 mt-0.5 block">
                          Se suma a la escala salarial del cargo.
                        </span>
                      </div>
                    </div>

                    {/* Grado Académico (Licenciatura, Maestría, Doctorado, etc.) */}
                    <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-2xs font-bold text-blue-950 uppercase tracking-wider">
                          Grado Académico / Titulación (Suma a la Escala Salarial)
                        </label>
                        <span className="text-2xs font-mono font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                          +${gradoResult.monto}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div>
                          <select
                            value={formData.gradoAcademico || 'ninguno'}
                            onChange={e => setFormData({
                              ...formData,
                              gradoAcademico: e.target.value as any
                            })}
                            className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-blue-300 rounded-lg text-blue-950 cursor-pointer"
                          >
                            <option value="ninguno">Ninguno / Sin Grado Adicional</option>
                            <option value="licenciatura">Licenciatura (+${settings.montosGradosAcademicos?.licenciatura || 300})</option>
                            <option value="especialidad">Especialidad (+${settings.montosGradosAcademicos?.especialidad || 450})</option>
                            <option value="maestria">Maestría (+${settings.montosGradosAcademicos?.maestria || 600})</option>
                            <option value="doctorado">Doctorado (+${settings.montosGradosAcademicos?.doctorado || 900})</option>
                          </select>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xs font-semibold text-blue-900">Monto Grado ($):</span>
                            <input
                              type="number"
                              min="0"
                              step="25"
                              value={formData.montoGradoAcademicoManual !== undefined ? formData.montoGradoAcademicoManual : gradoResult.monto}
                              onChange={e => setFormData({
                                ...formData,
                                montoGradoAcademicoManual: e.target.value === '' ? undefined : parseFloat(e.target.value) || 0
                              })}
                              className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-blue-300 rounded-lg text-blue-950"
                            />
                            {formData.montoGradoAcademicoManual !== undefined && (
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, montoGradoAcademicoManual: undefined })}
                                className="text-2xs text-blue-700 underline shrink-0 cursor-pointer"
                              >
                                Auto
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Salario Escala + Antigüedad + Grado Académico y Tarifa Horaria */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-2xs uppercase tracking-wider text-slate-800">
                          Base de Cálculo: Escala + Antigüedad + Grado = Salario Básico (Divisor: {divisorLegal}h)
                        </span>
                        <span className="text-2xs bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-mono font-bold">
                          Total Básico: ${salarioBasicoTotal.toFixed(2)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                        <div>
                          <label className="block text-3xs font-bold text-slate-700 mb-0.5">
                            Salario Escala
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0.01"
                            value={formData.salarioBasicoEscala || ''}
                            onChange={e => {
                              const sal = parseFloat(e.target.value) || 0;
                              setFormData({
                                ...formData,
                                salarioBasicoEscala: sal
                              });
                            }}
                            className="w-full px-2 py-1 font-mono font-bold text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-3xs font-bold text-amber-900 mb-0.5">
                            Antigüedad
                          </label>
                          <div className="px-2 py-1 font-mono font-bold text-xs bg-amber-100 border border-amber-300 rounded-lg text-amber-950">
                            +${seniorityResult.monto.toFixed(2)}
                          </div>
                        </div>

                        <div>
                          <label className="block text-3xs font-bold text-blue-900 mb-0.5">
                            Grado Acad.
                          </label>
                          <div className="px-2 py-1 font-mono font-bold text-xs bg-blue-100 border border-blue-300 rounded-lg text-blue-950">
                            +${gradoResult.monto.toFixed(2)}
                          </div>
                        </div>

                        <div>
                          <label className="block text-3xs font-bold text-emerald-900 mb-0.5">
                            Básico Total
                          </label>
                          <div className="px-2 py-1 font-mono font-bold text-xs bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-950">
                            ${salarioBasicoTotal.toFixed(2)}
                          </div>
                        </div>

                        <div>
                          <label className="block text-3xs font-bold text-slate-700 mb-0.5">
                            Tarifa Horaria
                          </label>
                          <div className="px-2 py-1 font-mono font-bold text-xs bg-slate-900 text-white rounded-lg">
                            ${tarifaCalculada.toFixed(2)}/h
                          </div>
                        </div>
                      </div>

                      <div className="text-2xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="font-semibold text-slate-800">Cálculo de Salario:</span> El salario mensual se liquida multiplicando las <strong>horas efectivas de trabajo</strong> por la tarifa horaria (salario básico total dividido entre {divisorLegal} horas).
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Plantilla de Horario Inicial */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Distribución Inicial de Jornada (Días 1 al 31 según Almanaque)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => handlePlantillaHorarioChange('192', rotationStart, rotation192Start)}
                    className={`p-2.5 text-left border rounded-lg transition-colors cursor-pointer ${
                      horarioPlantilla === '192'
                        ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>Jornada 192 Horas</span>
                      <span className="text-2xs px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 font-black">24h Rotativa</span>
                    </div>
                    <div className="text-2xs opacity-90 mt-1">
                      Turnos rotativos 24h (1 trabajo '24', 3 descanso 'D')
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePlantillaHorarioChange('200', rotationStart, rotation192Start)}
                    className={`p-2.5 text-left border rounded-lg transition-colors cursor-pointer ${
                      horarioPlantilla === '200'
                        ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>Jornada 200 Horas</span>
                      <span className="text-2xs px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black">12.5h Rotativa</span>
                    </div>
                    <div className="text-2xs opacity-90 mt-1">
                      Turnos rotativos 12.5h (2 trabajo, 2 descanso 'D')
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePlantillaHorarioChange('188')}
                    className={`p-2.5 text-left border rounded-lg transition-colors cursor-pointer ${
                      horarioPlantilla === '188'
                        ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>Jornada 188 Horas</span>
                      <span className="text-2xs px-1.5 py-0.2 rounded bg-blue-100 text-blue-900 font-black">8h + Sáb Alt</span>
                    </div>
                    <div className="text-2xs opacity-90 mt-1">
                      8h Lunes a Viernes y 4h Sábados alternos ('D' en domingos y sábados libres)
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
                </div>

                {horarioPlantilla === '192' && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between text-2xs mb-3">
                    <span className="font-bold text-purple-900">¿En qué ciclo de la rotación 24h x 72h inicia el día 1 del mes?:</span>
                    <div className="flex gap-2">
                      {(['C1', 'C2', 'C3', 'C4'] as const).map(cycle => (
                        <button
                          key={cycle}
                          type="button"
                          onClick={() => {
                            setRotation192Start(cycle);
                            handlePlantillaHorarioChange('192', rotationStart, cycle);
                          }}
                          className={`px-2.5 py-1 rounded font-mono font-bold transition-colors cursor-pointer ${
                            rotation192Start === cycle
                              ? 'bg-purple-700 text-white'
                              : 'bg-white text-purple-900 border border-purple-300 hover:bg-purple-100'
                          }`}
                        >
                          {cycle === 'C1' ? 'Ciclo 1 (Trabaja Día 1)' :
                           cycle === 'C2' ? 'Ciclo 2 (Trabaja Día 2)' :
                           cycle === 'C3' ? 'Ciclo 3 (Trabaja Día 3)' : 'Ciclo 4 (Trabaja Día 4)'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {horarioPlantilla === '200' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-2xs">
                    <span className="font-bold text-amber-900">¿Cómo inicia el mes el turno de 12.5h? (Almanaque):</span>
                    <div className="flex gap-2">
                      {(['DD', 'DT', 'TT', 'TD'] as const).map(cycle => (
                        <button
                          key={cycle}
                          type="button"
                          onClick={() => {
                            setRotationStart(cycle);
                            handlePlantillaHorarioChange('200', cycle, rotation192Start);
                          }}
                          className={`px-2.5 py-1 rounded font-mono font-bold transition-colors cursor-pointer ${
                            rotationStart === cycle
                              ? 'bg-amber-600 text-white'
                              : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100'
                          }`}
                        >
                          {cycle === 'DD' ? 'Descanso-Descanso (DD)' :
                           cycle === 'DT' ? 'Descanso-Trabajo (DT)' :
                           cycle === 'TT' ? 'Trabajo-Trabajo (TT)' : 'Trabajo-Descanso (TD)'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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

              {/* C-82 Vacaciones Simultáneas (Actividad Ajena que suma al tiempo real laborado) */}
              <div className="border border-amber-200 bg-amber-50/60 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <span>Actividades Ajenas que suman al tiempo real (C-82, C-85, C-57, C-72, C-69)</span>
                  </span>
                  <span className="text-3xs font-mono font-bold bg-amber-200 text-amber-950 px-2 py-0.5 rounded">
                    Suman al tiempo real laborado
                  </span>
                </div>
                <p className="text-3xs text-slate-600 leading-snug">
                  Las claves <strong>C-82</strong>, <strong>C-85</strong>, <strong>C-57</strong>, <strong>C-72</strong> y <strong>C-69</strong> muestran el tiempo que debió trabajar el trabajador y <strong>se suman directamente al tiempo real trabajado</strong>.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {[
                    { codigo: 'C-82', nombre: 'C-82 Vacac. Simultáneas' },
                    { codigo: 'C-85', nombre: 'C-85 Movilizados / Defensa' },
                    { codigo: 'C-57', nombre: 'C-57 Interrupción autorizada' },
                    { codigo: 'C-72', nombre: 'C-72 Capacitación / Comisión' },
                    { codigo: 'C-69', nombre: 'C-69 Categoría Ocupacional' },
                  ].map(item => {
                    const autoDays = calculateActividadAjenaHoursFromDays(formData, item.codigo);
                    const totalH = getActividadAjenaHours(formData, item.codigo);
                    const manualVal = formData.activAjenasValores?.[item.codigo] ?? (item.codigo === 'C-82' ? (formData.deducciones?.vacacSimultanC82 || '') : '');

                    return (
                      <div key={item.codigo} className="border border-amber-200 bg-amber-50/60 rounded-xl p-2.5 space-y-1">
                        <div className="flex justify-between items-center text-xs font-bold text-amber-950">
                          <span>{item.nombre}</span>
                          <span className="text-3xs font-mono font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">
                            Total: {totalH} h
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-3xs">
                          <div>
                            <label className="block text-slate-600 mb-0.5 font-medium">Horas manuales:</label>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              value={manualVal}
                              placeholder="0"
                              onChange={e => {
                                const val = parseFloat(e.target.value) || 0;
                                const newObj = { ...(formData.activAjenasValores || {}), [item.codigo]: val };
                                const updates: Partial<EmployeePrenomina> = { activAjenasValores: newObj };
                                if (item.codigo === 'C-82') {
                                  updates.deducciones = { ...(formData.deducciones || {}), vacacSimultanC82: val };
                                }
                                setFormData({ ...formData, ...updates });
                              }}
                              className="w-full px-2 py-1 font-mono font-bold bg-white border border-slate-300 rounded text-slate-900"
                            />
                          </div>
                          <div>
                            <span className="block text-slate-500 mb-0.5">En días ({autoDays}h):</span>
                            <div className="px-2 py-1 font-mono font-bold bg-slate-100 rounded border border-slate-200 text-slate-700">
                              {autoDays} h
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* C-54 Movilización Militar (Actividad Ajena pagada por Salario Promedio) */}
              <div className="border border-emerald-200 bg-emerald-50/60 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-700" />
                    <span>C-54 Movilización Militar (Salario Promedio)</span>
                  </span>
                  <span className="text-3xs font-mono font-bold bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded">
                    Pagada a tarifa promedio
                  </span>
                </div>
                <p className="text-3xs text-slate-600 leading-snug">
                  La clave <strong>C-54</strong> (Movilización Militar) se calcula acumulando las horas de la jornada correspondiente por los días indicados y se multiplica por la <strong>tarifa horaria promedio</strong> del trabajador.
                </p>

                {(() => {
                  const autoC54Days = calculateC54HoursFromDays(formData);
                  const totalH54 = getC54Hours(formData);
                  const manualVal54 = formData.activAjenasValores?.[ 'C-54' ] ?? formData.activAjenasValores?.[ 'C54' ] ?? '';
                  const rateProm = getWorkerAverageHourlyRate(formData) || (formData.salarioBasicoEscala ? formData.salarioBasicoEscala / 190.6 : 25);
                  const importeC54Calc = Math.round(totalH54 * rateProm * 100) / 100;

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-3xs">
                      <div>
                        <label className="block text-slate-600 mb-0.5 font-medium">Horas manuales:</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={manualVal54}
                          placeholder="0"
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            const newObj = { ...(formData.activAjenasValores || {}), 'C-54': val, 'C54': val };
                            setFormData({ ...formData, activAjenasValores: newObj });
                          }}
                          className="w-full px-2 py-1 font-mono font-bold bg-white border border-slate-300 rounded text-slate-900"
                        />
                      </div>
                      <div>
                        <span className="block text-slate-500 mb-0.5">En días ({autoC54Days}h):</span>
                        <div className="px-2 py-1 font-mono font-bold bg-slate-100 rounded border border-slate-200 text-slate-700">
                          {autoC54Days} h
                        </div>
                      </div>
                      <div>
                        <span className="block text-slate-500 mb-0.5">Importe C-54 ({totalH54}h × ${rateProm.toFixed(2)}/h):</span>
                        <div className="px-2 py-1 font-mono font-bold bg-emerald-100/90 text-emerald-950 rounded border border-emerald-300">
                          ${importeC54Calc.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Otras Actividades Ajenas */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Otras Actividades Ajenas (Importe monetario $)
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
                Suma automática de deducciones: Las claves de descuento en la distribución de tiempo (ej. 'V' o 'C-25', 'C-20', 'C-10', 'C-11') se calculan automáticamente según la jornada del trabajador y se suman con las horas manuales ingresadas aquí.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* C-25 Vacaciones */}
                {(() => {
                  const autoC25 = getDeduccionHoursFromDays(formData, 'C-25');
                  const manualC25 = formData.deducciones.vacacPlanifC25 || 0;
                  const totalC25 = manualC25 + autoC25;
                  return (
                    <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-rose-900">
                          Vacaciones Planificadas (C-25)
                        </label>
                        <span className="text-3xs font-mono font-bold bg-rose-200 text-rose-950 px-1.5 py-0.5 rounded">
                          Total: {totalC25} h
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={manualC25 || ''}
                        placeholder="0 horas manuales"
                        onChange={e => setFormData({
                          ...formData,
                          deducciones: { ...formData.deducciones, vacacPlanifC25: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-white border border-rose-300 rounded-lg"
                      />
                      <span className="text-2xs text-rose-700 mt-1 block">
                        Horas manuales: {manualC25} h · De distribución de tiempo ('V'): {autoC25} h.
                      </span>
                    </div>
                  );
                })()}

                {/* C-20 Certificado Médico */}
                {(() => {
                  const autoC20 = getDeduccionHoursFromDays(formData, 'C-20');
                  const manualC20 = formData.deducciones.cMedC20 || 0;
                  const totalC20 = manualC20 + autoC20;
                  return (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-slate-800">
                          Certificado Médico (C-20)
                        </label>
                        <div className="flex items-center gap-1.5">
                          <span className="text-3xs bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium">
                            Exento de Impuesto
                          </span>
                          <span className="text-3xs font-mono font-bold bg-slate-200 text-slate-900 px-1.5 py-0.5 rounded">
                            Total: {totalC20} h
                          </span>
                        </div>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={manualC20 || ''}
                        placeholder="0 horas manuales"
                        onChange={e => setFormData({
                          ...formData,
                          deducciones: { ...formData.deducciones, cMedC20: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                      />
                      <span className="text-2xs text-slate-500 mt-1 block">
                        Horas manuales: {manualC20} h · De distribución de tiempo ('C-20'): {autoC20} h. Subsidio de Seguridad Social protegido sin descuento tributario.
                      </span>
                    </div>
                  );
                })()}

                {/* C-10 y C-11 Ausencias */}
                {(() => {
                  const autoC10 = getDeduccionHoursFromDays(formData, 'C-10') + getDeduccionHoursFromDays(formData, 'C-11');
                  const manualC10 = formData.deducciones.ausInjustJustC10_C11 || 0;
                  const totalC10 = manualC10 + autoC10;
                  return (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-slate-800">
                          Ausencias Justif. / Injustif. (C-10, C-11)
                        </label>
                        <span className="text-3xs font-mono font-bold bg-slate-200 text-slate-900 px-1.5 py-0.5 rounded">
                          Total: {totalC10} h
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={manualC10 || ''}
                        placeholder="0 horas manuales"
                        onChange={e => setFormData({
                          ...formData,
                          deducciones: { ...formData.deducciones, ausInjustJustC10_C11: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                      />
                      <span className="text-2xs text-slate-500 mt-1 block">
                        Horas manuales: {manualC10} h · De días ('C-10'/'C-11'): {autoC10} h.
                      </span>
                    </div>
                  );
                })()}

                {/* C-84 Prestación Social Simultánea */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Prestación Social Simultánea (C-84)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.deduccionesValores?.['C-84'] || ''}
                    placeholder="0 horas"
                    onChange={e => setFormData({
                      ...formData,
                      deduccionesValores: { ...(formData.deduccionesValores || {}), 'C-84': parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                {/* C-27 Baja */}
                <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-rose-900">
                      Baja Definitiva (Código C-27)
                    </label>
                    <span className="text-3xs font-mono font-bold bg-rose-200 text-rose-950 px-1.5 py-0.5 rounded">
                      Control de Bajas
                    </span>
                  </div>
                  <div>
                    <label className="block text-3xs font-semibold text-slate-600 mb-0.5">Horas de deducción:</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.deducciones.bajaC27 || ''}
                      placeholder="0 horas"
                      onChange={e => setFormData({
                        ...formData,
                        deducciones: { ...formData.deducciones, bajaC27: parseFloat(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-rose-300 rounded-lg font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-rose-200/60">
                    <div>
                      <label className="block text-3xs font-semibold text-rose-900 mb-0.5">Fecha de la Baja:</label>
                      <input
                        type="date"
                        value={formData.fechaBaja || ''}
                        onChange={e => setFormData({ ...formData, fechaBaja: e.target.value })}
                        className="w-full px-2 py-1 text-xs bg-white border border-rose-300 rounded font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-3xs font-semibold text-rose-900 mb-0.5">Motivo de la Baja:</label>
                      <input
                        type="text"
                        placeholder="Ej. Renuncia, Jubilación..."
                        value={formData.motivoBaja || ''}
                        onChange={e => setFormData({ ...formData, motivoBaja: e.target.value })}
                        className="w-full px-2 py-1 text-xs bg-white border border-rose-300 rounded font-medium"
                      />
                    </div>
                  </div>
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

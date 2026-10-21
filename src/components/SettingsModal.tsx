import React, { useState } from 'react';
import { 
  PayrollSettings, 
  EscalaSalarialCargo, 
  CatOcupacional, 
  CentroCosto, 
  ClaveDeduccion, 
  TarifaNocturnidad, 
  ClaveActividadAjena 
} from '../types/payroll';
import { 
  DEFAULT_PAYROLL_SETTINGS, 
  DEFAULT_ESCALA_SALARIAL, 
  DEFAULT_CENTROS_COSTO, 
  DEFAULT_CLAVES_DEDUCCION,
  DEFAULT_TARIFAS_NOCTURNIDAD,
  DEFAULT_CLAVES_ACTIVIDADES_AJENAS
} from '../data/defaultData';
import { 
  X, 
  Sliders, 
  RotateCcw, 
  Check, 
  Briefcase, 
  Plus, 
  Trash2, 
  Building2, 
  Tag, 
  Percent, 
  Moon, 
  DollarSign, 
  Layers 
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PayrollSettings;
  onSave: (newSettings: PayrollSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<'centrosCosto' | 'escala' | 'deducciones' | 'nocturnidad' | 'activAjenas' | 'tasas'>('deducciones');

  const [formData, setFormData] = useState<PayrollSettings>(() => ({
    ...settings,
    divisorHorasMes: settings.divisorHorasMes || 190.6,
    escalaCargos: settings.escalaCargos && settings.escalaCargos.length > 0 
      ? settings.escalaCargos 
      : DEFAULT_ESCALA_SALARIAL,
    centrosCosto: settings.centrosCosto && settings.centrosCosto.length > 0
      ? settings.centrosCosto
      : DEFAULT_CENTROS_COSTO,
    clavesDeduccion: settings.clavesDeduccion && settings.clavesDeduccion.length > 0
      ? settings.clavesDeduccion
      : DEFAULT_CLAVES_DEDUCCION,
    tarifasNocturnidad: settings.tarifasNocturnidad && settings.tarifasNocturnidad.length > 0
      ? settings.tarifasNocturnidad
      : DEFAULT_TARIFAS_NOCTURNIDAD,
    clavesActividadesAjenas: settings.clavesActividadesAjenas && settings.clavesActividadesAjenas.length > 0
      ? settings.clavesActividadesAjenas
      : DEFAULT_CLAVES_ACTIVIDADES_AJENAS
  }));

  // Estado para el formulario de nuevo cargo
  const [nuevoCargo, setNuevoCargo] = useState<{
    nombre: string;
    salarioEscala: number;
    catOcupacionalDefault: CatOcupacional;
    grupoEscala: string;
    descripcion: string;
  }>({
    nombre: '',
    salarioEscala: 4800,
    catOcupacionalDefault: 'T',
    grupoEscala: 'Grupo XI',
    descripcion: ''
  });

  // Estado para nuevo Centro de Costo (CC)
  const [nuevoCC, setNuevoCC] = useState<{
    codigoCC: string;
    nombre: string;
    confecciona: string;
    chequea: string;
    aprueba: string;
    anota: string;
    codigoREEUP: string;
    descripcion: string;
  }>({
    codigoCC: 'CC 104',
    nombre: '',
    confecciona: 'DAYSI REYES DÍAZ',
    chequea: 'PEDRO ALBERTO GALBÁN LOPEZ',
    aprueba: 'ZUNILDA MENDEZ LINARES',
    anota: 'ELIESER DUARTES LÓPEZ',
    codigoREEUP: '151.0.4897',
    descripcion: ''
  });

  // Estado para nueva Clave de Deducción
  const [nuevaClaveDed, setNuevaClaveDed] = useState<{
    codigo: string;
    nombre: string;
    descripcion: string;
    tipo: 'vacaciones' | 'medico' | 'ausencia' | 'baja' | 'otro';
  }>({
    codigo: '',
    nombre: '',
    descripcion: '',
    tipo: 'otro'
  });

  // Estado para nueva Tarifa de Nocturnidad
  const [nuevaTarifaNoct, setNuevaTarifaNoct] = useState<{
    codigo: string;
    nombre: string;
    tarifa: number;
    tipo: 'noche' | 'hora';
  }>({
    codigo: '',
    nombre: '',
    tarifa: 5.00,
    tipo: 'hora'
  });

  // Estado para nueva Clave de Actividad Ajena
  const [nuevaClaveAct, setNuevaClaveAct] = useState<{
    codigo: string;
    nombre: string;
    descripcion: string;
  }>({
    codigo: '',
    nombre: '',
    descripcion: ''
  });

  if (!isOpen) return null;

  const divisorLegal = formData.divisorHorasMes || 190.6;

  const handleResetDefaults = () => {
    if (confirm('¿Desea restablecer todos los parámetros, escala, CC, claves y tarifas a los valores predeterminados?')) {
      setFormData({ 
        ...DEFAULT_PAYROLL_SETTINGS,
        divisorHorasMes: 190.6,
        escalaCargos: [...DEFAULT_ESCALA_SALARIAL],
        centrosCosto: [...DEFAULT_CENTROS_COSTO],
        clavesDeduccion: [...DEFAULT_CLAVES_DEDUCCION],
        tarifasNocturnidad: [...DEFAULT_TARIFAS_NOCTURNIDAD],
        clavesActividadesAjenas: [...DEFAULT_CLAVES_ACTIVIDADES_AJENAS]
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const updateNumberField = (field: keyof PayrollSettings, value: string) => {
    const val = parseFloat(value);
    setFormData((prev: PayrollSettings) => ({
      ...prev,
      [field]: isNaN(val) ? 0 : val
    }));
  };

  // --- MANEJO DE ESCALA SALARIAL ---
  const handleUpdateCargoSalario = (cargoId: string, nuevoSalario: number) => {
    setFormData((prev: PayrollSettings) => ({
      ...prev,
      escalaCargos: (prev.escalaCargos || []).map(c =>
        c.id === cargoId ? { ...c, salarioEscala: Math.max(0, nuevoSalario) } : c
      )
    }));
  };

  const handleUpdateCargoCat = (cargoId: string, nuevaCat: CatOcupacional) => {
    setFormData((prev: PayrollSettings) => ({
      ...prev,
      escalaCargos: (prev.escalaCargos || []).map(c =>
        c.id === cargoId ? { ...c, catOcupacionalDefault: nuevaCat } : c
      )
    }));
  };

  const handleEliminarCargo = (cargoId: string) => {
    const cargo = (formData.escalaCargos || []).find(c => c.id === cargoId);
    if (confirm(`¿Desea eliminar el cargo "${cargo?.nombre || ''}" de la escala salarial?`)) {
      setFormData((prev: PayrollSettings) => ({
        ...prev,
        escalaCargos: (prev.escalaCargos || []).filter(c => c.id !== cargoId)
      }));
    }
  };

  const handleAgregarCargo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoCargo.nombre.trim()) {
      alert('Por favor ingrese el nombre del cargo.');
      return;
    }

    const nuevoItem: EscalaSalarialCargo = {
      id: `cargo-${Date.now().toString().slice(-4)}`,
      nombre: nuevoCargo.nombre.trim(),
      salarioEscala: Math.max(0, nuevoCargo.salarioEscala),
      catOcupacionalDefault: nuevoCargo.catOcupacionalDefault,
      grupoEscala: nuevoCargo.grupoEscala.trim() || 'General',
      descripcion: nuevoCargo.descripcion.trim()
    };

    setFormData((prev: PayrollSettings) => ({
      ...prev,
      escalaCargos: [...(prev.escalaCargos || []), nuevoItem]
    }));

    setNuevoCargo({
      nombre: '',
      salarioEscala: 4800,
      catOcupacionalDefault: 'T',
      grupoEscala: 'Grupo XI',
      descripcion: ''
    });
  };

  // --- MANEJO DE CENTROS DE COSTO (CC) ---
  const handleUpdateCCField = (ccId: string, field: keyof CentroCosto, value: string) => {
    setFormData((prev: PayrollSettings) => ({
      ...prev,
      centrosCosto: (prev.centrosCosto || []).map(cc =>
        cc.id === ccId ? { ...cc, [field]: value } : cc
      )
    }));
  };

  const handleEliminarCC = (ccId: string) => {
    if ((formData.centrosCosto || []).length <= 1) {
      alert('Debe existir al menos un Centro de Costo en la empresa.');
      return;
    }
    const cc = (formData.centrosCosto || []).find(c => c.id === ccId);
    if (confirm(`¿Desea eliminar el Centro de Costo "${cc?.codigoCC} - ${cc?.nombre}"?`)) {
      setFormData((prev: PayrollSettings) => ({
        ...prev,
        centrosCosto: (prev.centrosCosto || []).filter(c => c.id !== ccId)
      }));
    }
  };

  const handleAgregarCC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoCC.codigoCC.trim() || !nuevoCC.nombre.trim()) {
      alert('Por favor ingrese el código y nombre del Centro de Costo.');
      return;
    }

    const itemCC: CentroCosto = {
      id: `cc-${Date.now().toString().slice(-4)}`,
      codigoCC: nuevoCC.codigoCC.trim().toUpperCase(),
      nombre: nuevoCC.nombre.trim().toUpperCase(),
      confecciona: nuevoCC.confecciona.trim().toUpperCase(),
      chequea: nuevoCC.chequea.trim().toUpperCase(),
      aprueba: nuevoCC.aprueba.trim().toUpperCase(),
      anota: nuevoCC.anota.trim().toUpperCase(),
      codigoREEUP: nuevoCC.codigoREEUP.trim(),
      descripcion: nuevoCC.descripcion.trim()
    };

    setFormData((prev: PayrollSettings) => ({
      ...prev,
      centrosCosto: [...(prev.centrosCosto || []), itemCC]
    }));

    setNuevoCC({
      codigoCC: `CC ${100 + (formData.centrosCosto?.length || 0) + 2}`,
      nombre: '',
      confecciona: 'DAYSI REYES DÍAZ',
      chequea: 'PEDRO ALBERTO GALBÁN LOPEZ',
      aprueba: 'ZUNILDA MENDEZ LINARES',
      anota: 'ELIESER DUARTES LÓPEZ',
      codigoREEUP: '151.0.4897',
      descripcion: ''
    });
  };

  // --- MANEJO DE CLAVES DE DEDUCCIÓN (ESCAQUE DE DEDUCCIONES) ---
  const handleUpdateClaveDed = (index: number, field: keyof ClaveDeduccion, value: any) => {
    setFormData((prev: PayrollSettings) => {
      const next = [...(prev.clavesDeduccion || [])];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, clavesDeduccion: next };
    });
  };

  const handleEliminarClaveDed = (codigo: string) => {
    if (confirm(`¿Desea quitar la clave de deducción "${codigo}" de la prenómina?`)) {
      setFormData((prev: PayrollSettings) => ({
        ...prev,
        clavesDeduccion: (prev.clavesDeduccion || []).filter(c => c.codigo !== codigo)
      }));
    }
  };

  const handleAgregarClaveDed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaClaveDed.codigo.trim() || !nuevaClaveDed.nombre.trim()) {
      alert('Por favor ingrese el código (ej. C-40) y nombre de la deducción.');
      return;
    }

    const itemClave: ClaveDeduccion = {
      codigo: nuevaClaveDed.codigo.trim().toUpperCase(),
      nombre: nuevaClaveDed.nombre.trim(),
      descripcion: nuevaClaveDed.descripcion.trim(),
      tipo: nuevaClaveDed.tipo,
      activa: true
    };

    setFormData((prev: PayrollSettings) => ({
      ...prev,
      clavesDeduccion: [...(prev.clavesDeduccion || []), itemClave]
    }));

    setNuevaClaveDed({
      codigo: '',
      nombre: '',
      descripcion: '',
      tipo: 'otro'
    });
  };

  // --- MANEJO DE NOCTURNIDAD Y TARIFAS (ESCAQUE DE NOCTURNIDAD) ---
  const handleUpdateTarifaNoct = (index: number, field: keyof TarifaNocturnidad, value: any) => {
    setFormData((prev: PayrollSettings) => {
      const next = [...(prev.tarifasNocturnidad || [])];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, tarifasNocturnidad: next };
    });
  };

  const handleEliminarTarifaNoct = (id: string) => {
    if (confirm('¿Desea quitar esta clave de nocturnidad?')) {
      setFormData((prev: PayrollSettings) => ({
        ...prev,
        tarifasNocturnidad: (prev.tarifasNocturnidad || []).filter(t => t.id !== id)
      }));
    }
  };

  const handleAgregarTarifaNoct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaTarifaNoct.nombre.trim()) {
      alert('Por favor ingrese el nombre y tarifa de la nocturnidad.');
      return;
    }

    const itemTarifa: TarifaNocturnidad = {
      id: `noct-${Date.now().toString().slice(-4)}`,
      codigo: nuevaTarifaNoct.codigo.trim() || `noct_${Date.now().toString().slice(-4)}`,
      nombre: nuevaTarifaNoct.nombre.trim(),
      tarifa: Math.max(0, nuevaTarifaNoct.tarifa),
      tipo: nuevaTarifaNoct.tipo,
      activa: true
    };

    setFormData((prev: PayrollSettings) => ({
      ...prev,
      tarifasNocturnidad: [...(prev.tarifasNocturnidad || []), itemTarifa]
    }));

    setNuevaTarifaNoct({
      codigo: '',
      nombre: '',
      tarifa: 5.00,
      tipo: 'hora'
    });
  };

  // --- MANEJO DE ACTIVIDADES AJENAS ---
  const handleUpdateActividadAjena = (index: number, field: keyof ClaveActividadAjena, value: any) => {
    setFormData((prev: PayrollSettings) => {
      const next = [...(prev.clavesActividadesAjenas || [])];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, clavesActividadesAjenas: next };
    });
  };

  const handleEliminarActividadAjena = (id: string) => {
    if (confirm('¿Desea quitar esta clave de actividades ajenas?')) {
      setFormData((prev: PayrollSettings) => ({
        ...prev,
        clavesActividadesAjenas: (prev.clavesActividadesAjenas || []).filter(a => a.id !== id)
      }));
    }
  };

  const handleAgregarActividadAjena = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaClaveAct.nombre.trim()) {
      alert('Por favor ingrese el nombre del escaque de actividades ajenas.');
      return;
    }

    const itemAct: ClaveActividadAjena = {
      id: `act-${Date.now().toString().slice(-4)}`,
      codigo: nuevaClaveAct.codigo.trim().toUpperCase() || `ACT-0${(formData.clavesActividadesAjenas?.length || 0) + 1}`,
      nombre: nuevaClaveAct.nombre.trim(),
      descripcion: nuevaClaveAct.descripcion.trim(),
      activa: true
    };

    setFormData((prev: PayrollSettings) => ({
      ...prev,
      clavesActividadesAjenas: [...(prev.clavesActividadesAjenas || []), itemAct]
    }));

    setNuevaClaveAct({
      codigo: '',
      nombre: '',
      descripcion: ''
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-700" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Configuración de Escaques, Claves, Nocturnidad y Centros de Costo
              </h2>
              <p className="text-xs text-slate-500">
                Personaliza las columnas de deducciones, tarifas de nocturnidad, actividades ajenas y escala salarial
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

        {/* Pestañas de Navegación de Configuración */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-200 bg-white text-xs font-medium overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('deducciones')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'deducciones'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Escaque Deducciones ({(formData.clavesDeduccion || []).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('nocturnidad')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'nocturnidad'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Escaque Nocturnidad ({(formData.tarifasNocturnidad || []).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('activAjenas')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'activAjenas'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Actividades Ajenas ({(formData.clavesActividadesAjenas || []).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('centrosCosto')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'centrosCosto'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Centros de Costo (CC) ({(formData.centrosCosto || []).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('escala')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'escala'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Escala Salarial ({(formData.escalaCargos || []).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tasas')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'tasas'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Divisor Legal ({divisorLegal}h)</span>
          </button>
        </div>

        {/* Contenido del Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          
          {/* PESTAÑA: ESCAQUE DE DEDUCCIONES (AGREGAR / QUITAR / EDITAR CLAVES) */}
          {activeTab === 'deducciones' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-2xs mb-1">
                  Modificación del Escaque de Deducciones (Agregar, Quitar y Editar Claves)
                </h3>
                <p className="text-slate-500 text-2xs">
                  Aquí puedes agregar nuevas claves de deducción, editar el nombre de las existentes o desactivar las que no utilices. Cada clave activa se convierte automáticamente en una columna en la prenómina oficial.
                </p>
              </div>

              {/* Tabla de Claves de Descuento */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold text-2xs uppercase">
                      <th className="py-2.5 px-3 w-16 text-center">Visible</th>
                      <th className="py-2.5 px-3 w-24">Código</th>
                      <th className="py-2.5 px-3">Leyenda / Nombre</th>
                      <th className="py-2.5 px-3">Descripción</th>
                      <th className="py-2.5 px-2 text-center w-8">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(formData.clavesDeduccion || []).map((clave, index) => (
                      <tr key={clave.codigo} className={`hover:bg-slate-50/80 transition-colors ${clave.activa === false ? 'opacity-50 bg-slate-50' : ''}`}>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={clave.activa !== false}
                            onChange={e => handleUpdateClaveDed(index, 'activa', e.target.checked)}
                            title="Mostrar u ocultar columna en la prenómina"
                            className="rounded border-slate-300 cursor-pointer"
                          />
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">
                          <input
                            type="text"
                            value={clave.codigo}
                            onChange={e => handleUpdateClaveDed(index, 'codigo', e.target.value.toUpperCase())}
                            className="w-20 px-1.5 py-0.5 bg-slate-100 font-bold border border-slate-200 rounded text-xs"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={clave.nombre}
                            onChange={e => handleUpdateClaveDed(index, 'nombre', e.target.value)}
                            className="w-full px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-semibold"
                          />
                        </td>
                        <td className="py-2 px-3 text-slate-500 text-2xs">
                          <input
                            type="text"
                            value={clave.descripcion || ''}
                            onChange={e => handleUpdateClaveDed(index, 'descripcion', e.target.value)}
                            className="w-full px-2 py-0.5 bg-white border border-slate-200 rounded text-2xs"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleEliminarClaveDed(clave.codigo)}
                            title="Eliminar clave permanentemente"
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Formulario para agregar nueva clave de deducción */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <Plus className="w-4 h-4 text-slate-700" />
                  <span>Agregar Nueva Clave de Deducción a la Prenómina</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-3">
                    <label className="block text-2xs font-semibold text-slate-700 mb-1">
                      Código (ej. C-40, C-50) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="C-40"
                      value={nuevaClaveDed.codigo}
                      onChange={e => setNuevaClaveDed({ ...nuevaClaveDed, codigo: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono font-bold uppercase"
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-2xs font-semibold text-slate-700 mb-1">
                      Nombre o Leyenda <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Sanción Disciplinaria o Descuento Autorizado"
                      value={nuevaClaveDed.nombre}
                      onChange={e => setNuevaClaveDed({ ...nuevaClaveDed, nombre: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      type="button"
                      onClick={handleAgregarClaveDed}
                      className="w-full py-1.5 px-3 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Escaque</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* PESTAÑA: ESCAQUE DE NOCTURNIDAD Y TARIFAS (MODIFICAR PAGO POR NOCTURNIDADES) */}
          {activeTab === 'nocturnidad' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-2xs mb-1">
                  Modificación del Escaque de Nocturnidad y Tarifas de Pago
                </h3>
                <p className="text-slate-500 text-2xs">
                  Modifica los montos de pago por cada concepto de nocturnidad (Noches de $100, Horas de $5, Horas de $10), o agrega y quita tipos de nocturnidad para que se ajusten automáticamente en la prenómina.
                </p>
              </div>

              {/* Lista editable de Tarifas de Nocturnidad */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold text-2xs uppercase">
                      <th className="py-2.5 px-3 w-16 text-center">Visible</th>
                      <th className="py-2.5 px-3">Concepto / Nombre</th>
                      <th className="py-2.5 px-3 w-32">Tipo</th>
                      <th className="py-2.5 px-3 text-right w-40">Tarifa a Pagar ($)</th>
                      <th className="py-2.5 px-2 text-center w-8">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(formData.tarifasNocturnidad || []).map((tarifa, index) => (
                      <tr key={tarifa.id} className={`hover:bg-slate-50/80 transition-colors ${tarifa.activa === false ? 'opacity-50 bg-slate-50' : ''}`}>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={tarifa.activa !== false}
                            onChange={e => handleUpdateTarifaNoct(index, 'activa', e.target.checked)}
                            title="Mostrar u ocultar en la hoja de prenómina"
                            className="rounded border-slate-300 cursor-pointer"
                          />
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          <input
                            type="text"
                            value={tarifa.nombre}
                            onChange={e => handleUpdateTarifaNoct(index, 'nombre', e.target.value)}
                            className="w-full px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-semibold"
                          />
                        </td>
                        <td className="py-2 px-3 text-2xs">
                          <select
                            value={tarifa.tipo}
                            onChange={e => handleUpdateTarifaNoct(index, 'tipo', e.target.value)}
                            className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs"
                          >
                            <option value="hora">Por Hora</option>
                            <option value="noche">Por Noche Completa</option>
                          </select>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <span className="text-slate-400 font-mono text-2xs">$</span>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              value={tarifa.tarifa}
                              onChange={e => handleUpdateTarifaNoct(index, 'tarifa', parseFloat(e.target.value) || 0)}
                              className="w-24 text-right px-2 py-0.5 font-mono font-bold text-xs bg-yellow-50/70 border border-yellow-300 rounded focus:border-slate-900 focus:outline-none"
                            />
                          </div>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleEliminarTarifaNoct(tarifa.id)}
                            title="Eliminar este concepto de nocturnidad"
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Formulario para agregar nuevo tipo de nocturnidad */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <Plus className="w-4 h-4 text-slate-700" />
                  <span>Agregar Nuevo Concepto de Pago por Nocturnidad</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-5">
                    <label className="block text-2xs font-semibold text-slate-700 mb-1">
                      Nombre del Escaque <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Horas $8.00 o Guardia Especial"
                      value={nuevaTarifaNoct.nombre}
                      onChange={e => setNuevaTarifaNoct({ ...nuevaTarifaNoct, nombre: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-2xs font-semibold text-slate-700 mb-1">
                      Tarifa ($) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={nuevaTarifaNoct.tarifa}
                      onChange={e => setNuevaTarifaNoct({ ...nuevaTarifaNoct, tarifa: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-2xs font-semibold text-slate-700 mb-1">
                      Tipo
                    </label>
                    <select
                      value={nuevaTarifaNoct.tipo}
                      onChange={e => setNuevaTarifaNoct({ ...nuevaTarifaNoct, tipo: e.target.value as any })}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    >
                      <option value="hora">Por Hora</option>
                      <option value="noche">Por Noche</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAgregarTarifaNoct}
                      className="w-full py-1.5 px-3 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* PESTAÑA: ESCAQUE DE ACTIVIDADES AJENAS */}
          {activeTab === 'activAjenas' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-2xs mb-1">
                  Modificación del Escaque de Actividades Ajenas
                </h3>
                <p className="text-slate-500 text-2xs">
                  Configura o agrega escaques para actividades ajenas e ingresos autorizados fuera de la jornada regular.
                </p>
              </div>

              {/* Lista editable de Actividades Ajenas */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold text-2xs uppercase">
                      <th className="py-2.5 px-3 w-16 text-center">Visible</th>
                      <th className="py-2.5 px-3 w-28">Código</th>
                      <th className="py-2.5 px-3">Nombre del Escaque</th>
                      <th className="py-2.5 px-2 text-center w-8">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(formData.clavesActividadesAjenas || []).map((act, index) => (
                      <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={act.activa !== false}
                            onChange={e => handleUpdateActividadAjena(index, 'activa', e.target.checked)}
                            className="rounded border-slate-300 cursor-pointer"
                          />
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">
                          <input
                            type="text"
                            value={act.codigo}
                            onChange={e => handleUpdateActividadAjena(index, 'codigo', e.target.value.toUpperCase())}
                            className="w-24 px-1.5 py-0.5 bg-slate-100 font-bold border border-slate-200 rounded text-xs uppercase"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={act.nombre}
                            onChange={e => handleUpdateActividadAjena(index, 'nombre', e.target.value)}
                            className="w-full px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-semibold"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleEliminarActividadAjena(act.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Formulario para agregar escaque de actividad ajena */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <Plus className="w-4 h-4 text-slate-700" />
                  <span>Agregar Escaque de Actividad Ajena</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-3">
                    <label className="block text-2xs font-semibold text-slate-700 mb-1">
                      Código <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="ACT-02"
                      value={nuevaClaveAct.codigo}
                      onChange={e => setNuevaClaveAct({ ...nuevaClaveAct, codigo: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono font-bold uppercase"
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-2xs font-semibold text-slate-700 mb-1">
                      Nombre / Concepto <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Comisiones Productivas o Guardias"
                      value={nuevaClaveAct.nombre}
                      onChange={e => setNuevaClaveAct({ ...nuevaClaveAct, nombre: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      type="button"
                      onClick={handleAgregarActividadAjena}
                      className="w-full py-1.5 px-3 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* PESTAÑA: CENTROS DE COSTO (CC) */}
          {activeTab === 'centrosCosto' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-2xs mb-1">
                  Configuración de Centros de Costo (CC) de la Empresa
                </h3>
                <p className="text-slate-500 text-2xs">
                  Cada Centro de Costo (CC) posee su propia prenómina independiente con sus responsables de confección, chequeo y aprobación. Todos los CC se integran automáticamente en el Cierre Final de la Empresa.
                </p>
              </div>

              {/* Lista editable de Centros de Costo */}
              <div className="space-y-3">
                {(formData.centrosCosto || []).map(cc => (
                  <div key={cc.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black font-mono text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                          {cc.codigoCC}
                        </span>
                        <input
                          type="text"
                          value={cc.nombre}
                          onChange={e => handleUpdateCCField(cc.id, 'nombre', e.target.value)}
                          placeholder="Nombre del Centro de Costo"
                          className="font-bold text-xs text-slate-900 bg-white border border-slate-200 rounded px-2 py-1 w-64 uppercase"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleEliminarCC(cc.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Eliminar este Centro de Costo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-2xs">
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Confecciona:</label>
                        <input
                          type="text"
                          value={cc.confecciona}
                          onChange={e => handleUpdateCCField(cc.id, 'confecciona', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded uppercase font-semibold text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Chequea:</label>
                        <input
                          type="text"
                          value={cc.chequea}
                          onChange={e => handleUpdateCCField(cc.id, 'chequea', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded uppercase font-semibold text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Aprueba:</label>
                        <input
                          type="text"
                          value={cc.aprueba}
                          onChange={e => handleUpdateCCField(cc.id, 'aprueba', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded uppercase font-semibold text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Anota:</label>
                        <input
                          type="text"
                          value={cc.anota}
                          onChange={e => handleUpdateCCField(cc.id, 'anota', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded uppercase font-semibold text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Formulario para agregar nuevo Centro de Costo */}
              <div className="bg-slate-100 border border-slate-300 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <Plus className="w-4 h-4 text-slate-700" />
                  <span>Registrar Nuevo Centro de Costo (CC)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-3">
                    <label className="block text-2xs font-semibold text-slate-700 mb-1">
                      Código CC <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. CC 104"
                      value={nuevoCC.codigoCC}
                      onChange={e => setNuevoCC({ ...nuevoCC, codigoCC: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono font-bold uppercase"
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-2xs font-semibold text-slate-700 mb-1">
                      Nombre del Centro de Costo <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. LOGÍSTICA & TRANSPORTE"
                      value={nuevoCC.nombre}
                      onChange={e => setNuevoCC({ ...nuevoCC, nombre: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg uppercase font-bold"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      type="button"
                      onClick={handleAgregarCC}
                      className="w-full py-1.5 px-3 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar CC</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* PESTAÑA: ESCALA SALARIAL POR CARGO */}
          {activeTab === 'escala' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-2xs mb-1">
                  Escala de Salarios por Cargo y Tarifa Horaria (Divisor: {divisorLegal}h)
                </h3>
                <p className="text-slate-500 text-2xs">
                  El salario mensual de cada trabajador lo determina su cargo y se liquida estrictamente por horas de trabajo efectivas. La tarifa por hora legal es el salario escala dividido entre {divisorLegal} horas (Código de Trabajo).
                </p>
              </div>

              {/* Tabla de Cargos y Salarios Escala */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold text-2xs uppercase">
                      <th className="py-2.5 px-3">Cargo</th>
                      <th className="py-2.5 px-2">Grupo</th>
                      <th className="py-2.5 px-2 text-center">Cat.</th>
                      <th className="py-2.5 px-3 text-right">Salario Escala ({formData.simboloMoneda})</th>
                      <th className="py-2.5 px-2 text-right">Tarifa Horaria (÷{divisorLegal}h)</th>
                      <th className="py-2.5 px-2 text-center w-8">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {(formData.escalaCargos || []).map(cargo => {
                      const tarifa = cargo.salarioEscala / divisorLegal;
                      return (
                        <tr key={cargo.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2 px-3 font-sans font-bold text-slate-900">
                            {cargo.nombre}
                          </td>
                          <td className="py-2 px-2 text-slate-500 text-2xs">
                            {cargo.grupoEscala || '—'}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <select
                              value={cargo.catOcupacionalDefault}
                              onChange={e => handleUpdateCargoCat(cargo.id, e.target.value as CatOcupacional)}
                              className="text-2xs font-bold bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 cursor-pointer"
                            >
                              <option value="T">T</option>
                              <option value="C">C</option>
                              <option value="O">O</option>
                              <option value="A">A</option>
                              <option value="S">S</option>
                            </select>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              <span className="text-slate-400 text-2xs">{formData.simboloMoneda}</span>
                              <input
                                type="number"
                                step="50"
                                min="0"
                                value={cargo.salarioEscala}
                                onChange={e => handleUpdateCargoSalario(cargo.id, parseFloat(e.target.value) || 0)}
                                className="w-24 text-right px-2 py-1 font-bold tabular-nums text-slate-900 bg-white border border-slate-200 rounded focus:border-slate-900 focus:outline-none"
                              />
                            </div>
                          </td>
                          <td className="py-2 px-2 text-right font-bold text-emerald-950 text-2xs tabular-nums bg-emerald-50/50">
                            ${tarifa.toFixed(2)}/h
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleEliminarCargo(cargo.id)}
                              title="Eliminar cargo de la escala"
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Formulario para Agregar Nuevo Cargo */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <Plus className="w-4 h-4 text-slate-700" />
                  <span>Agregar Nuevo Cargo a la Escala Salarial</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-5">
                    <label className="block text-2xs font-semibold text-slate-700 mb-1">
                      Nombre del Cargo <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Técnico Superior de Control"
                      value={nuevoCargo.nombre}
                      onChange={e => setNuevoCargo({ ...nuevoCargo, nombre: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:border-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-2xs font-semibold text-slate-700 mb-1">
                      Salario Escala ({formData.simboloMoneda}) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      value={nuevoCargo.salarioEscala}
                      onChange={e => setNuevoCargo({ ...nuevoCargo, salarioEscala: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg focus:border-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-2xs font-semibold text-slate-700 mb-1">
                      Cat. Ocup.
                    </label>
                    <select
                      value={nuevoCargo.catOcupacionalDefault}
                      onChange={e => setNuevoCargo({ ...nuevoCargo, catOcupacionalDefault: e.target.value as CatOcupacional })}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    >
                      <option value="T">T - Técnico</option>
                      <option value="C">C - Cuadro</option>
                      <option value="O">O - Operario</option>
                      <option value="A">A - Admin.</option>
                      <option value="S">S - Servicio</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAgregarCargo}
                      className="w-full py-1.5 px-3 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* PESTAÑA: DIVISOR LEGAL Y REGLAS */}
          {activeTab === 'tasas' && (
            <div className="space-y-5">
              
              {/* Divisor legal 190.6 horas */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-blue-950 uppercase tracking-wider text-2xs">
                    Divisor Legal de Horas Mensuales (Código de Trabajo Cubano)
                  </h3>
                  <span className="text-2xs bg-blue-200 text-blue-900 px-2 py-0.5 rounded font-mono font-bold">
                    Norma Oficial: 190.6 horas
                  </span>
                </div>
                <p className="text-2xs text-blue-800">
                  El salario mensual de cada cargo se divide entre este número de horas para determinar la tarifa horaria legal. El salario liquidado se calcula multiplicando las horas reales laboradas por esta tarifa horaria.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Divisor de Horas por Mes
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      value={formData.divisorHorasMes}
                      onChange={e => updateNumberField('divisorHorasMes', e.target.value)}
                      className="w-full px-3 py-1.5 border border-blue-300 rounded-lg text-xs font-mono font-bold text-blue-950 bg-white"
                    />
                    <span className="text-2xs text-slate-500 mt-0.5 block">Estándar nacional: 190.6 horas</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Periodo Contable Activo
                    </label>
                    <input
                      type="text"
                      value={formData.periodoNombre}
                      onChange={e => setFormData({ ...formData, periodoNombre: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Factores de Horas Extras */}
              <div className="pt-2">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-2xs mb-2">
                  Multiplicadores de Horas Extras / Doblajes
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Extra Diurna (Factor)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="1"
                      value={formData.factorExtraDiurna}
                      onChange={e => updateNumberField('factorExtraDiurna', e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono tabular-nums bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Extra Nocturna (Factor)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="1"
                      value={formData.factorExtraNocturna}
                      onChange={e => updateNumberField('factorExtraNocturna', e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono tabular-nums bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Doblaje Festivo / C-74 (Factor)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="1"
                      value={formData.factorExtraFestiva}
                      onChange={e => updateNumberField('factorExtraFestiva', e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono tabular-nums bg-white"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Botones de acción al pie */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Valores por defecto</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

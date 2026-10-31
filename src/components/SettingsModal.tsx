import React, { useState } from 'react';
import { 
  PayrollSettings, 
  EscalaSalarialCargo, 
  CatOcupacional, 
  CentroCosto, 
  ClaveDeduccion, 
  TarifaNocturnidad, 
  ClaveActividadAjena,
  SeniorityTier,
  PlantillaCargoConfig
} from '../types/payroll';
import { 
  DEFAULT_PAYROLL_SETTINGS, 
  DEFAULT_ESCALA_SALARIAL, 
  DEFAULT_CENTROS_COSTO, 
  DEFAULT_CLAVES_DEDUCCION,
  DEFAULT_TARIFAS_NOCTURNIDAD,
  DEFAULT_CLAVES_ACTIVIDADES_AJENAS,
  DEFAULT_SENIORITY_TIERS
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
  Layers,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { 
  exportEscalaToExcel, 
  parseEscalaFromExcel, 
  exportCentrosCostoToExcel, 
  parseCentrosCostoFromExcel, 
  exportClavesAndTarifasToExcel 
} from '../utils/excelHelper';
import { ExcelActions } from './ExcelActions';

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
  const [activeTab, setActiveTab] = useState<'centrosCosto' | 'escala' | 'deducciones' | 'nocturnidad' | 'activAjenas' | 'tasas' | 'gradosAcademicos' | 'antiguedad' | 'plantilla'>('plantilla');

  const [formData, setFormData] = useState<PayrollSettings>(() => ({
    ...settings,
    divisorHorasMes: settings.divisorHorasMes || 190.6,
    montosGradosAcademicos: settings.montosGradosAcademicos || {
      licenciatura: 300,
      especialidad: 450,
      maestria: 600,
      doctorado: 900
    },
    escalasAntiguedad: settings.escalasAntiguedad && settings.escalasAntiguedad.length > 0
      ? settings.escalasAntiguedad
      : DEFAULT_SENIORITY_TIERS,
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
      : DEFAULT_CLAVES_ACTIVIDADES_AJENAS,
    plantillaCargos: settings.plantillaCargos && settings.plantillaCargos.length > 0
      ? settings.plantillaCargos
      : [
          { id: 'pc-1', cargo: 'Director de Agencia', cantidadPlan: 1 },
          { id: 'pc-2', cargo: 'Subdirector de Agencia', cantidadPlan: 1 },
          { id: 'pc-3', cargo: 'Técnico en ATM', cantidadPlan: 1 },
          { id: 'pc-4', cargo: 'Técnico A en Gestión de Recursos Humanos', cantidadPlan: 3 },
          { id: 'pc-5', cargo: 'Técnico Investigador', cantidadPlan: 1 },
          { id: 'pc-6', cargo: 'Jefe de Objetivo', cantidadPlan: 6 },
          { id: 'pc-7', cargo: 'Jefe de Turno', cantidadPlan: 24 },
          { id: 'pc-8', cargo: 'Agente de Seguridad y Protección', cantidadPlan: 118 },
        ]
  }));

  // Estado para nuevo tramo de antigüedad
  const [nuevaAntiguedad, setNuevaAntiguedad] = useState<{
    minYears: number;
    maxYears: number;
    amount: number;
    label: string;
  }>({
    minYears: 16,
    maxYears: 20,
    amount: 1200,
    label: '16 a 20 años'
  });

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

  // Estado para Plantilla de Cargos
  const [nuevoPlantillaCargo, setNuevoPlantillaCargo] = useState<{
    cargo: string;
    cantidadPlan: number;
  }>({
    cargo: '',
    cantidadPlan: 1
  });

  const divisorLegal = formData.divisorHorasMes || 190.6;

  const handleResetDefaults = () => {
    if (confirm('¿Desea restablecer todos los parámetros, escala, CC, claves y tarifas a los valores predeterminados?')) {
      setFormData({ 
        ...DEFAULT_PAYROLL_SETTINGS,
        divisorHorasMes: 190.6,
        escalasAntiguedad: [...DEFAULT_SENIORITY_TIERS],
        escalaCargos: [...DEFAULT_ESCALA_SALARIAL],
        centrosCosto: [...DEFAULT_CENTROS_COSTO],
        clavesDeduccion: [...DEFAULT_CLAVES_DEDUCCION],
        tarifasNocturnidad: [...DEFAULT_TARIFAS_NOCTURNIDAD],
        clavesActividadesAjenas: [...DEFAULT_CLAVES_ACTIVIDADES_AJENAS]
      });
    }
  };

  // --- MANEJO DE ANTIGÜEDAD ---
  const handleUpdateSeniorityTier = (id: string, field: keyof SeniorityTier, value: any) => {
    setFormData((prev: PayrollSettings) => ({
      ...prev,
      escalasAntiguedad: (prev.escalasAntiguedad || DEFAULT_SENIORITY_TIERS).map(s =>
        s.id === id ? { ...s, [field]: value } : s
      )
    }));
  };

  const handleEliminarSeniorityTier = (id: string) => {
    if (confirm('¿Desea eliminar este tramo de antigüedad?')) {
      setFormData((prev: PayrollSettings) => ({
        ...prev,
        escalasAntiguedad: (prev.escalasAntiguedad || DEFAULT_SENIORITY_TIERS).filter(s => s.id !== id)
      }));
    }
  };

  const handleAgregarSeniorityTier = (e: React.FormEvent) => {
    e.preventDefault();
    const item: SeniorityTier = {
      id: `sent-${Date.now().toString().slice(-4)}`,
      minYears: Math.max(0, nuevaAntiguedad.minYears),
      maxYears: Math.max(nuevaAntiguedad.minYears, nuevaAntiguedad.maxYears),
      amount: Math.max(0, nuevaAntiguedad.amount),
      label: nuevaAntiguedad.label.trim() || `${nuevaAntiguedad.minYears} a ${nuevaAntiguedad.maxYears} años`
    };
    setFormData((prev: PayrollSettings) => ({
      ...prev,
      escalasAntiguedad: [...(prev.escalasAntiguedad || DEFAULT_SENIORITY_TIERS), item]
    }));
    setNuevaAntiguedad({
      minYears: item.maxYears + 1,
      maxYears: item.maxYears + 5,
      amount: item.amount + 200,
      label: `${item.maxYears + 1} a ${item.maxYears + 5} años`
    });
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

  const handleUpdateFirmasGlobales = (field: 'confecciona' | 'chequea' | 'aprueba' | 'anota', value: string) => {
    const uppercaseVal = value.toUpperCase();
    setFormData((prev: PayrollSettings) => {
      const currentFirmas = prev.firmasGlobales || {
        confecciona: prev.centrosCosto?.[0]?.confecciona || 'DAYSI REYES DÍAZ',
        chequea: prev.centrosCosto?.[0]?.chequea || 'PEDRO ALBERTO GALBÁN LOPEZ',
        aprueba: prev.centrosCosto?.[0]?.aprueba || 'ZUNILDA MENDEZ LINARES',
        anota: prev.centrosCosto?.[0]?.anota || 'ELIESER DUARTES LÓPEZ'
      };
      const updatedFirmas = {
        ...currentFirmas,
        [field]: uppercaseVal
      };
      const updatedCCs = (prev.centrosCosto || []).map(c => ({
        ...c,
        [field]: uppercaseVal
      }));
      return {
        ...prev,
        firmasGlobales: updatedFirmas,
        centrosCosto: updatedCCs
      };
    });
  };

  const handleAgregarCC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoCC.codigoCC.trim() || !nuevoCC.nombre.trim()) {
      alert('Por favor ingrese el código y nombre del Centro de Costo.');
      return;
    }

    const globalFirmas = formData.firmasGlobales || {
      confecciona: formData.centrosCosto?.[0]?.confecciona || 'DAYSI REYES DÍAZ',
      chequea: formData.centrosCosto?.[0]?.chequea || 'PEDRO ALBERTO GALBÁN LOPEZ',
      aprueba: formData.centrosCosto?.[0]?.aprueba || 'ZUNILDA MENDEZ LINARES',
      anota: formData.centrosCosto?.[0]?.anota || 'ELIESER DUARTES LÓPEZ'
    };

    const itemCC: CentroCosto = {
      id: `cc-${Date.now().toString().slice(-4)}`,
      codigoCC: nuevoCC.codigoCC.trim().toUpperCase(),
      nombre: nuevoCC.nombre.trim().toUpperCase(),
      confecciona: globalFirmas.confecciona,
      chequea: globalFirmas.chequea,
      aprueba: globalFirmas.aprueba,
      anota: globalFirmas.anota,
      codigoREEUP: nuevoCC.codigoREEUP.trim() || '151.0.4897',
      descripcion: nuevoCC.descripcion.trim()
    };

    setFormData((prev: PayrollSettings) => ({
      ...prev,
      centrosCosto: [...(prev.centrosCosto || []), itemCC]
    }));

    setNuevoCC({
      codigoCC: `CC ${100 + (formData.centrosCosto?.length || 0) + 2}`,
      nombre: '',
      confecciona: globalFirmas.confecciona,
      chequea: globalFirmas.chequea,
      aprueba: globalFirmas.aprueba,
      anota: globalFirmas.anota,
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

  // --- MANEJO DE PLANTILLA DE CARGOS ---

  const handleUpdatePlantillaCargo = (id: string, field: 'cargo' | 'cantidadPlan', value: any) => {
    setFormData((prev: PayrollSettings) => ({
      ...prev,
      plantillaCargos: (prev.plantillaCargos || []).map(p =>
        p.id === id ? { ...p, [field]: value } : p
      )
    }));
  };

  const handleEliminarPlantillaCargo = (id: string) => {
    if (confirm('¿Desea eliminar este cargo de la plantilla?')) {
      setFormData((prev: PayrollSettings) => ({
        ...prev,
        plantillaCargos: (prev.plantillaCargos || []).filter(p => p.id !== id)
      }));
    }
  };

  const handleAgregarPlantillaCargo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoPlantillaCargo.cargo.trim()) {
      alert('Por favor ingrese el nombre del cargo.');
      return;
    }
    const item: PlantillaCargoConfig = {
      id: `pc-${Date.now().toString().slice(-4)}`,
      cargo: nuevoPlantillaCargo.cargo.trim(),
      cantidadPlan: Math.max(0, parseInt(String(nuevoPlantillaCargo.cantidadPlan)) || 1)
    };
    setFormData((prev: PayrollSettings) => ({
      ...prev,
      plantillaCargos: [...(prev.plantillaCargos || []), item]
    }));
    setNuevoPlantillaCargo({ cargo: '', cantidadPlan: 1 });
  };

  if (!isOpen) return null;

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
            onClick={() => setActiveTab('plantilla')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'plantilla'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Plantilla ({(formData.plantillaCargos || []).length})</span>
          </button>

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
            <span>Divisor & Impuestos Estatales</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gradosAcademicos')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'gradosAcademicos'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Grados Académicos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('antiguedad')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'antiguedad'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Antigüedad ({(formData.escalasAntiguedad || []).length})</span>
          </button>
        </div>

        {/* Contenido del Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          
          {/* PESTAÑA: PLANTILLA DE CARGOS */}
          {activeTab === 'plantilla' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-2xs mb-1 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-700" />
                  Configuración de Plantilla de Cargos y Cantidad Plan
                </h3>
                <p className="text-slate-500 text-2xs">
                  Configure los cargos de la empresa y la cantidad planificada (Plantilla) para el Parte de Completamiento en el Control de Claves.
                </p>
              </div>

              {/* Contenedor para añadir nuevo cargo a la plantilla */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="font-bold text-slate-800 text-2xs uppercase tracking-wide">Añadir Nuevo Cargo a la Plantilla</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-3xs font-bold text-slate-600 mb-1">Nombre del Cargo:</label>
                    <input
                      type="text"
                      value={nuevoPlantillaCargo.cargo}
                      onChange={e => setNuevoPlantillaCargo({ ...nuevoPlantillaCargo, cargo: e.target.value })}
                      placeholder="Ej. Técnico Especialista"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-3xs font-bold text-slate-600 mb-1">Cantidad Plan:</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        value={nuevoPlantillaCargo.cantidadPlan}
                        onChange={e => setNuevoPlantillaCargo({ ...nuevoPlantillaCargo, cantidadPlan: parseInt(e.target.value) || 1 })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                      />
                      <button
                        type="button"
                        onClick={handleAgregarPlantillaCargo}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shrink-0"
                      >
                        + Añadir
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabla de Cargos de Plantilla */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold text-2xs uppercase">
                      <th className="py-2.5 px-3">Cargo Oficial</th>
                      <th className="py-2.5 px-3 w-36 text-center">Cantidad Plan</th>
                      <th className="py-2.5 px-3 text-center w-16">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(formData.plantillaCargos || []).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.cargo}
                            onChange={e => handleUpdatePlantillaCargo(item.id, 'cargo', e.target.value)}
                            className="w-full px-2 py-1 font-bold text-slate-800 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-slate-800 rounded text-xs"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            value={item.cantidadPlan}
                            onChange={e => handleUpdatePlantillaCargo(item.id, 'cantidadPlan', parseInt(e.target.value) || 0)}
                            className="w-24 px-2 py-1 text-center font-mono font-bold text-slate-900 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-slate-800 rounded text-xs"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleEliminarPlantillaCargo(item.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Eliminar cargo de la plantilla"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PESTAÑA: ESCAQUE DE ANTIGÜEDAD POR AÑOS EN LA EMPRESA */}
          {activeTab === 'antiguedad' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-2xs mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-700" />
                  Configuración de Escaque de Antigüedad por Años en la Empresa
                </h3>
                <p className="text-slate-500 text-2xs">
                  Configure los tramos de años y el monto a pagar por antigüedad. El sistema calcula automáticamente los años de cada trabajador a partir de su <strong>Fecha de Ingreso</strong> y suma esta cantidad a su salario escala.
                </p>
              </div>

              {/* Tabla de Tramos de Antigüedad */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold text-2xs uppercase">
                      <th className="py-2.5 px-3">Etiqueta / Rango</th>
                      <th className="py-2.5 px-3 w-28 text-center">Años Mín.</th>
                      <th className="py-2.5 px-3 w-28 text-center">Años Máx.</th>
                      <th className="py-2.5 px-3 w-36 text-right">Monto a Pagar ($)</th>
                      <th className="py-2.5 px-3 text-center w-12">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(formData.escalasAntiguedad || DEFAULT_SENIORITY_TIERS).map((tramo) => (
                      <tr key={tramo.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={tramo.label}
                            onChange={e => handleUpdateSeniorityTier(tramo.id, 'label', e.target.value)}
                            className="w-full px-2 py-1 font-bold text-slate-800 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-slate-800 rounded text-xs"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="60"
                            value={tramo.minYears}
                            onChange={e => handleUpdateSeniorityTier(tramo.id, 'minYears', parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 text-center font-mono font-bold text-slate-700 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-slate-800 rounded text-xs"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="80"
                            value={tramo.maxYears}
                            onChange={e => handleUpdateSeniorityTier(tramo.id, 'maxYears', parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 text-center font-mono font-bold text-slate-700 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-slate-800 rounded text-xs"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-slate-400 font-mono">$</span>
                            <input
                              type="number"
                              step="50"
                              min="0"
                              value={tramo.amount}
                              onChange={e => handleUpdateSeniorityTier(tramo.id, 'amount', parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 text-right font-mono font-bold text-emerald-700 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-slate-800 rounded text-xs"
                            />
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleEliminarSeniorityTier(tramo.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                            title="Eliminar tramo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Formulario para Agregar Nuevo Tramo */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="font-bold text-slate-800 text-2xs uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-slate-600" />
                  Agregar Nuevo Tramo de Antigüedad
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-2xs font-semibold text-slate-600 mb-1">Años Mínimos</label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={nuevaAntiguedad.minYears}
                      onChange={e => setNuevaAntiguedad(prev => ({ ...prev, minYears: parseInt(e.target.value) || 0 }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-semibold text-slate-600 mb-1">Años Máximos</label>
                    <input
                      type="number"
                      min="0"
                      max="80"
                      value={nuevaAntiguedad.maxYears}
                      onChange={e => setNuevaAntiguedad(prev => ({ ...prev, maxYears: parseInt(e.target.value) || 0 }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-semibold text-slate-600 mb-1">Monto a Pagar ($)</label>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      value={nuevaAntiguedad.amount}
                      onChange={e => setNuevaAntiguedad(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-emerald-700 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-semibold text-slate-600 mb-1">Etiqueta / Rango</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={nuevaAntiguedad.label}
                        onChange={e => setNuevaAntiguedad(prev => ({ ...prev, label: e.target.value }))}
                        placeholder="Ej. 16 a 20 años"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAgregarSeniorityTier}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white font-bold rounded-lg cursor-pointer whitespace-nowrap text-2xs transition-colors"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nota explicativa de integración */}
              <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-2xs text-amber-900 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-700" />
                  ¿Cómo funciona el cálculo de antigüedad en la prenómina?
                </span>
                <p className="text-amber-800">
                  En la edición de cada trabajador (Ficha Técnica), se ingresa su <strong>Fecha de Incorporación a la Empresa</strong>. El sistema calcula con precisión cuántos años completos lleva acumulados, busca el tramo configurado aquí arriba, y suma automáticamente el monto correspondiente a la escala salarial del cargo que ocupa el trabajador.
                </p>
              </div>
            </div>
          )}
          
          {/* PESTAÑA: GRADOS ACADÉMICOS */}
          {activeTab === 'gradosAcademicos' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-2xs mb-1">
                  Configuración de Montos por Grado Académico / Titulación
                </h3>
                <p className="text-slate-500 text-2xs">
                  Establezca los montos fijos que se suman a la escala salarial de los trabajadores según su titulación (Licenciatura, Especialidad, Maestría o Doctorado).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                  <label className="block font-bold text-slate-800">Licenciatura ($)</label>
                  <input
                    type="number"
                    step="25"
                    min="0"
                    value={formData.montosGradosAcademicos?.licenciatura ?? 300}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      setFormData(prev => ({
                        ...prev,
                        montosGradosAcademicos: {
                          ...(prev.montosGradosAcademicos || { licenciatura: 300, especialidad: 450, maestria: 600, doctorado: 900 }),
                          licenciatura: val
                        }
                      }));
                    }}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg"
                  />
                  <span className="text-2xs text-slate-500">Monto sumado al salario escala para licenciados.</span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                  <label className="block font-bold text-slate-800">Especialidad ($)</label>
                  <input
                    type="number"
                    step="25"
                    min="0"
                    value={formData.montosGradosAcademicos?.especialidad ?? 450}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      setFormData(prev => ({
                        ...prev,
                        montosGradosAcademicos: {
                          ...(prev.montosGradosAcademicos || { licenciatura: 300, especialidad: 450, maestria: 600, doctorado: 900 }),
                          especialidad: val
                        }
                      }));
                    }}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg"
                  />
                  <span className="text-2xs text-slate-500">Monto sumado para especialidades de posgrado.</span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                  <label className="block font-bold text-slate-800">Maestría ($)</label>
                  <input
                    type="number"
                    step="25"
                    min="0"
                    value={formData.montosGradosAcademicos?.maestria ?? 600}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      setFormData(prev => ({
                        ...prev,
                        montosGradosAcademicos: {
                          ...(prev.montosGradosAcademicos || { licenciatura: 300, especialidad: 450, maestria: 600, doctorado: 900 }),
                          maestria: val
                        }
                      }));
                    }}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg"
                  />
                  <span className="text-2xs text-slate-500">Monto sumado al salario escala para másteres.</span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                  <label className="block font-bold text-slate-800">Doctorado ($)</label>
                  <input
                    type="number"
                    step="25"
                    min="0"
                    value={formData.montosGradosAcademicos?.doctorado ?? 900}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      setFormData(prev => ({
                        ...prev,
                        montosGradosAcademicos: {
                          ...(prev.montosGradosAcademicos || { licenciatura: 300, especialidad: 450, maestria: 600, doctorado: 900 }),
                          doctorado: val
                        }
                      }));
                    }}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg"
                  />
                  <span className="text-2xs text-slate-500">Monto sumado al salario escala para doctores en ciencias.</span>
                </div>
              </div>
            </div>
          )}
          
          {/* PESTAÑA: ESCAQUE DE DEDUCCIONES (AGREGAR / QUITAR / EDITAR CLAVES) */}
          {activeTab === 'deducciones' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-2xs mb-1">
                    Modificación del Escaque de Deducciones (Agregar, Quitar y Editar Claves)
                  </h3>
                  <p className="text-slate-500 text-2xs">
                    Cada clave activa se convierte automáticamente en una columna en la prenómina oficial.
                  </p>
                </div>
                <ExcelActions
                  label="Claves y Deducciones"
                  exportTitle="Exportar claves de deducción, nocturnidad y actividades ajenas a Excel (.xlsx)"
                  importTitle="Importar claves de deducción desde Excel (.xlsx / .csv)"
                  onExport={() => {
                    exportClavesAndTarifasToExcel(
                      formData.clavesDeduccion || [],
                      formData.tarifasNocturnidad || [],
                      formData.clavesActividadesAjenas || []
                    );
                  }}
                  onImport={(rows) => {
                    if (rows.length > 0) {
                      const newClaves: ClaveDeduccion[] = rows
                        .filter(r => (r['Código'] || r['codigo']) && (r['Código'] || r['codigo']).toUpperCase() !== 'C-82')
                        .map(r => ({
                          codigo: (r['Código'] || r['codigo']).toString().trim().toUpperCase(),
                          nombre: (r['Nombre'] || r['nombre'] || r['Leyenda / Nombre'] || 'Deducción').toString().trim(),
                          descripcion: (r['Descripción'] || r['descripcion'] || '').toString().trim(),
                          tipo: (r['Tipo'] || 'otro') as any,
                          activa: r['Activa'] === 'NO' ? false : true
                        }));
                      if (newClaves.length > 0) {
                        setFormData(prev => ({ ...prev, clavesDeduccion: newClaves }));
                        alert(`Se importaron ${newClaves.length} claves de deducción desde Excel.`);
                      }
                    }
                  }}
                />
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-2xs mb-1">
                    Configuración de Centros de Costo (CC) de la Empresa
                  </h3>
                  <p className="text-slate-500 text-2xs">
                    Cada Centro de Costo (CC) posee su propia prenómina. Todos los CC comparten las mismas firmas oficiales y se integran automáticamente en el Cierre Final.
                  </p>
                </div>
                <ExcelActions
                  label="Centros de Costo"
                  exportTitle="Exportar Centros de Costo a Excel (.xlsx)"
                  importTitle="Importar Centros de Costo desde Excel (.xlsx / .csv)"
                  onExport={() => exportCentrosCostoToExcel(formData.centrosCosto || [])}
                  onImport={(rows) => {
                    const parsed = parseCentrosCostoFromExcel(rows);
                    if (parsed.length > 0) {
                      const globalFirmas = formData.firmasGlobales || {
                        confecciona: formData.centrosCosto?.[0]?.confecciona || 'DAYSI REYES DÍAZ',
                        chequea: formData.centrosCosto?.[0]?.chequea || 'PEDRO ALBERTO GALBÁN LOPEZ',
                        aprueba: formData.centrosCosto?.[0]?.aprueba || 'ZUNILDA MENDEZ LINARES',
                        anota: formData.centrosCosto?.[0]?.anota || 'ELIESER DUARTES LÓPEZ'
                      };
                      const newCCs: CentroCosto[] = parsed.map((p, idx) => ({
                        id: p.id || `cc-imp-${idx}`,
                        codigoCC: p.codigoCC || `CC ${100 + idx}`,
                        nombre: p.nombre || 'ÁREA',
                        descripcion: p.descripcion || '',
                        codigoREEUP: p.codigoREEUP || '151.0.4897',
                        confecciona: globalFirmas.confecciona,
                        chequea: globalFirmas.chequea,
                        aprueba: globalFirmas.aprueba,
                        anota: globalFirmas.anota
                      }));
                      setFormData(prev => ({ ...prev, centrosCosto: newCCs }));
                      alert(`Se importaron ${newCCs.length} Centros de Costo desde Excel.`);
                    } else {
                      alert('No se encontraron Centros de Costo válidos en el archivo Excel.');
                    }
                  }}
                />
              </div>

              {/* Firmas y Responsables Oficiales Unificados (Se configuran una sola vez para toda la entidad) */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-indigo-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-700" />
                    <span className="font-bold text-xs text-indigo-950 uppercase tracking-wide">
                      Firmas y Responsables Oficiales de la Empresa
                    </span>
                  </div>
                  <span className="text-3xs font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                    Se configura solo una vez · Rige para todos los CC
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-2xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Confecciona:</label>
                    <input
                      type="text"
                      value={formData.firmasGlobales?.confecciona || formData.centrosCosto?.[0]?.confecciona || 'DAYSI REYES DÍAZ'}
                      onChange={e => handleUpdateFirmasGlobales('confecciona', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg uppercase font-bold text-xs text-slate-900 shadow-xs"
                    />
                    <span className="text-3xs text-slate-500 mt-0.5 block">Técnico / Confecciona</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Chequea:</label>
                    <input
                      type="text"
                      value={formData.firmasGlobales?.chequea || formData.centrosCosto?.[0]?.chequea || 'PEDRO ALBERTO GALBÁN LOPEZ'}
                      onChange={e => handleUpdateFirmasGlobales('chequea', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg uppercase font-bold text-xs text-slate-900 shadow-xs"
                    />
                    <span className="text-3xs text-slate-500 mt-0.5 block">Especialista Económico</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Aprueba:</label>
                    <input
                      type="text"
                      value={formData.firmasGlobales?.aprueba || formData.centrosCosto?.[0]?.aprueba || 'ZUNILDA MENDEZ LINARES'}
                      onChange={e => handleUpdateFirmasGlobales('aprueba', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg uppercase font-bold text-xs text-slate-900 shadow-xs"
                    />
                    <span className="text-3xs text-slate-500 mt-0.5 block">Director / Administrador</span>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Anota:</label>
                    <input
                      type="text"
                      value={formData.firmasGlobales?.anota || formData.centrosCosto?.[0]?.anota || 'ELIESER DUARTES LÓPEZ'}
                      onChange={e => handleUpdateFirmasGlobales('anota', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg uppercase font-bold text-xs text-slate-900 shadow-xs"
                    />
                    <span className="text-3xs text-slate-500 mt-0.5 block">Control Asistencia</span>
                  </div>
                </div>
              </div>

              {/* Lista editable de Centros de Costo (limpia y sin firmas redundantes) */}
              <div className="space-y-3">
                {(formData.centrosCosto || []).map(cc => (
                  <div key={cc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="font-black font-mono text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                          {cc.codigoCC}
                        </span>
                        <input
                          type="text"
                          value={cc.nombre}
                          onChange={e => handleUpdateCCField(cc.id, 'nombre', e.target.value)}
                          placeholder="Nombre del Centro de Costo"
                          className="font-bold text-xs text-slate-900 bg-white border border-slate-200 rounded px-2 py-1 flex-1 uppercase"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleEliminarCC(cc.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer ml-2"
                        title="Eliminar este Centro de Costo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs">
                      <div>
                        <label className="block text-slate-500 mb-0.5 font-medium">Descripción / Ubicación:</label>
                        <input
                          type="text"
                          value={cc.descripcion || ''}
                          onChange={e => handleUpdateCCField(cc.id, 'descripcion', e.target.value)}
                          placeholder="Ej. Taller Central, Oficina de Operaciones"
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-0.5 font-medium">Código REEUP:</label>
                        <input
                          type="text"
                          value={cc.codigoREEUP || '151.0.4897'}
                          onChange={e => handleUpdateCCField(cc.id, 'codigoREEUP', e.target.value)}
                          placeholder="151.0.4897"
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-mono text-xs"
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-2xs mb-1">
                    Escala de Salarios por Cargo y Tarifa Horaria (Divisor: {divisorLegal}h)
                  </h3>
                  <p className="text-slate-500 text-2xs">
                    El salario mensual de cada trabajador lo determina su cargo y se liquida estrictamente por horas de trabajo efectivas.
                  </p>
                </div>
                <ExcelActions
                  label="Escala Salarial"
                  exportTitle="Exportar escala salarial completa a Excel (.xlsx)"
                  importTitle="Importar cargos, grupos y salarios desde Excel (.xlsx / .csv)"
                  onExport={() => {
                    exportEscalaToExcel(formData.escalaCargos || []);
                  }}
                  onImport={(rows) => {
                    const parsed = parseEscalaFromExcel(rows);
                    if (parsed.length > 0) {
                      setFormData(prev => ({
                        ...prev,
                        escalaCargos: parsed
                      }));
                      alert(`Se importaron ${parsed.length} cargos a la escala salarial desde Excel exitosamente.`);
                    } else {
                      alert('No se encontraron cargos válidos en el archivo Excel.');
                    }
                  }}
                />
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
                                step="any"
                                min="0.01"
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

          {/* PESTAÑA: DIVISOR LEGAL Y REGLAS TRIBUTARIAS ESTATALES (CUBA) */}
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

              {/* Impuestos y Contribuciones del Trabajador Estatal (Ley 116 / Ley 113) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-2xs flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    Impuestos y Contribuciones del Trabajador Estatal (Cuba)
                  </h3>
                  <span className="text-3xs font-mono font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                    Ley 116 & Ley 113
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* CESS 5% */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <label className="block font-medium text-slate-700 mb-1">
                      Contribución Seg. Social (CESS %)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.tasaCESS ?? 5.0}
                      onChange={e => updateNumberField('tasaCESS', e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono tabular-nums bg-white"
                    />
                    <span className="text-3xs text-slate-500 mt-1 block">5% legal sobre ingresos devengados</span>
                  </div>

                  {/* ISIP Estatal % */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <label className="block font-medium text-slate-700 mb-1">
                      Tasa Retención ISIP (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={formData.tasaISIP ?? 5.0}
                      onChange={e => updateNumberField('tasaISIP', e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono tabular-nums bg-white"
                    />
                    <span className="text-3xs text-slate-500 mt-1 block">Aplicable sobre el exceso exento</span>
                  </div>

                  {/* Mínimo Exento ISIP */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <label className="block font-medium text-slate-700 mb-1">
                      Mínimo Exento ISIP ({settings.simboloMoneda})
                    </label>
                    <input
                      type="number"
                      step="10"
                      min="0"
                      value={formData.umbralExentoISIP ?? 3260}
                      onChange={e => updateNumberField('umbralExentoISIP', e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono tabular-nums bg-white"
                    />
                    <span className="text-3xs text-slate-500 mt-1 block">Ingresos hasta esta cifra no pagan ISIP</span>
                  </div>
                </div>

                {/* Switch para Retención ISIP */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={formData.aplicarISIP ?? true}
                      onChange={e => setFormData({ ...formData, aplicarISIP: e.target.checked })}
                      className="w-4 h-4 rounded text-slate-900 border-slate-300"
                    />
                    <span className="font-semibold text-slate-800">
                      Aplicar retención mensual del Impuesto sobre los Ingresos Personales (ISIP)
                    </span>
                  </label>
                </div>
              </div>

              {/* Aportes Patronales de la Entidad Empleadora (Cuba) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-2xs flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-700" />
                    Cargas Patronales de la Entidad Empleadora (Sector Estatal de Cuba)
                  </h3>
                  <span className="text-3xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    Total: {((formData.tasaSeguridadSocialPatronal ?? 12.5) + (formData.tasaFuerzaTrabajoPatronal ?? 5.0)).toFixed(1)}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <label className="block font-medium text-slate-700 mb-1">
                      Contribución a la Seguridad Social Patronal (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.tasaSeguridadSocialPatronal ?? 12.5}
                      onChange={e => updateNumberField('tasaSeguridadSocialPatronal', e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono tabular-nums bg-white"
                    />
                    <span className="text-3xs text-slate-500 mt-1 block">Estándar estatal: 12.5%</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <label className="block font-medium text-slate-700 mb-1">
                      Impuesto por Utilización Fuerza de Trabajo (IUFT %)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.tasaFuerzaTrabajoPatronal ?? 5.0}
                      onChange={e => updateNumberField('tasaFuerzaTrabajoPatronal', e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono tabular-nums bg-white"
                    />
                    <span className="text-3xs text-slate-500 mt-1 block">Estándar estatal: 5.0%</span>
                  </div>
                </div>
              </div>

              {/* Banner de Garantía Legal sobre Certificado Médico y Transporte */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-2xs uppercase">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Garantías y Exenciones del Código de Trabajo y Ley Tributaria de Cuba</span>
                </div>
                <ul className="text-2xs text-emerald-900/90 space-y-1 list-disc list-inside">
                  <li>
                    <strong>Exención total de impuesto por Certificado Médico (C-20):</strong> Las ausencias por enfermedad o accidente certificadas por el MINSAP son prestaciones cubiertas por la Seguridad Social de Cuba; NO se les aplica ninguna deducción impositiva o tributaria.
                  </li>
                  <li>
                    <strong>Supresión de Impuesto / Auxilio por Transporte:</strong> En concordancia con el Código de Trabajo cubano para trabajadores estatales, el transporte no forma parte de los conceptos salariales gravados ni de deducciones de ley.
                  </li>
                </ul>
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

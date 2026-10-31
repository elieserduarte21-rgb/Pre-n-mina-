/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Employee, 
  PayrollSettings, 
  EmployeeWithCalculation, 
  PayrollStatus,
  EmployeePrenomina,
  HeaderPrenomina,
  EmployeeWithPrenominaCalc,
  TotalesPrenomina,
  PeriodoHistoricoSnapshot,
  ColorTheme
} from './types/payroll';
import { DEFAULT_PAYROLL_SETTINGS, INITIAL_EMPLOYEES, DEFAULT_CENTROS_COSTO } from './data/defaultData';
import { DEFAULT_HEADER_PRENOMINA, INITIAL_OFFICIAL_EMPLOYEES } from './data/officialData';
import { calculateEmployeePayroll, calculatePayrollTotals } from './utils/payrollCalculator';
import { calculatePrenominaEmployee, calculateOfficialPrenominaTotals, isClaveTiempoRealAjena } from './utils/prenominaCalculator';
import { exportPayrollToCSV } from './utils/formatters';

import { Header } from './components/Header';
import { ArchiveFolderNav, AppTabId } from './components/ArchiveFolderNav';
import { PayrollSummaryCards } from './components/PayrollSummaryCards';
import { OfficialPrenominaView } from './components/OfficialPrenominaView';
import { CierreFinalView } from './components/CierreFinalView';
import { CertificadosView } from './components/CertificadosView';
import { SalarioPromedioView } from './components/SalarioPromedioView';
import { ControlClavesView } from './components/ControlClavesView';
import { EvolucionSalarialView } from './components/EvolucionSalarialView';
import { PayrollTable } from './components/PayrollTable';
import { EmployeeModal } from './components/EmployeeModal';
import { OfficialWorkerModal } from './components/OfficialWorkerModal';
import { PayslipModal } from './components/PayslipModal';
import { QuickCalculator } from './components/QuickCalculator';
import { SettingsModal } from './components/SettingsModal';
import { PayrollAnalytics } from './components/PayrollAnalytics';
import { CierreFinalModal } from './components/CierreFinalModal';
import { OfflineIndicator } from './components/OfflineIndicator';

const STORAGE_KEY_EMPLOYEES = 'prenomina_empleados_v2';
const STORAGE_KEY_SETTINGS = 'prenomina_settings_v2';
const STORAGE_KEY_OFFICIAL = 'prenomina_oficial_v2';
const STORAGE_KEY_HEADER = 'prenomina_header_v2';
const STORAGE_KEY_ACTIVE_CC = 'prenomina_active_cc_v2';
const STORAGE_KEY_HISTORIAL_PERIODOS = 'prenomina_historial_periodos_v2';
const STORAGE_KEY_COLOR_THEME = 'prenomina_color_theme_v2';

export default function App() {
  // Pestaña activa: 'oficial' (Formato PDF) por defecto en el archivador
  const [activeTab, setActiveTab] = useState<AppTabId>('oficial');

  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COLOR_THEME);
      if (saved) return saved as ColorTheme;
    } catch (e) {
      console.warn(e);
    }
    return 'white';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COLOR_THEME, colorTheme);
    } catch (e) {
      console.warn(e);
    }
  }, [colorTheme]);

  const getThemeBackground = (theme: ColorTheme) => {
    switch (theme) {
      case 'white': return 'bg-white text-slate-900';
      case 'ivory': return 'bg-[#fdfbf7] text-stone-900';
      case 'slate': return 'bg-slate-100 text-slate-900';
      case 'blue': return 'bg-sky-50/50 text-slate-900';
      case 'mint': return 'bg-emerald-50/30 text-slate-900';
      default: return 'bg-white text-slate-900';
    }
  };

  // Períodos históricos guardados en localStorage para evolución salarial
  const [periodosHistoricos, setPeriodosHistoricos] = useState<PeriodoHistoricoSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORIAL_PERIODOS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error loading historical periods from localStorage', e);
    }
    return [
      {
        id: 'snap-2025-11',
        nombrePeriodo: 'Noviembre 2025',
        fechaGuardado: '2025-11-30',
        empleados: INITIAL_OFFICIAL_EMPLOYEES.map(e => ({
          ...e,
          salarioBasicoEscala: Math.round((e.salarioBasicoEscala || 4800) * 0.95),
          montoAntiguedadManual: Math.max(0, (e.montoAntiguedadManual || 200) - 50)
        })),
        header: { ...DEFAULT_HEADER_PRENOMINA, periodoCorresponde: 'Noviembre 2025' }
      },
      {
        id: 'snap-2025-12',
        nombrePeriodo: 'Diciembre 2025',
        fechaGuardado: '2025-12-31',
        empleados: INITIAL_OFFICIAL_EMPLOYEES.map(e => ({
          ...e,
          salarioBasicoEscala: Math.round((e.salarioBasicoEscala || 4800) * 0.98)
        })),
        header: { ...DEFAULT_HEADER_PRENOMINA, periodoCorresponde: 'Diciembre 2025' }
      },
      {
        id: 'snap-2026-01',
        nombrePeriodo: 'Enero 2026',
        fechaGuardado: '2026-01-31',
        empleados: INITIAL_OFFICIAL_EMPLOYEES,
        header: { ...DEFAULT_HEADER_PRENOMINA, periodoCorresponde: 'Enero 2026' }
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORIAL_PERIODOS, JSON.stringify(periodosHistoricos));
    } catch (e) {
      console.warn(e);
    }
  }, [periodosHistoricos]);

  const handleSaveCurrentPeriodToHistory = (nombrePeriodo: string) => {
    const newSnapshot: PeriodoHistoricoSnapshot = {
      id: `snap-${Date.now()}`,
      nombrePeriodo,
      fechaGuardado: new Date().toISOString().slice(0, 10),
      empleados: JSON.parse(JSON.stringify(officialEmployees)),
      header: JSON.parse(JSON.stringify(headerPrenomina))
    };
    setPeriodosHistoricos(prev => [newSnapshot, ...prev.filter(p => p.nombrePeriodo !== nombrePeriodo)]);
  };

  const handleDeleteHistoricalPeriod = (id: string) => {
    setPeriodosHistoricos(prev => prev.filter(p => p.id !== id));
  };

  // Centro de Costo (CC) Activo
  const [selectedCCId, setSelectedCCId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_CC);
      if (saved) return saved;
    } catch (e) {
      console.warn(e);
    }
    return 'cc-101';
  });

  // Encabezado de la prenómina oficial (del PDF adjunto)
  const [headerPrenomina, setHeaderPrenomina] = useState<HeaderPrenomina>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HEADER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error loading header from localStorage', e);
    }
    return DEFAULT_HEADER_PRENOMINA;
  });

  // Empleados del formato oficial (PDF)
  const [officialEmployees, setOfficialEmployees] = useState<EmployeePrenomina[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OFFICIAL);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error loading official employees from localStorage', e);
    }
    return INITIAL_OFFICIAL_EMPLOYEES;
  });

  // Configuración general de tasas y reglas
  const [settings, setSettings] = useState<PayrollSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        const parsed: PayrollSettings = JSON.parse(saved);
        // Asegurar que C-82, C-85, C-57, C-72 queden como actividades ajenas y excluidas de deducciones
        if (parsed.clavesDeduccion) {
          parsed.clavesDeduccion = parsed.clavesDeduccion.filter(c => !isClaveTiempoRealAjena(c.codigo));
        }
        const activasAjenas = parsed.clavesActividadesAjenas || [];
        const requiredCodes = [
          { id: 'act-c82', codigo: 'C-82', nombre: 'C-82 Vacac. Simultáneas', descripcion: 'Horas C-82 / Actividad ajena que suma al tiempo real laborado', activa: true },
          { id: 'act-c85', codigo: 'C-85', nombre: 'C-85 Movilizados / Defensa', descripcion: 'Horas C-85 / Actividad ajena que suma al tiempo real laborado', activa: true },
          { id: 'act-c57', codigo: 'C-57', nombre: 'C-57 Interrupción autorizada', descripcion: 'Horas C-57 / Actividad ajena que suma al tiempo real laborado', activa: true },
          { id: 'act-c72', codigo: 'C-72', nombre: 'C-72 Capacitación / Comisión', descripcion: 'Horas C-72 / Actividad ajena que suma al tiempo real laborado', activa: true },
          { id: 'act-c69', codigo: 'C-69', nombre: 'C-69 Categoría Ocupacional', descripcion: 'Horas C-69 Categoría Ocupacional que suman al tiempo real laborado', activa: true },
          { id: 'act-c54', codigo: 'C-54', nombre: 'C-54 Movilización Militar', descripcion: 'Movilización militar pagada por tarifa de horas promedio', activa: true },
          { id: 'act-c70', codigo: 'C-70', nombre: 'C-70 Feriados no trabajados', descripcion: 'Feriados y conmemoración nacional pagados por salario promedio', activa: true },
        ];
        requiredCodes.forEach(req => {
          if (!activasAjenas.some(a => a.codigo.replace('-', '').toUpperCase() === req.codigo.replace('-', '').toUpperCase())) {
            activasAjenas.push(req);
          }
        });
        parsed.clavesActividadesAjenas = activasAjenas;
        return parsed;
      }
    } catch (e) {
      console.warn('Error loading settings from localStorage', e);
    }
    return DEFAULT_PAYROLL_SETTINGS;
  });

  // Lista detallada de empleados
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EMPLOYEES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error loading employees from localStorage', e);
    }
    return INITIAL_EMPLOYEES;
  });

  // Modales
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [payslipEmployee, setPayslipEmployee] = useState<EmployeeWithCalculation | null>(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCierreFinalModalOpen, setIsCierreFinalModalOpen] = useState(false);

  // Modal para crear o editar trabajador oficial con todos sus datos
  const [isOfficialWorkerModalOpen, setIsOfficialWorkerModalOpen] = useState(false);
  const [editingOfficialWorker, setEditingOfficialWorker] = useState<EmployeePrenomina | null>(null);

  // Guardar en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_CC, selectedCCId);
    } catch (e) {
      console.warn(e);
    }
  }, [selectedCCId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HEADER, JSON.stringify(headerPrenomina));
    } catch (e) {
      console.warn(e);
    }
  }, [headerPrenomina]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_OFFICIAL, JSON.stringify(officialEmployees));
    } catch (e) {
      console.warn(e);
    }
  }, [officialEmployees]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn(e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(employees));
    } catch (e) {
      console.warn(e);
    }
  }, [employees]);

  // Selección de Centro de Costo (CC): Confecciona, Chequea, Aprueba y Anota se mantienen iguales para todos los CC
  const handleSelectCC = (ccId: string) => {
    setSelectedCCId(ccId);
    const foundCC = settings.centrosCosto?.find(c => c.id === ccId);
    if (foundCC) {
      setHeaderPrenomina(prev => ({
        ...prev,
        direccionCC: foundCC.codigoCC,
        codigoREEUP: foundCC.codigoREEUP || prev.codigoREEUP
        // Firmas unificadas: confecciona, chequea, aprueba y anota son idénticas para todos los CC
      }));
    }
  };

  // Actualización de firmas y datos de cabecera: Se guardan una sola vez y aplican a todos los CC
  const handleUpdateHeader = (newHeader: HeaderPrenomina) => {
    setHeaderPrenomina(newHeader);
    setSettings(prev => ({
      ...prev,
      firmasGlobales: {
        confecciona: newHeader.confecciona,
        chequea: newHeader.chequea,
        aprueba: newHeader.aprueba,
        anota: newHeader.anota
      },
      centrosCosto: (prev.centrosCosto || DEFAULT_CENTROS_COSTO).map(cc => ({
        ...cc,
        confecciona: newHeader.confecciona,
        chequea: newHeader.chequea,
        aprueba: newHeader.aprueba,
        anota: newHeader.anota
      }))
    }));
  };

  // Importación masiva de trabajadores desde Excel
  const handleImportOfficialEmployees = (importedEmployees: EmployeePrenomina[]) => {
    setOfficialEmployees(prev => {
      const updated = [...prev];
      importedEmployees.forEach(newEmp => {
        const idx = updated.findIndex(e => 
          (newEmp.id && e.id === newEmp.id) || 
          (newEmp.numeroExpediente && e.numeroExpediente === newEmp.numeroExpediente && e.centroCostoId === newEmp.centroCostoId)
        );
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], ...newEmp };
        } else {
          updated.push(newEmp);
        }
      });
      return updated;
    });
  };

  // Cálculo de TODOS los empleados oficiales para el Cierre Final
  const allOfficialEmployeesWithCalc: EmployeeWithPrenominaCalc[] = useMemo(() => {
    return officialEmployees.map(emp => calculatePrenominaEmployee(emp, settings));
  }, [officialEmployees, settings]);

  // Filtrar trabajadores para el Centro de Costo activo
  const activeCCOfficialEmployees = useMemo(() => {
    return allOfficialEmployeesWithCalc.filter(emp => {
      if (emp.centroCostoId) return emp.centroCostoId === selectedCCId;
      return selectedCCId === 'cc-101'; // Default
    });
  }, [allOfficialEmployeesWithCalc, selectedCCId]);

  // Totales de la hoja del Centro de Costo activo
  const officialTotals: TotalesPrenomina = useMemo(() => {
    return calculateOfficialPrenominaTotals(activeCCOfficialEmployees);
  }, [activeCCOfficialEmployees]);

  // Cálculo de la prenómina general de salarios
  const employeesWithCalculation: EmployeeWithCalculation[] = useMemo(() => {
    return employees.map(emp => ({
      ...emp,
      calculo: calculateEmployeePayroll(emp, settings)
    }));
  }, [employees, settings]);

  const generalTotals = useMemo(() => {
    return calculatePayrollTotals(employeesWithCalculation);
  }, [employeesWithCalculation]);

  // Manejador para actualizar un día específico en la hoja oficial
  const handleUpdateDay = (employeeId: string, dayIndex: number, value: string) => {
    setOfficialEmployees(prev =>
      prev.map(emp => {
        if (emp.id !== employeeId) return emp;
        const newDias = [...emp.dias];
        newDias[dayIndex] = value;
        return {
          ...emp,
          dias: newDias
        };
      })
    );
  };

  // Manejador para actualizar campos de un empleado en la hoja oficial
  const handleUpdateOfficialEmployee = (employeeId: string, updates: Partial<EmployeeWithPrenominaCalc>) => {
    setOfficialEmployees(prev =>
      prev.map(emp => (emp.id === employeeId ? { ...emp, ...updates } : emp))
    );
  };

  // Abrir menú para crear nuevo trabajador oficial con todos sus datos
  const handleAddNewOfficialEmployee = () => {
    setEditingOfficialWorker(null);
    setIsOfficialWorkerModalOpen(true);
  };

  // Abrir menú para editar trabajador oficial
  const handleEditOfficialEmployee = (worker: EmployeeWithPrenominaCalc) => {
    setEditingOfficialWorker(worker);
    setIsOfficialWorkerModalOpen(true);
  };

  // Guardar trabajador oficial (creación o edición)
  const handleSaveOfficialWorker = (savedWorker: EmployeePrenomina) => {
    setOfficialEmployees(prev => {
      const workerWithCC = {
        ...savedWorker,
        centroCostoId: savedWorker.centroCostoId || selectedCCId
      };
      const idx = prev.findIndex(e => e.id === savedWorker.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = workerWithCC;
        return next;
      }
      return [workerWithCC, ...prev];
    });
    setIsOfficialWorkerModalOpen(false);
    setEditingOfficialWorker(null);
  };

  // Eliminar trabajador de la hoja oficial con confirmación
  const handleDeleteOfficialEmployee = (id: string) => {
    const emp = officialEmployees.find(e => e.id === id);
    const nombre = emp?.nombreApellidos || 'este trabajador';
    if (confirm(`¿Confirma que desea eliminar definitivamente a "${nombre}" de la prenómina?`)) {
      setOfficialEmployees(prev => prev.filter(e => e.id !== id));
      if (editingOfficialWorker?.id === id) {
        setIsOfficialWorkerModalOpen(false);
        setEditingOfficialWorker(null);
      }
    }
  };

  // Restaurar los datos exactos del modelo PDF adjunto
  const handleResetToPdfSample = () => {
    if (confirm('¿Restablecer la hoja con los datos exactos del archivo PDF (Confecciona, Chequea, Maikel, Ángel Tomás, Raimundo, etc.)?')) {
      setHeaderPrenomina(DEFAULT_HEADER_PRENOMINA);
      setOfficialEmployees(INITIAL_OFFICIAL_EMPLOYEES);
      setEmployees(INITIAL_EMPLOYEES);
      setSelectedCCId('cc-101');
    }
  };

  // Manejadores para la tabla general
  const handleSaveEmployee = (savedEmployee: Employee) => {
    setEmployees(prev => {
      const index = prev.findIndex(e => e.id === savedEmployee.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = savedEmployee;
        return next;
      }
      return [savedEmployee, ...prev];
    });
    setIsEmployeeModalOpen(false);
    setEditingEmployee(null);
  };

  const handleDeleteEmployee = (id: string) => {
    const emp = employees.find(e => e.id === id);
    if (confirm(`¿Eliminar a ${emp ? `${emp.nombre} ${emp.apellidos}` : 'el trabajador'}?`)) {
      setEmployees(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleStatusChange = (id: string, newStatus: PayrollStatus) => {
    setEmployees(prev =>
      prev.map(emp => (emp.id === id ? { ...emp, estado: newStatus } : emp))
    );
  };

  const handleAddSimulatedToPayroll = (simulatedEmp: Employee) => {
    setEmployees(prev => [simulatedEmp, ...prev]);
    setActiveTab('prenomina');
  };

  const handleCreateBackup = () => {
    const backupData = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      officialEmployees,
      headerPrenomina,
      settings,
      employees,
      selectedCCId
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `salva_prenomina_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && (parsed.officialEmployees || parsed.headerPrenomina)) {
            if (confirm('¿Está seguro de restaurar esta salva? Se reemplazarán los datos actuales de la aplicación con los del respaldo.')) {
              if (parsed.officialEmployees) setOfficialEmployees(parsed.officialEmployees);
              if (parsed.headerPrenomina) setHeaderPrenomina(parsed.headerPrenomina);
              if (parsed.settings) setSettings(parsed.settings);
              if (parsed.employees) setEmployees(parsed.employees);
              if (parsed.selectedCCId) setSelectedCCId(parsed.selectedCCId);
              alert('¡Salva restaurada con éxito!');
            }
          } else {
            alert('El archivo de salva no tiene un formato válido.');
          }
        } catch (err) {
          alert('Error al leer el archivo de respaldo JSON.');
        }
      };
    }
    e.target.value = '';
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${getThemeBackground(colorTheme)}`}>
      
      {/* Barra de Navegación Principal */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewEmployee={() => {
          if (activeTab === 'oficial') {
            handleAddNewOfficialEmployee();
          } else {
            setEditingEmployee(null);
            setIsEmployeeModalOpen(true);
          }
        }}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onExportCSV={() => exportPayrollToCSV(employeesWithCalculation, settings)}
        onCreateBackup={handleCreateBackup}
        onRestoreBackup={handleRestoreBackup}
        periodoNombre={`Periodo ${headerPrenomina.periodoCorresponde} (${headerPrenomina.fechaDesde} al ${headerPrenomina.fechaHasta})`}
        colorTheme={colorTheme}
        setColorTheme={setColorTheme}
      />

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 lg:px-6 py-5 space-y-5">
        
        {/* Archivador Superior de Carpetas y Módulos */}
        <ArchiveFolderNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          totalOfficialWorkers={activeCCOfficialEmployees.length}
          totalCentrosCosto={settings.centrosCosto?.length || 2}
          totalGeneralWorkers={employees.length}
          periodoNombre={`Periodo ${headerPrenomina.periodoCorresponde} (${headerPrenomina.fechaDesde} al ${headerPrenomina.fechaHasta})`}
          activeCCName={settings.centrosCosto?.find(c => c.id === selectedCCId)?.codigoCC || headerPrenomina.direccionCC || 'CC 101'}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />

        {/* KPI Strip */}
        <div className="no-print">
          <PayrollSummaryCards totals={generalTotals} settings={settings} />
        </div>

        {/* CARPETA 1: Formato Oficial idéntico al PDF */}
        {activeTab === 'oficial' && (
          <OfficialPrenominaView
            header={headerPrenomina}
            onUpdateHeader={handleUpdateHeader}
            employees={activeCCOfficialEmployees}
            totals={officialTotals}
            settings={settings}
            selectedCCId={selectedCCId}
            onSelectCC={handleSelectCC}
            onOpenCierreFinal={() => setActiveTab('cierre')}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onUpdateDay={handleUpdateDay}
            onUpdateEmployeeField={handleUpdateOfficialEmployee}
            onAddNewEmployee={handleAddNewOfficialEmployee}
            onEditEmployee={handleEditOfficialEmployee}
            onDeleteEmployee={handleDeleteOfficialEmployee}
            onImportEmployees={handleImportOfficialEmployees}
          />
        )}

        {/* CARPETA 2: Cierre Final de Empresa (Consolidación de todos los CCs) */}
        {activeTab === 'cierre' && (
          <CierreFinalView
            allEmployees={allOfficialEmployeesWithCalc}
            settings={settings}
            periodoNombre={`Periodo ${headerPrenomina.periodoCorresponde} (${headerPrenomina.fechaDesde} al ${headerPrenomina.fechaHasta})`}
            onGoToCC={(ccId) => {
              handleSelectCC(ccId);
              setActiveTab('oficial');
            }}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
          />
        )}

        {/* CARPETA 3: Liquidación General */}
        {activeTab === 'prenomina' && (
          <PayrollTable
            employees={employeesWithCalculation}
            settings={settings}
            onEditEmployee={emp => {
              setEditingEmployee(emp);
              setIsEmployeeModalOpen(true);
            }}
            onViewPayslip={emp => {
              setPayslipEmployee(emp);
              setIsPayslipModalOpen(true);
            }}
            onDeleteEmployee={handleDeleteEmployee}
            onStatusChange={handleStatusChange}
            onAddNewEmployee={() => {
              setEditingEmployee(null);
              setIsEmployeeModalOpen(true);
            }}
            onResetDefaults={handleResetToPdfSample}
          />
        )}

        {/* CARPETA: Salario Promedio (Ley 116 y Decreto 326 de Cuba) */}
        {activeTab === 'salarioPromedio' && (
          <SalarioPromedioView
            employees={allOfficialEmployeesWithCalc}
            settings={settings}
            headerPrenomina={headerPrenomina}
            selectedCCId={selectedCCId}
            periodoNombre={`Periodo ${headerPrenomina.periodoCorresponde} (${headerPrenomina.fechaDesde} al ${headerPrenomina.fechaHasta})`}
          />
        )}

        {/* CARPETA: Control de Claves y Registro de Bajas (C-27) */}
        {activeTab === 'controlClaves' && (
          <ControlClavesView
            employees={activeCCOfficialEmployees}
            allEmployees={allOfficialEmployeesWithCalc}
            settings={settings}
            periodoNombre={`Periodo ${headerPrenomina.periodoCorresponde} (${headerPrenomina.fechaDesde} al ${headerPrenomina.fechaHasta})`}
            selectedCCId={selectedCCId}
            onSelectCC={handleSelectCC}
            onUpdateEmployee={handleUpdateOfficialEmployee}
            onOpenWorkerModal={handleEditOfficialEmployee}
            onGoToPrenomina={() => setActiveTab('oficial')}
          />
        )}

        {/* CARPETA 4: Análisis y Estructura de Costos */}
        {activeTab === 'analisis' && (
          <PayrollAnalytics
            employees={employeesWithCalculation}
            settings={settings}
            totals={generalTotals}
          />
        )}

        {/* CARPETA 5: Calculadora Rápida e Individual */}
        {activeTab === 'calculadora' && (
          <QuickCalculator
            settings={settings}
            onAddSimulatedToPayroll={handleAddSimulatedToPayroll}
          />
        )}

        {/* CARPETA 6: Módulo de Certificados & Constancias Salariales */}
        {activeTab === 'certificados' && (
          <CertificadosView
            employees={allOfficialEmployeesWithCalc}
            settings={settings}
            periodoNombre={`Periodo ${headerPrenomina.periodoCorresponde} (${headerPrenomina.fechaDesde} al ${headerPrenomina.fechaHasta})`}
          />
        )}

        {/* CARPETA: Evolución Salarial Bruta por Meses */}
        {activeTab === 'evolucion' && (
          <EvolucionSalarialView
            currentEmployees={officialEmployees}
            currentHeader={headerPrenomina}
            settings={settings}
            periodosHistoricos={periodosHistoricos}
            onSaveCurrentPeriod={handleSaveCurrentPeriodToHistory}
            onDeletePeriod={handleDeleteHistoricalPeriod}
          />
        )}

      </main>

      {/* Pie de Página */}
      <footer className="border-t border-slate-200 bg-white py-5 mt-10 no-print text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Prenómina de Salario</span>
            <span aria-hidden="true">·</span>
            <span>Control de Tiempo, Nocturnidad y Cierre Final de Empresa</span>
          </div>
          <div className="flex items-center gap-4 text-2xs text-slate-400 font-mono">
            <span>REEUP: {headerPrenomina.codigoREEUP}</span>
            <span aria-hidden="true">·</span>
            <span>Centro de Costo: {headerPrenomina.direccionCC}</span>
            <span aria-hidden="true">·</span>
            <span>Divisor Legal: {settings.divisorHorasMes || 190.6} horas</span>
          </div>
        </div>
      </footer>

      {/* Modal de Registro / Edición de Empleado (General) */}
      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => {
          setIsEmployeeModalOpen(false);
          setEditingEmployee(null);
        }}
        onSave={handleSaveEmployee}
        initialEmployee={editingEmployee}
        settings={settings}
      />

      {/* Modal / Menú Completo para Crear o Editar Trabajador en la Prenómina Oficial */}
      <OfficialWorkerModal
        isOpen={isOfficialWorkerModalOpen}
        onClose={() => {
          setIsOfficialWorkerModalOpen(false);
          setEditingOfficialWorker(null);
        }}
        onSave={handleSaveOfficialWorker}
        onDelete={handleDeleteOfficialEmployee}
        initialWorker={editingOfficialWorker}
        settings={settings}
      />

      {/* Modal de Comprobante / Recibo de Pago Imprimible */}
      <PayslipModal
        isOpen={isPayslipModalOpen}
        onClose={() => {
          setIsPayslipModalOpen(false);
          setPayslipEmployee(null);
        }}
        employee={payslipEmployee}
        settings={settings}
      />

      {/* Modal de Configuración (Centros de Costo, Escala, Claves de Descuento, Divisor) */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSave={setSettings}
      />

      {/* Modal de Cierre Final de Empresa (Consolidación de todos los CC) */}
      <CierreFinalModal
        isOpen={isCierreFinalModalOpen}
        onClose={() => setIsCierreFinalModalOpen(false)}
        allEmployees={allOfficialEmployeesWithCalc}
        settings={settings}
        periodoNombre={`Periodo ${headerPrenomina.periodoCorresponde} (${headerPrenomina.fechaDesde} al ${headerPrenomina.fechaHasta})`}
      />

      {/* Indicador de Estado de Conexión Offline */}
      <OfflineIndicator />

    </div>
  );
}

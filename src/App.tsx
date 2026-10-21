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
  TotalesPrenomina
} from './types/payroll';
import { DEFAULT_PAYROLL_SETTINGS, INITIAL_EMPLOYEES } from './data/defaultData';
import { DEFAULT_HEADER_PRENOMINA, INITIAL_OFFICIAL_EMPLOYEES } from './data/officialData';
import { calculateEmployeePayroll, calculatePayrollTotals } from './utils/payrollCalculator';
import { calculatePrenominaEmployee, calculateOfficialPrenominaTotals } from './utils/prenominaCalculator';
import { exportPayrollToCSV } from './utils/formatters';

import { Header } from './components/Header';
import { PayrollSummaryCards } from './components/PayrollSummaryCards';
import { OfficialPrenominaView } from './components/OfficialPrenominaView';
import { PayrollTable } from './components/PayrollTable';
import { EmployeeModal } from './components/EmployeeModal';
import { OfficialWorkerModal } from './components/OfficialWorkerModal';
import { PayslipModal } from './components/PayslipModal';
import { QuickCalculator } from './components/QuickCalculator';
import { SettingsModal } from './components/SettingsModal';
import { PayrollAnalytics } from './components/PayrollAnalytics';
import { CierreFinalModal } from './components/CierreFinalModal';

const STORAGE_KEY_EMPLOYEES = 'prenomina_empleados_v2';
const STORAGE_KEY_SETTINGS = 'prenomina_settings_v2';
const STORAGE_KEY_OFFICIAL = 'prenomina_oficial_v2';
const STORAGE_KEY_HEADER = 'prenomina_header_v2';
const STORAGE_KEY_ACTIVE_CC = 'prenomina_active_cc_v2';

export default function App() {
  // Pestaña activa: 'oficial' (Formato PDF) por defecto
  const [activeTab, setActiveTab] = useState<'oficial' | 'prenomina' | 'calculadora' | 'analisis'>('oficial');

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
      if (saved) return JSON.parse(saved);
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

  // Selección de Centro de Costo (CC) y sincronización de datos de cabecera
  const handleSelectCC = (ccId: string) => {
    setSelectedCCId(ccId);
    const foundCC = settings.centrosCosto?.find(c => c.id === ccId);
    if (foundCC) {
      setHeaderPrenomina(prev => ({
        ...prev,
        direccionCC: foundCC.codigoCC,
        confecciona: foundCC.confecciona || prev.confecciona,
        chequea: foundCC.chequea || prev.chequea,
        aprueba: foundCC.aprueba || prev.aprueba,
        anota: foundCC.anota || prev.anota,
        codigoREEUP: foundCC.codigoREEUP || prev.codigoREEUP
      }));
    }
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

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col text-slate-900">
      
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
        periodoNombre={`Periodo ${headerPrenomina.periodoCorresponde} (${headerPrenomina.fechaDesde} al ${headerPrenomina.fechaHasta})`}
      />

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 lg:px-6 py-6 space-y-5">
        
        {/* KPI Strip */}
        <div className="no-print">
          <PayrollSummaryCards totals={generalTotals} settings={settings} />
        </div>

        {/* VISTA 1: Formato Oficial idéntico al PDF */}
        {activeTab === 'oficial' && (
          <OfficialPrenominaView
            header={headerPrenomina}
            onUpdateHeader={setHeaderPrenomina}
            employees={activeCCOfficialEmployees}
            totals={officialTotals}
            settings={settings}
            selectedCCId={selectedCCId}
            onSelectCC={handleSelectCC}
            onOpenCierreFinal={() => setIsCierreFinalModalOpen(true)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onUpdateDay={handleUpdateDay}
            onUpdateEmployeeField={handleUpdateOfficialEmployee}
            onAddNewEmployee={handleAddNewOfficialEmployee}
            onEditEmployee={handleEditOfficialEmployee}
            onDeleteEmployee={handleDeleteOfficialEmployee}
            onResetToPdfSample={handleResetToPdfSample}
          />
        )}

        {/* VISTA 2: Liquidación General */}
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

        {/* VISTA 3: Calculadora Rápida e Individual */}
        {activeTab === 'calculadora' && (
          <QuickCalculator
            settings={settings}
            onAddSimulatedToPayroll={handleAddSimulatedToPayroll}
          />
        )}

        {/* VISTA 4: Análisis y Estructura de Costos */}
        {activeTab === 'analisis' && (
          <PayrollAnalytics
            employees={employeesWithCalculation}
            settings={settings}
            totals={generalTotals}
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

    </div>
  );
}

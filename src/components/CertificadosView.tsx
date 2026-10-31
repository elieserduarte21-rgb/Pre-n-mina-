import React, { useState } from 'react';
import { EmployeeWithPrenominaCalc, PayrollSettings } from '../types/payroll';
import {
  Award,
  Printer,
  FileText,
  UserCheck,
  Building2,
  Calendar,
  DollarSign,
  GraduationCap,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface CertificadosViewProps {
  employees: EmployeeWithPrenominaCalc[];
  settings: PayrollSettings;
  periodoNombre: string;
}

export const CertificadosView: React.FC<CertificadosViewProps> = ({
  employees,
  settings,
  periodoNombre
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employees[0]?.id || '');
  const [motivo, setMotivo] = useState<string>('Trámites bancarios, subsidios y acreditación de ingresos laborales');

  const selectedEmployee = employees.find(e => e.id === selectedEmpId) || employees[0];

  if (!selectedEmployee) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
        <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
        <p className="text-sm font-semibold">No hay trabajadores disponibles para generar constancias o certificados.</p>
      </div>
    );
  }

  const salarioEscalaBase = selectedEmployee.salarioBasicoEscala || 0;
  const antiguedadImporte = selectedEmployee.montoAntiguedadCalculado || selectedEmployee.montoAntiguedadManual || 0;
  const antiguedadAnos = selectedEmployee.aniosAntiguedad || 0;
  const tituloImporte = selectedEmployee.montoGradoAcademicoCalculado || selectedEmployee.montoGradoAcademicoManual || 0;
  const salarioTotalEstimado = selectedEmployee.salarioTotalEstimado || 0;
  const nocturnidadTotal = selectedEmployee.nocturnidad?.totalNocturnidad || 0;
  const retencion5 = Math.round(salarioTotalEstimado * 0.05 * 100) / 100;
  const salarioNeto = Math.round((salarioTotalEstimado - retencion5) * 100) / 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Portada de la Carpeta */}
      <div className="bg-white rounded-2xl border border-teal-900/15 shadow-sm p-5 sm:p-6 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-sm shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-3xs font-black uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-200">
                  Carpeta de Archivo Oficial · Expediente de Constancias
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Módulo Adicional de Cálculo
                </span>
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                Certificados de Salario, Antigüedad e Ingresos Devengados
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Emisión de constancias oficiales individuales con desglose de escala salarial, años de antigüedad, grado académico y retenciones legales.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Certificado</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selector de Trabajador y Motivo (no-print) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs no-print space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Seleccionar Trabajador del Archivo:
            </label>
            <select
              value={selectedEmpId}
              onChange={e => setSelectedEmpId(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.nombreApellidos} — {e.cargo} (Escala: ${e.salarioBasicoTotal || e.salarioBasicoEscala || 0})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Finalidad / Motivo de la Constancia:
            </label>
            <input
              type="text"
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Documento Imprimible del Certificado */}
      <div className="bg-white rounded-2xl border-2 border-slate-800 shadow-md p-8 sm:p-12 max-w-4xl mx-auto space-y-8 print:p-6 print:border-none print:shadow-none">
        
        {/* Cabecera del Certificado */}
        <div className="border-b-2 border-slate-900 pb-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-slate-800" />
            <span className="text-2xs font-mono font-black uppercase tracking-widest text-slate-600">
              REPÚBLICA DE CUBA · DIRECCIÓN DE RECURSOS HUMANOS Y NÓMINAS
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">
            CERTIFICADO OFICIAL DE SALARIO Y SERVICIOS LABORALES
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Expediente Consecutivo #{selectedEmployee.numeroExpediente || selectedEmployee.id.slice(-4)} · Emisión Oficial
          </p>
        </div>

        {/* Cuerpo del Certificado */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-800 leading-relaxed font-serif">
          <p>
            Por cuanto la Dirección de Capital Humano y Nóminas de la entidad certifica que el compañero(a):
          </p>

          <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 my-2 font-sans space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 gap-1">
              <span className="text-xs text-slate-500 uppercase font-bold">Nombres y Apellidos:</span>
              <span className="text-sm font-black text-slate-900">{selectedEmployee.nombreApellidos}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 gap-1">
              <span className="text-xs text-slate-500 uppercase font-bold">Cargo que Ocupa:</span>
              <span className="text-xs font-bold text-slate-800">{selectedEmployee.cargo}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 gap-1">
              <span className="text-xs text-slate-500 uppercase font-bold">Categoría Ocupacional:</span>
              <span className="text-xs font-mono font-bold text-slate-800">Categoría {selectedEmployee.catOcupacional || 'T'}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-xs text-slate-500 uppercase font-bold">Fecha de Incorporación a la Empresa:</span>
              <span className="text-xs font-mono font-bold text-slate-800">
                {selectedEmployee.fechaIngreso || 'No registrada'} ({antiguedadAnos} años de servicio ininterrumpido)
              </span>
            </div>
          </div>

          <p>
            Labora activamente en nuestra institución, devengando en el periodo de liquidación correspondiente a <strong>{periodoNombre}</strong> los siguientes importes salariales reglamentados:
          </p>

          {/* Tabla de Conceptos Salariales */}
          <div className="border border-slate-900 rounded-lg overflow-hidden my-4 font-mono text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-900">
                  <th className="p-2 border-r border-slate-900">Concepto Económico</th>
                  <th className="p-2 text-center border-r border-slate-900 w-28">Referencia</th>
                  <th className="p-2 text-right w-32">Importe ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                <tr>
                  <td className="p-2 border-r border-slate-300 font-sans font-medium">Salario Escala Base del Cargo</td>
                  <td className="p-2 text-center border-r border-slate-300 text-3xs text-slate-500">Escala Aprobada</td>
                  <td className="p-2 text-right font-bold tabular-nums">${salarioEscalaBase.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-300 font-sans font-medium">
                    Pago por Antigüedad en la Empresa ({antiguedadAnos} años cumplidos)
                  </td>
                  <td className="p-2 text-center border-r border-slate-300 text-3xs text-slate-500">Escala Antigüedad</td>
                  <td className="p-2 text-right font-bold text-emerald-800 tabular-nums">+${antiguedadImporte.toFixed(2)}</td>
                </tr>
                {tituloImporte > 0 && (
                  <tr>
                    <td className="p-2 border-r border-slate-300 font-sans font-medium">
                      Pago Adicional por Grado Académico ({selectedEmployee.gradoAcademico || 'Licenciatura/Posgrado'})
                    </td>
                    <td className="p-2 text-center border-r border-slate-300 text-3xs text-slate-500">Resolución MTSS</td>
                    <td className="p-2 text-right font-bold text-blue-800 tabular-nums">+${tituloImporte.toFixed(2)}</td>
                  </tr>
                )}
                {nocturnidadTotal > 0 && (
                  <tr>
                    <td className="p-2 border-r border-slate-300 font-sans font-medium">Nocturnidad y Turnos Devengados</td>
                    <td className="p-2 text-center border-r border-slate-300 text-3xs text-slate-500">Res. Nocturnidad</td>
                    <td className="p-2 text-right font-bold tabular-nums">+${nocturnidadTotal.toFixed(2)}</td>
                  </tr>
                )}
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                  <td colSpan={2} className="p-2 border-r border-slate-900 uppercase">
                    Salario Bruto Total Liquidado
                  </td>
                  <td className="p-2 text-right font-black text-slate-950 tabular-nums">
                    ${salarioTotalEstimado.toFixed(2)}
                  </td>
                </tr>
                <tr className="text-amber-900">
                  <td className="p-2 border-r border-slate-300 font-sans font-medium">
                    Retención Impuesto Especial sobre Ingresos Personales (5%)
                  </td>
                  <td className="p-2 text-center border-r border-slate-300 text-3xs">Ley Tributaria</td>
                  <td className="p-2 text-right font-bold tabular-nums">-${retencion5.toFixed(2)}</td>
                </tr>
                <tr className="bg-emerald-50 text-emerald-950 font-black border-t border-slate-400">
                  <td colSpan={2} className="p-2 border-r border-slate-900 uppercase">
                    Salario Líquido / Neto Percibido
                  </td>
                  <td className="p-2 text-right font-black text-emerald-900 tabular-nums">
                    ${salarioNeto.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            Y a petición de la parte interesada y a los efectos legales de <strong>{motivo}</strong>, se expide el presente certificado en la fecha {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}.
          </p>
        </div>

        {/* Firmas de Autenticidad */}
        <div className="pt-10 grid grid-cols-2 gap-8 text-center text-xs font-mono">
          <div className="border-t-2 border-slate-900 pt-2">
            <span className="font-bold block text-slate-900 uppercase">Especialista de Capital Humano</span>
            <span className="text-2xs text-slate-500 uppercase block">Confeccionó</span>
            <span className="text-3xs text-slate-400 mt-4 block">Firma y Cuño</span>
          </div>
          <div className="border-t-2 border-slate-900 pt-2">
            <span className="font-bold block text-slate-900 uppercase">Director de Contabilidad / Gerencia</span>
            <span className="text-2xs text-slate-500 uppercase block">Aprobó</span>
            <span className="text-3xs text-slate-400 mt-4 block">Firma y Cuño</span>
          </div>
        </div>

      </div>

    </div>
  );
};

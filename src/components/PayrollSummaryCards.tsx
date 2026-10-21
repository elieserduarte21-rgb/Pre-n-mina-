import React from 'react';
import { PayrollTotals, PayrollSettings } from '../types/payroll';
import { formatCurrency } from '../utils/formatters';
import { Users, DollarSign, MinusCircle, Wallet, Briefcase } from 'lucide-react';

interface PayrollSummaryCardsProps {
  totals: PayrollTotals;
  settings: PayrollSettings;
}

export const PayrollSummaryCards: React.FC<PayrollSummaryCardsProps> = ({ totals, settings }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Total Trabajadores */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Plantilla Activa</span>
          <Users className="w-4 h-4 text-slate-400" />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {totals.totalEmpleados}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span>Base comercial</span>
            <span aria-hidden="true">·</span>
            <span>{settings.diasBaseMes} días</span>
          </div>
        </div>
      </div>

      {/* 2. Total Devengado (Bruto) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Total Devengado</span>
          <DollarSign className="w-4 h-4 text-slate-400" />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {formatCurrency(totals.totalDevengado, settings)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span>Extras: {formatCurrency(totals.totalHorasExtras, settings)}</span>
            <span aria-hidden="true">·</span>
            <span>Bonos: {formatCurrency(totals.totalBonos, settings)}</span>
          </div>
        </div>
      </div>

      {/* 3. Total Deducciones */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Total Deducciones</span>
          <MinusCircle className="w-4 h-4 text-rose-500" />
        </div>
        <div>
          <div className="text-2xl font-bold text-rose-600 font-mono tabular-nums">
            -{formatCurrency(totals.totalDeducciones, settings)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span>Salud + Pensión: {formatCurrency(totals.totalSaludTrabajador + totals.totalPensionTrabajador, settings)}</span>
          </div>
        </div>
      </div>

      {/* 4. Total Neto a Pagar (FOCAL ANCHOR) */}
      <div className="bg-emerald-950/5 border border-emerald-500/30 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between text-emerald-800 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Neto a Dispersar</span>
          <Wallet className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <div className="text-2xl font-bold text-emerald-800 font-mono tabular-nums">
            {formatCurrency(totals.totalNetoPagar, settings)}
          </div>
          <div className="text-xs text-emerald-700/80 mt-1 flex items-center gap-1.5">
            <span>Pago líquido a empleados</span>
            <span aria-hidden="true">·</span>
            <span>100% calculado</span>
          </div>
        </div>
      </div>

      {/* 5. Costo Empresa (Cargas Patronales + Nómina) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Costo Total Empresa</span>
          <Briefcase className="w-4 h-4 text-slate-400" />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {formatCurrency(totals.costoTotalEmpresa, settings)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <span>Cargas patronales: {formatCurrency(totals.totalCargasPatronales, settings)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

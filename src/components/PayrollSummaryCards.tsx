import React, { useState, useEffect } from 'react';
import { PayrollTotals, PayrollSettings } from '../types/payroll';
import { formatCurrency } from '../utils/formatters';
import { Users, DollarSign, MinusCircle, Wallet, Briefcase, Plus, Minus, BarChart2, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

interface PayrollSummaryCardsProps {
  totals: PayrollTotals;
  settings: PayrollSettings;
}

interface BannerItem {
  id: string;
  label: string;
  value: string;
  subtext: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

export const PayrollSummaryCards: React.FC<PayrollSummaryCardsProps> = ({ totals, settings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const bannerItems: BannerItem[] = [
    {
      id: 'plantilla',
      label: 'Plantilla Activa',
      value: `${totals.totalEmpleados} trabajadores`,
      subtext: `Base comercial · ${settings.diasBaseMes} días`,
      icon: Users,
      colorClass: 'text-slate-900',
      bgClass: 'bg-white',
      borderClass: 'border-slate-200'
    },
    {
      id: 'devengado',
      label: 'Total Devengado',
      value: formatCurrency(totals.totalDevengado, settings),
      subtext: `Extras: ${formatCurrency(totals.totalHorasExtras, settings)} · Bonos: ${formatCurrency(totals.totalBonos, settings)}`,
      icon: DollarSign,
      colorClass: 'text-blue-900',
      bgClass: 'bg-blue-50/60',
      borderClass: 'border-blue-200'
    },
    {
      id: 'deducciones',
      label: 'Total Deducciones',
      value: `-${formatCurrency(totals.totalDeducciones, settings)}`,
      subtext: `Salud + Pensión: ${formatCurrency(totals.totalSaludTrabajador + totals.totalPensionTrabajador, settings)}`,
      icon: MinusCircle,
      colorClass: 'text-rose-700',
      bgClass: 'bg-rose-50/60',
      borderClass: 'border-rose-200'
    },
    {
      id: 'neto',
      label: 'Neto a Dispersar',
      value: formatCurrency(totals.totalNetoPagar, settings),
      subtext: 'Pago líquido a empleados · 100% calculado',
      icon: Wallet,
      colorClass: 'text-emerald-900',
      bgClass: 'bg-emerald-50/80',
      borderClass: 'border-emerald-300'
    },
    {
      id: 'costo',
      label: 'Costo Total Empresa',
      value: formatCurrency(totals.costoTotalEmpresa, settings),
      subtext: `Cargas patronales: ${formatCurrency(totals.totalCargasPatronales, settings)}`,
      icon: Briefcase,
      colorClass: 'text-purple-900',
      bgClass: 'bg-purple-50/60',
      borderClass: 'border-purple-200'
    }
  ];

  // Rotación automática del banner cada 3.5 segundos si no está pausado
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % bannerItems.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isPaused, bannerItems.length]);

  const currentItem = bannerItems[currentIndex];
  const CurrentIcon = currentItem.icon;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
      
      {/* Barra superior con selector de despliegue y control de banner */}
      <div className="bg-slate-900 text-white px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-amber-400" />
          <span>Resumen Ejecutivo Financiero (Banner Rotativo)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Botones de control del banner rotativo */}
          {!isOpen && (
            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded border border-slate-700 text-3xs font-mono">
              <button
                type="button"
                onClick={() => setCurrentIndex((currentIndex - 1 + bannerItems.length) % bannerItems.length)}
                className="p-0.5 hover:text-amber-400 transition-colors cursor-pointer"
                title="Anterior indicador"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-1 text-slate-300">{currentIndex + 1} / {bannerItems.length}</span>
              <button
                type="button"
                onClick={() => setCurrentIndex((currentIndex + 1) % bannerItems.length)}
                className="p-0.5 hover:text-amber-400 transition-colors cursor-pointer"
                title="Siguiente indicador"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                className="p-0.5 hover:text-amber-400 transition-colors cursor-pointer ml-1 border-l border-slate-700 pl-1"
                title={isPaused ? "Reanudar rotación automática" : "Pausar rotación automática"}
              >
                {isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
              </button>
            </div>
          )}

          {/* Botón de Mostrar / Ocultar todas las tarjetas */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded border border-slate-700 transition-colors cursor-pointer text-2xs font-mono"
          >
            {isOpen ? (
              <>
                <Minus className="w-3 h-3" />
                <span>Ocultar Tarjetas</span>
              </>
            ) : (
              <>
                <Plus className="w-3 h-3" />
                <span>Ver Todas (5)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Banner rotativo activo (cuando el grid completo está oculto) */}
      {!isOpen && (
        <div 
          className={`p-4 transition-all duration-300 ${currentItem.bgClass} border-b ${currentItem.borderClass} flex items-center justify-between gap-4 cursor-pointer select-none`}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onClick={() => setCurrentIndex((currentIndex + 1) % bannerItems.length)}
          title="Haga clic para ver el siguiente indicador del banner"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-2.5 bg-white shadow-xs rounded-xl border border-slate-200 text-slate-800 shrink-0">
              <CurrentIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                {currentItem.label} ({currentIndex + 1} de {bannerItems.length})
              </div>
              <div className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${currentItem.colorClass} truncate mt-0.5`}>
                {currentItem.value}
              </div>
              <div className="text-3xs text-slate-500 truncate mt-0.5">
                {currentItem.subtext}
              </div>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 text-3xs text-slate-400 font-mono">
            <span>Rotando cada 3.5s</span>
            <div className="flex gap-1 mt-1">
              {bannerItems.map((_, idx) => (
                <span
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    currentIndex === idx ? 'w-6 bg-slate-900' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contenido expandido (Grid completo de las 5 tarjetas) */}
      {isOpen && (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-in fade-in duration-150">
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
      )}
    </div>
  );
};

import React, { useRef } from 'react';
import { FileSpreadsheet, Upload, Download } from 'lucide-react';
import { readExcelFile } from '../utils/excelHelper';

interface ExcelActionsProps {
  onExport: () => void;
  onImport: (rows: Record<string, any>[], allSheets?: Record<string, Record<string, any>[]>) => void;
  label?: string;
  exportTitle?: string;
  importTitle?: string;
  compact?: boolean;
}

export const ExcelActions: React.FC<ExcelActionsProps> = ({
  onExport,
  onImport,
  label,
  exportTitle = 'Exportar a Excel (.xlsx)',
  importTitle = 'Importar desde Excel (.xlsx, .xls, .csv)',
  compact = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const sheets = await readExcelFile(file);
      const sheetNames = Object.keys(sheets);
      if (sheetNames.length === 0) {
        alert('El archivo Excel seleccionado no contiene hojas legibles.');
        return;
      }
      // Use the first sheet by default, pass all sheets as second argument
      const firstSheetData = sheets[sheetNames[0]] || [];
      onImport(firstSheetData, sheets);
    } catch (err: any) {
      console.error('Error al importar Excel:', err);
      alert(`Error al leer el archivo Excel: ${err?.message || 'Formato no compatible'}`);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="inline-flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-0.5 shadow-xs text-xs">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls, .csv"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={onExport}
        title={exportTitle}
        className={`inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer ${
          compact ? 'px-2 py-1 text-2xs' : 'px-2.5 py-1.5 text-xs'
        }`}
      >
        <Download className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>Exportar {label ? label : 'Excel'}</span>
      </button>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        title={importTitle}
        className={`inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer ${
          compact ? 'px-2 py-1 text-2xs' : 'px-2.5 py-1.5 text-xs'
        }`}
      >
        <Upload className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>Importar</span>
      </button>
    </div>
  );
};

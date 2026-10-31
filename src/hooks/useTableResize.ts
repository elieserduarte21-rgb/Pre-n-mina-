import { useState, useEffect, useRef } from 'react';

export const useTableResize = (tableId: string, initialWidths: Record<string, number>) => {
  const [widths, setWidths] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(`table_widths_${tableId}`);
    return saved ? JSON.parse(saved) : initialWidths;
  });

  const isResizing = useRef<string | null>(null);

  useEffect(() => {
    localStorage.setItem(`table_widths_${tableId}`, JSON.stringify(widths));
  }, [tableId, widths]);

  const startResizing = (columnId: string) => {
    isResizing.current = columnId;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const colId = isResizing.current;
    
    setWidths(prev => ({
      ...prev,
      [colId]: Math.max(50, (prev[colId] || 100) + e.movementX)
    }));
  };

  const stopResizing = () => {
    isResizing.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
  };

  return { widths, startResizing };
};


import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value: string; // ISO string YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  
  // State for calculated position - Removed transformOrigin as we only fade
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const initialDate = value ? new Date(value) : new Date();
  const [viewDate, setViewDate] = useState(initialDate);

  // Global event listeners
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inContainer = containerRef.current?.contains(target);
      const inPopover = popoverRef.current?.contains(target);
      if (!inContainer && !inPopover) setIsOpen(false);
    };

    if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("scroll", () => setIsOpen(false), true);
        window.addEventListener("resize", () => setIsOpen(false));
    }
    
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("scroll", () => setIsOpen(false), true);
        window.removeEventListener("resize", () => setIsOpen(false));
    };
  }, [isOpen]);

  // Smart Positioning Logic
  useLayoutEffect(() => {
    if (isOpen && containerRef.current && popoverRef.current) {
        const updatePosition = () => {
            if (!containerRef.current || !popoverRef.current) return;

            const triggerRect = containerRef.current.getBoundingClientRect();
            const popoverRect = popoverRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            
            let top = 0;
            let left = triggerRect.left;
            
            // Vertical Logic
            const spaceBelow = viewportHeight - triggerRect.bottom;
            const spaceAbove = triggerRect.top;
            const popoverHeight = popoverRect.height || 300; 
            
            // If space below is insufficient AND space above is better
            if (spaceBelow < popoverHeight + 10 && spaceAbove > popoverHeight + 10) {
                top = triggerRect.top - popoverHeight - 8;
            } else {
                top = triggerRect.bottom + 8;
            }

            // Horizontal Logic
            if (left + popoverRect.width > viewportWidth - 20) {
                const rightAlignedLeft = triggerRect.right - popoverRect.width;
                if (rightAlignedLeft > 20) {
                    left = rightAlignedLeft;
                } else {
                    left = viewportWidth - popoverRect.width - 20;
                }
            }
            if (left < 10) left = 10;

            setPosition({ top, left });
        };

        // Observe size changes
        const observer = new ResizeObserver(() => updatePosition());
        observer.observe(popoverRef.current);

        updatePosition();

        return () => observer.disconnect();
    } else {
        setPosition(null);
    }
  }, [isOpen, viewDate]);

  // Calendar Logic
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  const days = daysInMonth(currentYear, currentMonth);
  const startDay = firstDayOfMonth(currentYear, currentMonth); 

  const handleDayClick = (day: number) => {
    const m = (currentMonth + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    onChange(`${currentYear}-${m}-${d}`);
    setIsOpen(false);
  };

  const changeMonth = (delta: number) => {
    setViewDate(new Date(currentYear, currentMonth + delta, 1));
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="relative w-full" ref={containerRef}>
       {label && (
        <label className="text-xs font-medium text-atlas-text-secondary uppercase tracking-wider mb-1.5 block">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-10 w-full items-center justify-start rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm font-mono text-white ring-offset-black transition-colors hover:bg-white/5 focus:outline-none focus:ring-1 focus:ring-atlas-accent ${!value && "text-white/20"}`}
      >
        <CalendarIcon className="mr-2 h-4 w-4 text-atlas-text-secondary" />
        {value || "Pick a date"}
      </button>

      {isOpen && createPortal(
        <div 
            ref={popoverRef}
            style={{ 
                position: 'fixed',
                top: position ? position.top : 0,
                left: position ? position.left : 0,
                opacity: position ? 1 : 0, 
                // Pure CSS transition for opacity, no transforms
            }}
            className={`z-[9999] w-auto min-w-[280px] rounded-md border border-white/10 bg-[#18181b] p-4 text-white shadow-2xl transition-opacity duration-200 ease-out`}
        >
          <div className="flex items-center justify-between mb-4">
             <button type="button" onClick={() => changeMonth(-1)} className="p-1 hover:bg-white/10 rounded transition-colors"><ChevronLeft className="w-4 h-4 text-atlas-text-secondary" /></button>
             <div className="font-semibold text-sm">
                {monthNames[currentMonth]} <span className="text-atlas-text-secondary">{currentYear}</span>
             </div>
             <button type="button" onClick={() => changeMonth(1)} className="p-1 hover:bg-white/10 rounded transition-colors"><ChevronRight className="w-4 h-4 text-atlas-text-secondary" /></button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {weekDays.map(d => <div key={d} className="text-[10px] text-atlas-text-secondary uppercase">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
             {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
             {Array.from({ length: days }).map((_, i) => {
                const day = i + 1;
                const checkDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                const isSelected = value === checkDate;
                const isToday = new Date().toISOString().split('T')[0] === checkDate;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayClick(day)}
                    className={`h-8 w-8 rounded text-sm flex items-center justify-center transition-colors ${
                       isSelected ? 'bg-atlas-accent text-white font-bold' :
                       isToday ? 'bg-white/10 text-white' :
                       'hover:bg-white/10 text-atlas-text-primary'
                    }`}
                  >
                     {day}
                  </button>
                )
             })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

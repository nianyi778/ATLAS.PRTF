
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  subLabel?: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({ value, onChange, options, placeholder = "Select...", label, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // State for calculated position - Removed transformOrigin
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inContainer = containerRef.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);
      if (!inContainer && !inDropdown) setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("resize", () => setIsOpen(false));
      document.addEventListener("scroll", () => setIsOpen(false), true);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", () => setIsOpen(false));
      document.removeEventListener("scroll", () => setIsOpen(false), true);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (isOpen && containerRef.current && dropdownRef.current) {
        const updatePosition = () => {
             if (!containerRef.current || !dropdownRef.current) return;

             const triggerRect = containerRef.current.getBoundingClientRect();
             const dropdownRect = dropdownRef.current.getBoundingClientRect();
             const viewportHeight = window.innerHeight;

             const spaceBelow = viewportHeight - triggerRect.bottom;
             const dropdownHeight = dropdownRect.height || 200; 
             
             let top = 0;

             // If space below is tight AND space above is sufficient
             if (spaceBelow < dropdownHeight && triggerRect.top > dropdownHeight) {
                 top = triggerRect.top - dropdownHeight - 4;
             } else {
                 top = triggerRect.bottom + 4;
             }

             setPosition({
                 top,
                 left: triggerRect.left,
                 width: triggerRect.width,
             });
        };

        const observer = new ResizeObserver(() => updatePosition());
        observer.observe(dropdownRef.current);
        updatePosition();

        return () => observer.disconnect();
    } else {
        setPosition(null);
    }
  }, [isOpen]);

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="text-xs font-medium text-atlas-text-secondary uppercase tracking-wider mb-1.5 block">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white ring-offset-black placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-atlas-accent disabled:cursor-not-allowed disabled:opacity-50 transition-colors hover:bg-white/5"
      >
        <span className={!selectedOption ? "text-white/20" : ""}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 opacity-50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: position ? position.top : 0,
            left: position ? position.left : 0,
            width: position ? position.width : 'auto',
            opacity: position ? 1 : 0,
            zIndex: 9999
          }}
          className={`max-h-60 overflow-auto rounded-md border border-white/10 bg-[#18181b] p-1 text-white shadow-2xl transition-opacity duration-200 ease-out`}
        >
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-2 pr-8 text-sm outline-none transition-colors hover:bg-white/10 ${
                option.value === value ? 'bg-white/10 text-white' : 'text-atlas-text-secondary'
              }`}
            >
              <div className="flex flex-col items-start">
                  <span className={option.value === value ? 'font-medium' : ''}>{option.label}</span>
                  {option.subLabel && <span className="text-[10px] text-atlas-text-muted">{option.subLabel}</span>}
              </div>
              {option.value === value && (
                <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                  <Check className="h-4 w-4 text-atlas-accent" />
                </span>
              )}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

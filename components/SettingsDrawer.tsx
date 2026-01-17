
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose, children }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [animateOpen, setAnimateOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      document.body.style.overflow = 'hidden';
      
      const timer = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimateOpen(true);
        });
      });
      
      return () => cancelAnimationFrame(timer);
    } else {
      setAnimateOpen(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
        document.body.style.overflow = '';
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-[4px] transition-opacity duration-500 ease-in-out ${animateOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Drawer Panel - Removed skew for cleaner slide-in */}
      <div 
        className={`relative w-full h-full bg-[#09090b] shadow-2xl border-l border-white/10 origin-bottom-right transform transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col 
          ${animateOpen ? 'translate-x-0 opacity-100' : 'translate-x-[10%] opacity-0'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 md:px-10 md:py-6 border-b border-white/5 bg-[#09090b]/50 backdrop-blur-md z-10 shrink-0">
          <h2 className="text-xl font-bold tracking-tight text-white">系统设定</h2>
          <button 
            onClick={onClose}
            className="p-2 text-atlas-text-secondary hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-gradient-to-b from-[#09090b] to-[#18181b]">
            {children}
        </div>
      </div>
    </div>
  );
};

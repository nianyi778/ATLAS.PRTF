
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Organization } from '../types';
import { ChevronsUpDown, Check } from 'lucide-react';

interface OrgSelectorProps {
  organizations: Organization[];
  currentOrgId: string;
  onSelect: (id: string) => void;
}

export const OrgSelector: React.FC<OrgSelectorProps> = ({ organizations, currentOrgId, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentOrg = organizations.find(o => o.id === currentOrgId);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // State for calculated position - Removed transformOrigin
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) && 
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
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
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors text-sm font-medium text-white group"
      >
        <span className="truncate">{currentOrg?.name || '选择工作区'}</span>
        <ChevronsUpDown className="w-4 h-4 text-atlas-text-secondary group-hover:text-white transition-colors" />
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
            className={`fixed glass-panel bg-[#18181b] border border-white/10 rounded-lg shadow-2xl overflow-hidden transition-opacity duration-200 ease-out`}
        >
          <div className="p-1">
            {organizations.map(org => (
              <button
                key={org.id}
                onClick={() => {
                  onSelect(org.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between transition-colors ${
                  org.id === currentOrgId 
                    ? 'bg-atlas-accent text-white' 
                    : 'text-atlas-text-secondary hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>{org.name}</span>
                {org.id === currentOrgId && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
          <div className="border-t border-white/10 p-2 bg-black/20">
             <button className="w-full text-center text-xs text-atlas-text-secondary hover:text-white py-1">
               + 创建新工作区
             </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

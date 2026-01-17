
import React from 'react';

// --- INPUT ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label className="text-xs font-medium text-atlas-text-secondary uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          className={`flex h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white ring-offset-black file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-white/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-atlas-accent disabled:cursor-not-allowed disabled:opacity-50 font-mono transition-all duration-200 ${className}`}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";

// --- SWITCH ---
interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
}
export const Switch: React.FC<SwitchProps> = ({ checked, onCheckedChange, id, disabled }) => (
  <button
    type="button"
    role="switch"
    id={id}
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onCheckedChange(!checked)}
    className={`peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-atlas-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50 ${
      checked ? 'bg-atlas-accent' : 'bg-zinc-700'
    }`}
  >
    <span
      className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

// --- SLIDER ---
interface SliderProps {
  value: number[];
  min: number;
  max: number;
  step: number;
  onValueChange: (value: number[]) => void;
  disabled?: boolean;
  className?: string;
}
export const Slider: React.FC<SliderProps> = ({ value, min, max, step, onValueChange, disabled, className }) => {
  const percentage = ((value[0] - min) / (max - min)) * 100;
  
  return (
    <div className={`relative flex w-full touch-none select-none items-center py-4 ${className}`}>
      <input 
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[0]}
        disabled={disabled}
        onChange={(e) => onValueChange([parseFloat(e.target.value)])}
        className="absolute w-full h-full opacity-0 cursor-pointer z-20"
      />
      <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-white/10">
        <div 
          className="absolute h-full bg-atlas-accent transition-all" 
          style={{ width: `${percentage}%` }} 
        />
      </div>
      <div 
        className="block h-5 w-5 rounded-full border-2 border-atlas-accent bg-black ring-offset-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-atlas-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 absolute z-10 pointer-events-none shadow-xl"
        style={{ left: `calc(${percentage}% - 10px)` }}
      />
    </div>
  );
};

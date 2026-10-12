import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  placeholder?: string;
  error?: boolean | string;
  onChange?: (value: string) => void;
  label?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, placeholder, error, onChange, label, helperText, className = '', id, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).slice(2)}`;
    const errorMessage = typeof error === 'string' ? error : undefined;
    const hasError = !!error;

    return (
      <div className={`cds-select-wrapper ${className}`}>
        {label && <label htmlFor={selectId} className="cds-select__label">{label}</label>}
        <select
          ref={ref}
          id={selectId}
          className={`cds-select ${hasError ? 'cds-select--error' : ''}`}
          onChange={(e) => onChange?.(e.target.value)}
          {...props}
        >
          {placeholder && <option value="" disabled selected>{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        {helperText && <span className="cds-select__helper">{helperText}</span>}
        {errorMessage && <span className="cds-select__error-text" aria-live="polite">{errorMessage}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
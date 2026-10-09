import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      primary: 'cds-btn--primary',
      secondary: 'cds-btn--secondary',
      ghost: 'cds-btn--ghost',
      danger: 'cds-btn--danger',
    };

    const sizeClasses = {
      sm: 'cds-btn--sm',
      md: '',
      lg: 'cds-btn--lg',
    };

    const widthClass = fullWidth ? 'cds-btn--full-width' : '';

    return (
      <button
        ref={ref}
        className={`cds-btn ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <span className="cds-btn__spinner" aria-hidden="true" />}
        <span className={loading ? 'cds-btn__text--hidden' : ''}>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
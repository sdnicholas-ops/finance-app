interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  ariaLabel?: string;
}

export function Spinner({ size = 'md', className = '', ariaLabel = 'Loading' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'cds-spinner--sm',
    md: 'cds-spinner--md',
    lg: 'cds-spinner--lg',
  };

  return (
    <div
      className={`cds-spinner ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label={ariaLabel}
    >
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle
          className="cds-spinner__track"
          cx="12"
          cy="12"
          r="10"
          strokeWidth="3"
        />
        <circle
          className="cds-spinner__indicator"
          cx="12"
          cy="12"
          r="10"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span className="cds-visually-hidden">{ariaLabel}</span>
    </div>
  );
}
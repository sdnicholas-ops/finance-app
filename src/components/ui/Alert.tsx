import { ReactNode } from 'react';
import { Button } from './Button';

interface AlertProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const typeIcons = {
  info: (
    <svg viewBox="0 0 16 16" fill="currentColor" className="cds-inline-notification__icon" aria-hidden="true">
      <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM8 15A7 7 0 118 1a7 7 0 010 14zm0-12a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0v-4.5A.75.75 0 008 3z" />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 16 16" fill="currentColor" className="cds-inline-notification__icon" aria-hidden="true">
      <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 16 16" fill="currentColor" className="cds-inline-notification__icon" aria-hidden="true">
      <path d="M8.28.11A.75.75 0 008 0a.76.76 0 00-.57.24L.24 13.87a.75.75 0 00.63 1.26h14.25a.75.75 0 00.63-1.26L8.28.11zm1.18 11.62a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm-1.18-4.5a.75.75 0 100 1.5.75.75 0 000-1.5z" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 16 16" fill="currentColor" className="cds-inline-notification__icon" aria-hidden="true">
      <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM5.47 5.47a.75.75 0 00-1.06 1.06L6.94 8 4.41 10.53a.75.75 0 101.06 1.06L8 9.06l2.53 2.53a.75.75 0 001.06-1.06L9.06 8l2.53-2.53a.75.75 0 10-1.06-1.06L8 6.94 5.47 4.41z" />
    </svg>
  ),
};

export function Alert({ type, title, children, onDismiss, action, className = '' }: AlertProps) {
  return (
    <div className={`cds-inline-notification cds-inline-notification--${type} ${className}`} role="alert">
      <div className="cds-inline-notification__icon">{typeIcons[type]}</div>
      <div className="cds-inline-notification__content">
        {title && <div className="cds-inline-notification__title">{title}</div>}
        <div className="cds-inline-notification__message">{children}</div>
        {action && (
          <Button variant="ghost" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
      {onDismiss && (
        <button className="cds-inline-notification__close" onClick={onDismiss} aria-label="Dismiss">
          <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16" aria-hidden="true">
            <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
          </svg>
        </button>
      )}
    </div>
  );
}
import { memo } from 'react';
import { Alert } from '../ui/Alert';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

const ErrorBanner = memo(function ErrorBanner({ message, onRetry, onDismiss }: ErrorBannerProps) {
  return (
    <Alert
      type="error"
      title="Failed to load data"
      onDismiss={onDismiss}
      action={onRetry ? { label: 'Retry', onClick: onRetry } : undefined}
    >
      {message}
    </Alert>
  );
});

ErrorBanner.displayName = 'ErrorBanner';

export { ErrorBanner };
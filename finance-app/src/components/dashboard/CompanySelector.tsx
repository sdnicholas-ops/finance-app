import { useState, FormEvent } from 'react';
import { Button } from '../ui/Button';

interface CompanySelectorProps {
  activeSymbol: string;
  onSelect: (symbol: string) => void;
  onClear: () => void;
  isLoading?: boolean;
}

export function CompanySelector({
  activeSymbol,
  onSelect,
  onClear,
  isLoading = false,
}: CompanySelectorProps) {
  const [inputVal, setInputVal] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim().toUpperCase();

    if (!trimmed) {
      setError('Please enter a stock ticker symbol');
      return;
    }

    if (!/^[A-Z]{1,5}$/.test(trimmed)) {
      setError('Ticker must be 1–5 letters (e.g. NVDA)');
      return;
    }

    setError(null);
    onSelect(trimmed);
  };

  const handleInputChange = (val: string) => {
    setInputVal(val.toUpperCase());
    if (error) setError(null);
  };

  const handleClear = () => {
    setInputVal('');
    setError(null);
    onClear();
  };

  return (
    <div className="cds-company-selector" data-testid="company-selector">
      <div className="cds-company-selector__header">
        <h3 className="cds-section-label">CUSTOM COMPANY COMPARISON</h3>
        <p className="cds-company-selector__desc">
          Compare any company or stock ticker against the default index.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="cds-company-selector__form">
        <div className="cds-company-selector__input-group">
          <input
            type="text"
            className={`cds-input ${error ? 'cds-input--error' : ''}`}
            placeholder="Enter ticker (e.g. NVDA)"
            value={inputVal}
            onChange={(e) => handleInputChange(e.target.value)}
            maxLength={5}
            aria-label="Stock Symbol"
            data-testid="company-selector-input"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isLoading}
            data-testid="company-selector-submit"
          >
            Load
          </Button>

          {activeSymbol && (
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handleClear}
              data-testid="company-selector-clear"
            >
              Clear
            </Button>
          )}
        </div>

        {error && (
          <div className="cds-form-error" role="alert" data-testid="company-selector-error">
            {error}
          </div>
        )}

        <div className="cds-company-selector__presets">
          <span className="cds-presets-label">Suggested:</span>
          {['NVDA', 'AAPL', 'GOOGL', 'AMZN'].map((sym) => (
            <button
              key={sym}
              type="button"
              className={`cds-preset-chip ${activeSymbol === sym ? 'cds-preset-chip--active' : ''}`}
              onClick={() => {
                setInputVal(sym);
                setError(null);
                onSelect(sym);
              }}
            >
              {sym}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}

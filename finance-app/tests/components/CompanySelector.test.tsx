import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompanySelector } from '../../src/components/dashboard/CompanySelector';

describe('CompanySelector', () => {
  it('renders input, Load button, and suggested presets', () => {
    render(
      <CompanySelector
        activeSymbol=""
        onSelect={vi.fn()}
        onClear={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText('Enter ticker (e.g. NVDA)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Load' })).toBeInTheDocument();
    expect(screen.getByText('NVDA')).toBeInTheDocument();
  });

  it('calls onSelect with uppercase symbol when valid ticker is submitted', () => {
    const onSelect = vi.fn();
    render(
      <CompanySelector
        activeSymbol=""
        onSelect={onSelect}
        onClear={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Enter ticker (e.g. NVDA)');
    fireEvent.change(input, { target: { value: 'nvda' } });
    fireEvent.click(screen.getByRole('button', { name: 'Load' }));

    expect(onSelect).toHaveBeenCalledWith('NVDA');
  });

  it('shows error message and does not call onSelect when input is empty', () => {
    const onSelect = vi.fn();
    render(
      <CompanySelector
        activeSymbol=""
        onSelect={onSelect}
        onClear={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Load' }));

    expect(screen.getByText('Please enter a stock ticker symbol')).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows error message when input contains digits or invalid characters', () => {
    const onSelect = vi.fn();
    render(
      <CompanySelector
        activeSymbol=""
        onSelect={onSelect}
        onClear={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Enter ticker (e.g. NVDA)');
    fireEvent.change(input, { target: { value: 'IBM1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Load' }));

    expect(screen.getByText('Ticker must be 1–5 letters (e.g. NVDA)')).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders Clear button when activeSymbol is set and calls onClear on click', () => {
    const onClear = vi.fn();
    render(
      <CompanySelector
        activeSymbol="NVDA"
        onSelect={vi.fn()}
        onClear={onClear}
      />
    );

    const clearBtn = screen.getByRole('button', { name: 'Clear' });
    expect(clearBtn).toBeInTheDocument();

    fireEvent.click(clearBtn);
    expect(onClear).toHaveBeenCalled();
  });

  it('selects preset chip when clicked', () => {
    const onSelect = vi.fn();
    render(
      <CompanySelector
        activeSymbol=""
        onSelect={onSelect}
        onClear={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('NVDA'));
    expect(onSelect).toHaveBeenCalledWith('NVDA');
  });
});

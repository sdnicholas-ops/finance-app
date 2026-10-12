import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CompanyCard } from '../../src/components/dashboard/CompanyCard';
import type { CompanySnapshot } from '../../src/types/finance';

/** Minimal snapshot — no extended stats fields */
const minimalSnapshot: CompanySnapshot = {
  quote: {
    symbol: 'IBM',
    shortName: 'International Business Machines',
    regularMarketPrice: 185.42,
    regularMarketChange: 2.15,
    regularMarketChangePercent: 1.17,
    currency: 'USD',
    marketState: 'REGULAR',
    regularMarketTime: Math.floor(Date.now() / 1000),
  },
  history: [
    { date: '2024-01-01', close: 180, volume: 1_000_000 },
    { date: '2024-01-02', close: 183, volume: 1_000_000 },
    { date: '2024-01-03', close: 185.42, volume: 1_000_000 },
  ],
};

/** Full snapshot — all extended stats fields populated */
const fullSnapshot: CompanySnapshot = {
  ...minimalSnapshot,
  quote: {
    ...minimalSnapshot.quote,
    regularMarketOpen: 183.00,
    regularMarketPreviousClose: 181.50,
    regularMarketDayHigh: 186.00,
    regularMarketDayLow: 182.00,
    regularMarketVolume: 4_400_000,
    fiftyTwoWeekHigh: 200.00,
    fiftyTwoWeekLow: 120.00,
    marketCap: 86_700_000_000,
    targetMeanPrice: 160.77,
  },
};

describe('CompanyCard', () => {
  describe('basic rendering', () => {
    it('renders symbol and company name', () => {
      render(<CompanyCard snapshot={minimalSnapshot} />);
      expect(screen.getByText('IBM')).toBeInTheDocument();
      expect(screen.getByText('International Business Machines')).toBeInTheDocument();
    });

    it('renders formatted current price', () => {
      render(<CompanyCard snapshot={minimalSnapshot} />);
      expect(screen.getByText('$185.42')).toBeInTheDocument();
    });

    it('renders time label when regularMarketTime is present', () => {
      render(<CompanyCard snapshot={minimalSnapshot} />);
      const timeEl = document.querySelector('.cds-company-card__time');
      expect(timeEl).toBeInTheDocument();
      expect(timeEl?.textContent).toBeTruthy();
    });

    it('does not render time label when regularMarketTime is absent', () => {
      const snap = { ...minimalSnapshot, quote: { ...minimalSnapshot.quote, regularMarketTime: undefined } };
      render(<CompanyCard snapshot={snap} />);
      expect(document.querySelector('.cds-company-card__time')).not.toBeInTheDocument();
    });
  });

  describe('change indicator', () => {
    it('applies positive class and shows + prefix for gain', () => {
      render(<CompanyCard snapshot={minimalSnapshot} />);
      const el = document.querySelector('.cds-company-card__change--positive');
      expect(el).toBeInTheDocument();
      expect(el?.textContent).toContain('+2.15');
    });

    it('applies negative class and shows − prefix for loss', () => {
      const snap = {
        ...minimalSnapshot,
        quote: { ...minimalSnapshot.quote, regularMarketChange: -3.5, regularMarketChangePercent: -1.85 },
      };
      render(<CompanyCard snapshot={snap} />);
      const el = document.querySelector('.cds-company-card__change--negative');
      expect(el).toBeInTheDocument();
      expect(el?.textContent).toContain('-3.50');
    });

    it('applies neutral class for zero change', () => {
      const snap = {
        ...minimalSnapshot,
        quote: { ...minimalSnapshot.quote, regularMarketChange: 0, regularMarketChangePercent: 0 },
      };
      render(<CompanyCard snapshot={snap} />);
      expect(document.querySelector('.cds-company-card__change--neutral')).toBeInTheDocument();
    });
  });

  describe('stats row', () => {
    it('does not render stats row when regularMarketOpen is absent', () => {
      render(<CompanyCard snapshot={minimalSnapshot} />);
      // No OPEN label — stats row suppressed
      expect(screen.queryByText('OPEN')).not.toBeInTheDocument();
    });

    it('renders all stats for a competitor card (spotlight=false)', () => {
      render(<CompanyCard snapshot={fullSnapshot} spotlight={false} />);
      expect(screen.getByText('OPEN')).toBeInTheDocument();
      expect(screen.getByText('PREV CLOSE')).toBeInTheDocument();
      expect(screen.getByText('DAY RANGE')).toBeInTheDocument();
      expect(screen.getByText('52WK RANGE')).toBeInTheDocument();
      expect(screen.getByText('MKT CAP')).toBeInTheDocument();
      expect(screen.getByText('TARGET')).toBeInTheDocument();
    });

    it('renders all stats for the spotlight card (spotlight=true)', () => {
      render(<CompanyCard snapshot={fullSnapshot} spotlight={true} />);
      expect(screen.getByText('DAY RANGE')).toBeInTheDocument();
      expect(screen.getByText('52WK RANGE')).toBeInTheDocument();
      expect(screen.getByText('MKT CAP')).toBeInTheDocument();
      expect(screen.getByText('TARGET')).toBeInTheDocument();
    });

    it('omits MKT CAP row when marketCap is absent', () => {
      const snap = { ...fullSnapshot, quote: { ...fullSnapshot.quote, marketCap: undefined } };
      render(<CompanyCard snapshot={snap} />);
      expect(screen.queryByText('MKT CAP')).not.toBeInTheDocument();
    });

    it('omits TARGET row when targetMeanPrice is absent', () => {
      const snap = { ...fullSnapshot, quote: { ...fullSnapshot.quote, targetMeanPrice: undefined } };
      render(<CompanyCard snapshot={snap} />);
      expect(screen.queryByText('TARGET')).not.toBeInTheDocument();
    });
  });

  describe('spotlight vs competitor variants', () => {
    it('applies spotlight CSS modifier when spotlight=true', () => {
      const { container } = render(<CompanyCard snapshot={minimalSnapshot} spotlight={true} />);
      expect(container.firstChild).toHaveClass('cds-company-card--spotlight');
    });

    it('applies competitor CSS modifier when spotlight=false', () => {
      const { container } = render(<CompanyCard snapshot={minimalSnapshot} spotlight={false} />);
      expect(container.firstChild).toHaveClass('cds-company-card--competitor');
    });
  });
});

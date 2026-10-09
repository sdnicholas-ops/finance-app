import type { Quote, HistoryPoint, CompanyProfile, TimeWindow } from '../types/finance';

interface MockQuoteExtras {
  shortName: string;
  open: number;
  prevClose: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  weekHigh: number;
  weekLow: number;
  marketCap: number;
  target: number;
  change: number;
  changePercent: number;
}

const mockQuoteData: Record<string, MockQuoteExtras> = {
  IBM:  { shortName: 'IBM',        open: 143.18, prevClose: 141.22, dayHigh: 144.60, dayLow: 142.99, volume: 4_400_000,  weekHigh: 193.18, weekLow:  99.94, marketCap: 86_700_000_000, target: 160.77, change:  3.31, changePercent:  2.34 },
  MSFT: { shortName: 'Microsoft',  open: 414.13, prevClose: 419.40, dayHigh: 415.20, dayLow: 412.50, volume: 3_600_000,  weekHigh: 468.35, weekLow: 362.90, marketCap: 3_080_000_000_000, target: 510.00, change: -7.53, changePercent: -1.80 },
  ORCL: { shortName: 'Oracle',     open: 157.71, prevClose: 156.04, dayHigh: 161.10, dayLow: 157.20, volume: 3_700_000,  weekHigh: 198.31, weekLow: 100.16, marketCap: 440_000_000_000, target: 185.00, change:  4.48, changePercent:  2.87 },
  SAP:  { shortName: 'SAP',        open: 212.66, prevClose: 210.89, dayHigh: 215.30, dayLow: 211.50, volume: 9_900_000,  weekHigh: 236.10, weekLow: 145.02, marketCap: 258_000_000_000, target: 240.00, change:  3.70, changePercent:  1.75 },
  CRM:  { shortName: 'Salesforce', open: 282.74, prevClose: 284.45, dayHigh: 285.10, dayLow: 281.20, volume: 8_800_000,  weekHigh: 318.71, weekLow: 212.00, marketCap: 271_000_000_000, target: 320.00, change:  0.51, changePercent:  0.18 },
};

export const mockQuotes: Record<string, Quote> = Object.fromEntries(
  Object.entries(mockQuoteData).map(([symbol, d]) => [
    symbol,
    {
      symbol,
      shortName: d.shortName,
      regularMarketPrice: d.prevClose + d.change,
      regularMarketChange: d.change,
      regularMarketChangePercent: d.changePercent,
      currency: 'USD',
      marketState: 'REGULAR',
      regularMarketTime: Math.floor(Date.now() / 1000),
      regularMarketOpen: d.open,
      regularMarketPreviousClose: d.prevClose,
      regularMarketDayHigh: d.dayHigh,
      regularMarketDayLow: d.dayLow,
      regularMarketVolume: d.volume,
      fiftyTwoWeekHigh: d.weekHigh,
      fiftyTwoWeekLow: d.weekLow,
      marketCap: d.marketCap,
      targetMeanPrice: d.target,
    },
  ])
);

function generateHistory(basePrice: number, days: number, volatility: number = 0.02): HistoryPoint[] {
  const result: HistoryPoint[] = [];
  let price = basePrice * (1 - volatility * days / 2); // Start lower

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dailyChange = (Math.random() - 0.5) * 2 * volatility * price;
    price = Math.max(price + dailyChange, basePrice * 0.5);
    result.push({
      date: date.toISOString().split('T')[0],
      close: Math.round(price * 100) / 100,
      volume: Math.floor(Math.random() * 10_000_000) + 1_000_000,
    });
  }
  return result;
}

function generateIntraday(basePrice: number): HistoryPoint[] {
  const result: HistoryPoint[] = [];
  let price = basePrice * 0.995;
  const now = new Date();
  const marketOpen = new Date(now);
  marketOpen.setHours(9, 30, 0, 0);

  for (let i = 0; i < 78; i++) { // 390 minutes / 5 = 78 intervals
    const date = new Date(marketOpen.getTime() + i * 5 * 60 * 1000);
    if (date > now) break;
    const change = (Math.random() - 0.5) * 0.01 * price;
    price = Math.max(price + change, basePrice * 0.5);
    result.push({
      date: date.toISOString(),
      close: Math.round(price * 100) / 100,
      volume: Math.floor(Math.random() * 100_000) + 10_000,
    });
  }
  return result;
}

const basePrices: Record<string, number> = Object.fromEntries(
  Object.entries(mockQuoteData).map(([s, d]) => [s, d.prevClose + d.change])
);

export const mockHistory: Record<string, Record<TimeWindow, HistoryPoint[]>> = {
  IBM: {
    '1D': generateIntraday(basePrices.IBM),
    '7D': generateHistory(basePrices.IBM, 7, 0.015),
    '1Q': generateHistory(basePrices.IBM, 63, 0.02),
  },
  MSFT: {
    '1D': generateIntraday(basePrices.MSFT),
    '7D': generateHistory(basePrices.MSFT, 7, 0.015),
    '1Q': generateHistory(basePrices.MSFT, 63, 0.02),
  },
  ORCL: {
    '1D': generateIntraday(basePrices.ORCL),
    '7D': generateHistory(basePrices.ORCL, 7, 0.018),
    '1Q': generateHistory(basePrices.ORCL, 63, 0.022),
  },
  SAP: {
    '1D': generateIntraday(basePrices.SAP),
    '7D': generateHistory(basePrices.SAP, 7, 0.015),
    '1Q': generateHistory(basePrices.SAP, 63, 0.02),
  },
  CRM: {
    '1D': generateIntraday(basePrices.CRM),
    '7D': generateHistory(basePrices.CRM, 7, 0.02),
    '1Q': generateHistory(basePrices.CRM, 63, 0.025),
  },
};

export const mockProfiles: Record<string, CompanyProfile> = {
  IBM: {
    symbol: 'IBM',
    shortName: 'IBM',
    longName: 'International Business Machines Corporation',
    sector: 'Technology',
    industry: 'Information Technology Services',
    website: 'https://www.ibm.com',
    currency: 'USD',
    exchange: 'NYSE',
  },
  MSFT: {
    symbol: 'MSFT',
    shortName: 'Microsoft',
    longName: 'Microsoft Corporation',
    sector: 'Technology',
    industry: 'Software—Infrastructure',
    website: 'https://www.microsoft.com',
    currency: 'USD',
    exchange: 'NASDAQ',
  },
  ORCL: {
    symbol: 'ORCL',
    shortName: 'Oracle',
    longName: 'Oracle Corporation',
    sector: 'Technology',
    industry: 'Software—Infrastructure',
    website: 'https://www.oracle.com',
    currency: 'USD',
    exchange: 'NYSE',
  },
  SAP: {
    symbol: 'SAP',
    shortName: 'SAP',
    longName: 'SAP SE',
    sector: 'Technology',
    industry: 'Software—Application',
    website: 'https://www.sap.com',
    currency: 'USD',
    exchange: 'NYSE',
  },
  CRM: {
    symbol: 'CRM',
    shortName: 'Salesforce',
    longName: 'Salesforce, Inc.',
    sector: 'Technology',
    industry: 'Software—Application',
    website: 'https://www.salesforce.com',
    currency: 'USD',
    exchange: 'NYSE',
  },
};
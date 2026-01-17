
export enum Currency {
  USD = 'USD',
  JPY = 'JPY',
  EUR = 'EUR',
  GBP = 'GBP',
  HKD = 'HKD'
}

export enum SecurityType {
  STOCK = 'STOCK',
  ETF = 'ETF',
  BOND = 'BOND',
  CRYPTO = 'CRYPTO',
  CASH = 'CASH'
}

export enum OrgRole {
  OWNER = 'OWNER',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER'
}

export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
  DIVIDEND = 'DIVIDEND', // Cash dividend
  SPLIT = 'SPLIT',
  ADJUST = 'ADJUST' // System auto-correction (e.g. from CSV sync)
}

export interface Security {
  id: string;
  ticker: string;
  name: string;
  type: SecurityType;
  sector: string;
  industry: string;
  country: string;
  currency: Currency;
  currentPrice: number;
  lastUpdated: string;
}

export interface CsvMappingConfig {
  tickerColumn: string;
  quantityColumn: string;
  costColumn?: string;
}

export interface Account {
  id: string;
  orgId: string;
  name: string;
  broker: string;
  currency: Currency;
  isTaxAdvantaged: boolean; // e.g. NISA
  csvMapping?: CsvMappingConfig;
}

export interface Transaction {
  id: string;
  accountId: string;
  securityId: string;
  type: TransactionType;
  quantity: number; // Positive for BUY/ADJUST+, Negative for SELL/ADJUST-
  price: number; // Unit price at execution
  date: string;
  note?: string;
}

// Holding is now a derived state, not a source of truth
export interface Holding {
  id: string; // Composite key usually
  accountId: string;
  securityId: string;
  quantity: number;
  costBasis: number; // Weighted Average Cost
  updatedAt: string;
}

export interface EnrichedHolding extends Holding {
  security: Security;
  account: Account;
  marketValueLocal: number;
  marketValueBase: number;
  gainLossPercent: number;
  weight: number; // Percentage of total portfolio
  recentTransactions?: Transaction[]; // For UI preview
}

export interface Organization {
  id: string;
  name: string;
  baseCurrency: Currency;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Member {
  id: string;
  userId: string;
  orgId: string;
  name: string;
  email: string;
  role: OrgRole;
  joinedAt: string;
}

export interface RiskMetric {
  score: number; // 0-100, higher is riskier
  concentrationHigh: boolean; // > 10% in one asset
  topConcentrationTicker: string;
  sectorConcentration: { sector: string; percent: number }[];
  currencyExposure: { currency: Currency; percent: number }[];
  countryExposure: { country: string; percent: number }[];
  warnings: string[];
}

// --- Settings Types ---

export interface RiskThresholdConfig {
  concentrationLimit: number; // e.g. 0.15
  sectorLimit: number; // e.g. 0.35
  minCashWeight: number; // e.g. 0.05
}

export interface AppPreferences {
  isPrivacyMode: boolean; // Hide absolute numbers
  colorMode: 'standard' | 'cny'; // standard (Green up), cny (Red up)
}

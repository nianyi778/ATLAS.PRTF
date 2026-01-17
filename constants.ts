import { Currency } from './types';

export const APP_NAME = "Atlas Portfolio";
export const VERSION = "v1.0-MVP";

export const FX_RATES: Record<string, number> = {
  // Base: USD
  'USD-USD': 1,
  'JPY-USD': 0.0067, // 1 USD = ~150 JPY
  'EUR-USD': 1.08,
  'GBP-USD': 1.26,
  'HKD-USD': 0.13,
  
  // Base: JPY
  'USD-JPY': 150.0,
  'JPY-JPY': 1,
  'EUR-JPY': 162.5,
  'GBP-JPY': 189.2,
  'HKD-JPY': 19.2,
};

// Thresholds
export const RISK_THRESHOLDS = {
  CONCENTRATION_WARNING: 0.15, // 15% in single asset
  SECTOR_WARNING: 0.35, // 35% in single sector
};

export const MOCK_USER_ID = "u_12345";

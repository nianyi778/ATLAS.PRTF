
import { 
  Account, 
  Currency, 
  EnrichedHolding, 
  Holding, 
  Organization, 
  OrgRole, 
  RiskMetric, 
  Security, 
  SecurityType,
  Member,
  RiskThresholdConfig,
  Transaction,
  TransactionType
} from '../types';
import { FX_RATES, RISK_THRESHOLDS as DEFAULT_THRESHOLDS } from '../constants';

// --- MOCK DATABASE ---

// Mutable State for Settings
let CURRENT_RISK_THRESHOLDS: RiskThresholdConfig = {
  concentrationLimit: DEFAULT_THRESHOLDS.CONCENTRATION_WARNING,
  sectorLimit: DEFAULT_THRESHOLDS.SECTOR_WARNING,
  minCashWeight: 0.05
};

const MOCK_ORGS: Organization[] = [
  { id: 'org_1', name: '阿尔法家族信托', baseCurrency: Currency.USD },
  { id: 'org_2', name: '个人交易账户', baseCurrency: Currency.JPY },
];

let MOCK_ACCOUNTS: Account[] = [
  { 
    id: 'acc_1', orgId: 'org_1', name: 'IBKR 保证金账户', broker: 'Interactive Brokers', currency: Currency.USD, isTaxAdvantaged: false,
    csvMapping: { tickerColumn: 'Symbol', quantityColumn: 'Position', costColumn: 'AvgPrice' }
  },
  { 
    id: 'acc_2', orgId: 'org_1', name: 'Chase 支票账户', broker: 'Chase', currency: Currency.USD, isTaxAdvantaged: false,
    csvMapping: { tickerColumn: 'Ticker', quantityColumn: 'Qty', costColumn: 'Cost Basis' } 
  },
  { id: 'acc_3', orgId: 'org_2', name: '乐天 NISA', broker: 'Rakuten Sec', currency: Currency.JPY, isTaxAdvantaged: true },
];

const MOCK_MEMBERS: Member[] = [
  { id: 'mem_1', userId: 'u_1', orgId: 'org_1', name: 'John Smith', email: 'john@example.com', role: OrgRole.OWNER, joinedAt: '2023-01-01' },
  { id: 'mem_2', userId: 'u_2', orgId: 'org_1', name: 'Alice Smith', email: 'alice@example.com', role: OrgRole.VIEWER, joinedAt: '2023-02-15' },
];

// Mutable Securities
const MOCK_SECURITIES: Record<string, Security> = {
  'sec_nvda': { id: 'sec_nvda', ticker: 'NVDA', name: '英伟达 (NVIDIA Corp)', type: SecurityType.STOCK, sector: '科技', industry: '半导体', country: '美国', currency: Currency.USD, currentPrice: 880.50, lastUpdated: '2024-03-15' },
  'sec_msft': { id: 'sec_msft', ticker: 'MSFT', name: '微软 (Microsoft Corp)', type: SecurityType.STOCK, sector: '科技', industry: '软件服务', country: '美国', currency: Currency.USD, currentPrice: 415.20, lastUpdated: '2024-03-15' },
  'sec_spy': { id: 'sec_spy', ticker: 'SPY', name: 'SPDR 标普500 ETF', type: SecurityType.ETF, sector: '综合/指数', industry: '指数基金', country: '美国', currency: Currency.USD, currentPrice: 510.30, lastUpdated: '2024-03-15' },
  'sec_toyota': { id: 'sec_toyota', ticker: '7203.T', name: '丰田汽车 (Toyota Motor)', type: SecurityType.STOCK, sector: '非必需消费', industry: '汽车制造', country: '日本', currency: Currency.JPY, currentPrice: 3550, lastUpdated: '2024-03-15' },
  'sec_cash_usd': { id: 'sec_cash_usd', ticker: 'USD.CASH', name: '美元现金', type: SecurityType.CASH, sector: '现金', industry: '法定货币', country: '美国', currency: Currency.USD, currentPrice: 1, lastUpdated: '2024-03-15' },
};

// --- TRANSACTION LEDGER (Source of Truth) ---
// Initial seed data to match previous state
const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'tx_1', accountId: 'acc_1', securityId: 'sec_nvda', type: TransactionType.BUY, quantity: 100, price: 400.00, date: '2023-11-10' },
  { id: 'tx_2', accountId: 'acc_1', securityId: 'sec_nvda', type: TransactionType.BUY, quantity: 50, price: 550.00, date: '2024-01-10' }, // Avg cost will be ~450
  { id: 'tx_3', accountId: 'acc_1', securityId: 'sec_msft', type: TransactionType.BUY, quantity: 50, price: 380.00, date: '2024-02-15' },
  { id: 'tx_4', accountId: 'acc_1', securityId: 'sec_spy', type: TransactionType.BUY, quantity: 200, price: 480.00, date: '2024-03-01' },
  { id: 'tx_5', accountId: 'acc_2', securityId: 'sec_cash_usd', type: TransactionType.ADJUST, quantity: 25000, price: 1, date: '2024-03-14' },
  { id: 'tx_6', accountId: 'acc_3', securityId: 'sec_toyota', type: TransactionType.BUY, quantity: 1000, price: 2800, date: '2024-01-20' },
  // ADDED: Overlapping transaction to demonstrate Aggregated View logic
  // Buying NVDA in a different account (acc_2 Chase)
  { id: 'tx_7', accountId: 'acc_2', securityId: 'sec_nvda', type: TransactionType.BUY, quantity: 20, price: 890.00, date: '2024-03-20' },
];

// --- CORE ENGINE: CALCULATE HOLDINGS FROM TRANSACTIONS ---

const calculateRawHoldings = (transactions: Transaction[]): Holding[] => {
  const holdingMap = new Map<string, { qty: number; totalCost: number; lastUpdate: string }>();

  // Process transactions chronologically (simplified here as mock data is simple)
  // In a real app, sort by date first.
  
  transactions.forEach(tx => {
    const key = `${tx.accountId}-${tx.securityId}`;
    
    if (!holdingMap.has(key)) {
      holdingMap.set(key, { qty: 0, totalCost: 0, lastUpdate: tx.date });
    }
    const record = holdingMap.get(key)!;

    if (tx.type === TransactionType.BUY || (tx.type === TransactionType.ADJUST && tx.quantity > 0)) {
      record.qty += tx.quantity;
      record.totalCost += (tx.quantity * tx.price);
    } 
    else if (tx.type === TransactionType.SELL || (tx.type === TransactionType.ADJUST && tx.quantity < 0)) {
      // FIFO or Average Cost Logic? 
      // For MVP, using Average Cost. Reducing quantity reduces cost proportional to avg cost.
      const currentAvgCost = record.qty !== 0 ? record.totalCost / record.qty : 0;
      const absQty = Math.abs(tx.quantity);
      
      record.qty -= absQty;
      record.totalCost -= (absQty * currentAvgCost);
    }
    
    if (tx.date > record.lastUpdate) {
      record.lastUpdate = tx.date;
    }
  });

  const holdings: Holding[] = [];
  holdingMap.forEach((val, key) => {
    // Filter out closed positions (qty ~ 0)
    if (Math.abs(val.qty) > 0.0001) {
      const [accountId, securityId] = key.split('-');
      holdings.push({
        id: `h_${key}`,
        accountId,
        securityId,
        quantity: val.qty,
        costBasis: val.totalCost / val.qty,
        updatedAt: val.lastUpdate
      });
    }
  });

  return holdings;
};


// --- SERVICE METHODS ---

export const getOrganizations = async (): Promise<Organization[]> => {
  return new Promise(resolve => setTimeout(() => resolve(MOCK_ORGS), 300));
};

export const getAccounts = async (orgId: string): Promise<Account[]> => {
  return MOCK_ACCOUNTS.filter(a => a.orgId === orgId);
};

export const getMembers = async (orgId: string): Promise<Member[]> => {
  return MOCK_MEMBERS.filter(m => m.orgId === orgId);
};

export const getRiskThresholds = async (): Promise<RiskThresholdConfig> => {
  return { ...CURRENT_RISK_THRESHOLDS };
};

export const getAggregatedHoldings = async (orgId: string, baseCurrency: Currency): Promise<EnrichedHolding[]> => {
  const accounts = await getAccounts(orgId);
  const accountIds = new Set(accounts.map(a => a.id));
  
  // 1. Get raw holdings derived from transactions
  const relevantTransactions = MOCK_TRANSACTIONS.filter(tx => accountIds.has(tx.accountId));
  const rawHoldings = calculateRawHoldings(relevantTransactions);
  
  let totalPortfolioValueBase = 0;

  const enriched: EnrichedHolding[] = rawHoldings.map(h => {
    const security = MOCK_SECURITIES[h.securityId];
    const account = MOCK_ACCOUNTS.find(a => a.id === h.accountId)!;
    
    const marketValueLocal = h.quantity * security.currentPrice;
    
    // FX Conversion Logic
    const pair = `${security.currency}-${baseCurrency}`;
    const rate = FX_RATES[pair] || 1; 
    const marketValueBase = marketValueLocal * rate;

    totalPortfolioValueBase += marketValueBase;

    // Gain/Loss Logic
    const costBasisLocal = h.costBasis * h.quantity;
    const gainLossPercent = costBasisLocal !== 0 
      ? ((marketValueLocal - costBasisLocal) / costBasisLocal) * 100 
      : 0;

    // Get recent transactions for UI
    const recentTx = relevantTransactions
      .filter(tx => tx.securityId === h.securityId && tx.accountId === h.accountId)
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return {
      ...h,
      security,
      account,
      marketValueLocal,
      marketValueBase,
      gainLossPercent,
      weight: 0, // Will calc after total is known
      recentTransactions: recentTx
    };
  });

  // Second pass for weights
  return enriched.map(h => ({
    ...h,
    weight: totalPortfolioValueBase > 0 ? (h.marketValueBase / totalPortfolioValueBase) : 0
  })).sort((a, b) => b.marketValueBase - a.marketValueBase);
};

export const calculateRiskMetrics = (holdings: EnrichedHolding[]): RiskMetric => {
  const warnings: string[] = [];
  let score = 10; // Base risk score (low is safe)

  // 1. Concentration Risk
  const topHolding = holdings[0];
  const concentrationHigh = topHolding && topHolding.weight > CURRENT_RISK_THRESHOLDS.concentrationLimit;
  
  if (concentrationHigh) {
    score += 30;
    warnings.push(`持仓过度集中于 ${topHolding.security.ticker} (>${(CURRENT_RISK_THRESHOLDS.concentrationLimit * 100).toFixed(0)}%)`);
  }

  // 2. Sector Exposure
  const sectorMap = new Map<string, number>();
  holdings.forEach(h => {
    const s = h.security.sector;
    sectorMap.set(s, (sectorMap.get(s) || 0) + h.weight);
  });

  const sectorConcentration = Array.from(sectorMap.entries())
    .map(([sector, percent]) => ({ sector, percent }))
    .sort((a, b) => b.percent - a.percent);

  if (sectorConcentration.length > 0 && sectorConcentration[0].percent > CURRENT_RISK_THRESHOLDS.sectorLimit) {
    score += 20;
    warnings.push(`${sectorConcentration[0].sector} 行业敞口过高 (>${(CURRENT_RISK_THRESHOLDS.sectorLimit * 100).toFixed(0)}%)`);
  }

  // 3. Currency/Country Exposure
  const currencyMap = new Map<Currency, number>();
  const countryMap = new Map<string, number>();
  
  holdings.forEach(h => {
    const cur = h.security.currency;
    const cou = h.security.country;
    currencyMap.set(cur, (currencyMap.get(cur) || 0) + h.weight);
    countryMap.set(cou, (countryMap.get(cou) || 0) + h.weight);
  });

  const currencyExposure = Array.from(currencyMap.entries()).map(([currency, percent]) => ({ currency, percent }));
  const countryExposure = Array.from(countryMap.entries()).map(([country, percent]) => ({ country, percent }));

  // Cap score
  score = Math.min(score, 100);

  return {
    score,
    concentrationHigh: !!concentrationHigh,
    topConcentrationTicker: topHolding ? topHolding.security.ticker : '无',
    sectorConcentration,
    currencyExposure,
    countryExposure,
    warnings
  };
};

export const getUserRole = (orgId: string): OrgRole => {
  return orgId === 'org_1' ? OrgRole.OWNER : OrgRole.VIEWER;
};

// --- SETTINGS MUTATIONS ---

export const updateOrgSettings = async (orgId: string, updates: Partial<Organization>): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const org = MOCK_ORGS.find(o => o.id === orgId);
  if (org) {
    Object.assign(org, updates);
  }
};

export const updateAccountSettings = async (accountId: string, updates: Partial<Account>): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const acc = MOCK_ACCOUNTS.find(a => a.id === accountId);
  if (acc) {
    Object.assign(acc, updates);
  }
};

export const updateRiskThresholds = async (config: RiskThresholdConfig): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  CURRENT_RISK_THRESHOLDS = config;
};

// --- TRANSACTION LOGIC ---

export interface ManualHoldingInput {
  ticker: string;
  accountId: string;
  quantity: number;
  costBasis: number; // For transactions, this is Execution Price
  currency?: Currency;
  type?: TransactionType; // New field
  date?: string; // New field
}

export const addManualHolding = async (input: ManualHoldingInput): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 400));

  const ticker = input.ticker.trim().toUpperCase();
  
  // 1. Find or Create Security
  let securityId = Object.keys(MOCK_SECURITIES).find(k => MOCK_SECURITIES[k].ticker === ticker);

  if (!securityId) {
    securityId = `sec_${ticker.toLowerCase().replace(/\W/g, '')}_${Date.now()}`;
    MOCK_SECURITIES[securityId] = {
      id: securityId,
      ticker: ticker,
      name: ticker,
      type: SecurityType.STOCK,
      sector: '其他',
      industry: '未知',
      country: '全球',
      currency: input.currency || Currency.USD,
      currentPrice: input.costBasis, // Assume bought at approx market price
      lastUpdated: new Date().toISOString().split('T')[0]
    };
  }

  // 2. Add Transaction (instead of Holding directly)
  const type = input.type || TransactionType.BUY;
  const quantity = type === TransactionType.SELL ? -Math.abs(input.quantity) : Math.abs(input.quantity);

  MOCK_TRANSACTIONS.push({
    id: `tx_man_${Date.now()}`,
    accountId: input.accountId,
    securityId: securityId,
    type: type,
    quantity: quantity,
    price: input.costBasis,
    date: input.date || new Date().toISOString().split('T')[0]
  });
};

// --- CSV SNAPSHOT SYNC (Diff Logic) ---

export const uploadHoldingsCsv = async (orgId: string, csvContent: string, targetAccountId: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 1000)); // Longer delay for "Analysis"

  const lines = csvContent.split('\n');
  if (lines.length < 2) return;

  // 1. Determine Headers based on Account Config
  const rawHeaders = lines[0].split(',').map(h => h.trim());
  const lowerHeaders = rawHeaders.map(h => h.toLowerCase());
  
  const accounts = await getAccounts(orgId);
  const targetAccount = accounts.find(a => a.id === targetAccountId);
  
  if (!targetAccount) throw new Error("目标账户不存在");

  let tickerIdx = -1;
  let qtyIdx = -1;
  let costIdx = -1;

  if (targetAccount.csvMapping) {
    // Use configured mapping (case-insensitive search)
    tickerIdx = lowerHeaders.findIndex(h => h === targetAccount.csvMapping!.tickerColumn.toLowerCase());
    qtyIdx = lowerHeaders.findIndex(h => h === targetAccount.csvMapping!.quantityColumn.toLowerCase());
    if (targetAccount.csvMapping.costColumn) {
        costIdx = lowerHeaders.findIndex(h => h === targetAccount.csvMapping.costColumn.toLowerCase());
    }
  } else {
    // Intelligent Fallback
    tickerIdx = lowerHeaders.findIndex(h => ['ticker', 'symbol', '代码', '证券代码'].includes(h));
    qtyIdx = lowerHeaders.findIndex(h => ['quantity', 'qty', 'shares', 'position', '数量', '持仓'].includes(h));
    costIdx = lowerHeaders.findIndex(h => ['cost basis', 'avg cost', 'avg price', 'cost', '成本', '均价'].includes(h));
  }
  
  if (tickerIdx === -1 || qtyIdx === -1) {
    throw new Error(`CSV 格式错误：未找到代码或数量列。当前账户配置: ${targetAccount.csvMapping ? JSON.stringify(targetAccount.csvMapping) : '默认智能推断'}`);
  }

  const getVal = (row: string[], idx: number) => idx !== -1 ? row[idx]?.trim() : null;

  // 2. Calculate Current State (Pre-Sync) for the TARGET ACCOUNT
  const currentHoldings = calculateRawHoldings(MOCK_TRANSACTIONS.filter(tx => tx.accountId === targetAccountId));
  const today = new Date().toISOString().split('T')[0];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const row = line.split(','); // Simple split, doesn't handle quoted CSVs perfectly in MVP
    
    const ticker = getVal(row, tickerIdx);
    const qtyStr = getVal(row, qtyIdx);
    const costStr = getVal(row, costIdx);
    
    if (!ticker || !qtyStr) continue;
    
    const csvQty = parseFloat(qtyStr);
    if (isNaN(csvQty)) continue;

    // Find Security ID
    let securityId = Object.keys(MOCK_SECURITIES).find(k => MOCK_SECURITIES[k].ticker === ticker.toUpperCase());
    
    if (!securityId) {
      // Create security if new
      securityId = `sec_${ticker.toLowerCase().replace(/\W/g, '')}_${Date.now()}`;
      
      // Try to find currency if possible, otherwise default
      // In MVP, we might need manual fix later or infer from account currency
      MOCK_SECURITIES[securityId] = {
        id: securityId,
        ticker: ticker.toUpperCase(),
        name: ticker.toUpperCase(),
        type: SecurityType.STOCK, 
        sector: '其他',
        industry: '未知',
        country: '全球',
        currency: targetAccount.currency, // Default to account currency
        currentPrice: 100, // Dummy price until fetch
        lastUpdated: today
      };
    }

    // 3. Diff Logic
    const existingHolding = currentHoldings.find(h => h.securityId === securityId);
    const dbQty = existingHolding ? existingHolding.quantity : 0;
    const diff = csvQty - dbQty;

    // Cost logic: If CSV has cost, we might want to adjust. 
    // For MVP simplicity: If new holding, use CSV cost. If existing, we trust internal ledger usually, 
    // unless we decide CSV is the "Source of Truth" for Cost too. 
    // Let's assume CSV cost is used for the *difference* or fallback.
    const txPrice = costStr ? parseFloat(costStr) : (existingHolding ? existingHolding.costBasis : 0);

    if (Math.abs(diff) > 0.0001) {
      MOCK_TRANSACTIONS.push({
        id: `tx_sync_${Date.now()}_${i}`,
        accountId: targetAccountId, 
        securityId: securityId,
        type: TransactionType.ADJUST,
        quantity: diff,
        price: isNaN(txPrice) ? 0 : txPrice,
        date: today,
        note: `CSV Snapshot Sync: Diff ${diff}`
      });
    }
  }
};

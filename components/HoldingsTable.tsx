
import React, { useState, useMemo } from 'react';
import { EnrichedHolding, OrgRole, Organization, AppPreferences, TransactionType } from '../types';
import { ArrowUpRight, ArrowDownRight, Layers, List, History, ChevronRight, ChevronDown, AlertTriangle, ScrollText } from 'lucide-react';

interface HoldingsTableProps {
  holdings: EnrichedHolding[];
  organization: Organization;
  userRole: OrgRole;
  preferences?: AppPreferences;
}

export const HoldingsTable: React.FC<HoldingsTableProps> = ({ holdings, organization, userRole, preferences = { isPrivacyMode: false, colorMode: 'standard' } }) => {
  const [viewMode, setViewMode] = useState<'account' | 'security'>('account');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  const isViewer = userRole === OrgRole.VIEWER;
  const isOwner = userRole === OrgRole.OWNER;
  const isPrivacyMode = preferences.isPrivacyMode;
  const isCnyMode = preferences.colorMode === 'cny';

  // Helper for colors
  const getTrendColor = (val: number) => {
    if (val === 0) return 'text-atlas-text-secondary bg-white/5';
    if (val > 0) return isCnyMode ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400';
    return isCnyMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400';
  };

  const getTrendIcon = (val: number) => {
     if (val >= 0) return <ArrowUpRight className="w-3 h-3 mr-1"/>;
     return <ArrowDownRight className="w-3 h-3 mr-1"/>;
  };

  const fmtCurrency = (val: number, cur: string) => {
    if (isPrivacyMode) return '****';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(val);
  }

  // Grouping Logic for "Security View"
  const displayHoldings = useMemo(() => {
    if (viewMode === 'account') return holdings;

    // Use a more complex type to track account names during aggregation
    // We need to group by Security ID
    const grouped = new Map<string, any>();
    
    holdings.forEach(h => {
       const key = h.security.id;
       if (!grouped.has(key)) {
          grouped.set(key, { 
              ...h, 
              id: `agg_${key}`,
              quantity: 0,
              marketValueBase: 0,
              marketValueLocal: 0,
              costBasisTotalLocal: 0,
              _accounts: [] as string[]
          });
       }
       const agg = grouped.get(key);
       agg.quantity += h.quantity;
       agg.marketValueBase += h.marketValueBase;
       agg.marketValueLocal += h.marketValueLocal;
       agg.costBasisTotalLocal += (h.costBasis * h.quantity);
       agg._accounts.push(h.account.name);
    });

    return Array.from(grouped.values()).map(agg => {
        // Recalculate averages
        const costBasisAvg = agg.quantity !== 0 ? agg.costBasisTotalLocal / agg.quantity : 0;
        const gainLossPercent = agg.costBasisTotalLocal !== 0 
            ? ((agg.marketValueLocal - agg.costBasisTotalLocal) / agg.costBasisTotalLocal) * 100 
            : 0;
        
        return {
            ...agg,
            costBasis: costBasisAvg,
            gainLossPercent,
            // Override account prop for display
            account: { name: `${[...new Set(agg._accounts)].length} Accounts` } 
        };
    }).sort((a, b) => b.marketValueBase - a.marketValueBase);
  }, [holdings, viewMode]);

  const toggleExpand = (id: string) => {
      if (expandedRow === id) setExpandedRow(null);
      else setExpandedRow(id);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 p-1">
        <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
           <button 
             onClick={() => { setViewMode('account'); setExpandedRow(null); }}
             className={`flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'account' ? 'bg-atlas-accent text-white shadow-md' : 'text-atlas-text-secondary hover:text-white'}`}
           >
             <List className="w-3.5 h-3.5 mr-2" />
             账户视角
           </button>
           <button 
             onClick={() => { setViewMode('security'); setExpandedRow(null); }}
             className={`flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'security' ? 'bg-atlas-accent text-white shadow-md' : 'text-atlas-text-secondary hover:text-white'}`}
           >
             <Layers className="w-3.5 h-3.5 mr-2" />
             标的聚合
           </button>
        </div>
        
        {/* Legend / Info */}
        <div className="text-[10px] text-atlas-text-secondary flex items-center space-x-3">
            <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-atlas-accent mr-1"></div> 正常</span>
            <span className="flex items-center"><AlertTriangle className="w-3 h-3 text-amber-500 mr-1" /> 需检查 (价格异常)</span>
        </div>
      </div>

      {/* Table Card */}
      <div className="glass-panel rounded-xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-black/40 text-atlas-text-secondary border-b border-white/5">
              <tr>
                <th className="w-8 px-4 py-3"></th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">资产 (Asset)</th>
                {viewMode === 'account' && <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">账户 (Account)</th>}
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider text-right">数量 (Qty)</th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider text-right">价格 (Price/Cost)</th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider text-right">市值 ({organization.baseCurrency})</th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider text-right">盈亏 (Unrealized)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {displayHoldings.map((h) => {
                 // Dirty Data Check
                 const isPriceMissing = h.security.currentPrice === 0 || h.security.currentPrice === 100; // 100 is our mock fallback, detecting it here for demo
                 const isDirty = isPriceMissing; 

                 return (
                 <React.Fragment key={h.id}>
                 <tr 
                   className={`table-row-hover transition-colors group cursor-pointer ${expandedRow === h.id ? 'bg-white/5' : ''}`}
                   onClick={() => toggleExpand(h.id)}
                 >
                   <td className="px-4 py-3 text-center">
                       <button className="p-1 hover:bg-white/10 rounded text-atlas-text-secondary transition-transform">
                           {expandedRow === h.id ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
                       </button>
                   </td>
                   <td className="px-6 py-4">
                     <div className="flex items-center space-x-3">
                       <div className="w-9 h-9 rounded bg-white/5 flex items-center justify-center text-xs font-bold text-atlas-text-secondary border border-white/5">
                         {h.security.ticker.substring(0, 2)}
                       </div>
                       <div>
                         <div className="font-mono text-white font-medium flex items-center">
                            {h.security.ticker}
                            {isDirty && (
                                <div className="ml-2 text-amber-500 group relative">
                                    <AlertTriangle className="w-3.5 h-3.5 cursor-help" />
                                    {/* Tooltip */}
                                    <div className="absolute left-full ml-2 bottom-0 w-max max-w-[200px] bg-black border border-amber-500/30 p-2 rounded text-[10px] text-amber-200 hidden group-hover:block z-50">
                                        价格数据可能异常或缺失
                                    </div>
                                </div>
                            )}
                         </div>
                         <div className="text-[10px] text-atlas-text-secondary max-w-[150px] truncate">{h.security.name}</div>
                       </div>
                     </div>
                   </td>
                   
                   {viewMode === 'account' && (
                       <td className="px-6 py-4">
                         <div className="text-sm text-white">{h.account.name}</div>
                         <div className="text-[10px] text-atlas-text-secondary bg-white/5 inline-block px-1.5 py-0.5 rounded mt-1 border border-white/5">
                            {h.account.currency}
                         </div>
                       </td>
                   )}

                   <td className="px-6 py-4 text-right font-mono text-atlas-text-secondary">
                      {h.quantity.toLocaleString()}
                   </td>

                   <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                         <span className={`text-sm font-mono ${isDirty ? 'text-amber-500' : 'text-white'}`}>
                            {h.security.currentPrice.toFixed(2)}
                         </span>
                         <span className="text-[10px] text-atlas-text-secondary font-mono">
                            Cost: {h.costBasis.toFixed(2)}
                         </span>
                      </div>
                   </td>

                   <td className={`px-6 py-4 text-right font-mono font-medium text-white ${isPrivacyMode ? 'blur-sm select-none' : ''}`}>
                      {fmtCurrency(h.marketValueBase, organization.baseCurrency)}
                   </td>

                   <td className={`px-6 py-4 text-right ${isPrivacyMode ? 'blur-sm select-none' : ''}`}>
                      <div className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium font-mono border border-transparent ${getTrendColor(h.gainLossPercent)}`}>
                         {getTrendIcon(h.gainLossPercent)}
                         {Math.abs(h.gainLossPercent).toFixed(2)}%
                      </div>
                   </td>
                 </tr>
                 
                 {/* EXPANDED CONTENT AREA */}
                 {expandedRow === h.id && (
                     <tr className="bg-white/[0.02]">
                         <td colSpan={viewMode === 'account' ? 7 : 6} className="px-0 py-0">
                             <div className="p-4 pl-16 border-b border-white/5 animate-in slide-in-from-top-2 fade-in duration-200">
                                 
                                 {/* 1. Transaction History (Account View) */}
                                 {viewMode === 'account' && (
                                     <>
                                        <div className="flex items-center text-[10px] text-atlas-text-secondary uppercase tracking-wider mb-3 font-semibold">
                                            <ScrollText className="w-3 h-3 mr-1.5" />
                                            近期交易流水 (Transaction History)
                                        </div>
                                        {h.recentTransactions && h.recentTransactions.length > 0 ? (
                                            <table className="w-full text-xs text-left">
                                                <thead className="text-atlas-text-muted border-b border-white/5">
                                                    <tr>
                                                        <th className="py-2">日期</th>
                                                        <th className="py-2">类型</th>
                                                        <th className="py-2 text-right">数量</th>
                                                        <th className="py-2 text-right">执行价格</th>
                                                        <th className="py-2 text-right">总额</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {h.recentTransactions.map(tx => (
                                                        <tr key={tx.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                                            <td className="py-2 font-mono text-atlas-text-secondary">{tx.date}</td>
                                                            <td className="py-2">
                                                                <span className={`px-1.5 py-0.5 rounded text-[10px] border ${
                                                                    tx.type === TransactionType.BUY ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                                    tx.type === TransactionType.SELL ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                                    'bg-white/10 text-atlas-text-secondary border-white/10'
                                                                }`}>
                                                                    {tx.type}
                                                                </span>
                                                            </td>
                                                            <td className="py-2 text-right font-mono">{tx.quantity > 0 ? '+' : ''}{tx.quantity}</td>
                                                            <td className="py-2 text-right font-mono">{tx.price.toFixed(2)}</td>
                                                            <td className={`py-2 text-right font-mono text-white ${isPrivacyMode ? 'blur-sm' : ''}`}>
                                                                {(Math.abs(tx.quantity) * tx.price).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="text-xs text-atlas-text-muted italic py-2">暂无近期交易记录</div>
                                        )}
                                     </>
                                 )}

                                 {/* 2. Account Breakdown (Security View) */}
                                 {viewMode === 'security' && (
                                     <>
                                        <div className="text-[10px] text-atlas-text-secondary uppercase tracking-wider mb-2 font-semibold">
                                            账户分布详情 (Breakdown)
                                        </div>
                                        <table className="w-full text-xs">
                                            <thead className="text-atlas-text-muted border-b border-white/5">
                                                <tr>
                                                    <th className="py-2 text-left">账户</th>
                                                    <th className="py-2 text-right">数量</th>
                                                    <th className="py-2 text-right">成本</th>
                                                    <th className="py-2 text-right">市值 (Base)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {holdings.filter(sub => sub.security.ticker === h.security.ticker).map(sub => (
                                                    <tr key={sub.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                                                        <td className="py-2 text-atlas-text-secondary">{sub.account.name}</td>
                                                        <td className="py-2 text-right font-mono">{sub.quantity.toLocaleString()}</td>
                                                        <td className="py-2 text-right font-mono">{sub.costBasis.toFixed(2)}</td>
                                                        <td className={`py-2 text-right font-mono text-white ${isPrivacyMode ? 'blur-sm' : ''}`}>
                                                            {fmtCurrency(sub.marketValueBase, organization.baseCurrency)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                     </>
                                 )}
                             </div>
                         </td>
                     </tr>
                 )}
                 </React.Fragment>
                 );
              })}
              
              {displayHoldings.length === 0 && (
                  <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-atlas-text-muted">
                          <div className="flex flex-col items-center">
                              <History className="w-8 h-8 mb-2 opacity-50" />
                              <p>暂无持仓数据</p>
                              {userRole === OrgRole.OWNER && <p className="text-xs mt-1">请添加交易或导入 CSV</p>}
                          </div>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

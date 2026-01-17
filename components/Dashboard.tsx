
import React from 'react';
import { EnrichedHolding, RiskMetric, Currency, Organization } from '../types';
import { TrendingUp, TrendingDown, AlertCircle, ShieldCheck, DollarSign, Activity } from 'lucide-react';

interface DashboardProps {
  holdings: EnrichedHolding[];
  riskMetrics: RiskMetric;
  organization: Organization;
  isPrivacyMode: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ holdings, riskMetrics, organization, isPrivacyMode }) => {
  
  const totalValue = holdings.reduce((sum, h) => sum + h.marketValueBase, 0);
  
  const fmt = (n: number) => {
    if (isPrivacyMode) return '****';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: organization.baseCurrency,
      maximumFractionDigits: 0 
    }).format(n);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl">
      {/* Top Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Assets Card - Hero */}
        <div className="relative group overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-atlas-panel to-black shadow-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-24 h-24 text-atlas-accent" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-50"></div>
          
          <div className="relative p-6 flex flex-col h-full justify-between">
            <div>
              <h3 className="text-atlas-text-secondary text-xs uppercase tracking-widest font-semibold mb-1">总资产规模 (AUM)</h3>
              <div className={`text-3xl lg:text-4xl font-mono text-white font-medium tracking-tight mt-2 ${isPrivacyMode ? 'blur-sm select-none' : ''}`}>
                {fmt(totalValue)}
              </div>
            </div>
            <div className="mt-6 flex items-center text-xs text-atlas-text-secondary">
               <span className="inline-flex items-center px-2 py-0.5 rounded text-emerald-400 bg-emerald-400/10 mr-2 border border-emerald-400/20">
                 <Activity className="w-3 h-3 mr-1" /> 实时
               </span>
               共 {holdings.length} 个持仓
            </div>
          </div>
        </div>

        {/* Risk Score Card */}
        <div className="glass-panel rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group">
           {/* Dynamic Background Glow */}
           <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-[60px] opacity-20 transition-colors duration-700 ${
              riskMetrics.score > 50 ? 'bg-amber-500' : 'bg-emerald-500'
           }`}></div>

           <div className="flex items-center justify-between mb-4 relative z-10">
             <h3 className="text-atlas-text-secondary text-xs uppercase tracking-widest font-semibold">风险指数</h3>
             {riskMetrics.score > 50 ? (
                <AlertCircle className="w-5 h-5 text-atlas-warning" />
             ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
             )}
           </div>
           
           <div className="relative z-10">
             <div className="flex items-baseline space-x-2">
                <span className={`text-4xl font-mono font-semibold tracking-tighter ${
                  riskMetrics.score > 70 ? 'text-atlas-danger' : 
                  riskMetrics.score > 40 ? 'text-atlas-warning' : 'text-emerald-400'
                }`}>
                  {riskMetrics.score}
                </span>
                <span className="text-sm text-atlas-text-muted">/ 100</span>
             </div>
             
             <div className="mt-4 w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor] ${
                    riskMetrics.score > 70 ? 'bg-atlas-danger text-atlas-danger' : 
                    riskMetrics.score > 40 ? 'bg-atlas-warning text-atlas-warning' : 'bg-emerald-400 text-emerald-400'
                  }`} 
                  style={{ width: `${riskMetrics.score}%` }}
                />
             </div>
             <p className="mt-2 text-[10px] text-atlas-text-secondary uppercase tracking-wide">
               {riskMetrics.score > 50 ? '需关注' : '安全范围内'}
             </p>
           </div>
        </div>

        {/* Top Concentration */}
        <div className="glass-panel rounded-xl p-6 flex flex-col justify-between relative">
          <div className="flex items-center justify-between mb-2">
             <h3 className="text-atlas-text-secondary text-xs uppercase tracking-widest font-semibold">最大敞口</h3>
             <TrendingUp className="w-4 h-4 text-atlas-text-secondary" />
          </div>
          
          <div className="flex-1 flex flex-col justify-center">
             <div className="flex items-center justify-between">
                <div>
                   <div className="text-2xl font-mono text-white font-medium tracking-tight">
                     {riskMetrics.topConcentrationTicker}
                   </div>
                   <div className="text-xs text-atlas-text-secondary mt-1">集中度</div>
                </div>
                {holdings.length > 0 && (
                  <div className="text-right">
                     <div className={`text-2xl font-mono font-medium tracking-tight ${holdings[0].weight > 0.15 ? 'text-atlas-warning' : 'text-atlas-accent'}`}>
                       {((holdings[0].weight) * 100).toFixed(1)}%
                     </div>
                     <div className="text-xs text-atlas-text-secondary mt-1">占投资组合</div>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Warnings Section */}
      {riskMetrics.warnings.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-amber-500 text-sm font-medium mb-1">风险阈值预警</h4>
            <ul className="space-y-1">
              {riskMetrics.warnings.map((w, idx) => (
                <li key={idx} className="text-xs text-amber-200/70 font-mono flex items-center">
                  <span className="w-1 h-1 bg-amber-500 rounded-full mr-2"></span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Top Holdings Table - Modernized */}
      <div className="glass-panel rounded-xl overflow-hidden border border-white/5">
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h3 className="text-sm font-medium text-white tracking-wide">核心持仓</h3>
          <button className="text-xs text-atlas-accent hover:text-blue-400 transition-colors">查看全部</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/20 text-atlas-text-secondary">
              <tr>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">资产</th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">板块</th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider text-right">权重</th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider text-right">市值</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {holdings.slice(0, 5).map((h) => (
                <tr key={h.id} className="table-row-hover transition-colors group">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-[10px] font-bold text-atlas-text-secondary group-hover:bg-atlas-accent group-hover:text-white transition-colors">
                        {h.security.ticker.substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-mono text-white font-medium">{h.security.ticker}</div>
                        <div className="text-[10px] text-atlas-text-secondary hidden sm:block">{h.security.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-atlas-text-secondary text-xs">
                    <span className="px-2 py-1 rounded-full bg-white/5 border border-white/5">
                      {h.security.sector}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end space-x-2">
                       <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-atlas-accent" style={{ width: `${h.weight * 100}%`}}></div>
                       </div>
                       <span className="font-mono text-xs">{(h.weight * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className={`px-6 py-3.5 text-right font-mono text-white font-medium ${isPrivacyMode ? 'blur-sm select-none' : ''}`}>
                    {fmt(h.marketValueBase)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

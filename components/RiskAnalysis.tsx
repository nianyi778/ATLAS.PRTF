
import React, { useState, useMemo } from 'react';
import { EnrichedHolding, RiskMetric } from '../types';
import { Activity, RefreshCcw, TrendingDown } from 'lucide-react';
import { D3BarChart, D3SunburstChart } from './ui/D3Charts';

interface RiskAnalysisProps {
  holdings: EnrichedHolding[];
  riskMetrics: RiskMetric;
}

export const RiskAnalysis: React.FC<RiskAnalysisProps> = ({ holdings, riskMetrics }) => {
  // Stress Test State
  const [fxShock, setFxShock] = useState(0); // -20% to +20%
  const [marketShock, setMarketShock] = useState(0); // -50% to 0%

  // Prepare Data for Sunburst (Currency -> Sector -> Ticker)
  // This aligns with Module B: "Sunburst Chart, outer ring is ticker, inner is market/currency"
  const sunburstData = useMemo(() => {
    const root = { name: "Portfolio", children: [] as any[] };
    
    // Group by Currency
    const currencyGroups = new Map<string, EnrichedHolding[]>();
    holdings.forEach(h => {
        const cur = h.security.currency;
        if (!currencyGroups.has(cur)) currencyGroups.set(cur, []);
        currencyGroups.get(cur)?.push(h);
    });

    currencyGroups.forEach((currencyHoldings, currency) => {
        const curNode = { name: currency, children: [] as any[] };
        
        // Group by Sector within Currency
        const sectorGroups = new Map<string, EnrichedHolding[]>();
        currencyHoldings.forEach(h => {
            const sec = h.security.sector;
            if (!sectorGroups.has(sec)) sectorGroups.set(sec, []);
            sectorGroups.get(sec)?.push(h);
        });

        sectorGroups.forEach((sectorHoldings, sector) => {
            const secNode = { name: sector, children: [] as any[] };
            
            // Add Tickers
            sectorHoldings.forEach(h => {
                secNode.children.push({
                    name: h.security.ticker,
                    value: h.marketValueBase
                });
            });
            curNode.children.push(secNode);
        });
        root.children.push(curNode);
    });

    return root;
  }, [holdings]);

  const sectorData = riskMetrics.sectorConcentration.map(s => ({
    name: s.sector,
    value: s.percent * 100
  }));

  const concentrationData = holdings.slice(0, 10).map(h => ({
    name: h.security.ticker,
    value: h.weight * 100,
    color: h.weight > 0.15 ? '#ef4444' : '#3b82f6' // Custom color logic passed to data
  }));

  // Calculate Stress Test Impact
  const totalValue = holdings.reduce((sum, h) => sum + h.marketValueBase, 0);
  const stressedValue = totalValue * (1 + marketShock / 100) * (1 + fxShock / 100);
  const lossValue = totalValue - stressedValue;

  return (
    <div className="space-y-6 h-full animate-fade-in max-w-6xl pb-10">
      
      {/* Stress Test Simulator */}
      <div className="rounded-xl border border-white/10 bg-gradient-to-br from-black to-[#18181b] p-6 shadow-xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-5">
            <Activity className="w-32 h-32 text-white" />
         </div>

         <div className="flex items-center space-x-3 mb-6 relative z-10">
            <div className="p-2 bg-atlas-accent/10 rounded-lg text-atlas-accent">
               <TrendingDown className="w-5 h-5" />
            </div>
            <div>
               <h3 className="text-lg font-bold text-white">压力测试模拟器 (Stress Test)</h3>
               <p className="text-xs text-atlas-text-secondary">模拟极端市场条件下投资组合的表现。</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {/* Controls */}
            <div className="col-span-2 space-y-6">
               <div>
                  <div className="flex justify-between mb-2">
                     <label className="text-sm font-medium text-white">市场广泛回撤 (Market Drawdown)</label>
                     <span className="text-sm font-mono text-red-400">{marketShock}%</span>
                  </div>
                  <input 
                     type="range" min="-50" max="0" step="1" 
                     value={marketShock} 
                     onChange={(e) => setMarketShock(parseInt(e.target.value))}
                     className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                  <div className="flex justify-between mt-1 text-[10px] text-atlas-text-secondary">
                     <span>-50% (崩盘)</span>
                     <span>0% (当前)</span>
                  </div>
               </div>

               <div>
                  <div className="flex justify-between mb-2">
                     <label className="text-sm font-medium text-white">汇率波动冲击 (FX Shock)</label>
                     <span className={`text-sm font-mono ${fxShock < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {fxShock > 0 ? '+' : ''}{fxShock}%
                     </span>
                  </div>
                  <input 
                     type="range" min="-20" max="20" step="1" 
                     value={fxShock} 
                     onChange={(e) => setFxShock(parseInt(e.target.value))}
                     className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between mt-1 text-[10px] text-atlas-text-secondary">
                     <span>-20% (贬值)</span>
                     <span>+20% (升值)</span>
                  </div>
               </div>
            </div>

            {/* Result */}
            <div className="bg-black/30 rounded-lg border border-white/5 p-4 flex flex-col justify-center items-center text-center">
               <div className="text-xs text-atlas-text-secondary uppercase tracking-widest mb-2">预计资产缩水</div>
               <div className="text-3xl font-mono font-bold text-white mb-1">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(stressedValue)}
               </div>
               <div className={`text-sm font-medium flex items-center ${lossValue > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {lossValue > 0 ? '-' : '+'}{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.abs(lossValue))}
                  <span className="ml-1 text-xs opacity-70">
                     ({((stressedValue - totalValue) / totalValue * 100).toFixed(1)}%)
                  </span>
               </div>
               <button 
                  onClick={() => { setFxShock(0); setMarketShock(0); }}
                  className="mt-4 text-xs text-atlas-text-secondary flex items-center hover:text-white"
               >
                  <RefreshCcw className="w-3 h-3 mr-1" /> 重置模拟
               </button>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Currency & Sector Exposure - Sunburst */}
        <div className="glass-panel rounded-xl p-6 min-h-[400px] flex flex-col border border-white/5 relative">
          <h3 className="text-sm font-semibold text-white tracking-wide mb-2 flex items-center">
             <span className="w-1 h-4 bg-emerald-500 rounded-full mr-2"></span>
             多维资产暴露 (Exposure Sunburst)
          </h3>
          <p className="text-xs text-atlas-text-secondary mb-4">
             层级: 货币 (内) → 行业 → 具体标的 (外)
          </p>
          <div className="flex-grow flex flex-col items-center justify-center">
             <D3SunburstChart data={sunburstData} height={350} />
          </div>
        </div>

        {/* Sector Allocation - Horizontal Bar Chart */}
        <div className="glass-panel rounded-xl p-6 min-h-[400px] flex flex-col border border-white/5">
          <h3 className="text-sm font-semibold text-white tracking-wide mb-6 flex items-center">
            <span className="w-1 h-4 bg-atlas-accent rounded-full mr-2"></span>
            行业板块配置 (Sector Allocation)
          </h3>
          <div className="flex-grow">
            <D3BarChart 
                data={sectorData} 
                horizontal={true} 
                height={320} 
                formatValue={(v) => `${v.toFixed(1)}%`}
            />
          </div>
        </div>

        {/* Concentration Analysis - Vertical Bar Chart */}
        <div className="glass-panel rounded-xl p-6 min-h-[350px] lg:col-span-2 flex flex-col border border-white/5">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-sm font-semibold text-white tracking-wide flex items-center">
                <span className="w-1 h-4 bg-amber-500 rounded-full mr-2"></span>
                资产集中度 (Asset Concentration)
             </h3>
             <span className="text-[10px] text-atlas-text-secondary uppercase border border-white/10 px-2 py-1 rounded-md">前十大持仓</span>
           </div>
           
           <div className="flex-grow">
             <D3BarChart 
                data={concentrationData} 
                horizontal={false} 
                height={280} 
                threshold={15}
                formatValue={(v) => `${v.toFixed(1)}%`}
             />
           </div>
           <p className="text-xs text-atlas-text-muted mt-4 text-center">
             * 红色柱状条表示超过 15% 集中度安全阈值的持仓。
           </p>
        </div>
      </div>
    </div>
  );
};

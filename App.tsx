
import React, { useEffect, useState, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { HoldingsTable } from './components/HoldingsTable';
import { RiskAnalysis } from './components/RiskAnalysis';
import { CsvUploader } from './components/CsvUploader';
import { AddHoldingModal } from './components/AddHoldingModal';
import { SettingsView } from './components/SettingsView';
import { SettingsDrawer } from './components/SettingsDrawer';
import { 
  getOrganizations, 
  getAccounts,
  getAggregatedHoldings, 
  calculateRiskMetrics, 
  getUserRole,
  uploadHoldingsCsv,
  addManualHolding,
  getMembers,
  ManualHoldingInput
} from './services/mockDataService';
import { EnrichedHolding, Organization, RiskMetric, OrgRole, Account, Member, AppPreferences } from './types';
import { APP_NAME } from './constants';
import { Plus } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'holdings' | 'risk'>('dashboard');
  
  // Data State
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string>('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [holdings, setHoldings] = useState<EnrichedHolding[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetric | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<OrgRole>(OrgRole.VIEWER);

  // App Global State
  const [preferences, setPreferences] = useState<AppPreferences>({
    isPrivacyMode: false,
    colorMode: 'standard'
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Initial Load
  useEffect(() => {
    const init = async () => {
      const orgs = await getOrganizations();
      setOrganizations(orgs);
      if (orgs.length > 0) {
        setCurrentOrgId(orgs[0].id);
      }
    };
    init();
  }, []);

  // Global Hotkey Listener for Privacy Mode (H key)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle Privacy Mode with 'h' or 'H', ignoring if user is typing in an input
      if (
        (event.key === 'h' || event.key === 'H') && 
        !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
      ) {
        setPreferences(prev => ({ ...prev, isPrivacyMode: !prev.isPrivacyMode }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchData = useCallback(async () => {
    if (!currentOrgId || organizations.length === 0) return;
    
    setLoading(true);
    // Re-fetch org to get updated settings (e.g. currency change)
    const orgs = await getOrganizations();
    setOrganizations(orgs);
    const org = orgs.find(o => o.id === currentOrgId);
    if (!org) return;

    const userRole = getUserRole(currentOrgId);
    setRole(userRole);

    // Fetch related data
    const orgAccounts = await getAccounts(currentOrgId);
    setAccounts(orgAccounts);

    const orgMembers = await getMembers(currentOrgId);
    setMembers(orgMembers);

    const data = await getAggregatedHoldings(currentOrgId, org.baseCurrency);
    const metrics = calculateRiskMetrics(data);
    
    setHoldings(data);
    setRiskMetrics(metrics);
    setLoading(false);
  }, [currentOrgId]); 

  // Fetch Data when Org Changes
  useEffect(() => {
    fetchData();
  }, [currentOrgId]);

  const handleCsvUpload = async (data: { content: string, accountId: string }) => {
    if (!currentOrgId) return;
    await uploadHoldingsCsv(currentOrgId, data.content, data.accountId);
    await fetchData(); // Refresh data
  };

  const handleManualAdd = async (input: ManualHoldingInput) => {
     await addManualHolding(input);
     await fetchData(); // Refresh data
  };

  const currentOrg = organizations.find(o => o.id === currentOrgId);

  if (loading && holdings.length === 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-atlas-bg text-atlas-text-secondary">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-atlas-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="font-mono text-sm tracking-widest">正在初始化 {APP_NAME}...</p>
        </div>
      </div>
    );
  }
  
  // Safe fallback
  if (!currentOrg) return null;

  return (
    <>
      <Layout
        activeTab={activeTab as any}
        setActiveTab={setActiveTab as any}
        organizations={organizations}
        currentOrgId={currentOrgId}
        onSelectOrg={setCurrentOrgId}
        userRole={role}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isSettingsOpen={isSettingsOpen}
        isPrivacyMode={preferences.isPrivacyMode}
        onTogglePrivacy={() => setPreferences(p => ({ ...p, isPrivacyMode: !p.isPrivacyMode }))}
      >
        <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
          <div className="flex justify-between items-end mb-6 flex-shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-white uppercase tracking-tight">
                {activeTab === 'dashboard' && '市场概览'}
                {activeTab === 'holdings' && '持仓明细'}
                {activeTab === 'risk' && '风险分析'}
              </h2>
              <p className="text-sm text-atlas-text-secondary font-mono mt-1">
                基础货币: <span className="text-atlas-accent">{currentOrg.baseCurrency}</span>
              </p>
            </div>
            
            {/* Actions Area */}
            <div className="flex items-center space-x-3">
                {/* Hotkey Hint */}
                <div className="hidden lg:flex items-center text-[10px] text-atlas-text-secondary bg-white/5 px-2 py-1 rounded border border-white/5 mr-2">
                   <kbd className="font-mono bg-white/10 px-1 rounded mr-1">H</kbd> 隐私模式
                </div>

                {activeTab === 'holdings' && role === OrgRole.OWNER && (
                  <>
                    <button 
                      onClick={() => setIsAddModalOpen(true)}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-atlas-accent hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-blue-500/20"
                    >
                      <Plus className="w-4 h-4" />
                      <span>添加持仓</span>
                    </button>
                    <CsvUploader accounts={accounts} onUpload={handleCsvUpload} />
                  </>
                )}
            </div>
          </div>

          <div className="flex-1 min-h-0">
            {activeTab === 'dashboard' && (
              <Dashboard 
                holdings={holdings} 
                riskMetrics={riskMetrics || {
                  score: 0, 
                  concentrationHigh: false, 
                  topConcentrationTicker: '', 
                  sectorConcentration: [], 
                  currencyExposure: [], 
                  countryExposure: [], 
                  warnings: []
                }} 
                organization={currentOrg} 
                isPrivacyMode={preferences.isPrivacyMode}
              />
            )}

            {activeTab === 'holdings' && (
              <HoldingsTable 
                holdings={holdings} 
                organization={currentOrg} 
                userRole={role} 
                preferences={preferences}
              />
            )}

            {activeTab === 'risk' && riskMetrics && (
              <RiskAnalysis 
                holdings={holdings} 
                riskMetrics={riskMetrics} 
              />
            )}
          </div>
        </div>

        <AddHoldingModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleManualAdd}
          accounts={accounts}
        />
      </Layout>

      <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}>
        <SettingsView 
          organization={currentOrg}
          accounts={accounts}
          members={members}
          preferences={preferences}
          userRole={role}
          onRefreshData={fetchData}
          onUpdatePreferences={(p) => setPreferences(prev => ({ ...prev, ...p }))}
        />
      </SettingsDrawer>
    </>
  );
};

export default App;

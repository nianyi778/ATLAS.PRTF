
import React from 'react';
import { 
  LayoutDashboard, 
  PieChart, 
  Table2, 
  Settings, 
  Menu, 
  X,
  Eye,
  EyeOff,
  ShieldAlert
} from 'lucide-react';
import { OrgSelector } from './OrgSelector';
import { Organization, OrgRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'holdings' | 'risk' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'holdings' | 'risk' | 'settings') => void;
  organizations: Organization[];
  currentOrgId: string;
  onSelectOrg: (id: string) => void;
  userRole: OrgRole;
  onOpenSettings: () => void;
  isSettingsOpen: boolean;
  isPrivacyMode: boolean;
  onTogglePrivacy: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, setActiveTab, organizations, currentOrgId, onSelectOrg, userRole,
  onOpenSettings, isSettingsOpen, isPrivacyMode, onTogglePrivacy
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const NavItem = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => (
    <button
      onClick={() => {
        if (id === 'settings') {
          onOpenSettings();
        } else {
          setActiveTab(id as any);
        }
        setMobileMenuOpen(false);
      }}
      className={`group flex items-center space-x-3 w-full px-4 py-2.5 rounded-lg transition-all duration-200 ease-in-out ${
        activeTab === id && id !== 'settings'
          ? 'bg-atlas-accent/10 text-white shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-atlas-accent/20' 
          : 'text-atlas-text-secondary hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon className={`w-5 h-5 transition-colors ${activeTab === id && id !== 'settings' ? 'text-atlas-accent' : 'text-atlas-text-secondary group-hover:text-white'}`} />
      <span className="font-medium text-sm tracking-wide">{label}</span>
    </button>
  );

  // The scaling and blur effect for the main content when settings is open
  const mainContentStyle = isSettingsOpen 
    ? "scale-[0.98] opacity-50 blur-[2px] pointer-events-none" 
    : "scale-100 opacity-100 blur-0";

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-black">
      
      {/* Wrapper for the transition effect */}
      <div className={`flex flex-1 h-full overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${mainContentStyle}`}>
        
        {/* Sidebar (Desktop) - Glass Panel */}
        <aside className="hidden md:flex flex-col w-72 glass-panel border-r-0 border-r-white/10 relative z-20">
          <div className="p-6 pb-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-atlas-accent to-blue-700 rounded-lg shadow-lg flex items-center justify-center">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                   <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                   <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                   <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                 </svg>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">ATLAS<span className="text-atlas-text-secondary font-light">.PRTF</span></h1>
            </div>
          </div>
          
          <div className="px-4 mb-6">
            <div className="text-[10px] text-atlas-text-secondary uppercase font-bold tracking-wider mb-3 px-2">工作区 (Workspace)</div>
            <OrgSelector 
              organizations={organizations} 
              currentOrgId={currentOrgId} 
              onSelect={onSelectOrg} 
            />
          </div>

          <nav className="flex-1 px-4 space-y-1.5">
            <div className="text-[10px] text-atlas-text-secondary uppercase font-bold tracking-wider mb-3 px-2 mt-6">数据分析</div>
            <NavItem id="dashboard" label="市场概览" icon={LayoutDashboard} />
            <NavItem id="holdings" label="持仓明细" icon={Table2} />
            <NavItem id="risk" label="风险引擎" icon={PieChart} />
          </nav>

          <div className="p-4 mt-auto">
            <div className="glass-card rounded-xl p-3 flex items-center space-x-2 border border-white/5 bg-black/20">
               <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-600 flex items-center justify-center text-xs font-mono text-white shadow-inner shrink-0">
                 JS
               </div>
               <div className="flex-1 min-w-0 pr-1">
                 <div className="text-sm font-medium text-white truncate">John Smith</div>
                 <div className="text-[10px] text-atlas-accent uppercase font-bold tracking-wide flex items-center">
                   {userRole}
                   <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                 </div>
               </div>
               
               {/* Privacy Toggle */}
               <button 
                 onClick={onTogglePrivacy}
                 className={`p-1.5 rounded-lg transition-colors hover:bg-white/5 ${isPrivacyMode ? 'text-atlas-accent bg-atlas-accent/10' : 'text-atlas-text-secondary hover:text-white'}`}
                 title={isPrivacyMode ? "关闭隐私模式 (H)" : "开启隐私模式 (H)"}
               >
                 {isPrivacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
               </button>

               <button 
                 onClick={onOpenSettings}
                 className={`p-1.5 rounded-lg transition-colors hover:bg-white/5 text-atlas-text-secondary hover:text-white`}
                 title="系统设定"
               >
                 <Settings className="w-4 h-4" />
               </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 bg-black/50">
          
          {/* Mobile Header */}
          <header className="md:hidden flex items-center justify-between p-4 glass-panel border-b border-white/10 z-20 shrink-0">
             <div className="flex items-center space-x-2">
               <div className="w-6 h-6 bg-atlas-accent rounded-md flex items-center justify-center">
                 <div className="w-2 h-2 bg-white rounded-full"></div>
               </div>
               <span className="font-bold text-lg tracking-tight">ATLAS</span>
             </div>
             <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1 rounded-md hover:bg-white/10 transition-colors">
               {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
             </button>
          </header>

          {/* Mobile Menu Overlay */}
          {mobileMenuOpen && (
            <div className="md:hidden fixed inset-0 top-[65px] bg-black/95 backdrop-blur-xl z-30 p-4 animate-fade-in flex flex-col">
               <div className="mb-8">
                  <OrgSelector 
                    organizations={organizations} 
                    currentOrgId={currentOrgId} 
                    onSelect={(id) => { onSelectOrg(id); setMobileMenuOpen(false); }} 
                  />
               </div>
               <nav className="space-y-3 flex-1">
                  <NavItem id="dashboard" label="市场概览" icon={LayoutDashboard} />
                  <NavItem id="holdings" label="持仓明细" icon={Table2} />
                  <NavItem id="risk" label="风险引擎" icon={PieChart} />
                  <NavItem id="settings" label="系统设定" icon={Settings} />
               </nav>
               
               <div className="mt-auto border-t border-white/10 pt-4 pb-6">
                 <button 
                   onClick={() => { onTogglePrivacy(); setMobileMenuOpen(false); }}
                   className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-atlas-text-secondary hover:text-white hover:bg-white/5"
                 >
                    {isPrivacyMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    <span className="font-medium text-sm">隐私模式: {isPrivacyMode ? '已开启' : '已关闭'}</span>
                 </button>
               </div>
            </div>
          )}

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-auto p-4 md:p-10 relative flex flex-col">
             {children}
          </div>

          {/* Fixed Compliance Footer */}
          <footer className="shrink-0 p-2 border-t border-white/5 bg-[#09090b] text-center z-20">
               <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white/[0.02] border border-white/5 space-x-2">
                  <ShieldAlert className="w-3 h-3 text-atlas-text-muted" />
                  <span className="text-[10px] text-atlas-text-secondary">
                    免责声明：本系统仅作为资产聚合与风险分析辅助工具，数据存在延迟，不构成任何投资建议。用户需对数据准确性及投资决策负责。
                  </span>
               </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

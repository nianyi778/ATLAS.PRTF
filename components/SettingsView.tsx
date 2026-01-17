
import React, { useState, useEffect } from 'react';
import { 
  User, Building2, Users, Database, Sliders, 
  Save, AlertCircle, Shield, Eye, EyeOff, CheckCircle2,
  Palette, ArrowUpRight, ArrowDownRight, FileSpreadsheet, X
} from 'lucide-react';
import { Organization, Account, Member, RiskThresholdConfig, Currency, OrgRole, AppPreferences, CsvMappingConfig } from '../types';
import { updateOrgSettings, updateAccountSettings, updateRiskThresholds, getRiskThresholds } from '../services/mockDataService';
import { Switch, Input, Slider } from './ui/Common';
import { Select } from './ui/Select';

interface SettingsViewProps {
  organization: Organization;
  accounts: Account[];
  members: Member[];
  preferences: AppPreferences;
  userRole: OrgRole;
  onRefreshData: () => void;
  onUpdatePreferences: (prefs: Partial<AppPreferences>) => void;
}

type SettingsTab = 'profile' | 'org' | 'members' | 'accounts' | 'preferences';

export const SettingsView: React.FC<SettingsViewProps> = ({
  organization,
  accounts,
  members,
  preferences,
  userRole,
  onRefreshData,
  onUpdatePreferences
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('org');
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const NavItem = ({ id, label, icon: Icon }: { id: SettingsTab, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-all text-sm font-medium ${
        activeTab === id 
          ? 'bg-atlas-accent/10 text-white border-l-2 border-atlas-accent' 
          : 'text-atlas-text-secondary hover:text-white hover:bg-white/5 border-l-2 border-transparent'
      }`}
    >
      <Icon className={`w-4 h-4 ${activeTab === id ? 'text-atlas-accent' : 'text-atlas-text-secondary'}`} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Left Sidebar - Navigation */}
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="rounded-xl p-2 bg-white/5 border border-white/5 sticky top-0">
          <div className="px-4 py-3 mb-2">
            <h3 className="text-xs font-bold text-atlas-text-secondary uppercase tracking-widest">设定导航</h3>
          </div>
          <div className="space-y-1">
            <NavItem id="profile" label="个人设置" icon={User} />
            <NavItem id="org" label="资产主体管理" icon={Building2} />
            <NavItem id="members" label="成员与权限" icon={Users} />
            <NavItem id="accounts" label="账户与数据源" icon={Database} />
            <NavItem id="preferences" label="偏好与风险配置" icon={Sliders} />
          </div>
        </div>
      </div>

      {/* Right Content */}
      <div className="flex-1 min-w-0">
        <div className="rounded-xl border border-white/5 bg-black/20 p-8 relative min-h-[500px]">
          
          {notification && (
            <div className={`absolute top-4 right-4 px-4 py-2 rounded-lg text-sm flex items-center shadow-xl animate-in fade-in slide-in-from-top-2 z-20 ${
              notification.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 mr-2"/> : <AlertCircle className="w-4 h-4 mr-2"/>}
              {notification.msg}
            </div>
          )}

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {activeTab === 'profile' && <ProfileSettings />}
            {activeTab === 'org' && <OrgSettings org={organization} role={userRole} onSave={async (u) => { await updateOrgSettings(organization.id, u); onRefreshData(); showNotification('资产主体信息已更新'); }} />}
            {activeTab === 'members' && <MemberSettings members={members} role={userRole} />}
            {activeTab === 'accounts' && <AccountSettings accounts={accounts} role={userRole} onSave={async (id, u) => { await updateAccountSettings(id, u); onRefreshData(); showNotification('账户设置已更新'); }} />}
            {activeTab === 'preferences' && <PreferencesSettings preferences={preferences} onUpdatePreferences={onUpdatePreferences} role={userRole} onRiskSave={async (cfg) => { await updateRiskThresholds(cfg); onRefreshData(); showNotification('风险参数已更新'); }} />}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SUB COMPONENTS ---

const ProfileSettings: React.FC = () => (
  <div className="space-y-6 max-w-2xl">
    <div>
      <h2 className="text-xl font-bold text-white mb-1">个人设置</h2>
      <p className="text-sm text-atlas-text-secondary">管理您的登录凭证与安全选项。</p>
    </div>
    
    <div className="p-6 rounded-lg bg-black/20 border border-white/5 space-y-4">
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-atlas-accent to-purple-600 flex items-center justify-center text-xl font-bold text-white">JS</div>
        <div>
          <h3 className="text-white font-medium">John Smith</h3>
          <p className="text-sm text-atlas-text-secondary">john@example.com</p>
        </div>
      </div>
    </div>

    <div className="grid gap-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-white uppercase tracking-wider">安全中心</h3>
        <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5">
           <div>
             <div className="text-sm font-medium text-white">两步验证 (MFA)</div>
             <div className="text-xs text-atlas-text-secondary">保护您的资产数据安全，建议开启。</div>
           </div>
           <button className="px-3 py-1.5 text-xs font-medium text-atlas-accent bg-atlas-accent/10 rounded border border-atlas-accent/20">启用</button>
        </div>
      </div>
    </div>
  </div>
);

const OrgSettings: React.FC<{ org: Organization, role: OrgRole, onSave: (updates: Partial<Organization>) => Promise<void> }> = ({ org, role, onSave }) => {
  const [name, setName] = useState(org.name);
  const [currency, setCurrency] = useState(org.baseCurrency);
  const isOwner = role === OrgRole.OWNER;

  const currencyOptions = Object.values(Currency).map(c => ({ value: c, label: c }));

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">资产主体管理</h2>
        <p className="text-sm text-atlas-text-secondary">定义资产组合的边界与基础货币。</p>
      </div>

      <div className="space-y-4">
        <Input 
          label="主体名称"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={!isOwner}
        />

        <div className="space-y-1.5">
          <Select 
            label="基准货币 (Base Currency)"
            value={currency}
            onChange={(val) => setCurrency(val as Currency)}
            options={currencyOptions}
          />
          <p className="text-xs text-amber-500/80 mt-1 flex items-center">
            <AlertCircle className="w-3 h-3 mr-1" />
            修改基准货币将触发全系统历史数据重算。
          </p>
        </div>

        {isOwner && (
          <div className="pt-4">
            <button 
              onClick={() => onSave({ name, baseCurrency: currency })}
              className="flex items-center space-x-2 px-4 py-2 bg-atlas-accent hover:bg-blue-600 text-white rounded-lg transition-all shadow-lg shadow-blue-500/20"
            >
              <Save className="w-4 h-4" />
              <span>保存更改</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const MemberSettings: React.FC<{ members: Member[], role: OrgRole }> = ({ members, role }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-start">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">成员与权限</h2>
        <p className="text-sm text-atlas-text-secondary">管理团队协作与数据访问级别。</p>
      </div>
      {role === OrgRole.OWNER && (
        <button className="px-3 py-1.5 text-sm font-medium text-white bg-atlas-accent hover:bg-blue-600 rounded-lg transition-colors">
          + 邀请成员
        </button>
      )}
    </div>

    <div className="overflow-hidden rounded-lg border border-white/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/5 text-atlas-text-secondary">
          <tr>
            <th className="px-4 py-3 font-medium">成员</th>
            <th className="px-4 py-3 font-medium">角色</th>
            <th className="px-4 py-3 font-medium text-right">加入时间</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {members.map(m => (
             <tr key={m.id}>
               <td className="px-4 py-3">
                 <div className="flex items-center space-x-3">
                   <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                     {m.name.substring(0, 2).toUpperCase()}
                   </div>
                   <div>
                     <div className="text-white font-medium">{m.name}</div>
                     <div className="text-xs text-atlas-text-secondary">{m.email}</div>
                   </div>
                 </div>
               </td>
               <td className="px-4 py-3">
                 <span className={`inline-flex px-2 py-0.5 rounded text-xs border ${
                   m.role === OrgRole.OWNER ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                   m.role === OrgRole.EDITOR ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                   'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                 }`}>
                   {m.role}
                 </span>
               </td>
               <td className="px-4 py-3 text-right text-atlas-text-secondary font-mono text-xs">
                 {m.joinedAt}
               </td>
             </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// --- CSV Mapping Modal ---
const CsvMappingModal: React.FC<{ 
  account: Account; 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (config: CsvMappingConfig) => Promise<void>; 
}> = ({ account, isOpen, onClose, onSave }) => {
  const [tickerCol, setTickerCol] = useState(account.csvMapping?.tickerColumn || 'Ticker');
  const [qtyCol, setQtyCol] = useState(account.csvMapping?.quantityColumn || 'Quantity');
  const [costCol, setCostCol] = useState(account.csvMapping?.costColumn || 'Cost Basis');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
       <div className="relative w-full max-w-sm bg-[#18181b] border border-white/10 rounded-xl shadow-2xl p-6 animate-in fade-in duration-200">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold text-white flex items-center">
                <FileSpreadsheet className="w-5 h-5 mr-2 text-atlas-accent"/>
                CSV 列名映射配置
             </h3>
             <button onClick={onClose}><X className="w-5 h-5 text-atlas-text-secondary"/></button>
          </div>
          
          <div className="text-sm text-atlas-text-secondary mb-6">
             配置 <strong>{account.name}</strong> 导出文件的对应列名，以便系统正确识别数据。
          </div>

          <div className="space-y-4">
             <Input label="标的代码列 (Ticker/Symbol)" value={tickerCol} onChange={e => setTickerCol(e.target.value)} placeholder="e.g. Symbol" />
             <Input label="数量列 (Quantity/Qty)" value={qtyCol} onChange={e => setQtyCol(e.target.value)} placeholder="e.g. Qty" />
             <Input label="成本价列 (可选)" value={costCol} onChange={e => setCostCol(e.target.value)} placeholder="e.g. Cost Basis" />
          </div>

          <div className="flex justify-end mt-6">
             <button 
               onClick={() => {
                 onSave({ tickerColumn: tickerCol, quantityColumn: qtyCol, costColumn: costCol });
                 onClose();
               }}
               className="px-4 py-2 bg-atlas-accent text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
             >
               保存配置
             </button>
          </div>
       </div>
    </div>
  );
};

const AccountSettings: React.FC<{ accounts: Account[], role: OrgRole, onSave: (id: string, updates: Partial<Account>) => Promise<void> }> = ({ accounts, role, onSave }) => {
  const isEditor = role === OrgRole.OWNER || role === OrgRole.EDITOR;
  const [mappingModalAccount, setMappingModalAccount] = useState<Account | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">账户与数据源</h2>
        <p className="text-sm text-atlas-text-secondary">配置券商连接与账户属性。</p>
      </div>

      <div className="grid gap-4">
        {accounts.map(acc => (
          <div key={acc.id} className="p-4 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-white font-medium">{acc.name}</h3>
                <span className="text-xs text-atlas-text-secondary bg-black/30 px-1.5 py-0.5 rounded border border-white/10">{acc.currency}</span>
              </div>
              <div className="text-sm text-atlas-text-secondary mt-0.5">{acc.broker}</div>
              <div className="text-[10px] text-atlas-text-muted mt-2 font-mono">
                 CSV 映射: {acc.csvMapping ? '已配置' : '默认 (智能推断)'}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center cursor-pointer group">
                <Switch 
                  checked={acc.isTaxAdvantaged}
                  onCheckedChange={(c) => onSave(acc.id, { isTaxAdvantaged: c })}
                  disabled={!isEditor}
                />
                <span className="ml-2 text-xs font-medium text-atlas-text-secondary group-hover:text-white transition-colors">
                  免税账户
                </span>
              </label>

              <button 
                onClick={() => setMappingModalAccount(acc)}
                className="text-xs text-atlas-accent hover:underline flex items-center"
              >
                配置 CSV 映射
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {mappingModalAccount && (
        <CsvMappingModal 
           account={mappingModalAccount}
           isOpen={true}
           onClose={() => setMappingModalAccount(null)}
           onSave={async (mapping) => {
              await onSave(mappingModalAccount.id, { csvMapping: mapping });
              setMappingModalAccount(null);
           }}
        />
      )}
    </div>
  );
};

const PreferencesSettings: React.FC<{ 
  preferences: AppPreferences, 
  onUpdatePreferences: (p: Partial<AppPreferences>) => void,
  onRiskSave: (cfg: RiskThresholdConfig) => Promise<void>,
  role: OrgRole
}> = ({ preferences, onUpdatePreferences, onRiskSave, role }) => {
  const [thresholds, setThresholds] = useState<RiskThresholdConfig>({ concentrationLimit: 0.15, sectorLimit: 0.35, minCashWeight: 0.05 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRiskThresholds().then(t => {
      setThresholds(t);
      setLoading(false);
    });
  }, []);

  const handleRiskChange = (key: keyof RiskThresholdConfig, val: number) => {
    setThresholds(prev => ({ ...prev, [key]: val }));
  };

  if (loading) return <div className="text-sm text-atlas-text-secondary">加载配置中...</div>;

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Display Prefs */}
      <div>
        <h2 className="text-xl font-bold text-white mb-1">系统偏好</h2>
        <p className="text-sm text-atlas-text-secondary">自定义界面显示与交互体验。</p>
      </div>

      <div className="grid gap-4">
        {/* Privacy Mode */}
        <div className="space-y-4 p-5 rounded-lg border border-white/10 bg-black/20">
           <div className="flex items-center justify-between">
             <div className="flex items-center space-x-3">
               <div className="p-2 bg-white/5 rounded-lg">
                 {preferences.isPrivacyMode ? <EyeOff className="w-5 h-5 text-atlas-text-secondary" /> : <Eye className="w-5 h-5 text-atlas-text-secondary" />}
               </div>
               <div>
                 <div className="text-sm font-medium text-white">隐私模式 (Privacy Mode)</div>
                 <div className="text-xs text-atlas-text-secondary">在公共场合隐藏资产绝对数值。</div>
               </div>
             </div>
             <Switch 
                checked={preferences.isPrivacyMode}
                onCheckedChange={(c) => onUpdatePreferences({ isPrivacyMode: c })}
             />
           </div>
        </div>

        {/* Color Mode */}
        <div className="space-y-4 p-5 rounded-lg border border-white/10 bg-black/20">
           <div className="flex items-center justify-between">
             <div className="flex items-center space-x-3">
               <div className="p-2 bg-white/5 rounded-lg">
                 <Palette className="w-5 h-5 text-atlas-text-secondary" />
               </div>
               <div>
                 <div className="text-sm font-medium text-white">涨跌色系 (Color Mode)</div>
                 <div className="text-xs text-atlas-text-secondary">切换国际 (绿涨红跌) 或 亚太 (红涨绿跌) 标准。</div>
               </div>
             </div>
             <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                <button 
                  onClick={() => onUpdatePreferences({ colorMode: 'standard' })}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center space-x-2 ${preferences.colorMode === 'standard' ? 'bg-white/10 text-white shadow-sm' : 'text-atlas-text-secondary hover:text-white'}`}
                >
                   <span className="flex items-center"><ArrowUpRight className="w-3 h-3 text-emerald-500 mr-1"/> 绿涨</span>
                </button>
                <button 
                  onClick={() => onUpdatePreferences({ colorMode: 'cny' })}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center space-x-2 ${preferences.colorMode === 'cny' ? 'bg-white/10 text-white shadow-sm' : 'text-atlas-text-secondary hover:text-white'}`}
                >
                   <span className="flex items-center"><ArrowUpRight className="w-3 h-3 text-red-500 mr-1"/> 红涨</span>
                </button>
             </div>
           </div>
        </div>
      </div>

      <div className="h-px bg-white/10 w-full"></div>

      {/* Risk Config */}
      <div>
        <h2 className="text-xl font-bold text-white mb-1">风险算法配置</h2>
        <p className="text-sm text-atlas-text-secondary">定义风险引擎的敏感度阈值。</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between">
             <label className="text-sm font-medium text-white">单标的集中度报警阈值</label>
             <span className="text-sm font-mono text-atlas-accent">{(thresholds.concentrationLimit * 100).toFixed(0)}%</span>
          </div>
          <Slider 
             min={0.05} max={0.50} step={0.01}
             value={[thresholds.concentrationLimit]}
             onValueChange={(val) => handleRiskChange('concentrationLimit', val[0])}
             disabled={role !== OrgRole.OWNER}
          />
          <p className="text-xs text-atlas-text-muted">当单一持仓超过此比例时，系统将发出高风险警报。</p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
             <label className="text-sm font-medium text-white">行业板块报警阈值</label>
             <span className="text-sm font-mono text-atlas-accent">{(thresholds.sectorLimit * 100).toFixed(0)}%</span>
          </div>
          <Slider 
             min={0.10} max={0.80} step={0.05}
             value={[thresholds.sectorLimit]}
             onValueChange={(val) => handleRiskChange('sectorLimit', val[0])}
             disabled={role !== OrgRole.OWNER}
          />
        </div>

        {role === OrgRole.OWNER && (
          <div className="pt-2">
            <button 
              onClick={() => onRiskSave(thresholds)}
              className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10"
            >
              <Shield className="w-4 h-4" />
              <span>更新算法参数</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

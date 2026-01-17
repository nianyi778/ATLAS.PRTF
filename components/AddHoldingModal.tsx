
import React, { useState } from 'react';
import { X, Save, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Account, Currency, TransactionType } from '../types';
import { Input } from './ui/Common';
import { Select } from './ui/Select';
import { DatePicker } from './ui/DatePicker';

interface AddHoldingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { ticker: string; accountId: string; quantity: number; costBasis: number; currency: Currency; type: TransactionType; date: string }) => Promise<void>;
  accounts: Account[];
}

export const AddHoldingModal: React.FC<AddHoldingModalProps> = ({ isOpen, onClose, onSave, accounts }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.BUY);
  const [ticker, setTicker] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState(''); 
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState<Currency>(Currency.USD);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !accountId || !quantity || !price) return;

    setIsSubmitting(true);
    try {
      await onSave({
        ticker,
        accountId,
        quantity: parseFloat(quantity),
        costBasis: parseFloat(price),
        currency,
        type,
        date
      });
      // Reset form
      setTicker('');
      setQuantity('');
      setPrice('');
      setType(TransactionType.BUY);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prepare options for Select components
  const accountOptions = accounts.map(acc => ({
    value: acc.id,
    label: acc.name,
    subLabel: acc.currency
  }));

  const currencyOptions = Object.values(Currency).map(c => ({
    value: c,
    label: c
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      {/* Modal Content - REMOVED zoom-in-95 */}
      <div className="relative w-full max-w-md bg-[#18181b] border border-white/10 rounded-xl shadow-2xl animate-in fade-in duration-200">
        
        {/* Header - Added rounded-t-xl explicitly */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5 rounded-t-xl">
          <h3 className="text-lg font-medium text-white">记录新交易</h3>
          <button onClick={onClose} className="text-atlas-text-secondary hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Transaction Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-black/30 rounded-lg border border-white/10">
             <button
                type="button"
                onClick={() => setType(TransactionType.BUY)}
                className={`flex items-center justify-center space-x-2 py-2 rounded-md text-sm font-medium transition-all ${
                   type === TransactionType.BUY 
                   ? 'bg-emerald-500/20 text-emerald-400 shadow-sm border border-emerald-500/20' 
                   : 'text-atlas-text-secondary hover:text-white'
                }`}
             >
                <ArrowUpRight className="w-4 h-4" />
                <span>买入 (Buy)</span>
             </button>
             <button
                type="button"
                onClick={() => setType(TransactionType.SELL)}
                className={`flex items-center justify-center space-x-2 py-2 rounded-md text-sm font-medium transition-all ${
                   type === TransactionType.SELL 
                   ? 'bg-red-500/20 text-red-400 shadow-sm border border-red-500/20' 
                   : 'text-atlas-text-secondary hover:text-white'
                }`}
             >
                <ArrowDownRight className="w-4 h-4" />
                <span>卖出 (Sell)</span>
             </button>
          </div>

          <Input
            label="标的代码 (Ticker)"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="e.g. AAPL, BTC"
            required
          />

          <Select
            label="所属账户"
            options={accountOptions}
            value={accountId}
            onChange={setAccountId}
            placeholder="选择账户..."
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="交易数量"
              type="number"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.00"
              required
            />
            <Input
              label="成交单价"
              type="number"
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 relative z-10">
             <DatePicker 
               label="交易日期"
               value={date}
               onChange={setDate}
             />
             <Select
                label="计价货币"
                options={currencyOptions}
                value={currency}
                onChange={(val) => setCurrency(val as Currency)}
             />
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm text-atlas-text-secondary hover:text-white transition-colors"
            >
              取消
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-4 py-2 bg-atlas-accent hover:bg-blue-600 text-white rounded-lg transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>确认提交</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

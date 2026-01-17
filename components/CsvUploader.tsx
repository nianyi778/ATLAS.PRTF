
import React, { useRef, useState } from 'react';
import { Upload, Loader2, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Account } from '../types';
import { Select } from './ui/Select';

interface CsvUploaderProps {
  accounts: Account[];
  onUpload: (data: { content: string, accountId: string }) => Promise<void>;
}

export const CsvUploader: React.FC<CsvUploaderProps> = ({ accounts, onUpload }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        if (e.dataTransfer.files[0].type === "text/csv" || e.dataTransfer.files[0].name.endsWith('.csv')) {
            setSelectedFile(e.dataTransfer.files[0]);
            setError(null);
        } else {
            setError("请上传 .csv 格式的文件");
        }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedAccountId) return;

    setIsUploading(true);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        try {
          await onUpload({ content, accountId: selectedAccountId });
          setIsOpen(false);
          setSelectedFile(null); // Reset
        } catch (err: any) {
          console.error("Upload failed", err);
          setError(err.message || "上传失败，请检查文件格式");
        } finally {
          setIsUploading(false);
        }
      }
    };
    reader.onerror = () => {
        setError("文件读取失败");
        setIsUploading(false);
    };
    
    reader.readAsText(selectedFile);
  };

  const accountOptions = accounts.map(acc => ({
    value: acc.id,
    label: acc.name,
    subLabel: acc.currency
  }));

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-3 py-1.5 bg-atlas-accent/10 hover:bg-atlas-accent/20 text-atlas-accent rounded-lg transition-colors text-sm font-medium border border-atlas-accent/20"
      >
        <Upload className="w-4 h-4" />
        <span>导入 CSV</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           {/* Backdrop */}
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => !isUploading && setIsOpen(false)}></div>

           <div className="relative w-full max-w-md bg-[#18181b] border border-white/10 rounded-xl shadow-2xl animate-in fade-in duration-200">
              
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5 rounded-t-xl">
                 <h3 className="text-lg font-medium text-white flex items-center">
                    <Upload className="w-5 h-5 mr-2 text-atlas-accent" />
                    导入持仓快照
                 </h3>
                 <button onClick={() => setIsOpen(false)} disabled={isUploading} className="text-atlas-text-secondary hover:text-white transition-colors disabled:opacity-50">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                 
                 {/* 1. Account Selection */}
                 <div>
                    <Select 
                       label="选择目标账户"
                       options={accountOptions}
                       value={selectedAccountId}
                       onChange={setSelectedAccountId}
                    />
                    <p className="text-[10px] text-atlas-text-secondary mt-1.5">
                       * 系统将通过比对 CSV 数量与当前账户持仓，自动生成“调整 (ADJUST)”类型的交易流水。
                    </p>
                 </div>

                 {/* 2. File Drop Zone */}
                 <div 
                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all ${
                        selectedFile ? 'border-atlas-success/50 bg-atlas-success/5' : 'border-white/10 hover:border-atlas-accent/50 hover:bg-white/5'
                    }`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                 >
                    <input 
                       type="file" 
                       accept=".csv" 
                       ref={fileInputRef} 
                       className="hidden" 
                       onChange={handleFileChange}
                    />
                    
                    {selectedFile ? (
                        <div className="text-center">
                            <div className="w-12 h-12 bg-atlas-success/20 rounded-full flex items-center justify-center mx-auto mb-3 text-atlas-success">
                               <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <p className="text-white font-medium text-sm truncate max-w-[200px]">{selectedFile.name}</p>
                            <p className="text-xs text-atlas-text-secondary mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                            <button 
                               onClick={() => { setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                               className="text-xs text-atlas-danger hover:underline mt-3"
                            >
                               移除文件
                            </button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 text-atlas-text-secondary">
                               <FileText className="w-6 h-6" />
                            </div>
                            <p className="text-white font-medium text-sm">点击或拖拽上传 CSV</p>
                            <p className="text-xs text-atlas-text-secondary mt-1">支持格式: Ticker, Quantity, CostBasis (可选)</p>
                            <button 
                               onClick={() => fileInputRef.current?.click()}
                               className="mt-3 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-xs text-white transition-colors"
                            >
                               选择文件
                            </button>
                        </div>
                    )}
                 </div>

                 {error && (
                    <div className="flex items-center space-x-2 text-atlas-danger text-xs bg-atlas-danger/10 p-3 rounded-lg border border-atlas-danger/20">
                       <AlertCircle className="w-4 h-4 shrink-0" />
                       <span>{error}</span>
                    </div>
                 )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/5 bg-black/20 flex justify-end space-x-3 rounded-b-xl">
                 <button 
                    onClick={() => setIsOpen(false)}
                    disabled={isUploading}
                    className="px-4 py-2 text-sm text-atlas-text-secondary hover:text-white transition-colors disabled:opacity-50"
                 >
                    取消
                 </button>
                 <button 
                    onClick={handleUpload}
                    disabled={!selectedFile || !selectedAccountId || isUploading}
                    className="flex items-center space-x-2 px-4 py-2 bg-atlas-accent hover:bg-blue-600 text-white rounded-lg transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>开始导入</span>
                 </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

import { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  PieChart, 
  Calculator, 
  FileText, 
  Plus, 
  Trash2, 
  Settings, 
  TrendingUp, 
  DollarSign, 
  Flag, 
  Brain, 
  Sparkles, 
  X, 
  Printer, 
  RefreshCw, 
  Wallet,
  Download
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title,
  Filler
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { marked } from 'marked';

// 註冊 Chart.js 元件
ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler
);

// --- 型別定義 ---
type AssetType = 'tw' | 'us' | 'bond';
type Currency = 'twd' | 'usd';

interface PortfolioItem {
  id: number;
  type: AssetType;
  symbol: string;
  name: string;
  shares: number;
  price: number;
  currency: Currency;
}

interface Settings {
  totalGoal: number;
  targetDate: string;
  ratios: { tw: number; us: number; bond: number };
  geminiApiKey: string;
  fxRate: number;
  rebalanceThreshold: number;
  monthlyContribution: number;
}

interface SimParams {
  initial: number;
  monthly: number;
  rate: number;
  months: number;
}

// --- 預設資料 ---
const DEFAULT_SETTINGS: Settings = {
  totalGoal: 2000,
  targetDate: "2030-12-31",
  ratios: { tw: 40, us: 30, bond: 30 },
  geminiApiKey: "",
  fxRate: 32.5,
  rebalanceThreshold: 5,
  monthlyContribution: 5
};

const DEFAULT_PORTFOLIO: PortfolioItem[] = [
  { id: 1, type: 'tw', symbol: '0050', name: '元大台灣50', shares: 10000, price: 185, currency: 'twd' },
  { id: 2, type: 'us', symbol: 'VT', name: 'Vanguard Total', shares: 1000, price: 136, currency: 'usd' },
  { id: 3, type: 'bond', symbol: '00937B', name: '群益ESG投等債', shares: 200000, price: 15.8, currency: 'twd' }
];

const DEFAULT_SIM_PARAMS: SimParams = {
  initial: 20000000,
  monthly: 50000,
  rate: 7,
  months: 60
};

// --- 輔助函式 ---
const formatNumber = (num: number) => num.toLocaleString();
const parseNumber = (str: string) => {
  const val = parseFloat(str.replace(/,/g, ''));
  return isNaN(val) ? 0 : val;
};

// --- 優化後的數值輸入元件 (解決小數點問題) ---
const NumberInput = ({ 
  value, 
  onChange, 
  className = "" 
}: { 
  value: number, 
  onChange: (val: number) => void, 
  className?: string 
}) => {
  const [localVal, setLocalVal] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalVal(raw);
    
    // 允許輸入空字串或負號，暫不更新父層，避免 NaN
    if (raw === '' || raw === '-') return;

    const num = parseFloat(raw.replace(/,/g, ''));
    if (!isNaN(num)) {
        onChange(num);
    }
  };

  const handleBlur = () => setLocalVal(null);
  const handleFocus = () => setLocalVal(value.toString());

  return (
    <input
      type="text"
      className={className}
      // 當正在編輯(localVal不為null)時顯示原始輸入，否則顯示格式化後的數字
      value={localVal !== null ? localVal : formatNumber(value)}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
    />
  );
};

// --- Hooks ---
const useExport = () => {
  const printContent = async (contentHtml: string) => {
    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) {
        alert('瀏覽器阻擋了彈出視窗，請允許彈出視窗或使用「下載 HTML」功能。');
        return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>AI智能資產配置與品質健檢報告</title>
          <style>
            body { font-family: 'Microsoft JhengHei', sans-serif; padding: 40px; line-height: 1.6; color: #000; max-width: 900px; margin: 0 auto; }
            h1 { font-size: 24px; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; color: #000; text-align: center; }
            h2 { font-size: 18px; color: #1e40af; margin-top: 30px; border-left: 4px solid #1e40af; padding-left: 10px; background-color: #f0f9ff; padding: 8px; }
            h3 { font-size: 16px; font-weight: bold; margin-top: 20px; color: #d97706; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            p { margin-bottom: 10px; text-align: justify; }
            ul, ol { margin-bottom: 15px; padding-left: 25px; }
            li { margin-bottom: 5px; }
            strong { font-weight: bold; color: #059669; }
            .header-info { text-align: center; margin-bottom: 40px; border-bottom: 1px solid #ccc; padding-bottom: 20px; }
            .date { color: #666; font-size: 14px; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background-color: #f4f4f4; font-weight: bold; }
            blockquote { border-left: 4px solid #ccc; margin: 1.5em 10px; padding: 0.5em 10px; color: #555; background-color: #f9f9f9; }
            @media print {
                body { -webkit-print-color-adjust: exact; }
                .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header-info">
            <h1>AI智能資產配置與品質健檢報告</h1>
            <div class="date">生成日期：${new Date().toLocaleDateString()}</div>
          </div>
          ${contentHtml}
          <script>
             window.onload = function() {
                 setTimeout(function() {
                     window.print();
                 }, 800);
             }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const downloadContent = (contentHtml: string) => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>資產配置報告-${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: 'Microsoft JhengHei', sans-serif; padding: 40px; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; background: #fff; }
            h1 { font-size: 28px; border-bottom: 3px solid #2563eb; padding-bottom: 15px; margin-bottom: 30px; color: #1e3a8a; text-align: center; }
            h2 { font-size: 20px; color: #2563eb; margin-top: 30px; background: #eff6ff; padding: 10px; border-radius: 4px; border-left: 5px solid #2563eb; }
            h3 { font-size: 18px; font-weight: bold; margin-top: 25px; color: #d97706; }
            p { margin-bottom: 12px; font-size: 16px; }
            ul, ol { margin-bottom: 20px; padding-left: 25px; }
            li { margin-bottom: 8px; }
            strong { font-weight: bold; color: #059669; }
            .footer { margin-top: 50px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f3f4f6; color: #374151; }
          </style>
        </head>
        <body>
          <h1>AI智能資產配置與品質健檢報告</h1>
          <p style="color:#666; text-align:center;">生成日期：${new Date().toLocaleString()}</p>
          <hr style="border:0; border-top:1px solid #eee; margin: 20px 0;">
          ${contentHtml}
          <div class="footer">
            由 資產指揮中心 系統生成
          </div>
        </body>
      </html>
    `;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Asset_Report_${new Date().toISOString().slice(0,10)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return { printContent, downloadContent };
};

// --- Global Styles ---
const GlobalStyles = () => (
  <style>{`
    .glass-panel {
      background: rgba(30, 41, 59, 0.75);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
    }
    .glass-input {
      background-color: rgba(15, 23, 42, 0.6) !important;
      border: 1px solid rgba(148, 163, 184, 0.2);
      color: #F8FAFC !important;
      transition: all 0.2s;
    }
    .glass-input:focus {
      background-color: rgba(15, 23, 42, 0.9) !important;
      border-color: #3B82F6;
      outline: none;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
      color: #ffffff !important;
    }
    
    input[type="date"] { color-scheme: dark; }
    input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; filter: invert(1); }
    
    /* AI Report Styles */
    .ai-report-style h1 { font-size: 1.8rem; font-weight: 800; color: #F8FAFC; margin-top: 2rem; margin-bottom: 1.5rem; padding-bottom: 0.5rem; border-bottom: 2px solid #334155; }
    .ai-report-style h2 { font-size: 1.4rem; font-weight: 700; color: #38BDF8; margin-top: 2rem; margin-bottom: 1rem; border-left: 4px solid #38BDF8; padding-left: 12px; background: rgba(56, 189, 248, 0.05); padding-top: 4px; padding-bottom: 4px; border-radius: 0 4px 4px 0; }
    .ai-report-style h3 { font-size: 1.15rem; font-weight: 700; color: #FBBF24; margin-top: 1.5rem; margin-bottom: 0.8rem; }
    .ai-report-style p { margin-bottom: 1rem; line-height: 1.8; color: #CBD5E1; font-size: 1rem; }
    .ai-report-style ul, .ai-report-style ol { padding-left: 1.5rem; margin-bottom: 1.5rem; color: #CBD5E1; }
    .ai-report-style ul { list-style: disc; }
    .ai-report-style li { margin-bottom: 0.5rem; }
    .ai-report-style strong { color: #34D399; font-weight: 700; }
    
    /* Details Animation */
    details summary::-webkit-details-marker { display: none; }
    details summary { list-style: none; }
    details[open] summary ~ * { animation: sweep .3s ease-in-out; }
    @keyframes sweep { 0% {opacity: 0; transform: translateY(-10px)} 100% {opacity: 1; transform: translateY(0)} }
  `}</style>
);

// --- Components ---

const Header = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
  const navItems = [
    { id: 'dashboard', label: '戰情儀表板', icon: LayoutDashboard },
    { id: 'portfolio', label: '投資組合管理', icon: Settings },
    { id: 'simulation', label: '複利模擬試算', icon: Calculator },
    { id: 'blueprint', label: '投資藍圖 Report', icon: FileText },
  ];

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 no-print">
      <div className="container mx-auto px-4 h-16 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <TrendingUp size={20} />
          </div>
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-white">
            2030 資產指揮中心 <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-pink-400 text-sm ml-1">v7.2</span>
          </h1>
        </div>
        <nav className="hidden md:flex space-x-1 bg-slate-800 p-1 rounded-lg">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === item.id ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="w-9 h-9 md:block hidden"></div>
      </div>
      <div className="md:hidden flex border-t border-slate-800 overflow-x-auto scrollbar-hide">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex-1 py-3 min-w-[80px] text-xs font-medium text-center border-b-2 transition-colors ${
              activeTab === item.id ? 'border-blue-500 text-white' : 'border-transparent text-slate-400'
            }`}
          >
            {item.label.split(' ')[0]}
          </button>
        ))}
      </div>
    </header>
  );
};

const DashboardView = ({ settings, totalAsset, cash, chartData, progressData, onOpenAI }: any) => {
  const progress = Math.min((totalAsset / settings.totalGoal) * 100, 100);
  const gap = settings.totalGoal - totalAsset;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-xl border-l-4 border-yellow-500 relative overflow-hidden group hover:bg-slate-800/50 transition-colors">
           <div className="absolute -right-6 -top-6 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl group-hover:bg-yellow-500/20 transition-all"></div>
           <div className="flex justify-between items-start mb-2 relative z-10">
             <p className="text-slate-400 text-xs uppercase tracking-wider font-bold">總資產目標</p>
             <Flag className="text-yellow-500" size={24} />
           </div>
           <div className="flex items-baseline relative z-10">
             <span className="text-4xl md:text-5xl font-mono font-bold text-yellow-400 tracking-tight">
               {settings.totalGoal.toLocaleString()}
             </span>
             <span className="ml-2 text-sm text-yellow-500/80">萬 TWD</span>
           </div>
           <div className="mt-4 relative z-10">
             <div className="flex justify-between text-xs mb-1 text-slate-400">
               <span>達成率</span>
               <span className="text-yellow-400 font-bold">{progress.toFixed(1)}%</span>
             </div>
             <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
               <div className="bg-yellow-500 h-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
             </div>
           </div>
        </div>
        <div className="glass-panel p-5 rounded-xl border-l-4 border-blue-500 flex flex-col justify-center hover:bg-slate-800/50 transition-colors">
           <div className="flex justify-between items-start mb-1">
             <p className="text-slate-400 text-xs uppercase tracking-wider font-bold">目前總資產 (含現金)</p>
             <Wallet className="text-blue-500" size={24} />
           </div>
           <div className="flex items-baseline">
             <span className="text-3xl md:text-4xl font-mono font-bold text-blue-400 tracking-tight">
               {totalAsset.toLocaleString(undefined, { maximumFractionDigits: 1 })}
             </span>
             <span className="ml-2 text-sm text-blue-500/80">萬</span>
           </div>
        </div>
        <div className="grid grid-rows-2 gap-4">
           <div className="glass-panel p-4 rounded-xl flex items-center justify-between border-l-4 border-red-500 hover:bg-slate-800/50 transition-colors">
             <div>
               <p className="text-slate-400 text-xs uppercase tracking-wider">資金缺口</p>
               <p className="text-xl font-mono font-bold text-red-400 mt-1">{gap > 0 ? '-' : '+'}{Math.abs(gap).toLocaleString()} 萬</p>
             </div>
             <TrendingUp className="text-red-500/30" size={32} />
           </div>
           <div className="glass-panel p-4 rounded-xl flex items-center justify-between border-l-4 border-emerald-500 hover:bg-slate-800/50 transition-colors">
             <div>
               <p className="text-slate-400 text-xs uppercase tracking-wider">備用彈藥 (現金)</p>
               <p className="text-xl font-mono font-bold text-emerald-400 mt-1">{cash.toLocaleString()} 萬</p>
             </div>
             <DollarSign className="text-emerald-500/30" size={32} />
           </div>
        </div>
      </div>
      <div className="glass-panel rounded-xl p-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600">
        <div className="bg-slate-900 rounded-lg p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-start gap-4 z-10">
             <div className="p-3 bg-slate-800 rounded-xl text-purple-400 shrink-0"><Brain size={32} /></div>
             <div>
               <h3 className="text-xl font-bold text-white mb-1">AI 首席戰略顧問</h3>
               <p className="text-sm text-slate-400 max-w-lg leading-relaxed">根據您的即時資產數據、目標缺口與剩餘時間，提供動態且具體的行動建議。</p>
             </div>
           </div>
           <button onClick={onOpenAI} className="w-full md:w-auto px-6 py-3 bg-white text-slate-900 hover:bg-slate-200 rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 z-10"><Sparkles size={18} className="text-purple-600" /> 立即分析</button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="glass-panel p-6 rounded-xl">
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-200">資產配置現況</h3><span className="text-xs px-2 py-1 bg-slate-800 rounded text-slate-400 border border-slate-700">不含現金</span></div>
            <div className="relative h-64 w-full flex justify-center"><Doughnut data={chartData} options={{ responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'right', labels: { color: '#CBD5E1', font: { family: "'JetBrains Mono', monospace" } } } } }} /></div>
         </div>
         <div className="glass-panel p-6 rounded-xl flex flex-col justify-center">
            <h3 className="font-bold text-slate-200 mb-5 flex items-center gap-2"><PieChart size={18} className="text-blue-400" /> 戰術板塊達成度</h3>
            <div className="space-y-6">
               {progressData.map((item: any) => (
                 <div key={item.key}>
                   <div className="flex justify-between text-sm mb-1"><span className={`${item.color.replace('bg-', 'text-')} font-bold`}>{item.name}</span><span className="font-mono text-slate-300 text-xs">{item.current.toLocaleString(undefined, {maximumFractionDigits: 1})} / {item.target.toLocaleString(undefined, {maximumFractionDigits: 0})}</span></div>
                   <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden"><div className={`${item.color} h-full rounded-full transition-all duration-1000`} style={{ width: `${Math.min(item.percent, 100)}%` }}></div></div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

const PortfolioView = ({ settings, portfolio, cash, onUpdateSettings, onUpdatePortfolio, onAddAsset, onConfirmDeleteAsset, onUpdateCash }: any) => {
  const totalPct = settings.ratios.tw + settings.ratios.us + settings.ratios.bond;
  const [sortConfig, setSortConfig] = useState<{ key: keyof PortfolioItem | 'value', direction: 'asc' | 'desc' } | null>(null);

  const sortedPortfolio = useMemo(() => {
    if (!sortConfig) return portfolio;
    return [...portfolio].sort((a: any, b: any) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      if (sortConfig.key === 'value') {
        valA = a.shares * a.price * (a.currency === 'usd' ? settings.fxRate : 1);
        valB = b.shares * b.price * (b.currency === 'usd' ? settings.fxRate : 1);
      }
      if (typeof valA === 'string') valA = valA.toUpperCase();
      if (typeof valB === 'string') valB = valB.toUpperCase();
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [portfolio, sortConfig, settings.fxRate]);

  const handleSort = (key: any) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current?.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const totalInvested = portfolio.reduce((sum: number, item: any) => {
     const rate = item.currency === 'usd' ? settings.fxRate : 1;
     return sum + (item.shares * item.price * rate) / 10000;
  }, 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-5 rounded-xl md:col-span-2">
             <h3 className="font-bold text-white mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                <Flag size={18} /> 戰略目標設定
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                   <div>
                      <label className="block text-xs text-slate-400 mb-1">總資產目標 (萬 TWD)</label>
                      <NumberInput 
                        value={settings.totalGoal}
                        onChange={(v) => onUpdateSettings('totalGoal', v)}
                        className="glass-input w-full p-2 rounded font-mono text-lg font-bold text-emerald-400" 
                      />
                   </div>
                   <div>
                      <label className="block text-xs text-slate-400 mb-1">預期達成日期</label>
                      <input type="date" value={settings.targetDate} onChange={(e) => onUpdateSettings('targetDate', e.target.value)} className="glass-input w-full p-2 rounded font-mono text-white" />
                   </div>
                   <div className="space-y-3">
                      <label className="block text-xs text-slate-400">資產配置比例 (%)</label>
                      <div className="grid grid-cols-3 gap-2">
                         {['tw', 'us', 'bond'].map((type) => (
                             <div key={type}>
                               <label className={`text-[10px] block ${type === 'tw' ? 'text-blue-400' : type === 'us' ? 'text-cyan-400' : 'text-yellow-400'}`}>{type.toUpperCase()}</label>
                               <input type="number" value={settings.ratios[type as keyof typeof settings.ratios]} onChange={(e) => onUpdateSettings('ratios', { ...settings.ratios, [type]: parseFloat(e.target.value) })} className="glass-input w-full p-2 rounded font-mono text-center" />
                             </div>
                         ))}
                      </div>
                      <div className="text-right text-xs text-slate-500">目前總和: <span className={totalPct === 100 ? "text-emerald-400" : "text-red-400"}>{totalPct}%</span></div>
                   </div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 space-y-4">
                   <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">參數設定</h4>
                   <div>
                      <label className="block text-xs text-slate-400 mb-1">USD/TWD 匯率</label>
                      <div className="relative">
                        <input type="number" value={settings.fxRate} onChange={(e) => onUpdateSettings('fxRate', parseFloat(e.target.value))} className="glass-input w-full p-2 rounded font-mono text-white" step="0.1" />
                        <span className="absolute right-3 top-2 text-slate-500 text-sm">TWD</span>
                      </div>
                   </div>
                   <div>
                      <label className="block text-xs text-slate-400 mb-1">再平衡門檻 (%)</label>
                      <input type="number" value={settings.rebalanceThreshold} onChange={(e) => onUpdateSettings('rebalanceThreshold', parseFloat(e.target.value))} className="glass-input w-full p-2 rounded font-mono text-white" />
                   </div>
                </div>
             </div>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-emerald-500/30 flex flex-col justify-center">
             <h4 className="text-emerald-400 font-bold mb-3 flex items-center gap-2"><Wallet size={18} /> 現金部位 (War Chest)</h4>
             <div className="mb-4">
                <label className="text-sm text-slate-400">目前閒置資金 (萬):</label>
                <NumberInput 
                   value={cash} 
                   onChange={onUpdateCash}
                   className="glass-input w-full mt-1 p-2 rounded font-mono text-xl font-bold text-right"
                />
             </div>
             <div className="pt-4 border-t border-slate-700/50">
                <label className="text-sm text-slate-400">每月可投資金額 (萬):</label>
                <NumberInput 
                   value={settings.monthlyContribution}
                   onChange={(v) => onUpdateSettings('monthlyContribution', v)}
                   className="glass-input w-full mt-1 p-2 rounded font-mono text-xl font-bold text-right text-blue-400"
                />
                <p className="text-[10px] text-slate-500 mt-1">*此數值將連動至試算與 AI 評估</p>
             </div>
          </div>
       </div>

       <div className="flex justify-end">
          <button onClick={onAddAsset} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition flex items-center gap-2"><Plus size={16} /> 新增標的</button>
       </div>

       <div className="glass-panel rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
             <table className="w-full text-sm text-left text-slate-400">
                <thead className="text-xs text-slate-200 uppercase bg-slate-800/50">
                   <tr>
                      <th className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('type')}>類別</th>
                      <th className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('symbol')}>代號</th>
                      <th className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('name')}>名稱</th>
                      <th className="px-4 py-3 text-center">幣別</th>
                      <th className="px-4 py-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('shares')}>股數</th>
                      <th className="px-4 py-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('price')}>現價</th>
                      <th className="px-4 py-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('value')}>市值 (萬)</th>
                      <th className="px-4 py-3 text-center">操作</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                   {sortedPortfolio.map((item: PortfolioItem) => {
                      const rate = item.currency === 'usd' ? settings.fxRate : 1;
                      const value = (item.shares * item.price * rate) / 10000;
                      return (
                         <tr key={item.id} className="hover:bg-slate-700/30 border-b border-slate-700/30">
                            <td className="px-4 py-2">
                               <select value={item.type} onChange={(e) => onUpdatePortfolio(item.id, 'type', e.target.value)} className={`bg-transparent border-none outline-none font-bold ${item.type === 'tw' ? 'text-blue-400' : item.type === 'us' ? 'text-cyan-400' : 'text-yellow-400'}`}>
                                 <option value="tw" className="bg-slate-800 text-blue-400">TW</option>
                                 <option value="us" className="bg-slate-800 text-cyan-400">US</option>
                                 <option value="bond" className="bg-slate-800 text-yellow-400">Bond</option>
                               </select>
                            </td>
                            <td className="px-4 py-2"><input type="text" value={item.symbol} onChange={(e) => onUpdatePortfolio(item.id, 'symbol', e.target.value)} className="glass-input w-20 font-bold text-white outline-none rounded px-2 py-1" /></td>
                            <td className="px-4 py-2"><input type="text" value={item.name} onChange={(e) => onUpdatePortfolio(item.id, 'name', e.target.value)} className="glass-input w-full text-slate-300 outline-none rounded px-2 py-1" /></td>
                            <td className="px-4 py-2 text-center">
                               <button onClick={() => onUpdatePortfolio(item.id, 'currency', item.currency === 'twd' ? 'usd' : 'twd')} className={`text-xs px-2 py-1 rounded border ${item.currency === 'usd' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : 'border-blue-500/50 text-blue-400 bg-blue-500/10'}`}>{item.currency.toUpperCase()}</button>
                            </td>
                            <td className="px-4 py-2 text-right">
                                <NumberInput value={item.shares} onChange={(v) => onUpdatePortfolio(item.id, 'shares', v)} className="glass-input w-24 text-right font-mono text-slate-300 outline-none rounded px-2 py-1" />
                            </td>
                            <td className="px-4 py-2 text-right">
                                <NumberInput value={item.price} onChange={(v) => onUpdatePortfolio(item.id, 'price', v)} className="glass-input w-24 text-right font-mono text-emerald-400 outline-none rounded px-2 py-1" />
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-white">{value.toFixed(2)}</td>
                            <td className="px-4 py-2 text-center">
                                <button onClick={() => onConfirmDeleteAsset(item.id)} className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10"><Trash2 size={16} /></button>
                            </td>
                         </tr>
                      );
                   })}
                </tbody>
                <tfoot className="bg-slate-800/30 font-bold text-slate-200">
                   <tr>
                      <td colSpan={6} className="px-4 py-3 text-right">總市值合計 (TWD)</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-400">{totalInvested.toFixed(2)} 萬</td>
                      <td></td>
                   </tr>
                </tfoot>
             </table>
          </div>
       </div>
    </div>
  );
}

// --- SimulationView ---
const SimulationView = ({ simParams, setSimParams }: any) => {
  const simulationData = useMemo(() => {
    const monthlyRate = (simParams.rate / 100) / 12;
    let currentBalance = simParams.initial;
    let currentPrincipal = simParams.initial;
    const labels = ['Start'];
    const balanceData = [simParams.initial];
    const principalData = [simParams.initial];

    for (let i = 1; i <= simParams.months; i++) {
      currentBalance = currentBalance * (1 + monthlyRate) + simParams.monthly;
      currentPrincipal += simParams.monthly;
      if (simParams.months <= 24 || i % 6 === 0 || i === simParams.months) {
        const year = Math.floor(i / 12);
        labels.push(year > 0 ? `Y${year}` : `M${i}`);
        balanceData.push(Math.round(currentBalance));
        principalData.push(Math.round(currentPrincipal));
      }
    }

    const years = simParams.months / 12;
    const effectiveCAGR = currentPrincipal > 0 && years > 0 
        ? (Math.pow(currentBalance / currentPrincipal, 1 / years) - 1) * 100 
        : 0;

    return {
      labels, balanceData, principalData,
      finalBalance: currentBalance,
      finalPrincipal: currentPrincipal,
      totalInterest: currentBalance - currentPrincipal,
      effectiveCAGR: effectiveCAGR
    };
  }, [simParams]);

  const handleSimChange = (key: string, valStr: string) => {
      let val = parseNumber(valStr);
      if (val < 0) val = 0;
      setSimParams((prev: any) => ({ ...prev, [key]: val }));
  };

  const chartData = {
    labels: simulationData.labels,
    datasets: [
      { label: '總資產', data: simulationData.balanceData, borderColor: '#34D399', backgroundColor: 'rgba(52, 211, 153, 0.1)', borderWidth: 3, fill: true, tension: 0.4 },
      { label: '投入本金', data: simulationData.principalData, borderColor: '#3B82F6', borderWidth: 2, borderDash: [5, 5], fill: false, tension: 0.4 }
    ]
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="md:col-span-4 space-y-6">
          <div className="glass-panel p-5 rounded-xl">
             <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Calculator size={18} className="text-cyan-400" /> 試算參數設定</h3>
             <div className="space-y-4">
                <div>
                   <label className="block text-xs text-slate-400 mb-1">起始投入金額 (元)</label>
                   <NumberInput 
                     value={simParams.initial}
                     onChange={(v) => setSimParams((prev: any) => ({ ...prev, initial: v }))}
                     className="glass-input w-full p-2 text-lg rounded font-mono text-white"
                   />
                </div>
                <div>
                   <label className="block text-xs text-slate-400 mb-1">每月定期定額 (元)</label>
                   <NumberInput 
                     value={simParams.monthly}
                     onChange={(v) => setSimParams((prev: any) => ({ ...prev, monthly: v }))}
                     className="glass-input w-full p-2 text-lg rounded font-mono text-white"
                   />
                </div>
                <div>
                   <label className="block text-xs text-slate-400 mb-1">預期年化報酬率 (%)</label>
                   <input type="number" value={simParams.rate} onChange={(e) => handleSimChange('rate', e.target.value)} className="glass-input w-full p-2 text-lg rounded font-mono text-emerald-300 font-bold" />
                </div>
                <div>
                   <label className="block text-xs text-slate-400 mb-1">投資期間 (月數)</label>
                   <input type="number" value={simParams.months} onChange={(e) => handleSimChange('months', e.target.value)} className="glass-input w-full p-2 text-lg rounded font-mono text-white" />
                   <p className="text-[10px] text-slate-500 mt-1 text-right">約 {(simParams.months / 12).toFixed(1)} 年</p>
                </div>
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="glass-panel p-4 rounded-xl overflow-hidden border-l-2 border-cyan-500/50 flex flex-col justify-center min-h-[100px]">
                 <p className="text-[10px] text-slate-400 uppercase tracking-wider">總報酬率</p>
                 <p className="text-2xl font-mono font-bold text-cyan-400 mt-1">
                    {simulationData.finalPrincipal > 0 
                        ? ((simulationData.finalBalance - simulationData.finalPrincipal) / simulationData.finalPrincipal * 100).toFixed(1) 
                        : 0}%
                 </p>
             </div>
             <div className="glass-panel p-4 rounded-xl overflow-hidden border-l-2 border-yellow-500/50 flex flex-col justify-center min-h-[100px]">
                 <p className="text-[10px] text-slate-400 uppercase tracking-wider">實質年化報酬 (Effective CAGR)</p>
                 <p className="text-2xl font-mono font-bold text-yellow-400 mt-1">{simulationData.effectiveCAGR.toFixed(2)}%</p>
             </div>
          </div>
       </div>
       <div className="md:col-span-8 space-y-6">
          <div className="glass-panel p-6 rounded-xl flex flex-col">
              <h3 className="font-bold text-slate-200 mb-4">資產成長曲線模擬</h3>
              <div className="w-full h-80"><Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(30, 41, 59, 0.9)', titleFont: { size: 14 }, bodyFont: { size: 13 }, padding: 12, callbacks: { label: (ctx) => `${ctx.dataset.label}: ${Math.round(ctx.raw as number).toLocaleString()}` } } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94A3B8' } }, y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94A3B8' } } } }} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
             <div className="glass-panel p-4 rounded-xl border-l-2 border-blue-500/50"><p className="text-[10px] text-slate-400 uppercase tracking-wider">總投入本金</p><p className="text-lg font-mono font-bold text-slate-200 mt-1 break-all">{Math.round(simulationData.finalPrincipal).toLocaleString()}</p></div>
             <div className="glass-panel p-4 rounded-xl border-l-2 border-emerald-500/50"><p className="text-[10px] text-slate-400 uppercase tracking-wider">總投資回報</p><p className="text-lg font-mono font-bold text-emerald-400 mt-1 break-all">+{Math.round(simulationData.totalInterest).toLocaleString()}</p></div>
             <div className="glass-panel p-4 rounded-xl border-l-2 border-cyan-500/50"><p className="text-[10px] text-slate-400 uppercase tracking-wider">期末總資產</p><p className="text-lg font-mono font-bold text-cyan-400 mt-1 break-all">{Math.round(simulationData.finalBalance).toLocaleString()}</p></div>
          </div>
       </div>
    </div>
  );
};

// --- BlueprintView ---
const BlueprintView = ({ report, onOpenAI }: { report: string, onOpenAI: () => void }) => {
  const { printContent, downloadContent } = useExport();

  const handlePrint = async () => {
      if (report) {
          const html = await marked.parse(report);
          printContent(html);
      }
  };

  const handleDownload = async () => {
      if (report) {
          const html = await marked.parse(report);
          downloadContent(html);
      }
  };

  if (!report) {
    return (
       <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-4 rounded-full bg-slate-800 mb-4"><FileText size={48} className="text-slate-500" /></div>
          <h3 className="text-xl font-bold text-slate-300 mb-2">尚未生成報告</h3>
          <p className="text-slate-500 mb-6">請前往「戰情儀表板」呼叫 AI 顧問進行分析。</p>
          <button onClick={onOpenAI} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition">立即分析</button>
       </div>
    );
  }

  return (
    <div id="blueprint-report-container" className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="text-center py-4 border-b border-slate-700 mb-6">
           <h1 className="text-2xl font-bold text-white mb-2">AI智能資產配置與品質健檢報告</h1>
           <p className="text-slate-400 text-sm">生成日期：{new Date().toLocaleDateString()}</p>
       </div>
       
       <div className="glass-panel p-8 rounded-xl ai-report-style" dangerouslySetInnerHTML={{ __html: marked.parse(report) as string }} />
       <div className="flex justify-center gap-4 no-print">
          <button onClick={handlePrint} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-bold transition flex items-center gap-2"><Printer size={18} /> 列印報告</button>
          <button onClick={handleDownload} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition flex items-center gap-2"><Download size={18} /> 下載 HTML</button>
          <button onClick={onOpenAI} className="px-6 py-2 bg-purple-900/50 hover:bg-purple-800/50 text-purple-300 border border-purple-500/30 rounded-lg text-sm font-bold transition flex items-center gap-2"><RefreshCw size={18} /> 重新分析</button>
       </div>
    </div>
  );
};

// --- AIModal ---
const AIModal = ({ isOpen, onClose, settings, portfolio, totalAsset, cash, onSaveKey, onSaveReport }: any) => {
    const [loading, setLoading] = useState(false);
    const [localKey, setLocalKey] = useState(settings.geminiApiKey);
    const [result, setResult] = useState<string | null>(null);
    const [loadingText, setLoadingText] = useState("正在分析...");
    const { printContent, downloadContent } = useExport();

    useEffect(() => {
        if (isOpen && settings.geminiApiKey) runAnalysis();
    }, [isOpen]);

    useEffect(() => {
        if (loading) {
           const steps = ["正在分析資產配置...", "正在計算蒙地卡羅模擬...", "正在撰寫投資建議...", "AI 首席顧問思考中..."];
           let i = 0;
           const interval = setInterval(() => {
              setLoadingText(steps[i % steps.length]);
              i++;
           }, 1500);
           return () => clearInterval(interval);
        }
    }, [loading]);
    
    const runAnalysis = async () => {
        setLoading(true);
        const now = new Date();
        const target = new Date(settings.targetDate);
        const diffDays = Math.ceil(Math.abs(target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const remainingYears = (diffDays / 365.25).toFixed(1);
        
        const targetVal = settings.totalGoal;
        const monthlyVal = settings.monthlyContribution || 0;
        const futurePrincipal = totalAsset + (monthlyVal * 12 * parseFloat(remainingYears));
        
        let cagrText = "";
        if (totalAsset >= targetVal) cagrText = "目標已達成，無需額外報酬率";
        else if (futurePrincipal >= targetVal) cagrText = "0% (靠本金即可達成)";
        else {
            const effectivePrincipal = totalAsset + (monthlyVal * 12 * parseFloat(remainingYears) * 0.5);
            if (effectivePrincipal > 0) {
                const rawCagr = (Math.pow(targetVal / effectivePrincipal, 1 / parseFloat(remainingYears)) - 1) * 100;
                cagrText = `${rawCagr.toFixed(2)}%`;
            } else cagrText = "無法計算";
        }
        
        const prompt = `
        你現在是我的專業財務顧問與資產品質分析師。請撰寫一份分析報告。

        **【開場白指引】**
        請扮演一位專業且溫暖的財務顧問。在報告開頭，請用自然、令人安心的語氣向客戶問好，並務必在開場白中提及：距離目標僅剩約 ${remainingYears} 年，以及目標金額為 ${formatNumber(targetVal)} 萬台幣。請不要死板地照抄數據，而是將其融入對話中，讓客戶感到被重視與鼓勵。
        
        【背景資訊】
        - 今天的日期：${now.toLocaleDateString()}
        - 目標達成日期：${settings.targetDate}
        - 剩餘時間：約 ${remainingYears} 年

        【關鍵財務數據 (核心基準)】
        - **總資產目標**：${formatNumber(targetVal)} 萬 TWD
        - **目前總資產**：${formatNumber(totalAsset)} 萬
        - **預估到期本金 (目前資產 + 未來投入)**：${formatNumber(futurePrincipal)} 萬 (假設 0% 報酬率)
        - **預估缺口 (不含複利)**：${formatNumber(targetVal - futurePrincipal)} 萬 (若為負數代表本金已足夠)
        - **達成目標所需年化報酬 (Required CAGR)**：${cagrText}

        【資產數據】
        - 備用現金 (War Chest)：${formatNumber(cash)} 萬 TWD
        - 每月可額外投入金額：${settings.monthlyContribution} 萬 TWD
        - 設定的目標配置比例：台股 ${settings.ratios.tw}%, 美股 ${settings.ratios.us}%, 債券 ${settings.ratios.bond}%

        【目前詳細持倉】
        ${JSON.stringify(portfolio)}

        請以繁體中文撰寫一份專業的「AI智能資產配置與品質健檢」，**必須**包含以下六個章節標題與內容：

        ## 1. 目標進度分析 (Goal Progress Analysis)
           - 計算目前的達成率。
           - **關鍵任務**：請比較「總資產目標」(${formatNumber(targetVal)}萬) 與 「預估到期本金」(${formatNumber(futurePrincipal)}萬)。
           - 如果本金已足夠 (預估缺口為負)，請恭喜客戶並建議採取保守策略。
           - 如果仍有缺口，請根據 Required CAGR (${cagrText}) 評估達成難度。
           - 若 Required CAGR 過高 (>8%) 或目標難達成，請在章節末提供替代方案試算：
             a. 時間換取空間：建議延後目標日期至哪一年？
             b. 資金換取報酬：建議每月投入金額需增加至多少？
             c. 本金投入：建議現在需單筆注入多少資金？
           - 給予一段信心喊話。

        ## 2. 再平衡建議 (Rebalancing Recommendations)
           - 比較目前實際比例與目標比例的差距。
           - 針對現金部位及未來的每月投入資金，提出具體的部署建議 (買入哪類資產、金額多少)。

        ## 3. 資產品質健檢 (Asset Quality Audit)
           - **非常重要**：請針對投資組合中的具體標的 (例如 ${portfolio.map((p:any)=>p.symbol).join(', ')}) 進行個別點評。
           - 評估其費用率、追蹤誤差或是否符合長期持有的標準。
           - 指出哪些是優質核心資產，哪些可能有潛在風險 (如過度集中、槓桿損耗)。

        ## 4. 下一步行動 (Action Plan)
           - 列出 3 到 5 個具體的執行步驟, 並依執行順序排列。

        ## 5. 退休提領策略 (Retirement Withdraw Strategies)
           - 指導客戶當目標資產達成後的可採用的提領策略。
           - 針對可行退休提領策略進行1到10年提領模擬及建議。並考慮可能的通膨因素,包含每年的提領金額,剩餘資產金額等.
           - 對於退休後可能面臨的風險給予提醒及建議(考慮通膨與餘命)。

        ## 6. 投資小叮嚀 (Advisor's Insights)
           - 針對目前市場環境或投資心態給予專業建議。
           - 針對資產目標達成的若干年後的可能資產規模, 給予投資人堅持的期盼, 並給予勉勵。
           - 最後附上幾段投資哲學或格言並送上祝福

        請使用 Markdown 格式輸出。重點數字請加粗。語氣請專業、客觀且具鼓勵性。
        `;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${settings.geminiApiKey}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text;
            setResult(text);
            onSaveReport(text);
        } catch (e) {
            alert('AI 分析失敗');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveKey = () => {
        if(localKey) { onSaveKey(localKey); runAnalysis(); }
    };
    
    const handlePrintModal = async () => {
        if (result) {
            const html = await marked.parse(result);
            printContent(html);
        }
    };

    const handleDownloadModal = async () => {
        if (result) {
            const html = await marked.parse(result);
            downloadContent(html);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 z-[90] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-slate-800 rounded-xl w-full max-w-3xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-5 border-b border-slate-700">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2"><Brain className="text-purple-400"/> AI 首席顧問</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button>
                </div>
                <div className="flex-grow overflow-y-auto p-6">
                    {!settings.geminiApiKey && !loading && (
                        <div className="text-center space-y-4">
                             <div className="bg-slate-900/50 p-6 rounded-lg border border-purple-500/30">
                                <p className="text-slate-300 mb-3">請輸入您的 Google Gemini API Key 以啟動顧問服務</p>
                                <input type="password" value={localKey} onChange={e=>setLocalKey(e.target.value)} className="glass-input w-full max-w-md mx-auto p-3 text-center block" placeholder="Paste Key Here"/>
                                <button onClick={handleSaveKey} className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg font-bold">開始</button>
                                <details className="mt-6 pt-4 border-t border-slate-700 text-left text-xs text-slate-400 space-y-2 cursor-pointer group">
                                    <summary className="font-bold text-slate-300 flex items-center gap-2 list-none">
                                        <span className="group-open:hidden">▶</span><span className="hidden group-open:inline">▼</span> 🔑 如何免費取得 API Key？ (點擊展開)
                                    </summary>
                                    <div className="pl-4 mt-2 space-y-2 animate-fadeIn">
                                        <p>1. 前往 <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-blue-400 hover:underline">Google AI Studio</a> 並登入。</p>
                                        <p>2. 點擊左上角的 <strong>"Create API key"</strong> 按鈕。</p>
                                        <p>3. 選擇 <strong>"Create API key in new project"</strong>。</p>
                                        <p>4. 複製產生的 Key (以 AIza 開頭)，貼回上方欄位。</p>
                                    </div>
                                </details>
                             </div>
                        </div>
                    )}
                    {loading && <div className="text-center py-12">
                        <div className="inline-block w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                        <p className="text-purple-300 animate-pulse text-lg font-bold">{loadingText}</p>
                    </div>}
                    {!loading && result && (
                        <div className="space-y-6">
                            <div className="ai-report-style" dangerouslySetInnerHTML={{__html: marked.parse(result) as string }}/>
                            <div className="flex justify-between pt-6 border-t border-slate-700 no-print">
                                <div className="flex gap-2">
                                    <button onClick={handlePrintModal} className="px-4 py-2 bg-slate-700 text-white rounded-lg flex items-center gap-2"><Printer size={18}/> 列印</button>
                                    <button onClick={handleDownloadModal} className="px-4 py-2 bg-emerald-600 text-white rounded-lg flex items-center gap-2"><Download size={18}/> 下載 HTML</button>
                                </div>
                                <button onClick={runAnalysis} className="px-4 py-2 bg-purple-900/50 text-purple-300 border border-purple-500/30 rounded-lg flex items-center gap-2"><RefreshCw size={18}/> 重試</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Delete Modal ---
const DeleteModal = ({ isOpen, onClose, onConfirm }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-slate-800 rounded-xl max-w-sm w-full border border-slate-700 shadow-2xl p-6 text-center">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="text-red-500" size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">確認刪除？</h3>
                <p className="text-slate-400 text-sm mb-6">此操作無法復原，您確定要移除此投資標的嗎？</p>
                <div className="flex gap-3 justify-center">
                    <button onClick={onClose} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition">取消</button>
                    <button onClick={onConfirm} className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold transition">確認刪除</button>
                </div>
            </div>
        </div>
    );
};

// --- Main App (修正過的定義) ---
const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(DEFAULT_PORTFOLIO);
  const [cash, setCash] = useState(100);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [savedAiReport, setSavedAiReport] = useState("");
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [simParams, setSimParams] = useState<SimParams>(DEFAULT_SIM_PARAMS);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('assetDashboardDataV6');
    if (saved) {
       try {
          const d = JSON.parse(saved);
          if (d.portfolio) setPortfolio(d.portfolio);
          if (d.cash !== undefined) setCash(d.cash);
          if (d.settings) setSettings({ ...DEFAULT_SETTINGS, ...d.settings });
          if (d.savedAiReport) setSavedAiReport(d.savedAiReport);
          if (d.simParams) setSimParams(d.simParams);
          else setSimParams((prev: any) => ({...prev, monthly: (d.settings?.monthlyContribution || 5) * 10000}));
       } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('assetDashboardDataV6', JSON.stringify({
       version: "7.1.10", portfolio, cash, settings, savedAiReport, simParams
    }));
  }, [portfolio, cash, settings, savedAiReport, simParams]);

  const totals = useMemo(() => {
     const t: any = { tw: 0, us: 0, bond: 0 };
     portfolio.forEach(item => {
        const rate = item.currency === 'usd' ? settings.fxRate : 1;
        const val = (item.shares * item.price * rate) / 10000;
        if (t[item.type] !== undefined) t[item.type] += val;
     });
     return t;
  }, [portfolio, settings.fxRate]);
  
  const totalInvested = totals.tw + totals.us + totals.bond;
  const totalAsset = totalInvested + cash;
  const chartData = { labels: ['台股', '美股', '債券'], datasets: [{ data: [totals.tw, totals.us, totals.bond], backgroundColor: ['#3B82F6', '#06B6D4', '#F59E0B'], borderWidth: 0 }] };
  const targetAmounts = { tw: settings.totalGoal * (settings.ratios.tw / 100), us: settings.totalGoal * (settings.ratios.us / 100), bond: settings.totalGoal * (settings.ratios.bond / 100) };
  const progressData = [
     { key: 'tw', name: '台股 (TW)', color: 'bg-blue-500', current: totals.tw, target: targetAmounts.tw, percent: (totals.tw / targetAmounts.tw) * 100 },
     { key: 'us', name: '美股 (US)', color: 'bg-cyan-500', current: totals.us, target: targetAmounts.us, percent: (totals.us / targetAmounts.us) * 100 },
     { key: 'bond', name: '債券 (Bond)', color: 'bg-yellow-500', current: totals.bond, target: targetAmounts.bond, percent: (totals.bond / targetAmounts.bond) * 100 },
  ];

  const handleUpdateSettings = (key: keyof Settings, value: any) => {
     setSettings(prev => {
         const newSettings = { ...prev, [key]: value };
         if (key === 'monthlyContribution') setSimParams((sp: any) => ({ ...sp, monthly: value * 10000 }));
         return newSettings;
     });
  };

  const handleUpdatePortfolio = (id: number, field: keyof PortfolioItem, value: any) => {
     if ((field === 'shares' || field === 'price') && typeof value === 'number' && value < 0) return;
     setPortfolio(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleAddAsset = () => {
     setPortfolio(prev => [...prev, { id: Date.now(), type: 'tw', symbol: 'NEW', name: '', shares: 0, price: 10, currency: 'twd' }]);
  };

  const handleConfirmDelete = (id: number) => {
      setDeleteTargetId(id);
      setDeleteModalOpen(true);
  };

  const executeDelete = () => {
      if (deleteTargetId !== null) {
          setPortfolio(prev => prev.filter(item => item.id !== deleteTargetId));
          setDeleteModalOpen(false);
          setDeleteTargetId(null);
      }
  };

  const handleUpdateCash = (val: number) => { if (val < 0) return; setCash(val); }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-blue-500/30">
      <GlobalStyles />
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="container mx-auto p-4 md:p-6 pb-24">
         {activeTab === 'dashboard' && (
            <DashboardView 
               settings={settings} 
               totalAsset={totalAsset} 
               cash={cash} 
               chartData={chartData} 
               progressData={progressData}
               onOpenAI={() => setIsAiModalOpen(true)}
            />
         )}

         {activeTab === 'portfolio' && (
            <PortfolioView 
               settings={settings} 
               portfolio={portfolio} 
               cash={cash} 
               onUpdateSettings={handleUpdateSettings}
               onUpdatePortfolio={handleUpdatePortfolio}
               onAddAsset={handleAddAsset}
               onConfirmDeleteAsset={handleConfirmDelete}
               onDeleteAsset={handleConfirmDelete}
               onUpdateCash={handleUpdateCash}
            />
         )}

         {activeTab === 'simulation' && (
            <SimulationView simParams={simParams} setSimParams={setSimParams} />
         )}

         {activeTab === 'blueprint' && (
            <BlueprintView report={savedAiReport} onOpenAI={() => setIsAiModalOpen(true)} />
         )}
      </main>

      <AIModal 
         isOpen={isAiModalOpen} 
         onClose={() => setIsAiModalOpen(false)} 
         settings={settings} 
         portfolio={portfolio} 
         totalAsset={totalAsset}
         cash={cash}
         onSaveKey={(k: string) => setSettings(p => ({...p, geminiApiKey: k}))}
         onSaveReport={setSavedAiReport}
      />
      
      <DeleteModal 
          isOpen={deleteModalOpen} 
          onClose={() => setDeleteModalOpen(false)} 
          onConfirm={executeDelete} 
      />
    </div>
  );
}

export default App;
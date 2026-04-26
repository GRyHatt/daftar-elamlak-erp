import { useState, useEffect } from 'react';
import { 
  Wallet, ArrowDownRight, ArrowUpRight, History, 
  PlusCircle, MinusCircle, Printer, Search, Calendar, 
  TrendingUp, TrendingDown, FileText 
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Cashbook() {
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // حالات الفلترة والبحث
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // افتراضي: الشهر الحالي YYYY-MM
  
  // حالة الفورم
  const [activeTab, setActiveTab] = useState('إيداع');
  const [formData, setFormData] = useState({ amount: '', reason: '' });

  // إعدادات الشركة للطباعة
  const [companySettings, setCompanySettings] = useState({
    companyName: 'دفتر الأملاك',
    phones: '01000000000'
  });

  useEffect(() => {
    fetchTransactions();
    const savedPrintSettings = localStorage.getItem('companyPrintSettings');
    if (savedPrintSettings) {
      setCompanySettings(JSON.parse(savedPrintSettings));
    }
  }, []);

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('cashbook')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      setTransactions(data);
      // حساب الرصيد التراكمي اللحظي للخزنة (كل الأوقات)
      const currentBalance = data.reduce((sum, t) => {
        return t.transaction_type === 'إيداع' ? sum + Number(t.amount) : sum - Number(t.amount);
      }, 0);
      setBalance(currentBalance);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.reason) return alert('برجاء إدخال المبلغ والسبب');
    
    // منع السحب لو الرصيد ميكفيش
    if (activeTab === 'سحب' && Number(formData.amount) > balance) {
      return alert('عفواً، الرصيد المتاح في الخزنة لا يكفي لإتمام عملية السحب!');
    }

    setLoading(true);
    const currentUser = JSON.parse(localStorage.getItem('appUser')) || { name: 'مسؤول النظام' };
    const { error } = await supabase.from('cashbook').insert([{
      transaction_type: activeTab,
      amount: Number(formData.amount),
      reason: formData.reason,
      employee_name: currentUser.name
    }]);

    if (!error) {
      alert(`تم تسجيل الـ ${activeTab} بنجاح!`);
      setFormData({ amount: '', reason: '' });
      fetchTransactions();
    } else {
      alert('حدث خطأ أثناء التسجيل: ' + error.message);
    }
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  // فلترة الحركات بناءً على الشهر والبحث
  const filteredTransactions = transactions.filter(t => {
    const date = new Date(t.created_at);
    const monthStr = date.toISOString().slice(0, 7); // يجيب الـ YYYY-MM
    
    const matchesMonth = selectedMonth ? monthStr === selectedMonth : true;
    const matchesSearch = t.reason.includes(searchQuery) || (t.employee_name && t.employee_name.includes(searchQuery));
    
    return matchesMonth && matchesSearch;
  });

  // حساب إحصائيات الشهر المحدد
  const monthlyIn = filteredTransactions.filter(t => t.transaction_type === 'إيداع').reduce((sum, t) => sum + Number(t.amount), 0);
  const monthlyOut = filteredTransactions.filter(t => t.transaction_type === 'سحب').reduce((sum, t) => sum + Number(t.amount), 0);
  const monthlyNet = monthlyIn - monthlyOut;

  return (
    <div className="space-y-8 animate-fade-in pb-20 relative" dir="rtl">
      
      {/* ستايلات الطباعة */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-ledger, #printable-ledger * { visibility: visible; }
          #printable-ledger { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; background: white; }
          .print-hide { display: none !important; }
        }
      `}</style>

      {/* --- الهيدر وكارت الرصيد الكلي --- */}
      <div className="print-hide bg-[#0f172a] rounded-[2.5rem] border border-slate-800 p-8 md:p-10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="relative z-10 space-y-2 text-center md:text-right">
          <h2 className="text-3xl font-black text-white flex items-center justify-center md:justify-start gap-3">
            <Wallet className="text-blue-500" size={32} />
            خزنة النثريات (Cashbook)
          </h2>
          <p className="text-slate-400 font-medium">سجل المحفظة السريعة للسحب والإيداع والمصروفات اليومية.</p>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-3xl text-center min-w-[250px] shadow-lg shadow-black/20">
          <p className="text-xs text-blue-300 font-bold uppercase tracking-widest mb-2">إجمالي الرصيد المتاح (الفليكس)</p>
          <h3 className={`text-5xl font-black ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`} dir="ltr">
            {balance.toLocaleString()} <span className="text-lg font-bold text-slate-400">ج.م</span>
          </h3>
        </div>
      </div>

      {/* --- منطقة العمليات (سحب وإيداع) --- */}
      <div className="print-hide bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-fit mb-8">
          <button 
            onClick={() => setActiveTab('إيداع')} 
            className={`flex-1 md:px-10 py-3 rounded-xl font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'إيداع' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <ArrowDownRight size={20}/> إيداع رصيد
          </button>
          <button 
            onClick={() => setActiveTab('سحب')} 
            className={`flex-1 md:px-10 py-3 rounded-xl font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'سحب' ? 'bg-white text-red-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <ArrowUpRight size={20}/> سحب مصروف
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div className="space-y-2 md:col-span-1">
            <label className={`text-sm font-bold ${activeTab === 'إيداع' ? 'text-emerald-700' : 'text-red-700'}`}>
              مبلغ الـ {activeTab} (Float) *
            </label>
            <input 
              type="number" 
              step="any"
              required 
              min="0.1"
              value={formData.amount} 
              onChange={(e) => setFormData({...formData, amount: e.target.value})} 
              className={`w-full p-4 rounded-2xl border-2 outline-none text-xl font-black transition-colors ${activeTab === 'إيداع' ? 'bg-emerald-50 border-emerald-100 focus:border-emerald-500 text-emerald-900' : 'bg-red-50 border-red-100 focus:border-red-500 text-red-900'}`} 
              placeholder="0.00"
              dir="ltr"
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-bold text-slate-600">البيان / السبب التفصيلي *</label>
            <input 
              type="text" 
              required 
              value={formData.reason} 
              onChange={(e) => setFormData({...formData, reason: e.target.value})} 
              className="w-full p-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-500 bg-slate-50 font-bold text-slate-800 transition-colors" 
              placeholder={activeTab === 'إيداع' ? "مثال: تمويل مبدأي من المهندس أحمد..." : "مثال: مصاريف بوفيه وضيافة..."} 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`md:col-span-1 p-4 rounded-2xl font-black text-white shadow-xl transition-all flex items-center justify-center gap-2 h-[60px] ${activeTab === 'إيداع' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200' : 'bg-red-500 hover:bg-red-600 shadow-red-200'}`}
          >
            {loading ? 'جاري التسجيل...' : activeTab === 'إيداع' ? <><PlusCircle size={20}/> تأكيد الإيداع</> : <><MinusCircle size={20}/> تأكيد السحب</>}
          </button>
        </form>
      </div>

      {/* --- شريط الفلترة والإقفال الشهري --- */}
      <div className="print-hide flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex w-full md:w-auto gap-4">
            <div className="relative flex-1 md:w-64">
               <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث في الحركات..." className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 outline-none focus:border-blue-500 font-bold text-sm shadow-sm" />
               <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
            </div>
            <div className="relative">
               <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full pr-10 pl-4 py-3 rounded-2xl border border-slate-200 outline-none focus:border-blue-500 font-black text-sm shadow-sm text-slate-700" />
               <Calendar size={18} className="absolute right-4 top-3.5 text-slate-400" />
            </div>
         </div>
         <button onClick={handlePrint} className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black hover:bg-slate-800 transition-colors shadow-lg">
            <Printer size={18}/> طباعة كشف حساب الشهر
         </button>
      </div>

      {/* --- إحصائيات الشهر (الملخص) --- */}
      <div className="print-hide grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><TrendingUp size={24}/></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">إجمالي إيداعات الشهر</p>
            <p className="text-xl font-black text-slate-800" dir="ltr">{monthlyIn.toLocaleString()} <span className="text-sm text-slate-500">ج</span></p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl"><TrendingDown size={24}/></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">إجمالي منصرف الشهر</p>
            <p className="text-xl font-black text-slate-800" dir="ltr">{monthlyOut.toLocaleString()} <span className="text-sm text-slate-500">ج</span></p>
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-md flex items-center gap-4 text-white">
          <div className="p-4 bg-white/10 text-white rounded-2xl"><FileText size={24}/></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">صافي حركة الشهر</p>
            <p className="text-xl font-black" dir="ltr">{monthlyNet > 0 ? '+' : ''}{monthlyNet.toLocaleString()} <span className="text-sm text-slate-400">ج</span></p>
          </div>
        </div>
      </div>

      {/* --- سجل الحركات (الجدول المطبوع والمرئي) --- */}
      <div id="printable-ledger" className="bg-white rounded-[2rem] print:rounded-none shadow-sm print:shadow-none border border-slate-100 print:border-none overflow-hidden">
        
        {/* ترويسة الطباعة (تظهر في الطباعة فقط) */}
        <div className="hidden print:block mb-8 border-b-4 border-slate-900 pb-6">
           <div className="flex justify-between items-end">
              <div>
                 <h1 className="text-3xl font-black text-slate-900">{companySettings.companyName}</h1>
                 <p className="text-slate-600 font-bold mt-2 text-lg">كشف حساب الخزنة والنثريات</p>
              </div>
              <div className="text-left">
                 <p className="text-sm font-bold text-slate-500">عن شهر: <span className="text-slate-900">{selectedMonth || 'كل الأوقات'}</span></p>
                 <p className="text-sm font-bold text-slate-500 mt-1">تاريخ الإصدار: {new Date().toLocaleDateString('ar-EG')}</p>
              </div>
           </div>
           
           <div className="flex gap-8 mt-6 bg-slate-100 p-4 rounded-xl">
              <div className="flex-1"><span className="text-slate-500 text-sm font-bold">إجمالي الإيداعات:</span> <span className="font-black text-emerald-700 mx-2">{monthlyIn.toLocaleString()} ج.م</span></div>
              <div className="flex-1"><span className="text-slate-500 text-sm font-bold">إجمالي المنصرف:</span> <span className="font-black text-red-700 mx-2">{monthlyOut.toLocaleString()} ج.م</span></div>
              <div className="flex-1"><span className="text-slate-500 text-sm font-bold">صافي الشهر:</span> <span className="font-black text-slate-900 mx-2">{monthlyNet.toLocaleString()} ج.م</span></div>
           </div>
        </div>

        <div className="print-hide p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="text-blue-600" size={20}/>
            <h3 className="font-black text-slate-800">حركات شهر ({selectedMonth || 'كل الأوقات'})</h3>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-lg border border-slate-200">
            {filteredTransactions.length} عملية مسجلة
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[800px] border-collapse print:border print:border-slate-300">
            <thead className="bg-slate-900 print:bg-slate-200 text-white print:text-slate-900 text-sm">
              <tr>
                <th className="p-5 font-bold print:border print:border-slate-300">التاريخ والوقت</th>
                <th className="p-5 font-bold print:border print:border-slate-300">النوع</th>
                <th className="p-5 font-bold print:border print:border-slate-300">المبلغ</th>
                <th className="p-5 font-bold print:border print:border-slate-300">البيان / السبب التفصيلي</th>
                <th className="p-5 font-bold text-center print:border print:border-slate-300">المسؤول</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 print:divide-slate-300">
              {filteredTransactions.length === 0 ? (
                <tr><td colSpan="5" className="p-10 text-center text-slate-400 font-bold print:border print:border-slate-300">لا توجد حركات مسجلة في هذا الشهر.</td></tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-5 print:p-3 print:border print:border-slate-300">
                      <p className="font-bold text-slate-800">{new Date(t.created_at).toLocaleDateString('ar-EG')}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{new Date(t.created_at).toLocaleTimeString('ar-EG')}</p>
                    </td>
                    <td className="p-5 print:p-3 print:border print:border-slate-300">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black print:bg-transparent print:border-none print:px-0 ${t.transaction_type === 'إيداع' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                        {t.transaction_type === 'إيداع' ? <ArrowDownRight size={14} className="print-hide"/> : <ArrowUpRight size={14} className="print-hide"/>} {t.transaction_type}
                      </span>
                    </td>
                    <td className="p-5 print:p-3 print:border print:border-slate-300">
                      <span className={`font-black text-lg print:text-base ${t.transaction_type === 'إيداع' ? 'text-emerald-600 print:text-emerald-800' : 'text-red-600 print:text-red-800'}`} dir="ltr">
                        {Number(t.amount).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-5 print:p-3 text-slate-700 font-bold print:border print:border-slate-300">{t.reason}</td>
                    <td className="p-5 print:p-3 text-center print:border print:border-slate-300">
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 print:bg-transparent px-3 py-1 rounded-lg">{t.employee_name || 'غير محدد'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* توقيعات الطباعة */}
        <div className="hidden print:flex justify-between mt-20 px-10">
           <div className="text-center font-bold text-slate-700">
              <p className="mb-8">المدير المالي</p>
              <p>.......................................</p>
           </div>
           <div className="text-center font-bold text-slate-700">
              <p className="mb-8">المدير العام</p>
              <p>.......................................</p>
           </div>
        </div>
      </div>
      
    </div>
  );
}
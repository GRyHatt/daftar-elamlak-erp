import { useState, useEffect } from 'react';
import { Wallet, ArrowDownRight, ArrowUpRight, History, PlusCircle, MinusCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Cashbook() {
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // حالة الفورم
  const [activeTab, setActiveTab] = useState('إيداع'); // 'إيداع' أو 'سحب'
  const [formData, setFormData] = useState({ amount: '', reason: '' });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('cashbook')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      setTransactions(data);
      // حساب الرصيد اللحظي
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
      fetchTransactions(); // تحديث الرصيد والجدول
    } else {
      alert('حدث خطأ أثناء التسجيل: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20" dir="rtl">
      
      {/* --- الهيدر وكارت الرصيد --- */}
      <div className="bg-[#0f172a] rounded-[2.5rem] border border-slate-800 p-8 md:p-10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="relative z-10 space-y-2 text-center md:text-right">
          <h2 className="text-3xl font-black text-white flex items-center justify-center md:justify-start gap-3">
            <Wallet className="text-blue-500" size={32} />
            خزنة النثريات (Cashbook)
          </h2>
          <p className="text-slate-400 font-medium">سجل المحفظة السريعة للسحب والإيداع والمصروفات اليومية.</p>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-3xl text-center min-w-[250px]">
          <p className="text-xs text-blue-300 font-bold uppercase tracking-widest mb-2">الرصيد المتاح حالياً</p>
          <h3 className={`text-5xl font-black ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`} dir="ltr">
            {balance.toLocaleString()} <span className="text-lg font-bold text-slate-400">ج.م</span>
          </h3>
        </div>
      </div>

      {/* --- منطقة العمليات (سحب وإيداع) --- */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
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
              مبلغ الـ {activeTab} *
            </label>
            <input 
              type="number" 
              required 
              min="1"
              value={formData.amount} 
              onChange={(e) => setFormData({...formData, amount: e.target.value})} 
              className={`w-full p-4 rounded-2xl border-2 outline-none text-xl font-black transition-colors ${activeTab === 'إيداع' ? 'bg-emerald-50 border-emerald-100 focus:border-emerald-500 text-emerald-900' : 'bg-red-50 border-red-100 focus:border-red-500 text-red-900'}`} 
              placeholder="0"
              dir="ltr"
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-bold text-slate-600">البيان / السبب (جه إزاي أو خرج إزاي) *</label>
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

      {/* --- سجل الحركات --- */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <History className="text-blue-600" size={20}/>
          <h3 className="font-black text-slate-800">سجل حركات الخزنة</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[800px]">
            <thead className="bg-slate-900 text-white text-sm">
              <tr>
                <th className="p-5 font-bold">التاريخ والوقت</th>
                <th className="p-5 font-bold">نوع الحركة</th>
                <th className="p-5 font-bold">المبلغ</th>
                <th className="p-5 font-bold">البيان / السبب</th>
                <th className="p-5 font-bold text-center">المسؤول</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.length === 0 ? (
                <tr><td colSpan="5" className="p-10 text-center text-slate-400 font-bold">لا توجد أي حركات مسجلة في الخزنة حتى الآن.</td></tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-5">
                      <p className="font-bold text-slate-800">{new Date(t.created_at).toLocaleDateString('ar-EG')}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{new Date(t.created_at).toLocaleTimeString('ar-EG')}</p>
                    </td>
                    <td className="p-5">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${t.transaction_type === 'إيداع' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                        {t.transaction_type === 'إيداع' ? <ArrowDownRight size={14}/> : <ArrowUpRight size={14}/>} {t.transaction_type}
                      </span>
                    </td>
                    <td className="p-5">
                      <span className={`font-black text-lg ${t.transaction_type === 'إيداع' ? 'text-emerald-600' : 'text-red-600'}`} dir="ltr">
                        {t.transaction_type === 'إيداع' ? '+' : '-'}{Number(t.amount).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-5 text-slate-700 font-bold">{t.reason}</td>
                    <td className="p-5 text-center">
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">{t.employee_name || 'غير محدد'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
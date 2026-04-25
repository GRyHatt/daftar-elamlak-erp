import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Wallet, Building2, TrendingUp, MapPin, Globe2, 
  Home, DollarSign, RefreshCw, PieChart, ArrowUpRight, Activity 
} from 'lucide-react';

export default function InvestorPortal() {
  const user = JSON.parse(localStorage.getItem('appUser'));
  const [myPortfolio, setMyPortfolio] = useState([]);
  
  // إحصائيات المحفظة المتقدمة
  const [stats, setStats] = useState({ 
    totalLocalEGP: 0, 
    totalWatanUSD: 0, 
    unifiedTotalEGP: 0,
    expectedProfitEGP: 0,
    expectedProfitUSD: 0,
    unifiedProfitEGP: 0,
    count: 0 
  });
  
  const [exchangeRate, setExchangeRate] = useState(0);
  const [loading, setLoading] = useState(true);

  // 1. سحب سعر الصرف اللحظي
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        setExchangeRate(data.rates.EGP);
      } catch (error) {
        setExchangeRate(50.00); // سعر احتياطي
      }
    };
    fetchRate();
  }, []);

  // 2. سحب بيانات محفظة المستثمر
  useEffect(() => {
    const fetchMyData = async () => {
      if (!user || !exchangeRate) return;

      const { data } = await supabase
        .from('contributions')
        .select(`*, offerings (*)`)
        .eq('investor_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data) {
        setMyPortfolio(data);
        
        let tEGP = 0;
        let tUSD = 0;
        let pEGP = 0;
        let pUSD = 0;

        data.forEach(c => {
           const type = c.offerings?.offering_type;
           const amount = Number(c.paid_amount);
           const purchasePrice = Number(c.offerings?.purchase_price || 1); // منع القسمة على صفر
           const salePrice = Number(c.offerings?.sale_price || 0);
           
           // نسبة الملكية في المشروع
           const share = amount / purchasePrice;
           // الربح المتوقع من هذه الحصة
           const totalProjProfit = salePrice - purchasePrice;
           const myExpectedProfit = totalProjProfit * share;

           if (type === 'بيت وطن') {
              tUSD += amount;
              pUSD += myExpectedProfit;
           } else {
              tEGP += amount;
              pEGP += myExpectedProfit;
           }
        });

        setStats({
          totalLocalEGP: tEGP,
          totalWatanUSD: tUSD,
          unifiedTotalEGP: tEGP + (tUSD * exchangeRate),
          expectedProfitEGP: pEGP,
          expectedProfitUSD: pUSD,
          unifiedProfitEGP: pEGP + (pUSD * exchangeRate),
          count: data.length
        });
      }
      setLoading(false);
    };
    
    fetchMyData();
  }, [user?.id, exchangeRate]);

  if (loading) {
    return <div className="flex justify-center items-center h-[70vh] text-blue-600 font-bold text-xl"><RefreshCw className="animate-spin mr-2"/> جاري تجميع بيانات محفظتك...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20" dir="rtl">
      
      {/* --- الهيدر وداشبورد المحفظة (The Master Card) --- */}
      <div className="bg-[#0f172a] rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between p-10 gap-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none"></div>
        
        <div className="relative z-10 space-y-4 flex-1">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-bold">
            <Activity size={14} className="text-emerald-400" /> تقييم المحفظة اللحظي
          </div>
          <h2 className="text-4xl font-black text-white">مرحباً، {user.name} 👋</h2>
          <p className="text-slate-400 font-medium">إليك ملخص شامل لاستثماراتك وتدفقاتك المالية في مشاريعنا.</p>
        </div>

        <div className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl text-center md:text-left md:min-w-[300px]">
           <p className="text-xs text-blue-300 font-bold uppercase tracking-widest mb-2 flex justify-center md:justify-start items-center gap-2">
             <Wallet size={16}/> إجمالي التقييم (بالمصري)
           </p>
           <h3 className="text-4xl lg:text-5xl font-black text-white" dir="ltr">
             {Math.round(stats.unifiedTotalEGP).toLocaleString()} <span className="text-lg text-slate-400 font-bold">ج.م</span>
           </h3>
           {stats.totalWatanUSD > 0 && (
             <p className="text-xs font-bold text-emerald-400 mt-3 flex justify-center md:justify-start items-center gap-1" dir="ltr">
               يتضمن ${stats.totalWatanUSD.toLocaleString()} (سعر الصرف: {exchangeRate.toFixed(2)})
             </p>
           )}
        </div>
      </div>

      {/* --- كروت الإحصائيات التفصيلية (Bento Style) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* المشاريع */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-lg transition-shadow">
          <div className="p-4 rounded-2xl bg-blue-50 text-blue-600"><Building2 size={24} /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">المشاريع المساهم بها</p>
            <p className="text-2xl font-black text-slate-800">{stats.count} <span className="text-xs font-bold text-slate-500">مشروع</span></p>
          </div>
        </div>

        {/* السيولة الأجنبية */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-lg transition-shadow">
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600"><Globe2 size={24} /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">استثمارات (بيت وطن)</p>
            <p className="text-2xl font-black text-slate-800" dir="ltr">${stats.totalWatanUSD.toLocaleString()}</p>
          </div>
        </div>

        {/* السيولة المحلية */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-lg transition-shadow">
          <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600"><Home size={24} /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">استثمارات محلية</p>
            <p className="text-2xl font-black text-slate-800" dir="ltr">{stats.totalLocalEGP.toLocaleString()} <span className="text-xs text-slate-500">ج.م</span></p>
          </div>
        </div>

        {/* الأرباح المتوقعة */}
        <div className="bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-800 flex items-center gap-4 hover:shadow-2xl transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/20 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
          <div className="p-4 rounded-2xl bg-white/10 text-emerald-400 relative z-10"><TrendingUp size={24} /></div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">الأرباح التقديرية الموحدة</p>
            <p className="text-2xl font-black text-white" dir="ltr">+{Math.round(stats.unifiedProfitEGP).toLocaleString()} <span className="text-xs text-slate-500">ج.م</span></p>
          </div>
        </div>
      </div>

      {/* --- سجل الأصول العقارية (Table) --- */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
            <PieChart className="text-blue-600" /> تفاصيل الأصول والمساهمات العقارية
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[1000px]">
            <thead>
              <tr className="text-slate-500 text-xs font-bold uppercase border-b border-slate-100 bg-white">
                <th className="p-6">المشروع والموقع</th>
                <th className="p-6 text-center">النوع</th>
                <th className="p-6">حجم المساهمة</th>
                <th className="p-6">نسبة الملكية</th>
                <th className="p-6">الأرباح المتوقعة</th>
                <th className="p-6 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {myPortfolio.length === 0 ? (
                <tr><td colSpan="6" className="p-10 text-center text-slate-400 font-bold">لم تقم بأي مساهمات استثمارية حتى الآن.</td></tr>
              ) : (
                myPortfolio.map((item) => {
                  const isWatan = item.offerings?.offering_type === 'بيت وطن';
                  const amount = Number(item.paid_amount);
                  const purchasePrice = Number(item.offerings?.purchase_price || 1);
                  const salePrice = Number(item.offerings?.sale_price || 0);
                  
                  // الحسابات
                  const sharePercentage = ((amount / purchasePrice) * 100).toFixed(1);
                  const expectedProfit = (salePrice - purchasePrice) * (amount / purchasePrice);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                      {/* المشروع */}
                      <td className="p-6">
                        <p className="font-black text-slate-800">{item.offerings?.title}</p>
                        <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-1">
                          <MapPin size={10}/> {item.offerings?.location || 'غير محدد'}
                        </p>
                      </td>
                      
                      {/* النوع */}
                      <td className="p-6 text-center">
                        <span className={`inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-[10px] font-black tracking-wider ${isWatan ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                          {isWatan ? <><Globe2 size={12}/> دولار</> : <><Home size={12}/> محلي</>}
                        </span>
                      </td>

                      {/* حجم المساهمة */}
                      <td className="p-6">
                        <div className="font-black text-lg text-slate-800" dir="ltr">
                          {isWatan ? <span className="text-emerald-600">${amount.toLocaleString()}</span> : <span>{amount.toLocaleString()} ج.م</span>}
                        </div>
                      </td>

                      {/* نسبة الملكية (Visual Bar) */}
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-blue-600 text-sm" dir="ltr">{sharePercentage}%</span>
                          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(sharePercentage, 100)}%` }}></div>
                          </div>
                        </div>
                      </td>

                      {/* الربح المتوقع */}
                      <td className="p-6">
                        <div className="font-bold text-sm text-emerald-600 flex items-center gap-1" dir="ltr">
                          <ArrowUpRight size={14}/>
                          {isWatan ? `$${expectedProfit.toLocaleString()}` : `${expectedProfit.toLocaleString()} ج.م`}
                        </div>
                      </td>

                      {/* الحالة */}
                      <td className="p-6 text-center">
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-bold ${item.offerings?.status === 'ساري' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {item.offerings?.status || 'مغلق'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
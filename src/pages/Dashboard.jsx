import { useState, useEffect } from 'react';
import { LayoutDashboard, TrendingUp, Users, Building2, Wallet, DollarSign, RefreshCw, Globe, Home, ArrowUpRight } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalMoneyEGP: 0,
    totalMoneyUSD: 0,
    totalInvestors: 0,
    activeOfferings: 0,
  });
  
  const [exchangeRate, setExchangeRate] = useState(0); 
  const [loadingRate, setLoadingRate] = useState(true);
  
  const [recentContributions, setRecentContributions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchLiveExchangeRate = async () => {
    setLoadingRate(true);
    let currentRate = 50; // سعر احتياطي
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      currentRate = data.rates.EGP;
      setExchangeRate(currentRate); 
    } catch (error) {
      console.error('خطأ في جلب سعر الصرف', error);
      setExchangeRate(currentRate);
    }
    setLoadingRate(false);
    return currentRate;
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    
    // 1. جلب سعر الصرف أولاً عشان نبني عليه الحسابات
    const liveRate = await fetchLiveExchangeRate();
    
    // 2. جلب إجمالي الفلوس من دفتر المساهمات مع ربطها بنوع الطرح
    const { data: contributions } = await supabase
      .from('contributions')
      .select('paid_amount, created_at, offerings(title, offering_type), investors(full_name)');
    
    let tEGP = 0;
    let tUSD = 0;

    if (contributions) {
      contributions.forEach(c => {
         const amount = Number(c.paid_amount);
         const isWatan = c.offerings?.offering_type === 'بيت وطن';
         
         if (isWatan) {
            tUSD += amount; // نجمع الدولارات لوحدها
            tEGP += (amount * liveRate); // ونحولها لمصري عشان الإجمالي العام
         } else {
            tEGP += amount; // نجمع المصري عادي
         }
      });
    }
    
    // 3. جلب عدد المستثمرين
    const { count: investorsCount } = await supabase.from('investors').select('*', { count: 'exact', head: true });
    
    // 4. جلب عدد الطروحات السارية
    const { count: offeringsCount } = await supabase.from('offerings').select('*', { count: 'exact', head: true }).eq('status', 'ساري');

    setStats({
      totalMoneyEGP: tEGP,
      totalMoneyUSD: tUSD,
      totalInvestors: investorsCount || 0,
      activeOfferings: offeringsCount || 0
    });

    // جلب أحدث 6 مساهمات للجدول السريع
    if (contributions) {
      const sorted = contributions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);
      setRecentContributions(sorted);
    }
    
    setLoading(false);
  };

  // دالة الكارت الإحصائي المطور
  const StatCard = ({ title, value, subValue, icon: Icon, colorClass, suffix = "" }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-6 relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ${colorClass}`}></div>
      <div className={`p-4 rounded-xl ${colorClass} text-white shadow-lg relative z-10`}>
        <Icon size={28} />
      </div>
      <div className="relative z-10 flex-1">
        <p className="text-slate-500 font-bold mb-1 text-sm">{title}</p>
        <h3 className="text-3xl font-black text-slate-800" dir="ltr">
          {typeof value === 'number' ? value.toLocaleString() : value} <span className="text-sm text-slate-500 font-bold">{suffix}</span>
        </h3>
        {subValue && (
          <p className="text-xs font-bold text-emerald-600 mt-2 bg-emerald-50 w-fit px-2 py-1 rounded-md">
            {subValue}
          </p>
        )}
      </div>
    </div>
  );

  if (loading) return <div className="flex justify-center items-center h-[70vh] text-brand-light font-bold text-xl"><RefreshCw className="animate-spin mr-2"/> جاري تجميع وتحليل البيانات...</div>;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* الهيدر ومؤشر العملة اللحظي */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-light/10 rounded-xl text-brand-light">
            <LayoutDashboard size={28} />
          </div>
          <h2 className="text-3xl font-bold text-brand-dark tracking-tight">نظرة عامة والسيولة</h2>
        </div>
        
        <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl flex items-center gap-3 shadow-lg border border-slate-800">
          <DollarSign size={18} className="text-emerald-400" />
          {loadingRate ? (
            <RefreshCw size={16} className="animate-spin text-slate-400" />
          ) : (
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">مؤشر الصرف اللحظي</span>
              <span className="font-black text-emerald-400 text-sm tracking-wider" dir="ltr">1 USD = {exchangeRate.toFixed(2)} EGP</span>
            </div>
          )}
        </div>
      </div>

      {/* كروت الإحصائيات (Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="إجمالي السيولة المجمعة (بالمصري)" 
          value={Math.round(stats.totalMoneyEGP)} 
          subValue={stats.totalMoneyUSD > 0 ? `تتضمن $${stats.totalMoneyUSD.toLocaleString()} (عملة صعبة)` : null}
          icon={Wallet} 
          colorClass="bg-blue-600"
          suffix="ج.م"
        />
        <StatCard 
          title="قاعدة المستثمرين والعملاء" 
          value={stats.totalInvestors} 
          icon={Users} 
          colorClass="bg-indigo-500"
        />
        <StatCard 
          title="المشاريع والطروحات السارية" 
          value={stats.activeOfferings} 
          icon={Building2} 
          colorClass="bg-teal-500"
        />
      </div>

      {/* قسم أحدث التحركات الماليـة */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <TrendingUp className="text-brand-light" size={20} />
            أحدث تدفقات السيولة المسجلة
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-white text-slate-400 text-xs uppercase tracking-wider border-b">
                <th className="p-4 font-bold">اسم المستثمر</th>
                <th className="p-4 font-bold">المشروع / الطرح</th>
                <th className="p-4 font-bold">نوع الطرح</th>
                <th className="p-4 font-bold">المبلغ المدفوع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentContributions.map((con, index) => {
                const isWatan = con.offerings?.offering_type === 'بيت وطن';
                const amount = Number(con.paid_amount);
                
                return (
                  <tr key={index} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold group-hover:bg-brand-light group-hover:text-white transition-colors">
                          {con.investors?.full_name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-800">{con.investors?.full_name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-600">{con.offerings?.title}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${isWatan ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {isWatan ? <Globe size={12}/> : <Home size={12}/>} 
                        {con.offerings?.offering_type || 'طرح محلي'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-green-600">
                        <ArrowUpRight size={16} />
                        <span className="font-black text-lg" dir="ltr">
                          {isWatan ? '$' : ''}{amount.toLocaleString()} {isWatan ? '' : 'ج.م'}
                        </span>
                      </div>
                      {isWatan && (
                        <p className="text-[10px] text-slate-400 font-bold mt-1">
                          ≈ {(amount * exchangeRate).toLocaleString()} ج.م
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
              {recentContributions.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-slate-400 font-bold">لا توجد تدفقات مالية مسجلة في دفتر الحسابات حتى الآن.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
import { useState, useEffect } from 'react';
import { LayoutDashboard, TrendingUp, Users, Building2, Wallet } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalMoney: 0,
    totalInvestors: 0,
    activeOfferings: 0,
  });
  const [recentContributions, setRecentContributions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    // 1. جلب إجمالي الفلوس من دفتر المساهمات
    const { data: contributions } = await supabase.from('contributions').select('paid_amount, created_at, offerings(title), investors(full_name)');
    const totalMoney = contributions?.reduce((sum, current) => sum + Number(current.paid_amount), 0) || 0;
    
    // 2. جلب عدد المستثمرين
    const { count: investorsCount } = await supabase.from('investors').select('*', { count: 'exact', head: true });
    
    // 3. جلب عدد الطروحات المفتوحة
    const { count: offeringsCount } = await supabase.from('offerings').select('*', { count: 'exact', head: true }).eq('status', 'مفتوح');

    setStats({
      totalMoney,
      totalInvestors: investorsCount || 0,
      activeOfferings: offeringsCount || 0
    });

    // جلب أحدث 5 مساهمات للجدول السريع
    if (contributions) {
      const sorted = contributions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
      setRecentContributions(sorted);
    }
    
    setLoading(false);
  };

  // دالة الكارت الإحصائي عشان الكود يكون منظم
  const StatCard = ({ title, value, icon: Icon, colorClass, suffix = "" }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-6 relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ${colorClass}`}></div>
      <div className={`p-4 rounded-xl ${colorClass} text-white shadow-lg relative z-10`}>
        <Icon size={28} />
      </div>
      <div className="relative z-10">
        <p className="text-slate-500 font-semibold mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800" dir="ltr">
          {typeof value === 'number' ? value.toLocaleString() : value} <span className="text-base text-slate-500 font-normal">{suffix}</span>
        </h3>
      </div>
    </div>
  );

  if (loading) return <div className="flex justify-center items-center h-[70vh] text-brand-light font-bold text-xl">جاري تجميع البيانات...</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-light/10 rounded-xl text-brand-light">
            <LayoutDashboard size={28} />
          </div>
          <h2 className="text-3xl font-bold text-brand-dark tracking-tight">نظرة عامة على الاستثمارات</h2>
        </div>
      </div>

      {/* كروت الإحصائيات (Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="إجمالي السيولة المجمعة" 
          value={stats.totalMoney} 
          icon={Wallet} 
          colorClass="bg-blue-600"
          suffix="ج.م"
        />
        <StatCard 
          title="المستثمرين النشطين" 
          value={stats.totalInvestors} 
          icon={Users} 
          colorClass="bg-indigo-500"
        />
        <StatCard 
          title="الطروحات المفتوحة" 
          value={stats.activeOfferings} 
          icon={Building2} 
          colorClass="bg-teal-500"
        />
      </div>

      {/* قسم أحدث التحركات */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-100 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <TrendingUp className="text-brand-light" size={20} />
            أحدث المساهمات المسجلة
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="text-slate-500 text-sm border-b">
                <th className="p-4">المستثمر</th>
                <th className="p-4">المشروع</th>
                <th className="p-4">المبلغ المدفوع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentContributions.map((con, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-800">{con.investors?.full_name}</td>
                  <td className="p-4 text-slate-600">{con.offerings?.title}</td>
                  <td className="p-4 font-bold text-green-600" dir="ltr">
                    +{Number(con.paid_amount).toLocaleString()} ج.م
                  </td>
                </tr>
              ))}
              {recentContributions.length === 0 && (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-slate-500">لا توجد حركات مالية حتى الآن.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
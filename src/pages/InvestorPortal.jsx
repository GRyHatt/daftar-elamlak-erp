import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Wallet, Building2, TrendingUp, MapPin } from 'lucide-react';

export default function InvestorPortal() {
  const user = JSON.parse(localStorage.getItem('appUser'));
  const [myPortfolio, setMyPortfolio] = useState([]);
  const [stats, setStats] = useState({ total: 0, count: 0, profit: 0 });

  useEffect(() => {
    const fetchMyData = async () => {
      const { data } = await supabase
        .from('contributions')
        .select(`*, offerings (*)`)
        .eq('investor_id', user.id);
      
      if (data) {
        setMyPortfolio(data);
        const total = data.reduce((sum, c) => sum + Number(c.paid_amount), 0);
        const profit = data.reduce((sum, c) => {
           const share = c.paid_amount / c.offerings.purchase_price;
           const totalProfit = c.offerings.sale_price - c.offerings.purchase_price;
           return sum + (totalProfit * share);
        }, 0);
        setStats({ total, count: data.length, profit });
      }
    };
    fetchMyData();
  }, [user.id]);

  return (
    <div className="space-y-8 animate-fade-in pb-20" dir="rtl">
      {/* هيدر الصفحة باللون الأزرق الداكن */}
      <div className="bg-[#0f172a] p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <h2 className="text-3xl font-black text-white mb-2">أهلاً بك، {user.name} 👋</h2>
        <p className="text-slate-400">ملخص استثماراتك ومتابعة أرباحك في "دفتر الأملاك"</p>
      </div>

      {/* كروت الإحصائيات بألوان متناسقة وهادية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="إجمالي استثماراتك" value={stats.total} icon={Wallet} colorClass="text-blue-500 bg-blue-50" />
        <StatCard title="المشاريع المشارك بها" value={stats.count} icon={Building2} colorClass="text-indigo-500 bg-indigo-50" />
        <StatCard title="أرباحك المتوقعة" value={stats.profit} icon={TrendingUp} colorClass="text-emerald-500 bg-emerald-50" />
      </div>

      {/* جدول المحفظة */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">تفاصيل المحفظة العقارية</h3>
        </div>
        <table className="w-full text-right">
          <thead>
            <tr className="text-slate-400 text-xs font-bold uppercase border-b bg-white">
              <th className="p-6">اسم الطرح والموقع</th>
              <th className="p-6">حصتك المدفوعة</th>
              <th className="p-6">نسبة ملكيتك</th>
              <th className="p-6">الربح المتوقع</th>
              <th className="p-6">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {myPortfolio.map((item) => {
              const share = (item.paid_amount / item.offerings.purchase_price * 100).toFixed(2);
              const profit = (item.offerings.sale_price - item.offerings.purchase_price) * (share / 100);
              return (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6">
                    <p className="font-bold text-slate-800">{item.offerings.title}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1"><MapPin size={12}/> {item.offerings.location}</p>
                  </td>
                  <td className="p-6 font-bold text-slate-700">{Number(item.paid_amount).toLocaleString()} ج.م</td>
                  <td className="p-6 font-black text-brand-light">%{share}</td>
                  <td className="p-6 font-bold text-emerald-600">+{profit.toLocaleString()} ج.م</td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${item.offerings.status === 'ساري' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                      {item.offerings.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, colorClass }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
      <div className={`p-4 rounded-2xl ${colorClass}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 mb-1">{title}</p>
        <p className="text-xl font-black text-slate-800">{Number(value).toLocaleString()} <span className="text-[10px]">ج.م</span></p>
      </div>
    </div>
  );
}
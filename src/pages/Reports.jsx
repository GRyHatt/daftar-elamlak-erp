import { useState, useEffect } from 'react';
import { FileText, Printer, User, Building, PieChart, Landmark } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Reports() {
  const [investors, setInvestors] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  // جلب أسماء المستثمرين لملء القائمة المنسدلة
  useEffect(() => {
    const fetchInvestors = async () => {
      const { data } = await supabase.from('investors').select('id, full_name').order('full_name');
      if (data) setInvestors(data);
    };
    fetchInvestors();
  }, []);

  // دالة توليد التقرير
  const generateReport = async () => {
    if (!selectedId) return alert('برجاء اختيار مستثمر أولاً');
    setLoading(true);

    // 1. جلب بيانات المستثمر الأساسية
    const { data: investorData } = await supabase
      .from('investors')
      .select('*')
      .eq('id', selectedId)
      .single();

    // 2. جلب كل مساهماته في الطروحات
    const { data: contributionsData } = await supabase
      .from('contributions')
      .select('*, offerings(title, total_price, status)')
      .eq('investor_id', selectedId)
      .order('created_at', { ascending: false });

    // 3. حساب إجمالي الفلوس اللي دفعها في كل المشاريع
    const totalPaid = contributionsData?.reduce((sum, curr) => sum + Number(curr.paid_amount), 0) || 0;

    setReport({
      investor: investorData,
      contributions: contributionsData || [],
      totalPaid
    });
    
    setLoading(false);
  };

  // دالة الطباعة (بتفتح شاشة الـ PDF بتاعة المتصفح)
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* الجزء ده هيختفي وقت الطباعة (print:hidden) */}
      <div className="print:hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-brand-light/10 rounded-xl text-brand-light">
            <FileText size={28} />
          </div>
          <h2 className="text-3xl font-bold text-brand-dark tracking-tight">تقارير وكشوفات الحساب</h2>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full space-y-2">
            <label className="text-sm font-semibold text-slate-600">اختر المستثمر لاستخراج كشف الحساب</label>
            <select 
              value={selectedId} 
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-brand-light bg-slate-50"
            >
              <option value="">-- اضغط لاختيار اسم المستثمر --</option>
              {investors.map(inv => (
                <option key={inv.id} value={inv.id}>{inv.full_name}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={generateReport}
            disabled={loading}
            className="bg-brand-dark hover:bg-brand-light text-white px-8 py-3 rounded-xl font-bold transition-all h-[50px] whitespace-nowrap"
          >
            {loading ? 'جاري التحميل...' : 'عرض التقرير'}
          </button>
        </div>
      </div>

      {/* ورقة التقرير اللي هتطبع */}
      {report && (
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0">
          
          {/* هيدر التقرير (بيانات الشركة والمستثمر) */}
          <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-8">
            <div>
              <h1 className="text-3xl font-black text-brand-dark mb-2">دفتر الأملاك</h1>
              <p className="text-slate-500 font-medium">كشف حساب مستثمر وإدارة محافظ</p>
            </div>
            <div className="text-left">
              <p className="text-sm text-slate-400 mb-1">تاريخ الإصدار</p>
              <p className="font-bold text-slate-800">{new Date().toLocaleDateString('ar-EG')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 bg-slate-50 print:bg-transparent p-6 rounded-xl">
            <div>
              <p className="text-sm text-slate-500 mb-1 flex items-center gap-2"><User size={16}/> اسم المستثمر</p>
              <h3 className="text-xl font-bold text-brand-dark">{report.investor.full_name}</h3>
              <p className="text-slate-600 mt-1">{report.investor.city} | {report.investor.phone}</p>
            </div>
            <div className="md:text-left">
              <p className="text-sm text-slate-500 mb-1 flex items-center gap-2 justify-end print:justify-start"><Landmark size={16}/> إجمالي الاستثمارات</p>
              <h3 className="text-3xl font-black text-green-600" dir="ltr">
                {report.totalPaid.toLocaleString()} ج.م
              </h3>
            </div>
          </div>

          {/* تفاصيل المساهمات */}
          <h4 className="text-lg font-bold text-slate-800 mb-4 border-r-4 border-brand-light pr-3">التفاصيل المالية للمشاريع</h4>
          
          <table className="w-full text-right mb-8">
            <thead>
              <tr className="bg-slate-100 text-brand-dark text-sm print:bg-slate-50">
                <th className="p-4 rounded-r-lg">اسم المشروع / الطرح</th>
                <th className="p-4">المبلغ المدفوع</th>
                <th className="p-4">حالة المشروع</th>
                <th className="p-4">نسبة الملكية</th>
                <th className="p-4 rounded-l-lg">نسبة الصدقة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.contributions.map((con) => (
                <tr key={con.id}>
                  <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                    <Building size={16} className="text-slate-400" /> {con.offerings?.title}
                  </td>
                  <td className="p-4 font-bold" dir="ltr">{Number(con.paid_amount).toLocaleString()} ج.م</td>
                  <td className="p-4 text-sm text-slate-600">{con.offerings?.status}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold text-sm print:border print:border-blue-200">
                      <PieChart size={14} /> %{con.profit_percentage}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-pink-600">%{con.charity_percentage}</td>
                </tr>
              ))}
              {report.contributions.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">لا توجد أي استثمارات مسجلة لهذا العميل.</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* زرار الطباعة */}
          <div className="flex justify-end print:hidden">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg"
            >
              <Printer size={20} /> طباعة كشف الحساب (PDF)
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
import { useState, useEffect } from 'react';
import { 
  FileText, Printer, User, Building, PieChart, Landmark, 
  Globe2, Home, TrendingUp, RefreshCw, ShieldCheck, DollarSign
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Reports() {
  const [investors, setInvestors] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // سعر الصرف اللحظي
  const [exchangeRate, setExchangeRate] = useState(0);
  const [loadingRate, setLoadingRate] = useState(true);

  // جلب سعر الصرف اللحظي أول ما الصفحة تفتح
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        setExchangeRate(data.rates.EGP);
      } catch (error) {
        setExchangeRate(50.00); // سعر تقريبي في حالة فشل الاتصال
      }
      setLoadingRate(false);
    };
    fetchRate();
  }, []);

  // جلب أسماء المستثمرين
  useEffect(() => {
    const fetchInvestors = async () => {
      const { data } = await supabase.from('investors').select('id, full_name').order('full_name');
      if (data) setInvestors(data);
    };
    fetchInvestors();
  }, []);

  // دالة توليد التقرير الذكية
  const generateReport = async () => {
    if (!selectedId) return alert('برجاء اختيار مستثمر أولاً لاستخراج كشف الحساب.');
    setLoading(true);

    try {
      // 1. بيانات المستثمر الأساسية
      const { data: investorData } = await supabase
        .from('investors')
        .select('*')
        .eq('id', selectedId)
        .single();

      // 2. جلب المساهمات مع نوع الطرح (مهم جداً للفصل بين الدولار والمصري)
      const { data: contributionsData } = await supabase
        .from('contributions')
        .select('*, offerings(title, total_price, status, offering_type)')
        .eq('investor_id', selectedId)
        .order('created_at', { ascending: false });

      // 3. تحليل المحفظة الاستثمارية (الأوتوميشن)
      let totalLocalEGP = 0;
      let totalWatanUSD = 0;
      
      contributionsData?.forEach(con => {
        const amount = Number(con.paid_amount);
        if (con.offerings?.offering_type === 'بيت وطن') {
          totalWatanUSD += amount;
        } else {
          totalLocalEGP += amount;
        }
      });

      // إجمالي تقييم المحفظة بالجنيه المصري (المحلي + ما يعادل الدولار)
      const unifiedTotalEGP = totalLocalEGP + (totalWatanUSD * exchangeRate);
      
      // توليد رقم مرجعي للتقرير
      const reportId = `REP-${Date.now().toString().slice(-6)}-${investorData.id.toString().slice0}`;

      setReport({
        id: reportId,
        date: new Date(),
        investor: investorData,
        contributions: contributionsData || [],
        stats: {
          totalLocalEGP,
          totalWatanUSD,
          unifiedTotalEGP,
          projectsCount: contributionsData?.length || 0
        }
      });
    } catch (error) {
      alert("حدث خطأ أثناء سحب البيانات، حاول مرة أخرى.");
      console.error(error);
    }
    
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 relative">
      
      {/* ستايل مخصص للطباعة عشان تطلع ورقة احترافية */}
      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-hidden { display: none !important; }
          .print-shadow-none { box-shadow: none !important; border: 1px solid #e2e8f0 !important; }
        }
      `}</style>

      {/* --- الهيدر ومنطقة التحكم (لا تظهر في الطباعة) --- */}
      <div className="print-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
              <FileText size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">تقارير المحافظ الاستثمارية</h2>
              <p className="text-slate-500 font-bold text-sm">استخراج كشوفات حساب دقيقة متعددة العملات</p>
            </div>
          </div>
          
          {/* مؤشر سعر الصرف */}
          <div className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-3 shadow-lg">
            {loadingRate ? <RefreshCw size={16} className="animate-spin text-slate-400" /> : <DollarSign size={16} className="text-emerald-400" />}
            <span className="text-xs font-bold">مؤشر الدولار:</span>
            <span className="font-black text-emerald-400" dir="ltr">{exchangeRate.toFixed(2)} ج.م</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full space-y-2">
            <label className="text-sm font-bold text-slate-600">حدد المستثمر لاستخراج التقرير المفصل *</label>
            <select 
              value={selectedId} 
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:border-blue-500 bg-slate-50 font-bold text-slate-700 transition-all"
            >
              <option value="">-- ابحث واضغط لاختيار اسم المستثمر --</option>
              {investors.map(inv => (
                <option key={inv.id} value={inv.id}>{inv.full_name}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={generateReport}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black transition-all shadow-lg shadow-blue-200 flex items-center gap-2 whitespace-nowrap"
          >
            {loading ? <><RefreshCw size={18} className="animate-spin"/> جاري التحليل...</> : 'توليد كشف الحساب'}
          </button>
        </div>
      </div>

      {/* --- ورقة التقرير الرسمية (Print Ready) --- */}
      {report && (
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-slate-200 print-shadow-none print:p-6 animate-fade-in relative overflow-hidden">
          
          {/* خلفية مائية للتقرير */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
            <Landmark size={400} />
          </div>

          {/* هيدر التقرير البنكي */}
          <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white print:border print:border-slate-800 print:bg-transparent print:text-slate-800">
                <Building size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 mb-1">دفتر الأملاك للاستثمار</h1>
                <p className="text-blue-600 font-bold tracking-widest text-xs uppercase">كشف حساب مستثمر رسمي</p>
              </div>
            </div>
            <div className="text-left bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">رقم التقرير المرجعي</p>
              <p className="font-black text-slate-800 font-mono text-sm mb-2" dir="ltr">{report.id}</p>
              <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">تاريخ الإصدار</p>
              <p className="font-bold text-slate-800 text-sm">{report.date.toLocaleString('ar-EG')}</p>
            </div>
          </div>

          {/* بيانات العميل وملخص المحفظة */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 relative z-10">
            {/* بطاقة العميل */}
            <div className="md:col-span-1 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-400 font-bold mb-2 uppercase flex items-center gap-2"><User size={14}/> بيانات المستثمر</p>
              <h3 className="text-xl font-black text-slate-800 mb-2">{report.investor.full_name}</h3>
              <p className="text-sm font-bold text-slate-600 mb-1">{report.investor.phone}</p>
              <p className="text-sm font-bold text-slate-600">{report.investor.address || report.investor.city || 'العنوان غير مسجل'}</p>
            </div>

            {/* بطاقة التقييم المالي */}
            <div className="md:col-span-2 bg-slate-900 p-6 rounded-2xl text-white shadow-xl print:bg-slate-50 print:text-slate-900 print:border print:shadow-none flex flex-col justify-center">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-1 print:text-slate-500">التقييم الإجمالي للمحفظة (بالمصري)</p>
                  <h3 className="text-4xl font-black text-white print:text-slate-900" dir="ltr">
                    {Math.round(report.stats.unifiedTotalEGP).toLocaleString()} <span className="text-lg font-bold text-slate-400">EGP</span>
                  </h3>
                </div>
                <div className="text-left">
                   <p className="text-xs text-slate-400 font-bold mb-1">المشاريع</p>
                   <p className="text-2xl font-black text-blue-400 print:text-blue-600">{report.stats.projectsCount}</p>
                </div>
              </div>
              
              {/* تفصيل العملات */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800 print:border-slate-200">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1"><Home size={12}/> طروحات محلية</p>
                  <p className="font-bold text-slate-200 print:text-slate-700" dir="ltr">{report.stats.totalLocalEGP.toLocaleString()} ج.م</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1"><Globe2 size={12}/> مشاريع دولار (بيت وطن)</p>
                  <p className="font-bold text-emerald-400 print:text-emerald-600" dir="ltr">$ {report.stats.totalWatanUSD.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* تفاصيل الحركات الاستثمارية */}
          <div className="mb-6 flex items-center justify-between relative z-10">
            <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <TrendingUp className="text-blue-600" /> السجل المالي والمساهمات
            </h4>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full print-hidden">
              سعر الصرف المعتمد: {exchangeRate.toFixed(2)}
            </span>
          </div>
          
          <div className="overflow-hidden rounded-2xl border border-slate-200 relative z-10 print:border-slate-300">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 print:bg-transparent print:border-b-2 print:border-slate-400">
                <tr className="text-slate-600">
                  <th className="p-4 font-bold w-1/3">المشروع / الطرح</th>
                  <th className="p-4 font-bold text-center">النوع</th>
                  <th className="p-4 font-bold">المبلغ المسدد</th>
                  <th className="p-4 font-bold text-center">الملكية</th>
                  <th className="p-4 font-bold text-center">حالة المشروع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                {report.contributions.map((con) => {
                  const isWatan = con.offerings?.offering_type === 'بيت وطن';
                  const amount = Number(con.paid_amount);

                  return (
                    <tr key={con.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <p className="font-black text-slate-800">{con.offerings?.title}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">{new Date(con.created_at).toLocaleDateString('ar-EG')}</p>
                      </td>
                      
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center justify-center gap-1 px-3 py-1 rounded-full text-[10px] font-black tracking-wider ${isWatan ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                          {isWatan ? <><Globe2 size={12}/> بيت وطن</> : <><Home size={12}/> محلي</>}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="font-black text-lg text-slate-800" dir="ltr">
                          {isWatan ? <span className="text-emerald-600">$ {amount.toLocaleString()}</span> : <span>{amount.toLocaleString()} ج.م</span>}
                        </div>
                        {isWatan && (
                          <div className="text-[10px] font-bold text-slate-400 mt-1" dir="ltr">
                            ≈ {(amount * exchangeRate).toLocaleString()} ج.م
                          </div>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 text-blue-700 font-black">
                          <PieChart size={14} /> %{con.profit_percentage}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md print:border">
                          {con.offerings?.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {report.contributions.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-10 text-center text-slate-400 font-bold">لا توجد أي مساهمات مالية مسجلة لهذا العميل في دفتر الحسابات.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* التوقيعات (تظهر فقط في الطباعة أو أسفل التقرير) */}
          <div className="mt-16 pt-8 border-t border-slate-200 flex justify-between items-center relative z-10 px-10">
             <div className="text-center">
               <p className="text-sm font-bold text-slate-800 mb-8">توقيع المستثمر / المقر بما فيه</p>
               <p className="text-slate-300">________________________</p>
             </div>
             <div className="text-center">
               <p className="text-sm font-bold text-slate-800 mb-8">اعتماد الحسابات (دفتر الأملاك)</p>
               <p className="text-slate-300">________________________</p>
             </div>
          </div>

          {/* زرار الطباعة العائم */}
          <div className="mt-10 flex justify-center print-hidden relative z-10">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-3 bg-slate-900 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl hover:-translate-y-1"
            >
              <Printer size={22} /> طباعة وحفظ التقرير (PDF)
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
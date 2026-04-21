import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Printer, ArrowRight, MapPin, Info, Building2, Users, DollarSign, Activity, Globe, Home, RefreshCw } from 'lucide-react';

export default function OfferingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [offering, setOffering] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // حالات الدولار والتحديث اللحظي
  const [exchangeRate, setExchangeRate] = useState(0); 
  const [loadingRate, setLoadingRate] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      const { data, error } = await supabase
        .from('offerings')
        .select(`*, contributions ( paid_amount, charity_percentage, investors (full_name, phone, city) )`)
        .eq('id', id)
        .single();
        
      if (!error) setOffering(data);
      setLoading(false);
    };
  
    fetchDetails();
    fetchLiveExchangeRate();
  }, [id]);

  const fetchLiveExchangeRate = async () => {
    setLoadingRate(true);
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      setExchangeRate(data.rates.EGP); 
    } catch (error) {
      setExchangeRate(50); // سعر احتياطي
    }
    setLoadingRate(false);
  };

  if (loading) return <div className="p-20 text-center font-bold text-brand-light text-xl">جاري تحميل بيانات الطرح...</div>;
  if (!offering) return <div className="p-20 text-center font-bold text-red-500">هذا الطرح غير موجود بالسيستم!</div>;

  // تحديد نوع الطرح والعملات
  const isWatan = offering.offering_type === 'بيت وطن';
  
  // المجاميع بالعملة الأصلية للطرح
  const totalCollected = offering.contributions?.reduce((sum, c) => sum + Number(c.paid_amount), 0) || 0;
  const fundingProgress = Math.min((totalCollected / offering.purchase_price) * 100, 100).toFixed(1);
  const totalProfit = offering.sale_price - offering.purchase_price;

  // التحويل للمصري للعرض
  const purchaseEGP = isWatan ? offering.purchase_price * exchangeRate : offering.purchase_price;
  const saleEGP = isWatan ? offering.sale_price * exchangeRate : offering.sale_price;
  const totalProfitEGP = isWatan ? totalProfit * exchangeRate : totalProfit;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* هيدر الصفحة والزراير (تختفي في الطباعة) */}
      <div className="print:hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/offerings')}
          className="flex items-center gap-2 text-slate-500 hover:text-brand-dark transition-colors font-bold bg-white px-4 py-2 rounded-xl border shadow-sm"
        >
          <ArrowRight size={18} /> العودة لمحفظة الطروحات
        </button>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* مؤشر الدولار اللحظي */}
          <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl flex items-center gap-3 shadow-md border border-slate-800">
            <DollarSign size={16} className="text-emerald-400" />
            {loadingRate ? <RefreshCw size={14} className="animate-spin text-slate-400" /> : <span className="font-black text-emerald-400 text-sm tracking-wider" dir="ltr">1 USD = {exchangeRate.toFixed(2)} EGP</span>}
          </div>

          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg"
          >
            <Printer size={20} /> طباعة التقرير (PDF)
          </button>
        </div>
      </div>

      {/* ورقة التقرير المطبوعة */}
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-slate-200 print:shadow-none print:border-none print:p-0">
        
        {/* الترويسة */}
        <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-8">
          <div>
            <h1 className="text-3xl font-black text-brand-dark mb-2">تقرير تفاصيل الطرح العقاري</h1>
            <p className="text-slate-500 font-medium">دفتر الأملاك - نظام إدارة الاستثمارات</p>
          </div>
          <div className="text-left bg-slate-50 p-4 rounded-xl print:bg-transparent print:p-0 flex flex-col items-end gap-2">
            <div>
              <p className="text-sm text-slate-400 mb-1">حالة الطرح</p>
              <h3 className={`text-xl font-black ${offering.status === 'ساري' ? 'text-green-600' : 'text-slate-600'}`}>
                {offering.status}
              </h3>
            </div>
            {/* بادج نوع الطرح */}
            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 mt-1 ${isWatan ? 'bg-emerald-100 text-emerald-700 print:border print:border-emerald-300' : 'bg-blue-100 text-blue-700 print:border print:border-blue-300'}`}>
              {isWatan ? <Globe size={14}/> : <Home size={14}/>}
              {offering.offering_type || 'طرح محلي'}
            </span>
          </div>
        </div>

        {/* بيانات العقار */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-500 flex items-center gap-2 mb-1"><Building2 size={16}/> اسم الطرح / المشروع</p>
              <h2 className="text-2xl font-bold text-slate-800">{offering.title}</h2>
            </div>
            <div>
              <p className="text-sm text-slate-500 flex items-center gap-2 mb-1"><MapPin size={16}/> الموقع الجغرافي</p>
              <p className="text-lg font-semibold text-slate-700">{offering.location || 'لم يتم تحديد موقع تفصيلي'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 flex items-center gap-2 mb-1"><Info size={16}/> وصف الطرح</p>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {offering.description || 'لا يوجد وصف مضاف لهذا الطرح.'}
              </p>
            </div>
            
            {/* بار التقدم للتمويل */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4">
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-slate-600">اكتمال التمويل ({isWatan ? '$' : ''}{totalCollected.toLocaleString()} {isWatan ? '' : 'ج.م'})</span>
                <span className="text-brand-light">{fundingProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div className="bg-brand-light h-full" style={{ width: `${fundingProgress}%` }}></div>
              </div>
            </div>
          </div>

          {/* الأرقام المالية */}
          <div className="bg-brand-dark p-6 rounded-2xl text-white shadow-lg print:border print:border-slate-800 print:text-black print:bg-white h-fit">
            <h3 className="text-lg font-bold mb-6 border-b border-white/20 pb-4 print:border-slate-200">البيانات المالية للمشروع</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-brand-light/80 print:text-slate-500">سعر الشراء الإجمالي</span>
                <div className="text-left">
                  <span className="font-bold text-xl block">{isWatan ? '$' : ''}{Number(offering.purchase_price).toLocaleString()} {isWatan ? '' : 'ج.م'}</span>
                  {isWatan && <span className="text-xs text-brand-light/60 print:text-slate-400">≈ {purchaseEGP.toLocaleString()} ج.م</span>}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-brand-light/80 print:text-slate-500">سعر البيع المتوقع</span>
                <div className="text-left">
                  <span className="font-bold text-xl block">{isWatan ? '$' : ''}{Number(offering.sale_price).toLocaleString()} {isWatan ? '' : 'ج.م'}</span>
                  {isWatan && <span className="text-xs text-brand-light/60 print:text-slate-400">≈ {saleEGP.toLocaleString()} ج.م</span>}
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-white/20 print:border-slate-200">
                <span className="text-green-400 font-bold print:text-green-700">صافي الربح المتوقع</span>
                <div className="text-left">
                  <span className="font-black text-2xl text-green-400 print:text-green-700 block">+{isWatan ? '$' : ''}{totalProfit.toLocaleString()} {isWatan ? '' : 'ج.م'}</span>
                  {isWatan && <span className="text-xs text-green-400/70 print:text-green-700/70">≈ {totalProfitEGP.toLocaleString()} ج.م</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* جدول المستثمرين المشاركين */}
        <h4 className="text-xl font-bold text-slate-800 mb-4 border-r-4 border-brand-light pr-3 flex items-center gap-2">
          <Users size={24} className="text-brand-light"/> المستثمرون المساهمون في الطرح ({offering.contributions?.length || 0})
        </h4>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-100 text-brand-dark text-sm print:bg-slate-50 border-y border-slate-200">
                <th className="p-4">اسم المستثمر</th>
                <th className="p-4">المدينة / الهاتف</th>
                <th className="p-4">المبلغ المدفوع {isWatan ? '($)' : '(ج.م)'}</th>
                <th className="p-4">نسبة الملكية</th>
                <th className="p-4">نصيبه من الربح {isWatan ? '($)' : '(ج.م)'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {offering.contributions?.map((con, i) => {
                // نسبة الملكية تُحسب بنفس العملة (المبلغ المدفوع / سعر الشراء الكلي)
                const share = ((con.paid_amount / offering.purchase_price) * 100).toFixed(2);
                
                // الربح بالعملة الأصلية للطرح
                const profitCut = (totalProfit * (share / 100));
                const profitCutEGP = isWatan ? profitCut * exchangeRate : profitCut;

                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">{con.investors?.full_name}</td>
                    <td className="p-4 text-xs text-slate-500">{con.investors?.city} <br/> <span dir="ltr">{con.investors?.phone}</span></td>
                    <td className="p-4">
                      <span className="font-bold block" dir="ltr">{Number(con.paid_amount).toLocaleString()}</span>
                      {isWatan && <span className="text-[10px] text-slate-400">≈ {(Number(con.paid_amount) * exchangeRate).toLocaleString()} ج.م</span>}
                    </td>
                    <td className="p-4 font-bold text-brand-light">%{share}</td>
                    <td className="p-4">
                      <span className="font-bold text-green-600 block">+{profitCut.toLocaleString()}</span>
                      {isWatan && <span className="text-[10px] text-green-600/70">≈ {profitCutEGP.toLocaleString()} ج.م</span>}
                    </td>
                  </tr>
                );
              })}
              {(!offering.contributions || offering.contributions.length === 0) && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500 font-semibold">لم يشارك أي مستثمر في هذا الطرح حتى الآن.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
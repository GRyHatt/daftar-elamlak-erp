import { useState, useEffect } from 'react';
import { 
  Building2, PlusCircle, MapPin, Users, Edit2, Trash2, 
  ChevronDown, ChevronUp, FileText, AlignRight, Globe, 
  Home, DollarSign, RefreshCw, Search, Printer, Save, X
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Offerings() {
  const navigate = useNavigate();
  const [offerings, setOfferings] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // حالات الدولار
  const [exchangeRate, setExchangeRate] = useState(0); 
  const [loadingRate, setLoadingRate] = useState(true);

  // حالات الطباعة الذكية
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [offeringToPrint, setOfferingToPrint] = useState(null);
  const [printSettings, setPrintSettings] = useState({
    companyName: 'دفتر الأملاك العقارية',
    phones: '01000000000 - 01111111111'
  });

  const [newOffering, setNewOffering] = useState({ 
    title: '', 
    purchase_price: '', 
    sale_price: '', 
    status: 'ساري',
    location: '',
    description: '',
    offering_type: 'طرح محلي',
    expense_owner: '',
    expense_broker: '',
    expense_registration: '',
    expense_other: ''
  });

  useEffect(() => { 
    fetchOfferings(); 
    fetchLiveExchangeRate();
    
    // استرجاع بيانات الطباعة المحفوظة
    const savedPrintSettings = localStorage.getItem('companyPrintSettings');
    if (savedPrintSettings) {
      setPrintSettings(JSON.parse(savedPrintSettings));
    }
  }, []);

  const fetchLiveExchangeRate = async () => {
    setLoadingRate(true);
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      setExchangeRate(data.rates.EGP);
    } catch (error) {
      setExchangeRate(50);
    }
    setLoadingRate(false);
  };

  const fetchOfferings = async () => {
    const { data, error } = await supabase
      .from('offerings')
      .select(`*, contributions ( paid_amount, investors (full_name) )`)
      .order('created_at', { ascending: false });
    if (!error) setOfferings(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const offeringData = {
      title: newOffering.title, 
      purchase_price: Number(newOffering.purchase_price),
      sale_price: Number(newOffering.sale_price) || 0,
      total_price: Number(newOffering.purchase_price),
      location: newOffering.location,
      description: newOffering.description,
      status: newOffering.status,
      offering_type: newOffering.offering_type,
      expense_owner: Number(newOffering.expense_owner) || 0,
      expense_broker: Number(newOffering.expense_broker) || 0,
      expense_registration: Number(newOffering.expense_registration) || 0,
      expense_other: Number(newOffering.expense_other) || 0,
    };

    const currentUser = JSON.parse(localStorage.getItem('appUser'));
    if (currentUser) {
      await supabase.from('audit_logs').insert([{ 
        employee_name: currentUser.name, 
        action_details: `قام بـ ${editingId ? 'تعديل' : 'إضافة'} الطرح: ${newOffering.title}` 
      }]);
    }

    if (editingId) {
      const { error } = await supabase.from('offerings').update(offeringData).eq('id', editingId);
      if (error) alert('خطأ في التعديل: ' + error.message);
      else setEditingId(null);
    } else {
      const { error } = await supabase.from('offerings').insert([offeringData]);
      if (error) alert('خطأ في الإضافة: ' + error.message);
    }

    resetForm();
    fetchOfferings();
    setLoading(false);
  };

  const resetForm = () => {
    setNewOffering({ 
      title: '', purchase_price: '', sale_price: '', status: 'ساري', location: '', description: '', offering_type: 'طرح محلي',
      expense_owner: '', expense_broker: '', expense_registration: '', expense_other: ''
    });
  };

  const deleteOffering = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطرح؟')) {
      await supabase.from('offerings').delete().eq('id', id);
      fetchOfferings();
    }
  };

  const startEdit = (offering) => {
    setEditingId(offering.id);
    setNewOffering({
      title: offering.title,
      purchase_price: offering.purchase_price,
      sale_price: offering.sale_price || '',
      status: offering.status,
      location: offering.location || '',
      description: offering.description || '',
      offering_type: offering.offering_type || 'طرح محلي',
      expense_owner: offering.expense_owner || '',
      expense_broker: offering.expense_broker || '',
      expense_registration: offering.expense_registration || '',
      expense_other: offering.expense_other || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // دوال الطباعة
  const handleOpenPrintModal = (offering) => {
    setOfferingToPrint(offering);
    setShowPrintModal(true);
  };

  const executePrint = () => {
    // حفظ الإعدادات للمرات القادمة
    localStorage.setItem('companyPrintSettings', JSON.stringify(printSettings));
    setShowPrintModal(false);
    setTimeout(() => {
      window.print();
    }, 300); // تأخير بسيط عشان المودال يختفي قبل الطباعة
  };

  const filteredOfferings = offerings.filter(off => 
    off.title.includes(searchQuery) || (off.location && off.location.includes(searchQuery))
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20 relative">
      
      {/* ستايلات الطباعة */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .print-hide { display: none !important; }
        }
      `}</style>

      {/* مودال تجهيز الطباعة (تغيير اللوجو والأرقام) */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center print-hide">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Printer className="text-blue-600"/> إعدادات الترويسة والطباعة</h3>
              <button onClick={() => setShowPrintModal(false)} className="text-slate-400 hover:text-red-500"><X size={24}/></button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-bold text-slate-500">اسم الشركة / اللوجو النصي</label>
                <input type="text" value={printSettings.companyName} onChange={(e) => setPrintSettings({...printSettings, companyName: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50 font-bold focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">أرقام الهواتف (للتواصل)</label>
                <input type="text" value={printSettings.phones} onChange={(e) => setPrintSettings({...printSettings, phones: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50 font-bold focus:border-blue-500 outline-none" dir="ltr" />
              </div>
              <p className="text-[10px] text-slate-400 font-bold text-center">سيتم حفظ هذه البيانات تلقائياً للمرات القادمة.</p>
            </div>
            <button onClick={executePrint} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-black flex justify-center items-center gap-2 shadow-lg">
              <Save size={18}/> حفظ وطباعة التقرير
            </button>
          </div>
        </div>
      )}

      {/* ---------------- الهيكل الأساسي للصفحة (مخفي وقت الطباعة) ---------------- */}
      <div className="print-hide space-y-8">
        
        {/* الهيدر */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg"><Building2 size={28} /></div>
            <div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tight">إدارة محفظة الطروحات</h2>
               <p className="text-slate-500 font-bold text-sm">تسجيل المشاريع، وحساب صافي الأرباح بعد البيع.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
               <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث في المشاريع..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 font-bold text-sm" />
               <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />
            </div>
            <div className="bg-slate-900 text-white px-4 py-3 rounded-xl flex items-center gap-3 shadow-md border border-slate-800">
              <DollarSign size={16} className="text-emerald-400" />
              {loadingRate ? <RefreshCw size={14} className="animate-spin" /> : <span className="font-black text-emerald-400 text-xs tracking-wider" dir="ltr">1 USD = {exchangeRate.toFixed(2)} EGP</span>}
            </div>
          </div>
        </div>

        {/* فورم الإضافة والتعديل */}
        <div className={`bg-white p-8 rounded-[2rem] shadow-sm border transition-all ${editingId ? 'border-amber-400 ring-4 ring-amber-50' : 'border-slate-100'}`}>
          <h3 className="text-xl font-black mb-6 flex items-center gap-2 border-b pb-4 text-slate-800">
            {editingId ? <><Edit2 size={22} className="text-amber-500" /> تعديل بيانات الطرح والمصروفات</> : <><PlusCircle size={22} className="text-blue-600" /> تسجيل طرح جديد</>}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-500">اسم الطرح / المشروع *</label>
                <input type="text" required value={newOffering.title} onChange={(e) => setNewOffering({...newOffering, title: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 font-bold" placeholder="مثال: أرض المنيا الجديدة" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">نوع الطرح</label>
                <div className="flex bg-slate-50 rounded-xl border p-1">
                  <button type="button" onClick={() => setNewOffering({...newOffering, offering_type: 'طرح محلي'})} className={`flex-1 py-3 text-xs font-black rounded-lg transition-all ${newOffering.offering_type === 'طرح محلي' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>محلي</button>
                  <button type="button" onClick={() => setNewOffering({...newOffering, offering_type: 'بيت وطن'})} className={`flex-1 py-3 text-xs font-black rounded-lg transition-all ${newOffering.offering_type === 'بيت وطن' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-slate-500'}`}>بيت وطن</button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">حالة الطرح</label>
                <select value={newOffering.status} onChange={(e) => setNewOffering({...newOffering, status: e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-black ${newOffering.status === 'تم البيع' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <option value="ساري">ساري (تحت الاستثمار)</option>
                  <option value="تم البيع">تم البيع (تصفية وأرباح)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">إجمالي تكلفة الشراء {newOffering.offering_type === 'بيت وطن' ? '($)' : '(ج.م)'} *</label>
                <input type="number" required value={newOffering.purchase_price} onChange={(e) => setNewOffering({...newOffering, purchase_price: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><MapPin size={14}/> الموقع / العنوان</label>
                <input type="text" value={newOffering.location} onChange={(e) => setNewOffering({...newOffering, location: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 font-bold" />
              </div>
            </div>

            {/* قسم تصفية الأرباح والمصروفات (يظهر فقط لو تم البيع) */}
            {newOffering.status === 'تم البيع' && (
              <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-5 animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="text-emerald-400"/>
                  <h4 className="text-lg font-black text-white">تصفية مالية والمصروفات بعد البيع</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">سعر البيع الفعلي *</label>
                    <input type="number" required={newOffering.status === 'تم البيع'} value={newOffering.sale_price} onChange={(e) => setNewOffering({...newOffering, sale_price: e.target.value})} className="w-full p-3 rounded-xl border-none bg-white/10 text-white outline-none focus:bg-white/20 font-black placeholder-white/30" placeholder="إجمالي البيع" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">رسوم الاسم المسجل</label>
                    <input type="number" value={newOffering.expense_owner} onChange={(e) => setNewOffering({...newOffering, expense_owner: e.target.value})} className="w-full p-3 rounded-xl border-none bg-white/5 text-white outline-none focus:bg-white/10 font-bold" placeholder="خصميات" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">عمولة وسيط / سمسار</label>
                    <input type="number" value={newOffering.expense_broker} onChange={(e) => setNewOffering({...newOffering, expense_broker: e.target.value})} className="w-full p-3 rounded-xl border-none bg-white/5 text-white outline-none focus:bg-white/10 font-bold" placeholder="خصميات" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">مصاريف تسجيل ونقل</label>
                    <input type="number" value={newOffering.expense_registration} onChange={(e) => setNewOffering({...newOffering, expense_registration: e.target.value})} className="w-full p-3 rounded-xl border-none bg-white/5 text-white outline-none focus:bg-white/10 font-bold" placeholder="خصميات" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">أي مصاريف أخرى</label>
                    <input type="number" value={newOffering.expense_other} onChange={(e) => setNewOffering({...newOffering, expense_other: e.target.value})} className="w-full p-3 rounded-xl border-none bg-white/5 text-white outline-none focus:bg-white/10 font-bold" placeholder="خصميات" />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={loading} className={`flex-1 p-4 rounded-2xl font-black text-white shadow-xl transition-all ${editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {editingId ? 'تحديث وتطبيق الحسابات' : 'اعتماد وحفظ المشروع'}
              </button>
              {editingId && (
                <button type="button" onClick={() => { resetForm(); setEditingId(null); }} className="px-8 py-4 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">
                  إلغاء التعديل
                </button>
              )}
            </div>
          </form>
        </div>

        {/* عرض الطروحات */}
        <div className="grid grid-cols-1 gap-8">
          {filteredOfferings.map((offering) => {
            const isWatan = offering.offering_type === 'بيت وطن';
            const isSold = offering.status === 'تم البيع';
            
            const purchaseEGP = isWatan ? offering.purchase_price * exchangeRate : offering.purchase_price;
            
            // حسابات البيع الصافي
            const totalExpenses = (Number(offering.expense_owner) || 0) + (Number(offering.expense_broker) || 0) + (Number(offering.expense_registration) || 0) + (Number(offering.expense_other) || 0);
            const netProfit = isSold ? (offering.sale_price - offering.purchase_price - totalExpenses) : 0;
            
            const totalCollectedEGP = offering.contributions?.reduce((sum, c) => sum + (isWatan ? Number(c.paid_amount) * exchangeRate : Number(c.paid_amount)), 0) || 0;
            const fundingProgress = Math.min((totalCollectedEGP / purchaseEGP) * 100, 100).toFixed(1);

            return (
              <div key={offering.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden group">
                <div className="p-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-2xl font-black text-slate-900">{offering.title}</h4>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black ${isWatan ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        {isWatan ? <Globe size={12} className="inline mr-1" /> : <Home size={12} className="inline mr-1" />}
                        {offering.offering_type || 'طرح محلي'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black ${isSold ? 'bg-slate-800 text-white' : 'bg-amber-100 text-amber-700'}`}>
                        {offering.status}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-500"><MapPin size={14} className="inline mr-1"/> {offering.location}</p>
                  </div>

                  <div className="flex-1 grid grid-cols-3 gap-6 text-center xl:border-x border-slate-100 px-6 w-full xl:w-auto">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">تكلفة الشراء</p>
                      <p className="font-black text-slate-800 text-lg">{isWatan ? '$' : ''}{Number(offering.purchase_price).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">إجمالي المبيعات</p>
                      <p className={`font-black text-lg ${isSold ? 'text-blue-600' : 'text-slate-300'}`}>{isSold ? `${isWatan ? '$' : ''}${Number(offering.sale_price).toLocaleString()}` : 'لم يتم البيع'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">صافي الربح</p>
                      {isSold ? (
                        <p className="font-black text-emerald-600 text-lg" dir="ltr">+{netProfit.toLocaleString()}</p>
                      ) : (
                        <p className="text-xs font-bold text-slate-400 mt-2">معلق</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => handleOpenPrintModal(offering)} className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg transition-colors"><Printer size={20}/></button>
                    <button onClick={() => startEdit(offering)} className="p-3 bg-amber-50 hover:bg-amber-500 text-amber-600 hover:text-white rounded-xl transition-colors"><Edit2 size={20}/></button>
                    <button onClick={() => deleteOffering(offering.id)} className="p-3 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white rounded-xl transition-colors"><Trash2 size={20}/></button>
                  </div>
                </div>

                {/* بار التقدم */}
                <div className="px-8 py-4 bg-slate-50 border-t border-slate-100">
                  <div className="flex justify-between text-xs font-black mb-2 text-slate-600">
                    <span>حجم السيولة المجمعة للاستثمار ({totalCollectedEGP.toLocaleString()} ج.م)</span>
                    <span className="text-blue-600">{fundingProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${fundingProgress}%` }}></div>
                  </div>
                </div>

                {/* قائمة المستثمرين */}
                <button onClick={() => setExpandedCards(p => ({...p, [offering.id]: !p[offering.id]}))} className="w-full p-4 bg-white flex justify-between items-center text-sm font-black border-t border-slate-100 hover:bg-slate-50">
                  <span className="flex items-center gap-2"><Users size={18} className="text-blue-600"/> المساهمين ونسب الأرباح ({offering.contributions?.length || 0})</span>
                  {expandedCards[offering.id] ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                </button>

                {expandedCards[offering.id] && (
                  <div className="p-6 bg-slate-50 border-t border-slate-100">
                    <table className="w-full text-right text-sm">
                       <thead>
                         <tr className="text-slate-400 font-bold border-b border-slate-200">
                           <th className="pb-3">المستثمر</th>
                           <th className="pb-3">المدفوع</th>
                           <th className="pb-3">نسبة الملكية</th>
                           <th className="pb-3 text-left">الربح الصافي (بعد المصروفات)</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                        {offering.contributions?.map((con, i) => {
                          const contributionEGP = isWatan ? con.paid_amount * exchangeRate : con.paid_amount;
                          const share = (contributionEGP / purchaseEGP);
                          const sharePercentage = (share * 100).toFixed(2);
                          const profitEGP = isSold ? (netProfit * (isWatan ? exchangeRate : 1) * share).toLocaleString() : 'معلق حتى البيع';
                          
                          return (
                            <tr key={i} className="hover:bg-white transition-colors">
                              <td className="py-4 font-black text-slate-800">{con.investors?.full_name}</td>
                              <td className="py-4 font-bold" dir="ltr">{Number(con.paid_amount).toLocaleString()}</td>
                              <td className="py-4 font-black text-blue-600">%{sharePercentage}</td>
                              <td className={`py-4 font-black text-left ${isSold ? 'text-emerald-600' : 'text-slate-400'}`} dir="ltr">
                                {isSold ? `+${profitEGP} ج.م` : profitEGP}
                              </td>
                            </tr>
                          );
                        })}
                       </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------------- التصميم الخاص للطباعة (يظهر فقط في الطباعة) ---------------- */}
      {offeringToPrint && (
        <div id="printable-report" className="hidden print:block font-sans" dir="rtl">
          {/* الترويسة المخصصة (Letterhead) */}
          <div className="flex justify-between items-end border-b-4 border-slate-900 pb-6 mb-8">
             <div>
                <h1 className="text-4xl font-black text-slate-900">{printSettings.companyName}</h1>
                <p className="text-slate-600 font-bold mt-2">تقرير التصفية المالية وحساب الأرباح</p>
             </div>
             <div className="text-left">
                <p className="text-sm font-bold text-slate-500 mb-1">هواتف التواصل</p>
                <p className="font-black text-slate-800" dir="ltr">{printSettings.phones}</p>
             </div>
          </div>

          {/* تفاصيل المشروع */}
          <div className="bg-slate-100 p-6 rounded-2xl mb-8 flex justify-between">
             <div>
               <p className="text-sm text-slate-500 font-bold mb-1">اسم المشروع</p>
               <h3 className="text-2xl font-black text-slate-900">{offeringToPrint.title}</h3>
               <p className="text-sm font-bold text-slate-600 mt-1">{offeringToPrint.location}</p>
             </div>
             <div className="text-left">
               <p className="text-sm text-slate-500 font-bold mb-1">الحالة / النوع</p>
               <p className="text-xl font-black text-slate-900">{offeringToPrint.status} | {offeringToPrint.offering_type}</p>
               <p className="text-sm font-bold text-slate-600 mt-1">تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}</p>
             </div>
          </div>

          {/* الملخص المالي والتصفية */}
          <h4 className="text-xl font-black text-slate-900 mb-4 border-r-4 border-slate-900 pr-3">الملخص المالي للمشروع</h4>
          <div className="grid grid-cols-2 gap-6 mb-8">
             <div className="border border-slate-300 p-4 rounded-xl">
               <p className="font-bold text-slate-600 flex justify-between mb-2"><span>تكلفة الشراء:</span> <span>{Number(offeringToPrint.purchase_price).toLocaleString()}</span></p>
               <p className="font-bold text-slate-600 flex justify-between mb-2"><span>إجمالي البيع:</span> <span>{offeringToPrint.status === 'تم البيع' ? Number(offeringToPrint.sale_price).toLocaleString() : 'لم يتم'}</span></p>
             </div>
             <div className="border border-slate-300 p-4 rounded-xl">
               <p className="font-bold text-red-600 flex justify-between mb-1 text-sm"><span>رسوم ومصروفات التسجيل:</span> <span>- {Number(offeringToPrint.expense_registration || 0).toLocaleString()}</span></p>
               <p className="font-bold text-red-600 flex justify-between mb-1 text-sm"><span>عمولات وسطاء:</span> <span>- {Number(offeringToPrint.expense_broker || 0).toLocaleString()}</span></p>
               <p className="font-bold text-red-600 flex justify-between mb-1 text-sm"><span>رسوم اسم وعمولات أخرى:</span> <span>- {(Number(offeringToPrint.expense_owner || 0) + Number(offeringToPrint.expense_other || 0)).toLocaleString()}</span></p>
               <div className="border-t border-slate-300 my-2"></div>
               <p className="font-black text-emerald-700 flex justify-between text-lg">
                 <span>صافي الربح القابل للتوزيع:</span> 
                 <span>
                   {offeringToPrint.status === 'تم البيع' 
                     ? (offeringToPrint.sale_price - offeringToPrint.purchase_price - (Number(offeringToPrint.expense_registration||0) + Number(offeringToPrint.expense_broker||0) + Number(offeringToPrint.expense_owner||0) + Number(offeringToPrint.expense_other||0))).toLocaleString()
                     : '0'}
                 </span>
               </p>
             </div>
          </div>

          {/* جدول المساهمين */}
          <h4 className="text-xl font-black text-slate-900 mb-4 border-r-4 border-slate-900 pr-3">نصيب المساهمين من الأرباح</h4>
          <table className="w-full text-right border-collapse border border-slate-300">
             <thead>
               <tr className="bg-slate-100">
                 <th className="border border-slate-300 p-3">اسم المستثمر</th>
                 <th className="border border-slate-300 p-3">المدفوع</th>
                 <th className="border border-slate-300 p-3 text-center">نسبة الملكية</th>
                 <th className="border border-slate-300 p-3">صافي الربح المستحق</th>
               </tr>
             </thead>
             <tbody>
               {offeringToPrint.contributions?.map((con, i) => {
                  const isWatan = offeringToPrint.offering_type === 'بيت وطن';
                  const purchaseEGP = isWatan ? offeringToPrint.purchase_price * exchangeRate : offeringToPrint.purchase_price;
                  const contributionEGP = isWatan ? con.paid_amount * exchangeRate : con.paid_amount;
                  const share = (contributionEGP / purchaseEGP);
                  const sharePercentage = (share * 100).toFixed(2);
                  
                  const totalExpenses = (Number(offeringToPrint.expense_owner) || 0) + (Number(offeringToPrint.expense_broker) || 0) + (Number(offeringToPrint.expense_registration) || 0) + (Number(offeringToPrint.expense_other) || 0);
                  const netProfit = offeringToPrint.status === 'تم البيع' ? (offeringToPrint.sale_price - offeringToPrint.purchase_price - totalExpenses) : 0;
                  const profitEGP = offeringToPrint.status === 'تم البيع' ? (netProfit * (isWatan ? exchangeRate : 1) * share).toLocaleString() : 'معلق';

                  return (
                    <tr key={i}>
                      <td className="border border-slate-300 p-3 font-bold">{con.investors?.full_name}</td>
                      <td className="border border-slate-300 p-3" dir="ltr">{Number(con.paid_amount).toLocaleString()}</td>
                      <td className="border border-slate-300 p-3 text-center font-bold">%{sharePercentage}</td>
                      <td className="border border-slate-300 p-3 font-black text-emerald-700">{profitEGP}</td>
                    </tr>
                  );
               })}
             </tbody>
          </table>
          
          <div className="mt-16 flex justify-between px-10">
             <div className="text-center">
                <p className="font-bold mb-8">إدارة الحسابات</p>
                <p>_______________________</p>
             </div>
             <div className="text-center">
                <p className="font-bold mb-8">اعتماد الإدارة</p>
                <p>_______________________</p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
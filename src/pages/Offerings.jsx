import { useState, useEffect } from 'react';
import { Building2, PlusCircle, MapPin, Users, Edit2, Trash2, CheckCircle, Clock, ChevronDown, ChevronUp, FileText, AlignRight, Globe, Home, DollarSign, RefreshCw, Search } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Offerings() {
  const navigate = useNavigate();
  const [offerings, setOfferings] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // حالات الدولار والتحديث اللحظي
  const [exchangeRate, setExchangeRate] = useState(0); 
  const [loadingRate, setLoadingRate] = useState(true);

  const [newOffering, setNewOffering] = useState({ 
    title: '', 
    purchase_price: '', 
    sale_price: '', 
    status: 'ساري',
    location: '',
    description: '',
    offering_type: 'طرح محلي'
  });

  useEffect(() => { 
    fetchOfferings(); 
    fetchLiveExchangeRate();
  }, []);

  // جلب سعر الدولار اللحظي من الإنترنت
  const fetchLiveExchangeRate = async () => {
    setLoadingRate(true);
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      setExchangeRate(data.rates.EGP); 
    } catch (error) {
      console.error('خطأ في جلب السعر:', error);
      setExchangeRate(50); // سعر احتياطي في حال فشل الاتصال
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
      sale_price: Number(newOffering.sale_price),
      total_price: Number(newOffering.purchase_price), // للتوافق مع الإصدارات القديمة
      location: newOffering.location,
      description: newOffering.description,
      status: newOffering.status,
      offering_type: newOffering.offering_type
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

    setNewOffering({ title: '', purchase_price: '', sale_price: '', status: 'ساري', location: '', description: '', offering_type: 'طرح محلي' });
    fetchOfferings();
    setLoading(false);
  };

  const deleteOffering = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطرح؟')) {
      await supabase.from('offerings').delete().eq('id', id);
      fetchOfferings();
    }
  };

  const toggleStatus = async (offering) => {
    const nextStatus = offering.status === 'ساري' ? 'انتهى' : 'ساري';
    await supabase.from('offerings').update({ status: nextStatus }).eq('id', offering.id);
    fetchOfferings();
  };

  const startEdit = (offering) => {
    setEditingId(offering.id);
    setNewOffering({
      title: offering.title,
      purchase_price: offering.purchase_price,
      sale_price: offering.sale_price,
      status: offering.status,
      location: offering.location || '',
      description: offering.description || '',
      offering_type: offering.offering_type || 'طرح محلي'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredOfferings = offerings.filter(off => 
    off.title.includes(searchQuery) || (off.location && off.location.includes(searchQuery))
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* الهيدر ومؤشر العملة */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-light/10 rounded-xl text-brand-light"><Building2 size={28} /></div>
          <h2 className="text-3xl font-bold text-brand-dark">إدارة محفظة الطروحات</h2>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
             <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث في المشاريع..." className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 outline-none focus:border-brand-light text-sm" />
             <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          </div>
          <div className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-3 shadow-md border border-slate-800">
            <DollarSign size={16} className="text-emerald-400" />
            {loadingRate ? <RefreshCw size={14} className="animate-spin" /> : <span className="font-black text-emerald-400 text-xs tracking-wider" dir="ltr">1 USD = {exchangeRate.toFixed(2)} EGP</span>}
          </div>
        </div>
      </div>

      {/* فورم الإضافة والتعديل */}
      <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          {editingId ? <Edit2 size={18} className="text-orange-500" /> : <PlusCircle size={18} className="text-brand-light" />}
          {editingId ? 'تعديل بيانات الطرح' : 'إضافة طرح جديد للمحفظة'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">اسم الطرح</label>
              <input type="text" required value={newOffering.title} onChange={(e) => setNewOffering({...newOffering, title: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50 outline-none focus:border-brand-light" placeholder="مثال: أرض المنيا الجديدة" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">نوع الطرح</label>
              <div className="flex bg-slate-50 rounded-xl border p-1">
                <button type="button" onClick={() => setNewOffering({...newOffering, offering_type: 'طرح محلي'})} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${newOffering.offering_type === 'طرح محلي' ? 'bg-white text-brand-light shadow-sm' : 'text-slate-500'}`}>محلي</button>
                <button type="button" onClick={() => setNewOffering({...newOffering, offering_type: 'بيت وطن'})} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${newOffering.offering_type === 'بيت وطن' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-slate-500'}`}>بيت وطن</button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">سعر الشراء {newOffering.offering_type === 'بيت وطن' ? '($)' : '(ج.م)'}</label>
              <input type="number" required value={newOffering.purchase_price} onChange={(e) => setNewOffering({...newOffering, purchase_price: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50 outline-none focus:border-brand-light" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">سعر البيع {newOffering.offering_type === 'بيت وطن' ? '($)' : '(ج.م)'}</label>
              <input type="number" required value={newOffering.sale_price} onChange={(e) => setNewOffering({...newOffering, sale_price: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50 outline-none focus:border-brand-light" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><MapPin size={12}/> الموقع / العنوان</label>
              <input type="text" value={newOffering.location} onChange={(e) => setNewOffering({...newOffering, location: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50 outline-none focus:border-brand-light" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><AlignRight size={12}/> الوصف التفصيلي</label>
              <textarea rows="1" value={newOffering.description} onChange={(e) => setNewOffering({...newOffering, description: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50 outline-none focus:border-brand-light resize-none"></textarea>
            </div>
          </div>

          <button type="submit" disabled={loading} className={`w-full p-3 rounded-xl font-bold text-white shadow-lg transition-all ${editingId ? 'bg-orange-500' : 'bg-brand-light'}`}>
            {editingId ? 'تحديث بيانات الطرح' : 'اعتماد وحفظ الطرح'}
          </button>
        </form>
      </div>

      {/* عرض الطروحات */}
      <div className="grid grid-cols-1 gap-6">
        {filteredOfferings.map((offering) => {
          const isWatan = offering.offering_type === 'بيت وطن';
          
          // تحويل سعر شراء المشروع بالكامل للجنيه للمقارنة مع السيولة المجمعة
          const purchaseEGP = isWatan ? offering.purchase_price * exchangeRate : offering.purchase_price;
          
          // الحسبة الذكية للسيولة المجمعة:
          // لو المشروع بيت وطن، بنضرب مبالغ المساهمات في سعر الدولار الحالي قبل الجمع
          const totalCollectedEGP = offering.contributions?.reduce((sum, c) => {
             const amount = isWatan ? Number(c.paid_amount) * exchangeRate : Number(c.paid_amount);
             return sum + amount;
          }, 0) || 0;

          const fundingProgress = Math.min((totalCollectedEGP / purchaseEGP) * 100, 100).toFixed(1);
          const totalProfit = offering.sale_price - offering.purchase_price;
          const isExpanded = expandedCards[offering.id];

          return (
            <div key={offering.id} className="bg-white rounded-2xl shadow-sm border-2 border-transparent hover:border-brand-light/30 overflow-hidden">
              <div className="p-6 bg-slate-50/50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-2xl font-black text-slate-800">{offering.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${isWatan ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                      {isWatan ? <Globe size={10} className="inline mr-1" /> : <Home size={10} className="inline mr-1" />}
                      {offering.offering_type || 'طرح محلي'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500"><MapPin size={14} className="inline mr-1"/> {offering.location}</p>
                </div>

                <div className="flex-1 grid grid-cols-3 gap-4 text-center xl:border-x px-4 w-full xl:w-auto">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">الشراء</p>
                    <p className="font-bold text-slate-800">{isWatan ? '$' : ''}{Number(offering.purchase_price).toLocaleString()}</p>
                  </div>
                  <div className="border-x border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">البيع</p>
                    <p className="font-bold text-blue-600">{isWatan ? '$' : ''}{Number(offering.sale_price).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">الربح</p>
                    <p className="font-bold text-green-600">{isWatan ? '$' : '+'}{totalProfit.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => navigate(`/offering/${offering.id}`)} className="p-3 bg-brand-light text-white rounded-xl font-bold text-sm"><FileText size={16}/></button>
                  <button onClick={() => startEdit(offering)} className="p-3 bg-white rounded-xl border text-orange-600"><Edit2 size={20}/></button>
                  <button onClick={() => deleteOffering(offering.id)} className="p-3 bg-white rounded-xl border text-red-600"><Trash2 size={20}/></button>
                </div>
              </div>

              {/* بار التقدم الذكي */}
              <div className="px-6 py-4 bg-white border-t">
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-600">اكتمال التمويل ({totalCollectedEGP.toLocaleString()} ج.م)</span>
                  <span className="text-brand-light">{fundingProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-brand-light h-full transition-all duration-1000" style={{ width: `${fundingProgress}%` }}></div>
                </div>
              </div>

              {/* قائمة المستثمرين */}
              <button onClick={() => setExpandedCards(p => ({...p, [offering.id]: !p[offering.id]}))} className="w-full p-4 bg-slate-50 flex justify-between items-center text-sm font-bold border-t">
                <span><Users size={16} className="inline mr-2 text-brand-light"/> مستثمرو الطرح ({offering.contributions?.length || 0})</span>
                {expandedCards[offering.id] ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
              </button>

              {expandedCards[offering.id] && (
                <div className="p-4 bg-white border-t space-y-2">
                  {offering.contributions?.map((con, i) => {
                    // حساب حصة المستثمر بناءً على مدفوعاته بالجنيه مقابل سعر الشراء الإجمالي بالجنيه
                    const contributionEGP = isWatan ? con.paid_amount * exchangeRate : con.paid_amount;
                    const share = ((contributionEGP / purchaseEGP) * 100).toFixed(2);
                    
                    // حساب الربح المتوقع بالجنيه
                    const profitEGP = (totalProfit * (isWatan ? exchangeRate : 1) * (share / 100)).toLocaleString();
                    
                    return (
                      <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl text-sm">
                        <span className="font-bold">{con.investors?.full_name}</span>
                        <div className="flex gap-4">
                           <span className="text-slate-500">الملكية: %{share}</span>
                           <span className="text-green-600 font-bold">الربح: +{profitEGP} ج.م</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
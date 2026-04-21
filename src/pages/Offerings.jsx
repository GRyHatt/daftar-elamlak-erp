import { useState, useEffect } from 'react';
import { Building2, PlusCircle, MapPin, Users, Edit2, Trash2, CheckCircle, Clock, ChevronDown, ChevronUp, FileText, AlignRight } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Offerings() {
  const navigate = useNavigate();
  const [offerings, setOfferings] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});

  const [newOffering, setNewOffering] = useState({ 
    title: '', 
    purchase_price: '', 
    sale_price: '', 
    status: 'ساري',
    location: '',
    description: ''
  });

  useEffect(() => { fetchOfferings(); }, []);

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
      total_price: Number(newOffering.purchase_price), // لحل مشكلة الداتا بيز القديمة
      location: newOffering.location,
      description: newOffering.description,
      status: newOffering.status 
    };
    
    const currentUser = JSON.parse(localStorage.getItem('appUser'));
await supabase.from('audit_logs').insert([{ 
  employee_name: currentUser.name, 
  action_details: `قام بـ ${editingId ? 'تعديل' : 'إضافة'} الطرح: ${newOffering.title}` 
}]);
 
    if (editingId) {
      const { error } = await supabase.from('offerings').update(offeringData).eq('id', editingId);
      if (error) alert('خطأ في التعديل: ' + error.message);
      else setEditingId(null);
    } else {
      const { error } = await supabase.from('offerings').insert([offeringData]);
      if (error) alert('خطأ في الإضافة: ' + error.message);
    }

    setNewOffering({ title: '', purchase_price: '', sale_price: '', status: 'ساري', location: '', description: '' });
    fetchOfferings();
    setLoading(false);
  };

  const deleteOffering = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الطرح؟ سيتم حذف مساهمات المستثمرين به!')) {
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
      description: offering.description || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleCard = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-brand-light/10 rounded-xl text-brand-light"><Building2 size={28} /></div>
        <h2 className="text-3xl font-bold text-brand-dark">إدارة محفظة الطروحات</h2>
      </div>

      {/* فورم الإضافة والتعديل */}
      <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          {editingId ? <Edit2 size={18} className="text-orange-500" /> : <PlusCircle size={18} className="text-brand-light" />}
          {editingId ? 'تعديل بيانات الطرح' : 'إضافة طرح جديد للمحفظة'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* السطر الأول: البيانات الأساسية */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">اسم الطرح</label>
              <input type="text" required value={newOffering.title} onChange={(e) => setNewOffering({...newOffering, title: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50 outline-none focus:border-brand-light" placeholder="مثال: أرض المنيا الجديدة" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">سعر الشراء (ج.م)</label>
              <input type="number" required value={newOffering.purchase_price} onChange={(e) => setNewOffering({...newOffering, purchase_price: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50 outline-none focus:border-brand-light" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">سعر البيع المتوقع (ج.م)</label>
              <input type="number" required value={newOffering.sale_price} onChange={(e) => setNewOffering({...newOffering, sale_price: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50 outline-none focus:border-brand-light" />
            </div>
          </div>

          {/* السطر الثاني: الموقع والوصف */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><MapPin size={12}/> الموقع / العنوان</label>
              <input type="text" value={newOffering.location} onChange={(e) => setNewOffering({...newOffering, location: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50 outline-none focus:border-brand-light" placeholder="أدخل تفاصيل الموقع..." />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><AlignRight size={12}/> وصف تفصيلي</label>
              <textarea rows="1" value={newOffering.description} onChange={(e) => setNewOffering({...newOffering, description: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50 outline-none focus:border-brand-light resize-none" placeholder="أدخل دراسة الجدوى أو وصف الأرض..."></textarea>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
             <button type="submit" disabled={loading} className={`flex-1 p-3 rounded-xl font-bold text-white shadow-lg transition-all ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-brand-light hover:bg-brand-hover'}`}>
                {editingId ? 'تحديث بيانات الطرح' : 'اعتماد وحفظ الطرح'}
             </button>
             {editingId && <button type="button" onClick={() => {setEditingId(null); setNewOffering({title:'', purchase_price:'', sale_price:'', status:'ساري', location:'', description:''});}} className="bg-slate-200 hover:bg-slate-300 p-3 rounded-xl font-bold transition-colors">إلغاء التعديل</button>}
          </div>
        </form>
      </div>

      {/* عرض الطروحات في كروت عريضة */}
      <div className="grid grid-cols-1 gap-6">
        {offerings.map((offering) => {
          const totalCollected = offering.contributions?.reduce((sum, c) => sum + Number(c.paid_amount), 0) || 0;
          const fundingProgress = Math.min((totalCollected / offering.purchase_price) * 100, 100).toFixed(1);
          const totalProfit = offering.sale_price - offering.purchase_price;
          const isExpanded = expandedCards[offering.id];
          
          return (
            <div key={offering.id} className={`bg-white rounded-2xl shadow-sm border-2 transition-all overflow-hidden ${offering.status === 'انتهى' ? 'border-slate-100 opacity-80' : 'border-transparent hover:border-brand-light/30 shadow-blue-900/5'}`}>
              
              {/* هيدر الكارت */}
              <div className="p-6 bg-slate-50/50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                
                {/* اسم الطرح والموقع */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-2xl font-black text-slate-800">{offering.title}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${offering.status === 'ساري' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                      {offering.status === 'ساري' ? '● ساري حالياً' : '✓ طرح منتهي'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 flex items-center gap-1"><MapPin size={14}/> {offering.location || 'لم يتم تحديد الموقع التفصيلي'}</p>
                </div>

                {/* الأرقام المالية */}
                <div className="flex-1 grid grid-cols-3 gap-2 md:gap-4 text-center xl:border-x px-0 xl:px-4 w-full xl:w-auto border-y xl:border-y-0 py-4 xl:py-0">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 font-bold uppercase">سعر الشراء</p>
                    <p className="text-sm md:text-lg font-bold text-slate-800">{Number(offering.purchase_price).toLocaleString()}</p>
                  </div>
                  <div className="space-y-1 border-x border-slate-200">
                    <p className="text-xs text-slate-400 font-bold uppercase">سعر البيع</p>
                    <p className="text-sm md:text-lg font-bold text-blue-600">{Number(offering.sale_price).toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 font-bold uppercase">الربح الصافي</p>
                    <p className="text-sm md:text-lg font-bold text-green-600">+{totalProfit.toLocaleString()}</p>
                  </div>
                </div>

                {/* أزرار التحكم */}
                <div className="flex gap-2 w-full xl:w-auto justify-end">
                  <button onClick={() => navigate(`/offering/${offering.id}`)} className="p-3 bg-brand-light text-white rounded-xl flex items-center gap-2 text-sm font-bold shadow-sm hover:bg-brand-hover transition-colors">
                    <FileText size={16}/> التفاصيل
                  </button>
                  <button onClick={() => toggleStatus(offering)} className="p-3 bg-white rounded-xl border shadow-sm hover:bg-slate-50 text-slate-600" title="تغيير الحالة">
                    {offering.status === 'ساري' ? <CheckCircle size={20} /> : <Clock size={20} />}
                  </button>
                  <button onClick={() => startEdit(offering)} className="p-3 bg-white rounded-xl border shadow-sm hover:bg-orange-50 text-orange-600" title="تعديل"><Edit2 size={20}/></button>
                  <button onClick={() => deleteOffering(offering.id)} className="p-3 bg-white rounded-xl border shadow-sm hover:bg-red-50 text-red-600" title="حذف"><Trash2 size={20}/></button>
                </div>
              </div>

              {/* بار التقدم (Funding Progress) */}
              <div className="px-6 py-4 border-t bg-white">
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-slate-600">السيولة المجمعة من المستثمرين ({totalCollected.toLocaleString()} ج.م)</span>
                  <span className="text-brand-light">{fundingProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-brand-light h-full transition-all duration-1000" style={{ width: `${fundingProgress}%` }}></div>
                </div>
              </div>

              {/* زر القائمة المنسدلة للمستثمرين */}
              <button onClick={() => toggleCard(offering.id)} className="w-full p-4 bg-slate-50 hover:bg-slate-100 transition-colors flex justify-between items-center text-slate-700 font-bold border-t">
                <span className="flex items-center gap-2"><Users size={18} className="text-brand-light"/> مستثمرو الطرح ({offering.contributions?.length || 0})</span>
                {isExpanded ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
              </button>

              {/* محتوى القائمة المنسدلة */}
              {isExpanded && (
                <div className="p-6 bg-white border-t space-y-3 animate-fade-in">
                  {offering.contributions?.map((con, i) => {
                    const share = ((con.paid_amount / offering.purchase_price) * 100).toFixed(2);
                    const profitCut = (totalProfit * (share / 100)).toLocaleString();
                    return (
                      <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-brand-light/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-brand-dark shadow-sm">
                            {con.investors?.full_name.substring(0,2)}
                          </div>
                          <div>
                            <p className="text-base font-bold text-slate-800">{con.investors?.full_name}</p>
                            <p className="text-xs font-semibold text-slate-500">مساهمة: {con.paid_amount.toLocaleString()} ج.م</p>
                          </div>
                        </div>
                        <div className="text-left flex items-center gap-6">
                          <div>
                            <p className="text-xs text-slate-500">نسبة الملكية</p>
                            <div className="text-sm font-black text-brand-light">%{share}</div>
                          </div>
                          <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-100">
                            <p className="text-xs text-green-700 font-semibold mb-1">الربح المستحق</p>
                            <div className="text-sm font-bold text-green-600">+{profitCut} ج.م</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {(!offering.contributions || offering.contributions.length === 0) && (
                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-slate-400 font-semibold">لم يشارك أي مستثمر في هذا الطرح حتى الآن.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
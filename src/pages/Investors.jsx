import { useState, useEffect } from 'react';
import { Users, Trash2, Phone, UserPlus, IdCard, Mail, MapPin, CalendarDays, Map, Edit, Search, XCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Investors() {
  const [investors, setInvestors] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); // حالة البحث
  
  // حالة الفورم (بتشيل البيانات سواء في الإضافة أو التعديل)
  const [newInvestor, setNewInvestor] = useState({ 
    full_name: '', phone: '', national_id: '', email: '', governorate: '', city_village: '', dob: '' 
  });
  
  // حالات التعديل
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInvestors();
  }, []);

  const fetchInvestors = async () => {
    const { data, error } = await supabase
      .from('investors')
      .select('*, contributions(paid_amount)')
      .order('created_at', { ascending: false });
    
    if (!error) setInvestors(data);
  };

  // دالة الحفظ (بتشتغل إضافة أو تعديل حسب حالة isEditing)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = { 
      full_name: newInvestor.full_name, 
      phone: newInvestor.phone,
      national_id: newInvestor.national_id,
      email: newInvestor.email,
      governorate: newInvestor.governorate,
      city_village: newInvestor.city_village,
      dob: newInvestor.dob || null
    };

    let error;
    
    if (isEditing) {
      // عملية تحديث (Update)
      const { error: updateError } = await supabase.from('investors').update(payload).eq('id', editingId);
      error = updateError;
    } else {
      // عملية إضافة (Insert)
      const { error: insertError } = await supabase.from('investors').insert([payload]);
      error = insertError;
    }

    if (error) {
      if (error.code === '23505') {
        alert('هذا الرقم أو الإيميل مسجل لمستثمر آخر بالفعل!');
      } else {
        alert(`خطأ في الـ ${isEditing ? 'تعديل' : 'إضافة'}: ` + error.message);
      }
    } else {
      // تسجيل الحركة في المراقبة
      const currentUser = JSON.parse(localStorage.getItem('appUser'));
      if(currentUser) {
        await supabase.from('audit_logs').insert([{ 
          employee_name: currentUser.name, 
          action_details: isEditing 
            ? `قام بتعديل بيانات المستثمر: ${newInvestor.full_name}` 
            : `قام بإضافة ملف المستثمر: ${newInvestor.full_name}` 
        }]);
      }

      resetForm();
      fetchInvestors();
      alert(isEditing ? 'تم تحديث بيانات المستثمر بنجاح' : 'تم إضافة المستثمر بنجاح');
    }
    setLoading(false);
  };

  // دالة تجهيز الفورم للتعديل
  const handleEditClick = (inv) => {
    setNewInvestor({
      full_name: inv.full_name || '',
      phone: inv.phone || '',
      national_id: inv.national_id || '',
      email: inv.email || '',
      governorate: inv.governorate || '',
      city_village: inv.city_village || '',
      dob: inv.dob || ''
    });
    setIsEditing(true);
    setEditingId(inv.id);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // حركة سحرية تطلعك للفورم فوق
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`هل أنت متأكد من حذف المستثمر (${name})؟ سيتم حذف جميع مساهماته أيضاً ولن يمكن استرجاعها!`)) {
      await supabase.from('investors').delete().eq('id', id);
      fetchInvestors();
      
      const currentUser = JSON.parse(localStorage.getItem('appUser'));
      await supabase.from('audit_logs').insert([{ 
          employee_name: currentUser.name, 
          action_details: `قام بحذف المستثمر: ${name} وكل مساهماته` 
      }]);
    }
  };

  const resetForm = () => {
    setNewInvestor({ full_name: '', phone: '', national_id: '', email: '', governorate: '', city_village: '', dob: '' });
    setIsEditing(false);
    setEditingId(null);
  };

  // فلترة المستثمرين بناءً على البحث
  const filteredInvestors = investors.filter(inv => 
    inv.full_name.includes(searchQuery) || 
    (inv.phone && inv.phone.includes(searchQuery)) ||
    (inv.national_id && inv.national_id.includes(searchQuery))
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/10 rounded-xl text-blue-600"><Users size={28} /></div>
          <h2 className="text-3xl font-bold text-slate-800">سجل المستثمرين (KYC)</h2>
        </div>
        
        {/* شريط البحث الذكي */}
        <div className="relative w-full md:w-72">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، الهاتف، أو الرقم القومي..." 
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none shadow-sm"
          />
          <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />
        </div>
      </div>

      <div className={`bg-white p-6 rounded-2xl shadow-sm border transition-all duration-300 ${isEditing ? 'border-amber-400 ring-4 ring-amber-50' : 'border-slate-100'}`}>
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b pb-4">
          {isEditing 
            ? <><Edit size={18} className="text-amber-500" /> تعديل بيانات المستثمر</> 
            : <><UserPlus size={18} className="text-blue-600" /> فتح ملف مستثمر جديد</>
          }
        </h3>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-500">الاسم الرباعي <span className="text-red-500">*</span></label>
            <input type="text" required value={newInvestor.full_name} onChange={(e) => setNewInvestor({...newInvestor, full_name: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 focus:bg-white transition-colors" placeholder="الاسم مطابق للبطاقة" />
          </div>
          
          <div className="space-y-1 md:col-span-1">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><IdCard size={12}/> الرقم القومي</label>
            <input type="text" maxLength="14" value={newInvestor.national_id} onChange={(e) => setNewInvestor({...newInvestor, national_id: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 focus:bg-white text-left tracking-widest" placeholder="14 رقم" dir="ltr" />
          </div>

          <div className="space-y-1 md:col-span-1">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><CalendarDays size={12}/> تاريخ الميلاد</label>
            <input type="date" value={newInvestor.dob} onChange={(e) => setNewInvestor({...newInvestor, dob: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 focus:bg-white" />
          </div>

          <div className="space-y-1 md:col-span-1">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Phone size={12}/> رقم الهاتف (كود الدخول) <span className="text-red-500">*</span></label>
            <input type="text" required value={newInvestor.phone} onChange={(e) => setNewInvestor({...newInvestor, phone: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 focus:bg-white text-left" placeholder="01X XXXX XXXX" dir="ltr" />
          </div>

          <div className="space-y-1 md:col-span-1">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Mail size={12}/> البريد الإلكتروني</label>
            <input type="email" value={newInvestor.email} onChange={(e) => setNewInvestor({...newInvestor, email: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 focus:bg-white text-left" placeholder="email@example.com" dir="ltr" />
          </div>

          <div className="space-y-1 md:col-span-1">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Map size={12}/> المحافظة</label>
            <input type="text" value={newInvestor.governorate} onChange={(e) => setNewInvestor({...newInvestor, governorate: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 focus:bg-white" placeholder="مثال: أسيوط" />
          </div>

          <div className="space-y-1 md:col-span-1">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><MapPin size={12}/> المركز / القرية</label>
            <input type="text" value={newInvestor.city_village} onChange={(e) => setNewInvestor({...newInvestor, city_village: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 focus:bg-white" placeholder="مثال: مدينة أسيوط الجديدة" />
          </div>

          <div className="md:col-span-4 mt-2 flex gap-3">
            <button type="submit" disabled={loading} className={`flex-1 p-3 rounded-xl font-bold text-white shadow-lg transition-all ${isEditing ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {loading ? 'جاري الحفظ...' : isEditing ? 'تحديث بيانات المستثمر' : 'حفظ وإصدار كود الدخول'}
            </button>
            {isEditing && (
              <button type="button" onClick={resetForm} className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-2">
                <XCircle size={18} /> إلغاء
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
        <table className="w-full text-right min-w-[800px]">
          <thead className="bg-slate-50 text-slate-600 text-sm border-b">
            <tr>
              <th className="p-4">المستثمر والتواصل</th>
              <th className="p-4">البيانات الشخصية</th>
              <th className="p-4">العنوان</th>
              <th className="p-4">إجمالي استثماراته</th>
              <th className="p-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredInvestors.length === 0 ? (
              <tr><td colSpan="5" className="p-8 text-center text-slate-400 font-bold">لا يوجد مستثمرين متطابقين مع البحث</td></tr>
            ) : (
              filteredInvestors.map((inv) => {
                const totalInvested = inv.contributions?.reduce((sum, c) => sum + Number(c.paid_amount), 0) || 0;
                return (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{inv.full_name}</p>
                      <div className="flex gap-2 text-xs mt-1">
                        <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100" dir="ltr">{inv.phone || 'بدون هاتف'}</span>
                        {inv.email && <span className="text-slate-500 flex items-center gap-1"><Mail size={10}/> {inv.email}</span>}
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      {inv.national_id ? <p className="text-slate-700 font-mono tracking-widest">{inv.national_id}</p> : <p className="text-slate-400 text-xs">لا يوجد رقم قومي</p>}
                      {inv.dob && <p className="text-slate-400 text-xs mt-1 flex items-center gap-1"><CalendarDays size={10}/> {new Date(inv.dob).toLocaleDateString('ar-EG')}</p>}
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      <p className="font-semibold">{inv.governorate || '-'}</p>
                      <p className="text-xs text-slate-400">{inv.city_village}</p>
                    </td>
                    <td className="p-4 font-black text-emerald-600 text-lg">{totalInvested.toLocaleString()} ج.م</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEditClick(inv)} className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-500 hover:text-white transition-colors" title="تعديل"><Edit size={18}/></button>
                        <button onClick={() => handleDelete(inv.id, inv.full_name)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors" title="حذف"><Trash2 size={18}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
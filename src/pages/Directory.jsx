import { useState, useEffect } from 'react';
import { Contact, Search, Star, Phone, MapPin, Building, UserPlus, Trash2, Mail, Briefcase } from 'lucide-react';
import { supabase } from '../supabaseClient';


export default function Directory() {
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('الكل');
  
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

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    await supabase.from('business_directory').insert([newContact]);
    setNewContact({ name: '', category: 'مسوق (بروكر)', field: 'عقارات', phone: '', email: '', address: '', notes: '', rating: 3 });
    fetchContacts();
    setLoading(false);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`هل أنت متأكد من حذف (${name}) من الدليل؟`)) {
      await supabase.from('business_directory').delete().eq('id', id);
      fetchContacts();
    }
  };

  // فلترة ذكية (بحث بالاسم/الرقم + فلتر بالتصنيف)
  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name.includes(searchQuery) || (c.phone && c.phone.includes(searchQuery));
    const matchesCategory = filterCategory === 'الكل' || c.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/10 rounded-xl text-blue-600"><Contact size={28} /></div>
          <h2 className="text-3xl font-bold text-slate-800">دليل العلاقات والشركات</h2>
        </div>
        
        {/* شريط البحث */}
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم أو الهاتف..." 
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none shadow-sm"
          />
          <Search size={18} className="absolute left-3 top-3.5 text-slate-400" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b pb-4 text-blue-700">
          <UserPlus size={18} /> إضافة جهة اتصال جديدة
        </h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1 md:col-span-1">
            <label className="text-xs font-bold text-slate-500">الاسم / اسم الشركة *</label>
            <input type="text" required value={newContact.name} onChange={(e) => setNewContact({...newContact, name: e.target.value})} className="w-full p-3 rounded-xl border outline-none focus:border-blue-500" />
          </div>
          <div className="space-y-1 md:col-span-1">
            <label className="text-xs font-bold text-slate-500">التصنيف</label>
            <select value={newContact.category} onChange={(e) => setNewContact({...newContact, category: e.target.value})} className="w-full p-3 rounded-xl border outline-none">
              <option>مسوق (بروكر)</option><option>شركة تطوير عقاري</option><option>شركة تجارية</option><option>مقاول/مورد خارجي</option><option>شخصية مستقلة</option>
            </select>
          </div>
          <div className="space-y-1 md:col-span-1">
            <label className="text-xs font-bold text-slate-500">مجال العمل</label>
            <select value={newContact.field} onChange={(e) => setNewContact({...newContact, field: e.target.value})} className="w-full p-3 rounded-xl border outline-none">
              <option>عقارات</option><option>مقاولات</option><option>تجارة عامة</option><option>أخرى</option>
            </select>
          </div>
          <div className="space-y-1 md:col-span-1">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Phone size={12}/> رقم الهاتف *</label>
            <input type="text" required value={newContact.phone} onChange={(e) => setNewContact({...newContact, phone: e.target.value})} className="w-full p-3 rounded-xl border outline-none text-left" dir="ltr" />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Briefcase size={12}/> ملاحظات / نبذة للتعامل</label>
            <input type="text" value={newContact.notes} onChange={(e) => setNewContact({...newContact, notes: e.target.value})} className="w-full p-3 rounded-xl border outline-none" placeholder="نسبة العمولة، جودة التعامل..." />
          </div>
          <div className="space-y-1 md:col-span-1">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Star size={12}/> تقييم الجهة (من 5)</label>
            <input type="number" min="1" max="5" value={newContact.rating} onChange={(e) => setNewContact({...newContact, rating: e.target.value})} className="w-full p-3 rounded-xl border outline-none font-bold text-amber-500" />
          </div>
          <button type="submit" disabled={loading} className="md:col-span-1 p-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md">حفظ في الدليل</button>
        </form>
      </div>

      {/* أزرار الفلترة السريعة */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['الكل', 'مسوق (بروكر)', 'شركة تطوير عقاري', 'شركة تجارية', 'مقاول/مورد خارجي', 'شخصية مستقلة'].map(cat => (
          <button 
            key={cat} 
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${filterCategory === cat ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* عرض الشبكة (Grid) بدل الجدول عشان يكون شكلها زي الـ Contact Book */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredContacts.map((contact) => (
          <div key={contact.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative group">
            <button onClick={() => handleDelete(contact.id, contact.name)} className="absolute top-4 left-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-800">{contact.name}</h3>
                <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold mt-1 ${contact.category === 'مسوق (بروكر)' ? 'bg-indigo-100 text-indigo-700' : contact.category.includes('شركة') ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                  {contact.category}
                </span>
              </div>
              <div className="flex text-amber-400">
                {[...Array(contact.rating)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-slate-600"><Briefcase size={16} className="text-slate-400"/> <span className="font-medium">المجال:</span> {contact.field}</div>
              <div className="flex items-center gap-3 text-slate-600"><Phone size={16} className="text-slate-400"/> <span className="font-bold font-mono" dir="ltr">{contact.phone}</span></div>
              {contact.notes && <div className="flex items-start gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl mt-3 text-xs"><Building size={16} className="text-slate-400 shrink-0"/> {contact.notes}</div>}
            </div>
          </div>
        ))}
        {filteredContacts.length === 0 && <div className="col-span-full p-12 text-center text-slate-400 font-bold bg-white rounded-2xl border border-dashed">لا توجد جهات اتصال مطابقة</div>}
      </div>
    </div>
  );
}
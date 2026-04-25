import { useState, useEffect, useRef } from 'react';
import { 
  Home, PlusCircle, MapPin, Edit2, Trash2, Image as ImageIcon, 
  BedDouble, Bath, Maximize, Tag, Search, Filter, DollarSign, 
  CheckCircle2, XCircle, Share2, UploadCloud, Download, Phone, Settings
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { toJpeg } from 'html-to-image';

export default function Listings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('الكل');

  // إعدادات الشركة للتصميم الإعلاني
  const [companySettings, setCompanySettings] = useState({
    companyName: 'الأمين للاستثمار العقاري',
    phones: '01000000000 - 01111111111'
  });

  // حالات الفورم
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', property_type: 'شقة سكنية', status: 'متاح',
    price: '', area: '', bedrooms: '', bathrooms: '', location: '', payment_method: 'كاش', image_url: ''
  });

  // حالات التصميم الإعلاني للسوشيال ميديا
  const socialCardRef = useRef(null);
  const [socialCardData, setSocialCardData] = useState(null);

  useEffect(() => {
    fetchListings();
    // جلب اسم الشركة والأرقام من التخزين المحلي
    const savedPrintSettings = localStorage.getItem('companyPrintSettings');
    if (savedPrintSettings) {
      setCompanySettings(JSON.parse(savedPrintSettings));
    }
  }, []);

  const fetchListings = async () => {
    const { data, error } = await supabase.from('listings').select('*').order('created_at', { ascending: false });
    if (error) {
      alert('خطأ في تحميل الإعلانات: ' + error.message);
    }
    if (data) setListings(data);
  };

  // دالة رفع الصورة الذكية
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`; 

    const { error: uploadError } = await supabase.storage.from('properties').upload(filePath, file);

    if (uploadError) {
      alert("حدث خطأ أثناء رفع الصورة، تأكد من تصريحات Supabase.");
      setIsUploading(false);
      return;
    }

    const { data } = supabase.storage.from('properties').getPublicUrl(filePath);
    setFormData({ ...formData, image_url: data.publicUrl });
    setIsUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      title: formData.title, description: formData.description, property_type: formData.property_type,
      status: formData.status, price: Number(formData.price), area: Number(formData.area),
      bedrooms: formData.property_type.includes('أرض') ? null : Number(formData.bedrooms),
      bathrooms: formData.property_type.includes('أرض') ? null : Number(formData.bathrooms),
      location: formData.location, payment_method: formData.payment_method, image_url: formData.image_url
    };

    let currentError;
    if (editingId) {
      const { error } = await supabase.from('listings').update(payload).eq('id', editingId);
      currentError = error;
    } else {
      const { error } = await supabase.from('listings').insert([payload]);
      currentError = error;
    }

    if (currentError) {
      alert("حدث خطأ أثناء نشر الإعلان: " + currentError.message);
    } else {
      resetForm();
      fetchListings();
      alert(editingId ? 'تم تحديث الإعلان بنجاح!' : 'تم نشر الإعلان بنجاح!');
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', property_type: 'شقة سكنية', status: 'متاح', price: '', area: '', bedrooms: '', bathrooms: '', location: '', payment_method: 'كاش', image_url: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (listing) => {
    setFormData(listing);
    setEditingId(listing.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الإعلان نهائياً؟')) {
      await supabase.from('listings').delete().eq('id', id);
      fetchListings();
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'متاح' ? 'مباع' : 'متاح';
    await supabase.from('listings').update({ status: newStatus }).eq('id', id);
    fetchListings();
  };

  // دالة تحويل الكارت لصورة باستخدام html-to-image (تدعم العربي)
  const downloadSocialImage = async () => {
    if (!socialCardRef.current) return;
    try {
      // حفظ الإعدادات للمرات القادمة
      localStorage.setItem('companyPrintSettings', JSON.stringify(companySettings));

      const dataUrl = await toJpeg(socialCardRef.current, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 2 // لضمان جودة عالية للصورة
      });
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `إعلان-${socialCardData.title}.jpg`;
      link.click();
      setSocialCardData(null); 
    } catch (error) {
      alert("حدث خطأ أثناء إنشاء الصورة.");
      console.error(error);
    }
  };

  const filteredListings = listings.filter(item => {
    const titleMatch = (item.title || '').includes(searchQuery);
    const locMatch = (item.location || '').includes(searchQuery);
    const matchesSearch = titleMatch || locMatch;
    const matchesType = filterType === 'الكل' || (item.property_type || '').includes(filterType);
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-20 relative" dir="rtl">
      
      {/* --- الهيدر الإحصائي --- */}
      <div className="bg-[#0f172a] rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-4 text-white">
          <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30"><Home size={32}/></div>
          <div>
            <h2 className="text-3xl font-black">معرض العقارات والإعلانات</h2>
            <p className="text-slate-400 font-bold text-sm mt-1">إدارة الكتالوج التسويقي والمخزون العقاري</p>
          </div>
        </div>
        <div className="relative z-10 flex gap-4">
          <button onClick={() => {resetForm(); setShowForm(!showForm)}} className="bg-white text-slate-900 hover:bg-blue-600 hover:text-white px-6 py-3 rounded-xl font-black transition-all flex items-center gap-2 shadow-lg">
            {showForm ? <><XCircle size={18}/> إغلاق الفورم</> : <><PlusCircle size={18}/> إضافة إعلان جديد</>}
          </button>
        </div>
      </div>

      {/* --- فورم إضافة الإعلان --- */}
      {showForm && (
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 animate-fade-in">
          <h3 className="text-xl font-black mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 text-slate-800">
            {editingId ? <Edit2 className="text-amber-500"/> : <PlusCircle className="text-blue-600"/>}
            {editingId ? 'تحديث الإعلان' : 'إضافة عقار جديد للبيع'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* قسم رفع الصورة السهل */}
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden transition-all hover:border-blue-400 hover:bg-blue-50/50">
               {formData.image_url ? (
                  <div className="w-full relative h-48 rounded-xl overflow-hidden shadow-md">
                     <img src={formData.image_url} alt="العقار" className="w-full h-full object-cover" />
                     <button type="button" onClick={() => setFormData({...formData, image_url: ''})} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg"><Trash2 size={16}/></button>
                  </div>
               ) : (
                  <>
                     <UploadCloud size={40} className="text-slate-400 mb-2"/>
                     <p className="font-bold text-slate-600 mb-1">اضغط هنا لرفع صورة العقار من جهازك</p>
                     <p className="text-xs text-slate-400 font-bold">صيغ مدعومة: JPG, PNG, WEBP</p>
                     <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                     {isUploading && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center font-black text-blue-600">جاري الرفع...</div>}
                  </>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-500">عنوان الإعلان المشوق *</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 font-bold" placeholder="مثال: شقة لقطة بفيو بانوراما على البحر" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">نوع العقار</label>
                <select value={formData.property_type} onChange={(e) => setFormData({...formData, property_type: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 font-bold">
                  <option value="شقة سكنية">شقة سكنية</option>
                  <option value="فيلا / دوبلكس">فيلا / دوبلكس</option>
                  <option value="محل تجاري">محل تجاري</option>
                  <option value="قطعة أرض">قطعة أرض</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">حالة العقار</label>
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-bold ${formData.status === 'متاح' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  <option value="متاح">متاح للبيع</option>
                  <option value="محجوز">محجوز / مبدئي</option>
                  <option value="مباع">تم البيع</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-500">السعر المطلوب (ج.م) *</label>
                <input type="number" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">المساحة (متر مربع) *</label>
                <input type="number" required value={formData.area} onChange={(e) => setFormData({...formData, area: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 font-bold" />
              </div>
              {!formData.property_type.includes('أرض') && (
                <div className="space-y-1 flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-slate-500">غرف</label>
                    <input type="number" value={formData.bedrooms} onChange={(e) => setFormData({...formData, bedrooms: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 font-bold" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-bold text-slate-500">حمامات</label>
                    <input type="number" value={formData.bathrooms} onChange={(e) => setFormData({...formData, bathrooms: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 font-bold" />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">العنوان بالتفصيل</label>
              <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 font-bold" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">وصف العقار التسويقي</label>
              <textarea rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 font-bold resize-none"></textarea>
            </div>

            <button type="submit" disabled={loading || isUploading} className={`w-full p-4 rounded-xl font-black text-white shadow-xl transition-all ${editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {loading ? 'جاري الحفظ...' : editingId ? 'تحديث الإعلان' : 'نشر الإعلان'}
            </button>
          </form>
        </div>
      )}

      {/* --- شريط البحث والفلاتر --- */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث في الإعلانات..." className="w-full pl-10 pr-4 py-4 rounded-2xl border border-slate-200 outline-none focus:border-blue-500 shadow-sm font-bold" />
          <Search size={20} className="absolute left-4 top-4 text-slate-400" />
        </div>
        <div className="flex bg-white rounded-2xl border border-slate-200 p-1 shadow-sm overflow-x-auto">
          {['الكل', 'شقة', 'فيلا', 'محل', 'أرض'].map(type => (
            <button key={type} onClick={() => setFilterType(type)} className={`px-6 py-3 rounded-xl font-black text-sm whitespace-nowrap transition-all ${filterType === type ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* --- شبكة الكروت (Property Cards) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredListings.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400 font-bold">لا توجد إعلانات مطابقة للبحث.</div>
        ) : (
          filteredListings.map(item => (
            <div key={item.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden group flex flex-col">
              
              <div className="relative h-64 bg-slate-200 overflow-hidden">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" crossOrigin="anonymous"/>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400"><ImageIcon size={48} opacity={0.5}/></div>
                )}
                <div className={`absolute top-4 right-4 px-4 py-1.5 rounded-full text-xs font-black shadow-lg backdrop-blur-md ${item.status === 'متاح' ? 'bg-emerald-500/90 text-white' : item.status === 'محجوز' ? 'bg-amber-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                  {item.status}
                </div>
                {/* زرار السوشيال ميديا السحري */}
                <button onClick={() => setSocialCardData(item)} className="absolute top-4 left-4 p-2 bg-slate-900/80 hover:bg-blue-600 backdrop-blur-md text-white rounded-full shadow-lg transition-colors group/btn" title="إنشاء وتعديل بوست السوشيال ميديا">
                  <Share2 size={18} className="group-hover/btn:scale-110 transition-transform"/>
                </button>
                <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md text-white rounded-lg text-xs font-bold flex items-center gap-1">
                  <Tag size={12}/> {item.property_type}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-black text-xl text-slate-900 line-clamp-2 leading-tight mb-2">{item.title}</h3>
                <p className="text-sm font-bold text-slate-500 mb-4 flex items-center gap-1"><MapPin size={14}/> {item.location || 'العنوان غير محدد'}</p>
                
                <div className="flex justify-between items-center py-4 border-y border-slate-100 mb-4 mt-auto">
                  <div className="flex flex-col items-center gap-1 text-slate-600">
                    <Maximize size={18} className="text-blue-500"/>
                    <span className="text-xs font-black">{item.area} م²</span>
                  </div>
                  {!item.property_type.includes('أرض') && (
                    <>
                      <div className="flex flex-col items-center gap-1 text-slate-600">
                        <BedDouble size={18} className="text-blue-500"/>
                        <span className="text-xs font-black">{item.bedrooms || 0} غرف</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 text-slate-600">
                        <Bath size={18} className="text-blue-500"/>
                        <span className="text-xs font-black">{item.bathrooms || 0} حمام</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">السعر المطلوب</p>
                    <p className="text-2xl font-black text-blue-600" dir="ltr">{Number(item.price).toLocaleString()} <span className="text-sm font-bold text-slate-500">ج.م</span></p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleStatus(item.id, item.status)} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors" title="تغيير الحالة">
                      <CheckCircle2 size={18}/>
                    </button>
                    <button onClick={() => handleEdit(item)} className="p-2.5 bg-amber-50 hover:bg-amber-500 text-amber-600 hover:text-white rounded-xl transition-colors" title="تعديل">
                      <Edit2 size={18}/>
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-2.5 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white rounded-xl transition-colors" title="حذف">
                      <Trash2 size={18}/>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ----------------- المودال السحري لتصميم السوشيال ميديا ----------------- */}
      {socialCardData && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-50 p-6 rounded-[2rem] shadow-2xl w-full max-w-lg flex flex-col items-center animate-fade-in">
            
            <div className="w-full flex justify-between items-center mb-4">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><Settings className="text-blue-600" size={20}/> إعدادات التصميم</h3>
              <button onClick={() => setSocialCardData(null)} className="text-slate-400 hover:text-red-500"><XCircle size={24}/></button>
            </div>
            
            {/* إعدادات اللوجو والأرقام المباشرة قبل الطباعة */}
            <div className="w-full flex gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex-1">
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">اسم الشركة / اللوجو</label>
                 <input type="text" value={companySettings.companyName} onChange={(e) => setCompanySettings({...companySettings, companyName: e.target.value})} className="w-full p-2 mt-1 text-sm font-black border-b-2 border-slate-100 focus:border-blue-600 outline-none text-slate-800" />
              </div>
              <div className="flex-1">
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">أرقام التواصل</label>
                 <input type="text" value={companySettings.phones} onChange={(e) => setCompanySettings({...companySettings, phones: e.target.value})} className="w-full p-2 mt-1 text-sm font-black border-b-2 border-slate-100 focus:border-blue-600 outline-none text-slate-800" dir="ltr" />
              </div>
            </div>

            {/* الكارت اللي هيتحول لصورة */}
            <div 
              ref={socialCardRef} 
              className="w-full aspect-square bg-white relative overflow-hidden rounded-xl shadow-lg flex flex-col border border-slate-200"
              style={{ width: '400px', height: '400px' }} 
            >
               <div className="h-[55%] w-full bg-slate-200 relative">
                  {socialCardData.image_url ? (
                    <img src={socialCardData.image_url} alt="" className="w-full h-full object-cover" crossOrigin="anonymous"/>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-200"><ImageIcon size={64}/></div>
                  )}
                  {/* شريط الماركة المتغير */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
                    <Home className="text-blue-600" size={16}/>
                    <span className="font-black text-slate-900 text-sm">{companySettings.companyName}</span>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-black shadow-lg">
                    عرض حصري
                  </div>
               </div>

               <div className="h-[45%] w-full bg-white p-5 flex flex-col justify-between">
                  <div>
                    <h2 className="font-black text-slate-900 text-lg leading-tight line-clamp-2">{socialCardData.title}</h2>
                    <p className="text-slate-500 text-xs font-bold mt-1 flex items-center gap-1"><MapPin size={12}/> {socialCardData.location}</p>
                  </div>

                  <div className="flex justify-between items-end border-t border-slate-100 pt-3">
                    <div className="flex gap-4">
                      <div className="text-center">
                        <span className="block text-blue-600 font-black text-sm">{socialCardData.area}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">متر مربع</span>
                      </div>
                      {!socialCardData.property_type.includes('أرض') && (
                        <>
                          <div className="text-center border-r border-slate-200 pr-4">
                            <span className="block text-slate-800 font-black text-sm">{socialCardData.bedrooms || 0}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">غرف</span>
                          </div>
                          <div className="text-center border-r border-slate-200 pr-4">
                            <span className="block text-slate-800 font-black text-sm">{socialCardData.bathrooms || 0}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">حمام</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="text-left">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase mb-0.5">السعر الإجمالي</span>
                      <span className="font-black text-blue-600 text-xl leading-none" dir="ltr">{Number(socialCardData.price).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* شريط التواصل المتغير */}
                  <div className="w-full bg-slate-900 rounded-lg p-2 mt-2 flex justify-between items-center px-4">
                     <span className="text-[10px] font-bold text-white tracking-widest">للتواصل والاستعلام</span>
                     <span className="text-xs font-black text-emerald-400 flex items-center gap-1" dir="ltr"><Phone size={10}/> {companySettings.phones}</span>
                  </div>
               </div>
            </div>

            <button onClick={downloadSocialImage} className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-black flex justify-center items-center gap-2 shadow-xl shadow-blue-600/20">
              <Download size={20}/> تحميل التصميم (صورة جاهزة للنشر)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { HardHat, Hammer, Truck, ReceiptText, Trash2, FolderGit2, IdCard, Hash, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Contracting() {
  const [activeTab, setActiveTab] = useState('expenses'); // expenses, external_projects, contractors, equipment
  
  // Data States
  const [expenses, setExpenses] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [offerings, setOfferings] = useState([]); 
  const [externalProjects, setExternalProjects] = useState([]);
  
  // Form States
  const [newProject, setNewProject] = useState({ name: '', client_name: '' });
  const [newContractor, setNewContractor] = useState({ name: '', type: 'مورد', specialty: '', phone: '', national_id: '' });
  const [newEquipment, setNewEquipment] = useState({ name: '', status: 'متاح', plate_number: '', daily_rate: '' });
  
  // Smart Expense Form State
  const [newExpense, setNewExpense] = useState({ 
    project_type: 'طرح داخلي', // أو 'مشروع خارجي'
    target_project_id: '', // بيشيل الـ id بتاع الطرح أو المشروع
    expense_type: 'مواد بناء', 
    contractor_id: '', 
    equipment_id: '',
    amount: '', 
    description: '', 
    expense_date: new Date().toISOString().split('T')[0] 
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    // جلب البيانات الأساسية للقوائم
    const { data: off } = await supabase.from('offerings').select('id, title').eq('status', 'ساري');
    if (off) setOfferings(off);

    const { data: extProj } = await supabase.from('external_projects').select('*').order('created_at', { ascending: false });
    if (extProj) setExternalProjects(extProj);

    const { data: cont } = await supabase.from('contractors').select('*').order('created_at', { ascending: false });
    if (cont) setContractors(cont);
    
    const { data: equip } = await supabase.from('equipment').select('*').order('created_at', { ascending: false });
    if (equip) setEquipment(equip);
    
    if (activeTab === 'expenses') {
      // جلب المصروفات مع بيانات كل الجداول المترابطة
      const { data } = await supabase
        .from('construction_expenses')
        .select(`
          *, 
          offerings(title), 
          external_projects(name), 
          contractors(name, type), 
          equipment(name, plate_number)
        `)
        .order('expense_date', { ascending: false });
      if (data) setExpenses(data);
    }
  };

  // --- دوال الإضافة ---
  const handleAddExternalProject = async (e) => {
    e.preventDefault();
    setLoading(true);
    await supabase.from('external_projects').insert([newProject]);
    setNewProject({ name: '', client_name: '' });
    fetchData();
    setLoading(false);
  };

  const handleAddContractor = async (e) => {
    e.preventDefault();
    setLoading(true);
    await supabase.from('contractors').insert([newContractor]);
    setNewContractor({ name: '', type: 'مورد', specialty: '', phone: '', national_id: '' });
    fetchData();
    setLoading(false);
  };

  const handleAddEquipment = async (e) => {
    e.preventDefault();
    setLoading(true);
    await supabase.from('equipment').insert([{ ...newEquipment, daily_rate: Number(newEquipment.daily_rate) }]);
    setNewEquipment({ name: '', status: 'متاح', plate_number: '', daily_rate: '' });
    fetchData();
    setLoading(false);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // تجهيز البيانات حسب الترابط الذكي
    const payload = {
      project_type: newExpense.project_type,
      offering_id: newExpense.project_type === 'طرح داخلي' ? newExpense.target_project_id : null,
      external_project_id: newExpense.project_type === 'مشروع خارجي' ? newExpense.target_project_id : null,
      expense_type: newExpense.expense_type,
      contractor_id: (newExpense.expense_type !== 'إيجار معدات' && newExpense.expense_type !== 'نثريات') ? newExpense.contractor_id : null,
      equipment_id: newExpense.expense_type === 'إيجار معدات' ? newExpense.equipment_id : null,
      amount: Number(newExpense.amount),
      description: newExpense.description,
      expense_date: newExpense.expense_date
    };

    await supabase.from('construction_expenses').insert([payload]);
    
    // إعادة تعيين الفورم جزئياً مع الاحتفاظ بنوع المشروع لتسهيل الإدخال المتتالي
    setNewExpense({ ...newExpense, target_project_id: '', contractor_id: '', equipment_id: '', amount: '', description: '' });
    fetchData();
    setLoading(false);
  };

  const handleDelete = async (table, id) => {
    if (window.confirm('هل أنت متأكد من الحذف؟ لا يمكن التراجع!')) {
      await supabase.from(table).delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-600/10 rounded-xl text-blue-600"><HardHat size={28} /></div>
        <h2 className="text-3xl font-bold text-slate-800">إدارة المقاولات والمصروفات</h2>
      </div>

      {/* التبويبات المتطورة */}
      <div className="flex bg-slate-200 p-1 rounded-2xl w-full md:w-fit mb-6 text-sm font-bold overflow-x-auto">
        <button onClick={() => setActiveTab('expenses')} className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'expenses' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><ReceiptText size={18}/> مصروفات العمليات</button>
        <button onClick={() => setActiveTab('external_projects')} className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'external_projects' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><FolderGit2 size={18}/> مشاريع خارجية</button>
        <button onClick={() => setActiveTab('contractors')} className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'contractors' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Hammer size={18}/> الموردين والعمالة</button>
        <button onClick={() => setActiveTab('equipment')} className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'equipment' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Truck size={18}/> الآليات والمعدات</button>
      </div>

      {/* 1. تبويب المصروفات (النموذج الذكي المترابط) */}
      {activeTab === 'expenses' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 ring-1 ring-blue-50">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-700"><LinkIcon size={18}/> تسجيل مصروف مترابط</h3>
            <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-6 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              
              {/* قسم تحديد المشروع */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-500">نوع المشروع</label>
                <div className="flex bg-white rounded-xl border overflow-hidden">
                  <button type="button" onClick={() => setNewExpense({...newExpense, project_type: 'طرح داخلي', target_project_id: ''})} className={`flex-1 py-2 text-xs font-bold ${newExpense.project_type === 'طرح داخلي' ? 'bg-blue-100 text-blue-700' : 'text-slate-500'}`}>طرح (داخلي)</button>
                  <button type="button" onClick={() => setNewExpense({...newExpense, project_type: 'مشروع خارجي', target_project_id: ''})} className={`flex-1 py-2 text-xs font-bold ${newExpense.project_type === 'مشروع خارجي' ? 'bg-amber-100 text-amber-700' : 'text-slate-500'}`}>مقاولات (خارجي)</button>
                </div>
              </div>

              <div className="md:col-span-4 space-y-1">
                <label className="text-xs font-bold text-slate-500">اختر المشروع المستهدف *</label>
                <select required value={newExpense.target_project_id} onChange={(e) => setNewExpense({...newExpense, target_project_id: e.target.value})} className="w-full p-3 rounded-xl border bg-white outline-none focus:border-blue-500">
                  <option value="">-- حدد المشروع من القائمة --</option>
                  {newExpense.project_type === 'طرح داخلي' 
                    ? offerings.map(o => <option key={o.id} value={o.id}>{o.title}</option>)
                    : externalProjects.map(p => <option key={p.id} value={p.id}>{p.name} (للعميل: {p.client_name})</option>)
                  }
                </select>
              </div>

              {/* قسم تحديد المصروف والمستفيد */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-500">بند المصروف *</label>
                <select value={newExpense.expense_type} onChange={(e) => setNewExpense({...newExpense, expense_type: e.target.value, contractor_id: '', equipment_id: ''})} className="w-full p-3 rounded-xl border bg-white outline-none">
                  <option>مواد بناء</option><option>أجرة عمالة/مقاولة</option><option>إيجار معدات</option><option>نثريات</option>
                </select>
              </div>

              <div className="md:col-span-4 space-y-1">
                <label className="text-xs font-bold text-slate-500">المستفيد المترابط (الجهة المنفذة)</label>
                {newExpense.expense_type === 'إيجار معدات' ? (
                  <select required value={newExpense.equipment_id} onChange={(e) => setNewExpense({...newExpense, equipment_id: e.target.value})} className="w-full p-3 rounded-xl border bg-amber-50 outline-none text-amber-900">
                    <option value="">-- اختر المعدة من السجل --</option>
                    {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name} (لوحة: {eq.plate_number})</option>)}
                  </select>
                ) : newExpense.expense_type === 'نثريات' ? (
                  <input type="text" disabled className="w-full p-3 rounded-xl border bg-slate-100 text-slate-400" placeholder="لا يتطلب ربط بجهة معينة" />
                ) : (
                  <select required value={newExpense.contractor_id} onChange={(e) => setNewExpense({...newExpense, contractor_id: e.target.value})} className="w-full p-3 rounded-xl border bg-emerald-50 outline-none text-emerald-900">
                    <option value="">-- اختر المورد/المقاول من السجل --</option>
                    {contractors.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type} - {c.specialty})</option>)}
                  </select>
                )}
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-500">المبلغ المدفوع *</label>
                <input type="number" required value={newExpense.amount} onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})} className="w-full p-3 rounded-xl border bg-white outline-none font-bold text-red-600" placeholder="0.00" />
              </div>
              
              <div className="md:col-span-3 space-y-1">
                <label className="text-xs font-bold text-slate-500">وصف دقيق للعملية</label>
                <input type="text" required value={newExpense.description} onChange={(e) => setNewExpense({...newExpense, description: e.target.value})} className="w-full p-3 rounded-xl border bg-white outline-none" placeholder="مثال: دفعة أسمنت تشطيبات الدور الأول..." />
              </div>

              <div className="md:col-span-1 flex items-end">
                <button type="submit" disabled={loading} className="w-full p-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md">حفظ</button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
            <table className="w-full text-right text-sm min-w-[800px]">
              <thead className="bg-slate-50 text-slate-600 border-b">
                <tr><th className="p-4">التاريخ</th><th className="p-4">المشروع المستهدف</th><th className="p-4">البند والمستفيد</th><th className="p-4">البيان</th><th className="p-4">المبلغ</th><th className="p-4"></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50">
                    <td className="p-4 text-xs text-slate-500">{new Date(exp.expense_date).toLocaleDateString('ar-EG')}</td>
                    <td className="p-4 font-bold">
                      <span className={`px-2 py-1 rounded text-[10px] ml-2 ${exp.project_type === 'طرح داخلي' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{exp.project_type}</span>
                      {exp.project_type === 'طرح داخلي' ? exp.offerings?.title : exp.external_projects?.name}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-slate-700 block mb-1">{exp.expense_type}</span>
                      {exp.contractors && <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{exp.contractors.name}</span>}
                      {exp.equipment && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">{exp.equipment.name}</span>}
                    </td>
                    <td className="p-4 text-slate-600">{exp.description}</td>
                    <td className="p-4 font-black text-red-600">{Number(exp.amount).toLocaleString()} ج.م</td>
                    <td className="p-4"><button onClick={() => handleDelete('construction_expenses', exp.id)} className="text-slate-400 hover:bg-red-50 hover:text-red-600 p-2 rounded-lg transition-all"><Trash2 size={16}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. تبويب المشاريع الخارجية */}
      {activeTab === 'external_projects' && (
        <div className="space-y-6 animate-fade-in">
          <form onSubmit={handleAddExternalProject} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">اسم المشروع/العملية</label>
              <input type="text" required value={newProject.name} onChange={(e) => setNewProject({...newProject, name: e.target.value})} className="w-full p-3 rounded-xl border outline-none focus:border-blue-500" placeholder="مثال: تشطيب فيلا التجمع" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">اسم العميل (المالك)</label>
              <input type="text" required value={newProject.client_name} onChange={(e) => setNewProject({...newProject, client_name: e.target.value})} className="w-full p-3 rounded-xl border outline-none focus:border-blue-500" placeholder="صاحب المشروع" />
            </div>
            <button type="submit" disabled={loading} className="p-3 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-900 transition-all">فتح ملف مشروع جديد</button>
          </form>

          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b">
                <tr><th className="p-4">اسم المشروع (العملية)</th><th className="p-4">المالك/العميل</th><th className="p-4">حالة العمل</th><th className="p-4">إجراء</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {externalProjects.map((proj) => (
                  <tr key={proj.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-blue-700">{proj.name}</td>
                    <td className="p-4 font-semibold text-slate-600">{proj.client_name}</td>
                    <td className="p-4"><span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">{proj.status}</span></td>
                    <td className="p-4"><button onClick={() => handleDelete('external_projects', proj.id)} className="text-red-400 p-2 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. تبويب الموردين والعمالة (تم إضافة الرقم القومي) */}
      {activeTab === 'contractors' && (
        <div className="space-y-6 animate-fade-in">
          <form onSubmit={handleAddContractor} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-500">اسم المقاول/المورد</label>
              <input type="text" required value={newContractor.name} onChange={(e) => setNewContractor({...newContractor, name: e.target.value})} className="w-full p-3 rounded-xl border outline-none" />
            </div>
            <div className="space-y-1 md:col-span-1">
              <label className="text-xs font-bold text-slate-500">التصنيف</label>
              <select value={newContractor.type} onChange={(e) => setNewContractor({...newContractor, type: e.target.value})} className="w-full p-3 rounded-xl border outline-none">
                <option>مورد</option><option>مقاول</option><option>عامل فردي</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-1">
              <label className="text-xs font-bold text-slate-500">التخصص</label>
              <input type="text" value={newContractor.specialty} onChange={(e) => setNewContractor({...newContractor, specialty: e.target.value})} className="w-full p-3 rounded-xl border outline-none" placeholder="أسمنت، حديد، محارة..." />
            </div>
            <div className="space-y-1 md:col-span-2 flex gap-2">
               <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><IdCard size={12}/> الرقم القومي</label>
                  <input type="text" maxLength="14" value={newContractor.national_id} onChange={(e) => setNewContractor({...newContractor, national_id: e.target.value})} className="w-full p-3 rounded-xl border outline-none tracking-widest text-left" dir="ltr" />
               </div>
            </div>
            <button type="submit" disabled={loading} className="md:col-span-6 p-3 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-900 transition-all">تسجيل المورد/المقاول</button>
          </form>

          <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto">
            <table className="w-full text-right text-sm min-w-[800px]">
              <thead className="bg-slate-50 text-slate-600 border-b">
                <tr><th className="p-4">الاسم والتصنيف</th><th className="p-4">التخصص</th><th className="p-4">الرقم القومي / السجل</th><th className="p-4">إجراء</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contractors.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{c.name}</p>
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold mt-1 inline-block">{c.type}</span>
                    </td>
                    <td className="p-4 font-medium text-slate-600">{c.specialty || '-'}</td>
                    <td className="p-4 font-mono text-slate-500 tracking-widest">{c.national_id || 'غير مسجل'}</td>
                    <td className="p-4"><button onClick={() => handleDelete('contractors', c.id)} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={16}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. تبويب المعدات (تم إضافة رقم اللوحة/اليفطة) */}
      {activeTab === 'equipment' && (
        <div className="space-y-6 animate-fade-in">
          <form onSubmit={handleAddEquipment} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-500">اسم/نوع المعدة</label>
              <input type="text" required value={newEquipment.name} onChange={(e) => setNewEquipment({...newEquipment, name: e.target.value})} className="w-full p-3 rounded-xl border outline-none focus:border-blue-500" placeholder="مثال: لودر كاتربيلر، خلاطة..." />
            </div>
            <div className="space-y-1 md:col-span-1">
              <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Hash size={12}/> رقم اللوحة / اليفطة</label>
              <input type="text" value={newEquipment.plate_number} onChange={(e) => setNewEquipment({...newEquipment, plate_number: e.target.value})} className="w-full p-3 rounded-xl border outline-none font-bold" placeholder="أ ب ج 123" />
            </div>
            <div className="space-y-1 md:col-span-1">
              <label className="text-xs font-bold text-slate-500">حالة المعدة</label>
              <select value={newEquipment.status} onChange={(e) => setNewEquipment({...newEquipment, status: e.target.value})} className="w-full p-3 rounded-xl border outline-none bg-slate-50">
                <option>متاح</option><option>في الموقع</option><option>صيانة</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="md:col-span-4 p-3 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-900 transition-all">تسجيل المعدة في العهدة</button>
          </form>

          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b">
                <tr><th className="p-4">اسم المعدة</th><th className="p-4">رقم اللوحة/اليفطة</th><th className="p-4">الحالة</th><th className="p-4">إجراء</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {equipment.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-800">{eq.name}</td>
                    <td className="p-4 font-bold text-slate-500 border border-slate-200 bg-slate-50 px-3 py-1 inline-block mt-3 ml-4 rounded shadow-sm">{eq.plate_number || 'بدون لوحة'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${eq.status === 'متاح' ? 'bg-green-100 text-green-700' : eq.status === 'في الموقع' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{eq.status}</span>
                    </td>
                    <td className="p-4"><button onClick={() => handleDelete('equipment', eq.id)} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={16}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
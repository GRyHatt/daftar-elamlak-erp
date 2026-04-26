import { useState, useEffect } from 'react';
import { 
  ShieldAlert, UserPlus, Trash2, ShieldCheck, PauseCircle, 
  Activity, Banknote, Users, CalendarOff, TrendingDown, 
  ArrowUpRight, ArrowDownRight, CheckCircle, XCircle 
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Employees() {
  const [activeTab, setActiveTab] = useState('employees'); // employees, payroll, leaves, audit
  
  const [employees, setEmployees] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [leaves, setLeaves] = useState([]);
  
  // حالات الفورمز
  const [newEmp, setNewEmp] = useState({ full_name: '', access_code: '', role: 'مبيعات', commission_rate: 0, base_salary: 0 });
  const [newPayroll, setNewPayroll] = useState({ employee_name: '', type: 'خصم', amount: '', reason: '', date: new Date().toISOString().split('T')[0] });
  const [newLeave, setNewLeave] = useState({ employee_name: '', leave_type: 'سنوي', start_date: '', end_date: '', reason: '' });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    fetchData(); 
  }, [activeTab]);

  const fetchData = async () => {
    // هنجيب الموظفين في كل الأحوال عشان هنحتاجهم في القوائم المنسدلة
    const { data: emps } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
    if (emps) setEmployees(emps);

    if (activeTab === 'audit') {
      const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
      if (data) setAuditLogs(data);
    } else if (activeTab === 'payroll') {
      const { data } = await supabase.from('payroll_transactions').select('*').order('date', { ascending: false });
      if (data) setPayrolls(data);
    } else if (activeTab === 'leaves') {
      const { data } = await supabase.from('leaves').select('*').order('start_date', { ascending: false });
      if (data) setLeaves(data);
    }
  };

  const generateCode = () => {
    setNewEmp({ ...newEmp, access_code: Math.floor(100000 + Math.random() * 900000).toString() });
  };

  // --- دوال الموظفين ---
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('employees').insert([{
      full_name: newEmp.full_name,
      access_code: newEmp.access_code,
      role: newEmp.role,
      commission_rate: Number(newEmp.commission_rate),
      base_salary: Number(newEmp.base_salary),
      status: 'نشط'
    }]);
    
    if (error) alert('خطأ: ' + error.message);
    else {
      setNewEmp({ full_name: '', access_code: '', role: 'مبيعات', commission_rate: 0, base_salary: 0 });
      fetchData();
      alert('تم إضافة الموظف بنجاح!');
    }
    setLoading(false);
  };

  const toggleStatus = async (emp) => {
    const newStatus = emp.status === 'نشط' ? 'موقوف' : 'نشط';
    await supabase.from('employees').update({ status: newStatus }).eq('id', emp.id);
    fetchData();
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف الموظف نهائياً؟')) {
      await supabase.from('employees').delete().eq('id', id);
      fetchData();
    }
  };

  // --- دوال الرواتب والخصومات ---
  const handleAddPayroll = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('payroll_transactions').insert([{
      employee_name: newPayroll.employee_name,
      type: newPayroll.type,
      amount: Number(newPayroll.amount),
      reason: newPayroll.reason,
      date: newPayroll.date
    }]);
    if (error) alert('خطأ: ' + error.message);
    else {
      setNewPayroll({ employee_name: '', type: 'خصم', amount: '', reason: '', date: new Date().toISOString().split('T')[0] });
      fetchData();
      alert('تم تسجيل الحركة المالية بنجاح!');
    }
    setLoading(false);
  };

  // --- دوال الإجازات ---
  const handleAddLeave = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('leaves').insert([{
      employee_name: newLeave.employee_name,
      leave_type: newLeave.leave_type,
      start_date: newLeave.start_date,
      end_date: newLeave.end_date,
      reason: newLeave.reason,
      status: 'مقبول' // افتراضي مقبول
    }]);
    if (error) alert('خطأ: ' + error.message);
    else {
      setNewLeave({ employee_name: '', leave_type: 'سنوي', start_date: '', end_date: '', reason: '' });
      fetchData();
      alert('تم تسجيل الإجازة بنجاح!');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 relative" dir="rtl">
      
      {/* الهيدر */}
      <div className="bg-[#0f172a] rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-4 text-white">
          <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30"><ShieldAlert size={32} /></div>
          <div>
            <h2 className="text-3xl font-black">الموارد البشرية (HR)</h2>
            <p className="text-slate-400 font-bold text-sm mt-1">إدارة الموظفين، الرواتب، الخصومات، والإجازات</p>
          </div>
        </div>
      </div>

      {/* Tabs / التبويبات */}
      <div className="flex gap-2 bg-white border border-slate-100 p-2 rounded-2xl shadow-sm overflow-x-auto custom-scrollbar">
        <button onClick={() => setActiveTab('employees')} className={`flex whitespace-nowrap items-center gap-2 px-6 py-3 rounded-xl font-black transition-all ${activeTab === 'employees' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><Users size={18}/> بيانات الموظفين</button>
        <button onClick={() => setActiveTab('payroll')} className={`flex whitespace-nowrap items-center gap-2 px-6 py-3 rounded-xl font-black transition-all ${activeTab === 'payroll' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><Banknote size={18}/> الرواتب والخصومات</button>
        <button onClick={() => setActiveTab('leaves')} className={`flex whitespace-nowrap items-center gap-2 px-6 py-3 rounded-xl font-black transition-all ${activeTab === 'leaves' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><CalendarOff size={18}/> سجل الإجازات</button>
        <button onClick={() => setActiveTab('audit')} className={`flex whitespace-nowrap items-center gap-2 px-6 py-3 rounded-xl font-black transition-all ${activeTab === 'audit' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><Activity size={18}/> المراقبة والأمان</button>
      </div>

      {/* ----------------- 1. تبويب: بيانات الموظفين ----------------- */}
      {activeTab === 'employees' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 text-slate-800"><UserPlus className="text-blue-600" /> تسجيل موظف جديد</h3>
            <form onSubmit={handleAddEmployee} className="grid grid-cols-1 md:grid-cols-6 gap-5 items-end">
              <div className="md:col-span-2 space-y-1"><label className="text-xs font-bold text-slate-500">الاسم بالكامل *</label><input type="text" required value={newEmp.full_name} onChange={(e) => setNewEmp({...newEmp, full_name: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 font-bold" /></div>
              <div className="md:col-span-1 space-y-1"><label className="text-xs font-bold text-slate-500">الدور الوظيفي *</label><select value={newEmp.role} onChange={(e) => setNewEmp({...newEmp, role: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none font-bold"><option value="مبيعات">موظف مبيعات</option><option value="محاسب">محاسب</option><option value="مشرف">مشرف إداري</option></select></div>
              <div className="md:col-span-1 space-y-1"><label className="text-xs font-bold text-slate-500">الراتب الأساسي (ج.م)</label><input type="number" value={newEmp.base_salary} onChange={(e) => setNewEmp({...newEmp, base_salary: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none font-bold" /></div>
              <div className="md:col-span-1 space-y-1"><label className="text-xs font-bold text-slate-500">نسبة العمولة %</label><input type="number" step="any" value={newEmp.commission_rate} onChange={(e) => setNewEmp({...newEmp, commission_rate: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 outline-none font-bold" /></div>
              <div className="md:col-span-1 space-y-1"><label className="text-xs font-bold text-slate-500 flex justify-between"><span>كود الدخول</span> <button type="button" onClick={generateCode} className="text-blue-600 hover:underline">توليد</button></label><input type="text" required value={newEmp.access_code} onChange={(e) => setNewEmp({...newEmp, access_code: e.target.value})} className="w-full p-4 rounded-xl border outline-none text-center tracking-widest font-black text-blue-600 bg-blue-50 border-blue-100" /></div>
              <button type="submit" disabled={loading} className="md:col-span-6 p-4 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-xl mt-2">تسجيل واعتماد الموظف</button>
            </form>
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-right text-sm">
                 <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
                   <tr><th className="p-5 font-bold">الموظف / الدور</th><th className="p-5 font-bold">الراتب الأساسي</th><th className="p-5 font-bold">العمولة</th><th className="p-5 font-bold">كود الدخول</th><th className="p-5 text-center font-bold">الإجراءات</th></tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {employees.map((emp) => (
                     <tr key={emp.id} className={`transition-colors ${emp.status === 'موقوف' ? 'bg-red-50/40 opacity-70' : 'hover:bg-slate-50'}`}>
                       <td className="p-5"><p className="font-black text-slate-800 text-base">{emp.full_name}</p><span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold mt-1 inline-block">{emp.role}</span></td>
                       <td className="p-5 font-black text-slate-700" dir="ltr">{Number(emp.base_salary || 0).toLocaleString()} <span className="text-xs text-slate-400">ج</span></td>
                       <td className="p-5 font-black text-emerald-600">{emp.commission_rate}%</td>
                       <td className="p-5"><span className="bg-slate-100 px-3 py-1.5 rounded-lg font-mono font-black border border-slate-200 tracking-widest text-slate-700">{emp.access_code}</span></td>
                       <td className="p-5 flex gap-2 justify-center">
                         <button onClick={() => toggleStatus(emp)} className={`p-2.5 rounded-xl flex items-center gap-1.5 text-xs font-black w-24 justify-center transition-colors ${emp.status === 'نشط' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                           {emp.status === 'نشط' ? <><ShieldCheck size={16}/> نشط</> : <><PauseCircle size={16}/> موقوف</>}
                         </button>
                         <button onClick={() => handleDelete(emp.id)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={18}/></button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- 2. تبويب: الرواتب والخصومات ----------------- */}
      {activeTab === 'payroll' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
             <h3 className="text-xl font-black mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 text-slate-800"><Banknote className="text-emerald-500" /> إضافة حركة مالية (خصم / مكافأة / سلفة)</h3>
             <form onSubmit={handleAddPayroll} className="grid grid-cols-1 md:grid-cols-5 gap-5 items-end">
               <div className="space-y-1 md:col-span-1">
                 <label className="text-xs font-bold text-slate-500">الموظف *</label>
                 <select required value={newPayroll.employee_name} onChange={(e) => setNewPayroll({...newPayroll, employee_name: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 font-bold outline-none">
                    <option value="">-- اختر الموظف --</option>
                    {employees.map(emp => <option key={emp.id} value={emp.full_name}>{emp.full_name}</option>)}
                 </select>
               </div>
               <div className="space-y-1 md:col-span-1">
                 <label className="text-xs font-bold text-slate-500">نوع الحركة *</label>
                 <select value={newPayroll.type} onChange={(e) => setNewPayroll({...newPayroll, type: e.target.value})} className={`w-full p-4 rounded-xl border outline-none font-black ${newPayroll.type === 'خصم' ? 'bg-red-50 text-red-700 border-red-100' : newPayroll.type === 'مكافأة' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                    <option value="خصم">خصم (جزاء / غياب)</option>
                    <option value="مكافأة">مكافأة (حافز)</option>
                    <option value="سلفة">سلفة مقدمة</option>
                 </select>
               </div>
               <div className="space-y-1 md:col-span-1"><label className="text-xs font-bold text-slate-500">المبلغ (ج.م) *</label><input type="number" step="any" required value={newPayroll.amount} onChange={(e) => setNewPayroll({...newPayroll, amount: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 font-black outline-none" dir="ltr" /></div>
               <div className="space-y-1 md:col-span-1"><label className="text-xs font-bold text-slate-500">السبب التفصيلي *</label><input type="text" required value={newPayroll.reason} onChange={(e) => setNewPayroll({...newPayroll, reason: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 font-bold outline-none" placeholder="مثال: غياب يومين..." /></div>
               <button type="submit" disabled={loading} className="md:col-span-1 p-4 rounded-xl font-black text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-xl">تسجيل واعتماد</button>
             </form>
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-100"><h3 className="font-black text-slate-700">سجل الحركات المالية للموظفين</h3></div>
            <div className="overflow-x-auto">
               <table className="w-full text-right text-sm">
                 <thead className="bg-white text-slate-500 border-b border-slate-100">
                   <tr><th className="p-4 font-bold">التاريخ</th><th className="p-4 font-bold">الموظف</th><th className="p-4 font-bold">النوع</th><th className="p-4 font-bold">المبلغ</th><th className="p-4 font-bold">السبب</th></tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {payrolls.length === 0 ? <tr><td colSpan="5" className="p-8 text-center text-slate-400 font-bold">لا توجد حركات مالية مسجلة.</td></tr> : payrolls.map((pr) => (
                     <tr key={pr.id} className="hover:bg-slate-50 transition-colors">
                       <td className="p-4 text-slate-500 font-bold">{new Date(pr.date).toLocaleDateString('ar-EG')}</td>
                       <td className="p-4 font-black text-slate-800">{pr.employee_name}</td>
                       <td className="p-4">
                          <span className={`px-3 py-1 rounded-lg text-xs font-black inline-flex items-center gap-1 ${pr.type === 'خصم' ? 'bg-red-50 text-red-600' : pr.type === 'مكافأة' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                             {pr.type === 'مكافأة' ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>} {pr.type}
                          </span>
                       </td>
                       <td className={`p-4 font-black text-lg ${pr.type === 'مكافأة' ? 'text-emerald-600' : 'text-red-600'}`} dir="ltr">{pr.type === 'مكافأة' ? '+' : '-'}{Number(pr.amount).toLocaleString()}</td>
                       <td className="p-4 font-bold text-slate-600">{pr.reason}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- 3. تبويب: سجل الإجازات ----------------- */}
      {activeTab === 'leaves' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
             <h3 className="text-xl font-black mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 text-slate-800"><CalendarOff className="text-blue-500" /> تقديم طلب إجازة</h3>
             <form onSubmit={handleAddLeave} className="grid grid-cols-1 md:grid-cols-5 gap-5 items-end">
               <div className="space-y-1 md:col-span-1">
                 <label className="text-xs font-bold text-slate-500">الموظف *</label>
                 <select required value={newLeave.employee_name} onChange={(e) => setNewLeave({...newLeave, employee_name: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 font-bold outline-none">
                    <option value="">-- اختر الموظف --</option>
                    {employees.map(emp => <option key={emp.id} value={emp.full_name}>{emp.full_name}</option>)}
                 </select>
               </div>
               <div className="space-y-1 md:col-span-1">
                 <label className="text-xs font-bold text-slate-500">نوع الإجازة *</label>
                 <select value={newLeave.leave_type} onChange={(e) => setNewLeave({...newLeave, leave_type: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 font-bold outline-none">
                    <option value="سنوي">اعتيادي / سنوي</option>
                    <option value="مرضي">مرضي (بشهادة)</option>
                    <option value="عارضة">عارضة (ظرف طارئ)</option>
                 </select>
               </div>
               <div className="space-y-1 md:col-span-1"><label className="text-xs font-bold text-slate-500">من تاريخ *</label><input type="date" required value={newLeave.start_date} onChange={(e) => setNewLeave({...newLeave, start_date: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 font-bold outline-none" /></div>
               <div className="space-y-1 md:col-span-1"><label className="text-xs font-bold text-slate-500">إلى تاريخ *</label><input type="date" required value={newLeave.end_date} onChange={(e) => setNewLeave({...newLeave, end_date: e.target.value})} className="w-full p-4 rounded-xl border bg-slate-50 font-bold outline-none" /></div>
               <button type="submit" disabled={loading} className="md:col-span-1 p-4 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-xl">تسجيل واعتماد</button>
             </form>
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-6 bg-slate-50 border-b border-slate-100"><h3 className="font-black text-slate-700">سجل إجازات وغيابات الموظفين</h3></div>
             <div className="overflow-x-auto">
               <table className="w-full text-right text-sm">
                 <thead className="bg-white text-slate-500 border-b border-slate-100">
                   <tr><th className="p-4 font-bold">الموظف</th><th className="p-4 font-bold">النوع</th><th className="p-4 font-bold">الفترة</th><th className="p-4 font-bold text-center">الحالة</th></tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {leaves.length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-slate-400 font-bold">لا توجد إجازات مسجلة.</td></tr> : leaves.map((lv) => (
                     <tr key={lv.id} className="hover:bg-slate-50 transition-colors">
                       <td className="p-4 font-black text-slate-800">{lv.employee_name}</td>
                       <td className="p-4"><span className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600">{lv.leave_type}</span></td>
                       <td className="p-4 font-bold text-slate-500">
                          من <span className="text-slate-800">{new Date(lv.start_date).toLocaleDateString('ar-EG')}</span> <br/>
                          إلى <span className="text-slate-800">{new Date(lv.end_date).toLocaleDateString('ar-EG')}</span>
                       </td>
                       <td className="p-4 text-center">
                          <span className="px-3 py-1 rounded-lg text-xs font-black bg-emerald-50 text-emerald-600 flex items-center justify-center gap-1 w-24 mx-auto"><CheckCircle size={14}/> مقبول</span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      )}

      {/* ----------------- 4. تبويب: المراقبة والأمان ----------------- */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
          <div className="p-6 bg-slate-900 border-b border-slate-800"><h3 className="font-black text-white flex items-center gap-2"><Activity size={18}/> سجل حركات النظام (آخر 50 حركة)</h3></div>
          <div className="overflow-x-auto">
             <table className="w-full text-right text-sm">
               <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                 <tr><th className="p-5 font-bold">التاريخ والوقت</th><th className="p-5 font-bold">اسم الموظف / المسؤول</th><th className="p-5 font-bold">تفاصيل الحركة (النشاط)</th></tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {auditLogs.map((log) => (
                   <tr key={log.id} className="hover:bg-slate-50">
                     <td className="p-5 text-xs text-slate-500 font-mono font-bold" dir="ltr">{new Date(log.created_at).toLocaleString('ar-EG')}</td>
                     <td className="p-5 font-black text-blue-600">{log.employee_name}</td>
                     <td className="p-5 font-bold text-slate-700">{log.action_details}</td>
                   </tr>
                 ))}
                 {auditLogs.length === 0 && <tr><td colSpan="3" className="p-10 text-center text-slate-400 font-bold">لا توجد حركات مسجلة حتى الآن</td></tr>}
               </tbody>
             </table>
          </div>
        </div>
      )}
    </div>
  );
}
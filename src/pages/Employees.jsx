import { useState, useEffect } from 'react';
import { ShieldAlert, UserPlus, Trash2, ShieldCheck, PauseCircle, PlayCircle, Activity, Banknote, Users } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Employees() {
  const [activeTab, setActiveTab] = useState('employees'); // 'employees', 'audit', 'commissions'
  
  const [employees, setEmployees] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [commissions, setCommissions] = useState([]);
  
  const [newEmp, setNewEmp] = useState({ full_name: '', access_code: '', role: 'مبيعات', commission_rate: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    fetchData(); 
  }, [activeTab]);

  const fetchData = async () => {
    if (activeTab === 'employees') {
      const { data } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
      if (data) setEmployees(data);
    } else if (activeTab === 'audit') {
      const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
      if (data) setAuditLogs(data);
    } else if (activeTab === 'commissions') {
      const { data } = await supabase.from('commissions').select('*').order('created_at', { ascending: false });
      if (data) setCommissions(data);
    }
  };

  const generateCode = () => {
    setNewEmp({ ...newEmp, access_code: Math.floor(100000 + Math.random() * 900000).toString() });
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('employees').insert([{...newEmp, status: 'نشط'}]);
    if (error) alert('خطأ: ' + error.message);
    else {
      setNewEmp({ full_name: '', access_code: '', role: 'مبيعات', commission_rate: 0 });
      fetchData();
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

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-slate-800 rounded-xl text-white"><ShieldAlert size={28} /></div>
        <h2 className="text-3xl font-bold text-brand-dark">إدارة الموارد البشرية (HR)</h2>
      </div>

      {/* Tabs / التبويبات */}
      <div className="flex gap-2 bg-slate-200 p-1 rounded-2xl w-full md:w-fit mb-6">
        <button onClick={() => setActiveTab('employees')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'employees' ? 'bg-white text-brand-dark shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Users size={18}/> الموظفين والصلاحيات</button>
        <button onClick={() => setActiveTab('audit')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'audit' ? 'bg-white text-brand-dark shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Activity size={18}/> سجل الحركات (المراقبة)</button>
        <button onClick={() => setActiveTab('commissions')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'commissions' ? 'bg-white text-brand-dark shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Banknote size={18}/> العمولات والمكافآت</button>
      </div>

      {/* تبويب: الموظفين */}
      {activeTab === 'employees' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><UserPlus size={18} className="text-brand-light" /> إضافة موظف جديد</h3>
            <form onSubmit={handleAddEmployee} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-500">الاسم</label>
                <input type="text" required value={newEmp.full_name} onChange={(e) => setNewEmp({...newEmp, full_name: e.target.value})} className="w-full p-3 rounded-xl border outline-none" placeholder="الاسم بالكامل" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">الصلاحية (الدور)</label>
                <select value={newEmp.role} onChange={(e) => setNewEmp({...newEmp, role: e.target.value})} className="w-full p-3 rounded-xl border outline-none bg-white">
                  <option value="مبيعات">موظف مبيعات</option>
                  <option value="محاسب">محاسب</option>
                  <option value="مشرف">مشرف إداري</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">نسبة العمولة %</label>
                <input type="number" step="0.1" value={newEmp.commission_rate} onChange={(e) => setNewEmp({...newEmp, commission_rate: e.target.value})} className="w-full p-3 rounded-xl border outline-none" placeholder="مثال: 1.5" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 flex justify-between"><span>الكود السري</span> <button type="button" onClick={generateCode} className="text-brand-light text-[10px] hover:underline">توليد</button></label>
                <input type="text" required value={newEmp.access_code} onChange={(e) => setNewEmp({...newEmp, access_code: e.target.value})} className="w-full p-3 rounded-xl border outline-none text-center tracking-widest font-bold" />
              </div>
              <button type="submit" disabled={loading} className="md:col-span-5 p-3 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-900 transition-all mt-2">حفظ الصلاحية</button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-slate-600 text-sm border-b">
                <tr><th className="p-4">الموظف</th><th className="p-4">الصلاحية</th><th className="p-4">العمولة</th><th className="p-4">الكود</th><th className="p-4 text-center">الحالة / الإجراءات</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className={`transition-colors ${emp.status === 'موقوف' ? 'bg-red-50/50 opacity-70' : 'hover:bg-slate-50'}`}>
                    <td className="p-4 font-bold">{emp.full_name}</td>
                    <td className="p-4 text-sm text-brand-light font-bold">{emp.role}</td>
                    <td className="p-4 font-bold text-green-600">{emp.commission_rate}%</td>
                    <td className="p-4"><span className="bg-slate-100 px-3 py-1 rounded-lg font-mono font-bold border tracking-widest">{emp.access_code}</span></td>
                    <td className="p-4 flex gap-2 justify-center">
                      <button onClick={() => toggleStatus(emp)} className={`p-2 rounded-lg flex items-center gap-1 text-xs font-bold w-24 justify-center ${emp.status === 'نشط' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {emp.status === 'نشط' ? <><ShieldCheck size={14}/> نشط</> : <><PauseCircle size={14}/> موقوف</>}
                      </button>
                      <button onClick={() => handleDelete(emp.id)} className="p-2 bg-slate-100 text-red-500 rounded-lg hover:bg-red-50"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* تبويب: سجل الحركات */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden animate-fade-in">
          <table className="w-full text-right">
            <thead className="bg-slate-900 text-white text-sm">
              <tr><th className="p-4">التاريخ والوقت</th><th className="p-4">اسم المستخدم</th><th className="p-4">تفاصيل الحركة (النشاط)</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="p-4 text-xs text-slate-500 font-mono" dir="ltr">{new Date(log.created_at).toLocaleString('ar-EG')}</td>
                  <td className="p-4 font-bold text-slate-800">{log.employee_name}</td>
                  <td className="p-4 text-sm font-semibold text-brand-dark">{log.action_details}</td>
                </tr>
              ))}
              {auditLogs.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-slate-400 font-bold">لا توجد حركات مسجلة حتى الآن</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* تبويب: العمولات */}
      {activeTab === 'commissions' && (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden animate-fade-in">
          <div className="p-4 bg-green-50 border-b border-green-100 flex items-center gap-3">
             <Banknote className="text-green-600"/>
             <span className="text-green-800 font-bold">سجل العمولات المستحقة لموظفي المبيعات</span>
          </div>
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-600 text-sm">
              <tr><th className="p-4">التاريخ</th><th className="p-4">الموظف</th><th className="p-4">سبب العمولة (البيعة)</th><th className="p-4 text-left">قيمة العمولة (ج.م)</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {commissions.map((com) => (
                <tr key={com.id} className="hover:bg-slate-50">
                  <td className="p-4 text-xs text-slate-500">{new Date(com.created_at).toLocaleDateString('ar-EG')}</td>
                  <td className="p-4 font-bold text-slate-800">{com.employee_name}</td>
                  <td className="p-4 text-sm text-slate-600">{com.reason}</td>
                  <td className="p-4 font-black text-green-600 text-left text-lg">+{Number(com.amount).toLocaleString()}</td>
                </tr>
              ))}
              {commissions.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-slate-400 font-bold">لا توجد عمولات مسجلة حتى الآن</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
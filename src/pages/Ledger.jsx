import { useState, useEffect } from 'react';
import { FileSpreadsheet, PlusCircle, Trash2, Wallet, Building2, Users, AlertCircle, Download } from 'lucide-react'; // ضفنا أيقونة Download
import { supabase } from '../supabaseClient';

// -------- حط الدالة هنا بالظبط --------
const exportToCSV = (data, fileName) => {
  if (data.length === 0) return alert('لا توجد بيانات لتصديرها');
  
  // تجهيز البيانات (عشان نشيل الأوبجكتات المعقدة وناخد الأسماء بس)
  const formattedData = data.map(row => ({
    'المبلغ': row.paid_amount,
    'المستثمر': row.investors?.full_name || 'غير محدد',
    'الطرح': row.offerings?.title || 'غير محدد',
    'التاريخ': new Date(row.created_at).toLocaleDateString('ar-EG')
  }));

  const headers = Object.keys(formattedData[0]).join(",");
  const rows = formattedData.map(row => Object.values(row).join(",")).join("\n");
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers + "\n" + rows;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
// ----------------------------------------

  // ... باقي كود الصفحة بتاعك زي ما هو ...
export default function Ledger() {
  const [contributions, setContributions] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(false);

  const [newContribution, setNewContribution] = useState({
    investor_id: '',
    offering_id: '',
    paid_amount: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: inv } = await supabase.from('investors').select('*');
    const { data: off } = await supabase.from('offerings').select('*');
    const { data: con } = await supabase.from('contributions').select('*, investors(full_name), offerings(title)');
    
    if (inv) setInvestors(inv);
    if (off) setOfferings(off);
    if (con) setContributions(con);
  };

  const handleAddContribution = async (e) => {
    e.preventDefault();
    setLoading(true);

    const amount = Number(newContribution.paid_amount);
    const currentUser = JSON.parse(localStorage.getItem('appUser'));
    const investorName = investors.find(i => i.id === newContribution.investor_id)?.full_name;
    const selectedOffering = offerings.find(o => o.id === newContribution.offering_id);

    // 1. تسجيل المساهمة في الجدول الأساسي
    const { data, error } = await supabase.from('contributions').insert([
      {
        investor_id: newContribution.investor_id,
        offering_id: newContribution.offering_id,
        paid_amount: amount,
      }
    ]).select();

    if (!error) {
      // 2. تسجيل "حركة مراقبة" (Audit Log) للموظف
      await supabase.from('audit_logs').insert([{
        employee_name: currentUser.name,
        action_details: `سجل مساهمة بقيمة ${amount} ج.م للمستثمر (${investorName}) في طرح (${selectedOffering.title})`
      }]);

      // 3. حسبة الإغلاق التلقائي (Auto-Close Logic)
      const { data: allCons } = await supabase
        .from('contributions')
        .select('paid_amount')
        .eq('offering_id', selectedOffering.id);

      const totalCollected = allCons.reduce((sum, c) => sum + Number(c.paid_amount), 0);

      if (totalCollected >= selectedOffering.purchase_price) {
        await supabase.from('offerings').update({ status: 'انتهى' }).eq('id', selectedOffering.id);
        
        // تسجيل حركة الإغلاق الآلي
        await supabase.from('audit_logs').insert([{
          employee_name: 'النظام الآلي',
          action_details: `تم إغلاق الطرح (${selectedOffering.title}) تلقائياً لاكتمال السيولة 100%`
        }]);
      }

      // 4. حساب وتسجيل "العمولة" (لو الموظف مبيعات)
      if (currentUser.role === 'مبيعات') {
        const { data: empData } = await supabase
          .from('employees')
          .select('commission_rate')
          .eq('full_name', currentUser.name)
          .single();

        const rate = empData?.commission_rate || 0;
        if (rate > 0) {
          const commissionAmount = (amount * rate) / 100;
          await supabase.from('commissions').insert([{
            employee_name: currentUser.name,
            amount: commissionAmount,
            reason: `عمولة بيع: مساهمة في ${selectedOffering.title} للمستثمر ${investorName}`
          }]);
        }
      }

      setNewContribution({ investor_id: '', offering_id: '', paid_amount: '' });
      fetchData();
      alert(totalCollected >= selectedOffering.purchase_price ? '🎉 تم تسجيل العملية وإغلاق الطرح لاكتماله!' : 'تم تسجيل العملية وحساب العمولات بنجاح.');
    } else {
      alert('خطأ: ' + error.message);
    }
    setLoading(false);
  };

  const deleteContribution = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه العملية؟')) {
      await supabase.from('contributions').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
    {/* هيدر الصفحة والزرار الجديد */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-light/10 rounded-xl text-brand-light"><FileSpreadsheet size={28} /></div>
          <h2 className="text-3xl font-bold text-brand-dark">دفتر الحسابات والسيولة</h2>
        </div>
        
        {/* زرار الإكسيل */}
        <button 
          onClick={() => exportToCSV(contributions, 'تقرير_السيولة_والمساهمات')} 
          className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl font-bold transition-all border border-emerald-200"
        >
          <Download size={20} />
          تصدير للإكسيل
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100">
        <form onSubmit={handleAddContribution} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Users size={14}/> المستثمر</label>
            <select required value={newContribution.investor_id} onChange={(e) => setNewContribution({...newContribution, investor_id: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50 outline-none">
              <option value="">-- اختر مستثمر --</option>
              {investors.map(inv => <option key={inv.id} value={inv.id}>{inv.full_name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Building2 size={14}/> الطرح العقاري</label>
            <select required value={newContribution.offering_id} onChange={(e) => setNewContribution({...newContribution, offering_id: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50 outline-none">
              <option value="">-- اختر العقار --</option>
              {offerings.filter(o => o.status === 'ساري').map(off => (
                <option key={off.id} value={off.id}>{off.title}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Wallet size={14}/> المبلغ</label>
            <input type="number" required value={newContribution.paid_amount} onChange={(e) => setNewContribution({...newContribution, paid_amount: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50 outline-none" placeholder="0.00" />
          </div>
          <button type="submit" disabled={loading} className="p-3 rounded-xl font-bold text-white bg-brand-light hover:bg-brand-hover shadow-lg transition-all">تأكيد العملية</button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-600 text-sm border-b">
            <tr><th className="p-4">اسم المستثمر</th><th className="p-4">الطرح المستهدف</th><th className="p-4">القيمة</th><th className="p-4">إجراء</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contributions.map((con) => (
              <tr key={con.id} className="hover:bg-slate-50">
                <td className="p-4 font-bold">{con.investors?.full_name}</td>
                <td className="p-4 text-slate-600 font-medium">{con.offerings?.title}</td>
                <td className="p-4 font-black text-brand-dark">{Number(con.paid_amount).toLocaleString()} ج.م</td>
                <td className="p-4"><button onClick={() => deleteContribution(con.id)} className="text-red-400 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={18}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
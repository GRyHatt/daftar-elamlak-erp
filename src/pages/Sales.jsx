import { useState, useEffect } from 'react';
import { 
  Calculator, CalendarClock, Layers, CheckCircle, UserCheck, 
  Receipt, ArrowLeftRight, Building, MapPin, Printer, MessageCircle, 
  Search, Trash2, FileText, X, Paperclip, Download, PlusCircle, 
  Edit2, TrendingUp, AlertCircle, Wallet
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Sales() {
  const [activeTab, setActiveTab] = useState('contracts');
  const [offerings, setOfferings] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [installments, setInstallments] = useState([]);
  
  // إحصائيات لوحة القيادة
  const [stats, setStats] = useState({ totalSales: 0, collected: 0, overdue: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  
  const [editingContractId, setEditingContractId] = useState(null);
  const [printData, setPrintData] = useState(null);
  const [statementData, setStatementData] = useState(null);
  const [statementTab, setStatementTab] = useState('ledger'); 
  
  // الدفعات
  const [customPayment, setCustomPayment] = useState({ amount: '', date: new Date().toISOString().split('T')[0], note: '' });
  const [showCustomPaymentForm, setShowCustomPaymentForm] = useState(false);
  const [globalCustomPayment, setGlobalCustomPayment] = useState({ contract_id: '', amount: '', date: new Date().toISOString().split('T')[0], note: '' });
  const [showGlobalPaymentForm, setShowGlobalPaymentForm] = useState(false);

  // ملفات العقد
  const [contractFiles, setContractFiles] = useState([]);
  const [newContract, setNewContract] = useState({
    buyer_name: '', national_id: '', phone: '', address: '', 
    property_source: 'طرح داخلي', offering_id: '', external_unit_name: '', unit_type: 'شقة',
    total_price: '', down_payment: '', installment_months: '36', payment_frequency: 'شهري', penalty_percent: '0.1', start_date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    const { data: off } = await supabase.from('offerings').select('*').eq('status', 'ساري');
    if (off) setOfferings(off);

    const { data: cont } = await supabase.from('contracts').select('*, buyers(*), offerings(title)').order('created_at', { ascending: false });
    if (cont) setContracts(cont);

    const { data: inst } = await supabase.from('installments').select('*, contracts(penalty_percent, property_source, external_unit_name, buyers(full_name, phone), offerings(title))').order('due_date', { ascending: true });
    if (inst) setInstallments(inst);

    if (cont && inst) {
      const tSales = cont.reduce((sum, c) => sum + Number(c.total_price), 0);
      const tCollected = cont.reduce((sum, c) => sum + Number(c.down_payment), 0) + inst.filter(i => i.status === 'مدفوع').reduce((sum, i) => sum + Number(i.amount_due) + Number(i.penalty_amount || 0), 0);
      
      let tOverdue = 0;
      inst.filter(i => i.status !== 'مدفوع').forEach(i => {
        const { late, penalty } = calculateLateInfo(i.due_date, i.amount_due, i.contracts?.penalty_percent);
        if (late) tOverdue += (Number(i.amount_due) + penalty);
      });
      setStats({ totalSales: tSales, collected: tCollected, overdue: tOverdue });
    }
  };

  const handleAddContractFiles = (e) => {
    const newFiles = Array.from(e.target.files);
    setContractFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const handleRemoveContractFile = (indexToRemove) => {
    setContractFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const startEditContract = (contract) => {
    setEditingContractId(contract.id);
    setNewContract({
      buyer_name: contract.buyers?.full_name || '',
      national_id: contract.buyers?.national_id || '',
      phone: contract.buyers?.phone || '',
      address: contract.buyers?.address || '',
      property_source: contract.property_source || 'طرح داخلي',
      offering_id: contract.offering_id || '',
      external_unit_name: contract.external_unit_name || '',
      unit_type: contract.unit_type || 'شقة',
      total_price: contract.total_price || '',
      down_payment: contract.down_payment || '',
      installment_months: contract.installment_years ? (contract.installment_years * 12).toString() : '36',
      payment_frequency: contract.payment_frequency || 'شهري',
      penalty_percent: contract.penalty_percent || '0.1',
      start_date: contract.created_at ? new Date(contract.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setContractFiles([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingContractId(null);
    setNewContract({ buyer_name: '', national_id: '', phone: '', address: '', property_source: 'طرح داخلي', offering_id: '', external_unit_name: '', unit_type: 'شقة', total_price: '', down_payment: '', installment_months: '36', payment_frequency: 'شهري', penalty_percent: '0.1', start_date: new Date().toISOString().split('T')[0] });
    setContractFiles([]);
  };

  const handleSubmitContract = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let buyerId;
      const { data: existingBuyer } = await supabase.from('buyers').select('id').eq('national_id', newContract.national_id).single();
      
      if (existingBuyer) {
        buyerId = existingBuyer.id;
        await supabase.from('buyers').update({ full_name: newContract.buyer_name, phone: newContract.phone, address: newContract.address }).eq('id', buyerId);
      } else {
        const { data: createdBuyer, error: buyerError } = await supabase.from('buyers').insert([{
          full_name: newContract.buyer_name, national_id: newContract.national_id, phone: newContract.phone, address: newContract.address
        }]).select().single();
        if (buyerError) throw buyerError;
        buyerId = createdBuyer.id;
      }

      const contractPayload = {
        buyer_id: buyerId,
        property_source: newContract.property_source,
        offering_id: newContract.property_source === 'طرح داخلي' ? newContract.offering_id : null,
        external_unit_name: newContract.property_source === 'عقار خارجي' ? newContract.external_unit_name : null,
        unit_type: newContract.unit_type,
        total_price: Number(newContract.total_price),
        down_payment: Number(newContract.down_payment),
        payment_frequency: newContract.payment_frequency,
        installment_years: Number(newContract.installment_months) / 12,
        penalty_percent: Number(newContract.penalty_percent),
      };

      if (editingContractId) {
        const { error: contractError } = await supabase.from('contracts').update(contractPayload).eq('id', editingContractId);
        if (contractError) throw contractError;

        if (contractFiles.length > 0) {
          const { data: currentContract } = await supabase.from('contracts').select('attachments').eq('id', editingContractId).single();
          let currentAttachments = [];
          try { currentAttachments = typeof currentContract.attachments === 'string' ? JSON.parse(currentContract.attachments) : currentContract.attachments || []; } catch(err){}

          let finalAttachments = [...currentAttachments];
          for (let file of contractFiles) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${editingContractId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('attachments').upload(fileName, file);
            if (!uploadError) {
              const { data: publicUrlData } = supabase.storage.from('attachments').getPublicUrl(fileName);
              finalAttachments.push({ name: file.name, url: publicUrlData.publicUrl, date: new Date().toISOString().split('T')[0] });
            }
          }
          await supabase.from('contracts').update({ attachments: finalAttachments }).eq('id', editingContractId);
        }

        alert(`تم تحديث بيانات العقد بنجاح!`);
        setEditingContractId(null);
      } else {
        contractPayload.attachments = [];
        const { data: createdContract, error: contractError } = await supabase.from('contracts').insert([contractPayload]).select().single();
        if (contractError) throw contractError;

        let finalAttachments = [];
        if (contractFiles.length > 0) {
          for (let file of contractFiles) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${createdContract.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('attachments').upload(fileName, file);
            if (uploadError) {
              alert(`فشل رفع الملف: ${file.name}`);
            } else {
              const { data: publicUrlData } = supabase.storage.from('attachments').getPublicUrl(fileName);
              finalAttachments.push({ name: file.name, url: publicUrlData.publicUrl, date: new Date().toISOString().split('T')[0] });
            }
          }
          if (finalAttachments.length > 0) {
            await supabase.from('contracts').update({ attachments: finalAttachments }).eq('id', createdContract.id);
          }
        }

        // جدولة الأقساط بدقة الفلوت
        const remainingAmount = contractPayload.total_price - contractPayload.down_payment;
        const freqMap = { 'شهري': 1, 'ربع سنوي': 3, 'نصف سنوي': 6, 'سنوي': 12 };
        const stepMonths = freqMap[newContract.payment_frequency] || 1;
        const totalInstallmentsCount = Math.floor(Number(newContract.installment_months) / stepMonths);
        const installmentAmount = remainingAmount / totalInstallmentsCount;
        
        let startDate = new Date(newContract.start_date);
        let installmentsArray = [];

        for (let i = 0; i < totalInstallmentsCount; i++) {
          let dueDate = new Date(startDate);
          dueDate.setMonth(dueDate.getMonth() + (i * stepMonths));
          installmentsArray.push({
            contract_id: createdContract.id,
            due_date: dueDate.toISOString().split('T')[0],
            amount_due: Number(installmentAmount.toFixed(2)), // تقريب الأقساط لمنزلتين عشريتين
            notes: `قسط ${newContract.payment_frequency}`
          });
        }

        await supabase.from('installments').insert(installmentsArray);
        alert(`تم إنشاء العقد وجدولة الأقساط بنجاح!`);
      }

      setNewContract({ buyer_name: '', national_id: '', phone: '', address: '', property_source: 'طرح داخلي', offering_id: '', external_unit_name: '', unit_type: 'شقة', total_price: '', down_payment: '', installment_months: '36', payment_frequency: 'شهري', penalty_percent: '0.1', start_date: new Date().toISOString().split('T')[0] });
      setContractFiles([]); 
      fetchData();

    } catch (error) {
      alert('خطأ: ' + error.message);
    }
    setLoading(false);
  };

  const handlePayInstallment = async (inst, calculatedPenalty) => {
    if (window.confirm(`تأكيد سداد القسط؟\nالمبلغ: ${inst.amount_due}\nالغرامة: ${calculatedPenalty}\nالإجمالي: ${(inst.amount_due + calculatedPenalty).toFixed(2)} ج.م`)) {
      await supabase.from('installments').update({
        status: 'مدفوع',
        paid_date: new Date().toISOString().split('T')[0],
        penalty_amount: calculatedPenalty
      }).eq('id', inst.id);
      fetchData();
      if (statementData) setStatementData(prev => ({...prev}));
    }
  };

  const handleRecordCustomPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await supabase.from('installments').insert([{
        contract_id: statementData.id,
        due_date: customPayment.date,
        paid_date: customPayment.date,
        amount_due: Number(customPayment.amount),
        status: 'مدفوع',
        notes: customPayment.note || 'دفعة استثنائية',
        penalty_amount: 0
      }]);
      alert('تم تسجيل الدفعة بنجاح.');
      setCustomPayment({ amount: '', date: new Date().toISOString().split('T')[0], note: '' });
      setShowCustomPaymentForm(false);
      fetchData();
    } catch (error) {
      alert('خطأ: ' + error.message);
    }
    setLoading(false);
  };

  const handleGlobalCustomPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!globalCustomPayment.contract_id) return alert('الرجاء اختيار العقد أولاً');
    setLoading(true);
    try {
      await supabase.from('installments').insert([{
        contract_id: globalCustomPayment.contract_id,
        due_date: globalCustomPayment.date,
        paid_date: globalCustomPayment.date,
        amount_due: Number(globalCustomPayment.amount),
        status: 'مدفوع',
        notes: globalCustomPayment.note || 'دفعة استثنائية كاش',
        penalty_amount: 0
      }]);
      alert('تم تسجيل الدفعة وإضافتها لحساب العميل بنجاح!');
      setGlobalCustomPayment({ contract_id: '', amount: '', date: new Date().toISOString().split('T')[0], note: '' });
      setShowGlobalPaymentForm(false);
      fetchData();
    } catch (error) {
      alert('خطأ: ' + error.message);
    }
    setLoading(false);
  };

  // تعديل الحسبة لتدعم الأرقام العشرية بشكل دقيق
  const calculateLateInfo = (dueDate, amountDue, penaltyPercent) => {
    const today = new Date();
    const due = new Date(dueDate);
    if (today > due) {
      const diffTime = Math.abs(today - due);
      const daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const penalty = Number(((amountDue * (Number(penaltyPercent) / 100)) * daysLate).toFixed(2));
      return { late: true, daysLate, penalty };
    }
    return { late: false, daysLate: 0, penalty: 0 };
  };

  const sendWhatsApp = (phone, name, amount, due) => {
    const formattedPhone = phone.startsWith('0') ? `+2${phone}` : phone;
    const msg = `أهلاً بك أستاذ ${name}،\nنذكركم بموعد استحقاق القسط بقيمة *${amount} ج.م* المستحق بتاريخ *${due}*.\nبرجاء سرعة السداد لتجنب غرامات التأخير.\nشكراً لتعاونكم مع دفتر الأملاك.`;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleDeleteContract = async (id, buyerName) => {
    if (window.confirm(`هل أنت متأكد من حذف عقد العميل (${buyerName}) نهائياً؟`)) {
      setLoading(true);
      await supabase.from('contracts').delete().eq('id', id);
      fetchData();
      setLoading(false);
    }
  };

  const handlePrint = (contract) => {
    setPrintData(contract);
    setTimeout(() => { window.print(); setPrintData(null); }, 500);
  };

  const filteredContracts = contracts.filter(c => c.buyers?.full_name.includes(searchQuery) || c.buyers?.national_id.includes(searchQuery));
  
  const statementInsts = statementData ? installments.filter(i => i.contract_id === statementData.id).sort((a,b) => new Date(a.due_date) - new Date(b.due_date)) : [];
  const stmtPaidTotal = statementInsts.filter(i => i.status === 'مدفوع').reduce((sum, i) => sum + Number(i.amount_due), 0);
  const stmtPenaltiesTotal = statementInsts.filter(i => i.status === 'مدفوع').reduce((sum, i) => sum + Number(i.penalty_amount || 0), 0);
  const stmtRemaining = statementData ? Number(statementData.total_price) - Number(statementData.down_payment) - stmtPaidTotal : 0;
  
  let parsedAttachments = [];
  if (statementData && statementData.attachments) {
    try { parsedAttachments = typeof statementData.attachments === 'string' ? JSON.parse(statementData.attachments) : statementData.attachments; } 
    catch(e) { parsedAttachments = []; }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20 relative" dir="rtl">
      
      <style>{`@media print { @page { size: A4; margin: 15mm; } html, body, #root, main, .overflow-y-auto, .overflow-hidden { height: auto !important; overflow: visible !important; position: static !important; background: white !important; } .print-hide { display: none !important; } .page-break-inside-avoid { page-break-inside: avoid; } }`}</style>

      {/* --- الهيدر الإحصائي الجديد (SaaS Style) --- */}
      <div className="print-hide bg-[#0f172a] rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-4 text-white">
          <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/30"><Calculator size={32}/></div>
          <div>
            <h2 className="text-3xl font-black">المبيعات والأقساط</h2>
            <p className="text-slate-400 font-bold text-sm mt-1">إدارة العقود، التدفقات النقدية، وغرامات التأخير</p>
          </div>
        </div>
      </div>

      {/* كروت الملخص المالي السريع */}
      <div className="print-hide grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-lg transition-shadow">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><TrendingUp size={28}/></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">إجمالي المبيعات التعاقدية</p>
            <p className="text-2xl font-black text-slate-800" dir="ltr">{stats.totalSales.toLocaleString()} <span className="text-sm text-slate-500">ج.م</span></p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-lg transition-shadow">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><Wallet size={28}/></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">المحصل الفعلي (خزينة)</p>
            <p className="text-2xl font-black text-slate-800" dir="ltr">{stats.collected.toLocaleString()} <span className="text-sm text-slate-500">ج.م</span></p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-lg transition-shadow">
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl"><AlertCircle size={28}/></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">متأخرات وغرامات قيد التحصيل</p>
            <p className="text-2xl font-black text-slate-800" dir="ltr">{stats.overdue.toLocaleString()} <span className="text-sm text-slate-500">ج.م</span></p>
          </div>
        </div>
      </div>

      {/* 🖨️ العقد القانوني للطباعة */}
      {printData && (
        <div className="hidden print:block text-black bg-white w-full" dir="rtl" style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.8' }}>
          <div className="text-center border-b-2 border-black pb-4 mb-8">
            <h1 className="text-3xl font-bold mb-2">عقد بيع ابتدائي (بنظام التقسيط)</h1>
            <p className="text-xl font-bold">شركة دفتر الأملاك لإدارة العقارات والمقاولات</p>
          </div>
          <div className="text-lg text-justify">
            <p className="mb-6">إنه في يوم الموافق <strong>{new Date(printData.created_at).toLocaleDateString('ar-EG')}</strong>، تم الاتفاق والتراضي بين كل من:</p>
            <div className="mb-6"><p className="font-bold">أولاً: شركة دفتر الأملاك لإدارة العقارات</p><p className="font-bold mr-8 mt-2 text-left">(طــرف أول بائــع)</p></div>
            <div className="mb-8">
              <p className="font-bold">ثانياً: السيد/ة <strong>{printData.buyers?.full_name}</strong></p>
              <p className="mr-8">بطاقة رقم قومي: <strong>{printData.buyers?.national_id}</strong><br/>المقيم في: <strong>{printData.buyers?.address || '..............................................................'}</strong><br/>رقم الهاتف: <span dir="ltr"><strong>{printData.buyers?.phone}</strong></span></p>
              <p className="font-bold mr-8 mt-2 text-left">(طــرف ثانــي مشتــري)</p>
            </div>
            <div className="space-y-6 mt-6">
              <p><strong className="underline">البند الأول:</strong> باع الطرف الأول للطرف الثاني الوحدة (<strong>{printData.unit_type}</strong>) بمشروع: (<strong>{printData.property_source === 'طرح داخلي' ? printData.offerings?.title : printData.external_unit_name}</strong>).</p>
              <p><strong className="underline">البند الثاني (الثمن):</strong> تم البيع نظير <strong>{Number(printData.total_price).toLocaleString()} ج.م</strong>. دفع الطرف الثاني مقدم <strong>{Number(printData.down_payment).toLocaleString()} ج.م</strong>. يتبقى <strong>{Number(printData.total_price - printData.down_payment).toLocaleString()} ج.م</strong> يسدد بنظام <strong>{printData.payment_frequency}</strong>.</p>
              <p><strong className="underline">البند الثالث:</strong> في حالة التأخير يُطبق غرامة بواقع <strong>{printData.penalty_percent}%</strong> عن كل يوم تأخير.</p>
            </div>
            <div className="mt-20 flex justify-between px-10 page-break-inside-avoid">
              <div className="text-center font-bold"><p>الطرف الأول (البائع)</p><p className="mt-8">.......................</p></div>
              <div className="text-center font-bold"><p>الطرف الثاني (المشتري)</p><p className="mt-8">.......................</p></div>
            </div>
          </div>
        </div>
      )}

      {/* 📄 نافذة كشف الحساب والمرفقات */}
      {statementData && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex justify-center items-start pt-10 px-4 overflow-y-auto print:static print:bg-white print:p-0 print:block animate-fade-in">
          <div className="bg-white w-full max-w-5xl rounded-[2rem] p-8 shadow-2xl relative mb-10 border border-slate-100 print:w-full print:m-0 print:p-0 print:border-none print:shadow-none">
            <div className="print-hide flex justify-between items-center mb-6">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setStatementTab('ledger')} className={`px-6 py-2.5 rounded-lg font-black transition-all ${statementTab === 'ledger' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>كشف الحساب (Ledger)</button>
                <button onClick={() => setStatementTab('attachments')} className={`px-6 py-2.5 rounded-lg font-black transition-all ${statementTab === 'attachments' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>المستندات والأوراق</button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setTimeout(() => window.print(), 300); }} className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white px-5 py-2.5 rounded-xl font-bold transition-colors"><Printer size={18} /> طباعة رسمية</button>
                <button onClick={() => setStatementData(null)} className="p-2.5 bg-slate-100 text-slate-500 hover:bg-red-500 hover:text-white rounded-xl transition-colors"><X size={20} /></button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100 print:bg-transparent print:border-slate-300 print:p-4">
              <div><p className="text-xs text-slate-400 font-bold mb-1 uppercase">اسم العميل</p><p className="font-black text-slate-800 text-lg">{statementData.buyers?.full_name}</p></div>
              <div><p className="text-xs text-slate-400 font-bold mb-1 uppercase">الوحدة / العقار</p><p className="font-black text-slate-800 text-lg">{statementData.property_source === 'طرح داخلي' ? statementData.offerings?.title : statementData.external_unit_name}</p></div>
              <div><p className="text-xs text-slate-400 font-bold mb-1 uppercase">إجمالي قيمة العقد</p><p className="font-black text-indigo-600 text-xl" dir="ltr">{Number(statementData.total_price).toLocaleString()} ج.م</p></div>
              <div><p className="text-xs text-slate-400 font-bold mb-1 uppercase">المتبقي المستحق للشركة</p><p className="font-black text-red-600 text-xl" dir="ltr">{stmtRemaining.toLocaleString()} ج.م</p></div>
            </div>

            {statementTab === 'ledger' && (
              <div className="animate-fade-in">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-center print-hide">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">المقدم المدفوع</p><p className="font-black text-emerald-600 text-xl" dir="ltr">{Number(statementData.down_payment).toLocaleString()}</p></div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">أقساط مسددة</p><p className="font-black text-blue-600 text-xl" dir="ltr">{stmtPaidTotal.toLocaleString()}</p></div>
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 shadow-sm"><p className="text-[10px] font-bold text-amber-600 uppercase mb-1">إجمالي الغرامات المحصلة</p><p className="font-black text-amber-700 text-xl" dir="ltr">{stmtPenaltiesTotal.toLocaleString()}</p></div>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-center hover:bg-slate-100 cursor-pointer transition-colors" onClick={() => setShowCustomPaymentForm(!showCustomPaymentForm)}>
                    <p className="flex items-center justify-center gap-2 text-indigo-600 font-black"><PlusCircle size={20}/> دفعة استثنائية</p>
                  </div>
                </div>

                {showCustomPaymentForm && (
                  <form onSubmit={handleRecordCustomPayment} className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl mb-8 flex gap-4 items-end print-hide animate-fade-in">
                    <div className="flex-1 space-y-1"><label className="text-xs font-bold text-indigo-700">المبلغ المدفوع (Float مسموح) *</label><input type="number" step="any" required value={customPayment.amount} onChange={e=>setCustomPayment({...customPayment, amount:e.target.value})} className="w-full p-3 rounded-xl border border-indigo-200 outline-none font-bold"/></div>
                    <div className="flex-1 space-y-1"><label className="text-xs font-bold text-indigo-700">تاريخ السداد *</label><input type="date" required value={customPayment.date} onChange={e=>setCustomPayment({...customPayment, date:e.target.value})} className="w-full p-3 rounded-xl border border-indigo-200 outline-none font-bold"/></div>
                    <div className="flex-2 space-y-1"><label className="text-xs font-bold text-indigo-700">ملاحظات / بيان</label><input type="text" value={customPayment.note} onChange={e=>setCustomPayment({...customPayment, note:e.target.value})} className="w-full p-3 rounded-xl border border-indigo-200 outline-none font-bold"/></div>
                    <button type="submit" disabled={loading} className="p-3 px-6 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-lg">خصم وتسجيل</button>
                  </form>
                )}

                <h3 className="font-black text-lg mb-4 text-slate-800 border-r-4 border-indigo-600 pr-3">حركة الحساب (سجل الأقساط)</h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-right text-sm border-collapse">
                    <thead className="bg-slate-100 text-slate-600 border-b-2 border-slate-200 print:bg-slate-50">
                      <tr><th className="p-4 font-bold">#</th><th className="p-4 font-bold">البيان</th><th className="p-4 font-bold">تاريخ الاستحقاق</th><th className="p-4 font-bold">قيمة القسط</th><th className="p-4 text-center font-bold">حالة السداد</th><th className="p-4 font-bold">تاريخ الدفع</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {statementInsts.map((inst, index) => {
                        const isPaid = inst.status === 'مدفوع';
                        const lateInfo = isPaid ? null : calculateLateInfo(inst.due_date, inst.amount_due, statementData.penalty_percent);
                        return (
                          <tr key={inst.id} className={`transition-colors ${isPaid ? 'bg-emerald-50/40 hover:bg-emerald-50' : lateInfo?.late ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-slate-50'}`}>
                            <td className="p-4 font-bold text-slate-400">{index + 1}</td>
                            <td className="p-4 text-slate-700 font-bold">{inst.notes || 'قسط مجدول'}</td>
                            <td className="p-4 font-bold text-slate-800">{new Date(inst.due_date).toLocaleDateString('ar-EG')}</td>
                            <td className="p-4 font-black text-slate-800" dir="ltr">{Number(inst.amount_due).toLocaleString()}</td>
                            <td className="p-4 text-center">{isPaid ? <span className="text-emerald-700 text-xs bg-emerald-100 px-3 py-1 rounded-md font-black">مسدد</span> : lateInfo?.late ? <span className="text-red-700 text-xs bg-red-100 px-3 py-1 rounded-md font-black">متأخر</span> : <span className="text-slate-500 text-xs bg-slate-100 px-3 py-1 rounded-md font-black">انتظار</span>}</td>
                            <td className="p-4 text-xs font-bold text-slate-500">{isPaid ? new Date(inst.paid_date).toLocaleDateString('ar-EG') : '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {statementTab === 'attachments' && (
              <div className="animate-fade-in print-hide">
                <h3 className="font-black text-lg mb-4 text-slate-800 border-r-4 border-indigo-600 pr-3">أرشيف المستندات والوثائق</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {parsedAttachments.length > 0 ? (
                    parsedAttachments.map((file, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 p-5 rounded-2xl flex items-start gap-4 hover:border-indigo-400 hover:shadow-md transition-all">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Paperclip size={24}/></div>
                        <div className="flex-1 overflow-hidden">
                          <p className="font-black text-slate-800 text-sm truncate" title={file.name}>{file.name}</p>
                          <p className="text-xs text-slate-400 mt-1 font-bold">{new Date(file.date).toLocaleDateString('ar-EG')}</p>
                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 text-xs font-black mt-3 inline-flex items-center gap-1 hover:underline bg-indigo-50 px-3 py-1 rounded-md"><Download size={14}/> عرض وتحميل الملف</a>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400 font-bold">
                      <FileText size={48} className="mx-auto mb-4 opacity-50"/>
                      لا توجد مستندات مرفوعة بملف هذا العميل حالياً.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- نظام التبويبات والملاحة (Tabs) --- */}
      <div className="print-hide">
        <div className="flex flex-wrap bg-white rounded-2xl p-2 shadow-sm border border-slate-100 w-full md:w-fit mb-8 gap-1">
          <button onClick={() => setActiveTab('contracts')} className={`flex items-center gap-2 px-8 py-3 rounded-xl font-black transition-all ${activeTab === 'contracts' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
            <UserCheck size={20}/> سجل التعاقدات والمبيعات
          </button>
          <button onClick={() => setActiveTab('installments')} className={`flex items-center gap-2 px-8 py-3 rounded-xl font-black transition-all ${activeTab === 'installments' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
            <CalendarClock size={20}/> إدارة وتحصيل الأقساط
          </button>
          <button onClick={() => window.open('/merger', '_blank')} className="flex items-center gap-2 px-8 py-3 rounded-xl font-black transition-all text-slate-500 hover:bg-slate-50 hover:text-indigo-600">
            <Layers size={20}/> أداة دمج المستندات
          </button>
        </div>

        {/* --- تبويب العقود (Contracts) --- */}
        {activeTab === 'contracts' && (
          <div className="space-y-6 animate-fade-in">
            <form onSubmit={handleSubmitContract} className={`bg-white p-8 rounded-[2rem] shadow-sm border grid grid-cols-1 md:grid-cols-6 gap-6 ${editingContractId ? 'border-amber-400 ring-4 ring-amber-50' : 'border-slate-100'}`}>
              <h3 className="md:col-span-6 text-xl font-black border-b border-slate-100 pb-4 text-slate-800 flex items-center gap-2">
                {editingContractId ? <><Edit2 className="text-amber-500"/> تعديل بيانات العقد رقم #{editingContractId}</> : <><PlusCircle className="text-indigo-600"/> الخطوة 1: بيانات العميل (KYC)</>}
              </h3>
              
              <div className="space-y-1 md:col-span-2"><label className="text-xs font-bold text-slate-500">اسم العميل الرباعي *</label><input type="text" required value={newContract.buyer_name} onChange={(e) => setNewContract({...newContract, buyer_name: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-indigo-500 font-bold text-slate-800" /></div>
              <div className="space-y-1 md:col-span-2"><label className="text-xs font-bold text-slate-500">الرقم القومي (14 رقم) *</label><input type="text" required maxLength="14" value={newContract.national_id} onChange={(e) => setNewContract({...newContract, national_id: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-indigo-500 font-bold tracking-widest text-slate-800" dir="ltr" /></div>
              <div className="space-y-1 md:col-span-2"><label className="text-xs font-bold text-slate-500">رقم الهاتف للتواصل *</label><input type="text" required value={newContract.phone} onChange={(e) => setNewContract({...newContract, phone: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-indigo-500 font-bold text-slate-800" dir="ltr" /></div>
              
              <h3 className="md:col-span-6 text-xl font-black border-b border-slate-100 pb-4 mt-6 text-slate-800 flex items-center gap-2">
                <Building className="text-indigo-600"/> الخطوة 2: بيانات الوحدة ونظام السداد (دعم الأرقام العشرية)
              </h3>
              
              <div className="md:col-span-3 space-y-1">
                <label className="text-xs font-bold text-slate-500">مصدر العقار *</label>
                <div className="flex bg-slate-100 rounded-xl p-1">
                  <button type="button" onClick={() => setNewContract({...newContract, property_source: 'طرح داخلي', external_unit_name: ''})} className={`flex-1 py-3 text-sm font-black rounded-lg transition-colors ${newContract.property_source === 'طرح داخلي' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>مشاريع الشركة الخاصة</button>
                  <button type="button" onClick={() => setNewContract({...newContract, property_source: 'عقار خارجي', offering_id: ''})} className={`flex-1 py-3 text-sm font-black rounded-lg transition-colors ${newContract.property_source === 'عقار خارجي' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500'}`}>عقار خارجي (وساطة)</button>
                </div>
              </div>
              
              <div className="md:col-span-3 space-y-1">
                <label className="text-xs font-bold text-slate-500">تحديد المشروع أو العقار *</label>
                {newContract.property_source === 'طرح داخلي' ? (
                  <select required value={newContract.offering_id} onChange={(e) => setNewContract({...newContract, offering_id: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-indigo-500 font-bold text-slate-800">
                    <option value="">-- اضغط لاختيار المشروع --</option>
                    {offerings.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
                  </select>
                ) : (
                  <input type="text" required value={newContract.external_unit_name} onChange={(e) => setNewContract({...newContract, external_unit_name: e.target.value})} className="w-full p-4 rounded-xl border border-amber-200 bg-amber-50 outline-none focus:border-amber-500 font-bold text-slate-800" placeholder="اكتب وصف/عنوان العقار الخارجي..." />
                )}
              </div>

              {/* حقول تقبل أرقام عشرية (Float) بفضل step="any" */}
              <div className="space-y-1 md:col-span-2"><label className="text-xs font-bold text-slate-500">السعر الإجمالي (مسموح بالكسور) *</label><input type="number" step="any" required value={newContract.total_price} onChange={(e) => setNewContract({...newContract, total_price: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-indigo-500 font-black text-slate-800 text-lg" dir="ltr" /></div>
              <div className="space-y-1 md:col-span-2"><label className="text-xs font-bold text-slate-500">المقدم المدفوع (مسموح بالكسور) *</label><input type="number" step="any" required value={newContract.down_payment} onChange={(e) => setNewContract({...newContract, down_payment: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 bg-emerald-50 outline-none focus:border-emerald-500 font-black text-emerald-700 text-lg" dir="ltr" /></div>
              <div className="space-y-1 md:col-span-2"><label className="text-xs font-bold text-slate-500">نسبة الغرامة اليومية (%) *</label><input type="number" step="any" required value={newContract.penalty_percent} onChange={(e) => setNewContract({...newContract, penalty_percent: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-indigo-500 font-bold text-slate-800" dir="ltr" /></div>
              
              <div className="space-y-1 md:col-span-2"><label className="text-xs font-bold text-indigo-700">مدة التقسيط (بالأشهر) *</label><input type="number" required value={newContract.installment_months} onChange={(e) => setNewContract({...newContract, installment_months: e.target.value})} className="w-full p-4 rounded-xl border border-indigo-200 bg-indigo-50 outline-none focus:border-indigo-500 font-black text-indigo-900" /></div>
              <div className="space-y-1 md:col-span-2"><label className="text-xs font-bold text-indigo-700">نظام الدفع (تكرار القسط) *</label><select value={newContract.payment_frequency} onChange={(e) => setNewContract({...newContract, payment_frequency: e.target.value})} className="w-full p-4 rounded-xl border border-indigo-200 bg-indigo-50 outline-none focus:border-indigo-500 font-black text-indigo-900"><option>شهري</option><option>ربع سنوي</option><option>نصف سنوي</option><option>سنوي</option></select></div>
              <div className="space-y-1 md:col-span-2"><label className="text-xs font-bold text-slate-500">تاريخ بدء الأقساط (تاريخ الاستحقاق)</label><input type="date" value={newContract.start_date} onChange={(e) => setNewContract({...newContract, start_date: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-indigo-500 font-bold text-slate-800" /></div>
              
              <div className="space-y-4 md:col-span-6 bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300">
                <label className="text-sm font-black text-slate-700 flex items-center gap-2">
                  <Paperclip size={20}/> المرفقات الورقية (بطاقة، إيصالات، عقود سابقة)
                </label>
                {contractFiles.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {contractFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
                        <span className="text-sm font-bold text-slate-600 truncate max-w-[200px]" title={file.name}>{file.name}</span>
                        <button type="button" onClick={() => handleRemoveContractFile(idx)} className="text-red-400 hover:text-red-600 bg-red-50 p-1 rounded-md"><X size={16}/></button>
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <label className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-400 text-indigo-600 px-6 py-3 rounded-xl font-bold cursor-pointer transition-all shadow-sm">
                    <PlusCircle size={18}/> {contractFiles.length > 0 ? 'إضافة المزيد من الملفات' : 'تصفح جهازك لاختيار الملفات للرفع'}
                    <input type="file" multiple onChange={handleAddContractFiles} className="hidden" accept="image/*,.pdf,.doc,.docx" />
                  </label>
                </div>
              </div>

              <div className="md:col-span-6 flex gap-4 mt-2">
                <button type="submit" disabled={loading} className={`flex-1 p-5 rounded-2xl font-black text-white transition-all shadow-xl text-lg flex justify-center items-center gap-2 ${editingContractId ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'}`}>
                  {editingContractId ? 'حفظ التحديثات' : 'تسجيل العقد وجدولة الأقساط تلقائياً'}
                </button>
                {editingContractId && (
                  <button type="button" onClick={cancelEdit} className="px-10 py-5 bg-slate-100 text-slate-600 hover:bg-slate-200 font-black rounded-2xl flex justify-center items-center gap-2 transition-all">
                    <X size={20}/> إلغاء
                  </button>
                )}
              </div>
            </form>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mt-8">
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><UserCheck className="text-indigo-600"/> الأرشيف وسجل المبيعات</h3>
                <div className="relative w-full md:w-80">
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث باسم العميل أو الرقم القومي..." className="w-full pl-10 pr-4 py-3 text-sm font-bold rounded-xl border border-slate-200 outline-none focus:border-indigo-500 shadow-sm" />
                  <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm min-w-[1000px]">
                  <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                    <tr><th className="p-5 font-bold">العميل (بيانات الاتصال)</th><th className="p-5 font-bold">العقار المتعاقد عليه</th><th className="p-5 font-bold">القيمة والمدفوع</th><th className="p-5 text-center font-bold">إدارة الملف</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredContracts.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-5">
                          <p className="font-black text-slate-800 text-base">{c.buyers?.full_name}</p>
                          <p className="text-xs text-slate-500 font-bold mt-1" dir="ltr">{c.buyers?.phone}</p>
                        </td>
                        <td className="p-5">
                          <p className="font-bold text-slate-700">{c.property_source === 'طرح داخلي' ? c.offerings?.title : c.external_unit_name}</p>
                          <span className="inline-block mt-1 px-2 py-1 bg-slate-100 text-slate-500 rounded-md text-[10px] font-bold">{c.property_source}</span>
                        </td>
                        <td className="p-5">
                          <p className="font-black text-indigo-700 text-lg block" dir="ltr">{Number(c.total_price).toLocaleString()} <span className="text-xs text-slate-500 font-bold">ج.م</span></p>
                          <p className="text-[10px] text-emerald-600 font-bold mt-1" dir="ltr">مقدم: {Number(c.down_payment).toLocaleString()} ج.م</p>
                        </td>
                        <td className="p-5 flex justify-center gap-3">
                          <button onClick={() => setStatementData(c)} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-800 hover:text-white transition-all shadow-sm" title="فتح كشف الحساب والمرفقات"><FileText size={18}/></button>
                          <button onClick={() => handlePrint(c)} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="طباعة العقد الرسمي"><Printer size={18}/></button>
                          <button onClick={() => startEditContract(c)} className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-sm" title="تعديل تفاصيل العقد"><Edit2 size={18}/></button>
                          <button onClick={() => handleDeleteContract(c.id, c.buyers?.full_name)} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm" title="حذف العقد نهائياً"><Trash2 size={18}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- تبويب الأقساط (Installments) --- */}
        {activeTab === 'installments' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-l from-indigo-600 to-blue-700 p-8 rounded-[2rem] shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="text-white">
                 <h3 className="font-black text-2xl flex items-center gap-3 mb-2"><Receipt size={28}/> مركز التحصيل السريع</h3>
                 <p className="text-sm text-indigo-100 font-medium">سجل الدفعات الاستثنائية، أقساط الكاش، والمخالصات خارج الجدول الزمني من هنا مباشرة.</p>
               </div>
               <button onClick={() => setShowGlobalPaymentForm(!showGlobalPaymentForm)} className="bg-white text-indigo-700 hover:bg-indigo-50 px-8 py-4 rounded-2xl font-black transition-all flex items-center gap-2 shadow-lg hover:scale-105">
                  <PlusCircle size={20} /> {showGlobalPaymentForm ? 'إلغاء وإغلاق النافذة' : 'فتح شاشة التحصيل'}
               </button>
            </div>

            {showGlobalPaymentForm && (
              <form onSubmit={handleGlobalCustomPaymentSubmit} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-lg grid grid-cols-1 md:grid-cols-5 gap-6 items-end animate-fade-in">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500">اختر العميل والعقار المراد خصم الدفعة منه *</label>
                  <select required value={globalCustomPayment.contract_id} onChange={(e) => setGlobalCustomPayment({...globalCustomPayment, contract_id: e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 font-bold bg-slate-50">
                    <option value="">-- ابحث واختار العقد --</option>
                    {contracts.map(c => <option key={c.id} value={c.id}>{c.buyers?.full_name} - ({c.property_source === 'طرح داخلي' ? c.offerings?.title : c.external_unit_name})</option>)}
                  </select>
                </div>
                <div className="space-y-2 md:col-span-1"><label className="text-xs font-bold text-slate-500">مبلغ التحصيل (Float) *</label><input type="number" step="any" required value={globalCustomPayment.amount} onChange={e=>setGlobalCustomPayment({...globalCustomPayment, amount:e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 font-black bg-slate-50"/></div>
                <div className="space-y-2 md:col-span-1"><label className="text-xs font-bold text-slate-500">تاريخ السداد الفعلي *</label><input type="date" required value={globalCustomPayment.date} onChange={e=>setGlobalCustomPayment({...globalCustomPayment, date:e.target.value})} className="w-full p-4 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 font-bold bg-slate-50"/></div>
                <button type="submit" disabled={loading} className="md:col-span-1 w-full p-4 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-xl transition-all">تأكيد الخصم</button>
              </form>
            )}

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mt-8">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><CalendarClock className="text-indigo-600"/> جدول المراقبة والاستحقاقات الشامل</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm min-w-[1100px]">
                  <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                    <tr><th className="p-5 font-bold">تاريخ الاستحقاق</th><th className="p-5 font-bold">العميل والمشروع</th><th className="p-5 font-bold">قيمة القسط</th><th className="p-5 font-bold">موقف التأخير</th><th className="p-5 font-bold">إجمالي المطلوب</th><th className="p-5 text-center font-bold">إجراءات التحصيل</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {installments.map(inst => {
                      const isPaid = inst.status === 'مدفوع';
                      const { late, daysLate, penalty } = isPaid ? { late:false, daysLate:0, penalty:0 } : calculateLateInfo(inst.due_date, inst.amount_due, inst.contracts?.penalty_percent);
                      const finalAmount = isPaid ? inst.amount_due + (inst.penalty_amount || 0) : inst.amount_due + penalty;
                      return (
                        <tr key={inst.id} className={`transition-colors ${isPaid ? 'bg-emerald-50/30' : late ? 'bg-red-50/20' : 'hover:bg-slate-50'}`}>
                          <td className="p-5 font-black text-slate-800">{new Date(inst.due_date).toLocaleDateString('ar-EG')}</td>
                          <td className="p-5"><p className="font-bold text-slate-900 text-base">{inst.contracts?.buyers?.full_name}</p><p className="text-xs text-slate-500 font-bold mt-1 bg-slate-100 inline-block px-2 py-0.5 rounded">{inst.notes || 'قسط مجدول'}</p></td>
                          <td className="p-5 font-black text-slate-600" dir="ltr">{Number(inst.amount_due).toLocaleString()} <span className="text-[10px] font-bold">ج.م</span></td>
                          <td className="p-5">
                            {isPaid ? <span className="text-emerald-700 text-xs bg-emerald-100 px-3 py-1 rounded-md font-black">تم السداد</span> : late ? <div><p className="text-xs font-black text-red-600 bg-red-100 inline-block px-2 py-0.5 rounded-md mb-1">متأخر {daysLate} يوم</p><p className="text-[10px] font-black text-red-500" dir="ltr">+ {penalty.toLocaleString()} غرامة</p></div> : <span className="text-slate-400 text-xs font-bold bg-slate-100 px-2 py-1 rounded-md">في الانتظار</span>}
                          </td>
                          <td className={`p-5 font-black text-xl ${late && !isPaid ? 'text-red-600' : 'text-indigo-700'}`} dir="ltr">{Number(finalAmount.toFixed(2)).toLocaleString()} <span className="text-[10px] font-bold">ج.م</span></td>
                          <td className="p-5 flex justify-center gap-3">
                            {isPaid ? (
                              <div className="flex flex-col items-center gap-1 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100"><CheckCircle size={20}/><span className="text-[10px] font-black">{new Date(inst.paid_date).toLocaleDateString('ar-EG')}</span></div>
                            ) : (
                              <>
                                {late && <button onClick={() => sendWhatsApp(inst.contracts?.buyers?.phone, inst.contracts?.buyers?.full_name, finalAmount.toFixed(2), new Date(inst.due_date).toLocaleDateString('ar-EG'))} className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-500 hover:text-white transition-all shadow-sm" title="إرسال تذكير واتساب"><MessageCircle size={20}/></button>}
                                <button onClick={() => handlePayInstallment(inst, penalty)} className="flex items-center gap-2 bg-slate-900 hover:bg-blue-600 text-white px-5 py-3 rounded-xl font-black transition-all shadow-md"><Receipt size={18}/> تحصيل وتأكيد</button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Calculator, CalendarClock, AlertTriangle, CheckCircle, UserCheck, Receipt, ArrowLeftRight, Building, MapPin, Printer, MessageCircle, Search, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Sales() {
  const [activeTab, setActiveTab] = useState('contracts'); 
  
  const [buyers, setBuyers] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [installments, setInstallments] = useState([]);
  
  const [stats, setStats] = useState({ totalSales: 0, collected: 0, overdue: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  const [printData, setPrintData] = useState(null);
  
  const [newContract, setNewContract] = useState({
    buyer_name: '', national_id: '', phone: '', address: '', 
    property_source: 'طرح داخلي', offering_id: '', external_unit_name: '', unit_type: 'شقة',
    total_price: '', down_payment: '', installment_years: '3', penalty_percent: '0.1', start_date: new Date().toISOString().split('T')[0]
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
      const tCollected = cont.reduce((sum, c) => sum + Number(c.down_payment), 0) + inst.filter(i => i.status === 'مدفوع').reduce((sum, i) => sum + Number(i.amount_due) + Number(i.penalty_amount), 0);
      
      let tOverdue = 0;
      inst.filter(i => i.status !== 'مدفوع').forEach(i => {
        const { late, penalty } = calculateLateInfo(i.due_date, i.amount_due, i.contracts?.penalty_percent);
        if (late) tOverdue += (Number(i.amount_due) + penalty);
      });

      setStats({ totalSales: tSales, collected: tCollected, overdue: tOverdue });
    }
  };

  const handleCreateContract = async (e) => {
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
        installment_years: Number(newContract.installment_years),
        penalty_percent: Number(newContract.penalty_percent)
      };

      const { data: createdContract, error: contractError } = await supabase.from('contracts').insert([contractPayload]).select().single();
      if (contractError) throw contractError;

      const remainingAmount = contractPayload.total_price - contractPayload.down_payment;
      const totalMonths = contractPayload.installment_years * 12;
      const monthlyAmount = remainingAmount / totalMonths;
      
      let startDate = new Date(newContract.start_date);
      let installmentsArray = [];

      for (let i = 1; i <= totalMonths; i++) {
        let dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        installmentsArray.push({
          contract_id: createdContract.id,
          due_date: dueDate.toISOString().split('T')[0],
          amount_due: Math.round(monthlyAmount)
        });
      }

      await supabase.from('installments').insert(installmentsArray);

      alert(`تم الإنشاء! تم توليد ${totalMonths} قسط آلياً.`);
      setNewContract({ buyer_name: '', national_id: '', phone: '', address: '', property_source: 'طرح داخلي', offering_id: '', external_unit_name: '', unit_type: 'شقة', total_price: '', down_payment: '', installment_years: '3', penalty_percent: '0.1', start_date: new Date().toISOString().split('T')[0] });
      fetchData();

    } catch (error) {
      alert('خطأ: ' + error.message);
    }
    setLoading(false);
  };

  const handleDeleteContract = async (id, buyerName) => {
    if (window.confirm(`هل أنت متأكد من حذف عقد العميل (${buyerName}) نهائياً؟\n\nتنبيه: سيتم مسح هذا العقد وجميع الأقساط المرتبطة به للأبد!`)) {
      setLoading(true);
      const { error } = await supabase.from('contracts').delete().eq('id', id);
      if (error) {
        alert('حدث خطأ أثناء الحذف: ' + error.message);
      } else {
        fetchData();
      }
      setLoading(false);
    }
  };

  const handlePayInstallment = async (inst, calculatedPenalty) => {
    if (window.confirm(`تأكيد سداد القسط؟\nالمبلغ: ${inst.amount_due}\nالغرامة: ${calculatedPenalty}\nالإجمالي: ${inst.amount_due + calculatedPenalty} ج.م`)) {
      await supabase.from('installments').update({
        status: 'مدفوع',
        paid_date: new Date().toISOString().split('T')[0],
        penalty_amount: calculatedPenalty
      }).eq('id', inst.id);
      fetchData();
    }
  };

  const calculateLateInfo = (dueDate, amountDue, penaltyPercent) => {
    const today = new Date();
    const due = new Date(dueDate);
    if (today > due) {
      const diffTime = Math.abs(today - due);
      const daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const penalty = Math.round((amountDue * (penaltyPercent / 100)) * daysLate);
      return { late: true, daysLate, penalty };
    }
    return { late: false, daysLate: 0, penalty: 0 };
  };

  const sendWhatsApp = (phone, name, amount, due) => {
    const formattedPhone = phone.startsWith('0') ? `+2${phone}` : phone;
    const msg = `أهلاً بك أستاذ ${name}،\nنذكركم بموعد استحقاق القسط بقيمة *${amount} ج.م* المستحق بتاريخ *${due}*.\nبرجاء سرعة السداد لتجنب غرامات التأخير.\nشكراً لتعاونكم مع دفتر الأملاك.`;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handlePrint = (contract) => {
    setPrintData(contract);
    setTimeout(() => {
      window.print();
      setPrintData(null); // قفل العقد بعد الطباعة للرجوع للصفحة
    }, 500);
  };

  const filteredContracts = contracts.filter(c => c.buyers?.full_name.includes(searchQuery) || c.buyers?.national_id.includes(searchQuery));

  return (
    <div className="space-y-8 animate-fade-in pb-20 relative">
      
      {/* 🖨️ العقد القانوني للطباعة (تعديل جذري للسماح بتعدد الصفحات) */}
      {printData && (
        <div className="hidden print:block text-black bg-white w-full" dir="rtl" style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.8' }}>
          
          {/* ستايل سحري بيلغي كل قيود الريأكت ويسمح للورق يطبع براحته */}
          <style>
            {`
              @media print {
                @page { size: A4; margin: 15mm; }
                /* إلغاء الـ Scroll وإجبار المتصفح يعرض كل المحتوى للطباعة */
                html, body, #root, main, .overflow-y-auto, .overflow-hidden {
                  height: auto !important;
                  overflow: visible !important;
                  position: static !important;
                  background: white !important;
                }
                .print-hide { display: none !important; }
                
                /* الحفاظ على التوقيعات في صفحة واحدة إذا أمكن */
                .page-break-inside-avoid {
                  page-break-inside: avoid;
                }
              }
            `}
          </style>

          {/* هيدر العقد */}
          <div className="text-center border-b-2 border-black pb-4 mb-8">
            <h1 className="text-3xl font-bold mb-2">عقد بيع ابتدائي (بنظام التقسيط)</h1>
            <p className="text-xl font-bold">شركة دفتر الأملاك لإدارة العقارات والمقاولات</p>
          </div>

          <div className="text-lg text-justify">
            <p className="mb-6">
              إنه في يوم (.................) الموافق <strong>{new Date(printData.created_at).toLocaleDateString('ar-EG')}</strong>، تم الاتفاق والتراضي بين كل من:
            </p>

            {/* أطراف العقد */}
            <div className="mb-6">
              <p className="font-bold">أولاً: شركة دفتر الأملاك لإدارة العقارات</p>
              <p className="mr-8">ويمثلها قانوناً في التوقيع على هذا العقد السيد/ ..............................................................</p>
              <p className="font-bold mr-8 mt-2 text-left">(طــرف أول بائــع)</p>
            </div>

            <div className="mb-8">
              <p className="font-bold">ثانياً: السيد/ة <strong>{printData.buyers?.full_name}</strong></p>
              <p className="mr-8">
                الجنسية: مصري - يحمل بطاقة رقم قومي: <strong>{printData.buyers?.national_id}</strong><br/>
                المقيم في: <strong>{printData.buyers?.address || '..............................................................'}</strong><br/>
                رقم الهاتف: <span dir="ltr"><strong>{printData.buyers?.phone}</strong></span>
              </p>
              <p className="font-bold mr-8 mt-2 text-left">(طــرف ثانــي مشتــري)</p>
            </div>

            <p className="font-bold text-center text-xl mb-6 border-y-2 border-black py-2">تمهيــــد</p>
            <p className="mb-6">بعد أن أقر الطرفان بأهليتهما القانونية والفعلية للتعاقد والتصرف، وعدم خضوع أي منهما لأحكام الحراسة، اتفقا على تحرير هذا العقد وفقاً للبنود الآتية:</p>

            {/* البنود */}
            <div className="space-y-6">
              <p><strong className="underline">البند الأول (موضوع العقد):</strong> يُعتبر التمهيد السابق جزء لا يتجزأ من هذا العقد. بموجب هذا العقد باع وأسقط وتنازل الطرف الأول (الشركة) للطرف الثاني (المشتري)، القابل لذلك، الوحدة العقارية عبارة عن (<strong>{printData.unit_type}</strong>) بمشروع/عقار: (<strong>{printData.property_source === 'طرح داخلي' ? printData.offerings?.title : printData.external_unit_name}</strong>).</p>
              <p className="mr-4">رقم الوحدة: (........) بالدور (........) ومساحتها الإجمالية (........) متر مربع تقريباً.</p>

              <p><strong className="underline">البند الثاني (الثمن وطريقة السداد):</strong> تم هذا البيع نظير ثمن إجمالي قدره <strong>{Number(printData.total_price).toLocaleString()} ج.م</strong> (فقط وقدره ..........................................................................).<br/>
              - دفع الطرف الثاني مبلغ <strong>{Number(printData.down_payment).toLocaleString()} ج.م</strong> كدفعة مقدمة عند توقيع هذا العقد ويعتبر توقيع الطرف الأول بمثابة مخالصة باستلام المقدم.<br/>
              - يتبقى مبلغ قدره <strong>{Number(printData.total_price - printData.down_payment).toLocaleString()} ج.م</strong>، يلتزم الطرف الثاني بسداده على أقساط شهرية لمدة <strong>{printData.installment_years} سنوات</strong>، بقيمة قسط شهري <strong>{Math.round((printData.total_price - printData.down_payment) / (printData.installment_years * 12)).toLocaleString()} ج.م</strong>.</p>

              <p><strong className="underline">البند الثالث (غرامات التأخير والفسخ):</strong> يلتزم الطرف الثاني بسداد الأقساط في مواعيدها. وفي حالة التأخير يُطبق غرامة تأخير بواقع <strong>{printData.penalty_percent}%</strong> عن كل يوم تأخير. وإذا تأخر الطرف الثاني عن سداد عدد (3) أقساط متتالية يُعتبر هذا العقد مفسوخاً من تلقاء نفسه دون حاجة لإنذار أو حكم قضائي، ويحق للطرف الأول خصم 10% من إجمالي قيمة العقد كمصروفات إدارية تعويضاً له.</p>

              <p><strong className="underline">البند الرابع (الملكية والتسليم):</strong> لا تنتقل ملكية الوحدة المبيعة للطرف الثاني إلا بعد سداد كامل الثمن المتفق عليه في البند الثاني بجميع أقساطه وغراماته إن وجدت. ويتعهد الطرف الأول بتسليم الوحدة للطرف الثاني في الموعد المتفق عليه بحالة صالحة للاستخدام للغرض الذي أعدت من أجله.</p>

              <p><strong className="underline">البند الخامس (المحاكم المختصة):</strong> تختص محاكم (.........................) بالنظر في أي نزاع قد ينشأ -لا قدر الله- حول تفسير أو تنفيذ بنود هذا العقد.</p>

              <p><strong className="underline">البند السادس (نسخ العقد):</strong> تحرر هذا العقد من نسختين بيد كل طرف نسخة للعمل بموجبها عند اللزوم ومطالبة الجهات الرسمية.</p>
            </div>

            {/* التوقيعات (استخدام كلاس page-break-inside-avoid عشان متتقصش نصين) */}
            <div className="mt-20 flex justify-between px-10 page-break-inside-avoid">
              <div className="text-center w-1/3">
                <p className="font-bold text-lg mb-8 border-b-2 border-black inline-block pb-1">الطرف الأول (البائع)</p>
                <p>الاسم: .......................................</p>
                <p className="mt-8">التوقيع: .......................................</p>
              </div>
              <div className="text-center w-1/3">
                <p className="font-bold text-lg mb-8 border-b-2 border-black inline-block pb-1">الشهـــــــــود</p>
                <p>شاهد 1: .......................................</p>
                <p className="mt-8">شاهد 2: .......................................</p>
              </div>
              <div className="text-center w-1/3">
                <p className="font-bold text-lg mb-8 border-b-2 border-black inline-block pb-1">الطرف الثاني (المشتري)</p>
                <p>الاسم: <strong>{printData.buyers?.full_name}</strong></p>
                <p className="mt-8">التوقيع: .......................................</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 📊 شريط الإحصائيات وباقي السيستم (يختفي وقت الطباعة) */}
      <div className="print-hide">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-600/10 rounded-xl text-indigo-600"><Calculator size={28} /></div>
          <h2 className="text-3xl font-bold text-slate-800">نظام المبيعات والأقساط</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><Building size={24}/></div>
            <div><p className="text-xs font-bold text-slate-400">إجمالي حجم المبيعات</p><p className="text-xl font-black text-slate-800">{stats.totalSales.toLocaleString()} <span className="text-xs">ج.م</span></p></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle size={24}/></div>
            <div><p className="text-xs font-bold text-slate-400">إجمالي المحصل (مقدم + أقساط)</p><p className="text-xl font-black text-slate-800">{stats.collected.toLocaleString()} <span className="text-xs">ج.م</span></p></div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-red-50 shadow-sm flex items-center gap-4">
            <div className="p-4 bg-red-100 text-red-600 rounded-xl animate-pulse"><AlertTriangle size={24}/></div>
            <div><p className="text-xs font-bold text-red-400">إجمالي المتأخرات بالسوق</p><p className="text-xl font-black text-red-600">{stats.overdue.toLocaleString()} <span className="text-xs">ج.م</span></p></div>
          </div>
        </div>

        <div className="flex bg-slate-200 p-1 rounded-2xl w-full md:w-fit mb-6 text-sm font-bold">
          <button onClick={() => setActiveTab('contracts')} className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${activeTab === 'contracts' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><UserCheck size={18}/> العقود والعملاء</button>
          <button onClick={() => setActiveTab('installments')} className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${activeTab === 'installments' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><CalendarClock size={18}/> مراقبة الأقساط</button>
        </div>

        {/* --- تبويب العقود --- */}
        {activeTab === 'contracts' && (
          <div className="space-y-6 animate-fade-in">
            <form onSubmit={handleCreateContract} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4">
              <h3 className="md:col-span-4 text-lg font-bold border-b pb-2 text-indigo-700">1. بيانات المشتري (تُحفظ تلقائياً)</h3>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-500">اسم العميل *</label><input type="text" required value={newContract.buyer_name} onChange={(e) => setNewContract({...newContract, buyer_name: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-500">الرقم القومي *</label><input type="text" required maxLength="14" value={newContract.national_id} onChange={(e) => setNewContract({...newContract, national_id: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50 tracking-widest text-left" dir="ltr" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-500">الهاتف *</label><input type="text" required value={newContract.phone} onChange={(e) => setNewContract({...newContract, phone: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50 text-left" dir="ltr" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-500">العنوان</label><input type="text" value={newContract.address} onChange={(e) => setNewContract({...newContract, address: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50" /></div>

              <h3 className="md:col-span-4 text-lg font-bold border-b pb-2 mt-4 text-indigo-700">2. بيانات العقار المباع</h3>
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-500">مصدر العقار *</label>
                <div className="flex bg-white rounded-xl border overflow-hidden">
                  <button type="button" onClick={() => setNewContract({...newContract, property_source: 'طرح داخلي', external_unit_name: ''})} className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1 ${newContract.property_source === 'طرح داخلي' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500'}`}><Building size={14}/> مشاريع الشركة</button>
                  <button type="button" onClick={() => setNewContract({...newContract, property_source: 'عقار خارجي', offering_id: ''})} className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1 ${newContract.property_source === 'عقار خارجي' ? 'bg-amber-100 text-amber-700' : 'text-slate-500'}`}><MapPin size={14}/> عقار خارجي</button>
                </div>
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-500">التفاصيل *</label>
                {newContract.property_source === 'طرح داخلي' ? (
                  <select required value={newContract.offering_id} onChange={(e) => setNewContract({...newContract, offering_id: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50 outline-none">
                    <option value="">-- اختر المشروع --</option>
                    {offerings.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
                  </select>
                ) : (
                  <input type="text" required value={newContract.external_unit_name} onChange={(e) => setNewContract({...newContract, external_unit_name: e.target.value})} className="w-full p-3 rounded-xl border bg-amber-50 outline-none" placeholder="شقة ببرج كذا..." />
                )}
              </div>

              <div className="space-y-1"><label className="text-xs font-bold text-slate-500">نوع الوحدة</label><select value={newContract.unit_type} onChange={(e) => setNewContract({...newContract, unit_type: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50"><option>شقة</option><option>محل تجاري</option><option>أرض</option></select></div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-500">السعر الإجمالي *</label><input type="number" required value={newContract.total_price} onChange={(e) => setNewContract({...newContract, total_price: e.target.value})} className="w-full p-3 rounded-xl border font-black text-slate-800" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-500">المقدم *</label><input type="number" required value={newContract.down_payment} onChange={(e) => setNewContract({...newContract, down_payment: e.target.value})} className="w-full p-3 rounded-xl border font-bold text-emerald-600" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-500">التقسيط *</label><select value={newContract.installment_years} onChange={(e) => setNewContract({...newContract, installment_years: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50"><option value="1">سنة</option><option value="2">سنتين</option><option value="3">3 سنوات</option><option value="5">5 سنوات</option></select></div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-500">غرامة التاخير يومياً %</label><input type="number" step="0.01" value={newContract.penalty_percent} onChange={(e) => setNewContract({...newContract, penalty_percent: e.target.value})} className="w-full p-3 rounded-xl border text-red-500 font-bold" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-slate-500">تاريخ أول قسط</label><input type="date" value={newContract.start_date} onChange={(e) => setNewContract({...newContract, start_date: e.target.value})} className="w-full p-3 rounded-xl border bg-slate-50" /></div>

              <button type="submit" disabled={loading} className="md:col-span-4 p-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg text-lg mt-4 flex justify-center items-center gap-2">
                <ArrowLeftRight /> إنشاء العقد وتوليد الأقساط آلياً
              </button>
            </form>

            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-700">سجل العقود</h3>
                <div className="relative w-64">
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث باسم العميل أو الرقم القومي..." className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border outline-none focus:border-indigo-500" />
                  <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm min-w-[900px]">
                  <thead className="bg-slate-50 text-slate-600 border-b">
                    <tr><th className="p-4">العميل</th><th className="p-4">العقار</th><th className="p-4">السعر</th><th className="p-4">المقدم</th><th className="p-4">النظام</th><th className="p-4 text-center">إجراءات</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredContracts.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="p-4 font-bold"><p>{c.buyers?.full_name}</p><span className="text-xs text-slate-400 font-mono" dir="ltr">{c.buyers?.national_id}</span></td>
                        <td className="p-4 font-semibold text-slate-700">
                          {c.property_source === 'طرح داخلي' ? c.offerings?.title : c.external_unit_name}
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-2 rounded ml-1">{c.unit_type}</span>
                        </td>
                        <td className="p-4 font-black text-slate-800">{Number(c.total_price).toLocaleString()}</td>
                        <td className="p-4 font-bold text-emerald-600">{Number(c.down_payment).toLocaleString()}</td>
                        <td className="p-4 text-slate-600">{c.installment_years} سنوات</td>
                        <td className="p-4 flex justify-center gap-2">
                          <button onClick={() => handlePrint(c)} className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-all" title="طباعة العقد"><Printer size={18}/></button>
                          <button onClick={() => handleDeleteContract(c.id, c.buyers?.full_name)} className="p-2 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition-all" title="حذف العقد نهائياً"><Trash2 size={18}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- تبويب الأقساط --- */}
        {activeTab === 'installments' && (
          <div className="bg-white rounded-2xl shadow-sm border overflow-x-auto animate-fade-in">
            <table className="w-full text-right text-sm min-w-[1100px]">
              <thead className="bg-slate-900 text-white border-b">
                <tr><th className="p-4">الاستحقاق</th><th className="p-4">العميل والعقار</th><th className="p-4">القسط</th><th className="p-4">التأخير (آلي)</th><th className="p-4">المطلوب</th><th className="p-4 text-center">إجراء وتحصيل</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {installments.map(inst => {
                  const isPaid = inst.status === 'مدفوع';
                  const { late, daysLate, penalty } = isPaid ? { late:false, daysLate:0, penalty:0 } : calculateLateInfo(inst.due_date, inst.amount_due, inst.contracts?.penalty_percent);
                  const finalAmount = isPaid ? inst.amount_due + inst.penalty_amount : inst.amount_due + penalty;
                  const propName = inst.contracts?.property_source === 'طرح داخلي' ? inst.contracts?.offerings?.title : inst.contracts?.external_unit_name;

                  return (
                    <tr key={inst.id} className={`transition-colors ${isPaid ? 'bg-emerald-50/30' : late ? 'bg-red-50/50' : 'hover:bg-slate-50'}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                           <CalendarClock size={16} className={isPaid ? 'text-emerald-500' : late ? 'text-red-500' : 'text-slate-400'} />
                           <span className={`font-bold ${late && !isPaid ? 'text-red-600' : 'text-slate-700'}`}>{new Date(inst.due_date).toLocaleDateString('ar-EG')}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{inst.contracts?.buyers?.full_name}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{propName}</p>
                      </td>
                      <td className="p-4 font-black text-slate-700">{Number(inst.amount_due).toLocaleString()} ج</td>
                      <td className="p-4">
                        {isPaid ? <span className="text-emerald-600 text-xs font-bold">تم السداد</span> : late ? (
                          <div>
                            <p className="text-xs font-bold text-red-600 flex items-center gap-1"><AlertTriangle size={12}/> تأخير {daysLate} يوم</p>
                            <p className="text-[10px] text-red-500 mt-1">غرامة: +{penalty.toLocaleString()} ج</p>
                          </div>
                        ) : <span className="text-slate-400 text-xs">في الانتظار</span>}
                      </td>
                      <td className={`p-4 font-black text-lg ${late && !isPaid ? 'text-red-600' : 'text-slate-800'}`}>{Number(finalAmount).toLocaleString()} ج</td>
                      <td className="p-4 flex justify-center gap-2">
                        {isPaid ? (
                          <div className="flex flex-col items-center gap-1 text-emerald-600"><CheckCircle size={20}/><span className="text-[10px] font-bold">{new Date(inst.paid_date).toLocaleDateString('ar-EG')}</span></div>
                        ) : (
                          <>
                            {late && (
                              <button onClick={() => sendWhatsApp(inst.contracts?.buyers?.phone, inst.contracts?.buyers?.full_name, finalAmount, new Date(inst.due_date).toLocaleDateString('ar-EG'))} className="p-2 bg-green-100 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition-all" title="إرسال تذكير واتساب">
                                <MessageCircle size={18}/>
                              </button>
                            )}
                            <button onClick={() => handlePayInstallment(inst, penalty)} className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg font-bold transition-all shadow-sm">
                              <Receipt size={16}/> تحصيل
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
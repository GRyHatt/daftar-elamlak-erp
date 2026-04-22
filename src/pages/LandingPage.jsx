import { useState, useEffect } from 'react';
import { 
  Building2, ChevronLeft, ShieldCheck, LayoutDashboard, Calculator, 
  Layers, Wallet, FileText, CheckCircle2, ArrowRightCircle, 
  Globe2, Lock, TrendingUp, BarChart3, RefreshCw, HardHat, 
  ArrowUpRight, Zap, MousePointer2, PlayCircle, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const [exchangeRate, setExchangeRate] = useState(0);
  const [loadingRate, setLoadingRate] = useState(true);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        setExchangeRate(data.rates.EGP);
      } catch (error) { setExchangeRate(49.85); }
      setLoadingRate(false);
    };
    fetchRate();
  }, []);

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 font-sans selection:bg-blue-600 selection:text-white" dir="rtl">
      
      {/* --- Navbar: Ultra Minimal --- */}
      <nav className="fixed top-0 w-full z-[100] bg-white/70 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
              <Building2 size={22} />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900">دفتر الأملاك</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-10">
            {['المميزات', 'الأدوات الذكية', 'التقارير', 'عن النظام'].map((item) => (
              <button key={item} className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">{item}</button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 rounded-xl font-bold text-white bg-slate-900 hover:bg-blue-600 transition-all shadow-lg shadow-slate-200">
              دخول المنصة
            </button>
          </div>
        </div>
      </nav>

      {/* --- Hero: The Masterpiece --- */}
      <header className="relative pt-40 pb-20 overflow-hidden bg-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center space-y-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600">
            <Zap size={14} fill="currentColor" />
            <span className="text-[11px] font-black uppercase tracking-wider">نظام الـ ERP الأكثر تطوراً في الشرق الأوسط</span>
          </div>

          <h1 className="text-5xl lg:text-8xl font-black text-slate-900 leading-[1.05] tracking-tight">
            الإدارة العقارية <br/>
            <span className="text-blue-600">بمعايير عالمية.</span>
          </h1>

          <p className="text-xl text-slate-500 max-w-3xl mx-auto font-medium leading-relaxed">
            منصة "دفتر الأملاك" تعيد تعريف تجربة إدارة الطروحات، المبيعات، والأقساط. نظام محاسبي متكامل يدير تدفقاتك المالية بأعلى دقة تقنية.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <button onClick={() => navigate('/sales')} className="px-10 py-5 rounded-2xl font-black text-white bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-600/30 transition-all hover:-translate-y-1 flex items-center gap-3">
              ابدأ المبيعات الآن <ArrowLeft size={20} />
            </button>
            <button className="px-10 py-5 rounded-2xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-3">
              <PlayCircle size={20} /> عرض توضيحي
            </button>
          </div>

          {/* Abstract Dashboard Preview */}
          <div className="mt-20 relative max-w-6xl mx-auto px-4">
             <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-20"></div>
             <div className="relative bg-white border border-slate-200 rounded-[2.5rem] p-4 shadow-2xl overflow-hidden shadow-blue-900/5">
                <div className="bg-[#0f172a] rounded-[2rem] p-8 aspect-[21/9] flex flex-col gap-8">
                   <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="w-32 h-2 bg-slate-700 rounded-full"></div>
                        <div className="w-48 h-4 bg-white rounded-full"></div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-24 h-10 bg-blue-600 rounded-xl"></div>
                        <div className="w-10 h-10 bg-slate-800 rounded-xl"></div>
                      </div>
                   </div>
                   <div className="grid grid-cols-4 gap-4 flex-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-4">
                          <div className="w-8 h-8 bg-slate-700 rounded-lg mb-4"></div>
                          <div className="w-full h-2 bg-slate-700 rounded-full mb-2"></div>
                          <div className="w-2/3 h-2 bg-slate-700 rounded-full"></div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </div>
      </header>

      {/* --- Trust Bar: Exchange Rate --- */}
      <section className="py-10 border-y border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center items-center gap-16 opacity-60 grayscale hover:grayscale-0 transition-all">
          <div className="flex items-center gap-3 font-black text-slate-400"> <Globe2 /> مشاريع بيت وطن </div>
          <div className="flex items-center gap-3 font-black text-slate-400"> <ShieldCheck /> تشفير مالي كامل </div>
          <div className="flex items-center gap-3 font-black text-slate-400"> <TrendingUp /> تحديثات لحظية </div>
          <div className="px-6 py-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
             <span className="text-[10px] font-black uppercase text-slate-400">سعر الصرف اللحظي:</span>
             <span className="text-sm font-black text-blue-600" dir="ltr">1 USD = {loadingRate ? '...' : exchangeRate.toFixed(2)} EGP</span>
          </div>
        </div>
      </section>

      {/* --- Features: Bento Grid Genius --- */}
      <section className="py-32 px-6 bg-[#fafbfc]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-20">
            <div className="space-y-4">
              <h3 className="text-blue-600 font-black uppercase tracking-[0.2em] text-xs">قوة الحلول</h3>
              <h2 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tight">نظام محكم <br/> لكل تفصيلة في عملك.</h2>
            </div>
            <p className="text-lg text-slate-500 max-w-md font-medium leading-relaxed">
              لقد قمنا بهندسة كل أداة لتكون سهلة في اليد، قوية في النتيجة، ومبهرة في العرض أمام عملائك.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-2 gap-6 h-auto md:h-[800px]">
             {/* Bento 1: Installments */}
             <div className="md:col-span-7 md:row-span-1 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-blue-600 transition-all cursor-pointer overflow-hidden relative" onClick={() => navigate('/sales')}>
                <div className="relative z-10 space-y-4">
                   <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all"><Calculator size={28}/></div>
                   <h4 className="text-3xl font-black text-slate-900">جدولة الأقساط والمبيعات</h4>
                   <p className="text-slate-500 font-medium max-w-md">أتمتة كاملة لعمليات التحصيل، حساب غرامات التأخير، وطباعة كشوف الحساب الرسمية بلمسة واحدة.</p>
                </div>
                <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-blue-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
                <ArrowUpRight className="absolute top-10 left-10 text-slate-300 group-hover:text-blue-600" size={32} />
             </div>

             {/* Bento 2: Ledger */}
             <div className="md:col-span-5 md:row-span-2 bg-[#0f172a] p-10 rounded-[3rem] text-white flex flex-col justify-between group cursor-pointer overflow-hidden" onClick={() => navigate('/ledger')}>
                <div className="space-y-6">
                   <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all"><Wallet size={28}/></div>
                   <h4 className="text-4xl font-black leading-tight">السيولة والتدفقات <br/> النقدية</h4>
                   <p className="text-slate-400 font-medium">مراقبة لحظية للخزينة بالدولار والجنيه، مع تقارير أرباح وتحليلات للمساهمات والمشاريع.</p>
                </div>
                <div className="mt-10 p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                   <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">إجمالي المحفظة</span>
                      <TrendingUp size={16} className="text-emerald-400" />
                   </div>
                   <div className="text-3xl font-black text-white" dir="ltr">EGP 24,500,000</div>
                </div>
             </div>

             {/* Bento 3: Document Merger */}
             <div className="md:col-span-4 md:row-span-1 bg-blue-600 p-10 rounded-[3rem] text-white flex flex-col justify-between group cursor-pointer relative overflow-hidden" onClick={() => navigate('/merger')}>
                <Layers className="absolute -bottom-10 -right-10 opacity-20 group-hover:rotate-12 transition-transform" size={200}/>
                <div className="space-y-4">
                   <h4 className="text-2xl font-black">أداة دمج المستندات</h4>
                   <p className="text-blue-100 text-sm font-bold">حوّل صور العميل لملف PDF واحد مضغوط واحترافي في ثوانٍ.</p>
                </div>
                <button className="w-12 h-12 bg-white text-blue-600 rounded-full flex items-center justify-center self-end hover:scale-110 transition-transform"><ArrowLeft size={20}/></button>
             </div>

             {/* Bento 4: Contractors */}
             <div className="md:col-span-3 md:row-span-1 bg-white p-8 rounded-[3rem] border border-slate-200 flex flex-col items-center justify-center text-center gap-4 hover:shadow-2xl transition-all group" onClick={() => navigate('/contracting')}>
                <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><HardHat size={32}/></div>
                <h4 className="text-xl font-black text-slate-800">المقاولات والمصروفات</h4>
             </div>
          </div>
        </div>
      </section>

      {/* --- Call to Action: The Closer --- */}
      <section className="py-32 bg-white overflow-hidden relative">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-10 relative z-10">
          <h2 className="text-4xl lg:text-7xl font-black text-slate-900 tracking-tighter">جاهز لتنظيم إمبراطوريتك؟</h2>
          <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">انضم لعشرات الشركات العقارية التي اختارت "دفتر الأملاك" لإدارة عملياتها بأمان وذكاء.</p>
          <div className="flex justify-center gap-4">
             <button onClick={() => navigate('/dashboard')} className="px-12 py-6 rounded-2xl bg-slate-900 text-white font-black text-xl hover:bg-blue-600 shadow-2xl transition-all">ابدأ الآن مجاناً</button>
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-50 rounded-full blur-3xl -z-0 opacity-50"></div>
      </section>

      {/* --- Footer: Professional --- */}
      <footer className="py-20 bg-white border-t border-slate-100 text-center">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-8">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white"><Building2 size={18}/></div>
              <span className="text-xl font-black text-slate-900">دفتر الأملاك</span>
           </div>
           <div className="flex gap-10 text-sm font-bold text-slate-400">
              <button>الشروط والأحكام</button>
              <button>سياسة الخصوصية</button>
              <button>الدعم الفني</button>
           </div>
           <p className="text-xs font-black text-slate-300 uppercase tracking-[0.4em]">جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
        </div>
      </footer>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { animation: marquee 40s linear infinite; }
      `}</style>
    </div>
  );
}
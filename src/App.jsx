import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Link, Route, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Contact, Layers, Calculator, Building2, 
  Users, FileSpreadsheet, FileText, ShieldAlert, Menu, X, 
  LogOut, Wallet, HardHat, Home, ChevronDown, ChevronUp, 
  Megaphone, PieChart, Folders, Bell
} from 'lucide-react';

// استدعاء الصفحات
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Offerings from './pages/Offerings';
import OfferingDetails from './pages/OfferingDetails';
import Investors from './pages/Investors';
import Ledger from './pages/Ledger';
import Reports from './pages/Reports';
import Employees from './pages/Employees';
import InvestorPortal from './pages/InvestorPortal';
import Login from './pages/Login';
import Contracting from './pages/Contracting';
import Directory from './pages/Directory';
import Sales from './pages/Sales';
import DocumentMerger from './pages/DocumentMerger';
import Cashbook from './pages/Cashbook';
import Listings from './pages/Listings';

// --- مكون القائمة المنسدلة الذكية (Smart Accordion) ---
function SidebarGroup({ title, icon: Icon, children, activePaths = [] }) {
  const location = useLocation();
  const isActiveGroup = activePaths.includes(location.pathname);
  const [isOpen, setIsOpen] = useState(isActiveGroup);

  useEffect(() => {
    if (isActiveGroup) setIsOpen(true);
  }, [isActiveGroup, location.pathname]);

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 ${isOpen ? 'bg-slate-800/80 text-white shadow-inner' : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'}`}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} className={isOpen ? 'text-blue-500' : ''} />
          <span className="text-sm font-bold">{title}</span>
        </div>
        {isOpen ? <ChevronUp size={16} className="text-slate-500"/> : <ChevronDown size={16} className="text-slate-500"/>}
      </button>
      
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
        <div className="mr-6 pr-2 border-r-2 border-slate-700/50 space-y-1">
          {children}
        </div>
      </div>
    </div>
  );
}

function NavItem({ to, icon: Icon, children, onClick }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 font-bold text-sm ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
    >
      {Icon && <Icon size={16} />}
      <span>{children}</span>
    </Link>
  );
}

// --- الهيكل الأساسي للسيستم (Layout Responsive) ---
function Layout({ children, sidebarContent, user, handleLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-50 font-sans selection:bg-blue-600 selection:text-white overflow-hidden" dir="rtl">
      
      {/* Overlay للموبايل */}
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)} />}

      {/* القائمة الجانبية (Sidebar) */}
      <aside className={`fixed lg:static inset-y-0 right-0 z-50 w-[280px] bg-[#0f172a] text-white transition-transform duration-300 ease-out flex flex-col shadow-2xl ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-600/20"><Building2 className="text-white" size={20} /></div>
            <div>
               <h1 className="text-lg font-black tracking-tight">دفتر الأملاك</h1>
               <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">ERP System</p>
            </div>
          </div>
          <button className="lg:hidden text-slate-400 hover:text-white bg-slate-800 p-2 rounded-xl" onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
        </div>

        <nav className="flex-1 py-6 px-3 overflow-y-auto custom-scrollbar pb-10">
          {sidebarContent(setIsSidebarOpen)}
        </nav>

        <div className="p-4 border-t border-slate-800/80 bg-[#0f172a] pb-safe">
          <div className="mb-4 bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">المستخدم الحالي</p>
            <p className="text-sm font-black text-white truncate">{user.name}</p>
            <span className={`inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-md font-bold ${user.role === 'admin' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {user.role === 'admin' ? 'مدير النظام' : user.role === 'investor' ? 'مستثمر' : 'موظف مبيعات'}
            </span>
          </div>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full p-3.5 rounded-xl text-red-400 hover:bg-red-500 hover:text-white transition-all font-black bg-red-400/10 hover:shadow-lg hover:shadow-red-500/20">
            <LogOut size={18} /> خروج آمن
          </button>
        </div>
      </aside>

      {/* منطقة المحتوى الرئيسية */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#fafbfc] relative h-full">
        
        {/* --- Header الموبايل الذكي (Glassmorphism) --- */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 p-4 flex items-center justify-between lg:hidden z-30 sticky top-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 p-2 rounded-lg shadow-sm"><Building2 size={18} className="text-white"/></div>
            <span className="font-black text-[#0f172a] text-xl tracking-tight">دفتر الأملاك</span>
          </div>
          <div className="flex items-center gap-3">
             <button className="text-slate-400 hover:text-blue-600 transition-colors"><Bell size={22}/></button>
             <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center font-black text-blue-600 shadow-sm">
               {user.name.charAt(0)}
             </div>
          </div>
        </header>
        
        {/* المحتوى الداخلي مع بادينج للموبايل عشان شريط التنقل */}
        <div className="flex-1 overflow-y-auto flex flex-col custom-scrollbar pb-[80px] lg:pb-0 scroll-smooth" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="flex-1 p-4 md:p-8">
            {children}
          </div>
          
          <footer className="mt-auto py-8 bg-white border-t border-slate-200 text-center">
            <p className="text-xs font-bold text-slate-500 mb-2">
              جميع الحقوق محفوظة © {new Date().getFullYear()} لصالح {' '}
              <a href="https://wa.me/201000000000" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 transition-colors font-black">Ahmed Amin</a>
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              تم التصميم والتطوير بكل فخر بواسطة {' '}
              <a href="https://wa.me/201111111111" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-700 transition-colors font-black">Mahmoud Ibn Abdelazeez</a>
            </p>
          </footer>
        </div>

        {/* --- Bottom App Bar (تطبيق الموبايل) --- */}
        <nav className="lg:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-xl border-t border-slate-200 z-40 flex justify-around items-center px-2 py-1.5 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] pb-safe">
          <Link to="/dashboard" className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-300 ${location.pathname === '/dashboard' ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'}`}>
            <LayoutDashboard size={22} className={location.pathname === '/dashboard' ? 'fill-blue-600/20' : ''}/>
            <span className="text-[10px] font-black mt-1">الرئيسية</span>
          </Link>
          
          <Link to="/sales" className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-300 ${location.pathname === '/sales' ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'}`}>
            <Calculator size={22} className={location.pathname === '/sales' ? 'fill-blue-600/20' : ''}/>
            <span className="text-[10px] font-black mt-1">المبيعات</span>
          </Link>

          <Link to="/listings" className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-300 ${location.pathname === '/listings' ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'}`}>
            <Home size={22} className={location.pathname === '/listings' ? 'fill-blue-600/20' : ''}/>
            <span className="text-[10px] font-black mt-1">العقارات</span>
          </Link>

          <button onClick={() => setIsSidebarOpen(true)} className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-300 ${isSidebarOpen ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'}`}>
            <Menu size={22} />
            <span className="text-[10px] font-black mt-1">القائمة</span>
          </button>
        </nav>

      </main>

      <style>{`
        /* دعم للـ Safe Areas في الايفون (عشان الشريط ميخبطش تحت) */
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 16px); }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 20px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #475569; }
      `}</style>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('appUser');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem('appUser');
    setUser(null);
  };

  if (!user) return <Login onLogin={setUser} />;

  const renderSidebarLinks = (setIsSidebarOpen) => {
    if (user.role === 'investor') {
      return (
        <SidebarGroup title="إدارة المحفظة" icon={Wallet} activePaths={['/portal', '/']}>
          <NavItem to="/portal" icon={PieChart} onClick={() => setIsSidebarOpen(false)}>محفظتي الاستثمارية</NavItem>
        </SidebarGroup>
      );
    }

    return (
      <div className="space-y-2">
        <SidebarGroup title="الرئيسية والمؤشرات" icon={PieChart} activePaths={['/', '/dashboard']}>
          <NavItem to="/" icon={Home} onClick={() => setIsSidebarOpen(false)}>الواجهة التسويقية</NavItem>
          <NavItem to="/dashboard" icon={LayoutDashboard} onClick={() => setIsSidebarOpen(false)}>لوحة القيادة (Dashboard)</NavItem>
        </SidebarGroup>

        <SidebarGroup title="المبيعات والتسويق" icon={Megaphone} activePaths={['/sales', '/investors', '/listings']}>
          <NavItem to="/sales" icon={Calculator} onClick={() => setIsSidebarOpen(false)}>المبيعات والأقساط</NavItem>
          <NavItem to="/listings" icon={Home} onClick={() => setIsSidebarOpen(false)}>المعرض وإعلانات العقارات</NavItem>
          <NavItem to="/investors" icon={Users} onClick={() => setIsSidebarOpen(false)}>سجل العملاء (KYC)</NavItem>
        </SidebarGroup>

        <SidebarGroup title="المشاريع والهندسة" icon={Building2} activePaths={['/offerings', '/contracting']}>
          <NavItem to="/offerings" icon={Folders} onClick={() => setIsSidebarOpen(false)}>محفظة الطروحات</NavItem>
          <NavItem to="/contracting" icon={HardHat} onClick={() => setIsSidebarOpen(false)}>المقاولات والمصروفات</NavItem>
        </SidebarGroup>

        <SidebarGroup title="الإدارة المالية" icon={Wallet} activePaths={['/cashbook', '/ledger', '/reports']}>
          <NavItem to="/cashbook" icon={Wallet} onClick={() => setIsSidebarOpen(false)}>خزنة النثريات السريعة</NavItem>
          <NavItem to="/ledger" icon={FileSpreadsheet} onClick={() => setIsSidebarOpen(false)}>دفتر الأستاذ والحسابات</NavItem>
          <NavItem to="/reports" icon={FileText} onClick={() => setIsSidebarOpen(false)}>التقارير والميزانيات</NavItem>
        </SidebarGroup>

        <SidebarGroup title="أدوات داعمة" icon={Layers} activePaths={['/directory', '/merger']}>
          <NavItem to="/directory" icon={Contact} onClick={() => setIsSidebarOpen(false)}>دليل العلاقات والأرقام</NavItem>
          <NavItem to="/merger" icon={Layers} onClick={() => setIsSidebarOpen(false)}>أداة ضغط المستندات</NavItem>
        </SidebarGroup>
        
        {user.role === 'admin' && (
          <div className="pt-4 mt-4 border-t border-slate-800/50">
            <SidebarGroup title="إعدادات النظام" icon={ShieldAlert} activePaths={['/employees']}>
              <NavItem to="/employees" icon={ShieldAlert} onClick={() => setIsSidebarOpen(false)}>إدارة الموظفين والصلاحيات</NavItem>
            </SidebarGroup>
          </div>
        )}
      </div>
    );
  };

  return (
    <BrowserRouter>
      <Layout sidebarContent={renderSidebarLinks} user={user} handleLogout={handleLogout}>
        <Routes>
          {user.role === 'investor' ? (
             <Route path="*" element={<InvestorPortal />} />
          ) : (
             <>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/offerings" element={<Offerings />} />
                <Route path="/offering/:id" element={<OfferingDetails />} />
                <Route path="/contracting" element={<Contracting />} />
                <Route path="/directory" element={<Directory />} />
                <Route path="/investors" element={<Investors />} />
                <Route path="/ledger" element={<Ledger />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/merger" element={<DocumentMerger />} />
                <Route path="/cashbook" element={<Cashbook />} />
                <Route path="/listings" element={<Listings />} />
                {user.role === 'admin' && <Route path="/employees" element={<Employees />} />}
             </>
          )}
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
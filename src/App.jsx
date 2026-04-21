import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Contact, Calculator, Building2, Users, FileSpreadsheet, FileText, ShieldAlert, Menu, X, LogOut, Wallet, HardHat } from 'lucide-react';

// استدعاء الصفحات
import Dashboard from './pages/Dashboard';
import Offerings from './pages/Offerings';
import OfferingDetails from './pages/OfferingDetails';
import Investors from './pages/Investors';
import Ledger from './pages/Ledger';
import Reports from './pages/Reports';
import Employees from './pages/Employees';
import InvestorPortal from './pages/InvestorPortal';
import Login from './pages/Login';
import Contracting from './pages/Contracting'; // 🔴 استدعاء صفحة المقاولات الجديدة
import Directory from './pages/Directory';
import Sales from './pages/Sales';

// --- مكون NavItem (عنصر القائمة) ---
function NavItem({ to, icon: Icon, children, onClick }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 font-bold ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
    >
      <Icon size={20} />
      <span>{children}</span>
    </Link>
  );
}

// --- مكون Layout (الهيكل الأساسي) ---
function Layout({ children, sidebarContent, user, handleLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 font-sans" dir="rtl">
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 right-0 z-30 w-72 bg-[#0f172a] text-white transition-transform duration-300 flex flex-col ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-lg"><Building2 className="text-blue-500" size={24} /></div>
            <h1 className="text-xl font-black">دفتر الأملاك</h1>
          </div>
          <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}><X size={24} /></button>
        </div>

        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-2">
          {sidebarContent(setIsSidebarOpen)}
        </nav>

        {/* زرار تسجيل الخروج */}
        <div className="p-4 border-t border-slate-800/50 bg-[#0f172a]">
          <div className="px-4 mb-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">المستخدم</p>
            <p className="text-sm font-bold text-white truncate">{user.name}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${user.role === 'admin' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {user.role === 'admin' ? 'مدير النظام' : user.role === 'investor' ? 'مستثمر' : 'موظف'}
            </span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 w-full p-4 rounded-2xl text-red-400 hover:bg-red-400/10 transition-all font-bold border border-transparent hover:border-red-400/20">
            <LogOut size={20} /> تسجيل الخروج
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-100 p-4 flex items-center lg:hidden shadow-sm">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-slate-50 text-slate-600 rounded-xl border border-slate-200"><Menu size={24} /></button>
          <span className="mr-4 font-bold text-[#0f172a]">القائمة الرئيسية</span>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">{children}</div>
      </main>
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
    // لو اللي داخل مستثمر، يشوف محفظته بس
    if (user.role === 'investor') {
      return <NavItem to="/portal" icon={Wallet} onClick={() => setIsSidebarOpen(false)}>محفظتي الاستثمارية</NavItem>;
    }

    // لو أدمن أو موظف، يشوف القائمة دي
    return (
      <>
        <NavItem to="/" icon={LayoutDashboard} onClick={() => setIsSidebarOpen(false)}>لوحة القيادة</NavItem>
        <NavItem to="/offerings" icon={Building2} onClick={() => setIsSidebarOpen(false)}>إدارة الطروحات</NavItem>
        
        {/* 🔴 زرار المقاولات والمصروفات الجديد */}
        <NavItem to="/contracting" icon={HardHat} onClick={() => setIsSidebarOpen(false)}>المقاولات والمصروفات</NavItem>
        
        <NavItem to="/investors" icon={Users} onClick={() => setIsSidebarOpen(false)}>سجل المستثمرين</NavItem>
        <NavItem to="/ledger" icon={FileSpreadsheet} onClick={() => setIsSidebarOpen(false)}>دفتر الحسابات</NavItem>
        <NavItem to="/reports" icon={FileText} onClick={() => setIsSidebarOpen(false)}>تقارير الأرباح</NavItem>
        <NavItem to="/contracting" icon={HardHat} onClick={() => setIsSidebarOpen(false)}>المقاولات والمصروفات</NavItem>
        <NavItem to="/directory" icon={Contact} onClick={() => setIsSidebarOpen(false)}>دليل العلاقات</NavItem>
        <NavItem to="/sales" icon={Calculator} onClick={() => setIsSidebarOpen(false)}>المبيعات والأقساط</NavItem>
        {user.role === 'admin' && (
          <NavItem to="/employees" icon={ShieldAlert} onClick={() => setIsSidebarOpen(false)}>إدارة الموظفين</NavItem>
        )}
      </>
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
                <Route path="/" element={<Dashboard />} />
                <Route path="/offerings" element={<Offerings />} />
                <Route path="/offering/:id" element={<OfferingDetails />} />
                
                {/* 🔴 مسار صفحة المقاولات */}
                <Route path="/contracting" element={<Contracting />} />
                <Route path="/directory" element={<Directory />} />
                <Route path="/investors" element={<Investors />} />
                <Route path="/ledger" element={<Ledger />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/sales" element={<Sales />} />
                {user.role === 'admin' && <Route path="/employees" element={<Employees />} />}
             </>
          )}
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
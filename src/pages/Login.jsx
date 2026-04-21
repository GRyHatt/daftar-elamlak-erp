import { useState } from 'react';
import { Lock, ShieldCheck, Users, Building2, Phone } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Login({ onLogin }) {
  const [loginType, setLoginType] = useState('admin'); // 'admin', 'employee', 'investor'
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (loginType === 'admin') {
        if (code === 'admin123') {
          const userData = { role: 'admin', name: 'المدير العام' };
          localStorage.setItem('appUser', JSON.stringify(userData));
          onLogin(userData);
        } else {
          setError('كلمة مرور الإدارة غير صحيحة!');
        }
      } else if (loginType === 'employee') {
        const { data, error: fetchError } = await supabase.from('employees').select('*').eq('access_code', code).single();
        if (data && !fetchError) {
          if (data.status === 'موقوف') return setError('حسابك موقوف مؤقتاً!');
          const userData = { role: 'employee', name: data.full_name };
          localStorage.setItem('appUser', JSON.stringify(userData));
          onLogin(userData);
        } else {
          setError('كود الموظف غير صحيح!');
        }
      } else if (loginType === 'investor') {
        // الدخول برقم الهاتف للمستثمر
        const { data, error: fetchError } = await supabase.from('investors').select('*').eq('phone', code).single();
        if (data && !fetchError) {
          const userData = { role: 'investor', name: data.full_name, id: data.id };
          localStorage.setItem('appUser', JSON.stringify(userData));
          onLogin(userData);
        } else {
          setError('رقم الهاتف غير مسجل أو الكود خطأ!');
        }
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بقاعدة البيانات');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-sans" dir="rtl">
      {/* تأثير خلفية أزرق هادئ */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
      
      <div className="bg-[#1e293b] p-8 md:p-10 rounded-3xl shadow-2xl border border-slate-700 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="bg-blue-600/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
             <Building2 size={36} className="text-blue-500" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-1">دفتر الأملاك</h1>
          <p className="text-slate-400 text-sm">نظام إدارة الاستثمارات العقارية</p>
        </div>

        {/* أزرار التبديل - هنا ضفنا المستثمر كـ تاب ثالث */}
        <div className="flex bg-slate-900/50 p-1 rounded-xl mb-6 text-xs md:text-sm border border-slate-700">
          <button onClick={() => {setLoginType('admin'); setCode(''); setError('');}} className={`flex-1 py-2 rounded-lg font-bold transition-all ${loginType === 'admin' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>الإدارة</button>
          <button onClick={() => {setLoginType('employee'); setCode(''); setError('');}} className={`flex-1 py-2 rounded-lg font-bold transition-all ${loginType === 'employee' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>الموظفين</button>
          <button onClick={() => {setLoginType('investor'); setCode(''); setError('');}} className={`flex-1 py-2 rounded-lg font-bold transition-all ${loginType === 'investor' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>المستثمرين</button>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-sm font-semibold text-slate-300 block mb-2">
              {loginType === 'admin' ? 'كلمة مرور الإدارة' : loginType === 'employee' ? 'كود الدخول (PIN)' : 'رقم هاتف المستثمر'}
            </label>
            <div className="relative">
              <input 
                type={loginType === 'admin' ? "password" : "text"} 
                value={code} 
                onChange={(e) => setCode(e.target.value)} 
                className="w-full bg-slate-900/50 text-white p-4 pr-12 rounded-xl border border-slate-700 outline-none focus:border-blue-500 transition-all text-center font-bold tracking-widest"
                placeholder={loginType === 'investor' ? "01XXXXXXXXX" : "••••••••"} 
                dir="ltr" required 
              />
              {loginType === 'investor' ? <Phone size={20} className="absolute right-4 top-4 text-slate-500" /> : <Lock size={20} className="absolute right-4 top-4 text-slate-500" />}
            </div>
            {error && <p className="text-red-400 text-xs font-bold mt-3 text-center bg-red-400/10 p-2 rounded-lg border border-red-400/20">{error}</p>}
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2">
            {loading ? 'جاري التحقق...' : 'دخول للنظام'}
          </button>
        </form>
      </div>
    </div>
  );
}
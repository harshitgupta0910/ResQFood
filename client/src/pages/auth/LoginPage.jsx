import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiMail, HiLockClosed, HiArrowRight } from 'react-icons/hi';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { user } = await login({ email, password });
      toast.success(`Welcome back, ${user.name}!`);
      const roleRoutes = { admin: '/admin', donor: '/donor', ngo: '/ngo' };
      navigate(roleRoutes[user.role] || '/');
    } catch (error) {
      toast.error(error.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen w-full flex font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Left Panel: Deep Dark Emerald Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-zinc-950 relative overflow-hidden p-12 xl:p-24 border-r border-zinc-900">
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-900/20 to-transparent pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <span className="text-zinc-950 font-bold text-xl tracking-tighter">Z</span>
          </div>
          <span className="text-white text-xl font-semibold tracking-tight">ResQFood</span>
        </div>

        <div className="relative z-10 max-w-xl mt-auto">
          <h1 className="text-4xl xl:text-5xl font-medium text-white leading-[1.1] tracking-tight mb-6">
            Redistribute surplus.<br />
            <span className="text-emerald-400">Eliminate waste.</span>
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed mb-12">
            The enterprise-grade platform connecting food donors with NGOs in real-time. Fair, fast, and measurable impact.
          </p>

          <div className="flex items-center gap-8 border-t border-zinc-800/50 pt-8">
            <div>
              <p className="text-3xl font-semibold text-white tracking-tight">10k+</p>
              <p className="text-xs text-zinc-500 font-bold mt-1 uppercase tracking-wider">Meals Saved</p>
            </div>
            <div className="w-px h-12 bg-zinc-800/50" />
            <div>
              <p className="text-3xl font-semibold text-white tracking-tight">98%</p>
              <p className="text-xs text-zinc-500 font-bold mt-1 uppercase tracking-wider">Claim Rate</p>
            </div>
            <div className="w-px h-12 bg-zinc-800/50" />
            <div>
              <p className="text-3xl font-semibold text-white tracking-tight">200+</p>
              <p className="text-xs text-zinc-500 font-bold mt-1 uppercase tracking-wider">Active NGOs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Soft, Muted Form Area */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-zinc-50">
        <div className="w-full max-w-[420px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-zinc-950 font-bold text-xl tracking-tighter">Z</span>
            </div>
            <span className="text-zinc-900 text-2xl font-semibold tracking-tight">ResQFood</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-zinc-900 tracking-tight">Welcome back</h2>
            <p className="text-zinc-500 mt-2 text-base">Sign in to your dashboard to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Custom Input: Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700 block">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <HiMail className="text-zinc-400 w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none shadow-sm"
                />
              </div>
            </div>

            {/* Custom Input: Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700 block">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <HiLockClosed className="text-zinc-400 w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none shadow-sm"
                />
              </div>
            </div>

            {/* Dark Sleek Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-800/50 text-white font-medium py-2.5 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 group border-none"
              >
                {isLoading ? 'Signing in...' : 'Sign In to Dashboard'}
                {!isLoading && <HiArrowRight className="group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-zinc-900 font-medium hover:text-emerald-600 transition-colors underline decoration-zinc-300 underline-offset-4 hover:decoration-emerald-500">
              Create one
            </Link>
          </p>

          {/* Clean Demo Credentials Box */}
          {/* <div className="mt-10 border border-zinc-200 bg-white/50 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Test Credentials</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { role: 'Admin', email: 'admin' },
                { role: 'Donor', email: 'donor' },
                { role: 'NGO', email: 'ngo' },
              ].map((cred) => (
                <div 
                  key={cred.role} 
                  className="flex flex-col p-3 rounded-lg border border-zinc-200 bg-white shadow-sm cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all group" 
                  onClick={() => {
                    setEmail(`${cred.email}@resqfood.com`);
                    setPassword('password123');
                    toast.success(`${cred.role} credentials loaded`);
                  }}
                >
                  <span className="text-xs font-semibold text-zinc-600 mb-0.5 group-hover:text-emerald-600 transition-colors">{cred.role}</span>
                  <span className="font-mono text-zinc-500 text-[11px] truncate">{cred.email}@...</span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-zinc-200 flex justify-between items-center text-[11px] text-zinc-500 font-mono">
              <span>Domain: @resqfood.com</span>
              <span>Pass: password123</span>
            </div>
          </div> */}

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  HiMail, 
  HiLockClosed, 
  HiUser, 
  HiOfficeBuilding, 
  HiPhone, 
  HiLocationMarker,
  HiArrowRight,
  HiArrowLeft
} from 'react-icons/hi';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'donor',
    phone: '',
    organizationName: '',
    address: '',
    registrationNumber: '',
  });

  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password) {
        return toast.error('Please fill in all basic details');
      }
      if (formData.password.length < 6) {
        return toast.error('Password must be at least 6 characters');
      }
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.organizationName || !formData.address || !formData.phone) {
       return toast.error('Please fill in all organization details');
    }

    try {
      const { user } = await register(formData);
      toast.success(`Account created successfully! Welcome ${user.name}`);
      const roleRoutes = { admin: '/admin', donor: '/donor', ngo: '/ngo' };
      navigate(roleRoutes[user.role] || '/');
    } catch (error) {
      toast.error(error.message || 'Registration failed');
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
          <span className="text-white text-xl font-semibold tracking-tight">ZeroWaste</span>
        </div>

        <div className="relative z-10 max-w-xl mt-auto">
          <h1 className="text-4xl xl:text-5xl font-medium text-white leading-[1.1] tracking-tight mb-6">
            Join the network.<br />
            <span className="text-emerald-400">Scale your impact.</span>
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed mb-10">
            Whether you are a restaurant with surplus food, or an NGO feeding the community — you belong here.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-5 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-sm">
               <div className="mt-0.5 w-8 h-8 rounded-md bg-zinc-800 text-zinc-300 flex items-center justify-center text-sm border border-zinc-700">🍽️</div>
               <div>
                 <p className="font-semibold text-white">Food Donors</p>
                 <p className="text-sm text-zinc-500 mt-1 leading-relaxed">List surplus inventory in seconds and track your ecological impact.</p>
               </div>
            </div>
            <div className="flex items-start gap-4 p-5 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-sm">
               <div className="mt-0.5 w-8 h-8 rounded-md bg-zinc-800 text-zinc-300 flex items-center justify-center text-sm border border-zinc-700">🏘️</div>
               <div>
                 <p className="font-semibold text-white">NGOs & Shelters</p>
                 <p className="text-sm text-zinc-500 mt-1 leading-relaxed">Receive real-time alerts and claim food exactly when you need it.</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Soft, Muted Form Area */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-zinc-50">
        <div className="w-full max-w-[420px] mx-auto">
          
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-zinc-950 font-bold text-xl tracking-tighter">Z</span>
            </div>
            <span className="text-zinc-900 text-2xl font-semibold tracking-tight">ZeroWaste</span>
          </div>

          <div className="mb-8">
            <p className="text-emerald-600 font-semibold text-sm mb-2 uppercase tracking-wider">
              Step {step} of 2
            </p>
            <h2 className="text-3xl font-semibold text-zinc-900 tracking-tight">
              {step === 1 ? 'Create account' : 'Finalize details'}
            </h2>
            <p className="text-zinc-500 mt-2 text-base">
              {step === 1 ? 'Choose your role and set up credentials.' : 'Tell us a bit more about your organization.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 ? (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                
                {/* Premium Segmented Control for Roles */}
                <div className="flex p-1.5 bg-zinc-200/50 rounded-xl border border-zinc-200/50 mb-6">
                    {['donor', 'ngo'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: r })}
                      className={`flex-1 py-2 text-sm font-medium capitalize rounded-lg transition-all duration-200 ${
                        formData.role === r 
                          ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50' 
                          : 'text-zinc-500 hover:text-zinc-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                {/* Native Input: Name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 block">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <HiUser className="text-zinc-400 w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none shadow-sm"
                    />
                  </div>
                </div>

                {/* Native Input: Email */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 block">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <HiMail className="text-zinc-400 w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      placeholder="name@organization.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none shadow-sm"
                    />
                  </div>
                </div>

                {/* Native Input: Password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 block">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <HiLockClosed className="text-zinc-400 w-5 h-5" />
                    </div>
                    <input
                      type="password"
                      placeholder="At least 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none shadow-sm"
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <button 
                    type="button" 
                    onClick={handleNext} 
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-2.5 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 group" 
                  >
                    Continue
                    <HiArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                {(formData.role === 'donor' || formData.role === 'ngo') && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-700 block">Organization Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <HiOfficeBuilding className="text-zinc-400 w-5 h-5" />
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. Fresh Foods Ltd"
                          value={formData.organizationName}
                          onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-700 block">Registration Number</label>
                      <input
                        type="text"
                        placeholder="Government Reg No. (Optional)"
                        value={formData.registrationNumber}
                        onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none shadow-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-700 block">Full Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <HiLocationMarker className="text-zinc-400 w-5 h-5" />
                        </div>
                        <input
                          type="text"
                          placeholder="123 Logistics Way, City"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none shadow-sm"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 block">Contact Phone</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <HiPhone className="text-zinc-400 w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      placeholder="+1 (234) 567-8900"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none shadow-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setStep(1)} 
                    className="px-4 py-2.5 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 rounded-lg transition-colors flex items-center justify-center shadow-sm"
                  >
                    <HiArrowLeft className="w-5 h-5" />
                  </button>
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="flex-1 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-800/50 text-white font-medium py-2.5 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 border-none"
                  >
                    {isLoading ? 'Creating Account...' : 'Complete Registration'}
                  </button>
                </div>
              </div>
            )}
          </form>

          <p className="text-center text-sm text-zinc-500 mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-zinc-900 font-medium hover:text-emerald-600 transition-colors underline decoration-zinc-300 underline-offset-4 hover:decoration-emerald-500">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
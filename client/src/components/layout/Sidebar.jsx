import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiHome, HiPlusCircle, HiClipboardList, HiUsers, HiLightningBolt, HiLogout, HiX, HiShieldCheck, HiScale, HiExclamationCircle, HiUserCircle } from 'react-icons/hi';
import useAuthStore from '../../store/authStore';

const roleNavItems = {
  donor: [
    { path: '/donor', icon: HiHome, label: 'Overview' },
    { path: '/donor/create', icon: HiPlusCircle, label: 'Create Listing' },
    { path: '/donor/listings', icon: HiClipboardList, label: 'My Listings' },
    { path: '/donor/claims', icon: HiUsers, label: 'Claimed Orders' },
    { path: '/donor/complaints', icon: HiExclamationCircle, label: 'Complaints & Safety' },
    { path: '/donor/profile', icon: HiUserCircle, label: 'Profile' },
  ],
  ngo: [
    { path: '/ngo', icon: HiHome, label: 'Overview' },
    { path: '/ngo/live', icon: HiLightningBolt, label: 'Live Feed' },
    { path: '/ngo/claims', icon: HiClipboardList, label: 'My Claims' },
    { path: '/ngo/complaints', icon: HiExclamationCircle, label: 'Complaints & Safety' },
    { path: '/ngo/profile', icon: HiUserCircle, label: 'Profile' },
  ],
  admin: [
    { path: '/admin', icon: HiHome, label: 'Live Monitoring' },
    { path: '/admin/users', icon: HiUsers, label: 'User & Org Management' },
    { path: '/admin/listings', icon: HiShieldCheck, label: 'Listing Moderation' },
    { path: '/admin/claims', icon: HiScale, label: 'Claim Allocation' },
    { path: '/admin/complaints', icon: HiExclamationCircle, label: 'Complaints & Safety' },
  ],
};

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = roleNavItems[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-zinc-950/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsOpen(false)} />}

      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-72 bg-zinc-950 border-r border-zinc-900 flex flex-col shrink-0
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:static'}
      `}>
        
        {/* Header */}
        <div className="h-18 flex items-center justify-between px-6 border-b border-zinc-900/80 shrink-0">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-lg font-bold text-zinc-950">R</div>
            <h1 className="text-lg font-semibold tracking-tight text-white">ResQFood</h1>
          </Link>
          <button className="lg:hidden text-zinc-400 hover:text-white" onClick={() => setIsOpen(false)}>
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile */}
        <div className="px-4 py-5 shrink-0 border-b border-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-800 text-emerald-400 flex items-center justify-center font-bold text-lg uppercase shadow-inner">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <HiShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <p className="text-[11px] text-emerald-500 font-bold tracking-wider uppercase">{user?.role || 'Volunteer'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== `/${user?.role}` && location.pathname.startsWith(item.path));
            return (
              <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)}
                className={`
                  relative flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all group
                  ${isActive ? 'text-emerald-400 bg-zinc-900' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50'}
                `}
              >
                {isActive && <span className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-500 rounded-r-md" />}
                <item.icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-900/80 shrink-0">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all">
            <HiLogout className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
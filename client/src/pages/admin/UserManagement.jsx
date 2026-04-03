import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { HiCheck, HiX, HiBan, HiOutlineShieldCheck, HiSearch } from 'react-icons/hi';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterRole, setFilterRole] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await adminAPI.getUsers({ role: filterRole !== 'all' ? filterRole : undefined, search: searchQuery });
            setUsers(res.data.users);
        } catch (err) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [filterRole]);

    const handleOrgVerify = async (orgId, status) => {
        try {
            await adminAPI.verifyOrganization(orgId, status);
            toast.success(`Organization ${status}`);
            fetchUsers();
        } catch (err) {
            toast.error('Failed to update organization status');
        }
    };

    const handleUserBan = async (userId, currentBanStatus) => {
        try {
            await adminAPI.updateUserStatus(userId, { isBanned: !currentBanStatus });
            toast.success(`User ${!currentBanStatus ? 'banned' : 'unbanned'}`);
            fetchUsers();
        } catch (err) {
            toast.error('Failed to update user ban status');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User & Organization Management</h1>
                    <p className="text-gray-500 mt-1">Verify NGOs, manage donors, and oversee platform access.</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                    <div className="relative">
                        <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search email or name..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              {['all', 'donor', 'ngo'].map(role => (
                 <button 
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={`px-4 py-2 rounded-lg capitalize text-sm font-medium transition-colors ${
                      filterRole === role ? 'bg-primary-900 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                 >
                  {role}s
                 </button>
              ))}
            </div>

            <Card className="overflow-hidden">
                {loading ? <PageLoader /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">User</th>
                                    <th className="px-6 py-4 font-semibold">Role</th>
                                    <th className="px-6 py-4 font-semibold">Organization</th>
                                    <th className="px-6 py-4 font-semibold">Verification</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map(user => (
                                    <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{user.name}</div>
                                            <div className="text-gray-500 text-xs">{user.email}</div>
                                            {user.isBanned && <Badge variant="error" className="mt-1">Banned</Badge>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={user.role === 'donor' ? 'info' : 'success'} className="capitalize">{user.role}</Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.organizationId ? (
                                                <div>
                                                    <span className="font-medium text-gray-800">{user.organizationId.name}</span>
                                                    <div className="text-xs text-gray-500 uppercase tracking-widest">{user.organizationId.type}</div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic">No Organization</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.organizationId?.status === 'pending' ? (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleOrgVerify(user.organizationId._id, 'approved')} className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 p-1.5 rounded-md" title="Approve">
                                                        <HiCheck className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleOrgVerify(user.organizationId._id, 'rejected')} className="text-rose-600 bg-rose-50 hover:bg-rose-100 p-1.5 rounded-md" title="Reject">
                                                        <HiX className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                 user.organizationId ? <Badge variant={user.organizationId.status === 'approved' ? 'success' : 'error'} className="capitalize">{user.organizationId.status}</Badge> : '-'
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button 
                                              onClick={() => handleUserBan(user._id, user.isBanned)} 
                                              className={`p-2 rounded-lg transition-colors ${user.isBanned ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                                              title={user.isBanned ? "Unban User" : "Ban User"}
                                            >
                                                {user.isBanned ? <HiOutlineShieldCheck className="w-5 h-5" /> : <HiBan className="w-5 h-5" />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">No users found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default UserManagement;

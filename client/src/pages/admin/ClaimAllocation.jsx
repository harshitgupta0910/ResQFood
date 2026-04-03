import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { HiScale, HiOutlineSwitchHorizontal, HiLocationMarker } from 'react-icons/hi';

const ClaimAllocation = () => {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchClaims = async () => {
        try {
            setLoading(true);
            const res = await adminAPI.getAllClaims();
            setClaims(res.data.claims);
        } catch (err) {
            toast.error('Failed to load claims');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClaims();
    }, []);

    const handleForceAssign = async (claimId) => {
        const newNgoId = window.prompt("Enter the exact User ID of the new NGO:");
        if (!newNgoId) return;

        try {
            await adminAPI.forceAssignClaim(claimId, newNgoId);
            toast.success('Claim reassigned successfully');
            fetchClaims();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reassign claim');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Claim & Allocation Control</h1>
                <p className="text-gray-500 mt-1">Monitor active orders and perform manual assignment overrides when needed.</p>
            </div>

            <Card className="overflow-hidden">
                {loading ? <PageLoader /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Claim ID / Item</th>
                                    <th className="px-6 py-4 font-semibold">Current NGO</th>
                                    <th className="px-6 py-4 font-semibold">Current Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Overrides</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {claims.map(claim => (
                                    <tr key={claim._id} className="hover:bg-gray-50/50 transition-colors bg-white">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                                                    <HiLocationMarker className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900">{claim.listingId?.title || 'Unknown Food Listing'}</div>
                                                    <div className="text-gray-500 text-xs uppercase tracking-wide">ID: {claim._id.substring(claim._id.length - 8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-800">{claim.ngoId?.name || 'Unassigned'}</div>
                                            <div className="text-xs text-gray-500">{claim.ngoId?.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={claim.status === 'completed' ? 'success' : (claim.status === 'pending' ? 'warning' : 'info')} className="capitalize">
                                                {claim.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button 
                                              onClick={() => handleForceAssign(claim._id)}
                                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 font-medium transition-colors"
                                              title="Force assign to different NGO"
                                            >
                                                <HiOutlineSwitchHorizontal className="w-5 h-5" /> Reassign NGO
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {claims.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-gray-500">No claims match the system.</td>
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

export default ClaimAllocation;
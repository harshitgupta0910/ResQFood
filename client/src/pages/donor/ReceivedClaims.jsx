import { useEffect, useState } from 'react';
import { claimsAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { formatDateTime, getStatusColor, getStatusLabel } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ReceivedClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await claimsAPI.getReceived({ limit: 100 });
      setClaims(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load received claims');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Claimed Orders</h1>
        <p className="text-surface-500 mt-1">All NGOs/organizations that claimed your listings with full details.</p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-50 text-surface-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Listing</th>
                <th className="px-4 py-3 font-semibold">Claimed By</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Quantity</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Claimed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {claims.map((claim) => (
                <tr key={claim._id} className="bg-white hover:bg-surface-50/40">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-surface-800">{claim.listingId?.title || 'Deleted listing'}</p>
                    <p className="text-xs text-surface-500">{claim.listingId?.address || 'No address'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-surface-800">{claim.ngoId?.name || 'Unknown NGO'}</p>
                    <p className="text-xs text-surface-500">Org: {claim.ngoId?.organizationId?.name || 'No organization'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-surface-700">{claim.ngoId?.email || 'No email'}</p>
                    <p className="text-xs text-surface-500">{claim.ngoId?.phone || claim.ngoId?.organizationId?.contactPhone || 'No phone'}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-surface-800">
                    {claim.claimedQuantity} {claim.listingId?.unit || ''}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={getStatusColor(claim.status)} size="sm">
                      {getStatusLabel(claim.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-surface-600">{formatDateTime(claim.createdAt)}</td>
                </tr>
              ))}
              {claims.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-surface-500">No one has claimed your listings yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ReceivedClaims;

import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { HiExclamationCircle, HiTrash, HiPencilAlt, HiCheckCircle } from 'react-icons/hi';

const ListingModeration = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchListings = async () => {
        try {
            setLoading(true);
            const res = await adminAPI.getAllListings();
            setListings(res.data.listings);
        } catch (err) {
            toast.error('Failed to load listings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchListings();
    }, []);

    const handleFlag = async (listingId, isFlagged) => {
        try {
            await adminAPI.moderateListing(listingId, { 
              isFlagged: !isFlagged, 
              flagReason: !isFlagged ? 'Admin forced review: Possible Anomaly' : '' 
            });
            toast.success(isFlagged ? 'Flag removed' : 'Listing flagged');
            fetchListings();
        } catch (err) {
            toast.error('Failed to update flag status');
        }
    };

    const handleDelete = async (listingId) => {
        if (!window.confirm('Are you sure you want to permanently delete this listing?')) return;
        try {
            await adminAPI.deleteListing(listingId);
            toast.success('Listing deleted');
            fetchListings();
        } catch (err) {
            toast.error('Failed to delete listing');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Food Listing Moderation</h1>
                <p className="text-gray-500 mt-1">Review active foods, identify anomalies, and enforce platform safety.</p>
            </div>

            <Card className="overflow-hidden">
                {loading ? <PageLoader /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 text-gray-600">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Title</th>
                                    <th className="px-6 py-4 font-semibold">Donor</th>
                                    <th className="px-6 py-4 font-semibold">Quantity</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold">Anomalies</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {listings.map(listing => (
                                    <tr key={listing._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{listing.title}</div>
                                            <div className="text-xs text-gray-500 uppercase tracking-widest">{listing.category}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {listing.donorId?.name || 'Unknown Donor'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-semibold ${listing.quantity > 500 ? 'text-rose-600' : 'text-gray-900'}`}>
                                                {listing.quantity} {listing.unit}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={listing.status === 'available' ? 'success' : 'neutral'} className="capitalize">{listing.status}</Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            {listing.isFlagged ? (
                                                <Badge variant="error" className="flex items-center gap-1">
                                                  <HiExclamationCircle className="w-3 h-3" /> Flagged
                                                </Badge>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button 
                                              onClick={() => handleFlag(listing._id, listing.isFlagged)}
                                              className={`p-2 rounded-lg transition-colors ${listing.isFlagged ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                              title={listing.isFlagged ? "Unflag" : "Flag Listing"}
                                            >
                                                {listing.isFlagged ? <HiCheckCircle className="w-5 h-5" /> : <HiExclamationCircle className="w-5 h-5" />}
                                            </button>
                                            <button 
                                              onClick={() => handleDelete(listing._id)}
                                              className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                                              title="Delete Permanently"
                                            >
                                                <HiTrash className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {listings.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">No listings found.</td>
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

export default ListingModeration;
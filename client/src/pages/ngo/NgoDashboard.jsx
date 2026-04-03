import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiLightningBolt, HiClipboardCheck, HiHeart, HiTrendingUp } from 'react-icons/hi';
import useAuthStore from '../../store/authStore';
import { listingsAPI, claimsAPI } from '../../services/api';
import { onEvent, offEvent } from '../../services/socket';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { formatTimeAgo, getStatusColor, getStatusLabel, getCategoryIcon, getTimeUntilExpiry } from '../../utils/helpers';
import toast from 'react-hot-toast';

const NgoDashboard = () => {
  const { user } = useAuthStore();
  const [availableListings, setAvailableListings] = useState([]);
  const [claimStats, setClaimStats] = useState({ total: 0, approved: 0 });
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);

  const fetchData = async () => {
    try {
      const [listingsRes, claimsRes] = await Promise.all([
        listingsAPI.getAll({ status: 'available', limit: 10, sort: '-createdAt' }),
        claimsAPI.getMy({ limit: 1 }),
      ]);
      setAvailableListings(listingsRes.data || []);
      setClaimStats({ total: claimsRes.pagination?.total || 0, approved: claimsRes.pagination?.total || 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Real-time: new listings
    const handleNewListing = (listing) => {
      setAvailableListings((prev) => [listing, ...prev].slice(0, 10));
      toast('🍲 New food listing available!', { icon: '📢' });
    };

    const handleListingUpdated = (listing) => {
      setAvailableListings((prev) => {
        if (listing.status !== 'available') {
          return prev.filter((l) => l._id !== listing._id);
        }
        return prev.map((l) => (l._id === listing._id ? listing : l));
      });
    };

    onEvent('listing:new', handleNewListing);
    onEvent('listing:updated', handleListingUpdated);

    return () => {
      offEvent('listing:new', handleNewListing);
      offEvent('listing:updated', handleListingUpdated);
    };
  }, []);

  const handleClaim = async (listingId) => {
    setClaiming(listingId);
    try {
      await listingsAPI.claim(listingId, {});
      toast.success('Listing claimed successfully!');
      setAvailableListings((prev) => prev.filter((l) => l._id !== listingId));
      setClaimStats((prev) => ({ ...prev, total: prev.total + 1, approved: prev.approved + 1 }));
    } catch (err) {
      toast.error(err.message || 'Failed to claim — may already be taken');
    } finally {
      setClaiming(null);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-10 animate-fade-in">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-surface-900">
          Welcome, <span className="gradient-text">{user.name?.split(' ')[0]}</span>
        </h1>
        <p className="text-surface-500 mt-2 text-base">Real-time food listings available for claim</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 stagger-children">
        <StatCard icon={<HiLightningBolt />} label="Available Now" value={availableListings.length} />
        <StatCard icon={<HiClipboardCheck />} label="My Claims" value={claimStats.total} />
        <StatCard icon={<HiHeart />} label="Meals Received" value={claimStats.approved} />
      </div>

      {/* Live Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live Feed
          </h2>
          <Link to="/ngo/live" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View all →
          </Link>
        </div>

        {availableListings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 stagger-children">
            {availableListings.map((listing) => {
              const expiry = getTimeUntilExpiry(listing.expiryAt);
              return (
                <Card key={listing._id} className="relative overflow-hidden" padding="p-5 md:p-6">
                  {expiry.isUrgent && !expiry.isExpired && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                      URGENT
                    </div>
                  )}

                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary-100 to-accent-100 flex items-center justify-center text-3xl shrink-0">
                      {getCategoryIcon(listing.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-surface-800 truncate">{listing.title}</h3>
                      <p className="text-sm text-surface-500 mt-0.5">
                        {listing.quantity} {listing.unit} · {listing.donorId?.name || 'Donor'}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-surface-400">
                        <span className={expiry.isUrgent ? 'text-red-500 font-medium' : ''}>{expiry.text}</span>
                        <span>·</span>
                        <span>{formatTimeAgo(listing.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      isLoading={claiming === listing._id}
                      onClick={() => handleClaim(listing._id)}
                    >
                      Claim Now
                    </Button>
                    <Link to={`/ngo/live/${listing._id}`}>
                      <Button size="sm" variant="secondary">Details</Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-12 text-surface-400">
            <p className="text-4xl mb-3">📡</p>
            <p className="font-medium">No listings available right now</p>
            <p className="text-sm mt-1">New listings will appear here in real-time</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default NgoDashboard;


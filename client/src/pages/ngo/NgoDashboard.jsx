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
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { formatTimeAgo, getStatusColor, getStatusLabel, getCategoryIcon, getTimeUntilExpiry } from '../../utils/helpers';
import toast from 'react-hot-toast';

const NgoDashboard = () => {
  const { user } = useAuthStore();
  const [availableListings, setAvailableListings] = useState([]);
  const [claimStats, setClaimStats] = useState({ total: 0, approved: 0 });
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [claimQuantity, setClaimQuantity] = useState('');

  const fetchData = async () => {
    try {
      const [listingsRes, claimsRes] = await Promise.all([
        listingsAPI.getAll({ status: 'available', limit: 10, sort: '-createdAt' }),
        claimsAPI.getMy({ limit: 1 }),
      ]);
      setAvailableListings((listingsRes.data || []).filter((l) => Number(l.quantity) > 0));
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
      if (Number(listing.quantity) <= 0 || listing.status !== 'available') return;
      setAvailableListings((prev) => [listing, ...prev].slice(0, 10));
      toast('🍲 New food listing available!', { icon: '📢' });
    };

    const handleListingUpdated = (listing) => {
      setAvailableListings((prev) => {
        if (listing.status !== 'available' || Number(listing.quantity) <= 0) {
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

  const openClaimModal = (listing) => {
    setSelectedListing(listing);
    setClaimQuantity(String(listing.quantity));
    setClaimModalOpen(true);
  };

  const submitClaim = async () => {
    if (!selectedListing) return;

    const quantity = Number(claimQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (quantity > selectedListing.quantity) {
      toast.error(`Only ${selectedListing.quantity} ${selectedListing.unit} is currently available`);
      return;
    }

    const listing = selectedListing;
    const listingId = listing._id;
    setClaiming(listingId);
    try {
      const res = await listingsAPI.claim(listingId, { quantity });
      const updatedListing = res?.data?.listing;

      toast.success(`Claimed ${quantity} ${listing.unit} successfully!`);

      if (updatedListing?.status === 'available' && Number(updatedListing.quantity) > 0) {
        setAvailableListings((prev) => prev.map((l) => (l._id === listingId ? updatedListing : l)));
      } else {
        setAvailableListings((prev) => prev.filter((l) => l._id !== listingId));
      }

      setClaimStats((prev) => ({ ...prev, total: prev.total + 1, approved: prev.approved + 1 }));
      setClaimModalOpen(false);
      setSelectedListing(null);
      setClaimQuantity('');
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
                      onClick={() => openClaimModal(listing)}
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

      <Modal
        isOpen={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
        title="Claim Partial Quantity"
        size="sm"
      >
        {selectedListing && (
          <div className="space-y-4">
            <p className="text-sm text-surface-600">
              Select how much you want to claim from <span className="font-semibold">{selectedListing.title}</span>.
            </p>

            <Input
              type="number"
              min="1"
              max={selectedListing.quantity}
              label={`Quantity (${selectedListing.unit})`}
              value={claimQuantity}
              onChange={(e) => setClaimQuantity(e.target.value)}
            />

            <p className="text-xs text-surface-500">
              Available: {selectedListing.quantity} {selectedListing.unit}
            </p>

            <div className="flex gap-2">
              <Button variant="secondary" className="w-full" onClick={() => setClaimModalOpen(false)}>
                Cancel
              </Button>
              <Button className="w-full" isLoading={claiming === selectedListing._id} onClick={submitClaim}>
                Confirm Claim
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default NgoDashboard;


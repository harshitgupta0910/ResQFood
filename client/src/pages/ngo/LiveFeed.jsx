import { useState, useEffect } from 'react';
import { listingsAPI } from '../../services/api';
import { onEvent, offEvent } from '../../services/socket';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { getCategoryIcon, getCategoryLabel, getTimeUntilExpiry, getConditionLabel } from '../../utils/helpers';
import toast from 'react-hot-toast';

const LiveFeed = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchListings = async () => {
    try {
      const params = { status: 'available', limit: 50, sort: '-createdAt' };
      if (filter !== 'all') params.category = filter;
      const res = await listingsAPI.getAll(params);
      setListings(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [filter]);

  useEffect(() => {
    const handleNew = (listing) => {
      setListings((prev) => [listing, ...prev]);
      toast('🍲 New listing!', { icon: '📢' });
    };
    const handleUpdated = (listing) => {
      if (listing.status !== 'available') {
        setListings((prev) => prev.filter((l) => l._id !== listing._id));
      }
    };

    onEvent('listing:new', handleNew);
    onEvent('listing:updated', handleUpdated);
    return () => {
      offEvent('listing:new', handleNew);
      offEvent('listing:updated', handleUpdated);
    };
  }, []);

  const handleClaim = async (id) => {
    setClaiming(id);
    try {
      await listingsAPI.claim(id, {});
      toast.success('Claimed successfully!');
      setListings((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      toast.error(err.message || 'Already claimed');
    } finally {
      setClaiming(null);
    }
  };

  const categories = ['all', 'cooked_meals', 'fruits', 'raw_vegetables', 'bakery', 'dairy', 'grains', 'beverages', 'canned_goods'];

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        <h1 className="text-3xl md:text-4xl font-bold text-surface-900">Live Feed</h1>
        <Badge variant="success" size="md">{listings.length} available</Badge>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 md:gap-3 overflow-x-auto pb-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
              filter === c ? 'bg-primary-600 text-white shadow-md' : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-50'
            }`}
          >
            {c === 'all' ? 'All' : `${getCategoryIcon(c)} ${getCategoryLabel(c)}`}
          </button>
        ))}
      </div>

      {listings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 stagger-children">
          {listings.map((listing) => {
            const expiry = getTimeUntilExpiry(listing.expiryAt);
            return (
              <Card key={listing._id} hover className="relative" padding="p-4 md:p-5">
                {expiry.isUrgent && !expiry.isExpired && (
                  <div className="absolute top-4 right-4 px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                    ⏰ URGENT
                  </div>
                )}

                {listing.photos?.[0] ? (
                  <img src={listing.photos[0].url} alt="" className="w-full h-36 object-cover rounded-xl mb-4" />
                ) : (
                  <div className="w-full h-36 bg-linear-to-br from-primary-50 to-accent-50 rounded-xl mb-4 flex items-center justify-center text-5xl">
                    {getCategoryIcon(listing.category)}
                  </div>
                )}

                <h3 className="font-bold text-surface-800 mb-1.5 line-clamp-1">{listing.title}</h3>
                <p className="text-sm text-surface-500 mb-2">
                  {listing.quantity} {listing.unit} · {getConditionLabel(listing.condition)}
                </p>

                {listing.description && (
                  <p className="text-xs text-surface-400 mb-3 line-clamp-2">{listing.description}</p>
                )}

                <div className="flex items-center justify-between text-xs text-surface-400 mb-4.5">
                  <span>🏪 {listing.donorId?.name || 'Donor'}</span>
                  <span className={expiry.isUrgent ? 'text-red-500 font-semibold' : ''}>{expiry.text}</span>
                </div>

                {listing.address && (
                  <p className="text-xs text-surface-400 mb-4 truncate">📍 {listing.address}</p>
                )}

                <Button
                  className="w-full"
                  size="sm"
                  isLoading={claiming === listing._id}
                  onClick={() => handleClaim(listing._id)}
                >
                  🤝 Claim This Listing
                </Button>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon="📡"
          title="No listings available"
          description="New listings will appear here automatically in real-time. Stay tuned!"
        />
      )}
    </div>
  );
};

export default LiveFeed;


import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiPlus, HiClock, HiCheckCircle, HiChartBar } from 'react-icons/hi';
import useAuthStore from '../../store/authStore';
import { useListings } from '../../hooks/useListings';
import { claimsAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { formatRelativeTime, getStatusColor, getStatusLabel } from '../../utils/helpers';

const DonorDashboard = () => {
  const { user } = useAuthStore();
  const { data, isLoading } = useListings({ donorId: user?._id, limit: 10 });
  const [deliveredClaimsCount, setDeliveredClaimsCount] = useState(0);

  const listings = data?.data || [];

  useEffect(() => {
    let isMounted = true;

    const fetchDeliveredClaimsCount = async () => {
      try {
        const res = await claimsAPI.getReceived({ limit: 200 });
        const claims = res?.data || [];
        const deliveredCount = claims.filter((claim) => ['delivered', 'completed'].includes(claim.status)).length;

        if (isMounted) {
          setDeliveredClaimsCount(deliveredCount);
        }
      } catch (error) {
        if (isMounted) {
          setDeliveredClaimsCount(0);
        }
      }
    };

    if (user?._id) {
      fetchDeliveredClaimsCount();
    }

    return () => {
      isMounted = false;
    };
  }, [user?._id]);
  
  // Calculate basic stats from visible data or use default zeros
  const stats = {
    total: listings.length,
    active: listings.filter(l => l.status === 'available').length,
    picked_up: listings.filter(l => l.status === 'picked_up').length,
    delivered: deliveredClaimsCount,
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 md:gap-12 glass-panel p-8 md:p-10 lg:p-12 rounded-[3.5rem] relative overflow-hidden">
        {/* Soft decorative background glows */}
        <div className="absolute -top-32 -right-32 w-[32rem] h-[32rem] bg-primary-400/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-[32rem] h-[32rem] bg-accent-400/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <Badge color="primary" className="mb-6">Donor Portal</Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-surface-950 heading-font tracking-tight mb-4">
            Welcome back,
            <br className="hidden md:block" />
            <span className="gradient-text line-clamp-1 py-1">{user?.organizationName || user?.name}</span>
          </h1>
          <p className="text-surface-600 text-lg md:text-xl font-bold max-w-2xl mt-4 leading-relaxed">
            Ready to make an impact today? Your surplus food can become someone's next meal within minutes.
          </p>
        </div>
        
        <div className="relative z-10 shrink-0">
          <Link to="/donor/create">
            <Button size="xl" icon={<HiPlus />} className="shadow-[0_12px_40px_-12px_rgba(0,230,118,0.7)] w-full xl:w-auto">
              List Surplus Food
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8">
        <StatCard
          title="Total Donations"
          value={stats.total}
          icon={<HiChartBar />}
          color="primary"
          trendUp={true}
        />
        <StatCard
          title="Active Listings"
          value={stats.active}
          icon={<HiClock />}
          color="warning"
        />
        <StatCard
          title="In Transit"
          value={stats.picked_up}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
          color="info"
        />
        <StatCard
          title="Successfully Delivered"
          value={stats.delivered}
          icon={<HiCheckCircle />}
          color="success"
        />
      </div>

      {/* Recent Activity */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between gap-6 px-2">
          <h2 className="text-3xl font-black heading-font text-surface-950 tracking-tight">Recent Listings</h2>
          <Link to="/donor/listings" className="text-primary-600 font-extrabold hover:text-primary-700 hover:underline underline-offset-8 decoration-4 decoration-primary-500/40 text-lg transition-all">
            View All
          </Link>
        </div>

        <Card glass padding="p-2 sm:p-4 md:p-6 lg:p-8">
          {listings.length === 0 ? (
            <EmptyState
              icon={HiPlus}
              title="No listings yet"
              description="Create your first food listing to start making an impact."
              actionLabel="Create Listing"
              onAction={() => window.location.href = '/donor/create'}
            />
          ) : (
            <>
              <div className="md:hidden space-y-3">
                {listings.map((listing) => (
                  <div key={listing._id} className="rounded-2xl border border-surface-200 bg-white/70 p-4">
                    <div className="flex items-start gap-3">
                      {listing.photoUrl ? (
                        <img src={listing.photoUrl} alt={listing.title} className="w-12 h-12 rounded-xl object-cover shadow-sm bg-surface-100" />
                      ) : (
                        <div className="w-12 h-12 bg-surface-100 rounded-xl flex items-center justify-center text-xl shadow-sm">
                          🍲
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-surface-900 truncate">{listing.title}</p>
                        <p className="text-sm text-surface-500 font-medium mt-1">Qty: {listing.quantity}</p>
                        <p className="text-xs text-surface-500 mt-1">Posted {formatRelativeTime(listing.createdAt)}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <Badge color={getStatusColor(listing.status)} variant="subtle" size="md">
                        {getStatusLabel(listing.status)}
                      </Badge>
                      <Link to={`/donor/listings/${listing._id}`}>
                        <Button variant="ghost" size="sm">Details</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-200">
                    <th className="py-4 px-5 lg:px-6 font-bold text-surface-500 text-sm uppercase tracking-wider">Item</th>
                    <th className="py-4 px-5 lg:px-6 font-bold text-surface-500 text-sm uppercase tracking-wider">Posted</th>
                    <th className="py-4 px-5 lg:px-6 font-bold text-surface-500 text-sm uppercase tracking-wider">Status</th>
                    <th className="py-4 px-5 lg:px-6 text-right font-bold text-surface-500 text-sm uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {listings.map((listing) => (
                    <tr key={listing._id} className="hover:bg-surface-50/50 transition-colors">
                      <td className="py-5 px-5 lg:px-6">
                        <div className="flex items-center gap-4">
                          {listing.photoUrl ? (
                            <img src={listing.photoUrl} alt={listing.title} className="w-12 h-12 rounded-xl object-cover shadow-sm bg-surface-100" />
                          ) : (
                            <div className="w-12 h-12 bg-surface-100 rounded-xl flex items-center justify-center text-xl shadow-sm">
                              🍲
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-surface-900 line-clamp-1">{listing.title}</p>
                            <p className="text-sm text-surface-500 font-medium">Qty: {listing.quantity}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-5 lg:px-6">
                        <p className="text-sm font-semibold text-surface-700">{formatRelativeTime(listing.createdAt)}</p>
                      </td>
                      <td className="py-5 px-5 lg:px-6">
                        <Badge color={getStatusColor(listing.status)} variant="subtle" size="md">
                          {getStatusLabel(listing.status)}
                        </Badge>
                      </td>
                      <td className="py-5 px-5 lg:px-6 text-right">
                        <Link to={`/donor/listings/${listing._id}`}>
                          <Button variant="ghost" size="sm">Details</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DonorDashboard;

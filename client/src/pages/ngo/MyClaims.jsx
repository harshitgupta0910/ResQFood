import { useState, useEffect } from 'react';
import { claimsAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { formatDateTime, getStatusColor, getStatusLabel, getCategoryIcon } from '../../utils/helpers';

const MyClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const res = await claimsAPI.getMy({ page, limit: 12 });
        setClaims(res.data || []);
        setPagination(res.pagination || {});
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
  }, [page]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-surface-900">My Claims</h1>
        <p className="text-surface-500 mt-2">{pagination.total || 0} claims total</p>
      </div>

      {claims.length > 0 ? (
        <div className="space-y-5 stagger-children">
          {claims.map((claim) => {
            const listing = claim.listingId;
            if (!listing) return null;

            return (
              <Card key={claim._id} className="flex flex-col md:flex-row md:items-center gap-4" padding="p-5 md:p-6">
                <div className="w-14 h-14 rounded-xl bg-linear-to-br from-primary-100 to-accent-100 flex items-center justify-center text-2xl shrink-0">
                  {getCategoryIcon(listing.category)}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-surface-800">{listing.title}</h3>
                  <p className="text-sm text-surface-500">
                    {claim.claimedQuantity} {listing.unit} claimed · by {listing.donorId?.name || 'Donor'}
                  </p>
                  <p className="text-xs text-surface-400 mt-1">
                    Claimed: {formatDateTime(claim.createdAt)} · Score: {claim.priorityScore}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(claim.status)}>
                    {getStatusLabel(claim.status)}
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon="📋"
          title="No claims yet"
          description="Visit the Live Feed to claim available food listings"
          action="Go to Live Feed"
          onAction={() => window.location.href = '/ngo/live'}
        />
      )}

      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="px-4 py-2 text-sm text-surface-500">Page {page} of {pagination.pages}</span>
          <Button variant="secondary" size="sm" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
};

export default MyClaims;

export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTimeAgo = (date) => {
  if (!date) return '';
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
};

export const formatRelativeTime = (date) => formatTimeAgo(date);

export const getTimeUntilExpiry = (expiryAt) => {
  if (!expiryAt) return { text: '', isUrgent: false, isExpired: false };
  const now = new Date();
  const expiry = new Date(expiryAt);
  const diffMs = expiry - now;

  if (diffMs <= 0) return { text: 'Expired', isUrgent: true, isExpired: true };

  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);

  if (hours < 1) return { text: `${mins}m left`, isUrgent: true, isExpired: false };
  if (hours < 6) return { text: `${hours}h ${mins}m left`, isUrgent: true, isExpired: false };
  if (hours < 24) return { text: `${hours}h left`, isUrgent: false, isExpired: false };

  const days = Math.floor(hours / 24);
  return { text: `${days}d left`, isUrgent: false, isExpired: false };
};

export const getCategoryLabel = (category) => {
  const labels = {
    cooked_meals: 'Cooked Meals',
    raw_vegetables: 'Raw Vegetables',
    fruits: 'Fruits',
    dairy: 'Dairy',
    bakery: 'Bakery',
    canned_goods: 'Canned Goods',
    beverages: 'Beverages',
    grains: 'Grains',
    mixed: 'Mixed',
    other: 'Other',
  };
  return labels[category] || category;
};

export const getCategoryIcon = (category) => {
  const icons = {
    cooked_meals: '🍲',
    raw_vegetables: '🥬',
    fruits: '🍎',
    dairy: '🥛',
    bakery: '🍞',
    canned_goods: '🥫',
    beverages: '🥤',
    grains: '🌾',
    mixed: '📦',
    other: '🍽️',
  };
  return icons[category] || '🍽️';
};

export const getStatusColor = (status) => {
  const colors = {
    available: 'bg-green-100 text-green-700 border-green-200',
    claimed: 'bg-amber-100 text-amber-700 border-amber-200',
    picked_up: 'bg-blue-100 text-blue-700 border-blue-200',
    delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    expired: 'bg-red-100 text-red-700 border-red-200',
    cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
    assigned: 'bg-purple-100 text-purple-700 border-purple-200',
    en_route_to_donor: 'bg-blue-100 text-blue-700 border-blue-200',
    en_route_to_ngo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    approved: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

export const getStatusLabel = (status) => {
  const labels = {
    available: 'Available',
    claimed: 'Claimed',
    picked_up: 'Picked Up',
    delivered: 'Delivered',
    expired: 'Expired',
    cancelled: 'Cancelled',
    assigned: 'Assigned',
    en_route_to_donor: 'En Route to Donor',
    en_route_to_ngo: 'En Route to NGO',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
  };
  return labels[status] || status;
};

export const getConditionLabel = (condition) => {
  const labels = {
    fresh: 'Fresh',
    near_expiry: 'Near Expiry',
    packaged: 'Packaged',
  };
  return labels[condition] || condition;
};

export const getRoleLabel = (role) => {
  const labels = {
    admin: 'Admin',
    donor: 'Donor',
    ngo: 'NGO',

    buyer: 'Buyer',
  };
  return labels[role] || role;
};

export const getRoleColor = (role) => {
  const colors = {
    admin: 'bg-purple-100 text-purple-700',
    donor: 'bg-blue-100 text-blue-700',
    ngo: 'bg-emerald-100 text-emerald-700',
    buyer: 'bg-gray-100 text-gray-700',
  };
  return colors[role] || 'bg-gray-100 text-gray-700';
};

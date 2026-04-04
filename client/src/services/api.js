import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('resqfood_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';

    // Auto logout on 401
    if (error.response?.status === 401) {
      localStorage.removeItem('resqfood_token');
      localStorage.removeItem('resqfood_user');
      window.location.href = '/login';
    }

    return Promise.reject({ message, status: error.response?.status });
  }
);

// ===== Auth API =====
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// ===== Listings API =====
export const listingsAPI = {
  getAll: (params) => api.get('/listings', { params }),
  getById: (id) => api.get(`/listings/${id}`),
  create: (formData) =>
    api.post('/listings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id, data) => api.patch(`/listings/${id}`, data),
  delete: (id) => api.delete(`/listings/${id}`),
  claim: (id, data) => api.post(`/listings/${id}/claim`, data),
  askChatbot: (id, data) => api.post(`/listings/${id}/chatbot`, data),
  intakeAssist: (data) => api.post('/listings/intake/assist', data),
};

// ===== Claims API =====
export const claimsAPI = {
  getMy: (params) => api.get('/claims', { params }),
  getAll: (params) => api.get('/claims/all', { params }),
  getReceived: (params) => api.get('/claims/received', { params }),
  getByListing: (listingId) => api.get(`/claims/listing/${listingId}`),
  sendDeliveryOtp: (claimId) => api.post(`/claims/${claimId}/send-delivery-otp`),
  verifyDeliveryOtp: (claimId, data) => api.post(`/claims/${claimId}/verify-delivery-otp`, data),
};

// ===== Pickups API =====
export const pickupsAPI = {
  assign: (data) => api.post('/pickups/assign', data),
  getMy: (params) => api.get('/pickups/my', { params }),
  getAll: (params) => api.get('/pickups', { params }),
  updateStatus: (id, data) => api.patch(`/pickups/${id}/status`, data),
  uploadProof: (id, formData) =>
    api.post(`/pickups/${id}/proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ===== Users API =====
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getStats: () => api.get('/users/stats'),
  verify: (id) => api.patch(`/users/${id}/verify`),
  updateProfile: (data, isMultipart = false) =>
    api.patch('/users/profile', data, isMultipart ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined),
};

// ===== Analytics API =====
export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getPublicOverview: () => api.get('/analytics/public-overview'),
};

// ===== Utils API =====
export const utilsAPI = {
  normalizeAddress: (address) => api.get('/utils/normalize-address', { params: { address } }),
};

// ===== Notifications API =====
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// ===== Admin API =====
export const adminAPI = {
  getUserMetrics: () => api.get('/admin/metrics'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (userId, data) => api.patch(`/admin/users/${userId}/status`, data),
  verifyOrganization: (orgId, status) => api.patch(`/admin/organizations/${orgId}/verify`, { status }),
  getUserLogs: (userId) => api.get(`/admin/users/${userId}/logs`),
  getAllListings: (params) => api.get('/admin/listings', { params }),
  moderateListing: (listingId, data) => api.patch(`/admin/listings/${listingId}/moderate`, data),
  deleteListing: (listingId) => api.delete(`/admin/listings/${listingId}`),
  getAllClaims: (params) => api.get('/admin/claims', { params }),
  forceAssignClaim: (claimId, newNgoId) => api.patch(`/admin/claims/${claimId}/force-assign`, { newNgoId }),
  getComplaints: (params) => api.get('/admin/complaints', { params }),
  resolveComplaint: (complaintId, data) => api.patch(`/admin/complaints/${complaintId}/resolve`, data),
};

// ===== Ratings API =====
export const ratingsAPI = {
  upsert: (data) => api.post('/ratings', data),
  update: (id, data) => api.patch(`/ratings/${id}`, data),
  getByClaim: (claimId) => api.get(`/ratings/claim/${claimId}`),
  getUserSummary: (userId) => api.get(`/ratings/user/${userId}/summary`),
};

export default api;

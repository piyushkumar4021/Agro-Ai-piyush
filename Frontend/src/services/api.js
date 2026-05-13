import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE, timeout: 15000 });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('agro_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('agro_token');
      localStorage.removeItem('agro_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

export const authAPI = {
  register: d => api.post('/auth/register', d),
  login: d => api.post('/auth/login', d),
  getMe: () => api.get('/auth/me'),
};

export const cropAPI = {
  getAll: p => api.get('/crops', { params: p }),
  getById: id => api.get(`/crops/${id}`),
  getMyCrops: () => api.get('/crops/my/listings'),
  create: d => api.post('/crops', d, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, d) => api.put(`/crops/${id}`, d),
  delete: id => api.delete(`/crops/${id}`),
};

export const orderAPI = {
  place: d => api.post('/orders', d),
  pay: (id, d) => api.post(`/orders/${id}/pay`, d),
  confirmDispatch: id => api.put(`/orders/${id}/dispatch`),
  confirmReceipt: id => api.put(`/orders/${id}/confirm-receipt`),
  getMyOrders: () => api.get('/orders/my'),
  getFarmerOrders: () => api.get('/orders/farmer'),
  getById: id => api.get(`/orders/${id}`),
  updateStatus: (id, s) => api.put(`/orders/${id}/status`, { status: s }),
  cancel: (id, r) => api.put(`/orders/${id}/cancel`, { reason: r }),
};

export const aiAPI = {
  predictPrice: d => api.post('/ai/predict-price', d),
  getRecommendations: p => api.get('/ai/recommendations', { params: p }),
  getPriceHistory: p => api.get('/ai/price-history', { params: p }),
};

// Direct call to the ML model server (localhost:8000)
export const mlAPI = {
  predictPrice: async ({ State, District, Commodity, Arrival_Date }) => {
    const res = await axios.post('http://localhost:8000/predict-price', {
      State, District, Commodity, Arrival_Date,
    });
    return res.data; // returns { predicted_modal_price, commodity, district }
  },
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: p => api.get('/admin/users', { params: p }),
  toggleUser: id => api.put(`/admin/users/${id}/toggle`),
  getPendingCrops: () => api.get('/admin/crops/pending'),
  approveCrop: id => api.put(`/admin/crops/${id}/approve`),
  getAllOrders: p => api.get('/admin/orders', { params: p }),
};

export const paymentAPI = {
  createOrder:    (orderId, data) => api.post(`/payments/${orderId}/create-order`, data),
  verifyPayment:  (orderId, data) => api.post(`/payments/${orderId}/verify`, data),
  getStatus:      (orderId)       => api.get(`/payments/${orderId}/status`),
};

export const userAPI = {
  getProfile:    ()     => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
};

export const transactionAPI = {
  getMyTransactions: () => api.get('/transactions/my'),
  getForOrder: (orderId) => api.get(`/transactions/my`).then(res => ({
    ...res,
    data: {
      ...res.data,
      transactions: (res.data.transactions || []).filter(t => t.order?._id === orderId || t.order === orderId),
    },
  })),
};

export const notificationAPI = {
  getAll:        (params) => api.get('/notifications', { params }),
  getUnreadCount:()       => api.get('/notifications/unread-count'),
  markRead:      (id)     => api.put(`/notifications/${id}/read`),
  markAllRead:   ()       => api.put('/notifications/read-all'),
};

export const reviewAPI = {
  create:         (data) => api.post('/reviews', data),
  getUserReviews: (userId) => api.get(`/reviews/user/${userId}`),
  getCropReviews: (cropId) => api.get(`/reviews/crop/${cropId}`),
};

export const invoiceAPI = {
  download: (orderId) => api.get(`/invoices/${orderId}`, { responseType: 'text' }),
};
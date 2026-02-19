/**
 * FoodLink Campus - API Service
 * Centralized Axios instance with JWT handling
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
                        refresh: refreshToken,
                    });

                    const { access } = response.data;
                    localStorage.setItem('accessToken', access);

                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, logout user
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// =============================================================================
// AUTH ENDPOINTS
// =============================================================================

export const authAPI = {
    login: (credentials) => api.post('/auth/login/', credentials),
    verifyOTP: (data) => api.post('/auth/verify-otp/', data),
    googleLogin: (tokenData) => api.post('/auth/google/', tokenData),
    register: (userData) => api.post('/auth/register/', userData),
    getProfile: () => api.get('/auth/profile/'),
    updateProfile: (data) => api.put('/auth/profile/', data),
    refreshToken: (refreshToken) => api.post('/auth/token/refresh/', { refresh: refreshToken }),
};

// =============================================================================
// FOOD ENDPOINTS
// =============================================================================

export const foodAPI = {
    getAll: (params = {}) => api.get('/food/', { params }),
    getById: (id) => api.get(`/food/${id}/`),
    create: (data) => api.post('/food/create/', data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        }
    }),
    update: (id, data) => api.put(`/food/${id}/`, data),
    delete: (id) => api.delete(`/food/${id}/`),
    getMyListings: () => api.get('/food/my-listings/'),
    getEscalated: () => api.get('/food/escalated/'),
};

// =============================================================================
// RESERVATION ENDPOINTS
// =============================================================================

export const reservationAPI = {
    create: (foodItemId, quantity = 1) => api.post('/reservations/create/', { food_item_id: foodItemId, quantity }),
    createBulk: (items) => api.post('/reservations/bulk/', { items }),
    getAll: () => api.get('/reservations/'),
    getById: (id) => api.get(`/reservations/${id}/`),
    getStaffClaims: (status = null) => api.get('/reservations/staff-claims/', { params: status ? { status } : {} }),
    verifyQR: (qrCode, signature) => api.post('/reservations/verify-qr/', {
        qr_code_string: qrCode,
        qr_signature: signature,
    }),
};

// =============================================================================
// ROUTE ENDPOINTS (Charity)
// =============================================================================

export const routeAPI = {
    create: (foodItemIds) => api.post('/routes/create/', { food_item_ids: foodItemIds }),
    getAll: () => api.get('/routes/'),
    getById: (id) => api.get(`/routes/${id}/`),
    start: (id) => api.put(`/routes/${id}/`, { action: 'start' }),
    complete: (id) => api.put(`/routes/${id}/`, { action: 'complete' }),
};

// =============================================================================
// NOTIFICATION ENDPOINTS
// =============================================================================

export const notificationAPI = {
    getAll: () => api.get('/notifications/'),
    markRead: (id) => api.put(`/notifications/${id}/read/`),
    markAllRead: () => api.put('/notifications/read-all/'),
};

// =============================================================================
// STATS & LEADERBOARD ENDPOINTS
// =============================================================================

export const statsAPI = {
    getLeaderboard: (limit = 10) => api.get('/leaderboard/', { params: { limit } }),
    getImpactStats: () => api.get('/stats/impact/'),
    getImpactReport: () => api.get('/stats/report/'),
};

// =============================================================================
// AI CHAT ENDPOINT
// =============================================================================

export const chatAPI = {
    send: (message, context = '') => api.post('/chat/', { message, context }),
};

// =============================================================================
// ADMIN ENDPOINTS
// =============================================================================

export const adminAPI = {
    getUsers: (role = null) => api.get('/admin/users/', { params: role ? { role } : {} }),
    getUser: (id) => api.get(`/admin/users/${id}/`),
    updateUser: (id, data) => api.put(`/admin/users/${id}/`, data),
    deactivateUser: (id) => api.delete(`/admin/users/${id}/`),
};

// =============================================================================
// SUPPORT CHAT ENDPOINTS
// =============================================================================

export const supportAPI = {
    // User endpoints
    getMessages: () => api.get('/support/'),
    sendMessage: (message) => api.post('/support/', { message }),

    // Admin endpoints
    getSupportUsers: () => api.get('/admin/support/users/'),
    getUserHistory: (userId) => api.get(`/admin/support/users/${userId}/`),
    replyToUser: (userId, message) => api.post(`/admin/support/users/${userId}/`, { message }),
};

export default api;

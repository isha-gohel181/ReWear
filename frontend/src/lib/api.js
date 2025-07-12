import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  try {
    if (window.Clerk?.session) {
      const token = await window.Clerk.session.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (error) {
    console.error("Error getting auth token:", error);
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API functions
export const apiService = {
  // Auth
  getAuthStatus: () => api.get("/auth/status"),
  getCurrentUser: () => api.get("/auth/me"),

  // Users
  getUserProfile: () => api.get("/users/me"),
  updateUserProfile: (data) => api.put("/users/me", data),
  getAllUsers: (params) => api.get("/users", { params }),

  // Items
  getItems: (params) => api.get("/items", { params }),
  getItemById: (id) => api.get(`/items/${id}`),
  getUserItems: (params) =>
    api.get("/items", {
      params: { ...params, owner: "me" },
    }),
  createItem: (formData) =>
    api.post("/items", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateItem: (id, formData) =>
    api.put(`/items/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteItem: (id) => api.delete(`/items/${id}`),

  // Swaps
  requestSwap: (data) => api.post("/swaps/request", data),
  respondToSwap: (data) => api.post("/swaps/respond", data),
  getUserSwaps: (params) => api.get("/swaps/user", { params }),
  addSwapMessage: (data) => api.post("/swaps/message", data),

  // Admin
  moderateItem: (data) => api.post("/items/moderate", data),
  getPendingItems: (params) => api.get("/admin/pending-items", { params }),
  getDashboardStats: () => api.get("/admin/stats"),
  updateUserRole: (data) => api.post("/admin/user-role", data),
};

export default api;

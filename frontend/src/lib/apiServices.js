import apiClient  from "./api";

// Auth Services
export const authService = {
  getMe: () => apiClient.get("/auth/me"),
  getStatus: () => apiClient.get("/auth/status"),
};

// User Services
export const userService = {
  getProfile: () => apiClient.get("/users/me"),
  updateProfile: (data) => apiClient.put("/users/me", data),
  getAllUsers: (params) => apiClient.get("/users", { params }),
  deleteAccount: () => apiClient.delete("/users/me"),
};

// Item Services
export const itemService = {
  createItem: (formData) =>
    apiClient.post("/items", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getItems: (params) => apiClient.get("/items", { params }),
  getItemById: (id) => apiClient.get(`/items/${id}`),
  updateItem: (id, formData) =>
    apiClient.put(`/items/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteItem: (id) => apiClient.delete(`/items/${id}`),
  moderateItem: (data) => apiClient.post("/items/moderate", data),
};

// Swap Services
export const swapService = {
  requestSwap: (data) => apiClient.post("/swaps/request", data),
  respondToSwap: (data) => apiClient.post("/swaps/respond", data),
  getUserSwaps: () => apiClient.get("/swaps/user"),
  addMessage: (data) => apiClient.post("/swaps/message", data),
};

// Admin Services
export const adminService = {
  getPendingItems: (params) =>
    apiClient.get("/admin/pending-items", { params }),
  getStats: () => apiClient.get("/admin/stats"),
  updateUserRole: (data) => apiClient.post("/admin/user-role", data),
};

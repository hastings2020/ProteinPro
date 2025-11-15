import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// User API
export const fetchUser = async (userId) => {
  const response = await api.get(`/user/${userId}`);
  return response.data;
};

export const updateUser = async (userId, userData) => {
  const response = await api.put(`/user/${userId}`, userData);
  return response.data;
};

// Food Entries API
export const fetchEntries = async (userId) => {
  const response = await api.get(`/entries/${userId}`);
  return response.data;
};

export const fetchEntriesByDate = async (userId, date) => {
  const response = await api.get(`/entries/${userId}/date/${date}`);
  return response.data;
};

export const fetchEntriesByDateRange = async (userId, startDate, endDate) => {
  const response = await api.get(`/entries/${userId}/range`, {
    params: { startDate, endDate }
  });
  return response.data;
};

export const fetchDailyTotals = async (userId, startDate, endDate) => {
  const response = await api.get(`/entries/${userId}/daily-totals`, {
    params: { startDate, endDate }
  });
  return response.data;
};

export const addEntry = async (entryData) => {
  const response = await api.post('/entries', entryData);
  return response.data;
};

export const updateEntry = async (entryId, entryData) => {
  const response = await api.put(`/entries/${entryId}`, entryData);
  return response.data;
};

export const deleteEntry = async (entryId) => {
  const response = await api.delete(`/entries/${entryId}`);
  return response.data;
};

// Analytics API
export const fetchAnalytics = async (userId, startDate, endDate) => {
  const response = await api.get(`/analytics/${userId}`, {
    params: { startDate, endDate }
  });
  return response.data;
};

// Favorites API
export const fetchFavorites = async (userId) => {
  const response = await api.get(`/favorites/${userId}`);
  return response.data;
};

export const addFavorite = async (favoriteData) => {
  const response = await api.post('/favorites', favoriteData);
  return response.data;
};

export const deleteFavorite = async (favoriteId) => {
  const response = await api.delete(`/favorites/${favoriteId}`);
  return response.data;
};

// Food Search API
export const searchFoods = async (query) => {
  const response = await api.get('/food/search', {
    params: { query }
  });
  return response.data;
};

// Export API
export const exportData = async (userId) => {
  const response = await api.get(`/export/${userId}`, {
    responseType: 'blob'
  });
  return response.data;
};

export default api;

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

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

// Feedback API
export const submitFeedback = async (feedbackData) => {
  // Check if running against local server (with file upload support) or serverless (JSON only)
  const isLocalServer = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');

  if (isLocalServer && feedbackData.screenshot) {
    // Use FormData for local server with file upload
    const formData = new FormData();
    formData.append('name', feedbackData.name || 'Anonymous');
    formData.append('email', feedbackData.email || '');
    formData.append('category', feedbackData.category || 'general');
    formData.append('message', feedbackData.message || '');
    formData.append('screenshot', feedbackData.screenshot);

    const response = await axios.post(`${API_BASE_URL}/feedbacks`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } else {
    // Use JSON for serverless deployment (no file upload support)
    const response = await api.post('/feedbacks', {
      name: feedbackData.name || 'Anonymous',
      email: feedbackData.email || '',
      category: feedbackData.category || 'general',
      message: feedbackData.message || ''
    });
    return response.data;
  }
};

export const fetchFeedbacks = async () => {
  const response = await api.get('/feedbacks');
  return response.data;
};

export const deleteFeedback = async (feedbackId) => {
  const response = await api.delete(`/feedbacks/${feedbackId}`);
  return response.data;
};

export default api;

import api from './api';

// User Authentication
export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Admin Authentication
export const adminAuthService = {
  login: async (email, password) => {
    const response = await api.post('/admin/auth/login', { email, password });
    return response.data;
  },

  createAdmin: async (adminData) => {
    const response = await api.post('/admin/users', adminData);
    return response.data;
  },

  getAdminProfile: async () => {
    const response = await api.get('/admin/auth/me');
    return response.data;
  },
};

// Users Management
export const userService = {
  getAllUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  getUserById: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  restoreUser: async (userId) => {
    const response = await api.post(`/admin/users/${userId}/restore`);
    return response.data;
  },
};

// Sessions Management
export const sessionService = {
  getAllSessions: async (params = {}) => {
    const response = await api.get('/sessions', { params });
    return response.data;
  },

  getSessionById: async (sessionId) => {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
  },

  getUserSessions: async (userId) => {
    const response = await api.get(`/sessions?userId=${userId}`);
    return response.data;
  },

  createSession: async (sessionData) => {
    const response = await api.post('/sessions', sessionData);
    return response.data;
  },

  updateSession: async (sessionId, sessionData) => {
    const response = await api.put(`/sessions/${sessionId}`, sessionData);
    return response.data;
  },

  deleteSession: async (sessionId) => {
    const response = await api.delete(`/sessions/${sessionId}`);
    return response.data;
  },

  restoreSession: async (sessionId) => {
    const response = await api.post(`/sessions/${sessionId}/restore`);
    return response.data;
  },
};

// Progress Management
export const progressService = {
  getUserProgress: async (userId) => {
    const response = await api.get(`/progress?userId=${userId}`);
    return response.data;
  },

  updateProgress: async (progressData) => {
    const response = await api.post('/progress', progressData);
    return response.data;
  },
};

// Questions Management
export const questionService = {
  getAllQuestions: async (params = {}) => {
    const response = await api.get('/questions', { params });
    return response.data;
  },

  getQuestionById: async (questionId) => {
    const response = await api.get(`/questions/${questionId}`);
    return response.data;
  },

  createQuestion: async (questionData) => {
    const response = await api.post('/admin/questions', questionData);
    return response.data;
  },

  updateQuestion: async (questionId, questionData) => {
    const response = await api.put(`/admin/questions/${questionId}`, questionData);
    return response.data;
  },

  deleteQuestion: async (questionId) => {
    const response = await api.delete(`/admin/questions/${questionId}`);
    return response.data;
  },
};

// Statistics
export const statsService = {
  getUserStats: async (userId) => {
    const response = await api.get(`/stats?userId=${userId}`);
    return response.data;
  },

  getAdminStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
};

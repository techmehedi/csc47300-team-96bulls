// Frontend API client for Express backend
class BackendAPI {
  constructor() {
    this.baseURL = window.API_URL || 'http://localhost:3000/api';
    this.getAuthToken = async () => {
      // Get token from Supabase session
      if (window.supabaseClient) {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        return session?.access_token || null;
      }
      return null;
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = await this.getAuthToken();
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      // Suppress expected network errors when backend is down
      const errorMessage = error?.message || error?.toString() || '';
      const isNetworkError = errorMessage.includes('Failed to fetch') || 
                            errorMessage.includes('ERR_CONNECTION_REFUSED') ||
                            errorMessage.includes('NetworkError') ||
                            error.name === 'TypeError';
      
      if (isNetworkError) {
        // Mark as handled network error for global error handler
        const networkError = new Error('Network error - backend unavailable');
        networkError.handled = true;
        networkError.isNetworkError = true;
        throw networkError;
      }
      
      // Only log non-network errors
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Sessions
  async getSessions(userId) {
    // Try with auth token first, fallback to userId in query
    const token = await this.getAuthToken();
    if (token) {
      return this.request('/sessions');
    }
    return this.request(`/sessions?userId=${userId}`);
  }

  async getSession(sessionId, userId) {
    const token = await this.getAuthToken();
    if (token) {
      return this.request(`/sessions/${sessionId}`);
    }
    return this.request(`/sessions/${sessionId}?userId=${userId}`);
  }

  async createSession(sessionData) {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData)
    });
  }

  async updateSession(sessionId, updates) {
    return this.request(`/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deleteSession(sessionId, userId) {
    const token = await this.getAuthToken();
    if (token) {
      return this.request(`/sessions/${sessionId}`, {
        method: 'DELETE'
      });
    }
    return this.request(`/sessions/${sessionId}?userId=${userId}`, {
      method: 'DELETE'
    });
  }

  // Progress
  async getProgress(userId) {
    const token = await this.getAuthToken();
    if (token) {
      return this.request('/progress');
    }
    return this.request(`/progress?userId=${userId}`);
  }

  async getProgressByTopic(userId, topic, difficulty) {
    const token = await this.getAuthToken();
    if (token) {
      return this.request(`/progress/${topic}/${difficulty}`);
    }
    return this.request(`/progress/${topic}/${difficulty}?userId=${userId}`);
  }

  async updateProgress(userId, progressData) {
    return this.request('/progress', {
      method: 'POST',
      body: JSON.stringify({
        ...progressData,
        userId
      })
    });
  }

  // Questions
  async getQuestions(topic, difficulty, limit = 10) {
    return this.request(`/questions?topic=${topic}&difficulty=${difficulty}&limit=${limit}`);
  }

  async getQuestion(questionId) {
    return this.request(`/questions/${questionId}`);
  }

  async getTopics() {
    return this.request('/questions/meta/topics');
  }

  // Stats
  async getStats(userId) {
    const token = await this.getAuthToken();
    if (token) {
      return this.request('/stats');
    }
    return this.request(`/stats?userId=${userId}`);
  }

  // Code Execution
  async executeCode(code, language = 'javascript') {
    return this.request('/execute', {
      method: 'POST',
      body: JSON.stringify({
        code: code,
        language: language
      })
    });
  }
}

// Initialize and make available globally
window.BackendAPI = BackendAPI;
window.backendAPI = new BackendAPI();


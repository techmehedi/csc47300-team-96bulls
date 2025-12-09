class BackendAPI {
    constructor() {
        this.baseURL = (typeof window.API_URL === 'string' ? window.API_URL : '').trim();
        // Enable backend only if explicitly enabled via BACKEND_ENABLED
        const explicitlyEnabled = window.BACKEND_ENABLED === true;
        this.available = explicitlyEnabled;
        if (!this.available) {
            console.info('Backend API disabled (no API_URL configured). Using Supabase-only mode.');
        }
        this.getAuthToken = async () => {
            // Get token from Supabase session
            const client = window.supabaseClient;
            if (client) {
                const { data: { session } } = await client.auth.getSession();
                // Access token is typically in the session object
                return session?.access_token || null;
            }
            return null;
        };
        // Probe backend availability asynchronously only if explicitly enabled
        if (this.available) {
            this.pingBackend().catch(() => {
                // Already handled in ping
            });
        }
    }
    async pingBackend() {
        // Try a lightweight health check with short timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1200);
        try {
            const healthUrl = `${this.baseURL}/health`;
            const res = await fetch(healthUrl, { method: 'GET', signal: controller.signal });
            if (!res.ok) {
                throw new Error(`Health check failed: ${res.status}`);
            }
            this.available = true;
        }
        catch (_) {
            // As a fallback, try a cheap endpoint if /health doesn't exist
            try {
                const controller2 = new AbortController();
                const timeout2 = setTimeout(() => controller2.abort(), 1200);
                const res2 = await fetch(`${this.baseURL}/stats`, { method: 'GET', signal: controller2.signal });
                clearTimeout(timeout2);
                this.available = res2.ok;
            }
            catch {
                this.available = false;
            }
            if (!this.available) {
                console.warn('Backend API unavailable. Falling back to Supabase-only mode.');
            }
        }
        finally {
            clearTimeout(timeout);
        }
    }
    async request(endpoint, options = {}) {
        // If we've detected the backend is down, short-circuit without making network calls
        if (!this.available) {
            const networkError = new Error('Network error - backend unavailable');
            networkError.handled = true;
            networkError.isNetworkError = true;
            throw networkError;
        }
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
                const errorData = data;
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            return data;
        }
        catch (error) {
            // Suppress expected network errors when backend is down
            const err = error;
            const errorMessage = err?.message || err?.toString() || '';
            const isNetworkError = errorMessage.includes('Failed to fetch') ||
                errorMessage.includes('ERR_CONNECTION_REFUSED') ||
                errorMessage.includes('NetworkError') ||
                error.name === 'TypeError';
            if (isNetworkError) {
                // Mark backend as unavailable to prevent further attempts
                this.available = false;
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
//# sourceMappingURL=backend-api.js.map
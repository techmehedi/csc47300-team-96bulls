// Frontend API client for Express backend
import type {
  Session,
  SessionCreateData,
  SessionUpdateData,
  Progress,
  ProgressUpdateData,
  Stats,
  Question,
  CodeExecutionResult
} from './types.js';

// Declare global types for window object
// Note: FullSupabaseClient is defined in types.ts
import type { FullSupabaseClient } from './types.js';

declare global {
  interface Window {
    API_URL?: string;
    BACKEND_ENABLED?: boolean;
    supabaseClient?: any;
    BackendAPI: typeof BackendAPI;
    backendAPI: BackendAPI;
  }
}

interface RequestOptions extends RequestInit {
  headers?: HeadersInit;
}

interface NetworkError extends Error {
  handled?: boolean;
  isNetworkError?: boolean;
}

class BackendAPI {
  private baseURL: string;
  private getAuthToken: () => Promise<string | null>;
  private available: boolean;

  constructor() {
    this.baseURL = (typeof window.API_URL === 'string' ? window.API_URL : '').trim();
    // Enable backend only if explicitly enabled via BACKEND_ENABLED
    const explicitlyEnabled = window.BACKEND_ENABLED === true;
    this.available = explicitlyEnabled;
    if (!this.available) {
      console.info('Backend API disabled (no API_URL configured). Using Supabase-only mode.');
    }
    this.getAuthToken = async (): Promise<string | null> => {
      // Get token from Supabase session
      const client = window.supabaseClient as FullSupabaseClient | undefined;
      if (client) {
        const { data: { session } } = await client.auth.getSession();
        // Access token is typically in the session object
        return (session as any)?.access_token || null;
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

  private async pingBackend(): Promise<void> {
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
    } catch (_) {
      // As a fallback, try a cheap endpoint if /health doesn't exist
      try {
        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), 1200);
        const res2 = await fetch(`${this.baseURL}/stats`, { method: 'GET', signal: controller2.signal });
        clearTimeout(timeout2);
        this.available = res2.ok;
      } catch {
        this.available = false;
      }
      if (!this.available) {
        console.warn('Backend API unavailable. Falling back to Supabase-only mode.');
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    // If we've detected the backend is down, short-circuit without making network calls
    if (!this.available) {
      const networkError: NetworkError = new Error('Network error - backend unavailable');
      networkError.handled = true;
      networkError.isNetworkError = true;
      throw networkError;
    }
    const url = `${this.baseURL}${endpoint}`;
    const token = await this.getAuthToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json() as T | { error?: string };
      
      if (!response.ok) {
        const errorData = data as { error?: string };
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return data as T;
    } catch (error) {
      // Suppress expected network errors when backend is down
      const err = error as Error;
      const errorMessage = err?.message || err?.toString() || '';
      const isNetworkError = errorMessage.includes('Failed to fetch') || 
                            errorMessage.includes('ERR_CONNECTION_REFUSED') ||
                            errorMessage.includes('NetworkError') ||
                            (error as TypeError).name === 'TypeError';
      
      if (isNetworkError) {
        // Mark backend as unavailable to prevent further attempts
        this.available = false;
        // Mark as handled network error for global error handler
        const networkError: NetworkError = new Error('Network error - backend unavailable');
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
  async getSessions(userId: string): Promise<Session[]> {
    // Try with auth token first, fallback to userId in query
    const token = await this.getAuthToken();
    if (token) {
      return this.request<Session[]>('/sessions');
    }
    return this.request<Session[]>(`/sessions?userId=${userId}`);
  }

  async getSession(sessionId: string, userId: string): Promise<Session> {
    const token = await this.getAuthToken();
    if (token) {
      return this.request<Session>(`/sessions/${sessionId}`);
    }
    return this.request<Session>(`/sessions/${sessionId}?userId=${userId}`);
  }

  async createSession(sessionData: SessionCreateData): Promise<Session> {
    return this.request<Session>('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData)
    });
  }

  async updateSession(sessionId: string, updates: SessionUpdateData): Promise<Session> {
    return this.request<Session>(`/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deleteSession(sessionId: string, userId: string): Promise<void> {
    const token = await this.getAuthToken();
    if (token) {
      return this.request<void>(`/sessions/${sessionId}`, {
        method: 'DELETE'
      });
    }
    return this.request<void>(`/sessions/${sessionId}?userId=${userId}`, {
      method: 'DELETE'
    });
  }

  // Progress
  async getProgress(userId: string): Promise<Progress[]> {
    const token = await this.getAuthToken();
    if (token) {
      return this.request<Progress[]>('/progress');
    }
    return this.request<Progress[]>(`/progress?userId=${userId}`);
  }

  async getProgressByTopic(userId: string, topic: string, difficulty: string): Promise<Progress> {
    const token = await this.getAuthToken();
    if (token) {
      return this.request<Progress>(`/progress/${topic}/${difficulty}`);
    }
    return this.request<Progress>(`/progress/${topic}/${difficulty}?userId=${userId}`);
  }

  async updateProgress(userId: string, progressData: ProgressUpdateData): Promise<Progress> {
    return this.request<Progress>('/progress', {
      method: 'POST',
      body: JSON.stringify({
        ...progressData,
        userId
      })
    });
  }

  // Questions
  async getQuestions(topic: string, difficulty: string, limit: number = 10): Promise<Question[]> {
    return this.request<Question[]>(`/questions?topic=${topic}&difficulty=${difficulty}&limit=${limit}`);
  }

  async getQuestion(questionId: string): Promise<Question> {
    return this.request<Question>(`/questions/${questionId}`);
  }

  async getTopics(): Promise<string[]> {
    return this.request<string[]>('/questions/meta/topics');
  }

  // Stats
  async getStats(userId: string): Promise<Stats> {
    const token = await this.getAuthToken();
    if (token) {
      return this.request<Stats>('/stats');
    }
    return this.request<Stats>(`/stats?userId=${userId}`);
  }

  // Code Execution
  async executeCode(code: string, language: string = 'javascript'): Promise<CodeExecutionResult> {
    return this.request<CodeExecutionResult>('/execute', {
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


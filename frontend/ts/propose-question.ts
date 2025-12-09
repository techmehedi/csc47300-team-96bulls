// Question proposal form

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface ProposalFormData {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  test_cases: TestCase[];
  constraints?: string[];
  examples?: any[];
  hints?: string[];
  solution?: string | null;
  time_complexity?: string | null;
  space_complexity?: string | null;
  tags?: string[];
}

// Window interface extensions are declared in types.ts

// Global functions for test case management
(window as any).addTestCase = function(): void {
  const container = document.getElementById('testCasesContainer');
  if (!container) return;
  
  const testCaseDiv = document.createElement('div');
  testCaseDiv.className = 'test-case-item';
  testCaseDiv.innerHTML = `
    <div class="test-case-input">
      <label>Input</label>
      <input type="text" class="test-input" placeholder="e.g., nums = [2,7,11,15], target = 9" required>
    </div>
    <div class="test-case-output">
      <label>Expected Output</label>
      <input type="text" class="test-output" placeholder="e.g., [0,1]" required>
    </div>
    <button type="button" class="btn-remove-test" onclick="removeTestCase(this)">
      <i class="fas fa-times"></i>
    </button>
  `;
  container.appendChild(testCaseDiv);
};

(window as any).removeTestCase = function(btn: HTMLElement): void {
  const container = document.getElementById('testCasesContainer');
  if (!container) return;
  
  if (container.children.length > 1) {
    const item = btn.closest('.test-case-item');
    if (item) {
      item.remove();
    }
  } else {
    alert('At least one test case is required');
  }
};

class ProposalForm {
  constructor() {
    this.init();
  }

  async init(): Promise<void> {
    // Show loading indicator
    const loadingEl = document.getElementById('authLoading');
    const formEl = document.getElementById('proposalForm');
    const authMsg = document.getElementById('authMessage');
    if (loadingEl) (loadingEl as HTMLElement).style.display = 'block';
    if (formEl) (formEl as HTMLElement).style.display = 'none';
    if (authMsg) (authMsg as HTMLElement).style.display = 'none';
    
    // Setup event listeners first (so form works even during auth check)
    this.setupEventListeners();
    
    // Check authentication (but don't block if localStorage has user data)
    const isAuthenticated = await this.checkAuthentication();
    
    // Hide loading, show form if authenticated
    if (loadingEl) (loadingEl as HTMLElement).style.display = 'none';
    
    if (!isAuthenticated) {
      // Show message and keep page (no forced redirect)
      if (authMsg) (authMsg as HTMLElement).style.display = 'block';
      if (formEl) (formEl as HTMLElement).style.display = 'none';
      return;
    } else {
      // Show form if authenticated
      if (formEl) {
        (formEl as HTMLElement).style.display = 'block';
      }
    }
  }

  async checkAuthentication(): Promise<boolean> {
    // 1) Fast path: localStorage
    const userData = localStorage.getItem('ai_interviewer_user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user && (user.id || user.email)) {
          console.log('User authenticated via localStorage:', user.email || user.id);
          return true;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // 2) Wait a bit for Supabase to initialize
    let waitCount = 0;
    while (!window.supabaseClient && waitCount < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      waitCount++;
    }

    // 3) Check Supabase session directly (faster than getSupabaseUser)
    if (window.supabaseClient) {
      try {
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        if (error) {
          console.error('Session error:', error);
        }
        if (session?.user) {
          console.log('User authenticated via Supabase session');
          const user = session.user;
          const meta = user.user_metadata || {};
          const currentUser = {
            id: user.id,
            email: user.email,
            username: meta.username || (user.email ? user.email.split('@')[0] : ''),
            firstName: meta.firstName || '',
            lastName: meta.lastName || ''
          };
          localStorage.setItem('ai_interviewer_user', JSON.stringify(currentUser));
          return true;
        }
      } catch (error) {
        console.error('Error getting Supabase session:', error);
      }
    }

    // 4) If we still have user data in localStorage, allow access
    if (userData) {
      console.log('Allowing access based on localStorage data');
      return true;
    }

    // 5) No auth
    console.warn('No authentication found');
    return false;
  }

  async getAuthToken(): Promise<string | null> {
    // Try to get token from Supabase
    if (window.supabaseClient) {
      try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if ((session as any)?.access_token) {
          return (session as any).access_token;
        }
      } catch (error) {
        console.error('Error getting Supabase session:', error);
      }
    }
    
    // Fallback: try to get from localStorage user data
    const userData = localStorage.getItem('ai_interviewer_user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.token) {
          return user.token;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    // Last resort: try to get session token from Supabase again
    if (window.supabaseClient) {
      try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        return (session as any)?.access_token || null;
      } catch (error) {
        console.error('Error getting session token:', error);
      }
    }
    
    return null;
  }

  setupEventListeners(): void {
    const form = document.getElementById('proposalForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }
  }

  async handleSubmit(): Promise<void> {
    const form = document.getElementById('proposalForm') as HTMLFormElement;
    if (!form) return;
    
    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    if (!submitBtn) return;
    
    const originalText = submitBtn.innerHTML;
    const authMsg = document.getElementById('authMessage');

    // Validate form
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Collect test cases
    const testCases: TestCase[] = [];
    const testCaseItems = document.querySelectorAll('.test-case-item');
    testCaseItems.forEach(item => {
      const inputEl = item.querySelector('.test-input') as HTMLInputElement;
      const outputEl = item.querySelector('.test-output') as HTMLInputElement;
      if (inputEl && outputEl) {
        const input = inputEl.value.trim();
        const output = outputEl.value.trim();
        if (input && output) {
          testCases.push({
            input,
            expectedOutput: output,
            isHidden: false
          });
        }
      }
    });

    if (testCases.length === 0) {
      alert('Please add at least one test case');
      return;
    }

    // Collect form data
    const formData: ProposalFormData = {
      title: (document.getElementById('title') as HTMLInputElement).value.trim(),
      description: (document.getElementById('description') as HTMLTextAreaElement).value.trim(),
      difficulty: (document.getElementById('difficulty') as HTMLSelectElement).value as 'easy' | 'medium' | 'hard',
      topic: (document.getElementById('topic') as HTMLInputElement).value,
      test_cases: testCases,
      constraints: this.parseConstraints((document.getElementById('constraints') as HTMLTextAreaElement).value),
      examples: this.parseExamples((document.getElementById('examples') as HTMLTextAreaElement).value),
      hints: this.parseHints((document.getElementById('hints') as HTMLTextAreaElement).value),
      solution: (document.getElementById('solution') as HTMLTextAreaElement).value.trim() || null,
      time_complexity: (document.getElementById('timeComplexity') as HTMLInputElement).value.trim() || null,
      space_complexity: (document.getElementById('spaceComplexity') as HTMLInputElement).value.trim() || null,
      tags: this.parseTags((document.getElementById('tags') as HTMLInputElement).value)
    };

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

    try {
      // Wait a bit for Supabase to be ready if needed
      let token = await this.getAuthToken();
      
      // If no token, wait a bit more and try again
      if (!token) {
        await new Promise(resolve => setTimeout(resolve, 500));
        token = await this.getAuthToken();
      }
      
      if (!token) {
        // Try one more time with a fresh session check
        if (window.supabaseClient) {
          const { data: { session } } = await window.supabaseClient.auth.getSession();
          token = session?.access_token || null;
        }
      }
      
      if (!token) {
        if (authMsg) {
          (authMsg as HTMLElement).style.display = 'block';
          authMsg.textContent = 'Please log in to propose a question.';
        }
        throw new Error('You are not logged in. Please log in and try again.');
      }

      const apiBase = (window.API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
      const response = await fetch(`${apiBase}/proposals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 401) {
          throw new Error('Your session has expired. Please log in again.');
        }
        throw new Error(error.error || 'Failed to submit proposal');
      }

      const result = await response.json();
      
      alert('Proposal submitted successfully! It will be reviewed by an admin.');
      form.reset();
      
      // Reset test cases to one
      const container = document.getElementById('testCasesContainer');
      if (container) {
        container.innerHTML = `
          <div class="test-case-item">
            <div class="test-case-input">
              <label>Input</label>
              <input type="text" class="test-input" placeholder="e.g., nums = [2,7,11,15], target = 9">
            </div>
            <div class="test-case-output">
              <label>Expected Output</label>
              <input type="text" class="test-output" placeholder="e.g., [0,1]">
            </div>
            <button type="button" class="btn-remove-test" onclick="removeTestCase(this)">
              <i class="fas fa-times"></i>
            </button>
          </div>
        `;
      }

      // Redirect to dashboard after a delay
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);
    } catch (error: any) {
      console.error('Error submitting proposal:', error);
      alert('Error: ' + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }

  parseConstraints(text: string): string[] {
    if (!text.trim()) return [];
    return text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  parseExamples(text: string): any[] {
    if (!text.trim()) return [];
    try {
      const examples = JSON.parse(text);
      return Array.isArray(examples) ? examples : [];
    } catch (error) {
      // If not valid JSON, try to parse as simple format
      return [];
    }
  }

  parseHints(text: string): string[] {
    if (!text.trim()) return [];
    return text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  parseTags(text: string): string[] {
    if (!text.trim()) return [];
    return text.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ProposalForm();
  });
} else {
  new ProposalForm();
}


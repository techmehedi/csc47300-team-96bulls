"use strict";
// Question proposal form
// Window interface extensions are declared in types.ts
// Global functions for test case management
window.addTestCase = function () {
    const container = document.getElementById('testCasesContainer');
    if (!container)
        return;
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
window.removeTestCase = function (btn) {
    const container = document.getElementById('testCasesContainer');
    if (!container)
        return;
    if (container.children.length > 1) {
        const item = btn.closest('.test-case-item');
        if (item) {
            item.remove();
        }
    }
    else {
        alert('At least one test case is required');
    }
};
class ProposalForm {
    constructor() {
        this.init();
    }
    async init() {
        // Show loading indicator
        const loadingEl = document.getElementById('authLoading');
        const formEl = document.getElementById('proposalForm');
        const authMsg = document.getElementById('authMessage');
        if (loadingEl)
            loadingEl.style.display = 'block';
        if (formEl)
            formEl.style.display = 'none';
        if (authMsg)
            authMsg.style.display = 'none';
        // Setup event listeners first (so form works even during auth check)
        this.setupEventListeners();
        // Check authentication (but don't block if localStorage has user data)
        const isAuthenticated = await this.checkAuthentication();
        // Hide loading, show form if authenticated
        if (loadingEl)
            loadingEl.style.display = 'none';
        if (!isAuthenticated) {
            // Show message and keep page (no forced redirect)
            if (authMsg)
                authMsg.style.display = 'block';
            if (formEl)
                formEl.style.display = 'none';
            return;
        }
        else {
            // Show form if authenticated
            if (formEl) {
                formEl.style.display = 'block';
            }
        }
    }
    async checkAuthentication() {
        // 1) Fast path: localStorage
        const userData = localStorage.getItem('ai_interviewer_user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                if (user && (user.id || user.email)) {
                    console.log('User authenticated via localStorage:', user.email || user.id);
                    return true;
                }
            }
            catch (error) {
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
            }
            catch (error) {
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
    async getAuthToken() {
        // Try to get token from Supabase
        if (window.supabaseClient) {
            try {
                const { data: { session } } = await window.supabaseClient.auth.getSession();
                if (session?.access_token) {
                    return session.access_token;
                }
            }
            catch (error) {
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
            }
            catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
        // Last resort: try to get session token from Supabase again
        if (window.supabaseClient) {
            try {
                const { data: { session } } = await window.supabaseClient.auth.getSession();
                return session?.access_token || null;
            }
            catch (error) {
                console.error('Error getting session token:', error);
            }
        }
        return null;
    }
    setupEventListeners() {
        const form = document.getElementById('proposalForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        }
    }
    async handleSubmit() {
        const form = document.getElementById('proposalForm');
        if (!form)
            return;
        const submitBtn = form.querySelector('button[type="submit"]');
        if (!submitBtn)
            return;
        const originalText = submitBtn.innerHTML;
        const authMsg = document.getElementById('authMessage');
        // Validate form
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        // Collect test cases
        const testCases = [];
        const testCaseItems = document.querySelectorAll('.test-case-item');
        testCaseItems.forEach(item => {
            const inputEl = item.querySelector('.test-input');
            const outputEl = item.querySelector('.test-output');
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
        const formData = {
            title: document.getElementById('title').value.trim(),
            description: document.getElementById('description').value.trim(),
            difficulty: document.getElementById('difficulty').value,
            topic: document.getElementById('topic').value,
            test_cases: testCases,
            constraints: this.parseConstraints(document.getElementById('constraints').value),
            examples: this.parseExamples(document.getElementById('examples').value),
            hints: this.parseHints(document.getElementById('hints').value),
            solution: document.getElementById('solution').value.trim() || null,
            time_complexity: document.getElementById('timeComplexity').value.trim() || null,
            space_complexity: document.getElementById('spaceComplexity').value.trim() || null,
            tags: this.parseTags(document.getElementById('tags').value)
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
                    authMsg.style.display = 'block';
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
        }
        catch (error) {
            console.error('Error submitting proposal:', error);
            alert('Error: ' + error.message);
        }
        finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
    parseConstraints(text) {
        if (!text.trim())
            return [];
        return text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
    }
    parseExamples(text) {
        if (!text.trim())
            return [];
        try {
            const examples = JSON.parse(text);
            return Array.isArray(examples) ? examples : [];
        }
        catch (error) {
            // If not valid JSON, try to parse as simple format
            return [];
        }
    }
    parseHints(text) {
        if (!text.trim())
            return [];
        return text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
    }
    parseTags(text) {
        if (!text.trim())
            return [];
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
}
else {
    new ProposalForm();
}
//# sourceMappingURL=propose-question.js.map
"use strict";
// Admin Panel for reviewing question proposals
// Window interface extensions are declared in types.ts
class AdminPanel {
    constructor() {
        this.currentStatus = 'pending';
        this.proposals = [];
        this.currentProposal = null;
        this.isAdmin = false;
        this.init();
    }
    async init() {
        // No authentication required - anyone can access the admin panel
        this.setupEventListeners();
        await this.loadProposals('pending');
    }
    async checkAdminAccess() {
        try {
            const token = await this.getAuthToken();
            if (!token) {
                console.log('No auth token found');
                this.isAdmin = false;
                return;
            }
            const apiBase = (window.API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
            const response = await fetch(`${apiBase}/proposals/check/admin`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Admin check response:', data);
                this.isAdmin = data.isAdmin;
                // Log debug information
                if (data.debug) {
                    console.log('Debug info:', data.debug);
                    if (!data.isAdmin) {
                        console.warn('User is not admin. Debug info:', {
                            reqUserRole: data.debug.reqUserRole,
                            databaseRole: data.debug.databaseRole,
                            userMetadata: data.debug.userMetadata
                        });
                        // If user has admin in metadata but not in database, suggest fix
                        if (data.debug.userMetadata?.accountType === 'admin' && !data.debug.databaseRole) {
                            console.error('⚠️ User has admin in metadata but no role in database!');
                            console.error('Solution: Go to /debug-account.html and click "Fix My Account (Set to Admin)"');
                            alert('Your account type is set to admin in your profile, but not in the database.\n\nPlease go to /debug-account.html and click "Fix My Account (Set to Admin)", then sign out and sign back in.');
                        }
                    }
                }
                // If not admin, also check localStorage for accountType
                if (!this.isAdmin) {
                    const userData = localStorage.getItem('ai_interviewer_user');
                    if (userData) {
                        const user = JSON.parse(userData);
                        console.log('User data from localStorage:', user);
                        if (user.accountType === 'admin') {
                            console.warn('User has admin accountType in localStorage but backend says not admin.');
                            console.warn('This usually means the role was not created in the database during signup.');
                            console.warn('Solution: Go to /debug-account.html and click "Fix My Account (Set to Admin)"');
                        }
                    }
                }
            }
            else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Admin check failed:', response.status, errorData);
                this.isAdmin = false;
            }
        }
        catch (error) {
            console.error('Error checking admin access:', error);
            this.isAdmin = false;
        }
    }
    async getAuthToken() {
        // No authentication required for admin panel, but return token if available
        // This method is kept for compatibility but doesn't require auth
        try {
            if (window.supabaseClient) {
                const { data: { session } } = await window.supabaseClient.auth.getSession();
                return session?.access_token || null;
            }
        } catch (error) {
            // Silently fail - no auth required
            console.log('No Supabase session available (not required for admin panel)');
        }
        // Fallback to localStorage
        const userData = localStorage.getItem('ai_interviewer_user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                return user.token || null;
            } catch (e) {
                // Ignore parse errors
            }
        }
        return null;
    }
    setupEventListeners() {
        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget;
                const status = target.dataset.status;
                if (status) {
                    this.setActiveFilter(status);
                    this.loadProposals(status);
                }
            });
        });
        // Modal close
        const closeModal = document.getElementById('closeModal');
        const cancelReview = document.getElementById('cancelReview');
        const modal = document.getElementById('reviewModal');
        [closeModal, cancelReview].forEach(btn => {
            btn?.addEventListener('click', () => {
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });
        // Approve/Reject buttons
        document.getElementById('approveBtn')?.addEventListener('click', () => {
            this.reviewProposal('approved');
        });
        document.getElementById('rejectBtn')?.addEventListener('click', () => {
            this.reviewProposal('rejected');
        });
        // Close modal on outside click
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    setActiveFilter(status) {
        this.currentStatus = status;
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            const element = btn;
            if (element.dataset.status === status) {
                element.classList.add('active');
            }
            else {
                element.classList.remove('active');
            }
        });
        // Update title
        const titles = {
            pending: 'Pending Posts Review',
            approved: 'Approved Posts',
            rejected: 'Rejected Posts'
        };
        const titleElement = document.getElementById('contentTitle');
        if (titleElement) {
            titleElement.textContent = titles[status] || 'Posts Review';
        }
    }
    async loadProposals(status) {
        const container = document.getElementById('proposalsContainer');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const emptyState = document.getElementById('emptyState');
        if (loadingSpinner)
            loadingSpinner.style.display = 'block';
        if (emptyState)
            emptyState.style.display = 'none';
        try {
            const apiBase = (window.API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
            const url = `${apiBase}/proposals${status ? `?status=${status}` : ''}`;
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMsg = errorData.error || 'Failed to load proposals';
                console.error('Error loading proposals:', response.status, errorData);
                throw new Error(errorMsg);
            }
            const proposals = await response.json();
            this.proposals = proposals;
            if (loadingSpinner)
                loadingSpinner.style.display = 'none';
            if (proposals.length === 0) {
                if (emptyState)
                    emptyState.style.display = 'block';
                if (container) {
                    container.innerHTML = '';
                    container.appendChild(emptyState);
                }
            }
            else {
                this.renderProposals(proposals);
            }
        }
        catch (error) {
            console.error('Error loading proposals:', error);
            if (loadingSpinner)
                loadingSpinner.style.display = 'none';
            this.showError('Failed to load proposals. Please try again.');
        }
    }
    renderProposals(proposals) {
        const container = document.getElementById('proposalsContainer');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const emptyState = document.getElementById('emptyState');
        if (loadingSpinner)
            loadingSpinner.style.display = 'none';
        if (emptyState)
            emptyState.style.display = 'none';
        if (!container)
            return;
        // Clear existing proposals (except loading/empty states)
        const existingCards = container.querySelectorAll('.proposal-card');
        existingCards.forEach(card => card.remove());
        proposals.forEach(proposal => {
            const card = this.createProposalCard(proposal);
            container.appendChild(card);
        });
    }
    createProposalCard(proposal) {
        const card = document.createElement('div');
        card.className = 'proposal-card';
        const userEmail = proposal.user?.email || 'Unknown User';
        const username = userEmail.split('@')[0] || 'user';
        const timeAgo = this.getTimeAgo(proposal.created_at);
        const category = proposal.topic || 'Coding Question';
        const contentPreview = proposal.description.substring(0, 150) + (proposal.description.length > 150 ? '...' : '');
        card.innerHTML = `
      <div class="proposal-header">
        <div>
          <h3 class="proposal-title">${this.escapeHtml(proposal.title)}</h3>
        </div>
      </div>
      <div class="proposal-meta">
        <span class="proposal-author">By: ${this.escapeHtml(username)}</span>
        <span class="proposal-category">${this.escapeHtml(category)}</span>
        <span class="proposal-timestamp">${timeAgo}</span>
      </div>
      <div class="proposal-content">
        ${this.escapeHtml(contentPreview)}
      </div>
      <div class="proposal-actions">
          <button class="btn-primary view-details-btn" data-id="${proposal.id}">
            View Details
          </button>
      </div>
    `;
        // Add click handlers
        const viewBtn = card.querySelector('.view-details-btn');
        viewBtn?.addEventListener('click', () => {
            this.showProposalModal(proposal);
            this.currentProposal = proposal;
        });

        // Make whole card clickable too (optional, but good UX)
        card.addEventListener('click', (e) => {
            // detailed view if not clicking a button
            if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
                this.showProposalModal(proposal);
                this.currentProposal = proposal;
            }
        });

        return card;
    }
    showProposalModal(proposal) {
        const modal = document.getElementById('reviewModal');
        const modalBody = document.getElementById('modalBody');
        if (!modalBody)
            return;
        modalBody.innerHTML = `
      <div class="proposal-details">
        <div class="detail-section">
          <h4>Title</h4>
          <p>${this.escapeHtml(proposal.title)}</p>
        </div>
        <div class="detail-section">
          <h4>Description</h4>
          <p>${this.escapeHtml(proposal.description)}</p>
        </div>
        <div class="detail-section">
          <h4>Difficulty</h4>
          <p>${this.escapeHtml(proposal.difficulty)}</p>
        </div>
        <div class="detail-section">
          <h4>Topic</h4>
          <p>${this.escapeHtml(proposal.topic)}</p>
        </div>
        ${proposal.constraints && proposal.constraints.length > 0 ? `
        <div class="detail-section">
          <h4>Constraints</h4>
          <ul>
            ${proposal.constraints.map(c => `<li>${this.escapeHtml(c)}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
        ${proposal.test_cases && proposal.test_cases.length > 0 ? `
        <div class="detail-section">
          <h4>Test Cases</h4>
          <pre>${JSON.stringify(proposal.test_cases, null, 2)}</pre>
        </div>
        ` : ''}
        ${proposal.examples && proposal.examples.length > 0 ? `
        <div class="detail-section">
          <h4>Examples</h4>
          <pre>${JSON.stringify(proposal.examples, null, 2)}</pre>
        </div>
        ` : ''}
        ${proposal.solution ? `
        <div class="detail-section">
          <h4>Solution</h4>
          <pre>${this.escapeHtml(proposal.solution)}</pre>
        </div>
        ` : ''}
        ${proposal.tags && proposal.tags.length > 0 ? `
        <div class="detail-section">
          <h4>Tags</h4>
          <div class="detail-tags">
            ${proposal.tags.map(tag => `<span class="detail-tag">${this.escapeHtml(tag)}</span>`).join('')}
          </div>
        </div>
        ` : ''}
      </div>
    `;

        if (modal) {
            modal.style.display = 'flex';
        }
    }
    async reviewProposal(status) {
        if (!this.currentProposal)
            return;
        try {
            const apiBase = (window.API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
            const response = await fetch(`${apiBase}/proposals/${this.currentProposal.id}/review`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to review proposal');
            }
            // Close modal
            const modal = document.getElementById('reviewModal');
            if (modal) {
                modal.style.display = 'none';
            }
            // Reload proposals
            await this.loadProposals(this.currentStatus);
            this.showSuccess(`Proposal ${status} successfully!`);
        }
        catch (error) {
            console.error('Error reviewing proposal:', error);
            this.showError(error.message || 'Failed to review proposal');
        }
    }
    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 1)
            return 'Just now';
        if (diffMins < 60)
            return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24)
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    showError(message) {
        console.error('AdminPanel Error:', message);
        // Don't show alert for "Access denied" - it's likely from old cached code
        if (!message.includes('Access denied')) {
            alert('Error: ' + message);
        }
        else {
            console.warn('Ignoring cached "Access denied" error. Please hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)');
        }
    }
    showSuccess(message) {
        alert('Success: ' + message);
    }
}
// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new AdminPanel();
    });
}
else {
    new AdminPanel();
}
//# sourceMappingURL=admin.js.map
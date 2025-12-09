// Admin Panel for reviewing question proposals

interface Proposal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  test_cases: Array<{ input: string; expectedOutput: string; isHidden: boolean }>;
  constraints?: string[];
  examples?: any[];
  hints?: string[];
  solution?: string;
  time_complexity?: string;
  space_complexity?: string;
  tags?: string[];
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at?: string;
  user?: {
    email?: string;
    raw_user_meta_data?: any;
  };
}

interface AdminCheckResponse {
  isAdmin: boolean;
  debug?: {
    userId: string;
    reqUserRole?: string;
    databaseRole?: { account_type?: string; role?: string };
    userMetadata?: any;
  };
}

// Window interface extensions are declared in types.ts

class AdminPanel {
  private currentStatus: string = 'pending';
  private proposals: Proposal[] = [];
  private currentProposal: Proposal | null = null;
  private isAdmin: boolean = false;

  constructor() {
    this.init();
  }

  async init(): Promise<void> {
  }

  async checkAdminAccess(): Promise<void> {
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
        const data: AdminCheckResponse = await response.json();
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
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Admin check failed:', response.status, errorData);
        this.isAdmin = false;
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      this.isAdmin = false;
    }
  }

  async getAuthToken(): Promise<string | null> {
    // Try to get token from Supabase
    if (window.supabaseClient) {
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      return (session as any)?.access_token || null;
    }
    
    // Fallback to localStorage
    const userData = localStorage.getItem('ai_interviewer_user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.token || null;
    }
    
    return null;
  }

  setupEventListeners(): void {
    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
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
          (modal as HTMLElement).style.display = 'none';
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
        (modal as HTMLElement).style.display = 'none';
      }
    });
  }

  setActiveFilter(status: string): void {
    this.currentStatus = status;
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      const element = btn as HTMLElement;
      if (element.dataset.status === status) {
        element.classList.add('active');
      } else {
        element.classList.remove('active');
      }
    });

    // Update title
    const titles: Record<string, string> = {
      pending: 'Pending Posts Review',
      approved: 'Approved Posts',
      rejected: 'Rejected Posts'
    };
    const titleElement = document.getElementById('contentTitle');
    if (titleElement) {
      titleElement.textContent = titles[status] || 'Posts Review';
    }
  }

  async loadProposals(status?: string): Promise<void> {
    const container = document.getElementById('proposalsContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const emptyState = document.getElementById('emptyState');

    if (loadingSpinner) loadingSpinner.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';

    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const apiBase = (window.API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
      const url = `${apiBase}/proposals${status ? `?status=${status}` : ''}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || 'Failed to load proposals';
        console.error('Error loading proposals:', response.status, errorData);
        throw new Error(errorMsg);
      }

      const proposals: Proposal[] = await response.json();
      this.proposals = proposals;

      if (loadingSpinner) loadingSpinner.style.display = 'none';

      if (proposals.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (container) {
          container.innerHTML = '';
          container.appendChild(emptyState!);
        }
      } else {
        this.renderProposals(proposals);
      }
    } catch (error) {
      console.error('Error loading proposals:', error);
      if (loadingSpinner) loadingSpinner.style.display = 'none';
      this.showError('Failed to load proposals. Please try again.');
    }
  }

  renderProposals(proposals: Proposal[]): void {
    const container = document.getElementById('proposalsContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const emptyState = document.getElementById('emptyState');

    if (loadingSpinner) loadingSpinner.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';

    if (!container) return;

    // Clear existing proposals (except loading/empty states)
    const existingCards = container.querySelectorAll('.proposal-card');
    existingCards.forEach(card => card.remove());

    proposals.forEach(proposal => {
      const card = this.createProposalCard(proposal);
      container.appendChild(card);
    });
  }

  createProposalCard(proposal: Proposal): HTMLElement {
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
        <button class="btn-approve" data-id="${proposal.id}">
          <i class="fas fa-check"></i> Approve
        </button>
        <button class="btn-reject" data-id="${proposal.id}">
          <i class="fas fa-times"></i> Reject
        </button>
      </div>
    `;

    // Add click handlers
    const approveBtn = card.querySelector('.btn-approve');
    const rejectBtn = card.querySelector('.btn-reject');

    approveBtn?.addEventListener('click', () => {
      this.showProposalModal(proposal);
      this.currentProposal = proposal;
    });

    rejectBtn?.addEventListener('click', () => {
      this.showProposalModal(proposal);
      this.currentProposal = proposal;
    });

    return card;
  }

  showProposalModal(proposal: Proposal): void {
    const modal = document.getElementById('reviewModal');
    const modalBody = document.getElementById('modalBody');

    if (!modalBody) return;

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
      (modal as HTMLElement).style.display = 'flex';
    }
  }

  async reviewProposal(status: 'approved' | 'rejected'): Promise<void> {
    if (!this.currentProposal) return;

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
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || errorData.details || 'Failed to update proposal';
        console.error('Backend error:', response.status, errorData);
        throw new Error(errorMsg);
      }

      // Close modal
      const modal = document.getElementById('reviewModal');
      if (modal) {
        (modal as HTMLElement).style.display = 'none';
      }
      
      // Reload proposals
      await this.loadProposals(this.currentStatus);
      
      this.showSuccess(`Proposal ${status} successfully!`);
    } catch (error: any) {
      console.error('Error reviewing proposal:', error);
      this.showError(error.message || 'Failed to review proposal');
    }
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showError(message: string): void {
    console.error('AdminPanel Error:', message);
    // Don't show alert for "Access denied" - it's likely from old cached code
    if (!message.includes('Access denied')) {
      alert('Error: ' + message);
    } else {
      console.warn('Ignoring cached "Access denied" error. Please hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)');
    }
  }

  showSuccess(message: string): void {
    alert('Success: ' + message);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AdminPanel();
  });
} else {
  new AdminPanel();
}


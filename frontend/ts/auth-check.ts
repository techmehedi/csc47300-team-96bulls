// Global authentication check - runs on all pages to maintain session
import type { FullSupabaseClient, User } from './types.js';

interface CurrentUser {
  id: string;
  email?: string;
  username: string;
  firstName: string;
  lastName: string;
}

(async function(): Promise<void> {
  let authStateListener: { data: { subscription: any } } | null = null;

  // Helper function to add logout button
  function addLogoutButton(profileLink: HTMLElement): void {
    // Check if logout button already exists
    if (profileLink.parentElement?.querySelector('.logout-btn')) {
      return;
    }

    // Create logout button
    const logoutBtn = document.createElement('a');
    logoutBtn.className = 'logout-btn';
    logoutBtn.href = '#';
    logoutBtn.innerHTML = '<i class="fa-solid fa-sign-out-alt"></i> Logout';
    logoutBtn.addEventListener('click', async (e: Event) => {
      e.preventDefault();
      try {
        // Sign out from Supabase if available
        const client = window.supabaseClient as FullSupabaseClient | undefined;
        if (client) {
          await client.auth.signOut();
        }
        // Clear local storage
        localStorage.removeItem('ai_interviewer_user');
        localStorage.removeItem('ai_interviewer_remember');
        // Redirect to home page
        window.location.href = 'index.html';
      } catch (error) {
        console.error('Logout error:', error);
        // Still redirect even if there's an error
        localStorage.removeItem('ai_interviewer_user');
        localStorage.removeItem('ai_interviewer_remember');
        window.location.href = 'index.html';
      }
    });

    // Insert logout button after profile link
    profileLink.parentElement?.insertBefore(logoutBtn, profileLink.nextSibling);
  }

  async function updateAuthStatus(): Promise<void> {
    // Wait for Supabase client to be available (up to 5 seconds)
    let waitCount = 0;
    while (!window.supabaseClient && waitCount < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      waitCount++;
    }

    if (!window.supabaseClient) {
      // If Supabase not available, check localStorage as fallback
      const userData = localStorage.getItem('ai_interviewer_user');
      if (userData) {
        try {
          const user = JSON.parse(userData) as CurrentUser;
          const loginLinks = document.querySelectorAll<HTMLElement>('.login-link');
          loginLinks.forEach(link => {
            link.innerHTML = `<i class="fa-regular fa-user"></i> ${user.firstName || 'Profile'}`;
            link.setAttribute('href', 'dashboard.html');
            
            // Add logout button
            addLogoutButton(link);
          });
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
      return;
    }

    try {
      // Check Supabase session
      const client = window.supabaseClient as FullSupabaseClient | undefined;
      if (!client) return;
      
      const { data: { session }, error } = await client.auth.getSession();
      
      if (error) {
        console.error('Auth session error:', error);
        return;
      }
      
      if (session && session.user) {
        // User is logged in - update navigation
        const user = session.user as User;
        const meta = user.user_metadata || {};
        const currentUser: CurrentUser = {
          id: user.id,
          email: user.email,
          username: meta.username || (user.email ? user.email.split('@')[0] : ''),
          firstName: meta.firstName || '',
          lastName: meta.lastName || ''
        };

        // Store in localStorage for compatibility
        localStorage.setItem('ai_interviewer_user', JSON.stringify(currentUser));

        // Update navigation links
        const loginLinks = document.querySelectorAll<HTMLElement>('.login-link');
        loginLinks.forEach(link => {
          link.innerHTML = `<i class="fa-regular fa-user"></i> ${currentUser.firstName || 'Profile'}`;
          link.setAttribute('href', 'dashboard.html');
          
          // Add logout button
          addLogoutButton(link);
        });
      } else {
        // No session - check if we have cached user data first
        const userData = localStorage.getItem('ai_interviewer_user');
        if (!userData) {
          // Only clear if no cached data
          const loginLinks = document.querySelectorAll<HTMLElement>('.login-link');
          loginLinks.forEach(link => {
            const href = link.getAttribute('href') || '';
            if (!href.includes('login.html') && !href.includes('signup.html')) {
              link.innerHTML = `<i class="fa-regular fa-user"></i> Login`;
              link.setAttribute('href', 'login.html');
            }
          });
          
          // Remove logout buttons
          document.querySelectorAll('.logout-btn').forEach(btn => btn.remove());
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // On error, preserve existing state - don't log user out
    }
  }

  // Setup auth state change listener once
  function setupAuthListener(): void {
    const client = window.supabaseClient as FullSupabaseClient | undefined;
    if (client && !authStateListener) {
      authStateListener = client.auth.onAuthStateChange((event: string, session: any) => {
        console.log('Auth state changed:', event);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          updateAuthStatus();
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('ai_interviewer_user');
          localStorage.removeItem('ai_interviewer_remember');
          // Remove logout buttons
          document.querySelectorAll('.logout-btn').forEach(btn => btn.remove());
          updateAuthStatus();
        }
      });
    }
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      updateAuthStatus();
      setupAuthListener();
    });
  } else {
    updateAuthStatus();
    setupAuthListener();
  }

  // Try to setup listener after a delay in case scripts load in different order
  setTimeout(() => {
    setupAuthListener();
  }, 1000);
})();


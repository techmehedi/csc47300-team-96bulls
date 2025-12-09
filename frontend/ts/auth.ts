// Authentication System for AI Interviewer
import type { FullSupabaseClient, User } from './types.js';

interface CurrentUser {
  id: string;
  email?: string;
  username: string;
  firstName: string;
  lastName: string;
  preferences: {
    theme: string;
    difficulty: string;
    topics: string[];
    notifications: boolean;
    emailUpdates: boolean;
  };
}

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
}

type NotificationType = 'success' | 'error' | 'warning' | 'info';

declare global {
  interface Window {
    authSystem?: AuthenticationSystem;
    supabaseClient?: any;
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
    getSupabaseUser?: () => Promise<User | null>;
  }
}

class AuthenticationSystem {
  private currentUser: CurrentUser | null = null;

  constructor() {
    // Initialize immediately - event listeners will work even if DOM isn't ready
    this.initializeEventListeners();
    
    // Check session after a short delay to ensure Supabase is initialized
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => this.checkExistingSession(), 200);
      });
    } else {
      setTimeout(() => this.checkExistingSession(), 200);
    }
  }

  initializeEventListeners(): void {
    // Login form
    const loginForm = document.getElementById('loginForm') as HTMLFormElement | null;
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    // Signup form
    const signupForm = document.getElementById('signupForm') as HTMLFormElement | null;
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => this.handleSignup(e));
    }

    // Password toggle functionality
    this.initializePasswordToggles();
    
    // Password strength checking
    this.initializePasswordStrength();
    
    // Form validation
    this.initializeFormValidation();
  }

  async checkExistingSession(): Promise<void> {
    // Prefer Supabase session
    if (window.getSupabaseUser && window.supabaseClient) {
      const user = await window.getSupabaseUser();
      if (user) {
        this.currentUser = this.mapSupabaseUser(user);
        localStorage.setItem('ai_interviewer_user', JSON.stringify(this.currentUser));
        this.updateNavigationForLoggedInUser();
        return;
      }
    }
    // Fallback to local stored session (legacy)
    const userData = localStorage.getItem('ai_interviewer_user');
    if (userData) {
      try {
        this.currentUser = JSON.parse(userData) as CurrentUser;
        this.updateNavigationForLoggedInUser();
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }

  updateNavigationForLoggedInUser(): void {
    if (!this.currentUser) return;
    
    const loginLinks = document.querySelectorAll<HTMLElement>('.login-link');
    loginLinks.forEach(link => {
      const userName = this.currentUser!.firstName || this.currentUser!.username || 'Profile';
      link.innerHTML = `<i class="fa-regular fa-user"></i> ${userName}`;
      link.setAttribute('href', 'dashboard.html');
      
      // Add logout button next to profile link
      this.addLogoutButton(link);
    });
  }

  addLogoutButton(profileLink: HTMLElement): void {
    // Check if logout button already exists
    if (profileLink.parentElement?.querySelector('.logout-btn')) {
      return;
    }

    // Create logout button
    const logoutBtn = document.createElement('a');
    logoutBtn.className = 'logout-btn';
    logoutBtn.href = '#';
    logoutBtn.innerHTML = '<i class="fa-solid fa-sign-out-alt"></i> Logout';
    logoutBtn.addEventListener('click', (e: Event) => {
      e.preventDefault();
      this.logout();
    });

    // Insert logout button after profile link
    profileLink.parentElement?.insertBefore(logoutBtn, profileLink.nextSibling);
  }

  async handleLogin(e: Event): Promise<void> {
    e.preventDefault();
    console.log('Login form submitted');
    
    const form = e.target as HTMLFormElement;
    const email = (form.email as HTMLInputElement).value;
    const password = (form.password as HTMLInputElement).value;
    const rememberMe = (form.rememberMe as HTMLInputElement).checked;

    if (!email || !password) {
      this.showNotification('Please enter both email and password', 'error');
      return;
    }

    try {
      this.showLoading('loginBtn');
      this.clearErrors();
      console.log('Starting login process for:', email);

      // Wait for Supabase client to be ready
      let waitCount = 0;
      while (!window.supabaseClient && waitCount < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
      }

      if (!window.supabaseClient) {
        console.error('Supabase client not available. Check configuration.');
        throw new Error('Supabase is not initialized. Please check your configuration.');
      }

      if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
        console.error('Supabase credentials missing');
        throw new Error('Supabase configuration is missing. Please set up your .env file and run: node inject-env.mjs');
      }

      console.log('Attempting to login user:', email);

      const client = window.supabaseClient;
      if (!client) {
        console.error('Supabase client is null/undefined');
        throw new Error('Supabase client not properly initialized');
      }
      
      if (!client.auth) {
        console.error('Supabase client.auth is missing');
        throw new Error('Supabase auth not available');
      }
      
      console.log('Calling signInWithPassword...');
      // Type assertion needed because Supabase auth types are complex
      const { data, error } = await (client.auth as any).signInWithPassword({ email, password });
      
      if (error) {
        console.error('Supabase login error:', error);
        throw error;
      }
      
      console.log('Login API call successful, data:', data);

      const user = data?.user;
      if (!user) {
        console.error('No user in response data:', data);
        throw new Error('Login failed - no user returned');
      }

      console.log('Login successful! User ID:', user.id);
      console.log('User email:', user.email);

      // Store user session (mirror minimal profile)
      this.currentUser = this.mapSupabaseUser(user as User);
      localStorage.setItem('ai_interviewer_user', JSON.stringify(this.currentUser));
      console.log('User stored in localStorage:', this.currentUser);
      
      if (rememberMe) {
        localStorage.setItem('ai_interviewer_remember', 'true');
      }

      this.showNotification('Login successful! Redirecting...', 'success');
      console.log('=== LOGIN SUCCESSFUL, REDIRECTING ===');
      
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);

    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.message || error.toString() || 'Login failed';
      this.showError('emailError', errorMessage);
      
      // More specific error messages
      if (errorMessage.includes('fetch')) {
        this.showNotification('Network error: Unable to connect to Supabase. Check your internet connection and Supabase URL.', 'error');
      } else if (errorMessage.includes('Invalid login')) {
        this.showNotification('Invalid email or password. Please try again.', 'error');
      } else if (errorMessage.includes('Email not confirmed') || errorMessage.includes('not confirmed')) {
        // Offer to resend confirmation email
        this.showNotification('Please confirm your email address. Check your inbox or we can resend the confirmation email.', 'warning');
        this.showResendConfirmationOption(email);
      } else {
        this.showNotification('Login failed: ' + errorMessage, 'error');
      }
    } finally {
      this.hideLoading('loginBtn');
    }
  }

  async handleSignup(e: Event): Promise<void> {
    e.preventDefault();
    console.log('=== SIGNUP ATTEMPT STARTED ===');
    
    const form = e.target as HTMLFormElement;
    const formData: SignupFormData = {
      firstName: (form.firstName as HTMLInputElement).value,
      lastName: (form.lastName as HTMLInputElement).value,
      email: (form.email as HTMLInputElement).value,
      username: (form.username as HTMLInputElement).value,
      password: (form.password as HTMLInputElement).value
    };

    // Basic validation
    if (!formData.email || !formData.password || !formData.username) {
      this.showNotification('Please fill in all required fields', 'error');
      return;
    }

    try {
      this.showLoading('signupBtn');
      this.clearErrors();
      console.log('Starting signup process for:', formData.email);

      // Validate form data
      this.validateSignupForm(formData);

      // Wait for Supabase client to be ready
      let waitCount = 0;
      while (!window.supabaseClient && waitCount < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
      }

      if (!window.supabaseClient) {
        console.error('Supabase client not available. Check configuration.');
        throw new Error('Supabase is not initialized. Please check your configuration.');
      }

      if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
        console.error('Supabase credentials missing:', {
          url: window.SUPABASE_URL,
          key: window.SUPABASE_ANON_KEY ? 'present' : 'missing'
        });
        throw new Error('Supabase configuration is missing. Please set up your .env file and run: node inject-env.mjs');
      }

      console.log('Attempting to sign up user:', formData.email);

      // Set email redirect URL - construct based on current location
      // For Live Server (127.0.0.1:5500 or localhost:5500), use the full path
      let redirectUrl: string;
      if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
        // Local development - use current origin + path to dashboard
        const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
        redirectUrl = `${window.location.origin}${basePath}/dashboard.html`;
      } else {
        // Production - use absolute URL
        redirectUrl = `${window.location.origin}/dashboard.html`;
      }

      const client = window.supabaseClient;
      if (!client) {
        console.error('Supabase client is null/undefined');
        throw new Error('Supabase client not properly initialized');
      }
      
      if (!client.auth) {
        console.error('Supabase client.auth is missing');
        throw new Error('Supabase auth not available');
      }
      
      console.log('Calling signUp...');
      const { data, error } = await (client.auth as any).signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            username: formData.username
          }
        }
      });

      if (error) {
        console.error('Supabase signup error:', error);
        throw error;
      }

      console.log('Signup API call successful, data:', data);

      const user = data?.user;
      if (user) {
        console.log('User created! User ID:', user.id);
        // Store user session mirror (if session is created immediately)
        this.currentUser = this.mapSupabaseUser(user as User);
        localStorage.setItem('ai_interviewer_user', JSON.stringify(this.currentUser));
        console.log('User stored in localStorage:', this.currentUser);
      }

      // If email confirmation is required, inform the user
      const requiresEmailConfirm = !data?.session;
      console.log('Email confirmation required:', requiresEmailConfirm);
      
      this.showNotification(
        requiresEmailConfirm ? 'Account created! Check your email to confirm.' : 'Account created successfully! Redirecting...',
        'success'
      );
      
      if (!requiresEmailConfirm) {
        console.log('=== SIGNUP SUCCESSFUL, REDIRECTING ===');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);
      } else {
        console.log('=== SIGNUP SUCCESSFUL, EMAIL CONFIRMATION REQUIRED ===');
      }

    } catch (error: any) {
      console.error('Signup error:', error);
      const errorMessage = error.message || error.toString() || 'Signup failed';
      this.showError('emailError', errorMessage);
      
      // More specific error messages
      if (errorMessage.includes('fetch')) {
        this.showNotification('Network error: Unable to connect to Supabase. Check your internet connection and Supabase URL.', 'error');
      } else if (errorMessage.includes('configuration')) {
        this.showNotification('Configuration error: Please set up your Supabase credentials.', 'error');
      } else {
        this.showNotification('Signup failed: ' + errorMessage, 'error');
      }
    } finally {
      this.hideLoading('signupBtn');
    }
  }

  mapSupabaseUser(user: User): CurrentUser {
    const meta = user.user_metadata || {};
    return {
      id: user.id,
      email: user.email,
      username: meta.username || (user.email ? user.email.split('@')[0] : ''),
      firstName: meta.firstName || '',
      lastName: meta.lastName || '',
      preferences: {
        theme: 'light',
        difficulty: 'medium',
        topics: [],
        notifications: true,
        emailUpdates: true
      }
    };
  }

  validateSignupForm(data: SignupFormData): void {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error('Please enter a valid email address');
    }

    // Username validation
    if (data.username.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }

    // Password validation
    if (data.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Confirm password
    const confirmPasswordEl = document.getElementById('confirmPassword') as HTMLInputElement | null;
    if (!confirmPasswordEl) {
      throw new Error('Confirm password field not found');
    }
    const confirmPassword = confirmPasswordEl.value;
    if (data.password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // Terms agreement
    const agreeTermsEl = document.getElementById('agreeTerms') as HTMLInputElement | null;
    if (!agreeTermsEl || !agreeTermsEl.checked) {
      throw new Error('Please agree to the terms and conditions');
    }
  }

  initializePasswordToggles(): void {
    const passwordToggles = document.querySelectorAll<HTMLElement>('.password-toggle');
    passwordToggles.forEach(toggle => {
      toggle.addEventListener('click', (e: Event) => {
        e.preventDefault();
        const input = toggle.parentElement?.querySelector('input') as HTMLInputElement | null;
        const icon = toggle.querySelector('i');
        
        if (input && icon) {
          if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
          } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
          }
        }
      });
    });
  }

  initializePasswordStrength(): void {
    const passwordInput = document.getElementById('password') as HTMLInputElement | null;
    if (!passwordInput) return;

    passwordInput.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLInputElement;
      const password = target.value;
      const strengthContainer = document.getElementById('passwordStrength');
      const strengthFill = document.getElementById('strengthFill');
      const strengthText = document.getElementById('strengthText');

      if (!strengthContainer || !strengthFill || !strengthText) return;

      if (password.length === 0) {
        strengthContainer.style.display = 'none';
        return;
      }

      strengthContainer.style.display = 'block';
      
      const strength = this.calculatePasswordStrength(password);
      const strengthLevels = ['very-weak', 'weak', 'fair', 'good', 'strong', 'very-strong'];
      const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
      
      strengthFill.className = `strength-fill ${strengthLevels[strength]}`;
      strengthFill.style.width = `${(strength + 1) * 16.67}%`;
      strengthText.className = `strength-text ${strengthLevels[strength]}`;
      strengthText.textContent = strengthLabels[strength];
    });
  }

  calculatePasswordStrength(password: string): number {
    let score = 0;
    
    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Character variety checks
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    return Math.min(score, 5);
  }

  initializeFormValidation(): void {
    const inputs = document.querySelectorAll<HTMLInputElement>('input[required]');
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => this.clearFieldError(input));
    });
  }

  validateField(field: HTMLInputElement): void {
    const value = field.value.trim();
    const fieldName = field.name;
    let errorMessage = '';

    switch (fieldName) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          errorMessage = 'Please enter a valid email address';
        }
        break;
      case 'username':
        if (value && value.length < 3) {
          errorMessage = 'Username must be at least 3 characters long';
        }
        break;
      case 'password':
        if (value && value.length < 8) {
          errorMessage = 'Password must be at least 8 characters long';
        }
        break;
      case 'confirmPassword':
        const passwordEl = document.getElementById('password') as HTMLInputElement | null;
        const password = passwordEl?.value || '';
        if (value && value !== password) {
          errorMessage = 'Passwords do not match';
        }
        break;
    }

    if (errorMessage) {
      this.showError(`${fieldName}Error`, errorMessage);
    } else {
      this.clearFieldError(field);
    }
  }

  clearFieldError(field: HTMLInputElement): void {
    const errorElement = document.getElementById(`${field.name}Error`);
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
  }

  showError(fieldId: string, message: string): void {
    const errorElement = document.getElementById(fieldId);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  clearErrors(): void {
    const errorElements = document.querySelectorAll<HTMLElement>('.error-message');
    errorElements.forEach(element => {
      element.textContent = '';
      element.style.display = 'none';
    });
  }

  showLoading(buttonId: string): void {
    const button = document.getElementById(buttonId) as HTMLButtonElement | null;
    if (button) {
      const btnText = button.querySelector<HTMLElement>('.btn-text');
      const btnSpinner = button.querySelector<HTMLElement>('.btn-spinner');
      
      if (btnText) btnText.style.display = 'none';
      if (btnSpinner) btnSpinner.style.display = 'inline-block';
      
      button.disabled = true;
    }
  }

  hideLoading(buttonId: string): void {
    const button = document.getElementById(buttonId) as HTMLButtonElement | null;
    if (button) {
      const btnText = button.querySelector<HTMLElement>('.btn-text');
      const btnSpinner = button.querySelector<HTMLElement>('.btn-spinner');
      
      if (btnText) btnText.style.display = 'inline';
      if (btnSpinner) btnSpinner.style.display = 'none';
      
      button.disabled = false;
    }
  }

  showNotification(message: string, type: NotificationType = 'info'): void {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll<HTMLElement>('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fa-solid fa-${this.getNotificationIcon(type)}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Show notification with animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  getNotificationIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    return icons[type] || 'info-circle';
  }

  // Logout functionality
  async logout(): Promise<void> {
    try {
      const client = window.supabaseClient as FullSupabaseClient | undefined;
      if (client) {
        await client.auth.signOut();
      }
    } catch (e) {
      // Ignore errors
    }
    this.currentUser = null;
    localStorage.removeItem('ai_interviewer_user');
    localStorage.removeItem('ai_interviewer_remember');
    window.location.href = 'index.html';
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  // Get current user
  getCurrentUser(): CurrentUser | null {
    return this.currentUser;
  }

  // Resend email confirmation
  async resendConfirmationEmail(email: string): Promise<void> {
    try {
      const client = window.supabaseClient as FullSupabaseClient | undefined;
      if (!client) {
        throw new Error('Supabase client not available');
      }

      const { error } = await (client.auth as any).resend({
        type: 'signup',
        email: email
      });

      if (error) {
        throw error;
      }

      this.showNotification('Confirmation email sent! Please check your inbox.', 'success');
    } catch (error: any) {
      console.error('Error resending confirmation email:', error);
      this.showNotification('Failed to resend confirmation email: ' + (error.message || 'Unknown error'), 'error');
    }
  }

  showResendConfirmationOption(email: string): void {
    // Remove existing resend option if any
    const existingResend = document.getElementById('resendConfirmation');
    if (existingResend) {
      existingResend.remove();
    }

    // Add resend confirmation link below email error
    const emailError = document.getElementById('emailError');
    if (emailError) {
      const resendDiv = document.createElement('div');
      resendDiv.id = 'resendConfirmation';
      resendDiv.style.marginTop = '10px';
      resendDiv.style.textAlign = 'center';
      resendDiv.innerHTML = `
        <a href="#" style="color: #6366f1; text-decoration: none; font-size: 0.9rem;" id="resendLink">
          <i class="fa-solid fa-envelope"></i> Resend confirmation email
        </a>
      `;
      
      emailError.parentElement?.appendChild(resendDiv);
      
      // Add click handler
      const resendLink = document.getElementById('resendLink');
      if (resendLink) {
        resendLink.addEventListener('click', async (e: Event) => {
          e.preventDefault();
          await this.resendConfirmationEmail(email);
        });
      }
    }
  }
}

// Initialize authentication system
// Wait for DOM and Supabase to be ready
(function() {
  function initAuth() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
          if (!window.authSystem) {
            window.authSystem = new AuthenticationSystem();
          }
        }, 300);
      });
    } else {
      setTimeout(() => {
        if (!window.authSystem) {
          window.authSystem = new AuthenticationSystem();
        }
      }, 300);
    }
  }
  initAuth();
})();

// Global logout function
function logout(): void {
  if (window.authSystem) {
    window.authSystem.logout();
  }
}


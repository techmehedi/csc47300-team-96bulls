// Authentication System for AI Interviewer
class AuthenticationSystem {
  constructor() {
    this.backend = new BackendSimulator();
    this.currentUser = null;
    this.initializeEventListeners();
    this.checkExistingSession();
  }

  initializeEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    // Signup form
    const signupForm = document.getElementById('signupForm');
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

  async checkExistingSession() {
    const userData = localStorage.getItem('ai_interviewer_user');
    if (userData) {
      this.currentUser = JSON.parse(userData);
      this.updateNavigationForLoggedInUser();
    }
  }

  updateNavigationForLoggedInUser() {
    const loginLinks = document.querySelectorAll('.login-link');
    loginLinks.forEach(link => {
      link.innerHTML = `<i class="fa-regular fa-user"></i> ${this.currentUser.firstName}`;
      link.href = 'dashboard.html';
    });
  }

  async handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;
    const rememberMe = form.rememberMe.checked;

    try {
      this.showLoading('loginBtn');
      this.clearErrors();

      const user = await this.backend.authenticateUser(email, password);
      
      // Store user session
      this.currentUser = user;
      localStorage.setItem('ai_interviewer_user', JSON.stringify(user));
      
      if (rememberMe) {
        localStorage.setItem('ai_interviewer_remember', 'true');
      }

      this.showNotification('Login successful! Redirecting...', 'success');
      
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);

    } catch (error) {
      this.showError('emailError', error.message);
      this.showNotification('Login failed. Please check your credentials.', 'error');
    } finally {
      this.hideLoading('loginBtn');
    }
  }

  async handleSignup(e) {
    e.preventDefault();
    const form = e.target;
    const formData = {
      firstName: form.firstName.value,
      lastName: form.lastName.value,
      email: form.email.value,
      username: form.username.value,
      password: form.password.value
    };

    try {
      this.showLoading('signupBtn');
      this.clearErrors();

      // Validate form data
      this.validateSignupForm(formData);

      const user = await this.backend.registerUser(formData);
      
      // Store user session
      this.currentUser = user;
      localStorage.setItem('ai_interviewer_user', JSON.stringify(user));

      this.showNotification('Account created successfully! Redirecting...', 'success');
      
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);

    } catch (error) {
      this.showError('emailError', error.message);
      this.showNotification('Signup failed. Please try again.', 'error');
    } finally {
      this.hideLoading('signupBtn');
    }
  }

  validateSignupForm(data) {
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
    const confirmPassword = document.getElementById('confirmPassword').value;
    if (data.password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // Terms agreement
    const agreeTerms = document.getElementById('agreeTerms').checked;
    if (!agreeTerms) {
      throw new Error('Please agree to the terms and conditions');
    }
  }

  initializePasswordToggles() {
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const input = toggle.parentElement.querySelector('input');
        const icon = toggle.querySelector('i');
        
        if (input.type === 'password') {
          input.type = 'text';
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
        } else {
          input.type = 'password';
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
        }
      });
    });
  }

  initializePasswordStrength() {
    const passwordInput = document.getElementById('password');
    if (!passwordInput) return;

    passwordInput.addEventListener('input', (e) => {
      const password = e.target.value;
      const strengthContainer = document.getElementById('passwordStrength');
      const strengthFill = document.getElementById('strengthFill');
      const strengthText = document.getElementById('strengthText');

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

  calculatePasswordStrength(password) {
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

  initializeFormValidation() {
    const inputs = document.querySelectorAll('input[required]');
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => this.clearFieldError(input));
    });
  }

  validateField(field) {
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
        const password = document.getElementById('password').value;
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

  clearFieldError(field) {
    const errorElement = document.getElementById(`${field.name}Error`);
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
  }

  showError(fieldId, message) {
    const errorElement = document.getElementById(fieldId);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  clearErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
      element.textContent = '';
      element.style.display = 'none';
    });
  }

  showLoading(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
      const btnText = button.querySelector('.btn-text');
      const btnSpinner = button.querySelector('.btn-spinner');
      
      if (btnText) btnText.style.display = 'none';
      if (btnSpinner) btnSpinner.style.display = 'inline-block';
      
      button.disabled = true;
    }
  }

  hideLoading(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
      const btnText = button.querySelector('.btn-text');
      const btnSpinner = button.querySelector('.btn-spinner');
      
      if (btnText) btnText.style.display = 'inline';
      if (btnSpinner) btnSpinner.style.display = 'none';
      
      button.disabled = false;
    }
  }

  showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
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

  getNotificationIcon(type) {
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    return icons[type] || 'info-circle';
  }

  // Logout functionality
  logout() {
    this.currentUser = null;
    localStorage.removeItem('ai_interviewer_user');
    localStorage.removeItem('ai_interviewer_remember');
    window.location.href = 'index.html';
  }

  // Check if user is logged in
  isLoggedIn() {
    return this.currentUser !== null;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }
}

// Initialize authentication system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.authSystem = new AuthenticationSystem();
});

// Global logout function
function logout() {
  if (window.authSystem) {
    window.authSystem.logout();
  }
}
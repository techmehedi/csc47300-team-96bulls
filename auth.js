// Authentication Manager
class AuthManager {
  constructor() {
    this.isLoginPage = window.location.pathname.includes('login.html');
    this.isSignupPage = window.location.pathname.includes('signup.html');
    this.initializeEventListeners();
    this.initializePasswordStrength();
  }

  initializeEventListeners() {
    if (this.isLoginPage) {
      this.initializeLoginForm();
    } else if (this.isSignupPage) {
      this.initializeSignupForm();
    }
  }

  initializeLoginForm() {
    const form = document.getElementById('loginForm');
    const passwordToggle = document.getElementById('passwordToggle');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    passwordToggle.addEventListener('click', () => {
      this.togglePasswordVisibility('password', passwordToggle);
    });

    // Real-time validation
    emailInput.addEventListener('blur', () => this.validateEmail(emailInput.value));
    passwordInput.addEventListener('blur', () => this.validatePassword(passwordInput.value));
  }

  initializeSignupForm() {
    const form = document.getElementById('signupForm');
    const passwordToggle = document.getElementById('passwordToggle');
    const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSignup();
    });

    passwordToggle.addEventListener('click', () => {
      this.togglePasswordVisibility('password', passwordToggle);
    });

    confirmPasswordToggle.addEventListener('click', () => {
      this.togglePasswordVisibility('confirmPassword', confirmPasswordToggle);
    });

    // Real-time validation
    document.getElementById('firstName').addEventListener('blur', (e) => this.validateName(e.target.value, 'firstName'));
    document.getElementById('lastName').addEventListener('blur', (e) => this.validateName(e.target.value, 'lastName'));
    document.getElementById('email').addEventListener('blur', (e) => this.validateEmail(e.target.value));
    document.getElementById('username').addEventListener('blur', (e) => this.validateUsername(e.target.value));
    passwordInput.addEventListener('input', (e) => this.updatePasswordStrength(e.target.value));
    passwordInput.addEventListener('blur', (e) => this.validatePassword(e.target.value));
    confirmPasswordInput.addEventListener('blur', (e) => this.validateConfirmPassword(e.target.value));
  }

  initializePasswordStrength() {
    if (this.isSignupPage) {
      const passwordInput = document.getElementById('password');
      passwordInput.addEventListener('input', (e) => {
        this.updatePasswordStrength(e.target.value);
      });
    }
  }

  togglePasswordVisibility(inputId, toggleButton) {
    const input = document.getElementById(inputId);
    const icon = toggleButton.querySelector('i');
    
    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'fa-solid fa-eye-slash';
    } else {
      input.type = 'password';
      icon.className = 'fa-solid fa-eye';
    }
  }

  updatePasswordStrength(password) {
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    if (!strengthFill || !strengthText) return;

    const strength = this.calculatePasswordStrength(password);
    const percentage = strength.score * 20; // Convert to percentage
    
    strengthFill.style.width = `${percentage}%`;
    strengthFill.className = `strength-fill ${strength.level}`;
    strengthText.textContent = strength.text;
    strengthText.className = `strength-text ${strength.level}`;
  }

  calculatePasswordStrength(password) {
    let score = 0;
    let feedback = [];

    if (password.length >= 8) score++;
    else feedback.push('at least 8 characters');

    if (/[a-z]/.test(password)) score++;
    else feedback.push('lowercase letters');

    if (/[A-Z]/.test(password)) score++;
    else feedback.push('uppercase letters');

    if (/[0-9]/.test(password)) score++;
    else feedback.push('numbers');

    if (/[^A-Za-z0-9]/.test(password)) score++;
    else feedback.push('special characters');

    const levels = {
      0: { level: 'very-weak', text: 'Very weak' },
      1: { level: 'weak', text: 'Weak' },
      2: { level: 'fair', text: 'Fair' },
      3: { level: 'good', text: 'Good' },
      4: { level: 'strong', text: 'Strong' },
      5: { level: 'very-strong', text: 'Very strong' }
    };

    return {
      score,
      level: levels[score].level,
      text: levels[score].text,
      feedback
    };
  }

  validateName(name, fieldId) {
    const errorElement = document.getElementById(`${fieldId}Error`);
    const isValid = name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name);
    
    this.showFieldError(fieldId, isValid ? '' : 'Name must be at least 2 characters and contain only letters');
    return isValid;
  }

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    
    this.showFieldError('email', isValid ? '' : 'Please enter a valid email address');
    return isValid;
  }

  validateUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    const isValid = usernameRegex.test(username);
    
    this.showFieldError('username', isValid ? '' : 'Username must be 3-20 characters and contain only letters, numbers, and underscores');
    return isValid;
  }

  validatePassword(password) {
    const strength = this.calculatePasswordStrength(password);
    const isValid = strength.score >= 3;
    
    this.showFieldError('password', isValid ? '' : 'Password must be at least "Good" strength');
    return isValid;
  }

  validateConfirmPassword(confirmPassword) {
    const password = document.getElementById('password').value;
    const isValid = confirmPassword === password;
    
    this.showFieldError('confirmPassword', isValid ? '' : 'Passwords do not match');
    return isValid;
  }

  showFieldError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}Error`);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = message ? 'block' : 'none';
    }
  }

  async handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    // Validate inputs
    if (!this.validateEmail(email) || !this.validatePassword(password)) {
      this.showNotification('Please fix the errors above', 'error');
      return;
    }

    this.setLoadingState('loginBtn', true);

    try {
      // Simulate API call
      await this.simulateApiCall();
      
      // Store user session
      const userData = {
        email,
        loginTime: new Date().toISOString(),
        rememberMe
      };
      
      if (rememberMe) {
        localStorage.setItem('userSession', JSON.stringify(userData));
      } else {
        sessionStorage.setItem('userSession', JSON.stringify(userData));
      }

      this.showNotification('Login successful! Redirecting...', 'success');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);

    } catch (error) {
      this.showNotification('Login failed. Please check your credentials.', 'error');
    } finally {
      this.setLoadingState('loginBtn', false);
    }
  }

  async handleSignup() {
    const formData = {
      firstName: document.getElementById('firstName').value,
      lastName: document.getElementById('lastName').value,
      email: document.getElementById('email').value,
      username: document.getElementById('username').value,
      password: document.getElementById('password').value,
      confirmPassword: document.getElementById('confirmPassword').value,
      agreeTerms: document.getElementById('agreeTerms').checked,
      emailUpdates: document.getElementById('emailUpdates').checked
    };

    // Validate all fields
    const validations = [
      this.validateName(formData.firstName, 'firstName'),
      this.validateName(formData.lastName, 'lastName'),
      this.validateEmail(formData.email),
      this.validateUsername(formData.username),
      this.validatePassword(formData.password),
      this.validateConfirmPassword(formData.confirmPassword)
    ];

    if (!validations.every(v => v) || !formData.agreeTerms) {
      this.showNotification('Please fix the errors above and agree to the terms', 'error');
      return;
    }

    this.setLoadingState('signupBtn', true);

    try {
      // Simulate API call
      await this.simulateApiCall();
      
      this.showNotification('Account created successfully! Redirecting to login...', 'success');
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);

    } catch (error) {
      this.showNotification('Signup failed. Please try again.', 'error');
    } finally {
      this.setLoadingState('signupBtn', false);
    }
  }

  setLoadingState(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    const btnText = button.querySelector('.btn-text');
    const btnSpinner = button.querySelector('.btn-spinner');

    if (isLoading) {
      button.disabled = true;
      btnText.style.display = 'none';
      btnSpinner.style.display = 'inline-block';
    } else {
      button.disabled = false;
      btnText.style.display = 'inline';
      btnSpinner.style.display = 'none';
    }
  }

  async simulateApiCall() {
    // Simulate network delay
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 90% success rate
        if (Math.random() > 0.1) {
          resolve();
        } else {
          reject(new Error('API Error'));
        }
      }, 1500);
    });
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fa-solid ${this.getNotificationIcon(type)}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.classList.remove('show');
        setTimeout(() => {
          if (notification.parentElement) {
            notification.remove();
          }
        }, 300);
      }
    }, 5000);
  }

  getNotificationIcon(type) {
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
  }
}

// Initialize authentication manager when page loads
document.addEventListener('DOMContentLoaded', () => {
  new AuthManager();
});

// Smooth page transitions with loading animation
(function() {
  'use strict';

  // Create transition overlay with loading animation
  const createTransitionOverlay = () => {
    const overlay = document.createElement('div');
    overlay.id = 'page-transition-overlay';
    
    // Create loading spinner
    const loader = document.createElement('div');
    loader.className = 'page-loader';
    loader.innerHTML = `
      <div class="loader-spinner">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>
      <div class="loader-text">Loading...</div>
    `;
    
    overlay.appendChild(loader);
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      z-index: 9999;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
    `;
    
    document.body.appendChild(overlay);
    return overlay;
  };

  // Get or create overlay
  let overlay = document.getElementById('page-transition-overlay');
  if (!overlay) {
    overlay = createTransitionOverlay();
  }

  // Handle link clicks
  const handleLinkClick = (e) => {
    const link = e.currentTarget;
    const href = link.getAttribute('href');
    
    // Skip if it's an anchor link, external link, or special link
    if (!href || 
        href.startsWith('#') || 
        href.startsWith('javascript:') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        link.target === '_blank' ||
        link.hasAttribute('data-no-transition')) {
      return;
    }

    // Check if it's a same-origin link
    try {
      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) {
        return;
      }
    } catch (e) {
      // Invalid URL, skip
      return;
    }

    e.preventDefault();
    
    // Show transition overlay with animation
    overlay.style.pointerEvents = 'all';
    overlay.style.opacity = '1';
    
    // Start loading animation
    const loader = overlay.querySelector('.page-loader');
    if (loader) {
      loader.style.opacity = '1';
      loader.style.transform = 'translate(-50%, -50%) scale(1)';
    }
    
    // Navigate after transition
    setTimeout(() => {
      window.location.href = href;
    }, 400);
  };

  // Attach event listeners to all links
  const attachListeners = () => {
    const links = document.querySelectorAll('a[href]:not([href^="#"]):not([data-no-transition])');
    links.forEach(link => {
      // Remove existing listener if any
      link.removeEventListener('click', handleLinkClick);
      // Add new listener
      link.addEventListener('click', handleLinkClick);
    });
  };

  // Attach listeners on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachListeners);
  } else {
    attachListeners();
  }

  // Re-attach listeners after dynamic content changes
  const observer = new MutationObserver(() => {
    attachListeners();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Handle form submissions with transitions
  const forms = document.querySelectorAll('form[action]');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      const action = form.getAttribute('action');
      if (action && !action.startsWith('#') && !form.hasAttribute('data-no-transition')) {
        overlay.style.pointerEvents = 'all';
        overlay.style.opacity = '1';
        
        // Start loading animation
        const loader = overlay.querySelector('.page-loader');
        if (loader) {
          loader.style.opacity = '1';
          loader.style.transform = 'translate(-50%, -50%) scale(1)';
        }
        // Let form submit proceed normally
      }
    });
  });

  // Hide overlay when page loads
  window.addEventListener('load', () => {
    const loader = overlay.querySelector('.page-loader');
    if (loader) {
      loader.style.opacity = '0';
      loader.style.transform = 'translate(-50%, -50%) scale(0.8)';
    }
    setTimeout(() => {
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
    }, 200);
  });

  // Handle browser back/forward buttons
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      const loader = overlay.querySelector('.page-loader');
      if (loader) {
        loader.style.opacity = '0';
        loader.style.transform = 'translate(-50%, -50%) scale(0.8)';
      }
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
    }
  });
})();


// Protect user session when on admin page
// This ensures that navigating to admin.html doesn't clear the user's session
(function() {
    'use strict';
    
    // Store the current user data before any potential clearing
    const currentUserData = localStorage.getItem('ai_interviewer_user');
    const currentRemember = localStorage.getItem('ai_interviewer_remember');
    
    // Monitor localStorage changes and restore if cleared
    const originalRemoveItem = Storage.prototype.removeItem;
    Storage.prototype.removeItem = function(key) {
        // If we're on admin page and trying to remove user data, prevent it
        if (window.location.pathname.includes('admin.html')) {
            if (key === 'ai_interviewer_user' || key === 'ai_interviewer_remember') {
                console.log('Prevented clearing user session on admin page');
                return; // Don't remove the item
            }
        }
        // Otherwise, allow normal removal
        return originalRemoveItem.call(this, key);
    };
    
    // Restore user data if it was cleared
    function restoreSessionIfNeeded() {
        if (window.location.pathname.includes('admin.html')) {
            if (currentUserData && !localStorage.getItem('ai_interviewer_user')) {
                console.log('Restoring user session on admin page');
                localStorage.setItem('ai_interviewer_user', currentUserData);
                if (currentRemember) {
                    localStorage.setItem('ai_interviewer_remember', currentRemember);
                }
            }
        }
    }
    
    // Check immediately and after a short delay
    restoreSessionIfNeeded();
    setTimeout(restoreSessionIfNeeded, 100);
    setTimeout(restoreSessionIfNeeded, 500);
    
    // Also check when page becomes visible
    document.addEventListener('visibilitychange', restoreSessionIfNeeded);
})();


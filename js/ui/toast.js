/**
 * Toast Notification System
 * 
 * Provides non-blocking feedback to users for actions
 */

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - Type of toast: 'success', 'error', 'info', 'warning'
 * @param {number} duration - Duration in ms (default: 3000)
 */
export function showToast(message, type = 'info', duration = 3000) {
    if (typeof document === 'undefined') return;
    
    // Create toast container if it doesn't exist
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Add icon based on type
    const icons = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ'
    };
    const icon = icons[type] || icons.info;
    
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" aria-label="Close">&times;</button>
    `;
    
    // Add to container
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('toast-show'), 10);
    
    // Close button handler
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => removeToast(toast));
    
    // Auto-remove after duration
    setTimeout(() => removeToast(toast), duration);
}

/**
 * Remove a toast with animation
 * @param {HTMLElement} toast - The toast element to remove
 */
function removeToast(toast) {
    if (!toast || !toast.parentElement) return;
    
    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.parentElement.removeChild(toast);
        }
    }, 300);
}

/**
 * Convenience methods
 */
export function showSuccess(message, duration) {
    showToast(message, 'success', duration);
}

export function showError(message, duration) {
    showToast(message, 'error', duration);
}

export function showWarning(message, duration) {
    showToast(message, 'warning', duration);
}

export function showInfo(message, duration) {
    showToast(message, 'info', duration);
}

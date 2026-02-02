/**
 * Loading State Manager
 * 
 * Shows/hides loading indicators during async operations
 */

/**
 * Show loading overlay
 * @param {string} message - Optional message to display
 */
export function showLoading(message = 'Loading...') {
    if (typeof document === 'undefined') return;
    
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <div class="loading-message"></div>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    const messageEl = overlay.querySelector('.loading-message');
    if (messageEl) {
        messageEl.textContent = message;
    }
    
    overlay.style.display = 'flex';
}

/**
 * Hide loading overlay
 */
export function hideLoading() {
    if (typeof document === 'undefined') return;
    
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

/**
 * Execute async function with loading indicator
 * @param {Function} asyncFn - Async function to execute
 * @param {string} message - Loading message
 */
export async function withLoading(asyncFn, message = 'Loading...') {
    showLoading(message);
    try {
        const result = await asyncFn();
        return result;
    } finally {
        hideLoading();
    }
}

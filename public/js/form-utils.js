/**
 * Shared form utilities
 * Common functions used across intake and feedback forms
 */

(function() {
    'use strict';

    /**
     * Safe JSON parse from fetch response with error handling
     * @param {Response} response - Fetch response object
     * @returns {Promise<Object>} Parsed JSON or error object
     */
    async function safeParseJSON(response) {
        try {
            const text = await response.text();
            if (!text) {
                return { success: false, message: 'Empty response from server' };
            }
            return JSON.parse(text);
        } catch (e) {
            console.error('JSON parse error:', e);
            return { success: false, message: 'Invalid response from server' };
        }
    }

    /**
     * Show/hide loading overlay with progress steps
     * @param {boolean|string} show - true to show, false to hide, or string message
     * @param {string} [message] - Optional custom message
     */
    function showLoading(show, message) {
        let overlay = document.querySelector('.loading-overlay');

        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.setAttribute('role', 'status');
            overlay.setAttribute('aria-live', 'polite');
            overlay.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p class="loading-message">Processing...</p>
                </div>
            `;
            document.body.appendChild(overlay);
        }

        const messageEl = overlay.querySelector('.loading-message');

        if (show) {
            const displayMessage = typeof show === 'string' ? show : (message || 'Processing...');
            if (messageEl) messageEl.textContent = displayMessage;
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }

    /**
     * Update loading message without hiding overlay
     * @param {string} message - New message to display
     */
    function updateLoadingMessage(message) {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            const messageEl = overlay.querySelector('.loading-message');
            if (messageEl) messageEl.textContent = message;
        }
    }

    /**
     * Show inline validation error for a field
     * @param {string} fieldId - ID of the field
     * @param {string} message - Error message
     */
    function showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorEl = document.getElementById('error-' + fieldId);

        if (field) {
            field.classList.add('is-invalid');
            field.setAttribute('aria-invalid', 'true');
        }

        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
            if (field) {
                field.setAttribute('aria-describedby', errorEl.id);
            }
        }
    }

    /**
     * Clear inline validation error for a field
     * @param {string} fieldId - ID of the field
     */
    function clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        const errorEl = document.getElementById('error-' + fieldId);

        if (field) {
            field.classList.remove('is-invalid');
            field.removeAttribute('aria-invalid');
            field.removeAttribute('aria-describedby');
        }

        if (errorEl) {
            errorEl.textContent = '';
            errorEl.style.display = 'none';
        }
    }

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} [type='error'] - Type: 'error', 'success', 'info'
     * @param {number} [duration=5000] - Duration in ms
     */
    function showToast(message, type = 'error', duration = 5000) {
        let toast = document.getElementById('formToast');

        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'formToast';
            toast.className = 'validation-toast';
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'polite');
            toast.innerHTML = `
                <span class="validation-toast-icon">!</span>
                <span class="validation-toast-message"></span>
                <button type="button" class="validation-toast-close" aria-label="Dismiss">&times;</button>
            `;
            document.body.appendChild(toast);

            toast.querySelector('.validation-toast-close').addEventListener('click', () => {
                toast.classList.remove('visible');
            });
        }

        const icon = toast.querySelector('.validation-toast-icon');
        const messageEl = toast.querySelector('.validation-toast-message');

        // Update icon based on type
        if (type === 'success') {
            icon.textContent = '✓';
            toast.style.background = '#2e7d32';
        } else if (type === 'info') {
            icon.textContent = 'i';
            toast.style.background = '#1976d2';
        } else {
            icon.textContent = '!';
            toast.style.background = '#d32f2f';
        }

        messageEl.textContent = message;
        toast.classList.add('visible');

        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => {
            toast.classList.remove('visible');
        }, duration);
    }

    // Expose utilities globally
    window.FormUtils = {
        safeParseJSON,
        showLoading,
        updateLoadingMessage,
        showFieldError,
        clearFieldError,
        showToast
    };
})();

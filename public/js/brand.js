// Brand Theming for Flexion & Flow
// Simplified - single brand only

const FORM_TYPE_STORAGE_KEY = 'selectedFormType';

/**
 * Get the brand (always returns 'flexion')
 * @returns {'flexion'}
 */
function getSelectedBrand() {
    return 'flexion';
}

/**
 * Apply brand theming to the page
 * Always applies Flexion & Flow theme
 */
function applyBrandTheme() {
    document.body.setAttribute('data-brand', 'flexion');
    document.documentElement.setAttribute('data-brand', 'flexion');
}

/**
 * Get the display name for the brand
 * @returns {string}
 */
function getBrandDisplayName() {
    return 'Flexion & Flow';
}

/**
 * Initialize brand theming on page load
 * @returns {'flexion'}
 */
function initBrandTheme() {
    applyBrandTheme();
    return 'flexion';
}

/**
 * Get the currently selected form type from localStorage
 * @returns {'seated' | 'table' | null}
 */
function getSelectedFormType() {
    try {
        return localStorage.getItem(FORM_TYPE_STORAGE_KEY);
    } catch (e) {
        console.warn('localStorage not available:', e);
        return null;
    }
}

/**
 * Set the selected form type in localStorage
 * @param {'seated' | 'table'} formType
 */
function setSelectedFormType(formType) {
    try {
        localStorage.setItem(FORM_TYPE_STORAGE_KEY, formType);
    } catch (e) {
        console.warn('localStorage not available:', e);
    }
}

/**
 * Clear the selected form type from localStorage
 */
function clearSelectedFormType() {
    try {
        localStorage.removeItem(FORM_TYPE_STORAGE_KEY);
    } catch (e) {
        console.warn('localStorage not available:', e);
    }
}

/**
 * Get the display name for a form type
 * @param {'seated' | 'table' | null} formType
 * @returns {string}
 */
function getFormTypeDisplayName(formType) {
    switch (formType) {
        case 'table':
            return 'Table Massage Intake';
        case 'seated':
        default:
            return 'Seated Chair Massage Intake';
    }
}

// Auto-initialize Flexion & Flow theme on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    applyBrandTheme();
});

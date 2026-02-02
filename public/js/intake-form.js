// Intake Form Validation and Submission
document.addEventListener('DOMContentLoaded', () => {
        // Allow unselecting the 'I feel well today' button
        const feelWellRadio = document.getElementById('feelWellRadio');
        const feelWellToggle = document.getElementById('feelWellToggle');
        if (feelWellRadio && feelWellToggle) {
            feelWellToggle.addEventListener('click', () => {
                if (feelWellRadio.checked) {
                    feelWellRadio.checked = false;
                    feelWellToggle.classList.remove('active');
                } else {
                    feelWellRadio.checked = true;
                    feelWellToggle.classList.add('active');
                }
            });
            // Set initial state
            if (feelWellRadio.checked) {
                feelWellToggle.classList.add('active');
            }
        }
    const form = document.getElementById('intakeForm');
    const submitBtn = document.getElementById('submitBtn');

    if (!form) return;

    // Progressive disclosure for Other fields (checkboxes)
    // Health red-flag banner and 'no issues' mutual exclusivity
    const healthChecks = Array.from(document.querySelectorAll('input[name="healthChecks"]'));
    const healthBanner = document.getElementById('healthBanner');
    const noHealthIssues = document.getElementById('noHealthIssues');

    const updateHealthBanner = () => {
        const anyChecked = healthChecks.some(cb => cb.checked);
        if (anyChecked) {
            healthBanner.classList.remove('hidden-field');
            healthBanner.style.display = 'block';
        } else {
            healthBanner.classList.add('hidden-field');
            healthBanner.style.display = 'none';
            const note = document.getElementById('reviewNote');
            if (note) note.value = '';
        }
    };

    // When 'I feel well today' is checked, clear other health checks. If any health check selected, clear 'no issues'
    healthChecks.forEach(cb => cb.addEventListener('change', () => {
        if (cb.checked && noHealthIssues && noHealthIssues.checked) {
            noHealthIssues.checked = false;
        }
        updateHealthBanner();
    }));

    if (noHealthIssues) {
        noHealthIssues.addEventListener('change', () => {
            if (noHealthIssues.checked) {
                healthChecks.forEach(cb => cb.checked = false);
                updateHealthBanner();
            }
        });
    }

    updateHealthBanner();

    // Table-specific field conditional visibility
    const tableOilPreferenceRadios = Array.from(document.querySelectorAll('input[name="tableOilPreference"]'));
    const tableOilAllergySection = document.getElementById('tableOilAllergySection');
    const tablePositionComfortRadios = Array.from(document.querySelectorAll('input[name="tablePositionComfort"]'));
    const tablePositionDetailsSection = document.getElementById('tablePositionDetailsSection');

    const updateTableOilAllergyVisibility = () => {
        const sensitiveRadio = document.querySelector('input[name="tableOilPreference"][value="sensitive"]');
        if (sensitiveRadio && tableOilAllergySection) {
            if (sensitiveRadio.checked) {
                tableOilAllergySection.classList.remove('hidden-field');
                tableOilAllergySection.style.display = 'block';
            } else {
                tableOilAllergySection.classList.add('hidden-field');
                tableOilAllergySection.style.display = 'none';
                // Clear field when hidden
                const allergyDetails = document.getElementById('tableOilAllergyDetails');
                if (allergyDetails) allergyDetails.value = '';
                const allergyError = document.getElementById('error-tableOilAllergyDetails');
                if (allergyError) allergyError.textContent = '';
            }
        }
    };

    const updateTablePositionDetailsVisibility = () => {
        const troubleRadio = document.querySelector('input[name="tablePositionComfort"][value="trouble"]');
        if (troubleRadio && tablePositionDetailsSection) {
            if (troubleRadio.checked) {
                tablePositionDetailsSection.classList.remove('hidden-field');
                tablePositionDetailsSection.style.display = 'block';
            } else {
                tablePositionDetailsSection.classList.add('hidden-field');
                tablePositionDetailsSection.style.display = 'none';
                // Clear field when hidden
                const positionDetails = document.getElementById('tablePositionDetails');
                if (positionDetails) positionDetails.value = '';
                const positionError = document.getElementById('error-tablePositionDetails');
                if (positionError) positionError.textContent = '';
            }
        }
    };

    // Add event listeners for table field visibility
    tableOilPreferenceRadios.forEach(radio => {
        radio.addEventListener('change', updateTableOilAllergyVisibility);
    });

    tablePositionComfortRadios.forEach(radio => {
        radio.addEventListener('change', updateTablePositionDetailsVisibility);
    });

    // Initialize table field visibility on load
    updateTableOilAllergyVisibility();
    updateTablePositionDetailsVisibility();

    // Auto-expand avoidNotes textarea
    const avoidNotes = document.getElementById('avoidNotes');
    if (avoidNotes) {
        const resize = () => {
            avoidNotes.style.height = 'auto';
            avoidNotes.style.height = (avoidNotes.scrollHeight) + 'px';
        };
        avoidNotes.addEventListener('input', resize);
        // initialize
        setTimeout(resize, 0);
    }

    // Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitForm('submitted');
    });

    async function submitForm(status) {
        // Validate combined consent
        const consentAllEl = document.getElementById('consentAll');

        if (!consentAllEl) {
            alert('Consent field is not available. Please reload the page.');
            return;
        }

        if (!consentAllEl.checked) {
            alert('Please confirm you have read and agreed to the Terms and consent to treatment.');
            return;
        }

        // Get drawn signature data (if any)
        const sigField = document.getElementById('signatureData');
        const signedAtField = document.getElementById('signedAt');

        // Capture drawn signature if canvas has content
        if (window.signaturePad && window.signaturePad.hasDrawnContent()) {
            const signatureData = window.signaturePad.toDataURL();
            if (sigField) sigField.value = signatureData;
            if (signedAtField) signedAtField.value = new Date().toISOString();
        }

        // Collect form data
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            if (data[key]) {
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        });

        // Normalize phone number to canonical +61 format
        if (data['mobile'] && window.AUPhoneFormatter) {
            const canonical = AUPhoneFormatter.normalizeToCanonical(data['mobile']);
            if (canonical) {
                data['mobile'] = canonical;
            }
        }

        // Normalize health checks to array and include otherHealthConcernText if present
        if (data['healthChecks']) {
            data['healthChecks'] = Array.isArray(data['healthChecks']) ? data['healthChecks'] : [data['healthChecks']];
        }
        if (data['otherHealthConcernText'] && data['otherHealthConcernText'].trim()) {
            data['healthChecks'] = data['healthChecks'] ? data['healthChecks'].concat([`Other: ${data['otherHealthConcernText'].trim()}`]) : [`Other: ${data['otherHealthConcernText'].trim()}`];
        }

        // Ensure 'noHealthIssues' represented
        if (document.getElementById('noHealthIssues') && document.getElementById('noHealthIssues').checked) {
            data['healthChecks'] = ['No issues to report'];
        }

        // Ensure combined consent and opt-in booleans are included
        data.consentAll = !!document.getElementById('consentAll') && document.getElementById('consentAll').checked;
        data.emailOptIn = !!document.getElementById('emailOptIn') && document.getElementById('emailOptIn').checked;

        // Capture the rendered muscle map canvas as an image
        const muscleCanvas = document.querySelector('.muscle-map-canvas');
        if (muscleCanvas && window.muscleMap && window.muscleMap.marks.length > 0) {
            try {
                data.muscleMapImage = muscleCanvas.toDataURL('image/png');
            } catch (e) {
                console.warn('Could not capture muscle map canvas:', e);
            }
        }

        // Metadata
        const nowIso = new Date().toISOString();
        data.submissionDate = nowIso;
        data.createdAt = nowIso;
        data.updatedAt = nowIso;
        data.status = status;
        // Use formType from hidden field, or get from localStorage, default to 'seated'
        data.formType = document.getElementById('formType')?.value || (typeof getSelectedFormType === 'function' ? getSelectedFormType() : 'seated') || 'seated';

        // Ensure selectedBrand is included (from hidden field or localStorage)
        if (!data.selectedBrand && typeof getSelectedBrand === 'function') {
            data.selectedBrand = getSelectedBrand() || 'flexion';
        }

        // Show loading with progress steps
        const showLoading = window.FormUtils ? window.FormUtils.showLoading : fallbackShowLoading;
        const updateLoadingMessage = window.FormUtils ? window.FormUtils.updateLoadingMessage : () => {};
        const safeParseJSON = window.FormUtils ? window.FormUtils.safeParseJSON : async (r) => r.json();
        const showToast = window.FormUtils ? window.FormUtils.showToast : (msg) => alert(msg);

        showLoading('Validating your information...');

        try {
            updateLoadingMessage('Submitting your form...');

            const response = await fetch('/api/submit-form', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            updateLoadingMessage('Processing response...');
            const result = await safeParseJSON(response);

            if (response.ok && result.success) {
                updateLoadingMessage('Success! Redirecting...');
                window.location.href = '/success';
            } else {
                showLoading(false);
                showToast(result.message || 'An error occurred. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Submission error:', error);
            showLoading(false);
            showToast('A network error occurred. Please check your connection and try again.', 'error');
        }
    }
});

// Fallback loading function if form-utils.js isn't loaded
function fallbackShowLoading(show) {
    let overlay = document.querySelector('.loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.setAttribute('role', 'status');
        overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p class="loading-message">Processing...</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    if (show) {
        const messageEl = overlay.querySelector('.loading-message');
        if (messageEl) messageEl.textContent = typeof show === 'string' ? show : 'Processing...';
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

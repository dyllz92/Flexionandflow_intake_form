(function() {
    'use strict';

    const TOTAL_STEPS = 4;
    let currentStep = 1;

    // DOM Elements
    let steps, stepIndicators, prevBtn, nextBtn, submitBtn, validationToast;

    // Step validation rules
    const stepValidation = {
        1: () => {
            // Step 1: fullName, mobile, aoRole, firstTimeAOWellness, therapistName required
            const fullName = document.getElementById('fullName');
            const mobile = document.getElementById('mobile');
            const aoRole = document.getElementById('aoRole');
            const firstTimeAOWellness = document.querySelectorAll('input[name="firstTimeAOWellness"]');
            const therapistName = document.querySelectorAll('input[name="therapistName"]');

            const nameValid = fullName && fullName.value.trim().length > 0;
            const mobileValid = mobile && mobile.value.trim().length > 0;
            const aoRoleValid = aoRole && aoRole.value.trim().length > 0;
            const firstTimeValid = Array.from(firstTimeAOWellness).some(r => r.checked);
            const therapistValid = Array.from(therapistName).some(r => r.checked);

            // If aoRole is "Other", also require aoRoleOther
            if (aoRole && aoRole.value === 'Other') {
                const aoRoleOther = document.getElementById('aoRoleOther');
                if (!aoRoleOther || !aoRoleOther.value.trim().length) return false;
            }

            return nameValid && mobileValid && aoRoleValid && firstTimeValid && therapistValid;
        },
        2: () => {
            // Step 2: pressure preference required (body map optional)
            const pressureInputs = document.querySelectorAll('input[name="pressurePreference"]');
            const pressureValid = Array.from(pressureInputs).some(p => p.checked);

            if (!pressureValid) return false;

            // If table form, check table-specific fields
            const formType = document.getElementById('formType')?.value || (typeof getSelectedFormType === 'function' ? getSelectedFormType() : 'seated') || 'seated';
            if (formType === 'table') {
                // Check oil preference
                const oilInputs = document.querySelectorAll('input[name="tableOilPreference"]');
                const oilValid = Array.from(oilInputs).some(p => p.checked);
                if (!oilValid) return false;

                // If sensitive, check allergy details
                const sensitiveRadio = document.querySelector('input[name="tableOilPreference"][value="sensitive"]');
                if (sensitiveRadio && sensitiveRadio.checked) {
                    const allergyDetails = document.getElementById('tableOilAllergyDetails');
                    if (!allergyDetails || !allergyDetails.value.trim().length) return false;
                }

                // Check position comfort
                const positionInputs = document.querySelectorAll('input[name="tablePositionComfort"]');
                const positionValid = Array.from(positionInputs).some(p => p.checked);
                if (!positionValid) return false;

                // If trouble, check position details
                const troubleRadio = document.querySelector('input[name="tablePositionComfort"][value="trouble"]');
                if (troubleRadio && troubleRadio.checked) {
                    const positionDetails = document.getElementById('tablePositionDetails');
                    if (!positionDetails || !positionDetails.value.trim().length) return false;
                }
            }

            return true;
        },
        3: () => {
            // Step 3: if any health issues selected (except "no health issues"), additional info is required
            const healthChecks = Array.from(document.querySelectorAll('input[name="healthChecks"]:checked'));
            const noHealthIssues = document.getElementById('noHealthIssues');
            const reviewNote = document.getElementById('reviewNote');

            // If no issues selected OR only "no health issues" is selected, step is valid
            if (healthChecks.length === 0) return true;
            if (healthChecks.length === 1 && healthChecks[0].id === 'noHealthIssues') return true;

            // If health issues are selected, reviewNote is required
            return reviewNote && reviewNote.value.trim().length > 0;
        },
        4: () => {
            // Step 4: combined consent required (signature optional)
            const consentAll = document.getElementById('consentAll');
            return consentAll && consentAll.checked;
        }
    };

    // Initialize wizard
    function init() {
        steps = document.querySelectorAll('.wizard-step');
        stepIndicators = document.querySelectorAll('.step-indicator .step');
        prevBtn = document.getElementById('prevBtn');
        nextBtn = document.getElementById('nextBtn');
        submitBtn = document.getElementById('submitBtn');

        if (!steps.length || !stepIndicators.length) {
            console.warn('Wizard elements not found');
            return;
        }

        // Create validation toast element
        createValidationToast();

        // Set up event listeners
        if (prevBtn) prevBtn.addEventListener('click', goToPrevStep);
        if (nextBtn) nextBtn.addEventListener('click', goToNextStep);

        // Listen for validation changes to update button states
        document.addEventListener('input', updateButtonStates);
        document.addEventListener('change', updateButtonStates);

        // Listen for signature:changed custom event (works regardless of script load order)
        document.addEventListener('signature:changed', updateButtonStates);

        // Initial state
        showStep(1);
        updateButtonStates();
    }

    // Show specific step
    function showStep(stepNum) {
        currentStep = stepNum;

        // Hide all steps, show current
        steps.forEach((step, index) => {
            const stepNumber = parseInt(step.dataset.step);
            if (stepNumber === currentStep) {
                step.classList.add('active');
                step.style.display = 'block';
            } else {
                step.classList.remove('active');
                step.style.display = 'none';
            }
        });

        // Update step indicators
        stepIndicators.forEach(indicator => {
            const indicatorStep = parseInt(indicator.dataset.step);
            indicator.classList.remove('active', 'completed');

            if (indicatorStep === currentStep) {
                indicator.classList.add('active');
            } else if (indicatorStep < currentStep) {
                indicator.classList.add('completed');
            }
        });

        // Scroll to top of form
        const formHeader = document.querySelector('.form-header');
        if (formHeader) {
            formHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        updateButtonStates();

        // Update textual step count (e.g., "Step 2 of 6")
        const stepCountEl = document.getElementById('stepCount');
        if (stepCountEl) {
            stepCountEl.textContent = `Step ${currentStep} of ${TOTAL_STEPS}`;
        }

        // Ensure muscle map redraw on step 2 (if muscleMap instance exists)
        if (currentStep === 2 && window.muscleMap && typeof window.muscleMap.redrawDots === 'function') {
            setTimeout(() => {
                try { window.muscleMap.redrawDots(); } catch (e) { /* ignore */ }
            }, 100);
        }

        // Ensure signature pad is resized/available on step 4 (signature step)
        if (currentStep === 4 && window.signaturePad) {
            setTimeout(() => {
                try {
                    // Resize canvas and re-setup drawing settings
                    if (typeof window.signaturePad.resizeCanvas === 'function') {
                        window.signaturePad.resizeCanvas();
                    }
                    if (typeof window.signaturePad.setupCanvas === 'function') {
                        window.signaturePad.setupCanvas();
                    }
                } catch (e) { /* ignore */ }
            }, 100);
        }
    }

    // Go to previous step
    function goToPrevStep() {
        if (currentStep > 1) {
            showStep(currentStep - 1);
        }
    }

    // Go to next step
    function goToNextStep() {
        // Validate current step before proceeding
        if (!validateCurrentStep()) {
            showValidationErrors();
            return;
        }

        if (currentStep < TOTAL_STEPS) {
            showStep(currentStep + 1);
        }
    }

    // Validate current step
    function validateCurrentStep() {
        const validator = stepValidation[currentStep];
        return validator ? validator() : true;
    }

    // Show validation errors for current step
    function showValidationErrors() {
        let message = '';

        switch (currentStep) {
            case 1: {
                const fullName = document.getElementById('fullName');
                const mobile = document.getElementById('mobile');
                const aoRole = document.getElementById('aoRole');
                const aoRoleOther = document.getElementById('aoRoleOther');
                const firstTimeAOWellness = document.querySelectorAll('input[name="firstTimeAOWellness"]');
                const therapistName = document.querySelectorAll('input[name="therapistName"]');

                if (!fullName || !fullName.value.trim()) message = 'Please enter your full name.';
                else if (!mobile || !mobile.value.trim()) message = 'Please enter your mobile number.';
                else if (!aoRole || !aoRole.value.trim()) message = 'Please select your role at AO.';
                else if (aoRole.value === 'Other' && (!aoRoleOther || !aoRoleOther.value.trim())) message = 'Please specify your role.';
                else if (!Array.from(firstTimeAOWellness).some(r => r.checked)) message = 'Please indicate if this is your first time with AO wellness.';
                else if (!Array.from(therapistName).some(r => r.checked)) message = 'Please select your therapist.';
                break;
            }
            case 2: {
                // Step 2 can have different validation messages based on form type
                const pressureInputs = document.querySelectorAll('input[name="pressurePreference"]');
                const pressureValid = Array.from(pressureInputs).some(p => p.checked);

                if (!pressureValid) {
                    message = 'Please select a pressure preference.';
                    break;
                }

                const formType = document.getElementById('formType')?.value || (typeof getSelectedFormType === 'function' ? getSelectedFormType() : 'seated') || 'seated';
                if (formType === 'table') {
                    // Table-specific validation
                    const oilInputs = document.querySelectorAll('input[name="tableOilPreference"]');
                    const oilValid = Array.from(oilInputs).some(p => p.checked);
                    if (!oilValid) {
                        message = 'Please select an oil/skin contact preference.';
                        break;
                    }

                    const sensitiveRadio = document.querySelector('input[name="tableOilPreference"][value="sensitive"]');
                    if (sensitiveRadio && sensitiveRadio.checked) {
                        const allergyDetails = document.getElementById('tableOilAllergyDetails');
                        const allergyError = document.getElementById('error-tableOilAllergyDetails');
                        if (!allergyDetails || !allergyDetails.value.trim()) {
                            message = 'Please provide allergy/sensitivity details.';
                            if (allergyError) {
                                allergyError.textContent = message;
                                allergyError.style.display = 'block';
                            }
                            break;
                        }
                    }

                    const positionInputs = document.querySelectorAll('input[name="tablePositionComfort"]');
                    const positionValid = Array.from(positionInputs).some(p => p.checked);
                    if (!positionValid) {
                        message = 'Please select position comfort preference.';
                        break;
                    }

                    const troubleRadio = document.querySelector('input[name="tablePositionComfort"][value="trouble"]');
                    if (troubleRadio && troubleRadio.checked) {
                        const positionDetails = document.getElementById('tablePositionDetails');
                        const positionError = document.getElementById('error-tablePositionDetails');
                        if (!positionDetails || !positionDetails.value.trim()) {
                            message = 'Please provide position details.';
                            if (positionError) {
                                positionError.textContent = message;
                                positionError.style.display = 'block';
                            }
                            break;
                        }
                    }
                }
                break;
            }
            case 3: {
                // Check if any health issues are indicated
                const healthChecks = Array.from(document.querySelectorAll('input[name="healthChecks"]:checked'));
                const noHealthIssues = document.getElementById('noHealthIssues');
                const reviewNote = document.getElementById('reviewNote');
                const errorReviewNote = document.getElementById('error-reviewNote');

                // Clear previous error
                if (errorReviewNote) errorReviewNote.textContent = '';

                // If any health issues are checked (except "no issues"), reviewNote is required
                const hasHealthIssues = healthChecks.length > 0 && !(healthChecks.length === 1 && healthChecks[0].id === 'noHealthIssues');

                if (hasHealthIssues && reviewNote && !reviewNote.value.trim()) {
                    message = 'Please provide additional information about your health concerns.';
                    if (errorReviewNote) {
                        errorReviewNote.textContent = message;
                        errorReviewNote.style.display = 'block';
                    }
                    // Focus on the field and scroll into view
                    reviewNote.focus();
                    reviewNote.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                break;
            }
            case 4: {
                const consentAll = document.getElementById('consentAll');
                if (!consentAll || !consentAll.checked) message = 'Please confirm you have read and agreed to the Terms and consent to treatment.';
                break;
            }
        }

        if (message) {
            showValidationToast(message);
        }
    }

    // Create accessible validation toast element
    function createValidationToast() {
        if (document.getElementById('validationToast')) return;

        validationToast = document.createElement('div');
        validationToast.id = 'validationToast';
        validationToast.className = 'validation-toast';
        validationToast.setAttribute('role', 'alert');
        validationToast.setAttribute('aria-live', 'polite');
        validationToast.innerHTML = `
            <span class="validation-toast-icon">!</span>
            <span class="validation-toast-message"></span>
            <button type="button" class="validation-toast-close" aria-label="Dismiss">&times;</button>
        `;
        document.body.appendChild(validationToast);

        // Close button handler
        validationToast.querySelector('.validation-toast-close').addEventListener('click', hideValidationToast);
    }

    // Show validation toast with message
    function showValidationToast(message) {
        if (!validationToast) createValidationToast();

        const messageEl = validationToast.querySelector('.validation-toast-message');
        messageEl.textContent = message;

        validationToast.classList.add('visible');

        // Auto-hide after 5 seconds
        clearTimeout(validationToast._timeout);
        validationToast._timeout = setTimeout(hideValidationToast, 5000);
    }

    // Hide validation toast
    function hideValidationToast() {
        if (validationToast) {
            validationToast.classList.remove('visible');
        }
    }

    // Update button visibility and states
    function updateButtonStates() {
        if (!prevBtn || !nextBtn || !submitBtn) return;

        // Previous button: hidden on step 1
        prevBtn.style.display = currentStep === 1 ? 'none' : 'block';

        // Next button: visible on steps 1-4, hidden on step 5
        nextBtn.style.display = currentStep < TOTAL_STEPS ? 'block' : 'none';

        // Submit button: visible only on step 5
        submitBtn.style.display = currentStep === TOTAL_STEPS ? 'block' : 'none';

        // Enable/disable next button based on validation
        if (currentStep < TOTAL_STEPS) {
            nextBtn.disabled = !validateCurrentStep();
        }

        // Enable/disable submit button
        if (currentStep === TOTAL_STEPS) {
            submitBtn.disabled = !validateCurrentStep();
        }
    }

    // Get current step (for external use)
    function getCurrentStep() {
        return currentStep;
    }

    // Go to specific step (for external use)
    function goToStep(stepNum) {
        if (stepNum >= 1 && stepNum <= TOTAL_STEPS) {
            showStep(stepNum);
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose wizard API
    window.wizard = {
        getCurrentStep,
        goToStep,
        goToNextStep,
        goToPrevStep,
        updateButtonStates,
        validateCurrentStep
    };
})();

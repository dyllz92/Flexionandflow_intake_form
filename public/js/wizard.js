(function() {
    'use strict';

    const TOTAL_STEPS = 6;

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

        // Ensure signature pad is resized/available on step 5 (signature step)
        if (currentStep === 5 && window.signaturePad && typeof window.signaturePad.resizeCanvas === 'function') {
            setTimeout(() => {
                try { window.signaturePad.resizeCanvas(); } catch (e) { /* ignore */ }
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
            case 1:
                const fullName = document.getElementById('fullName');
// Wizard Step Navigation
(function() {
    'use strict';

    const TOTAL_STEPS = 6;
    let currentStep = 1;

    // DOM Elements
    let steps, stepIndicators, prevBtn, nextBtn, submitBtn;

    // Step validation rules
    const stepValidation = {
        1: () => {
            // Step 1: fullName + mobile required
            const fullName = document.getElementById('fullName');
            const mobile = document.getElementById('mobile');
            const nameValid = fullName && fullName.value.trim().length > 0;
            const mobileValid = mobile && mobile.value.trim().length > 0;
            return nameValid && mobileValid;
        },
        2: () => {
            // Step 2: pressure preference required (body map optional)
            const pressureInputs = document.querySelectorAll('input[name="pressurePreference"]');
            return Array.from(pressureInputs).some(p => p.checked);
        },
        3: () => {
            // Step 3: health check optional
            return true;
        },
        4: () => {
            // Step 4: anything to avoid optional
            return true;
        },
        5: () => {
            // Step 5: combined consent + signature required
            const consentAll = document.getElementById('consentAll');
            const signatureValid = window.signaturePad && !window.signaturePad.isEmpty();
            return consentAll && consentAll.checked && signatureValid;
        },
        6: () => {
            // Step 6: marketing opt-in optional; submission still requires consentAll + signature
            const consentAll = document.getElementById('consentAll');
            const signatureValid = window.signaturePad && !window.signaturePad.isEmpty();
            return consentAll && consentAll.checked && signatureValid;
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

        // Set up event listeners
        if (prevBtn) prevBtn.addEventListener('click', goToPrevStep);
        if (nextBtn) nextBtn.addEventListener('click', goToNextStep);

        // Listen for validation changes to update button states
        document.addEventListener('input', updateButtonStates);
        document.addEventListener('change', updateButtonStates);

        // Listen for signature changes
        if (window.signaturePad) {
            const canvas = document.getElementById('signatureCanvas');
            if (canvas) {
                canvas.addEventListener('mouseup', updateButtonStates);
                canvas.addEventListener('touchend', updateButtonStates);
            }
        }

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

        // Ensure signature pad is resized/available on step 5 (signature step)
        if (currentStep === 5 && window.signaturePad && typeof window.signaturePad.resizeCanvas === 'function') {
            setTimeout(() => {
                try { window.signaturePad.resizeCanvas(); } catch (e) { /* ignore */ }
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
            case 1:
                const fullName = document.getElementById('fullName');
                const mobile = document.getElementById('mobile');
                const genderSelected = Array.from(document.querySelectorAll('input[name="gender"]')).some(g => g.checked);
                const ageConfirm = document.getElementById('ageConfirm18Plus');

                if (!fullName || !fullName.value.trim()) message = 'Please enter your full name.';
                else if (!mobile || !mobile.value.trim()) message = 'Please enter your mobile number.';
                else if (!genderSelected) message = 'Please select your gender.';
                else if (!ageConfirm || !ageConfirm.checked) message = 'Please confirm you are 18 years or older.';
                break;
            case 2:
                message = 'Please mark at least one area on the body chart.';
                break;
            case 3:
                const reasonsChecked = Array.from(document.querySelectorAll('input[name="reasonsToday"]:checked'));
                const consentAreasChecked = Array.from(document.querySelectorAll('input[name="consentAreas"]:checked'));
                
                if (reasonsChecked.length === 0) message = 'Please select at least one reason for your visit.';
                else if (consentAreasChecked.length === 0) message = 'Please select at least one area you consent to treatment for.';
                break;
            case 5:
                const consentAll = document.getElementById('consentAll');
                const signatureValid = window.signaturePad && !window.signaturePad.isEmpty();
                if (!consentAll || !consentAll.checked) message = 'Please confirm you have read and agreed to the Terms and consent to treatment.';
                else if (!signatureValid) message = 'Please provide your signature.';
                break;
            case 6:
                const consentAll = document.getElementById('consentAll');
                const signatureValid2 = window.signaturePad && !window.signaturePad.isEmpty();

                if (!consentAll || !consentAll.checked) message = 'Please confirm you have read and agreed to the Terms and consent to treatment.';
                else if (!signatureValid2) message = 'Please provide your signature.';
                break;
        }

        if (message) {
            alert(message);
        }
    }

    // Update button visibility and states
    function updateButtonStates() {
        if (!prevBtn || !nextBtn || !submitBtn) return;

        // Previous button: hidden on step 1
        prevBtn.style.display = currentStep === 1 ? 'none' : 'block';

        // Next button: visible on steps 1-5, hidden on step 6
        nextBtn.style.display = currentStep < TOTAL_STEPS ? 'block' : 'none';

        // Submit button: visible only on step 6
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
                const mobile = document.getElementById('mobile');
                const genderSelected = Array.from(document.querySelectorAll('input[name="gender"]')).some(g => g.checked);
                const ageConfirm = document.getElementById('ageConfirm18Plus');

                if (!fullName || !fullName.value.trim()) message = 'Please enter your full name.';
                else if (!mobile || !mobile.value.trim()) message = 'Please enter your mobile number.';
                else if (!genderSelected) message = 'Please select your gender.';
                else if (!ageConfirm || !ageConfirm.checked) message = 'Please confirm you are 18 years or older.';
                break;
            case 2:
                message = 'Please mark at least one area on the body chart.';
                break;
            case 3:
                const reasonsChecked = Array.from(document.querySelectorAll('input[name="reasonsToday"]:checked'));
                const consentAreasChecked = Array.from(document.querySelectorAll('input[name="consentAreas"]:checked'));
                
                if (reasonsChecked.length === 0) message = 'Please select at least one reason for your visit.';
                else if (consentAreasChecked.length === 0) message = 'Please select at least one area you consent to treatment for.';
                break;
            case 5:
                const consentAll = document.getElementById('consentAll');
                const signatureValid = window.signaturePad && !window.signaturePad.isEmpty();
                if (!consentAll || !consentAll.checked) message = 'Please confirm you have read and agreed to the Terms and consent to treatment.';
                else if (!signatureValid) message = 'Please provide your signature.';
                break;
            case 6:
                const consentAll = document.getElementById('consentAll');
                const signatureValid2 = window.signaturePad && !window.signaturePad.isEmpty();

                if (!consentAll || !consentAll.checked) message = 'Please confirm you have read and agreed to the Terms and consent to treatment.';
                else if (!signatureValid2) message = 'Please provide your signature.';
                break;
        }

        if (message) {
            alert(message);
        }
    }

    // Update button visibility and states
    function updateButtonStates() {
        if (!prevBtn || !nextBtn || !submitBtn) return;

        // Previous button: hidden on step 1
        prevBtn.style.display = currentStep === 1 ? 'none' : 'block';

        // Next button: visible on steps 1-5, hidden on step 6
        nextBtn.style.display = currentStep < TOTAL_STEPS ? 'block' : 'none';

        // Submit button: visible only on step 6
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

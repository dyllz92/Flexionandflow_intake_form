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
            // Step 1: Details - fullName, mobile, gender, 18+ confirmation required
            const fullName = document.getElementById('fullName');
            const mobile = document.getElementById('mobile');
            const genderInputs = document.querySelectorAll('input[name="gender"]');
            const ageConfirm = document.getElementById('ageConfirm18Plus');

            const genderSelected = Array.from(genderInputs).some(g => g.checked);
            const nameValid = fullName && fullName.value.trim().length > 0;
            const mobileValid = mobile && mobile.value.trim().length > 0;
            const ageValid = ageConfirm && ageConfirm.checked;

            return nameValid && mobileValid && genderSelected && ageValid;
        },
        2: () => {
            // Step 2: Body Map - at least one mark required
            const muscleMapInput = document.getElementById('muscleMapMarks');
            if (muscleMapInput) {
                const marks = JSON.parse(muscleMapInput.value || '[]');
                return marks.length > 0;
            }
            return true;
        },
        3: () => {
            // Step 3: Today's Focus - at least one reason and one consent area required
            const reasonsChecked = Array.from(document.querySelectorAll('input[name="reasonsToday"]:checked'));
            const consentAreasChecked = Array.from(document.querySelectorAll('input[name="consentAreas"]:checked'));
            return reasonsChecked.length > 0 && consentAreasChecked.length > 0;
        },
        4: () => {
            // Step 4: Health Check - optional, always valid
            return true;
        },
        5: () => {
            // Step 5: Preferences - pressure preference required
            const pressureInputs = document.querySelectorAll('input[name="pressurePreference"]');
            return Array.from(pressureInputs).some(p => p.checked);
        },
        6: () => {
            // Step 6: Consent - consent checkbox and signature required
            const consentGiven = document.getElementById('consentGiven');
            const signatureValid = window.signaturePad && !window.signaturePad.isEmpty();
            return consentGiven && consentGiven.checked && signatureValid;
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

        // Re-initialize muscle map if on step 2
        if (currentStep === 2 && window.initMuscleMap) {
            setTimeout(() => {
                window.initMuscleMap();
            }, 100);
        }

        // Re-initialize signature pad if on step 6
        if (currentStep === 6 && window.initSignaturePad) {
            setTimeout(() => {
                window.initSignaturePad();
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
                message = 'Please select your pressure preference.';
                break;
            case 6:
                const consentGiven = document.getElementById('consentGiven');
                const signatureValid = window.signaturePad && !window.signaturePad.isEmpty();

                if (!consentGiven || !consentGiven.checked) message = 'Please consent to receive treatment.';
                else if (!signatureValid) message = 'Please provide your signature.';
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

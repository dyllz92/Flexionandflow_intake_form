(function() {
    'use strict';

    const TOTAL_STEPS = 4;
    let currentStep = 1;

    // DOM Elements
    let steps, stepIndicators, prevBtn, nextBtn, submitBtn, validationToast;

    // Step validation rules
    const stepValidation = {
        1: () => {
            // Step 1: firstName, lastName, email, mobile, dateOfBirth, emergencyName, emergencyRelationship, emergencyPhone required
            const firstName = document.getElementById('firstName');
            const lastName = document.getElementById('lastName');
            const email = document.getElementById('email');
            const mobile = document.getElementById('mobile');
            const dateOfBirth = document.getElementById('dateOfBirth');
            const emergencyName = document.getElementById('emergencyName');
            const emergencyRelationship = document.getElementById('emergencyRelationship');
            const emergencyPhone = document.getElementById('emergencyPhone');

            const firstNameValid = firstName && firstName.value.trim().length > 0;
            const lastNameValid = lastName && lastName.value.trim().length > 0;
            const emailValid = email && email.value.trim().length > 0;
            const mobileValid = mobile && mobile.value.trim().length > 0;
            const dobValid = dateOfBirth && dateOfBirth.value.trim().length > 0;
            const emergencyNameValid = emergencyName && emergencyName.value.trim().length > 0;
            const emergencyRelationshipValid = emergencyRelationship && emergencyRelationship.value.trim().length > 0;
            const emergencyPhoneValid = emergencyPhone && emergencyPhone.value.trim().length > 0;

            return firstNameValid && lastNameValid && emailValid && mobileValid && dobValid && emergencyNameValid && emergencyRelationshipValid && emergencyPhoneValid;
        },
        2: () => {
            // Step 2: visitReasons (at least one), referralSource, occupation, sleepQuality, stressLevel, exerciseFrequency, previousMassage required
            const visitReasons = document.querySelectorAll('input[name="visitReasons"]:checked');
            const referralSource = document.querySelectorAll('input[name="referralSource"]:checked');
            const occupation = document.getElementById('occupation');
            const sleepQuality = document.querySelectorAll('input[name="sleepQuality"]:checked');
            const stressLevel = document.querySelectorAll('input[name="stressLevel"]:checked');
            const exerciseFrequency = document.querySelectorAll('input[name="exerciseFrequency"]:checked');
            const previousMassage = document.querySelectorAll('input[name="previousMassage"]:checked');

            const visitReasonsValid = visitReasons.length > 0;
            const referralSourceValid = referralSource.length > 0;
            const occupationValid = occupation && occupation.value.trim().length > 0;
            const sleepQualityValid = sleepQuality.length > 0;
            const stressLevelValid = stressLevel.length > 0;
            const exerciseFrequencyValid = exerciseFrequency.length > 0;
            const previousMassageValid = previousMassage.length > 0;

            return visitReasonsValid && referralSourceValid && occupationValid && sleepQualityValid && stressLevelValid && exerciseFrequencyValid && previousMassageValid;
        },
        3: () => {
            // Step 3: takingMedications, hasAllergies, hasRecentInjuries, hasMedicalConditions, seenOtherProvider, pregnantBreastfeeding required
            // If Yes to medications, medicationsList required
            // If Yes to allergies, allergiesList required
            // If Yes to injuries OR conditions, conditionsDetails required
            const takingMedications = document.querySelectorAll('input[name="takingMedications"]:checked');
            const hasAllergies = document.querySelectorAll('input[name="hasAllergies"]:checked');
            const hasRecentInjuries = document.querySelectorAll('input[name="hasRecentInjuries"]:checked');
            const hasMedicalConditions = document.querySelectorAll('input[name="hasMedicalConditions"]:checked');
            const seenOtherProvider = document.querySelectorAll('input[name="seenOtherProvider"]:checked');
            const pregnantBreastfeeding = document.querySelectorAll('input[name="pregnantBreastfeeding"]:checked');

            // Base validation - all radio groups must have selection
            if (takingMedications.length === 0) return false;
            if (hasAllergies.length === 0) return false;
            if (hasRecentInjuries.length === 0) return false;
            if (hasMedicalConditions.length === 0) return false;
            if (seenOtherProvider.length === 0) return false;
            if (pregnantBreastfeeding.length === 0) return false;

            // Conditional validations
            const medicationsYes = document.querySelector('input[name="takingMedications"][value="Yes"]')?.checked;
            if (medicationsYes) {
                const medicationsList = document.getElementById('medicationsList');
                if (!medicationsList || !medicationsList.value.trim().length) return false;
            }

            const allergiesYes = document.querySelector('input[name="hasAllergies"][value="Yes"]')?.checked;
            if (allergiesYes) {
                const allergiesList = document.getElementById('allergiesList');
                if (!allergiesList || !allergiesList.value.trim().length) return false;
            }

            const injuriesYes = document.querySelector('input[name="hasRecentInjuries"][value="Yes"]')?.checked;
            const conditionsYes = document.querySelector('input[name="hasMedicalConditions"][value="Yes"]')?.checked;
            if (injuriesYes || conditionsYes) {
                const conditionsDetails = document.getElementById('conditionsDetails');
                if (!conditionsDetails || !conditionsDetails.value.trim().length) return false;
            }

            return true;
        },
        4: () => {
            // Step 4: consent required (signature optional)
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

        // Update textual step count (e.g., "Step 2 of 4")
        const stepCountEl = document.getElementById('stepCount');
        if (stepCountEl) {
            stepCountEl.textContent = `Step ${currentStep} of ${TOTAL_STEPS}`;
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
                const firstName = document.getElementById('firstName');
                const lastName = document.getElementById('lastName');
                const email = document.getElementById('email');
                const mobile = document.getElementById('mobile');
                const dateOfBirth = document.getElementById('dateOfBirth');
                const emergencyName = document.getElementById('emergencyName');
                const emergencyRelationship = document.getElementById('emergencyRelationship');
                const emergencyPhone = document.getElementById('emergencyPhone');

                if (!firstName || !firstName.value.trim()) message = 'Please enter your first name.';
                else if (!lastName || !lastName.value.trim()) message = 'Please enter your last name.';
                else if (!email || !email.value.trim()) message = 'Please enter your email address.';
                else if (!mobile || !mobile.value.trim()) message = 'Please enter your phone number.';
                else if (!dateOfBirth || !dateOfBirth.value.trim()) message = 'Please enter your date of birth.';
                else if (!emergencyName || !emergencyName.value.trim()) message = 'Please enter an emergency contact name.';
                else if (!emergencyRelationship || !emergencyRelationship.value.trim()) message = 'Please enter the relationship to your emergency contact.';
                else if (!emergencyPhone || !emergencyPhone.value.trim()) message = 'Please enter your emergency contact phone number.';
                break;
            }
            case 2: {
                const visitReasons = document.querySelectorAll('input[name="visitReasons"]:checked');
                const referralSource = document.querySelectorAll('input[name="referralSource"]:checked');
                const occupation = document.getElementById('occupation');
                const sleepQuality = document.querySelectorAll('input[name="sleepQuality"]:checked');
                const stressLevel = document.querySelectorAll('input[name="stressLevel"]:checked');
                const exerciseFrequency = document.querySelectorAll('input[name="exerciseFrequency"]:checked');
                const previousMassage = document.querySelectorAll('input[name="previousMassage"]:checked');

                if (visitReasons.length === 0) message = 'Please select at least one reason for your visit.';
                else if (referralSource.length === 0) message = 'Please tell us how you heard about us.';
                else if (!occupation || !occupation.value.trim()) message = 'Please enter your occupation.';
                else if (sleepQuality.length === 0) message = 'Please rate your sleep quality.';
                else if (stressLevel.length === 0) message = 'Please rate your stress levels.';
                else if (exerciseFrequency.length === 0) message = 'Please select how often you exercise.';
                else if (previousMassage.length === 0) message = 'Please indicate if you have previous massage experience.';
                break;
            }
            case 3: {
                const takingMedications = document.querySelectorAll('input[name="takingMedications"]:checked');
                const hasAllergies = document.querySelectorAll('input[name="hasAllergies"]:checked');
                const hasRecentInjuries = document.querySelectorAll('input[name="hasRecentInjuries"]:checked');
                const hasMedicalConditions = document.querySelectorAll('input[name="hasMedicalConditions"]:checked');
                const seenOtherProvider = document.querySelectorAll('input[name="seenOtherProvider"]:checked');
                const pregnantBreastfeeding = document.querySelectorAll('input[name="pregnantBreastfeeding"]:checked');

                if (takingMedications.length === 0) message = 'Please indicate if you are taking any medications.';
                else if (hasAllergies.length === 0) message = 'Please indicate if you have any allergies.';
                else if (hasRecentInjuries.length === 0) message = 'Please indicate if you have had recent accidents, injuries or surgeries.';
                else if (hasMedicalConditions.length === 0) message = 'Please indicate if you have any medical conditions.';
                else if (seenOtherProvider.length === 0) message = 'Please indicate if you have seen another healthcare provider.';
                else if (pregnantBreastfeeding.length === 0) message = 'Please indicate if you are pregnant or breastfeeding.';
                else {
                    // Check conditional fields
                    const medicationsYes = document.querySelector('input[name="takingMedications"][value="Yes"]')?.checked;
                    if (medicationsYes) {
                        const medicationsList = document.getElementById('medicationsList');
                        if (!medicationsList || !medicationsList.value.trim()) {
                            message = 'Please list your medications.';
                            break;
                        }
                    }

                    const allergiesYes = document.querySelector('input[name="hasAllergies"][value="Yes"]')?.checked;
                    if (allergiesYes) {
                        const allergiesList = document.getElementById('allergiesList');
                        if (!allergiesList || !allergiesList.value.trim()) {
                            message = 'Please list your allergies.';
                            break;
                        }
                    }

                    const injuriesYes = document.querySelector('input[name="hasRecentInjuries"][value="Yes"]')?.checked;
                    const conditionsYes = document.querySelector('input[name="hasMedicalConditions"][value="Yes"]')?.checked;
                    if (injuriesYes || conditionsYes) {
                        const conditionsDetails = document.getElementById('conditionsDetails');
                        if (!conditionsDetails || !conditionsDetails.value.trim()) {
                            message = 'Please provide details about your injuries or medical conditions.';
                        }
                    }
                }
                break;
            }
            case 4: {
                const consentAll = document.getElementById('consentAll');
                if (!consentAll || !consentAll.checked) message = 'Please confirm you have read and agreed to the Declaration & Privacy Consent.';
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

        // Next button: visible on steps 1-3, hidden on step 4
        nextBtn.style.display = currentStep < TOTAL_STEPS ? 'block' : 'none';

        // Submit button: visible only on step 4
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

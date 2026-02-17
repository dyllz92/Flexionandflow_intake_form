(function() {
    'use strict';

    const TOTAL_STEPS = 5;
    let currentStep = 1;

    // DOM Elements
    let steps, stepIndicators, prevBtn, nextBtn, submitBtn;

    // Step validation rules
    const stepValidation = {
        1: () => {
            const firstName = document.getElementById('firstName');
            const lastName = document.getElementById('lastName');
            const email = document.getElementById('email');
            const mobile = document.getElementById('mobile');
            const dateOfBirth = document.getElementById('dateOfBirth');
            const genderInputs = document.querySelectorAll('input[name="gender"]');
            
            const firstNameValid = firstName && firstName.value.trim().length > 0;
            const lastNameValid = lastName && lastName.value.trim().length > 0;
            const emailValid = email && email.value.trim().length > 0;
            const mobileValid = mobile && mobile.value.trim().length > 0;
            const dobValid = dateOfBirth && dateOfBirth.value.trim().length > 0;
            const genderValid = Array.from(genderInputs).some(g => g.checked);
            
            return firstNameValid && lastNameValid && emailValid && mobileValid && dobValid && genderValid;
        },
        2: () => {
            const visitReasonInputs = document.querySelectorAll('input[name="visitReason"]');
            return Array.from(visitReasonInputs).some(r => r.checked);
        },
        3: () => {
            return true;
        },
        4: () => {
            return true;
        },
        5: () => {
            const consentAll = document.getElementById('consentAll');
            const signatureValid = typeof window.isSignatureValid === 'function' && window.isSignatureValid();
            return consentAll && consentAll.checked && signatureValid;
        }
    };

    function init() {
        console.log('[wizard.js] Initializing wizard...');
        
        steps = document.querySelectorAll('.wizard-step');
        stepIndicators = document.querySelectorAll('.step-indicator .step');
        prevBtn = document.getElementById('prevBtn');
        nextBtn = document.getElementById('nextBtn');
        submitBtn = document.getElementById('submitBtn');

        if (!steps.length || !stepIndicators.length) {
            console.warn('Wizard elements not found');
            return;
        }

        if (prevBtn) prevBtn.addEventListener('click', goToPrevStep);
        if (nextBtn) nextBtn.addEventListener('click', goToNextStep);

        document.addEventListener('input', updateButtonStates);
        document.addEventListener('change', updateButtonStates);

        console.log('[wizard.js] Calling showStep(1)');
        showStep(1);
        updateButtonStates();
    }

    function showStep(stepNum) {
        currentStep = stepNum;
        console.log(`[wizard.js] showStep called with stepNum: ${stepNum}`);

        steps.forEach((step, index) => {
            const stepNumber = parseInt(step.dataset.step);
            if (stepNumber === currentStep) {
                step.classList.add('active');
                step.style.display = 'block';
                console.log(`[wizard.js] Step ${stepNumber} set to active and display:block`);
            } else {
                step.classList.remove('active');
                step.style.display = 'none';
            }
        });

        stepIndicators.forEach(indicator => {
            const indicatorStep = parseInt(indicator.dataset.step);
            indicator.classList.remove('active', 'completed');

            if (indicatorStep === currentStep) {
                indicator.classList.add('active');
            } else if (indicatorStep < currentStep) {
                indicator.classList.add('completed');
            }
        });

        const formHeader = document.querySelector('.form-header');
        if (formHeader) {
            formHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        updateButtonStates();

        const stepCountEl = document.getElementById('stepCount');
        if (stepCountEl) {
            stepCountEl.textContent = `Step ${currentStep} of ${TOTAL_STEPS}`;
        }
    }

    function goToPrevStep() {
        if (currentStep > 1) {
            showStep(currentStep - 1);
        }
    }

    function goToNextStep(event) {
        console.log('[wizard.js] goToNextStep called');
        
        if (event) {
            event.preventDefault();
        }
        
        if (!validateCurrentStep()) {
            showValidationErrors();
            return;
        }

        if (currentStep < TOTAL_STEPS) {
            console.log(`[wizard.js] Moving from step ${currentStep} to ${currentStep + 1}`);
            showStep(currentStep + 1);
        }
    }

    function validateCurrentStep() {
        const validator = stepValidation[currentStep];
        const isValid = validator ? validator() : true;
        console.log(`[wizard.js] Step ${currentStep} validation result: ${isValid}`);
        return isValid;
    }

    function showValidationErrors() {
        let message = '';

        switch (currentStep) {
            case 1: {
                const firstName = document.getElementById('firstName');
                const lastName = document.getElementById('lastName');
                const email = document.getElementById('email');
                const mobile = document.getElementById('mobile');
                const dateOfBirth = document.getElementById('dateOfBirth');
                const genderInputs = document.querySelectorAll('input[name="gender"]');
                const genderSelected = Array.from(genderInputs).some(g => g.checked);

                if (!firstName || !firstName.value.trim()) message = 'Please enter your first name.';
                else if (!lastName || !lastName.value.trim()) message = 'Please enter your last name.';
                else if (!email || !email.value.trim()) message = 'Please enter your email address.';
                else if (!mobile || !mobile.value.trim()) message = 'Please enter your mobile number.';
                else if (!dateOfBirth || !dateOfBirth.value.trim()) message = 'Please enter your date of birth.';
                else if (!genderSelected) message = 'Please select your gender.';
                break;
            }
            case 2: {
                const visitReasonInputs = document.querySelectorAll('input[name="visitReason"]');
                const visitReasonSelected = Array.from(visitReasonInputs).some(r => r.checked);
                if (!visitReasonSelected) message = 'Please select a reason for your visit.';
                break;
            }
            case 5: {
                const consentAll = document.getElementById('consentAll');
                const signatureValid = typeof window.isSignatureValid === 'function' && window.isSignatureValid();
                if (!consentAll || !consentAll.checked) message = 'Please confirm you have read and agreed to the Terms and consent to treatment.';
                else if (!signatureValid) message = 'Please provide a signature.';
                break;
            }
        }

        if (message) {
            alert(message);
        }
    }

    function updateButtonStates() {
        if (!prevBtn || !nextBtn || !submitBtn) return;

        prevBtn.style.display = currentStep === 1 ? 'none' : 'block';
        nextBtn.style.display = currentStep < TOTAL_STEPS ? 'block' : 'none';
        submitBtn.style.display = currentStep === TOTAL_STEPS ? 'block' : 'none';

        if (currentStep < TOTAL_STEPS) {
            const isValid = validateCurrentStep();
            nextBtn.disabled = !isValid;
            console.log(`[wizard.js] Next button disabled: ${!isValid}`);
        }

        if (currentStep === TOTAL_STEPS) {
            submitBtn.disabled = !validateCurrentStep();
        }
    }

    function getCurrentStep() {
        return currentStep;
    }

    function goToStep(stepNum) {
        if (stepNum >= 1 && stepNum <= TOTAL_STEPS) {
            showStep(stepNum);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.wizard = {
        getCurrentStep,
        goToStep,
        goToNextStep,
        goToPrevStep,
        updateButtonStates,
        validateCurrentStep
    };
})();
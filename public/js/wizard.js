  function autoFormatDateInput(input) {
    if (!input || !input.value) return false;
    
    const value = input.value.trim();
    if (!value) return false;
    return !!parseDateValue(value);
  }

  function parseDateValue(value) {
    const match = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.]?(\d{4})$/.exec(value.trim());
    if (!match) return null;
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2030) return null;
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    return date;
  }

  function isValidDateInput(input) {
    if (!input || !input.value) return false;
    return !!parseDateValue(input.value);
  }

  function getValidationState(stepNum) {
    const state = { valid: true, message: "", fields: [] };
    const invalidate = (element, message) => {
      if (state.valid) state.message = message;
      state.valid = false;
      if (element) state.fields.push(element);
    };

    switch (stepNum) {
      case 1: {
        const firstName = document.getElementById("firstName");
        const lastName = document.getElementById("lastName");
        const email = document.getElementById("email");
        const mobile = document.getElementById("mobile");
        const dateOfBirth = document.getElementById("dateOfBirth");

        if (!firstName || !firstName.value.trim())
          invalidate(firstName, "Please enter your first name.");
        else if (!lastName || !lastName.value.trim())
          invalidate(lastName, "Please enter your last name.");
        else if (!email || !email.value.trim())
          invalidate(email, "Please enter your email address.");
        else if (!mobile || !mobile.value.trim())
          invalidate(mobile, "Please enter your phone number.");
        else if (!dateOfBirth || !dateOfBirth.value.trim())
          invalidate(dateOfBirth, "Please enter your date of birth.");
        else if (!isValidDateInput(dateOfBirth))
          invalidate(
            dateOfBirth,
            "Please enter your date of birth in DD/MM/YYYY format.",
          );
        break;
      }
      case 2: {
        const visitGoalsInputs = document.querySelectorAll(
          'input[name="visitGoals"]',
        );
        const visitGoals = document.querySelectorAll(
          'input[name="visitGoals"]:checked',
        );
        const referralSourceInputs = document.querySelectorAll(
          'input[name="referralSource"]',
        );
        const referralSource = document.querySelectorAll(
          'input[name="referralSource"]:checked',
        );
        const occupation = document.getElementById("occupation");
        const sleepQuality = document.getElementById("sleepQuality");
        const stressLevel = document.getElementById("stressLevel");
        const exerciseFrequencyInputs = document.querySelectorAll(
          'input[name="exerciseFrequency"]',
        );
        const exerciseFrequency = document.querySelectorAll(
          'input[name="exerciseFrequency"]:checked',
        );
        const previousMassageInputs = document.querySelectorAll(
          'input[name="previousMassage"]',
        );
        const previousMassage = document.querySelectorAll(
          'input[name="previousMassage"]:checked',
        );

        if (visitGoalsInputs.length && visitGoals.length === 0)
          invalidate(
            visitGoalsInputs[0],
            "Please select at least one reason for your visit.",
          );
        else if (referralSourceInputs.length && referralSource.length === 0)
          invalidate(
            referralSourceInputs[0],
            "Please tell us how you heard about us.",
          );
        else if (!occupation || !occupation.value.trim())
          invalidate(occupation, "Please enter your occupation.");
        else if (
          sleepQuality &&
          sleepQuality.hasAttribute("required") &&
          (!sleepQuality.value || sleepQuality.value === "")
        )
          invalidate(sleepQuality, "Please indicate your sleep quality.");
        else if (
          stressLevel &&
          stressLevel.hasAttribute("required") &&
          (!stressLevel.value || stressLevel.value === "")
        )
          invalidate(stressLevel, "Please indicate your stress levels.");
        else if (
          exerciseFrequencyInputs.length &&
          exerciseFrequency.length === 0
        )
          invalidate(
            exerciseFrequencyInputs[0],
            "Please select how often you exercise.",
          );
        else if (previousMassageInputs.length && previousMassage.length === 0)
          invalidate(
            previousMassageInputs[0],
            "Please indicate if you have previous massage experience.",
          );
        break;
      }
      case 3: {
        const takingMedicationsInputs = document.querySelectorAll(
          'input[name="takingMedications"]',
        );
        const takingMedications = document.querySelectorAll(
          'input[name="takingMedications"]:checked',
        );
        const hasAllergiesInputs = document.querySelectorAll(
          'input[name="hasAllergies"]',
        );
        const hasAllergies = document.querySelectorAll(
          'input[name="hasAllergies"]:checked',
        );
        const hasRecentInjuriesInputs = document.querySelectorAll(
          'input[name="hasRecentInjuries"]',
        );
        const hasRecentInjuries = document.querySelectorAll(
          'input[name="hasRecentInjuries"]:checked',
        );
        const medicalConditionsInputs = document.querySelectorAll(
          'input[name="medicalConditions"]',
        );
        const medicalConditions = document.querySelectorAll(
          'input[name="medicalConditions"]:checked',
        );
        const seenOtherProviderInputs = document.querySelectorAll(
          'input[name="seenOtherProvider"]',
        );
        const seenOtherProvider = document.querySelectorAll(
          'input[name="seenOtherProvider"]:checked',
        );
        const pregnantBreastfeedingInputs = document.querySelectorAll(
          'input[name="pregnantBreastfeeding"]',
        );
        const pregnantBreastfeeding = document.querySelectorAll(
          'input[name="pregnantBreastfeeding"]:checked',
        );

        if (takingMedicationsInputs.length && takingMedications.length === 0)
          invalidate(
            takingMedicationsInputs[0],
            "Please indicate if you are taking any medications.",
          );
        else if (hasAllergiesInputs.length && hasAllergies.length === 0)
          invalidate(
            hasAllergiesInputs[0],
            "Please indicate if you have any allergies.",
          );
        else if (
          hasRecentInjuriesInputs.length &&
          hasRecentInjuries.length === 0
        )
          invalidate(
            hasRecentInjuriesInputs[0],
            "Please indicate if you have had recent accidents, injuries or surgeries.",
          );
        else if (
          medicalConditionsInputs.length &&
          medicalConditions.length === 0
        )
          invalidate(
            medicalConditionsInputs[0],
            "Please select at least one option from the medical conditions list.",
          );
        else if (
          seenOtherProviderInputs.length &&
          seenOtherProviderInputs[0].closest(".form-group").offsetParent !==
            null &&
          seenOtherProvider.length === 0
        )
          invalidate(
            seenOtherProviderInputs[0],
            "Please indicate if you have seen another healthcare provider.",
          );
        else if (
          pregnantBreastfeedingInputs.length &&
          pregnantBreastfeeding.length === 0
        )
          invalidate(
            pregnantBreastfeedingInputs[0],
            "Please indicate if you are pregnant or breastfeeding.",
          );
        break;
      }
      case 4: {
        // Step 4: Pain & Signals - All fields are optional
        // No required validation needed for this step
        break;
      }
      case 5: {
        const consentAll = document.getElementById("consentAll");
        const medicalCareDisclaimer = document.getElementById(
          "medicalCareDisclaimer",
        );
        const signatureData = document.getElementById("signatureData");
        
        if (!consentAll || !consentAll.checked)
          invalidate(
            consentAll,
            "Please confirm you have read and agreed to the Privacy Policy.",
          );
        else if (!medicalCareDisclaimer || !medicalCareDisclaimer.checked)
          invalidate(
            medicalCareDisclaimer,
            "Please confirm that you understand massage is not a substitute for medical care.",
          );
        else if (!signatureData || !signatureData.value)
          invalidate(
            document.getElementById("signatureCanvas"),
            "Please provide your digital signature.",
          );
        break;
      }
    }

    return state;
  }

  // Initialize wizard
  function init() {
    steps = document.querySelectorAll(".wizard-step");
    stepIndicators = document.querySelectorAll(".step-indicator .step");
    prevBtn = document.getElementById("prevBtn");
    nextBtn = document.getElementById("nextBtn");
    submitBtn = document.getElementById("submitBtn");
    stepValidationMessageEl = document.getElementById("stepValidationMessage");
    stepStatusEl = document.getElementById("stepStatus");
    if (stepStatusEl) stepStatusEl.classList.add("is-hidden");

    console.log("[wizard.js] init called");
    console.log("[wizard.js] steps found:", steps.length);
    console.log("[wizard.js] stepIndicators found:", stepIndicators.length);

    if (!steps.length || !stepIndicators.length) {
      console.warn("Wizard elements not found");
      return;
    }

    // Create validation toast element
    createValidationToast();

    // Set up event listeners
    if (prevBtn) {
      prevBtn.addEventListener("click", goToPrevStep);
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", goToNextStep);
    }

    stepIndicators.forEach((indicator) => {
      indicator.addEventListener("click", () => {
        const indicatorStep = parseInt(indicator.dataset.step);
        if (indicatorStep < currentStep) {
          showStep(indicatorStep);
        }
      });
    });

    // Listen for validation changes to update button states
    document.addEventListener("input", handleFieldInteraction);
    document.addEventListener("change", handleFieldInteraction);
    document.addEventListener("click", handleClickInteraction);

    // Listen for signature:changed custom event (works regardless of script load order)
    document.addEventListener("signature:changed", updateButtonStates);

    // Initial state
    console.log("[wizard.js] Calling showStep(1)");
    showStep(1);
    updateButtonStates();
  }

  function handleFieldInteraction(event) {
    // Only update button states, don't mark step as touched until user tries to proceed
    updateButtonStates();
  }

  function handleClickInteraction(event) {
    if (
      event.target &&
      event.target.closest &&
      event.target.closest(".wizard-step")
    ) {
      const isLabelClick =
        event.target.tagName === "LABEL" || event.target.closest("label");
      if (isLabelClick) {
        // Only update button states, don't mark step as touched until user tries to proceed
        setTimeout(updateButtonStates, 0);
      }
    }
  }

  // Show specific step
  function showStep(stepNum) {
    currentStep = stepNum;
    console.log("[wizard.js] showStep called with stepNum:", stepNum);

    // Hide all steps, show current
    steps.forEach((step, index) => {
      const stepNumber = parseInt(step.dataset.step);
      if (stepNumber === currentStep) {
        step.classList.add("active");
        step.style.display = "block";
        console.log(
          `[wizard.js] Step ${stepNumber} set to active and display:block`,
        );
=======
>>>>>>> 96fc2190f0d9c1ca6e87b2ac77d8aee05a3e10b4
    return state;
  }

  // Enhanced field validation with visual feedback
  function validateFieldVisually(field) {
    const fieldContainer = field.closest('.form-group');
    let errorElement = fieldContainer?.querySelector('.field-error');
    
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'field-error';
      errorElement.style.cssText = 'color: #ef4444; font-size: 12px; margin-top: 4px; display: none;';
      field.parentNode.appendChild(errorElement);
    }
    
    let isValid = true;
    let message = '';
    
    if (field.hasAttribute('required') && !field.value.trim()) {
      isValid = false;
      message = 'This field is required';
    } else if (field.type === 'email' && field.value && !isValidEmailClient(field.value)) {
      isValid = false;
      message = 'Please enter a valid email address';
    } else if (field.classList.contains('date-input') && field.value && !isValidDateInput(field)) {
      isValid = false;
      message = 'Please enter date in DD/MM/YYYY format';
    }
    
    field.classList.toggle('validation-error', !isValid);
    errorElement.textContent = message;
    errorElement.style.display = message ? 'block' : 'none';
    
    return isValid;
  }
  
  function isValidEmailClient(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  // Show specific step
  function showStep(stepNum) {
    currentStep = stepNum;
    console.log("[wizard.js] showStep called with stepNum:", stepNum);

    // Hide all steps, show current
    steps.forEach((step, index) => {
      const stepNumber = parseInt(step.dataset.step);
      if (stepNumber === currentStep) {
        step.classList.add("active");
        step.style.display = "block";
        console.log(
          `[wizard.js] Step ${stepNumber} set to active and display:block`,
        );
      } else {
        step.classList.remove("active");
        step.style.display = "none";
        console.log(
          `[wizard.js] Step ${stepNumber} hidden`,
        );
      }
    });

    // Update step indicators
    stepIndicators.forEach((indicator, index) => {
      const indicatorStep = parseInt(indicator.dataset.step);
      indicator.classList.toggle("active", indicatorStep === currentStep);
      indicator.classList.toggle("completed", indicatorStep < currentStep);
    });

    // Scroll to top of form
    const formHeader = document.querySelector(".form-header");
    if (formHeader) {
      formHeader.scrollIntoView({ behavior: "smooth", block: "start" });
      console.log("[wizard.js] Scrolled to form header");
    }

    if (stepStatusEl) {
      stepStatusEl.classList.add("is-hidden");
      stepStatusEl.textContent = "";
    }

    updateButtonStates();

    // Update textual step count (e.g., "Step 2 of 4")
    const stepCountEl = document.getElementById("stepCount");
    if (stepCountEl) {
      stepCountEl.textContent = `Step ${currentStep} of ${TOTAL_STEPS}`;
    }

    // Ensure signature pad is resized/available on step 5 (signature step)
    if (currentStep === 5 && window.signaturePad) {
      setTimeout(() => {
        try {
          // Resize canvas and re-setup drawing settings
          if (typeof window.signaturePad.resizeCanvas === "function") {
            window.signaturePad.resizeCanvas();
          }
          if (typeof window.signaturePad.setupCanvas === "function") {
            window.signaturePad.setupCanvas();
          }
        } catch (e) {
          /* ignore */
        }
      }, 100);
    }
  }

  // Go to previous step
  function goToPrevStep(event) {
    // Prevent form submission
    if (event) {
      event.preventDefault();
    }

    if (currentStep > 1) {
      showStep(currentStep - 1);
    }
  }

  // Go to next step
  function goToNextStep(event) {
    // Prevent form submission
    if (event) {
      event.preventDefault();
    }

    // Validate current step before proceeding
    if (!validateCurrentStep()) {
      stepTouched[currentStep] = true;
      updateButtonStates();
      showValidationErrors();
=======
    } else if (digitsOnly.length === 6) {
      // DDMMYY format
      day = parseInt(digitsOnly.substring(0, 2));
      month = parseInt(digitsOnly.substring(2, 4));
      const yy = parseInt(digitsOnly.substring(4, 6));
      year = yy < 50 ? 2000 + yy : 1900 + yy;
    } else {
      // Can't reliably parse
>>>>>>> 96fc2190f0d9c1ca6e87b2ac77d8aee05a3e10b4
      return;
    }
    
    // Validate the parsed date
    if (month < 1 || month > 12 || day < 1 || day > 31) return;
    
    // Check if it's a valid date
    const testDate = new Date(year, month - 1, day);
    if (
      testDate.getFullYear() !== year ||
      testDate.getMonth() !== month - 1 ||
      testDate.getDate() !== day
    ) {
      return; // Invalid date (e.g., Feb 31)
    }
    
    // Format as DD/MM/YYYY
    const formatted = 
      String(day).padStart(2, '0') + '/' +
      String(month).padStart(2, '0') + '/' +
      String(year);
    
    // Only update if the format changed
    if (value !== formatted) {
      input.value = formatted;
    }
  }
<<<<<<< HEAD

  // Validate current step
  function validateCurrentStep() {
    try {
      const state = getValidationState(currentStep);
      return state.valid;
    } catch (error) {
      console.error("Validation error:", error);
      return false;
    }
  }

  // Show validation errors for current step
  function showValidationErrors() {
    const state = getValidationState(currentStep);
    if (state.message) {
      showValidationToast(state.message);
    }
  }

  // Create accessible validation toast element
  function createValidationToast() {
    if (document.getElementById("validationToast")) return;

    validationToast = document.createElement("div");
    validationToast.id = "validationToast";
    validationToast.className = "validation-toast";
    validationToast.setAttribute("role", "alert");
    validationToast.setAttribute("aria-live", "polite");
    validationToast.innerHTML = `
            <span class="validation-toast-icon">!</span>
            <span class="validation-toast-message"></span>
            <button type="button" class="validation-toast-close" aria-label="Dismiss">&times;</button>
        `;
    document.body.appendChild(validationToast);

    // Close button handler
    validationToast
      .querySelector(".validation-toast-close")
      .addEventListener("click", hideValidationToast);
  }

  // Show validation toast with message
  function showValidationToast(message) {
    if (!validationToast) createValidationToast();

    const messageEl = validationToast.querySelector(
      ".validation-toast-message",
    );
    messageEl.textContent = message;

    validationToast.classList.add("visible");

    // Auto-hide after 5 seconds
    clearTimeout(validationToast._timeout);
    validationToast._timeout = setTimeout(hideValidationToast, 5000);
  }

  // Hide validation toast
  function hideValidationToast() {
    if (validationToast) {
      validationToast.classList.remove("visible");
    }
  }

  function resolveFieldGroup(element) {
    if (!element) return null;
    return (
      element.closest(".form-group") ||
      element.closest(".radio-group") ||
      element.closest(".checkbox-group") ||
      element
    );
  }

  function clearFieldErrors() {
    document
      .querySelectorAll(".form-group.field-error")
      .forEach((el) => el.classList.remove("field-error"));
    document
      .querySelectorAll('[aria-invalid="true"]')
      .forEach((el) => el.removeAttribute("aria-invalid"));
  }

  function applyFieldErrors(state) {
    clearFieldErrors();
    if (!stepTouched[currentStep] || state.valid) return;
    state.fields.forEach((field) => {
      const group = resolveFieldGroup(field);
      if (group) group.classList.add("field-error");
      if (field && field.setAttribute)
        field.setAttribute("aria-invalid", "true");
    });
  }

  function updateStepValidationMessage(state) {
    if (!stepValidationMessageEl) return;
    if (!stepTouched[currentStep] || state.valid) {
      stepValidationMessageEl.textContent = "";
      stepValidationMessageEl.classList.add("is-hidden");
      return;
    }
    stepValidationMessageEl.textContent =
      state.message || "Please complete all required fields to continue.";
    stepValidationMessageEl.classList.remove("is-hidden");
  }

  function showStepStatus(message, withSpinner = false, autoHideMs = 800) {
    if (!stepStatusEl) return;
    stepStatusEl.classList.remove("is-hidden");
    stepStatusEl.innerHTML = withSpinner
      ? `<span class="status-spinner" aria-hidden="true"></span><span>${message}</span>`
      : `<span>${message}</span>`;
    clearTimeout(showStepStatus._timeout);
    if (autoHideMs) {
      showStepStatus._timeout = setTimeout(() => {
        stepStatusEl.classList.add("is-hidden");
        stepStatusEl.textContent = "";
      }, autoHideMs);
    }
  }

  // Update button visibility and states with enhanced feedback
  function updateButtonStates() {
    if (!prevBtn || !nextBtn || !submitBtn) return;

    const state = getValidationState(currentStep);
    const isLastStep = currentStep === TOTAL_STEPS;
    const isFirstStep = currentStep === 1;

    // Previous button: hidden on step 1
    prevBtn.style.display = isFirstStep ? "none" : "block";
    prevBtn.disabled = isFirstStep;

    // Next/Submit button logic with enhanced tooltips
    if (isLastStep) {
      nextBtn.style.display = "none";
      submitBtn.style.display = "block";
      submitBtn.disabled = !state.valid;
      submitBtn.title = state.valid ? 
        "Submit your intake form" : 
        "Please complete all required fields to submit";
    } else {
      nextBtn.style.display = "block";
      submitBtn.style.display = "none";
      nextBtn.disabled = false; // Allow navigation, validate on click
      nextBtn.title = state.valid ? 
        "Continue to next step" : 
        "Complete required fields to continue";
    }
    }

    updateStepValidationMessage(state);
    applyFieldErrors(state);
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
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
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
    validateCurrentStep,
  };
})();
=======
>>>>>>> 96fc2190f0d9c1ca6e87b2ac77d8aee05a3e10b4

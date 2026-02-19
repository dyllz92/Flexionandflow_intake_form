(function () {
  "use strict";

  const TOTAL_STEPS = 5;
  let currentStep = 1;

  // DOM Elements
  let steps, stepIndicators, prevBtn, nextBtn, submitBtn;

  // Step validation rules
  const stepValidation = {
    1: () => {
      const firstName = document.getElementById("firstName");
      const lastName = document.getElementById("lastName");
      const email = document.getElementById("email");
      const mobile = document.getElementById("mobile");
      const dateOfBirth = document.getElementById("dateOfBirth");
      const occupation = document.getElementById("occupation");

      const firstNameValid = firstName && firstName.value.trim().length > 0;
      const lastNameValid = lastName && lastName.value.trim().length > 0;
      const emailValid = email && email.value.trim().length > 0;
      const mobileValid = mobile && mobile.value.trim().length > 0;
      const dobValid = dateOfBirth && dateOfBirth.value.trim().length > 0;
      const occupationValid = occupation && occupation.value.trim().length > 0;

      // Gender is optional in the UI, so we don't block progression here
      return (
        firstNameValid &&
        lastNameValid &&
        emailValid &&
        mobileValid &&
        dobValid &&
        occupationValid
      );
    },
    2: () => {
      // Step 2 requires:
      // - At least one visit goal
      // - A referral source
      // - Sleep and stress sliders set (when marked required)
      // - Exercise frequency selected
      // - Previous massage experience selected
      const visitGoalInputs = document.querySelectorAll(
        'input[name="visitGoals"]',
      );
      const referralSourceInputs = document.querySelectorAll(
        'input[name="referralSource"]',
      );
      const sleepQuality = document.getElementById("sleepQuality");
      const stressLevel = document.getElementById("stressLevel");
      const exerciseFrequencyInputs = document.querySelectorAll(
        'input[name="exerciseFrequency"]',
      );
      const previousMassageInputs = document.querySelectorAll(
        'input[name="previousMassage"]',
      );

      const hasVisitGoal = Array.from(visitGoalInputs).some((r) => r.checked);
      const hasReferralSource = Array.from(referralSourceInputs).some(
        (r) => r.checked,
      );

      const sleepValid =
        !sleepQuality ||
        !sleepQuality.hasAttribute("required") ||
        !!sleepQuality.value;
      const stressValid =
        !stressLevel ||
        !stressLevel.hasAttribute("required") ||
        !!stressLevel.value;

      const hasExerciseFrequency = Array.from(exerciseFrequencyInputs).some(
        (r) => r.checked,
      );
      const hasPreviousMassage = Array.from(previousMassageInputs).some(
        (r) => r.checked,
      );

      return (
        hasVisitGoal &&
        hasReferralSource &&
        sleepValid &&
        stressValid &&
        hasExerciseFrequency &&
        hasPreviousMassage
      );
    },
    3: () => {
      const takingMedications = document.querySelector(
        'input[name="takingMedications"]',
      );
      const hasAllergies = document.querySelector('input[name="hasAllergies"]');
      const pregnantBreastfeeding = document.querySelector(
        'input[name="pregnantBreastfeeding"]',
      );

      // Step 3 uses hidden inputs populated by button groups
      const takingMedicationsSelected =
        !!takingMedications && !!takingMedications.value;
      const hasAllergiesSelected = !!hasAllergies && !!hasAllergies.value;
      const pregnantBreastfeedingSelected =
        !!pregnantBreastfeeding && !!pregnantBreastfeeding.value;

      const medicationsList = document.getElementById("medicationsList");
      const allergiesList = document.getElementById("allergiesList");

      const takingMedicationsYes =
        takingMedications && takingMedications.value === "Yes";
      const hasAllergiesYes = hasAllergies && hasAllergies.value === "Yes";

      const medicationsValid =
        !takingMedicationsYes ||
        (medicationsList && medicationsList.value.trim().length > 0);
      const allergiesValid =
        !hasAllergiesYes ||
        (allergiesList && allergiesList.value.trim().length > 0);

      return (
        takingMedicationsSelected &&
        hasAllergiesSelected &&
        pregnantBreastfeedingSelected &&
        medicationsValid &&
        allergiesValid
      );
    },
    4: () => {
      return true;
    },
    5: () => {
      const consentAll = document.getElementById("consentAll");
      const medicalCareDisclaimer = document.getElementById(
        "medicalCareDisclaimer",
      );
      return (
        consentAll &&
        consentAll.checked &&
        medicalCareDisclaimer &&
        medicalCareDisclaimer.checked
      );
    },
  };

  function init() {
    console.log("[wizard.js] Initializing wizard...");

    steps = document.querySelectorAll(".wizard-step");
    stepIndicators = document.querySelectorAll(".step-indicator .step");
    prevBtn = document.getElementById("prevBtn");
    nextBtn = document.getElementById("nextBtn");
    submitBtn = document.getElementById("submitBtn");

    if (!steps.length || !stepIndicators.length) {
      console.warn("Wizard elements not found");
      return;
    }

    if (prevBtn) prevBtn.addEventListener("click", goToPrevStep);
    if (nextBtn) nextBtn.addEventListener("click", goToNextStep);

    document.addEventListener("input", updateButtonStates);
    document.addEventListener("change", updateButtonStates);

    console.log("[wizard.js] Calling showStep(1)");
    showStep(1);
    updateButtonStates();
  }

  function showStep(stepNum) {
    currentStep = stepNum;
    console.log(`[wizard.js] showStep called with stepNum: ${stepNum}`);

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
      }
    });

    stepIndicators.forEach((indicator) => {
      const indicatorStep = parseInt(indicator.dataset.step);
      indicator.classList.remove("active", "completed");

      if (indicatorStep === currentStep) {
        indicator.classList.add("active");
      } else if (indicatorStep < currentStep) {
        indicator.classList.add("completed");
      }
    });

    const formHeader = document.querySelector(".form-header");
    if (formHeader) {
      formHeader.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    updateButtonStates();

    const stepCountEl = document.getElementById("stepCount");
    if (stepCountEl) {
      stepCountEl.textContent = `Step ${currentStep} of ${TOTAL_STEPS}`;
    }
  }

  function goToPrevStep() {
    if (currentStep > 1) {
      showStep(currentStep - 1);
    }
  }

  function clearValidationMessage() {
    const validationEl = document.getElementById("stepValidationMessage");
    if (validationEl) {
      validationEl.textContent = "";
      validationEl.style.display = "none";
      validationEl.classList.remove("show");
    }
  }

  function goToNextStep(event) {
    console.log("[wizard.js] goToNextStep called");

    if (event) {
      event.preventDefault();
    }

    if (!validateCurrentStep()) {
      showValidationErrors();
      return;
    }

    clearValidationMessage();

    if (currentStep < TOTAL_STEPS) {
      console.log(
        `[wizard.js] Moving from step ${currentStep} to ${currentStep + 1}`,
      );
      showStep(currentStep + 1);
    }
  }

  function validateCurrentStep() {
    const validator = stepValidation[currentStep];
    const isValid = validator ? validator() : true;
    console.log(
      `[wizard.js] Step ${currentStep} validation result: ${isValid}`,
    );
    return isValid;
  }

  function showValidationErrors() {
    let message = "";
    let focusElement = null;

    switch (currentStep) {
      case 1: {
        const firstName = document.getElementById("firstName");
        const lastName = document.getElementById("lastName");
        const email = document.getElementById("email");
        const mobile = document.getElementById("mobile");
        const dateOfBirth = document.getElementById("dateOfBirth");
        const occupation = document.getElementById("occupation");

        if (!firstName || !firstName.value.trim()) {
          message = "Please enter your first name.";
          focusElement = firstName;
        } else if (!lastName || !lastName.value.trim()) {
          message = "Please enter your last name.";
          focusElement = lastName;
        } else if (!email || !email.value.trim()) {
          message = "Please enter your email address.";
          focusElement = email;
        } else if (!mobile || !mobile.value.trim()) {
          message = "Please enter your mobile number.";
          focusElement = mobile;
        } else if (!dateOfBirth || !dateOfBirth.value.trim()) {
          message = "Please enter your date of birth.";
          focusElement = dateOfBirth;
        } else if (!occupation || !occupation.value.trim()) {
          message = "Please enter your occupation.";
          focusElement = occupation;
        }
        break;
      }
      case 2: {
        const visitGoalInputs = document.querySelectorAll(
          'input[name="visitGoals"]',
        );
        const referralSourceInputs = document.querySelectorAll(
          'input[name="referralSource"]',
        );
        const sleepQuality = document.getElementById("sleepQuality");
        const stressLevel = document.getElementById("stressLevel");
        const exerciseFrequencyInputs = document.querySelectorAll(
          'input[name="exerciseFrequency"]',
        );
        const previousMassageInputs = document.querySelectorAll(
          'input[name="previousMassage"]',
        );

        const hasVisitGoal = Array.from(visitGoalInputs).some((r) => r.checked);
        const hasReferralSource = Array.from(referralSourceInputs).some(
          (r) => r.checked,
        );
        const hasExerciseFrequency = Array.from(exerciseFrequencyInputs).some(
          (r) => r.checked,
        );
        const hasPreviousMassage = Array.from(previousMassageInputs).some(
          (r) => r.checked,
        );

        const sleepMissing =
          sleepQuality &&
          sleepQuality.hasAttribute("required") &&
          !sleepQuality.value;
        const stressMissing =
          stressLevel &&
          stressLevel.hasAttribute("required") &&
          !stressLevel.value;

        if (!hasVisitGoal) {
          message = "Please tell me what brings you in today.";
          focusElement =
            visitGoalInputs[0]?.closest(".form-group") || visitGoalInputs[0];
        } else if (!hasReferralSource) {
          message = "Please tell me how you heard about me.";
          focusElement =
            referralSourceInputs[0]?.closest(".form-group") ||
            referralSourceInputs[0];
        } else if (sleepMissing) {
          message = "Please rate how well you sleep.";
          focusElement = sleepQuality;
        } else if (stressMissing) {
          message = "Please rate your stress levels.";
          focusElement = stressLevel;
        } else if (!hasExerciseFrequency) {
          message = "Please tell me how often you exercise.";
          focusElement =
            exerciseFrequencyInputs[0]?.closest(".form-group") ||
            exerciseFrequencyInputs[0];
        } else if (!hasPreviousMassage) {
          message =
            "Please let me know if you have had massage therapy before.";
          focusElement =
            previousMassageInputs[0]?.closest(".form-group") ||
            previousMassageInputs[0];
        }
        break;
      }
      case 3: {
        const takingMedicationsInput = document.querySelector(
          'input[name="takingMedications"]',
        );
        const hasAllergiesInput = document.querySelector(
          'input[name="hasAllergies"]',
        );
        const pregnantBreastfeedingInput = document.querySelector(
          'input[name="pregnantBreastfeeding"]',
        );
        const medicationsList = document.getElementById("medicationsList");
        const allergiesList = document.getElementById("allergiesList");

        const takingMedicationsSelected =
          !!takingMedicationsInput && !!takingMedicationsInput.value;
        const hasAllergiesSelected =
          !!hasAllergiesInput && !!hasAllergiesInput.value;
        const pregnantBreastfeedingSelected =
          !!pregnantBreastfeedingInput && !!pregnantBreastfeedingInput.value;

        const takingMedicationsYes =
          takingMedicationsInput && takingMedicationsInput.value === "Yes";
        const hasAllergiesYes =
          hasAllergiesInput && hasAllergiesInput.value === "Yes";

        if (!takingMedicationsSelected) {
          message = "Please let me know if you are taking any medications.";
          focusElement = document.querySelector(
            '.toggle-btn[data-name="takingMedications"]',
          );
        } else if (
          takingMedicationsYes &&
          (!medicationsList || !medicationsList.value.trim())
        ) {
          message = "Please list your medications.";
          focusElement = medicationsList;
        } else if (!hasAllergiesSelected) {
          message = "Please let me know if you have any allergies.";
          focusElement = document.querySelector(
            '.toggle-btn[data-name="hasAllergies"]',
          );
        } else if (
          hasAllergiesYes &&
          (!allergiesList || !allergiesList.value.trim())
        ) {
          message = "Please list your allergies.";
          focusElement = allergiesList;
        } else if (!pregnantBreastfeedingSelected) {
          message = "Please let me know if you are pregnant or breastfeeding.";
          focusElement = document.querySelector(
            '.toggle-btn[data-name="pregnantBreastfeeding"]',
          );
        }
        break;
      }
      case 5: {
        const consentAll = document.getElementById("consentAll");
        const medicalCareDisclaimer = document.getElementById(
          "medicalCareDisclaimer",
        );
        if (!consentAll || !consentAll.checked) {
          message =
            "Please confirm you have read and agreed to the Terms and consent to treatment.";
          focusElement = consentAll?.closest(".consent-item") || consentAll;
        } else if (!medicalCareDisclaimer || !medicalCareDisclaimer.checked) {
          message =
            "Please confirm you understand massage is not a substitute for medical care.";
          focusElement =
            medicalCareDisclaimer?.closest(".consent-item") ||
            medicalCareDisclaimer;
        }
        break;
      }
    }

    if (message) {
      // Prefer inline step validation message over alert popups
      const validationEl = document.getElementById("stepValidationMessage");
      if (validationEl) {
        validationEl.textContent = message;
        validationEl.style.display = "block";
        validationEl.classList.add("show");
      } else {
        // Fallback to alert if the message area is missing
        alert(message);
      }

      if (focusElement && typeof focusElement.scrollIntoView === "function") {
        focusElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  function updateButtonStates() {
    if (!prevBtn || !nextBtn || !submitBtn) return;

    prevBtn.style.display = currentStep === 1 ? "none" : "block";
    nextBtn.style.display = currentStep < TOTAL_STEPS ? "block" : "none";
    submitBtn.style.display = currentStep === TOTAL_STEPS ? "block" : "none";

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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.wizard = {
    getCurrentStep,
    goToStep,
    goToNextStep,
    goToPrevStep,
    updateButtonStates,
    validateCurrentStep,
  };
})();

// Show/hide 'seenOtherProvider' based on medical conditions
const seenOtherProviderGroup = document.getElementById(
  "seenOtherProviderGroup",
);
const seenOtherProviderInputs = document.getElementsByName("seenOtherProvider");
function updateSeenOtherProviderVisibility() {
  // List of conditions that should trigger the question (customize as needed)
  const triggerKeywords = [
    "pain",
    "injury",
    "injuries",
    "surgery",
    "surgeries",
    "condition",
    "chronic",
    "diagnosed",
    "treatment",
    "therapy",
    "illness",
    "disease",
  ];
  const checkedConditions = Array.from(
    document.querySelectorAll('input[name="medicalConditions"]:checked'),
  );
  const shouldShow = checkedConditions.some((cb) =>
    triggerKeywords.some((word) =>
      (cb.value || "").toLowerCase().includes(word),
    ),
  );
  if (seenOtherProviderGroup) {
    seenOtherProviderGroup.style.display = shouldShow ? "block" : "none";
    // Remove required if hidden
    seenOtherProviderInputs.forEach((input) => {
      if (shouldShow) {
        input.setAttribute("required", "");
      } else {
        input.removeAttribute("required");
        input.checked = false;
      }
    });
  }
}
// Attach to all medicalConditions checkboxes
document.querySelectorAll('input[name="medicalConditions"]').forEach((cb) => {
  cb.addEventListener("change", updateSeenOtherProviderVisibility);
});
// Run on load
updateSeenOtherProviderVisibility();
// Intake Form Validation and Submission
document.addEventListener("DOMContentLoaded", () => {
  // Handle pronouns self-describe conditional visibility
  const pronounsSelect = document.getElementById("pronouns");
  const pronounsSelfDescribeGroup = document.getElementById(
    "pronounsSelfDescribeGroup",
  );
  const pronounsSelfDescribeInput = document.getElementById(
    "pronounsSelfDescribe",
  );

  function updatePronounsSelfDescribeVisibility() {
    if (pronounsSelect && pronounsSelfDescribeGroup) {
      const showSelfDescribe = pronounsSelect.value === "Self-describe";
      pronounsSelfDescribeGroup.style.display = showSelfDescribe
        ? "block"
        : "none";
      if (pronounsSelfDescribeInput) {
        if (showSelfDescribe) {
          pronounsSelfDescribeInput.setAttribute("required", "");
        } else {
          pronounsSelfDescribeInput.removeAttribute("required");
          pronounsSelfDescribeInput.value = "";
        }
      }
    }
  }

  if (pronounsSelect) {
    pronounsSelect.addEventListener(
      "change",
      updatePronounsSelfDescribeVisibility,
    );
    updatePronounsSelfDescribeVisibility();
  }

  // Handle gender self-describe conditional visibility
  const genderRadios = document.querySelectorAll('input[name="gender"]');
  const genderSelfDescribeGroup = document.getElementById(
    "genderSelfDescribeGroup",
  );
  const genderSelfDescribeInput = document.getElementById("genderSelfDescribe");

  function updateGenderSelfDescribeVisibility() {
    const selectedGender = Array.from(genderRadios).find(
      (r) => r.checked,
    )?.value;
    const showSelfDescribe = selectedGender === "Self-describe";
    if (genderSelfDescribeGroup) {
      genderSelfDescribeGroup.style.display = showSelfDescribe
        ? "block"
        : "none";
      if (genderSelfDescribeInput) {
        if (showSelfDescribe) {
          genderSelfDescribeInput.setAttribute("required", "");
        } else {
          genderSelfDescribeInput.removeAttribute("required");
          genderSelfDescribeInput.value = "";
        }
      }
    }
  }

  genderRadios.forEach((radio) => {
    radio.addEventListener("change", updateGenderSelfDescribeVisibility);
  });
  updateGenderSelfDescribeVisibility();
  // Handle conditional required for medications
  const takingMedicationsRadios = document.querySelectorAll(
    'input[name="takingMedications"]',
  );
  const medicationsSection = document.getElementById("medicationsSection");
  const medicationsList = document.getElementById("medicationsList");

  function updateMedicationsVisibility() {
    const takesYes = document.querySelector(
      'input[name="takingMedications"][value="Yes"]:checked',
    );
    if (medicationsSection) {
      if (takesYes) {
        medicationsSection.classList.remove("hidden-field");
        medicationsSection.style.display = "block";
        if (medicationsList) {
          medicationsList.setAttribute("required", "");
        }
      } else {
        medicationsSection.classList.add("hidden-field");
        medicationsSection.style.display = "none";
        if (medicationsList) {
          medicationsList.removeAttribute("required");
          medicationsList.value = "";
        }
      }
    }
  }

  takingMedicationsRadios.forEach((radio) => {
    radio.addEventListener("change", updateMedicationsVisibility);
  });
  updateMedicationsVisibility();

  // Handle conditional required for allergies
  const hasAllergiesRadios = document.querySelectorAll(
    'input[name="hasAllergies"]',
  );
  const allergiesSection = document.getElementById("allergiesSection");
  const allergiesList = document.getElementById("allergiesList");

  function updateAllergiesVisibility() {
    const allergiesYes = document.querySelector(
      'input[name="hasAllergies"][value="Yes"]:checked',
    );
    if (allergiesSection) {
      if (allergiesYes) {
        allergiesSection.classList.remove("hidden-field");
        allergiesSection.style.display = "block";
        if (allergiesList) {
          allergiesList.setAttribute("required", "");
        }
      } else {
        allergiesSection.classList.add("hidden-field");
        allergiesSection.style.display = "none";
        if (allergiesList) {
          allergiesList.removeAttribute("required");
          allergiesList.value = "";
        }
      }
    }
  }

  hasAllergiesRadios.forEach((radio) => {
    radio.addEventListener("change", updateAllergiesVisibility);
  });
  updateAllergiesVisibility();

  // (Wizard step navigation logic removed; handled by wizard.js)

  // Hide health conditions and remove required if 'I Feel Fine Today' is checked
  const medicalConditionsCheckboxes = document.querySelectorAll(
    'input[name="medicalConditions"]',
  );
  const feelFineCheckbox = Array.from(medicalConditionsCheckboxes).find(
    (cb) => cb.value === "I Feel Fine Today",
  );
  const healthSections = [
    ...document.querySelectorAll(".checkbox-group label:not(:first-child)"), // all health conditions except 'I Feel Fine Today'
    document.getElementById("conditionsDetailsSection"),
    document.getElementById("injuriesSection"),
    ...document.querySelectorAll('input[name="hasRecentInjuries"]'),
    ...document.querySelectorAll(
      'input[name="medicalConditions"]:not([value="I Feel Fine Today"])',
    ),
  ];
  function updateHealthVisibility() {
    if (feelFineCheckbox && feelFineCheckbox.checked) {
      healthSections.forEach((section) => {
        if (section) {
          section.style.display = "none";
          if (section.hasAttribute && section.hasAttribute("required"))
            section.removeAttribute("required");
          if (section.querySelectorAll) {
            section
              .querySelectorAll("[required]")
              .forEach((el) => el.removeAttribute("required"));
          }
        }
      });
    } else {
      healthSections.forEach((section) => {
        if (section) {
          section.style.display = "";
          if (section.hasAttribute && section.hasAttribute("required"))
            section.setAttribute("required", "");
          if (section.querySelectorAll) {
            section
              .querySelectorAll('[data-original-required="true"]')
              .forEach((el) => el.setAttribute("required", ""));
          }
        }
      });
    }
  }
  if (feelFineCheckbox) {
    feelFineCheckbox.addEventListener("change", updateHealthVisibility);
    updateHealthVisibility();
  }
  // Allow unselecting the 'I feel well today' button
  const feelWellRadio = document.getElementById("feelWellRadio");
  const feelWellToggle = document.getElementById("feelWellToggle");
  if (feelWellRadio && feelWellToggle) {
    feelWellToggle.addEventListener("click", () => {
      if (feelWellRadio.checked) {
        feelWellRadio.checked = false;
        feelWellToggle.classList.remove("active");
      } else {
        feelWellRadio.checked = true;
        feelWellToggle.classList.add("active");
      }
    });
    // Set initial state
    if (feelWellRadio.checked) {
      feelWellToggle.classList.add("active");
    }
  }

  // Handle pain level slider with display of current value
  const painSlider = document.getElementById("painLevel");
  const painLevelValue = document.getElementById("painLevelValue");
  const painNotSureCheckbox = document.querySelector(
    'input[name="painNotSure"]',
  );

  function updatePainSliderDisplay() {
    if (painSlider && painLevelValue) {
      const value = painSlider.value;
      if (value === "") {
        painLevelValue.textContent = "";
        painSlider.style.opacity = "0.5";
      } else {
        painLevelValue.textContent = `Currently: ${value}/10`;
        painSlider.style.opacity = "1";
      }
    }
  }

  if (painSlider) {
    painSlider.addEventListener("input", updatePainSliderDisplay);
    updatePainSliderDisplay();
  }

  // Handle "Not sure" checkbox for pain level - clear slider when checked
  if (painNotSureCheckbox) {
    painNotSureCheckbox.addEventListener("change", () => {
      if (painNotSureCheckbox.checked) {
        if (painSlider) {
          painSlider.value = "";
          painSlider.disabled = true;
          updatePainSliderDisplay();
        }
      } else {
        if (painSlider) {
          painSlider.disabled = false;
          updatePainSliderDisplay();
        }
      }
    });
  }

  const form = document.getElementById("intakeForm");
  const submitBtn = document.getElementById("submitBtn");

  // Auto-format DOB input: insert '/' as user types
  const dobInput = document.getElementById("dateOfBirth");
  if (dobInput) {
    dobInput.addEventListener("input", (e) => {
      let v = dobInput.value.replace(/[^0-9]/g, "");
      if (v.length > 8) v = v.slice(0, 8);
      let formatted = v;
      if (v.length > 4)
        formatted = v.slice(0, 2) + "/" + v.slice(2, 4) + "/" + v.slice(4);
      else if (v.length > 2) formatted = v.slice(0, 2) + "/" + v.slice(2);
      dobInput.value = formatted;
    });
  }

  if (!form) return;

  const DRAFT_STORAGE_KEY = "flexionIntakeDraft";

  const loadDraft = () => {
    try {
      const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!stored) return;
      const data = JSON.parse(stored);
      const fields = Array.from(
        form.querySelectorAll("input, textarea, select"),
      );

      fields.forEach((field) => {
        if (!field.name) return;
        if (
          field.type === "hidden" ||
          field.id === "signatureData" ||
          field.id === "signedAt"
        )
          return;

        const savedValue = data[field.name];
        if (savedValue === undefined || savedValue === null) return;

        if (field.type === "checkbox") {
          if (Array.isArray(savedValue)) {
            field.checked = savedValue.includes(field.value || "on");
          } else {
            field.checked = Boolean(savedValue);
          }
        } else if (field.type === "radio") {
          field.checked = savedValue === field.value;
        } else {
          field.value = savedValue;
        }
      });

      // Trigger conditional UI updates
      form
        .querySelectorAll(
          'input[type="radio"]:checked, input[type="checkbox"]:checked',
        )
        .forEach((el) => {
          el.dispatchEvent(new Event("change", { bubbles: true }));
        });
      form.querySelectorAll('input[type="range"]').forEach((el) => {
        el.dispatchEvent(new Event("input", { bubbles: true }));
      });
    } catch (error) {
      console.warn("Could not load draft intake form data:", error);
    }
  };

  const saveDraft = () => {
    try {
      const data = {};
      const fields = Array.from(
        form.querySelectorAll("input, textarea, select"),
      );

      fields.forEach((field) => {
        if (!field.name) return;
        if (
          field.type === "hidden" ||
          field.id === "signatureData" ||
          field.id === "signedAt"
        )
          return;

        if (field.type === "checkbox") {
          if (!Array.isArray(data[field.name])) data[field.name] = [];
          if (field.checked) data[field.name].push(field.value || "on");
        } else if (field.type === "radio") {
          if (field.checked) data[field.name] = field.value;
        } else {
          data[field.name] = field.value;
        }
      });

      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn("Could not save draft intake form data:", error);
    }
  };

  const scheduleDraftSave = () => {
    clearTimeout(scheduleDraftSave._timer);
    scheduleDraftSave._timer = setTimeout(saveDraft, 250);
  };

  form.addEventListener("input", scheduleDraftSave);
  form.addEventListener("change", scheduleDraftSave);

  loadDraft();

  // Progressive disclosure for Other fields (checkboxes)

  // Step validation message for missing fields
  const stepValidationMessage = document.getElementById(
    "stepValidationMessage",
  );
  // Remove red highlight from circles (steps)
  const steps = document.querySelectorAll(".step");
  steps.forEach((step) => {
    step.classList.remove("step-error");
    step.style.borderColor = "";
  });
  // Show message if required fields missing
  form.addEventListener("submit", function (e) {
    const requiredFields = form.querySelectorAll("[required]");
    let missing = [];
    requiredFields.forEach((field) => {
      if (!field.value) missing.push(field.name || field.id);
    });
    if (missing.length > 0 && stepValidationMessage) {
      e.preventDefault();
      stepValidationMessage.textContent =
        "Please fill in all required fields before submitting.";
      stepValidationMessage.style.color = "#d9534f";
      stepValidationMessage.style.fontWeight = "bold";
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
  // Health red-flag banner and 'no issues' mutual exclusivity
  const healthChecks = Array.from(
    document.querySelectorAll('input[name="healthChecks"]'),
  );
  const healthBanner = document.getElementById("healthBanner");
  const noHealthIssues = document.getElementById("noHealthIssues");

  const updateHealthBanner = () => {
    if (!healthBanner) return;
    const anyChecked = healthChecks.some((cb) => cb.checked);
    if (anyChecked) {
      healthBanner.classList.remove("hidden-field");
      healthBanner.style.display = "block";
    } else {
      healthBanner.classList.add("hidden-field");
      healthBanner.style.display = "none";
      const note = document.getElementById("reviewNote");
      if (note) note.value = "";
    }
  };

  if (healthChecks.length && healthBanner) {
    // When 'I feel well today' is checked, clear other health checks. If any health check selected, clear 'no issues'
    healthChecks.forEach((cb) =>
      cb.addEventListener("change", () => {
        if (cb.checked && noHealthIssues && noHealthIssues.checked) {
          noHealthIssues.checked = false;
        }
        updateHealthBanner();
      }),
    );

    if (noHealthIssues) {
      noHealthIssues.addEventListener("change", () => {
        if (noHealthIssues.checked) {
          healthChecks.forEach((cb) => (cb.checked = false));
          updateHealthBanner();
        }
      });
    }

    updateHealthBanner();
  }

  // Table-specific field conditional visibility
  const tableOilPreferenceRadios = Array.from(
    document.querySelectorAll('input[name="tableOilPreference"]'),
  );
  const tableOilAllergySection = document.getElementById(
    "tableOilAllergySection",
  );
  const tablePositionComfortRadios = Array.from(
    document.querySelectorAll('input[name="tablePositionComfort"]'),
  );
  const tablePositionDetailsSection = document.getElementById(
    "tablePositionDetailsSection",
  );

  const updateTableOilAllergyVisibility = () => {
    const sensitiveRadio = document.querySelector(
      'input[name="tableOilPreference"][value="sensitive"]',
    );
    if (sensitiveRadio && tableOilAllergySection) {
      if (sensitiveRadio.checked) {
        tableOilAllergySection.classList.remove("hidden-field");
        tableOilAllergySection.style.display = "block";
      } else {
        tableOilAllergySection.classList.add("hidden-field");
        tableOilAllergySection.style.display = "none";
        // Clear field when hidden
        const allergyDetails = document.getElementById(
          "tableOilAllergyDetails",
        );
        if (allergyDetails) allergyDetails.value = "";
        const allergyError = document.getElementById(
          "error-tableOilAllergyDetails",
        );
        if (allergyError) allergyError.textContent = "";
      }
    }
  };

  const updateTablePositionDetailsVisibility = () => {
    const troubleRadio = document.querySelector(
      'input[name="tablePositionComfort"][value="trouble"]',
    );
    if (troubleRadio && tablePositionDetailsSection) {
      if (troubleRadio.checked) {
        tablePositionDetailsSection.classList.remove("hidden-field");
        tablePositionDetailsSection.style.display = "block";
      } else {
        tablePositionDetailsSection.classList.add("hidden-field");
        tablePositionDetailsSection.style.display = "none";
        // Clear field when hidden
        const positionDetails = document.getElementById("tablePositionDetails");
        if (positionDetails) positionDetails.value = "";
        const positionError = document.getElementById(
          "error-tablePositionDetails",
        );
        if (positionError) positionError.textContent = "";
      }
    }
  };

  // Add event listeners for table field visibility
  tableOilPreferenceRadios.forEach((radio) => {
    radio.addEventListener("change", updateTableOilAllergyVisibility);
  });

  tablePositionComfortRadios.forEach((radio) => {
    radio.addEventListener("change", updateTablePositionDetailsVisibility);
  });

  // Initialize table field visibility on load
  updateTableOilAllergyVisibility();
  updateTablePositionDetailsVisibility();

  // Auto-expand avoidNotes textarea
  const avoidNotes = document.getElementById("avoidNotes");
  if (avoidNotes) {
    const resize = () => {
      avoidNotes.style.height = "auto";
      avoidNotes.style.height = avoidNotes.scrollHeight + "px";
    };
    avoidNotes.addEventListener("input", resize);
    // initialize
    setTimeout(resize, 0);
  }

  // Submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await submitForm("submitted");
  });

  async function submitForm(status) {
    // Validate combined consent
    const consentAllEl = document.getElementById("consentAll");

    if (!consentAllEl) {
      alert("Consent field is not available. Please reload the page.");
      return;
    }

    if (!consentAllEl.checked) {
      alert(
        "Please confirm you have read and agreed to the Terms and consent to treatment.",
      );
      return;
    }

    // Get drawn signature data (if any)
    const sigField = document.getElementById("signatureData");
    const signedAtField = document.getElementById("signedAt");

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
    if (data["mobile"] && window.AUPhoneFormatter) {
      const canonical = AUPhoneFormatter.normalizeToCanonical(data["mobile"]);
      if (canonical) {
        data["mobile"] = canonical;
      }
    }

    // Normalize health checks to array and include otherHealthConcernText if present
    if (data["healthChecks"]) {
      data["healthChecks"] = Array.isArray(data["healthChecks"])
        ? data["healthChecks"]
        : [data["healthChecks"]];
    }
    if (
      data["otherHealthConcernText"] &&
      data["otherHealthConcernText"].trim()
    ) {
      data["healthChecks"] = data["healthChecks"]
        ? data["healthChecks"].concat([
            `Other: ${data["otherHealthConcernText"].trim()}`,
          ])
        : [`Other: ${data["otherHealthConcernText"].trim()}`];
    }

    // Ensure 'noHealthIssues' represented
    if (
      document.getElementById("noHealthIssues") &&
      document.getElementById("noHealthIssues").checked
    ) {
      data["healthChecks"] = ["No issues to report"];
    }

    // Ensure combined consent and opt-in booleans are included
    data.consentAll =
      !!document.getElementById("consentAll") &&
      document.getElementById("consentAll").checked;
    data.emailOptIn =
      !!document.getElementById("emailOptIn") &&
      document.getElementById("emailOptIn").checked;

    // Capture the rendered muscle map canvas as an image
    const muscleCanvas = document.querySelector(".muscle-map-canvas");
    if (muscleCanvas && window.muscleMap && window.muscleMap.marks.length > 0) {
      try {
        data.muscleMapImage = muscleCanvas.toDataURL("image/png");
      } catch (e) {
        console.warn("Could not capture muscle map canvas:", e);
      }
    }

    // Metadata
    const nowIso = new Date().toISOString();
    data.submissionDate = nowIso;
    data.createdAt = nowIso;
    data.updatedAt = nowIso;
    data.status = status;
    // Use formType from hidden field, or get from localStorage, default to 'seated'
    data.formType =
      document.getElementById("formType")?.value ||
      (typeof getSelectedFormType === "function"
        ? getSelectedFormType()
        : "seated") ||
      "seated";

    // Ensure selectedBrand is included (from hidden field or localStorage)
    if (!data.selectedBrand && typeof getSelectedBrand === "function") {
      data.selectedBrand = getSelectedBrand() || "flexion";
    }

    // Show loading with progress steps
    const showLoading = window.FormUtils
      ? window.FormUtils.showLoading
      : fallbackShowLoading;
    const updateLoadingMessage = window.FormUtils
      ? window.FormUtils.updateLoadingMessage
      : () => {};
    const safeParseJSON = window.FormUtils
      ? window.FormUtils.safeParseJSON
      : async (r) => r.json();
    const showToast = window.FormUtils
      ? window.FormUtils.showToast
      : (msg) => alert(msg);

    showLoading("Validating your information...");

    try {
      updateLoadingMessage("Saving your information...");

      const headers = { "Content-Type": "application/json" };

      // Add E2E mode header for testing
      if (window._E2E_MODE) {
        headers["x-e2e-mode"] = "true";
      }

      const response = await fetch("/api/submit-form", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(data),
      });

      updateLoadingMessage("Processing response...");
      const result = await safeParseJSON(response);

      if (response.ok && result.success) {
        updateLoadingMessage("Success! Redirecting...");
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        window.location.href = "/success";
      } else {
        showLoading(false);
        showToast(
          result.message || "An error occurred. Please try again.",
          "error",
        );
      }
    } catch (error) {
      console.error("Submission error:", error);
      showLoading(false);
      showToast(
        "A network error occurred. Please check your connection and try again.",
        "error",
      );
    }
  }
});

// Fallback loading function if form-utils.js isn't loaded
function fallbackShowLoading(show) {
  let overlay = document.querySelector(".loading-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "loading-overlay";
    overlay.setAttribute("role", "status");
    overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p class="loading-message">Processing...</p>
            </div>
        `;
    document.body.appendChild(overlay);
  }

  if (show) {
    const messageEl = overlay.querySelector(".loading-message");
    if (messageEl)
      messageEl.textContent = typeof show === "string" ? show : "Processing...";
    overlay.classList.add("active");
  } else {
    overlay.classList.remove("active");
  }
}

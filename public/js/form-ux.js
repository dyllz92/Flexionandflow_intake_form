/**
 * Form UX Enhancement Module
 * Inline validation, auto-save, and improved usability features
 */

class FormUXManager {
  constructor() {
    this.autoSaveInterval = 30000; // 30 seconds
    this.autoSaveTimer = null;
    this.validationTimeout = 500; // Delay before showing validation
    this.progressEstimates = new Map();
    this.init();
  }

  init() {
    this.setupInlineValidation();
    this.setupAutoSave();
    this.setupProgressEstimation();
    this.setupFieldFormatting();
    this.setupCompletionTracking();
    this.enhanceUserFeedback();
  }

  /**
   * Setup Real-time Inline Validation
   */
  setupInlineValidation() {
    const formControls = document.querySelectorAll("input, select, textarea");

    formControls.forEach((field) => {
      let validationTimer;

      // Real-time validation on input
      field.addEventListener("input", () => {
        clearTimeout(validationTimer);
        validationTimer = setTimeout(() => {
          this.validateField(field, false);
        }, this.validationTimeout);
      });

      // Immediate validation on blur
      field.addEventListener("blur", () => {
        clearTimeout(validationTimer);
        this.validateField(field, true);
      });

      // Clear validation on focus
      field.addEventListener("focus", () => {
        this.clearFieldValidation(field);
      });
    });
  }

  /**
   * Enhanced Field Validation
   */
  validateField(field, showSuccess = false) {
    const isValid = this.performFieldValidation(field);
    const errorElement = document.getElementById(`${field.id}-error`);
    const successElement = document.getElementById(`${field.id}-success`);

    if (!isValid) {
      this.showFieldError(
        field,
        errorElement,
        this.getValidationMessage(field),
      );
    } else {
      this.clearFieldError(field, errorElement);
      if (showSuccess && field.value.trim() !== "") {
        this.showFieldSuccess(field, successElement, "Valid input");
      }
    }

    // Update progress
    this.updateFormProgress();

    // Announce to screen readers if accessibility manager is available
    if (window.accessibilityManager) {
      const message = isValid
        ? `${field.name || field.id} is valid`
        : `Error in ${field.name || field.id}: ${this.getValidationMessage(field)}`;
      window.accessibilityManager.announce(message, "polite");
    }
  }

  performFieldValidation(field) {
    // Check HTML5 validity first
    if (!field.checkValidity()) {
      return false;
    }

    // Custom validation rules
    switch (field.type) {
      case "email":
        return this.validateEmail(field.value);
      case "tel":
        return this.validatePhone(field.value);
      case "date":
        return this.validateDate(field.value);
      default:
        if (field.hasAttribute("data-validate")) {
          return this.customValidation(field);
        }
        return true;
    }
  }

  validateEmail(email) {
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  validatePhone(phone) {
    // Australian phone number validation
    const phoneRegex = /^(?:\\+61|0)[2-478](?:[ -]?[0-9]){8}$/;
    return phoneRegex.test(phone.replace(/\\s/g, ""));
  }

  validateDate(date) {
    const dateObj = new Date(date);
    const today = new Date();

    // Ensure date is valid and not in the future
    return dateObj instanceof Date && !isNaN(dateObj) && dateObj <= today;
  }

  customValidation(field) {
    const validationType = field.getAttribute("data-validate");
    const value = field.value.trim();

    switch (validationType) {
      case "age":
        const age = parseInt(value);
        return age >= 0 && age <= 120;
      case "postcode":
        return /^[0-9]{4}$/.test(value);
      case "medicare":
        return this.validateMedicare(value);
      default:
        return true;
    }
  }

  validateMedicare(medicare) {
    // Basic Medicare number validation (simplified)
    const cleanNumber = medicare.replace(/\\s/g, "");
    return /^[0-9]{10}$/.test(cleanNumber);
  }

  getValidationMessage(field) {
    if (field.validity.valueMissing) {
      return `${this.getFieldLabel(field)} is required`;
    }
    if (field.validity.typeMismatch) {
      return `Please enter a valid ${field.type}`;
    }
    if (field.validity.patternMismatch) {
      return `${this.getFieldLabel(field)} format is invalid`;
    }
    if (field.validity.rangeUnderflow) {
      return `Value must be at least ${field.min}`;
    }
    if (field.validity.rangeOverflow) {
      return `Value must be no more than ${field.max}`;
    }

    // Custom messages
    const customMessage = field.getAttribute("data-error-message");
    if (customMessage) {
      return customMessage;
    }

    return "Please check this field";
  }

  getFieldLabel(field) {
    const label = document.querySelector(`label[for="${field.id}"]`);
    return label
      ? label.textContent.replace(/\\s*\\*\\s*$/, "")
      : field.name || field.id;
  }

  showFieldError(field, errorElement, message) {
    field.classList.add("error");
    field.setAttribute("aria-invalid", "true");

    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add("show");
      errorElement.style.animation = "slideIn 0.3s ease-out";
    }
  }

  clearFieldError(field, errorElement) {
    field.classList.remove("error");
    field.setAttribute("aria-invalid", "false");

    if (errorElement) {
      errorElement.classList.remove("show");
      errorElement.textContent = "";
    }
  }

  showFieldSuccess(field, successElement, message) {
    field.classList.add("success");

    if (successElement) {
      successElement.textContent = message;
      successElement.classList.add("show");

      // Auto-hide success message
      setTimeout(() => {
        successElement.classList.remove("show");
        field.classList.remove("success");
      }, 2000);
    }
  }

  clearFieldValidation(field) {
    field.classList.remove("error", "success");
    field.setAttribute("aria-invalid", "false");

    const errorElement = document.getElementById(`${field.id}-error`);
    const successElement = document.getElementById(`${field.id}-success`);

    if (errorElement) {
      errorElement.classList.remove("show");
    }
    if (successElement) {
      successElement.classList.remove("show");
    }
  }

  /**
   * Auto-Save Functionality
   */
  setupAutoSave() {
    const form = document.querySelector("form");
    if (!form) return;

    // Load saved data on page load
    this.loadSavedData();

    // Setup auto-save on form changes
    form.addEventListener("input", () => {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = setTimeout(() => {
        this.saveFormData();
      }, this.autoSaveInterval);
    });

    // Save before page unload
    window.addEventListener("beforeunload", () => {
      this.saveFormData();
    });

    // Periodic auto-save
    setInterval(() => {
      this.saveFormData();
    }, this.autoSaveInterval);
  }

  loadSavedData() {
    try {
      const savedData = localStorage.getItem("intake-form-data");
      if (savedData) {
        const data = JSON.parse(savedData);
        const saveDate = new Date(data.timestamp);
        const now = new Date();
        const hoursSincesSave = (now - saveDate) / (1000 * 60 * 60);

        // Only load if saved within last 24 hours
        if (hoursSincesSave < 24) {
          this.populateForm(data.formData);
          this.showAutoSaveNotification("Previous form data restored", "info");
        } else {
          localStorage.removeItem("intake-form-data");
        }
      }
    } catch (error) {
      console.error("Error loading saved data:", error);
    }
  }

  saveFormData() {
    try {
      const formData = this.collectFormData();
      const saveData = {
        formData,
        timestamp: new Date().toISOString(),
        currentStep: this.getCurrentStep(),
      };

      localStorage.setItem("intake-form-data", JSON.stringify(saveData));
      this.showAutoSaveNotification("Form data saved automatically", "success");
    } catch (error) {
      console.error("Error saving form data:", error);
      this.showAutoSaveNotification("Unable to save form data", "error");
    }
  }

  collectFormData() {
    const form = document.querySelector("form");
    const formData = new FormData(form);
    const data = {};

    for (let [key, value] of formData.entries()) {
      if (data[key]) {
        // Handle multiple values (checkboxes)
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    }

    return data;
  }

  populateForm(data) {
    Object.entries(data).forEach(([key, value]) => {
      const field = document.querySelector(`[name="${key}"]`);
      if (field) {
        if (field.type === "checkbox" || field.type === "radio") {
          if (Array.isArray(value)) {
            value.forEach((v) => {
              const specificField = document.querySelector(
                `[name="${key}"][value="${v}"]`,
              );
              if (specificField) specificField.checked = true;
            });
          } else {
            const specificField = document.querySelector(
              `[name="${key}"][value="${value}"]`,
            );
            if (specificField) specificField.checked = true;
          }
        } else {
          field.value = Array.isArray(value) ? value[0] : value;
        }
      }
    });
  }

  getCurrentStep() {
    const currentStep = document.querySelector(".step.active .step-number");
    return currentStep ? parseInt(currentStep.textContent) : 1;
  }

  /**
   * Progress Estimation
   */
  setupProgressEstimation() {
    this.calculateFormMetrics();
    this.updateFormProgress();

    // Update progress on form changes
    document.addEventListener("input", () => {
      this.updateFormProgress();
    });
  }

  calculateFormMetrics() {
    const allFields = document.querySelectorAll(
      'input:not([type="hidden"]), select, textarea',
    );
    const requiredFields = document.querySelectorAll(
      "input[required], select[required], textarea[required]",
    );

    this.totalFields = allFields.length;
    this.requiredFields = requiredFields.length;
    this.fieldWeights = new Map();

    // Assign weights to different field types
    allFields.forEach((field) => {
      let weight = 1;
      if (field.type === "textarea") weight = 3;
      if (field.type === "email") weight = 2;
      if (field.hasAttribute("required")) weight += 1;

      this.fieldWeights.set(field.id || field.name, weight);
    });
  }

  updateFormProgress() {
    const completedFields = this.getCompletedFields();
    const totalWeight = Array.from(this.fieldWeights.values()).reduce(
      (sum, weight) => sum + weight,
      0,
    );
    const completedWeight = completedFields.reduce((sum, field) => {
      return sum + (this.fieldWeights.get(field.id || field.name) || 1);
    }, 0);

    const percentage = Math.round((completedWeight / totalWeight) * 100);
    const estimatedTimeRemaining = this.calculateTimeEstimate(percentage);

    this.updateProgressDisplay(percentage, estimatedTimeRemaining);

    // Announce significant progress milestones
    if (
      percentage > 0 &&
      percentage % 25 === 0 &&
      window.accessibilityManager
    ) {
      window.accessibilityManager.announceProgress(percentage, 100);
    }
  }

  getCompletedFields() {
    const allFields = document.querySelectorAll(
      'input:not([type="hidden"]), select, textarea',
    );
    return Array.from(allFields).filter((field) => {
      if (field.type === "checkbox" || field.type === "radio") {
        const groupName = field.name;
        return document.querySelector(`[name="${groupName}"]:checked`) !== null;
      }
      return field.value.trim() !== "";
    });
  }

  calculateTimeEstimate(percentage) {
    const averageTimePerField = 15; // seconds
    const remainingFields = (this.totalFields * (100 - percentage)) / 100;
    return Math.round((remainingFields * averageTimePerField) / 60); // minutes
  }

  updateProgressDisplay(percentage, timeEstimate) {
    // Update progress bar if it exists
    const progressBar = document.querySelector(".ux-progress-fill");
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
      progressBar.style.transition = "width 0.5s ease-in-out";
    }

    // Update progress text
    let progressText = document.getElementById("progress-text");
    if (!progressText) {
      progressText = document.createElement("div");
      progressText.id = "progress-text";
      progressText.className = "ux-progress-text";
      const progressContainer =
        document.querySelector(".ux-progress-container") ||
        document.querySelector(".step-progress");
      if (progressContainer) {
        progressContainer.appendChild(progressText);
      }
    }

    progressText.textContent =
      `${percentage}% complete` +
      (timeEstimate > 0 ? ` • ~${timeEstimate} min remaining` : "");
  }

  /**
   * Smart Field Formatting
   */
  setupFieldFormatting() {
    // Phone number formatting
    const phoneFields = document.querySelectorAll('input[type="tel"]');
    phoneFields.forEach((field) => {
      field.addEventListener("input", (e) => {
        e.target.value = this.formatPhoneNumber(e.target.value);
      });
    });

    // Date formatting
    const dateFields = document.querySelectorAll('input[type="date"]');
    dateFields.forEach((field) => {
      field.addEventListener("blur", (e) => {
        if (e.target.value) {
          e.target.value = this.formatDate(e.target.value);
        }
      });
    });

    // Postcode formatting
    const postcodeFields = document.querySelectorAll(
      'input[data-validate="postcode"]',
    );
    postcodeFields.forEach((field) => {
      field.addEventListener("input", (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
      });
    });
  }

  formatPhoneNumber(phone) {
    // Remove all non-digits
    const digits = phone.replace(/\\D/g, "");

    // Format Australian mobile numbers
    if (digits.length >= 10) {
      return digits.replace(/(\\d{4})(\\d{3})(\\d{3})/, "$1 $2 $3");
    }

    return digits;
  }

  formatDate(dateStr) {
    try {
      const date = new Date(dateStr);
      if (!isNaN(date)) {
        return date.toISOString().split("T")[0];
      }
    } catch (error) {
      console.error("Date formatting error:", error);
    }
    return dateStr;
  }

  /**
   * Enhanced User Feedback
   */
  enhanceUserFeedback() {
    this.createFloatingNotifications();
    this.setupHelpTooltips();
  }

  createFloatingNotifications() {
    const container = document.createElement("div");
    container.id = "notification-container";
    container.className = "notification-container";
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      max-width: 350px;
    `;
    document.body.appendChild(container);
  }

  showAutoSaveNotification(message, type = "info") {
    const container = document.getElementById("notification-container");
    if (!container) return;

    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      background: ${this.getNotificationColor(type)};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 8px;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    notification.textContent = message;

    container.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 10);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  getNotificationColor(type) {
    switch (type) {
      case "success":
        return "#28a745";
      case "error":
        return "#dc3545";
      case "warning":
        return "#ffc107";
      default:
        return "#17a2b8";
    }
  }

  /**
   * Form Completion Tracking
   */
  setupCompletionTracking() {
    // Track field interaction for analytics
    const fields = document.querySelectorAll("input, select, textarea");
    fields.forEach((field) => {
      field.addEventListener("focus", () => {
        this.trackFieldInteraction(field, "focus");
      });

      field.addEventListener("blur", () => {
        this.trackFieldInteraction(field, "blur");
      });
    });
  }

  trackFieldInteraction(field, action) {
    // Could be extended to send analytics data
    console.log(`Field interaction: ${field.name || field.id} - ${action}`);
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.formUXManager = new FormUXManager();
});

// Export for use by other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = FormUXManager;
}

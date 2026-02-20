/**
 * Accessibility Enhancement Module
 * Provides WCAG 2.1 AA compliance features
 */

class AccessibilityManager {
  constructor() {
    this.liveRegion = null;
    this.focusHistory = [];
    this.init();
  }

  init() {
    this.createLiveRegion();
    this.setupSkipLinks();
    this.enhanceFormAccessibility();
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupRovingTabindex();
  }

  /**
   * Create ARIA Live Region for Dynamic Announcements
   */
  createLiveRegion() {
    // Polite announcements
    this.liveRegion = document.createElement("div");
    this.liveRegion.setAttribute("aria-live", "polite");
    this.liveRegion.setAttribute("aria-atomic", "true");
    this.liveRegion.className = "live-region polite";
    this.liveRegion.id = "live-region-polite";
    document.body.appendChild(this.liveRegion);

    // Assertive announcements
    this.assertiveLiveRegion = document.createElement("div");
    this.assertiveLiveRegion.setAttribute("aria-live", "assertive");
    this.assertiveLiveRegion.setAttribute("aria-atomic", "true");
    this.assertiveLiveRegion.className = "live-region assertive";
    this.assertiveLiveRegion.id = "live-region-assertive";
    document.body.appendChild(this.assertiveLiveRegion);
  }

  /**
   * Announce message to screen readers
   */
  announce(message, priority = "polite") {
    const region =
      priority === "assertive" ? this.assertiveLiveRegion : this.liveRegion;

    // Clear previous message
    region.textContent = "";

    // Add new message after short delay to ensure it's announced
    setTimeout(() => {
      region.textContent = message;
    }, 100);

    // Clear message after announcement
    setTimeout(() => {
      region.textContent = "";
    }, 3000);
  }

  /**
   * Setup Skip Links for Keyboard Navigation
   */
  setupSkipLinks() {
    const skipLink = document.createElement("a");
    skipLink.href = "#main-content";
    skipLink.textContent = "Skip to main content";
    skipLink.className = "skip-link sr-only-focusable";
    skipLink.addEventListener("click", (e) => {
      e.preventDefault();
      const target =
        document.getElementById("main-content") ||
        document.querySelector("main") ||
        document.querySelector('[role="main"]') ||
        document.querySelector(".wizard-container");
      if (target) {
        target.focus();
        target.scrollIntoView();
        this.announce("Skipped to main content");
      }
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  /**
   * Enhance Form Accessibility
   */
  enhanceFormAccessibility() {
    // Add ARIA labels to form controls
    const formControls = document.querySelectorAll("input, select, textarea");
    formControls.forEach((control) => {
      const label = document.querySelector(`label[for="${control.id}"]`);
      if (label && !control.getAttribute("aria-label")) {
        control.setAttribute(
          "aria-describedby",
          this.createDescribedBy(control),
        );
      }

      // Add validation attributes
      if (control.hasAttribute("required")) {
        control.setAttribute("aria-required", "true");
      }

      // Setup validation feedback
      this.setupValidationFeedback(control);
    });

    // Enhance fieldsets
    const fieldsets = document.querySelectorAll("fieldset");
    fieldsets.forEach((fieldset) => {
      const legend = fieldset.querySelector("legend");
      if (legend) {
        fieldset.setAttribute(
          "aria-labelledby",
          legend.id || this.generateId("legend"),
        );
        if (!legend.id) {
          legend.id = fieldset.getAttribute("aria-labelledby");
        }
      }
    });
  }

  /**
   * Setup Validation Feedback
   */
  setupValidationFeedback(control) {
    const createFeedbackElement = (type) => {
      const feedback = document.createElement("div");
      feedback.id = `${control.id}-${type}`;
      feedback.className = `field-${type}`;
      feedback.setAttribute("role", type === "error" ? "alert" : "status");
      feedback.setAttribute(
        "aria-live",
        type === "error" ? "assertive" : "polite",
      );
      control.parentNode.insertBefore(feedback, control.nextSibling);
      return feedback;
    };

    // Create error and success feedback elements
    const errorFeedback = createFeedbackElement("error");
    const successFeedback = createFeedbackElement("success");

    // Update aria-describedby
    const describedBy = [
      control.getAttribute("aria-describedby"),
      errorFeedback.id,
      successFeedback.id,
    ]
      .filter(Boolean)
      .join(" ");

    control.setAttribute("aria-describedby", describedBy);

    // Validation event handlers
    control.addEventListener("invalid", (e) => {
      e.preventDefault();
      this.showValidationError(
        control,
        errorFeedback,
        e.target.validationMessage,
      );
    });

    control.addEventListener("input", () => {
      if (control.validity.valid && errorFeedback.classList.contains("show")) {
        this.hideValidationError(control, errorFeedback);
        this.showValidationSuccess(control, successFeedback, "Valid input");
      }
    });
  }

  showValidationError(control, feedback, message) {
    control.classList.add("error");
    control.setAttribute("aria-invalid", "true");
    feedback.textContent = message;
    feedback.classList.add("show");
    this.announce(`Error: ${message}`, "assertive");

    // Focus the control if not already focused
    if (document.activeElement !== control) {
      control.focus();
    }
  }

  hideValidationError(control, feedback) {
    control.classList.remove("error");
    control.setAttribute("aria-invalid", "false");
    feedback.classList.remove("show");
    feedback.textContent = "";
  }

  showValidationSuccess(control, feedback, message) {
    control.classList.add("success");
    feedback.textContent = message;
    feedback.classList.add("show");

    // Hide success message after 2 seconds
    setTimeout(() => {
      feedback.classList.remove("show");
      control.classList.remove("success");
    }, 2000);
  }

  /**
   * Setup Keyboard Navigation
   */
  setupKeyboardNavigation() {
    document.addEventListener("keydown", (e) => {
      // Escape key handling
      if (e.key === "Escape") {
        this.handleEscape();
      }

      // Arrow key navigation for radio groups
      if (
        (e.key === "ArrowUp" || e.key === "ArrowDown") &&
        e.target.type === "radio"
      ) {
        this.handleRadioNavigation(e);
      }

      // Tab key focus management
      if (e.key === "Tab") {
        this.trackFocusHistory(e.target);
      }
    });
  }

  handleEscape() {
    // Close any open dropdowns, modals, or return focus to previous element
    const activeElement = document.activeElement;
    if (this.focusHistory.length > 1) {
      const previousFocus = this.focusHistory[this.focusHistory.length - 2];
      if (previousFocus && previousFocus.focus) {
        previousFocus.focus();
      }
    }
  }

  handleRadioNavigation(e) {
    e.preventDefault();
    const radios = document.querySelectorAll(`input[name="${e.target.name}"]`);
    const currentIndex = Array.from(radios).indexOf(e.target);
    let nextIndex;

    if (e.key === "ArrowUp") {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : radios.length - 1;
    } else {
      nextIndex = currentIndex < radios.length - 1 ? currentIndex + 1 : 0;
    }

    radios[nextIndex].focus();
    radios[nextIndex].checked = true;
    radios[nextIndex].dispatchEvent(new Event("change", { bubbles: true }));
  }

  /**
   * Focus Management
   */
  setupFocusManagement() {
    // Enhanced focus indicators
    document.addEventListener("focusin", (e) => {
      this.trackFocusHistory(e.target);
      e.target.classList.add("focused");
    });

    document.addEventListener("focusout", (e) => {
      e.target.classList.remove("focused");
    });

    // Manage focus for dynamic content changes
    this.observeContentChanges();
  }

  trackFocusHistory(element) {
    this.focusHistory.push(element);
    // Keep only last 10 focused elements
    if (this.focusHistory.length > 10) {
      this.focusHistory.shift();
    }
  }

  /**
   * Setup Roving Tabindex for Complex Widgets
   */
  setupRovingTabindex() {
    const stepIndicators = document.querySelectorAll(".step-number");
    if (stepIndicators.length > 1) {
      stepIndicators.forEach((step, index) => {
        step.setAttribute("tabindex", index === 0 ? "0" : "-1");
        step.setAttribute("role", "button");
        step.setAttribute(
          "aria-label",
          `Step ${index + 1} of ${stepIndicators.length}`,
        );

        step.addEventListener("keydown", (e) => {
          this.handleStepNavigation(e, stepIndicators);
        });
      });
    }
  }

  handleStepNavigation(e, steps) {
    const currentIndex = Array.from(steps).indexOf(e.target);
    let nextIndex;

    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        nextIndex = (currentIndex + 1) % steps.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        nextIndex = (currentIndex - 1 + steps.length) % steps.length;
        break;
      case "Home":
        e.preventDefault();
        nextIndex = 0;
        break;
      case "End":
        e.preventDefault();
        nextIndex = steps.length - 1;
        break;
      default:
        return;
    }

    // Update tabindex and focus
    steps[currentIndex].setAttribute("tabindex", "-1");
    steps[nextIndex].setAttribute("tabindex", "0");
    steps[nextIndex].focus();
  }

  /**
   * Observe Content Changes for Dynamic Accessibility Updates
   */
  observeContentChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          // Re-enhance accessibility for new form controls
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const newControls = node.querySelectorAll(
                "input, select, textarea",
              );
              newControls.forEach((control) => {
                this.setupValidationFeedback(control);
              });
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Utility Functions
   */
  createDescribedBy(control) {
    const helpText = control.parentNode.querySelector(
      ".form-help, .input-hint",
    );
    if (helpText) {
      if (!helpText.id) {
        helpText.id = this.generateId("help");
      }
      return helpText.id;
    }
    return "";
  }

  generateId(prefix = "a11y") {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Step Navigation Announcements
   */
  announceStepChange(stepNumber, stepTitle, totalSteps) {
    const message = `Step ${stepNumber} of ${totalSteps}: ${stepTitle}`;
    this.announce(message, "polite");
  }

  /**
   * Progress Announcements
   */
  announceProgress(completed, total) {
    const percentage = Math.round((completed / total) * 100);
    this.announce(`Form ${percentage}% complete`, "polite");
  }

  /**
   * Error Summary for Form Submission
   */
  announceErrors(errors) {
    if (errors.length === 0) return;

    const errorCount = errors.length;
    const summary = `${errorCount} error${errorCount > 1 ? "s" : ""} found. Please review and fix the following issues.`;
    this.announce(summary, "assertive");
  }
}

// Initialize accessibility when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.accessibilityManager = new AccessibilityManager();
});

// Export for use by other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = AccessibilityManager;
}

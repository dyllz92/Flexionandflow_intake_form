/**
 * Form Error Boundaries System
 * Provides comprehensive error handling to prevent form crashes
 * and maintain user data when JavaScript errors occur
 */

(function () {
  "use strict";

  // Error boundary state management
  const errorBoundaries = new Map();
  const errorHistory = [];
  const MAX_ERROR_HISTORY = 50;

  // Error boundary configuration
  const ERROR_BOUNDARY_CONFIG = {
    autoRecover: true,
    recoverDelay: 2000,
    maxRetries: 3,
    enableLogging: true,
    saveStateOnError: true,
    showFallbackUI: true,
  };

  /**
   * Create an error boundary for a specific component/section
   */
  class FormErrorBoundary {
    constructor(containerId, config = {}) {
      this.containerId = containerId;
      this.container = document.getElementById(containerId);
      this.config = { ...ERROR_BOUNDARY_CONFIG, ...config };
      this.errorCount = 0;
      this.originalContent = null;
      this.savedState = null;
      this.isInErrorState = false;

      if (!this.container) {
        console.warn(`Error boundary container '${containerId}' not found`);
        return;
      }

      this.init();
    }

    init() {
      // Store original content
      this.originalContent = this.container.innerHTML;

      // Set up error boundary
      this.setupErrorHandling();

      // Store in global registry
      errorBoundaries.set(this.containerId, this);

      console.debug(`Error boundary initialized for: ${this.containerId}`);
    }

    setupErrorHandling() {
      // Wrap all event handlers in try/catch
      this.wrapEventHandlers();

      // Monitor for unhandled errors in this section
      this.setupErrorListener();
    }

    wrapEventHandlers() {
      const elements = this.container.querySelectorAll(
        "[onclick], button, input, select, textarea",
      );

      elements.forEach((element) => {
        this.wrapElementEvents(element);
      });
    }

    wrapElementEvents(element) {
      const events = ["click", "change", "input", "focus", "blur", "submit"];

      events.forEach((eventType) => {
        const originalHandler = element[`on${eventType}`];

        if (originalHandler) {
          element[`on${eventType}`] = (event) => {
            try {
              return originalHandler.call(element, event);
            } catch (error) {
              this.handleError(
                error,
                `${eventType} event on ${element.tagName}#${element.id}`,
              );
              return false;
            }
          };
        }

        // Also wrap addEventListener calls (requires monkey patching)
        const originalAddEventListener = element.addEventListener;
        element.addEventListener = (type, listener, options) => {
          const wrappedListener = (event) => {
            try {
              return listener.call(element, event);
            } catch (error) {
              this.handleError(
                error,
                `${type} event listener on ${element.tagName}#${element.id}`,
              );
            }
          };

          return originalAddEventListener.call(
            element,
            type,
            wrappedListener,
            options,
          );
        };
      });
    }

    setupErrorListener() {
      // Listen for unhandled errors that bubble up
      window.addEventListener("error", (event) => {
        if (this.isErrorFromThisSection(event.error)) {
          this.handleError(event.error, "Uncaught error");
        }
      });

      // Listen for unhandled promise rejections
      window.addEventListener("unhandledrejection", (event) => {
        if (this.isErrorFromThisSection(event.reason)) {
          this.handleError(event.reason, "Unhandled promise rejection");
        }
      });
    }

    isErrorFromThisSection(error) {
      // Simple heuristic: check if error stack contains element IDs from this section
      if (!error || !error.stack) return false;

      const elements = this.container.querySelectorAll("[id]");
      return Array.from(elements).some(
        (el) =>
          error.stack.includes(el.id) || error.stack.includes(this.containerId),
      );
    }

    handleError(error, context = "") {
      this.errorCount++;

      // Log error details
      const errorInfo = {
        containerId: this.containerId,
        error: error.message || error,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        errorCount: this.errorCount,
      };

      this.logError(errorInfo);
      this.addToErrorHistory(errorInfo);

      // Save form state if configured
      if (this.config.saveStateOnError) {
        this.saveCurrentState();
      }

      // Show fallback UI if configured and error count exceeds threshold
      if (this.config.showFallbackUI && this.errorCount >= 2) {
        this.showFallbackUI(errorInfo);
      } else {
        this.showErrorNotification(errorInfo);
      }

      // Attempt auto-recovery if configured
      if (this.config.autoRecover && this.errorCount < this.config.maxRetries) {
        setTimeout(() => {
          this.attemptRecovery();
        }, this.config.recoverDelay);
      }
    }

    saveCurrentState() {
      try {
        const formElements = this.container.querySelectorAll(
          "input, select, textarea",
        );
        const state = {};

        formElements.forEach((element) => {
          if (element.id) {
            if (element.type === "checkbox" || element.type === "radio") {
              state[element.id] = element.checked;
            } else {
              state[element.id] = element.value;
            }
          }
        });

        this.savedState = state;

        // Also save to localStorage as backup
        localStorage.setItem(
          `formErrorBoundary_${this.containerId}`,
          JSON.stringify(state),
        );

        console.debug(`Saved form state for ${this.containerId}:`, state);
      } catch (e) {
        console.warn("Failed to save form state:", e);
      }
    }

    restoreState() {
      try {
        let state = this.savedState;

        // Try to restore from localStorage if no saved state
        if (!state) {
          const stored = localStorage.getItem(
            `formErrorBoundary_${this.containerId}`,
          );
          if (stored) {
            state = JSON.parse(stored);
          }
        }

        if (state) {
          Object.keys(state).forEach((elementId) => {
            const element = document.getElementById(elementId);
            if (element) {
              if (element.type === "checkbox" || element.type === "radio") {
                element.checked = state[elementId];
              } else {
                element.value = state[elementId];
              }
            }
          });

          console.debug(`Restored form state for ${this.containerId}`);
          this.showSuccessMessage("Form data has been restored.");
        }
      } catch (e) {
        console.warn("Failed to restore form state:", e);
      }
    }

    showFallbackUI(errorInfo) {
      if (this.isInErrorState) return;

      this.isInErrorState = true;

      const fallbackHTML = `
                <div class="error-boundary-fallback" role="alert">
                    <div class="error-boundary-content">
                        <div class="error-boundary-icon">⚠️</div>
                        <h3 class="error-boundary-title">Something went wrong</h3>
                        <p class="error-boundary-message">
                            This section encountered an error, but your data has been saved. 
                            You can try to recover or continue with other parts of the form.
                        </p>
                        <div class="error-boundary-actions">
                            <button type="button" class="btn btn-primary" onclick="FormErrorBoundaries.recover('${this.containerId}')">
                                Try to Recover
                            </button>
                            <button type="button" class="btn btn-outline-secondary" onclick="FormErrorBoundaries.reportError('${this.containerId}')">
                                Report Issue
                            </button>
                            <button type="button" class="btn btn-outline-secondary" onclick="FormErrorBoundaries.continuewithoutSection('${this.containerId}')">
                                Continue Without This Section
                            </button>
                        </div>
                        <details class="error-boundary-details">
                            <summary>Technical Details</summary>
                            <pre class="error-boundary-stack">${errorInfo.error}

Context: ${errorInfo.context}
Time: ${errorInfo.timestamp}
Attempts: ${errorInfo.errorCount}/${this.config.maxRetries}</pre>
                        </details>
                    </div>
                </div>
            `;

      this.container.innerHTML = fallbackHTML;
    }

    showErrorNotification(errorInfo) {
      if (window.FormUtils && window.FormUtils.showToast) {
        window.FormUtils.showToast(
          `An error occurred in this section. Your data has been saved. (${errorInfo.errorCount}/${this.config.maxRetries} attempts)`,
          "error",
          5000,
        );
      } else {
        console.error("Error in form section:", errorInfo);
        alert(
          `An error occurred: ${errorInfo.error}. Your data has been saved.`,
        );
      }
    }

    showSuccessMessage(message) {
      if (window.FormUtils && window.FormUtils.showToast) {
        window.FormUtils.showToast(message, "success", 3000);
      }
    }

    attemptRecovery() {
      try {
        console.debug(
          `Attempting recovery for ${this.containerId} (attempt ${this.errorCount})`,
        );

        // Restore original content
        this.container.innerHTML = this.originalContent;
        this.isInErrorState = false;

        // Re-initialize event handlers
        this.wrapEventHandlers();

        // Restore form state
        setTimeout(() => {
          this.restoreState();
        }, 100);

        this.showSuccessMessage("Section recovered successfully.");
      } catch (e) {
        console.error("Recovery failed:", e);
        this.showFallbackUI();
      }
    }

    logError(errorInfo) {
      if (this.config.enableLogging) {
        console.error("[Error Boundary]", errorInfo);

        // Send to server if logging endpoint exists
        if (typeof fetch !== "undefined") {
          fetch("/api/log-error", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(errorInfo),
          }).catch(() => {
            // Silently fail on logging errors to avoid recursion
          });
        }
      }
    }

    addToErrorHistory(errorInfo) {
      errorHistory.push(errorInfo);
      if (errorHistory.length > MAX_ERROR_HISTORY) {
        errorHistory.shift();
      }
    }

    reset() {
      this.errorCount = 0;
      this.isInErrorState = false;
      this.savedState = null;
      localStorage.removeItem(`formErrorBoundary_${this.containerId}`);

      if (this.originalContent) {
        this.container.innerHTML = this.originalContent;
        this.wrapEventHandlers();
      }
    }
  }

  // Global error boundary manager
  const FormErrorBoundaries = {
    create(containerId, config) {
      return new FormErrorBoundary(containerId, config);
    },

    createForForm(formId) {
      const form = document.getElementById(formId);
      if (!form) return null;

      // Create boundaries for major form sections
      const sections = [
        "step-1",
        "step-2",
        "step-3",
        "step-4",
        "step-5",
        "form-navigation",
        "signature-section",
      ];

      sections.forEach((sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
          this.create(sectionId, {
            autoRecover: true,
            saveStateOnError: true,
          });
        }
      });

      // Create a boundary for the entire form
      return this.create(formId, {
        autoRecover: true,
        saveStateOnError: true,
        maxRetries: 5,
      });
    },

    recover(containerId) {
      const boundary = errorBoundaries.get(containerId);
      if (boundary) {
        boundary.attemptRecovery();
      }
    },

    reportError(containerId) {
      const history = errorHistory.filter((e) => e.containerId === containerId);
      console.log("Error report for", containerId, history);

      if (window.FormUtils && window.FormUtils.showToast) {
        window.FormUtils.showToast(
          "Error report generated. Check console for details.",
          "info",
        );
      }
    },

    continuewithoutSection(containerId) {
      const boundary = errorBoundaries.get(containerId);
      if (boundary) {
        boundary.container.style.display = "none";
        window.FormUtils &&
          window.FormUtils.showToast(
            "Section disabled. You can continue with the form.",
            "info",
          );
      }
    },

    getErrorHistory() {
      return errorHistory;
    },

    resetAll() {
      errorBoundaries.forEach((boundary) => boundary.reset());
      errorBoundaries.clear();
      errorHistory.length = 0;
    },
  };

  // Auto-initialize for forms when DOM is ready
  document.addEventListener("DOMContentLoaded", () => {
    // Auto-create boundaries for common form elements
    const forms = document.querySelectorAll("form[id]");
    forms.forEach((form) => {
      FormErrorBoundaries.createForForm(form.id);
    });
  });

  // Expose globally
  window.FormErrorBoundaries = FormErrorBoundaries;
  window.FormErrorBoundary = FormErrorBoundary;

  console.debug("Form Error Boundaries system loaded");
})();

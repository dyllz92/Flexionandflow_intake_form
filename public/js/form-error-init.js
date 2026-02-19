/**
 * Form Error Boundary Initialization
 * Sets up error boundaries specifically for intake and feedback forms
 */

(function () {
  "use strict";

  // Enhanced form state management with error recovery
  const FormStateManager = {
    STORAGE_KEY: "formErrorRecovery",

    saveFormState(formId) {
      try {
        const form = document.getElementById(formId);
        if (!form) return;

        const state = {
          formId,
          timestamp: new Date().toISOString(),
          url: window.location.pathname,
          data: {},
          currentStep: this.getCurrentStep(),
        };

        // Collect all form data
        const elements = form.querySelectorAll("input, select, textarea");
        elements.forEach((element) => {
          if (element.id || element.name) {
            const key = element.id || element.name;

            if (element.type === "checkbox" || element.type === "radio") {
              state.data[key] = element.checked;
            } else if (element.type === "file") {
              // Don't save file data, just note that file was selected
              state.data[key] =
                element.files.length > 0 ? "[FILE_SELECTED]" : "";
            } else {
              state.data[key] = element.value;
            }
          }
        });

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
        console.debug("Form state saved for error recovery");
      } catch (e) {
        console.warn("Failed to save form state:", e);
      }
    },

    restoreFormState(formId) {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (!stored) return false;

        const state = JSON.parse(stored);
        if (state.formId !== formId) return false;

        // Check if state is recent (within 24 hours)
        const stateAge = new Date() - new Date(state.timestamp);
        if (stateAge > 24 * 60 * 60 * 1000) {
          localStorage.removeItem(this.STORAGE_KEY);
          return false;
        }

        // Restore form data
        Object.keys(state.data).forEach((key) => {
          const element =
            document.getElementById(key) ||
            document.querySelector(`[name="${key}"]`);
          if (element && state.data[key] !== "[FILE_SELECTED]") {
            if (element.type === "checkbox" || element.type === "radio") {
              element.checked = state.data[key];
            } else {
              element.value = state.data[key];
            }

            // Trigger change events to update UI
            element.dispatchEvent(new Event("change", { bubbles: true }));
          }
        });

        // Restore current step if wizard exists
        if (state.currentStep && window.wizard) {
          setTimeout(() => {
            window.wizard.goToStep(state.currentStep);
          }, 100);
        }

        return true;
      } catch (e) {
        console.warn("Failed to restore form state:", e);
        return false;
      }
    },

    clearSavedState() {
      localStorage.removeItem(this.STORAGE_KEY);
    },

    getCurrentStep() {
      // Check for wizard current step
      if (window.currentStep) return window.currentStep;

      // Check for visible step elements
      const steps = document.querySelectorAll('[id^="step-"]');
      for (let i = 0; i < steps.length; i++) {
        if (steps[i].style.display !== "none") {
          return i + 1;
        }
      }

      return 1;
    },
  };

  // Enhanced form recovery dialog
  function showFormRecoveryDialog(onRestore, onIgnore) {
    const dialog = document.createElement("div");
    dialog.className = "form-recovery-dialog";
    dialog.innerHTML = `
            <div class="form-recovery-overlay">
                <div class="form-recovery-content" role="dialog" aria-labelledby="recovery-title" aria-describedby="recovery-desc">
                    <div class="form-recovery-icon">💾</div>
                    <h3 id="recovery-title">Form Data Recovery</h3>
                    <p id="recovery-desc">
                        We found previously saved form data from your last session. 
                        Would you like to restore it to continue where you left off?
                    </p>
                    <div class="form-recovery-actions">
                        <button type="button" class="btn btn-primary" id="restore-btn">
                            🔄 Restore My Data
                        </button>
                        <button type="button" class="btn btn-outline-secondary" id="ignore-btn">
                            ✖️ Start Fresh
                        </button>
                    </div>
                    <div class="form-recovery-note">
                        <small>Your previous data is automatically saved to prevent data loss.</small>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(dialog);

    // Add styles if not already present
    if (!document.getElementById("form-recovery-styles")) {
      const styles = document.createElement("style");
      styles.id = "form-recovery-styles";
      styles.textContent = `
                .form-recovery-dialog {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 10000;
                    animation: fadeIn 0.3s ease;
                }
                
                .form-recovery-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                
                .form-recovery-content {
                    background: white;
                    border-radius: 12px;
                    padding: 32px;
                    max-width: 480px;
                    width: 100%;
                    text-align: center;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                    animation: slideUp 0.3s ease;
                }
                
                .form-recovery-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }
                
                .form-recovery-content h3 {
                    color: #2d3748;
                    margin: 0 0 16px 0;
                    font-size: 24px;
                }
                
                .form-recovery-content p {
                    color: #4a5568;
                    margin: 0 0 24px 0;
                    line-height: 1.5;
                }
                
                .form-recovery-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                    margin-bottom: 16px;
                }
                
                .form-recovery-note {
                    color: #718096;
                    font-style: italic;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                
                @media (max-width: 640px) {
                    .form-recovery-content {
                        margin: 20px;
                        padding: 24px;
                    }
                    
                    .form-recovery-actions {
                        flex-direction: column;
                    }
                }
            `;
      document.head.appendChild(styles);
    }

    // Event handlers
    dialog.querySelector("#restore-btn").addEventListener("click", () => {
      document.body.removeChild(dialog);
      onRestore();
    });

    dialog.querySelector("#ignore-btn").addEventListener("click", () => {
      document.body.removeChild(dialog);
      onIgnore();
    });

    // Close on overlay click
    dialog
      .querySelector(".form-recovery-overlay")
      .addEventListener("click", (e) => {
        if (e.target === e.currentTarget) {
          document.body.removeChild(dialog);
          onIgnore();
        }
      });

    // Close on ESC key
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        document.body.removeChild(dialog);
        document.removeEventListener("keydown", handleEsc);
        onIgnore();
      }
    };
    document.addEventListener("keydown", handleEsc);
  }

  // Initialize form error boundaries and recovery
  function initializeFormErrorBoundaries() {
    console.debug("Initializing form error boundaries...");

    const formId = document.querySelector("form[id]")?.id;
    if (!formId) {
      console.warn("No form with ID found for error boundary setup");
      return;
    }

    // Set up comprehensive error boundaries
    if (window.FormErrorBoundaries) {
      window.FormErrorBoundaries.createForForm(formId);
    }

    // Auto-save form state periodically
    let saveInterval;
    function startAutoSave() {
      if (saveInterval) clearInterval(saveInterval);

      saveInterval = setInterval(() => {
        FormStateManager.saveFormState(formId);
      }, 30000); // Save every 30 seconds
    }

    // Save on key form events
    function setupFormStateAutoSave() {
      const form = document.getElementById(formId);
      if (!form) return;

      // Save on input changes (debounced)
      let saveTimeout;
      form.addEventListener("change", () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          FormStateManager.saveFormState(formId);
        }, 1000);
      });

      // Save before page unload
      window.addEventListener("beforeunload", () => {
        FormStateManager.saveFormState(formId);
      });

      // Save on step changes (if wizard exists)
      if (window.currentStep !== undefined) {
        const originalGoToStep = window.goToStep;
        if (originalGoToStep) {
          window.goToStep = function (...args) {
            FormStateManager.saveFormState(formId);
            return originalGoToStep.apply(this, args);
          };
        }
      }
    }

    // Check for existing saved state and offer recovery
    function checkAndOfferRecovery() {
      const stored = localStorage.getItem(FormStateManager.STORAGE_KEY);
      if (stored) {
        try {
          const state = JSON.parse(stored);
          const stateAge = new Date() - new Date(state.timestamp);

          // Only offer recovery if state is recent and from same form
          if (stateAge < 24 * 60 * 60 * 1000 && state.formId === formId) {
            showFormRecoveryDialog(
              () => {
                const restored = FormStateManager.restoreFormState(formId);
                if (restored && window.FormUtils) {
                  window.FormUtils.showToast(
                    "Form data restored successfully",
                    "success",
                  );
                }
                startAutoSave();
                setupFormStateAutoSave();
              },
              () => {
                FormStateManager.clearSavedState();
                startAutoSave();
                setupFormStateAutoSave();
              },
            );
            return;
          }
        } catch (e) {
          console.warn("Failed to parse saved form state:", e);
        }
      }

      // No recovery needed, start normal operations
      startAutoSave();
      setupFormStateAutoSave();
    }

    // Initialize after a short delay to ensure all form elements are ready
    setTimeout(() => {
      checkAndOfferRecovery();
    }, 500);

    // Clear saved state on successful form submission
    window.addEventListener("beforeunload", (e) => {
      // Only clear if navigating to success page
      if (
        e.target.activeElement &&
        e.target.activeElement.href &&
        e.target.activeElement.href.includes("/success")
      ) {
        FormStateManager.clearSavedState();
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeFormErrorBoundaries,
    );
  } else {
    initializeFormErrorBoundaries();
  }

  // Expose for manual usage
  window.FormStateManager = FormStateManager;

  console.debug("Form error boundary initialization script loaded");
})();

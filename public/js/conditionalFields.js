/**
 * Conditional Field Visibility Handler
 * Shows/hides form fields based on answer selections
 */

class ConditionalFields {
  constructor() {
    this.fieldRules = {
      // Referral person - show when referral-style source selected
      referralPerson: {
        trigger: 'input[name="referralSource"]',
        show: "referralPersonSection",
        condition: (val) =>
          val === "Word of mouth" || val === "I was referred by someone",
      },
      // Exercise details - show when exercise frequency is not "Never / Rarely"
      exerciseDetails: {
        trigger: 'input[name="exerciseFrequency"]',
        show: "exerciseDetailsSection",
        condition: (val) => !!val && val !== "Never / Rarely",
      },
      // Pregnancy weeks - show when pregnant/breastfeeding = "Yes"
      pregnancyWeeks: {
        trigger: 'input[name="pregnantBreastfeeding"]',
        show: "pregnancyWeeksSection",
        condition: (val) => val === "Yes",
      },
      // Medications
      medications: {
        trigger: 'input[name="takingMedications"]',
        show: "medicationsSection",
        condition: (val) => val === "Yes",
      },
      // Allergies
      allergies: {
        trigger: 'input[name="hasAllergies"]',
        show: "allergiesSection",
        condition: (val) => val === "Yes",
      },
    };

    this.init();
  }

  init() {
    // Initialize all conditional fields
    for (const rule of Object.values(this.fieldRules)) {
      this.setupRule(rule);
    }
  }

  setupRule(rule) {
    const triggers = document.querySelectorAll(rule.trigger);
    if (!triggers || triggers.length === 0) return; // nothing on this page for this rule

    triggers.forEach((trigger) => {
      trigger.addEventListener("change", () => {
        this.updateVisibility(rule);
      });
    });

    // Initial state
    this.updateVisibility(rule);
  }

  updateVisibility(rule) {
    const triggers = document.querySelectorAll(rule.trigger);
    const targetContainer = document.getElementById(rule.show);

    if (!targetContainer) return;

    let shouldShow = false;

    if (triggers[0].type === "checkbox") {
      // For checkbox groups, collect all checked values
      const checked = Array.from(triggers).filter((t) => t.checked);
      shouldShow = rule.condition(checked);
    } else if (triggers[0].type === "radio") {
      // For radio groups, get selected value
      const selected = Array.from(triggers).find((t) => t.checked);
      shouldShow = rule.condition(selected ? selected.value : null);
    } else {
      // For other inputs
      shouldShow = rule.condition(triggers[0].checked);
    }

    if (shouldShow) {
      targetContainer.classList.remove("hidden-field");
      targetContainer.style.display = "block";
      // Trigger animation
      setTimeout(() => {
        targetContainer.classList.add("fade-in");
      }, 10);
    } else {
      targetContainer.classList.add("hidden-field");
      targetContainer.style.display = "none";
      targetContainer.classList.remove("fade-in");
    }
  }
}

/**
 * Health Category Expandable Handler
 * Allows collapsing/expanding health check categories
 */
class HealthCategoryToggle {
  constructor() {
    this.init();
  }

  init() {
    const categoryToggles = document.querySelectorAll(".category-toggle");
    categoryToggles.forEach((toggle) => {
      toggle.addEventListener("click", (e) => {
        e.preventDefault();
        const category = toggle.closest(".health-category");
        if (category) {
          category.classList.toggle("expanded");
          // Update arrow indicator
          const arrow = toggle.textContent.includes("▼") ? "▶" : "▼";
          toggle.textContent = toggle.textContent.replace(/[▼▶]/, arrow);
        }
      });
    });

    // Handle "I feel well" button and radio button
    const feelWellRadio = document.getElementById("feelWellRadio");
    const feelWellButton = feelWellRadio
      ?.closest("label")
      ?.querySelector("button");

    if (feelWellButton && feelWellRadio) {
      feelWellButton.addEventListener("click", (e) => {
        e.preventDefault();
        // Check the radio button
        feelWellRadio.checked = true;
        // Trigger change event
        feelWellRadio.dispatchEvent(new Event("change", { bubbles: true }));
      });

      feelWellRadio.addEventListener("change", (e) => {
        if (e.target.value === "well") {
          // Collapse all health categories
          document
            .querySelectorAll(".health-category.expandable.expanded")
            .forEach((category) => {
              category.classList.remove("expanded");
              // Update arrow indicators
              const toggle = category.querySelector(".category-toggle");
              if (toggle && toggle.textContent.includes("▼")) {
                toggle.textContent = toggle.textContent.replace("▼", "▶");
              }
            });
        }
      });
    }

    // Expand all categories by default
    document
      .querySelectorAll(".health-category.expandable")
      .forEach((category) => {
        category.classList.add("expanded");
      });
  }
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", () => {
  const detailed = document.getElementById("detailedForm");
  const intake = document.getElementById("intakeForm");
  if (detailed || intake) {
    new ConditionalFields();
    new HealthCategoryToggle();
  }
});

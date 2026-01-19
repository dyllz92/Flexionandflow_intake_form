/**
 * Conditional Field Visibility Handler
 * Shows/hides form fields based on answer selections
 */

class ConditionalFields {
    constructor() {
        this.fieldRules = {
            // Health condition details
            'generalHealth': {
                trigger: 'input[name="generalHealth"]',
                show: 'healthDetailsContainer',
                condition: (checked) => checked.length > 0
            },
            // Medications
            'medications': {
                trigger: 'input[name="medications"]',
                show: 'medicationsDetailsContainer',
                condition: (val) => val === 'Yes'
            },
            // Allergies
            'allergies': {
                trigger: 'input[name="allergies"]',
                show: 'allergiesDetailsContainer',
                condition: (val) => val === 'Yes'
            },
            // Sensitivity details
            'sensitivity': {
                trigger: 'input[name="sensitivity"]',
                show: 'sensitivityDetailsContainer',
                condition: (val) => val === 'Yes'
            },
            // Emergency contact
            'showEmergency': {
                trigger: 'input[name="showEmergency"]',
                show: 'emergencyContactContainer',
                condition: (checked) => checked
            },
            // Recent 48h conditions
            'recent48h': {
                trigger: 'input[name="recent48h"]',
                show: 'recentConditionsDetails',
                condition: (checked) => checked.length > 0
            },
            // Symptom section
            'symptomToggle': {
                trigger: 'input[name="symptomToggle"]',
                show: 'symptomsSection',
                condition: (checked) => checked
            }
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
        
        triggers.forEach(trigger => {
            trigger.addEventListener('change', () => {
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
        
        if (triggers[0].type === 'checkbox') {
            // For checkbox groups, collect all checked values
            const checked = Array.from(triggers).filter(t => t.checked);
            shouldShow = rule.condition(checked);
        } else if (triggers[0].type === 'radio') {
            // For radio groups, get selected value
            const selected = Array.from(triggers).find(t => t.checked);
            shouldShow = rule.condition(selected ? selected.value : null);
        } else {
            // For other inputs
            shouldShow = rule.condition(triggers[0].checked);
        }
        
        if (shouldShow) {
            targetContainer.classList.remove('hidden-field');
            targetContainer.style.display = 'block';
            // Trigger animation
            setTimeout(() => {
                targetContainer.classList.add('fade-in');
            }, 10);
        } else {
            targetContainer.classList.add('hidden-field');
            targetContainer.style.display = 'none';
            targetContainer.classList.remove('fade-in');
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('detailedForm');
    if (form) {
        new ConditionalFields();
    }
});

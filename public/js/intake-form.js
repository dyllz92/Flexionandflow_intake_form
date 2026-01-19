// Intake Form Validation and Submission
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('intakeForm');
    
    // Show health details if any health issue is checked
    const healthIssueCheckboxes = document.querySelectorAll('input[name="healthIssue"]');
    const healthDetailsContainer = document.getElementById('healthDetailsContainer');
    
    healthIssueCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const anyChecked = Array.from(healthIssueCheckboxes).some(cb => cb.checked);
            if (anyChecked) {
                healthDetailsContainer.classList.remove('hidden-field');
                healthDetailsContainer.style.display = 'block';
            } else {
                healthDetailsContainer.classList.add('hidden-field');
                healthDetailsContainer.style.display = 'none';
            }
        });
    });
    
    // Set today's date as default
    const dateInput = document.getElementById('signatureDate');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }
    
    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate signature
        if (window.signaturePad.isEmpty()) {
            alert('Please provide your signature before submitting.');
            return;
        }
        
        // Get signature data
        const signatureData = window.signaturePad.toDataURL();
        document.getElementById('signatureData').value = signatureData;
        
        // Collect form data
        const formData = new FormData(form);
        const data = {};
        
        // Convert FormData to object, handling multiple values
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
        
        // Add metadata
        data.submissionDate = new Date().toISOString();
        data.formType = 'standard';
        
        // Show loading
        showLoading(true);
        
        try {
            const response = await fetch('/api/submit-form', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // Success
                window.location.href = '/success';
            } else {
                alert('Error submitting form: ' + result.message);
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('An error occurred while submitting the form. Please try again.');
        } finally {
            showLoading(false);
        }
    });
});

function showLoading(show) {
    let overlay = document.querySelector('.loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Submitting your form...</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    if (show) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

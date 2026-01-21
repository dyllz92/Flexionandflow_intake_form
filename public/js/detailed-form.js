// Detailed Form Validation and Submission
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('detailedForm');
    
    // Limit checkbox selections for help areas
    const helpCheckboxes = document.querySelectorAll('input[name="helpArea"]');
    helpCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const checked = document.querySelectorAll('input[name="helpArea"]:checked');
            if (checked.length > 3) {
                checkbox.checked = false;
                alert('Please select up to 3 areas only.');
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

        // Validate gender selection
        const genderInputs = document.querySelectorAll('input[name="gender"]');
        const genderSelected = Array.from(genderInputs).some(g => g.checked);
        if (!genderSelected) {
            alert('Please select your gender.');
            return;
        }

        // Validate signature
        if (window.signaturePad.isEmpty()) {
            alert('Please provide your signature before submitting.');
            return;
        }

        // Validate required consents
        const consentAccurate = document.getElementById('consentAccurate');
        const consentTreatment = document.getElementById('consentTreatment');
        const consentStop = document.getElementById('consentStop');

        if (!consentAccurate.checked || !consentTreatment.checked || !consentStop.checked) {
            alert('Please check all required consent boxes.');
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
        data.formType = 'detailed';
        
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

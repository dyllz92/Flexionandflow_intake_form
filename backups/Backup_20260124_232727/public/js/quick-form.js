// Quick Form Validation and Submission
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('quickForm');
    
    // Limit checkbox selections
    const treatmentCheckboxes = document.querySelectorAll('input[name="treatmentArea"]');
    treatmentCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const checked = document.querySelectorAll('input[name="treatmentArea"]:checked');
            if (checked.length > 2) {
                checkbox.checked = false;
                alert('Please select up to 2 areas only.');
            }
        });
    });
    
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

        // Validate consent (terms) - mandatory
        const consentEl = document.getElementById('consent');
        if (!consentEl || !consentEl.checked) {
            alert('Please confirm you consent to seated chair massage today.');
            return;
        }

        // Validate signature
        if (window.signaturePad.isEmpty()) {
            alert('Please provide your signature before submitting.');
            return;
        }

        // Get signature data depending on chosen method
        const typeRadio = document.getElementById('signatureMethodType');
        if (typeRadio && typeRadio.checked) {
            const txt = window.typedSignatureText || (document.getElementById('typedSignatureInput') && document.getElementById('typedSignatureInput').value) || '';
            document.getElementById('signatureData').value = txt ? `text:${txt}` : '';
        } else {
            const signatureData = window.signaturePad.toDataURL();
            document.getElementById('signatureData').value = signatureData;
        }
        
        // Collect form data
        const formData = new FormData(form);
        const data = {};
        
        // Convert FormData to object
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
        
        // Add current date
        data.submissionDate = new Date().toISOString();
        data.formType = 'quick';
        
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

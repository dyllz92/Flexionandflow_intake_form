// Intake Form Validation and Submission
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('intakeForm');
    const submitBtn = document.getElementById('submitBtn');

    if (!form) return;

    // Progressive disclosure for Other fields (checkboxes)
    const otherPairs = [
        { checkboxName: 'reasonsToday', inputId: 'reasonsOtherText' },
        { checkboxName: 'healthChecks', inputId: 'otherHealthConcernText' }
    ];
    otherPairs.forEach(({ checkboxName, inputId }) => {
        const inputs = document.querySelectorAll(`input[name="${checkboxName}"]`);
        const otherInput = document.getElementById(inputId);
        if (!otherInput) return;
        const update = () => {
            const otherChecked = Array.from(inputs).some(i => i.checked && (i.value === 'Other' || i.value === 'Other health concern'));
            otherInput.parentElement.style.display = otherChecked ? 'inline-block' : 'none';
            if (!otherChecked) otherInput.value = '';
        };
        inputs.forEach(i => i.addEventListener('change', update));
        update();
    });

    // Health red-flag banner
    const healthChecks = document.querySelectorAll('input[name="healthChecks"]');
    const healthBanner = document.getElementById('healthBanner');
    const updateHealthBanner = () => {
        const anyChecked = Array.from(healthChecks).some(cb => cb.checked);
        if (anyChecked) {
            healthBanner.classList.remove('hidden-field');
            healthBanner.style.display = 'block';
        } else {
            healthBanner.classList.add('hidden-field');
            healthBanner.style.display = 'none';
            const reviewed = document.getElementById('reviewedByTherapist');
            const note = document.getElementById('reviewNote');
            if (reviewed) reviewed.checked = false;
            if (note) note.value = '';
        }
    };
    healthChecks.forEach(cb => cb.addEventListener('change', updateHealthBanner));
    updateHealthBanner();

    // Enable submit when required fields are valid
    const requiredControls = [
        document.getElementById('fullName'),
        document.getElementById('mobile'),
        document.getElementById('consentGiven')
    ];
    const genderInputs = document.querySelectorAll('input[name="gender"]');
    const signatureRequired = () => !window.signaturePad || window.signaturePad.isEmpty();
    const updateSubmitEnabled = () => {
        const genderSelected = Array.from(genderInputs).some(g => g.checked);
        const allValid = requiredControls.every(ctrl => ctrl && (ctrl.type === 'checkbox' ? ctrl.checked : ctrl.value.trim().length > 0))
            && genderSelected
            && !signatureRequired();
        submitBtn.disabled = !allValid;
    };
    requiredControls.forEach(ctrl => ctrl && ctrl.addEventListener('input', updateSubmitEnabled));
    if (document.getElementById('consentGiven')) {
        document.getElementById('consentGiven').addEventListener('change', updateSubmitEnabled);
    }
    genderInputs.forEach(g => g.addEventListener('change', updateSubmitEnabled));
    updateSubmitEnabled();

    // Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitForm('submitted');
    });

    async function submitForm(status) {
        // Validate signature
        if (window.signaturePad && window.signaturePad.isEmpty()) {
            alert('Please provide your signature before submitting.');
            return;
        }

        // Get signature data
        if (!window.signaturePad.isEmpty()) {
            const signatureData = window.signaturePad.toDataURL();
            document.getElementById('signatureData').value = signatureData;
            document.getElementById('signedAt').value = new Date().toISOString();
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

        // Normalize "Other" pairs: append text if provided
        const normalizeMulti = (key, otherKey) => {
            const v = data[key];
            const arr = Array.isArray(v) ? v : v ? [v] : [];
            if (data[otherKey] && data[otherKey].trim()) {
                arr.push(`Other: ${data[otherKey].trim()}`);
            }
            data[key] = arr.length ? arr : undefined;
        };
        normalizeMulti('reasonsToday', 'reasonsOtherText');
        normalizeMulti('focusAreas', 'focusOtherText');
        normalizeMulti('avoidAreas', 'avoidOtherText');

        // Health checks other
        if (data['otherHealthConcernText'] && data['otherHealthConcernText'].trim()) {
            const v = data['healthChecks'];
            const arr = Array.isArray(v) ? v : v ? [v] : [];
            arr.push(`Other: ${data['otherHealthConcernText'].trim()}`);
            data['healthChecks'] = arr;
        }

        // Metadata
        const nowIso = new Date().toISOString();
        data.submissionDate = nowIso;
        data.createdAt = nowIso;
        data.updatedAt = nowIso;
        data.status = status;
        data.formType = 'universal';

        // Show loading
        showLoading(true);

        try {
            const response = await fetch('/api/submit-form', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (response.ok) {
                window.location.href = '/success';
            } else {
                alert('Error submitting form: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('An error occurred while submitting the form. Please try again.');
        } finally {
            showLoading(false);
        }
    }
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

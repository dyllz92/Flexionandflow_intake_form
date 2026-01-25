// Intake Form Validation and Submission
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('intakeForm');
    const submitBtn = document.getElementById('submitBtn');

    if (!form) return;

    // Progressive disclosure for Other fields (checkboxes)
    // Health red-flag banner and 'no issues' mutual exclusivity
    const healthChecks = Array.from(document.querySelectorAll('input[name="healthChecks"]'));
    const healthBanner = document.getElementById('healthBanner');
    const noHealthIssues = document.getElementById('noHealthIssues');

    const updateHealthBanner = () => {
        const anyChecked = healthChecks.some(cb => cb.checked);
        if (anyChecked) {
            healthBanner.classList.remove('hidden-field');
            healthBanner.style.display = 'block';
        } else {
            healthBanner.classList.add('hidden-field');
            healthBanner.style.display = 'none';
            const note = document.getElementById('reviewNote');
            if (note) note.value = '';
        }
    };

    // When 'I feel well today' is checked, clear other health checks. If any health check selected, clear 'no issues'
    healthChecks.forEach(cb => cb.addEventListener('change', () => {
        if (cb.checked && noHealthIssues && noHealthIssues.checked) {
            noHealthIssues.checked = false;
        }
        updateHealthBanner();
    }));

    if (noHealthIssues) {
        noHealthIssues.addEventListener('change', () => {
            if (noHealthIssues.checked) {
                healthChecks.forEach(cb => cb.checked = false);
                updateHealthBanner();
            }
        });
    }

    updateHealthBanner();

    // Auto-expand avoidNotes textarea
    const avoidNotes = document.getElementById('avoidNotes');
    if (avoidNotes) {
        const resize = () => {
            avoidNotes.style.height = 'auto';
            avoidNotes.style.height = (avoidNotes.scrollHeight) + 'px';
        };
        avoidNotes.addEventListener('input', resize);
        // initialize
        setTimeout(resize, 0);
    }

    // Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitForm('submitted');
    });

    async function submitForm(status) {
        // Validate combined consent and signature
        const consentAllEl = document.getElementById('consentAll');

        if (!consentAllEl) {
            alert('Consent field is not available. Please reload the page.');
            return;
        }

        if (!consentAllEl.checked) {
            alert('Please confirm you have read and agreed to the Terms and consent to treatment.');
            return;
        }

        // Validate signature
        if (window.signaturePad && window.signaturePad.isEmpty()) {
            alert('Please provide your signature before submitting.');
            return;
        }

        // Get signature data depending on chosen method
        const typeRadio = document.getElementById('signatureMethodType');
        if (typeRadio && typeRadio.checked) {
            const txt = window.typedSignatureText || (document.getElementById('typedSignatureInput') && document.getElementById('typedSignatureInput').value) || '';
            document.getElementById('signatureData').value = txt ? `text:${txt}` : '';
            document.getElementById('signedAt').value = new Date().toISOString();
        } else {
            if (!window.signaturePad.isEmpty()) {
                const signatureData = window.signaturePad.toDataURL();
                document.getElementById('signatureData').value = signatureData;
                document.getElementById('signedAt').value = new Date().toISOString();
            }
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

        // Normalize health checks to array and include otherHealthConcernText if present
        if (data['healthChecks']) {
            data['healthChecks'] = Array.isArray(data['healthChecks']) ? data['healthChecks'] : [data['healthChecks']];
        }
        if (data['otherHealthConcernText'] && data['otherHealthConcernText'].trim()) {
            data['healthChecks'] = data['healthChecks'] ? data['healthChecks'].concat([`Other: ${data['otherHealthConcernText'].trim()}`]) : [`Other: ${data['otherHealthConcernText'].trim()}`];
        }

        // Ensure 'noHealthIssues' represented
        if (document.getElementById('noHealthIssues') && document.getElementById('noHealthIssues').checked) {
            data['healthChecks'] = ['No issues to report'];
        }

        // Ensure combined consent and opt-in booleans are included
        data.consentAll = !!document.getElementById('consentAll') && document.getElementById('consentAll').checked;
        data.smsOptIn = !!document.getElementById('smsOptIn') && document.getElementById('smsOptIn').checked;

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

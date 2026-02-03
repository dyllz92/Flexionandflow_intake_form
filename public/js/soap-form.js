// SOAP Note Generator

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('soapForm');
    const output = document.getElementById('soapOutput');
    const generateBtn = document.getElementById('generateSoapBtn');
    const copyBtn = document.getElementById('copySoapBtn');
    const clearBtn = document.getElementById('clearSoapBtn');
    const sessionType = document.getElementById('sessionType');
    const sessionTypeOther = document.getElementById('sessionTypeOther');
    const sessionTypeOtherText = document.getElementById('sessionTypeOtherText');

    if (!form) return;

    const DRAFT_STORAGE_KEY = 'flexionSoapDraft';

    const showLoading = window.FormUtils ? window.FormUtils.showLoading : fallbackShowLoading;
    const updateLoadingMessage = window.FormUtils ? window.FormUtils.updateLoadingMessage : () => {};
    const safeParseJSON = window.FormUtils ? window.FormUtils.safeParseJSON : fallbackSafeParseJSON;
    const showToast = window.FormUtils ? window.FormUtils.showToast : (msg) => alert(msg);

    const sliderMappings = [
        { id: 'painScale', valueId: 'painScaleValue' }
    ];

    const updateSliderValue = (id, valueId) => {
        const slider = document.getElementById(id);
        const valueDisplay = document.getElementById(valueId);
        if (!slider || !valueDisplay) return;
        valueDisplay.textContent = slider.value;
        slider.addEventListener('input', () => {
            valueDisplay.textContent = slider.value;
        });
    };

    sliderMappings.forEach(({ id, valueId }) => updateSliderValue(id, valueId));

    const toggleSessionTypeOther = () => {
        if (!sessionType || !sessionTypeOther) return;
        if (sessionType.value === 'Other') {
            sessionTypeOther.classList.remove('hidden-field');
            sessionTypeOther.style.display = 'block';
        } else {
            sessionTypeOther.classList.add('hidden-field');
            sessionTypeOther.style.display = 'none';
            if (sessionTypeOtherText) sessionTypeOtherText.value = '';
        }
    };

    if (sessionType) {
        sessionType.addEventListener('change', toggleSessionTypeOther);
        toggleSessionTypeOther();
    }

    const collectFormData = () => {
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
        return data;
    };

    const hasMeaningfulInput = (data) => {
        if (!data) return false;
        const textFields = [
            'freeText',
            'subjectiveNotes',
            'objectiveNotes',
            'assessmentNotes',
            'planNotes',
            'clientName'
        ];
        if (textFields.some((field) => typeof data[field] === 'string' && data[field].trim().length > 0)) {
            return true;
        }

        const arrayFields = [
            'subjectiveSymptoms',
            'aggravatingFactors',
            'relievingFactors',
            'objectiveFindings',
            'assessmentImpression',
            'treatmentProvided',
            'homeCare'
        ];

        if (arrayFields.some((field) => Array.isArray(data[field]) ? data[field].length > 0 : !!data[field])) {
            return true;
        }

        const numericValue = Number(data.painScale || 0);
        if (!Number.isNaN(numericValue) && numericValue > 0) return true;

        return false;
    };

    const loadDraft = () => {
        try {
            const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
            if (!stored) return;
            const data = JSON.parse(stored);
            const fields = Array.from(form.querySelectorAll('input, textarea, select'));

            fields.forEach((field) => {
                if (!field.name) return;

                const savedValue = data[field.name];
                if (savedValue === undefined || savedValue === null) return;

                if (field.type === 'checkbox') {
                    if (Array.isArray(savedValue)) {
                        field.checked = savedValue.includes(field.value || 'on');
                    } else {
                        field.checked = Boolean(savedValue);
                    }
                } else if (field.type === 'radio') {
                    field.checked = savedValue === field.value;
                } else {
                    field.value = savedValue;
                }
            });

            if (output && data.soapOutput) output.value = data.soapOutput;

            sliderMappings.forEach(({ id, valueId }) => {
                const slider = document.getElementById(id);
                if (slider) slider.dispatchEvent(new Event('input', { bubbles: true }));
                const valueDisplay = document.getElementById(valueId);
                if (slider && valueDisplay) valueDisplay.textContent = slider.value;
            });

            toggleSessionTypeOther();
        } catch (error) {
            console.warn('Could not load SOAP draft:', error);
        }
    };

    const saveDraft = () => {
        try {
            const data = {};
            const fields = Array.from(form.querySelectorAll('input, textarea, select'));

            fields.forEach((field) => {
                if (!field.name) return;

                if (field.type === 'checkbox') {
                    if (!Array.isArray(data[field.name])) data[field.name] = [];
                    if (field.checked) data[field.name].push(field.value || 'on');
                } else if (field.type === 'radio') {
                    if (field.checked) data[field.name] = field.value;
                } else {
                    data[field.name] = field.value;
                }
            });

            if (output && output.value) data.soapOutput = output.value;

            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.warn('Could not save SOAP draft:', error);
        }
    };

    const scheduleDraftSave = () => {
        clearTimeout(scheduleDraftSave._timer);
        scheduleDraftSave._timer = setTimeout(saveDraft, 250);
    };

    form.addEventListener('input', scheduleDraftSave);
    form.addEventListener('change', scheduleDraftSave);
    if (output) output.addEventListener('input', scheduleDraftSave);

    loadDraft();

    const handleGenerate = async () => {
        const data = collectFormData();

        if (!hasMeaningfulInput(data)) {
            showToast('Add a paragraph or select some prompts so the AI has details to work with.', 'info');
            return;
        }

        showLoading('Drafting SOAP note...');

        try {
            updateLoadingMessage('Sending details to AI...');

            const response = await fetch('/api/generate-soap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            updateLoadingMessage('Processing response...');
            const result = await safeParseJSON(response);

            if (response.ok && result.success) {
                if (output) output.value = result.soapNote || '';
                showLoading(false);
                showToast('SOAP note generated.', 'success');
                saveDraft();
            } else {
                showLoading(false);
                showToast(result.message || 'Unable to generate SOAP note. Please try again.', 'error');
            }
        } catch (error) {
            console.error('SOAP generation error:', error);
            showLoading(false);
            showToast('A network error occurred. Please check your connection and try again.', 'error');
        }
    };

    const handleCopy = async () => {
        if (!output || !output.value.trim()) {
            showToast('Nothing to copy yet. Generate a note first.', 'info');
            return;
        }

        try {
            await navigator.clipboard.writeText(output.value);
            showToast('SOAP note copied to clipboard.', 'success');
        } catch (error) {
            console.warn('Clipboard copy failed:', error);
            showToast('Copy failed. Please select and copy manually.', 'error');
        }
    };

    const handleClear = () => {
        form.reset();
        if (output) output.value = '';
        sliderMappings.forEach(({ id, valueId }) => {
            const slider = document.getElementById(id);
            const valueDisplay = document.getElementById(valueId);
            if (slider && valueDisplay) valueDisplay.textContent = slider.value;
        });
        toggleSessionTypeOther();
        try {
            localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch (error) {
            console.warn('Could not clear SOAP draft:', error);
        }
        showToast('Form cleared.', 'info');
    };

    if (generateBtn) generateBtn.addEventListener('click', handleGenerate);
    if (copyBtn) copyBtn.addEventListener('click', handleCopy);
    if (clearBtn) clearBtn.addEventListener('click', handleClear);
});

function fallbackShowLoading(show) {
    let overlay = document.querySelector('.loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.setAttribute('role', 'status');
        overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p class="loading-message">Processing...</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    if (show) {
        const messageEl = overlay.querySelector('.loading-message');
        if (messageEl) messageEl.textContent = typeof show === 'string' ? show : 'Processing...';
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

async function fallbackSafeParseJSON(response) {
    try {
        const text = await response.text();
        if (!text) return { success: false, message: 'Empty response from server' };
        return JSON.parse(text);
    } catch (error) {
        return { success: false, message: 'Invalid response from server' };
    }
}

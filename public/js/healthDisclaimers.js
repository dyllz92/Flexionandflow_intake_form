/**
 * Health Condition Disclaimers
 * Shows specific information when health conditions are selected
 * Color-coded by severity: Red (stop), Orange (high caution), Yellow (caution), Green (info only)
 */

const HEALTH_DISCLAIMERS = {
    // RED - Stop / reschedule today
    'Fever / contagious illness today': {
        level: 'red',
        banner: 'Not suitable today - please speak with the therapist',
        message: `If you're unwell, it's best to skip massage today and reschedule. Please tell your therapist how you're feeling.`
    },

    'Skin infection/rash/open wound in areas to be treated': {
        level: 'red',
        banner: 'Not suitable today - please speak with the therapist',
        message: `Massage can irritate this or spread infection. We may need to avoid the area or reschedule. Please show your therapist where it is.`
    },

    'Dizziness/fainting episodes': {
        level: 'red',
        banner: 'Not suitable today - please speak with the therapist',
        message: `If you feel dizzy today or have fainting episodes, it may not be safe to proceed in a chair. Please tell your therapist so we can decide what's best.`
    },

    'Numbness/tingling (unexplained)': {
        level: 'red',
        banner: 'Not suitable today - please speak with the therapist',
        message: `Massage may help if it's from tension, but new or unexplained tingling can need medical review. Please tell your therapist where it is and how long it's been happening.`
    },

    // ORANGE - High caution
    'History of blood clots / DVT': {
        level: 'orange',
        banner: 'Please tell your therapist before we start - we may need to adjust or postpone',
        message: `This is important for safety. If you have any current symptoms (swelling, warmth, redness, pain in a limb, or sudden shortness of breath), please do not continue today - tell your therapist immediately. If it's only in the past, please still mention it so we can be cautious.`
    },

    'High blood pressure (uncontrolled)': {
        level: 'orange',
        banner: 'Please tell your therapist before we start - we may need to adjust or postpone',
        message: `Massage can help you relax, but if your blood pressure is not well controlled or you feel unwell (headache, dizziness, vision changes), it may not be suitable today. Please tell your therapist.`
    },

    'Cancer - current treatment': {
        level: 'orange',
        banner: 'Please tell your therapist before we start - we may need to adjust or postpone',
        message: `Gentle massage can support comfort and stress relief. Treatment can also increase sensitivity, bruising risk, swelling/lymph issues, or involve medical devices (ports). Please tell your therapist what treatment you're having and any concerns so we can adjust safely.`
    },

    'Recent surgery (last 6 months)': {
        level: 'orange',
        banner: 'Please tell your therapist before we start - we may need to adjust or postpone',
        message: `Massage can help ease tension while you recover. We may need to avoid certain areas. Please tell your therapist what surgery you had and when.`
    },

    // YELLOW - Caution
    'Pregnant': {
        level: 'yellow',
        banner: 'Massage is often still OK - we\'ll keep it gentle and adjust as needed',
        message: `Chair massage can help with tension and stress. If you've had any pregnancy complications or feel unwell today, please tell your therapist so we can keep it gentle and safe.`
    },

    'Recent injury (last 3 months)': {
        level: 'yellow',
        banner: 'Massage is often still OK - we\'ll keep it gentle and adjust as needed',
        message: `Massage can help with muscle tightness around an injury, but working on a recent injury can make it worse. Please tell your therapist what happened, where it is, and how it feels today.`
    },

    'Heart condition': {
        level: 'yellow',
        banner: 'Massage is often still OK - we\'ll keep it gentle and adjust as needed',
        message: `Massage can be relaxing and reduce stress. If you've had any recent symptoms or concerns, please tell your therapist before we start.`
    },

    'Pacemaker/implanted device': {
        level: 'yellow',
        banner: 'Massage is often still OK - we\'ll keep it gentle and adjust as needed',
        message: `Massage is often still ok. We'll avoid direct pressure over the device area. Please tell your therapist where it is and if it's sensitive.`
    },

    'On blood thinners': {
        level: 'yellow',
        banner: 'Massage is often still OK - we\'ll keep it gentle and adjust as needed',
        message: `Massage can increase bruising if pressure is too strong. We'll keep it lighter. Please tell your therapist what you're taking and if you bruise easily.`
    },

    'Diabetes': {
        level: 'yellow',
        banner: 'Massage is often still OK - we\'ll keep it gentle and adjust as needed',
        message: `Massage is usually fine, but some people have reduced sensation or circulation issues. Please tell your therapist if you have numbness, slow healing, or unstable blood sugar today.`
    },

    'Osteoporosis / fragile bones': {
        level: 'yellow',
        banner: 'Massage is often still OK - we\'ll keep it gentle and adjust as needed',
        message: `Massage can still be relaxing, but we need lighter pressure. Please tell your therapist if you've had fractures or have any fragile or painful areas.`
    },

    'Epilepsy / seizures': {
        level: 'yellow',
        banner: 'Massage is often still OK - we\'ll keep it gentle and adjust as needed',
        message: `Massage can be calming, but we need to know if seizures are well controlled. Please tell your therapist about recent episodes, triggers, or warning signs.`
    },

    // GREEN - Info only
    'Allergies/sensitivities (balms/oils/fragrances)': {
        level: 'green',
        banner: 'We can keep this product-free',
        message: `Chair massage is usually product-free. Please tell your therapist what you're sensitive to so we can avoid it.`
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const healthChecks = document.querySelectorAll('input[name="healthChecks"]');
    const healthBanner = document.getElementById('healthBanner');

    if (!healthBanner) return;

    // Create a container for disclaimers if it doesn't exist
    let disclaimerContainer = document.getElementById('healthDisclaimers');
    if (!disclaimerContainer) {
        disclaimerContainer = document.createElement('div');
        disclaimerContainer.id = 'healthDisclaimers';
        disclaimerContainer.style.marginTop = '15px';
        // Insert after the health banner's existing content
        const reviewNote = healthBanner.querySelector('[name="reviewNote"]');
        if (reviewNote && reviewNote.parentElement) {
            reviewNote.parentElement.after(disclaimerContainer);
        } else {
            healthBanner.appendChild(disclaimerContainer);
        }
    }

    const getLevelColors = (level) => {
        const colors = {
            red: { bg: '#ffebee', border: '#c62828', text: '#b71c1c' },
            orange: { bg: '#fff3e0', border: '#ef6c00', text: '#e65100' },
            yellow: { bg: '#fffde7', border: '#f9a825', text: '#f57f17' },
            green: { bg: '#e8f5e9', border: '#43a047', text: '#2e7d32' }
        };
        return colors[level] || colors.yellow;
    };

    const updateDisclaimers = () => {
        const checkedConditions = Array.from(healthChecks)
            .filter(cb => cb.checked && cb.value !== 'Other health concern')
            .map(cb => cb.value);

        // Clear existing disclaimers
        disclaimerContainer.innerHTML = '';

        if (checkedConditions.length > 0) {
            checkedConditions.forEach(condition => {
                const disclaimer = HEALTH_DISCLAIMERS[condition];
                if (disclaimer) {
                    const colors = getLevelColors(disclaimer.level);

                    const disclaimerDiv = document.createElement('div');
                    disclaimerDiv.className = 'health-disclaimer';
                    disclaimerDiv.style.cssText = `background:${colors.bg}; border-left:4px solid ${colors.border}; padding:12px; margin-bottom:10px; border-radius:4px;`;

                    const title = document.createElement('strong');
                    title.textContent = condition;
                    title.style.display = 'block';
                    title.style.marginBottom = '8px';
                    title.style.color = colors.text;

                    const banner = document.createElement('div');
                    banner.textContent = disclaimer.banner;
                    banner.style.cssText = `background:${colors.border}; color:white; padding:6px 10px; margin:-12px -12px 10px -12px; border-radius:4px 4px 0 0; font-weight:600; font-size:13px;`;

                    const text = document.createElement('p');
                    text.textContent = disclaimer.message;
                    text.style.margin = '0';
                    text.style.fontSize = '14px';
                    text.style.lineHeight = '1.5';
                    text.style.color = '#2c3e50';

                    disclaimerDiv.appendChild(banner);
                    disclaimerDiv.appendChild(title);
                    disclaimerDiv.appendChild(text);
                    disclaimerContainer.appendChild(disclaimerDiv);
                }
            });
        }
    };

    healthChecks.forEach(cb => cb.addEventListener('change', updateDisclaimers));
    updateDisclaimers();
});

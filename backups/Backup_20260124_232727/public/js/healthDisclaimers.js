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
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        // Clear existing disclaimers
        disclaimerContainer.innerHTML = '';

        if (checkedConditions.length === 0) return;

        // Determine highest severity among selected conditions
        const severityRank = { red: 3, orange: 2, yellow: 1, green: 0 };

        // Short, neutral explanations of each condition's relation to massage
        const RELATION_EXPLANATIONS = {
            'Fever / contagious illness today': 'This may indicate an active infection — resting and rescheduling protects you and others. When recovered, massage often helps reduce tension and aid relaxation.',
            'Skin infection/rash/open wound in areas to be treated': 'Open skin issues can be irritated by touch; letting the area heal prevents complications. Once healed, massage can help surrounding tissues relax and recover.',
            'Dizziness/fainting episodes': 'Feeling dizzy can affect your safety during a seated session — please tell your therapist. Gentle, stabilising techniques can still support relaxation once symptoms are managed.',
            'Numbness/tingling (unexplained)': 'New or unexplained sensations can point to nerve irritation — mention them so we use a cautious approach. Appropriate massage may help relieve muscle tension contributing to these symptoms.',
            'History of blood clots / DVT': 'A history of clots requires caution with pressure over affected areas; informing your therapist helps them adapt treatment. Gentle techniques may still provide comfort and tension relief.',
            'High blood pressure (uncontrolled)': 'If blood pressure is uncontrolled, gentler pressure and monitoring are recommended. Massage can support relaxation and stress reduction when used safely.',
            'Cancer - current treatment': 'Cancer treatments can change tissue sensitivity and healing; share treatment details so pressure is adapted. Gentle massage can help with comfort and stress relief in many cases.',
            'Recent surgery (last 6 months)': 'Recent surgical sites need protecting — therapists can avoid those areas and adjust techniques. Massage around, not over, healed areas can reduce tension and support recovery when appropriate.',
            'Pregnant': 'Pregnancy requires adjusted positioning and pressure; let your therapist know stage and any concerns. Appropriately modified massage can reduce discomfort and support relaxation during pregnancy.',
            'Recent injury (last 3 months)': 'New injuries are sensitive — we avoid aggressive work near them and use gentle methods. Light, targeted techniques can aid recovery by reducing tension in surrounding muscles.',
            'Heart condition': 'Certain heart conditions benefit from a gentle approach and monitoring; please inform your therapist. Relaxation-focused massage may reduce stress and aid comfort under guidance.',
            'Pacemaker/implanted device': 'Therapists should avoid applying pressure directly over devices — tell them where it is. Massage elsewhere can still help with tension and relaxation.',
            'On blood thinners': 'Blood thinners can increase bruising risk, so lighter pressure is used. Gentle massage can still improve circulation and reduce muscle tension while minimising risk.',
            'Diabetes': 'Diabetes can affect sensation and healing; skin checks and gentler techniques are important. Massage can help with circulation, stress reduction, and easing muscle stiffness when appropriate.',
            'Osteoporosis / fragile bones': 'Fragile bones need very gentle handling to avoid injury; therapists will adapt pressure. Gentle techniques can still provide relaxation and help reduce muscle tension.',
            'Epilepsy / seizures': 'Knowing seizure history helps ensure safe positioning and monitoring. Massage that emphasises relaxation and comfort can be beneficial when care is taken.',
            'Allergies/sensitivities (balms/oils/fragrances)': 'Tell your therapist about sensitivities so they can avoid triggering products; product-free options are available. Massage without potential irritants still offers relaxation and muscle relief.'
        };
        let highest = { level: 'green', rank: -1, condition: null };
        const items = [];

        checkedConditions.forEach(condition => {
            const disclaimer = HEALTH_DISCLAIMERS[condition];
            if (disclaimer) {
                const rank = severityRank[disclaimer.level] ?? 0;
                if (rank > highest.rank) {
                    highest = { level: disclaimer.level, rank, condition };
                }
                items.push({ condition, banner: disclaimer.banner, message: disclaimer.message, level: disclaimer.level });
            } else {
                // Unknown condition (e.g., Other) - include as low severity
                items.push({ condition, banner: 'Please advise', message: 'Please provide details to your therapist.', level: 'green' });
            }
        });

        // Pick colors based on highest severity
        const colors = getLevelColors(highest.level || 'yellow');

        // Create combined summary box
        const box = document.createElement('div');
        box.className = 'health-disclaimer combined';
        box.style.cssText = `background:${colors.bg}; border-left:4px solid ${colors.border}; padding:12px; margin-bottom:10px; border-radius:4px;`;

        // Neutral header (no suitability suggestion)
        const banner = document.createElement('div');
        banner.textContent = 'Health flags';
        banner.style.cssText = `background:${colors.border}; color:white; padding:8px 10px; margin:-12px -12px 10px -12px; border-radius:4px 4px 0 0; font-weight:700; font-size:14px;`;

        const title = document.createElement('div');
        title.style.marginBottom = '8px';
        title.innerHTML = `<strong>Conditions flagged:</strong> ${checkedConditions.join(', ')}`;

        const details = document.createElement('div');
        details.style.marginTop = '6px';
        details.style.color = '#2c3e50';
        details.style.fontSize = '14px';

        // List each flagged condition with a neutral prompt (no suitability advice)
        const ul = document.createElement('ul');
        ul.style.margin = '6px 0 0 18px';
        ul.style.padding = '0';
        items.forEach(it => {
            const li = document.createElement('li');
            li.style.marginBottom = '8px';
            const relation = RELATION_EXPLANATIONS[it.condition] || 'Please inform your therapist about this condition.';
            li.innerHTML = `<strong style="display:block; color:${colors.text};">${it.condition}</strong><span style="color:#2c3e50;">${relation}</span>`;
            ul.appendChild(li);
        });

        details.appendChild(ul);
        box.appendChild(banner);
        box.appendChild(title);
        box.appendChild(details);
        disclaimerContainer.appendChild(box);
    };

    healthChecks.forEach(cb => cb.addEventListener('change', updateDisclaimers));
    updateDisclaimers();
});

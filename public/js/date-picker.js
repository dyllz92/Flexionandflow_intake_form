document.addEventListener('DOMContentLoaded', () => {
    const dateInputs = document.querySelectorAll('.date-input');
    if (!dateInputs.length) return;

    const parseDateValue = (value) => {
        const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
        if (!match) return null;
        const day = Number(match[1]);
        const month = Number(match[2]);
        const year = Number(match[3]);
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
        return date;
    };

    const setValidityState = (input, value) => {
        const trimmed = value.trim();
        if (!trimmed) {
            input.dataset.dateValid = 'false';
            input.classList.remove('is-invalid');
            input.removeAttribute('aria-invalid');
            return;
        }
        const valid = !!parseDateValue(trimmed);
        input.dataset.dateValid = valid ? 'true' : 'false';
        input.classList.toggle('is-invalid', !valid);
        if (!valid) {
            input.setAttribute('aria-invalid', 'true');
        } else {
            input.removeAttribute('aria-invalid');
        }
    };

    dateInputs.forEach(input => {
        if (typeof flatpickr !== 'undefined') {
            const options = {
                dateFormat: 'd/m/Y',
                allowInput: true,
                disableMobile: true,
                monthSelectorType: 'dropdown',
                onChange: (_selectedDates, dateStr) => setValidityState(input, dateStr),
                onValueUpdate: (_selectedDates, dateStr) => setValidityState(input, dateStr)
            };

            if (input.dataset.maxDate === 'today') {
                options.maxDate = 'today';
            }

            const instance = flatpickr(input, options);

            if (input.value.trim()) {
                const parsed = parseDateValue(input.value);
                if (parsed) {
                    instance.setDate(parsed, false, 'd/m/Y');
                }
            }
        }

        input.addEventListener('input', () => {
            setValidityState(input, input.value);
        });

        setValidityState(input, input.value);
    });
});

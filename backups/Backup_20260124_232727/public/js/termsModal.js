// Terms + Privacy modal behavior
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('termsModal');
    const openBtn = document.getElementById('viewTermsBtn');
    const closeBtn = document.getElementById('closeTermsBtn');
    const backdrop = modal ? modal.querySelector('.terms-backdrop') : null;
    let lastFocused = null;

    if (!modal || !openBtn || !closeBtn) return;

    function openModal() {
        lastFocused = document.activeElement;
        modal.classList.remove('hidden-field');
        modal.setAttribute('aria-hidden', 'false');
        // focus close button
        closeBtn.focus();
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.add('hidden-field');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (lastFocused) lastFocused.focus();
    }

    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);

    if (backdrop) backdrop.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden-field')) {
            closeModal();
        }
    });
});

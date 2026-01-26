(function() {
    'use strict';

    let currentZoom = 1;
    const ZOOM_STEP = 0.2;
    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 3;

    function init() {
        const modal = document.getElementById('bodyMapModal');
        const expandBtn = document.getElementById('expandBodyMap');
        const closeBtn = document.getElementById('closeBodyMapBtn');
        const expandedContainer = document.getElementById('muscleMapContainerExpanded');
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');
        const resetZoomBtn = document.getElementById('resetZoomBtn');
        const clearExpandedBtn = document.getElementById('clearMuscleMapExpanded');

        if (!modal || !expandBtn || !closeBtn || !expandedContainer) {
            console.warn('Body map modal elements not found');
            return;
        }

        // Open modal
        expandBtn.addEventListener('click', function() {
            openModal();
        });

        // Close modal
        closeBtn.addEventListener('click', function() {
            closeModal();
        });

        // Close on backdrop click
        modal.querySelector('.body-map-backdrop').addEventListener('click', function() {
            closeModal();
        });

        // Close on ESC key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && !modal.classList.contains('hidden-field')) {
                closeModal();
            }
        });

        // Zoom controls
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', function() {
                zoomIn();
            });
        }

        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', function() {
                zoomOut();
            });
        }

        if (resetZoomBtn) {
            resetZoomBtn.addEventListener('click', function() {
                resetZoom();
            });
        }

        // Clear button in expanded view
        if (clearExpandedBtn) {
            clearExpandedBtn.addEventListener('click', function() {
                if (window.muscleMap && typeof window.muscleMap.clearAllMarks === 'function') {
                    window.muscleMap.clearAllMarks();
                }
            });
        }
    }

    function openModal() {
        const modal = document.getElementById('bodyMapModal');
        const expandedContainer = document.getElementById('muscleMapContainerExpanded');
        const mainContainer = document.getElementById('muscleMapContainer');

        if (!modal || !expandedContainer || !mainContainer) return;

        // Clone the muscle map canvas into the expanded container
        expandedContainer.innerHTML = '';
        const mainCanvas = mainContainer.querySelector('canvas.muscle-map-canvas');
        if (mainCanvas && window.muscleMap) {
            // Create a new canvas in the expanded container with the same dimensions
            const expandedCanvas = document.createElement('canvas');
            expandedCanvas.className = 'muscle-map-canvas';
            expandedCanvas.width = mainCanvas.width;
            expandedCanvas.height = mainCanvas.height;
            expandedCanvas.style.maxWidth = '100%';
            expandedCanvas.style.height = 'auto';
            expandedContainer.appendChild(expandedCanvas);

            // Copy the current drawing from main canvas to expanded canvas
            const expandedCtx = expandedCanvas.getContext('2d');
            expandedCtx.drawImage(mainCanvas, 0, 0);

            // Attach click handlers to the expanded canvas to interact with muscleMap
            expandedCanvas.addEventListener('click', (e) => {
                const rect = expandedCanvas.getBoundingClientRect();
                const scaleX = expandedCanvas.width / rect.width;
                const scaleY = expandedCanvas.height / rect.height;
                const x = (e.clientX - rect.left) * scaleX;
                const y = (e.clientY - rect.top) * scaleY;

                // Use the main muscleMap to add/remove marks
                if (window.muscleMap && typeof window.muscleMap.addMark === 'function') {
                    window.muscleMap.addMark(x, y);
                    // Redraw the expanded canvas to match the main canvas
                    expandedCtx.drawImage(mainCanvas, 0, 0);
                }
            });

            // Touch support
            expandedCanvas.addEventListener('touchend', (e) => {
                e.preventDefault();
                const touch = e.changedTouches[0];
                if (touch) {
                    const rect = expandedCanvas.getBoundingClientRect();
                    const scaleX = expandedCanvas.width / rect.width;
                    const scaleY = expandedCanvas.height / rect.height;
                    const x = (touch.clientX - rect.left) * scaleX;
                    const y = (touch.clientY - rect.top) * scaleY;

                    if (window.muscleMap && typeof window.muscleMap.addMark === 'function') {
                        window.muscleMap.addMark(x, y);
                        expandedCtx.drawImage(mainCanvas, 0, 0);
                    }
                }
            });
        }

        // Reset zoom
        currentZoom = 1;
        applyZoom();

        // Show modal
        modal.classList.remove('hidden-field');
        modal.setAttribute('aria-hidden', 'false');

        // Focus management
        document.getElementById('closeBodyMapBtn').focus();

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        const modal = document.getElementById('bodyMapModal');
        const expandedContainer = document.getElementById('muscleMapContainerExpanded');
        const mainContainer = document.getElementById('muscleMapContainer');

        if (!modal) return;

        // Sync any changes back to main view
        if (window.muscleMap && mainContainer && typeof window.muscleMap.redrawDots === 'function') {
            // The muscleMap singleton handles state, redraw the main view
            window.muscleMap.redrawDots();
        }

        // Hide modal
        modal.classList.add('hidden-field');
        modal.setAttribute('aria-hidden', 'true');

        // Clear expanded container
        if (expandedContainer) {
            expandedContainer.innerHTML = '';
        }

        // Restore body scroll
        document.body.style.overflow = '';

        // Return focus to expand button
        const expandBtn = document.getElementById('expandBodyMap');
        if (expandBtn) {
            expandBtn.focus();
        }
    }

    function zoomIn() {
        if (currentZoom < MAX_ZOOM) {
            currentZoom = Math.min(currentZoom + ZOOM_STEP, MAX_ZOOM);
            applyZoom();
        }
    }

    function zoomOut() {
        if (currentZoom > MIN_ZOOM) {
            currentZoom = Math.max(currentZoom - ZOOM_STEP, MIN_ZOOM);
            applyZoom();
        }
    }

    function resetZoom() {
        currentZoom = 1;
        applyZoom();
    }

    function applyZoom() {
        const expandedContainer = document.getElementById('muscleMapContainerExpanded');
        if (expandedContainer) {
            expandedContainer.style.transform = `scale(${currentZoom})`;
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

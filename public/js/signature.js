// Signature Pad Implementation
class SignaturePad {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.isDrawing = false;
        this.hasSignature = false;

        // Set canvas size
        this.resizeCanvas();

        // Setup drawing
        this.setupCanvas();
        this.bindEvents();
    }

    resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const fallbackWidth = (this.canvas.parentElement && this.canvas.parentElement.clientWidth) || 400;
        const cssWidth = this.canvas.offsetWidth || fallbackWidth;
        const cssHeight = this.canvas.offsetHeight || 200;
        this.canvas.width = cssWidth * ratio;
        this.canvas.height = cssHeight * ratio;
        this.canvas.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    setupCanvas() {
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }

    bindEvents() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopDrawing();
        });
    }

    getCoordinates(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    startDrawing(event) {
        this.isDrawing = true;
        const coords = this.getCoordinates(event);
        this.ctx.beginPath();
        this.ctx.moveTo(coords.x, coords.y);
    }

    draw(event) {
        if (!this.isDrawing) return;

        const coords = this.getCoordinates(event);
        this.ctx.lineTo(coords.x, coords.y);
        this.ctx.stroke();
        this.hasSignature = true;
        this.canvas.classList.add('signed');
    }

    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.ctx.closePath();

            // If we have drawn content, update hidden fields immediately
            if (this.hasDrawnContent()) {
                const sigField = document.getElementById('signatureData');
                const signedAtField = document.getElementById('signedAt');
                if (sigField) {
                    sigField.value = this.toDataURL();
                }
                if (signedAtField) {
                    signedAtField.value = new Date().toISOString();
                }
            }

            // Notify listeners that signature changed
            notifySignatureChanged();
        }
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.hasSignature = false;
        this.canvas.classList.remove('signed');
    }

    isEmpty() {
        // Consider typed signature as a valid signature as well
        return !this.hasSignature && !(window.typedSignatureText && String(window.typedSignatureText).trim().length > 0);
    }

    toDataURL() {
        return this.canvas.toDataURL('image/png');
    }

    /**
     * Check if canvas has actual drawn content (more robust than just hasSignature flag)
     * Compares a few pixels to ensure there's actual drawing, not just the flag being set
     */
    hasDrawnContent() {
        // First check the flag
        if (!this.hasSignature) return false;

        // For additional safety, check that there's actual pixel data on the canvas
        try {
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            const data = imageData.data;
            // Check if any pixel has non-zero alpha (indicating something was drawn)
            for (let i = 3; i < data.length; i += 4) {
                if (data[i] > 0) {
                    return true;
                }
            }
        } catch (e) {
            // If we can't check pixels, rely on the flag
            return this.hasSignature;
        }

        return false;
    }
}

/**
 * Notify that signature state has changed
 * - Dispatches custom event for other listeners
 * - Updates wizard button states if available
 */
function notifySignatureChanged() {
    // Dispatch custom event
    document.dispatchEvent(new Event('signature:changed'));

    // Update wizard button states if wizard is initialized
    if (window.wizard && typeof window.wizard.updateButtonStates === 'function') {
        window.wizard.updateButtonStates();
    }
}

// Initialize signature pad when page loads
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('signatureCanvas');
    if (canvas) {
        window.signaturePad = new SignaturePad(canvas);

        function fitTypedSignatureText(text) {
            const overlay = document.getElementById('typedOverlay');
            if (!overlay) return;
            const value = (text || '').trim();
            overlay.textContent = value;
            if (!value) {
                overlay.style.fontSize = '';
                return;
            }
            const maxFont = 56;
            const minFont = 14;
            const wasHidden = window.getComputedStyle(overlay).display === 'none';
            if (wasHidden) {
                overlay.style.visibility = 'hidden';
                overlay.style.display = 'flex';
            }
            overlay.style.fontSize = `${maxFont}px`;
            let fontSize = maxFont;
            while (fontSize > minFont &&
                (overlay.scrollWidth > overlay.clientWidth || overlay.scrollHeight > overlay.clientHeight)) {
                fontSize -= 1;
                overlay.style.fontSize = `${fontSize}px`;
            }
            if (wasHidden) {
                overlay.style.display = 'none';
                overlay.style.visibility = '';
            }
        }

        // Clear button
        const clearBtn = document.getElementById('clearSignature');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                // clear drawn signature
                window.signaturePad.clear();
                // clear typed signature state too
                window.typedSignatureText = '';
                const typedInput = document.getElementById('typedSignatureInput');
                const typedPreview = document.getElementById('typedSignaturePreview');
                if (typedInput) typedInput.value = '';
                if (typedPreview) typedPreview.textContent = '';
                fitTypedSignatureText('');
                const sigField = document.getElementById('signatureData');
                const signedAtField = document.getElementById('signedAt');
                if (sigField) sigField.value = '';
                if (signedAtField) signedAtField.value = '';

                // Notify listeners that signature changed
                notifySignatureChanged();
            });
        }

        // Clear typed-only button
        const clearTypedBtn = document.getElementById('clearTypedSignature');
        if (clearTypedBtn) {
            clearTypedBtn.addEventListener('click', () => {
                window.typedSignatureText = '';
                const typedInput = document.getElementById('typedSignatureInput');
                const typedPreview = document.getElementById('typedSignaturePreview');
                if (typedInput) typedInput.value = '';
                if (typedPreview) typedPreview.textContent = '';
                fitTypedSignatureText('');
                const sigField = document.getElementById('signatureData');
                const signedAtField = document.getElementById('signedAt');
                if (sigField) sigField.value = '';
                if (signedAtField) signedAtField.value = '';
                // switch back to draw mode
                const drawRadio = document.getElementById('signatureMethodDraw');
                if (drawRadio) drawRadio.checked = true;
                toggleSignatureMethod('draw');

                // Notify listeners that signature changed
                notifySignatureChanged();
            });
        }

        // Signature method toggles
        const drawRadio = document.getElementById('signatureMethodDraw');
        const typeRadio = document.getElementById('signatureMethodType');
        function toggleSignatureMethod(mode) {
            // Keep the signature container visible at all times so the box stays the same size.
            const typeArea = document.querySelectorAll('.signature-type');
            typeArea.forEach(el => el.style.display = (mode === 'type') ? '' : 'none');

            const canvasEl = document.getElementById('signatureCanvas');
            const typedOverlay = document.getElementById('typedOverlay');
            if (mode === 'type') {
                if (canvasEl) canvasEl.style.pointerEvents = 'none';
                if (typedOverlay) {
                    typedOverlay.style.display = 'flex';
                    typedOverlay.setAttribute('aria-hidden', 'false');
                    fitTypedSignatureText(window.typedSignatureText || '');
                }
            } else {
                if (canvasEl) canvasEl.style.pointerEvents = 'auto';
                if (typedOverlay) {
                    typedOverlay.style.display = 'none';
                    typedOverlay.setAttribute('aria-hidden', 'true');
                }
            }

            // Notify listeners that signature method changed (affects validation)
            notifySignatureChanged();
        }
        if (drawRadio) drawRadio.addEventListener('change', () => toggleSignatureMethod('draw'));
        if (typeRadio) typeRadio.addEventListener('change', () => toggleSignatureMethod('type'));

        // Typed signature input handling
        const typedInput = document.getElementById('typedSignatureInput');
        const typedPreview = document.getElementById('typedSignaturePreview');
        if (typedInput) {
            typedInput.addEventListener('input', (e) => {
                const v = (e.target.value || '').trim();
                window.typedSignatureText = v;
                // Clear any drawn signature when user starts typing
                if (v && window.signaturePad && window.signaturePad.hasSignature) {
                    window.signaturePad.clear();
                }
                // update any visible preview or overlay
                const typedPreviewLocal = document.getElementById('typedSignaturePreview');
                if (typedPreviewLocal) typedPreviewLocal.textContent = v;
                fitTypedSignatureText(v);
                const sigField = document.getElementById('signatureData');
                const signedAtField = document.getElementById('signedAt');
                if (sigField) {
                    // prefix typed signatures so the server/pdf knows how to render
                    sigField.value = v ? `text:${v}` : '';
                }
                if (signedAtField && v) {
                    signedAtField.value = new Date().toISOString();
                }
                // when typed signature present, mark signaturePad as having a signature for validation
                if (window.signaturePad) window.signaturePad.hasSignature = !!v || window.signaturePad.hasSignature;

                // Notify listeners that signature changed
                notifySignatureChanged();
            });
        }

        // Resize handler
        window.addEventListener('resize', () => {
            if (window.signaturePad && !window.signaturePad.isEmpty()) {
                const data = window.signaturePad.toDataURL();
                window.signaturePad.resizeCanvas();
                window.signaturePad.setupCanvas();
                const img = new Image();
                img.onload = () => {
                    window.signaturePad.ctx.drawImage(img, 0, 0);
                };
                img.src = data;
            } else if (window.signaturePad) {
                window.signaturePad.resizeCanvas();
                window.signaturePad.setupCanvas();
            }
            if (window.typedSignatureText) {
                fitTypedSignatureText(window.typedSignatureText);
            }
        });

        // Orientation change handler for mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                if (window.signaturePad) {
                    const hasContent = !window.signaturePad.isEmpty();
                    const data = hasContent ? window.signaturePad.toDataURL() : null;
                    window.signaturePad.resizeCanvas();
                    window.signaturePad.setupCanvas();
                    if (hasContent && data) {
                        const img = new Image();
                        img.onload = () => {
                            window.signaturePad.ctx.drawImage(img, 0, 0);
                        };
                        img.src = data;
                    }
                }
                if (window.typedSignatureText) {
                    const overlay = document.getElementById('typedOverlay');
                    if (overlay) {
                        fitTypedSignatureText(window.typedSignatureText);
                    }
                }
            }, 200);
        });
    }
});

/**
 * Method-aware signature validation
 * Returns true if EITHER:
 * 1. signatureMethod === 'draw' AND the canvas contains a real signature
 * 2. signatureMethod === 'type' AND the typed signature has text
 */
window.isSignatureValid = function() {
    // Get the selected signature method
    const selectedMethod = document.querySelector('input[name="signatureMethod"]:checked')?.value || 'draw';

    if (selectedMethod === 'draw') {
        // For draw method, check if canvas has drawn content
        return window.signaturePad && window.signaturePad.hasDrawnContent();
    } else if (selectedMethod === 'type') {
        // For type method, check if typed text has content
        return window.typedSignatureText && window.typedSignatureText.trim().length > 0;
    }

    // Default: invalid
    return false;
};

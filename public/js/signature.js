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

        // Clear hidden fields
        const sigField = document.getElementById('signatureData');
        const signedAtField = document.getElementById('signedAt');
        if (sigField) sigField.value = '';
        if (signedAtField) signedAtField.value = '';
    }

    isEmpty() {
        return !this.hasSignature;
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

        // Clear button
        const clearBtn = document.getElementById('clearSignature');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                window.signaturePad.clear();
                notifySignatureChanged();
            });
        }

        // Resize handler - preserve signature on resize
        window.addEventListener('resize', () => {
            if (window.signaturePad && window.signaturePad.hasDrawnContent()) {
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
        });

        // Orientation change handler for mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                if (window.signaturePad) {
                    const hasContent = window.signaturePad.hasDrawnContent();
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
            }, 200);
        });
    }
});

/**
 * Signature validation - always returns true (signature is optional)
 */
window.isSignatureValid = function() {
    return true;
};

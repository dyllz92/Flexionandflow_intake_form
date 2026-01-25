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
                // clear drawn signature
                window.signaturePad.clear();
                // clear typed signature state too
                window.typedSignatureText = '';
                const typedInput = document.getElementById('typedSignatureInput');
                const typedPreview = document.getElementById('typedSignaturePreview');
                if (typedInput) typedInput.value = '';
                if (typedPreview) typedPreview.textContent = '';
                const sigField = document.getElementById('signatureData');
                if (sigField) sigField.value = '';
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
                const sigField = document.getElementById('signatureData');
                if (sigField) sigField.value = '';
                // switch back to draw mode
                const drawRadio = document.getElementById('signatureMethodDraw');
                if (drawRadio) drawRadio.checked = true;
                toggleSignatureMethod('draw');
            });
        }

        // Signature method toggles
        const drawRadio = document.getElementById('signatureMethodDraw');
        const typeRadio = document.getElementById('signatureMethodType');
        function toggleSignatureMethod(mode) {
            const drawArea = document.querySelectorAll('.signature-draw');
            const typeArea = document.querySelectorAll('.signature-type');
            drawArea.forEach(el => el.style.display = (mode === 'draw') ? '' : 'none');
            typeArea.forEach(el => el.style.display = (mode === 'type') ? '' : 'none');
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
                if (typedPreview) typedPreview.textContent = v;
                const sigField = document.getElementById('signatureData');
                if (sigField) {
                    // prefix typed signatures so the server/pdf knows how to render
                    sigField.value = v ? `text:${v}` : '';
                }
                // when typed signature present, mark signaturePad as having a signature for validation
                if (window.signaturePad) window.signaturePad.hasSignature = !!v || window.signaturePad.hasSignature;
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
        });
    }
});

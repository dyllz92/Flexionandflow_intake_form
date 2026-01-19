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
        this.canvas.width = this.canvas.offsetWidth * ratio;
        this.canvas.height = this.canvas.offsetHeight * ratio;
        this.canvas.getContext('2d').scale(ratio, ratio);
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
        return !this.hasSignature;
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
                window.signaturePad.clear();
                document.getElementById('signatureData').value = '';
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

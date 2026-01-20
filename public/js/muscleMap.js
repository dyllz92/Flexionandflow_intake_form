/**
 * Interactive Muscle Map Handler
 * Allows users to click on a body map image to place dots marking discomfort areas
 */

class InteractiveMuscleMap {
    constructor(containerId, marksInputId) {
        this.marksInput = document.getElementById(marksInputId);
        this.marks = [];
        this.currentGender = 'Male'; // Default
        this.canvas = null;
        this.ctx = null;
        this.dotRadius = 8;
        
        // Try to find canvas or container
        let containerElement = document.getElementById(containerId);
        
        if (!containerElement) {
            console.error(`Could not find element with id: ${containerId}`);
            return;
        }
        
        // If it's a div container, create canvas inside
        if (containerElement.tagName === 'DIV') {
            this.container = containerElement;
            this.canvas = document.createElement('canvas');
            this.canvas.className = 'muscle-map-canvas';
            this.canvas.width = 400;
            this.canvas.height = 600;
            this.container.insertBefore(this.canvas, this.container.firstChild);
        } else if (containerElement.tagName === 'CANVAS') {
            // If it's already a canvas, use it directly
            this.canvas = containerElement;
            this.container = containerElement.parentElement;
            this.canvas.width = 400;
            this.canvas.height = 600;
        }
        
        if (!this.canvas) {
            console.error('Failed to initialize canvas');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        this.initializeGenderListener();
        this.drawBodyMap();
        
        // Add canvas click handler
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('touchend', (e) => this.handleCanvasClick(e));
    }
    
    initializeGenderListener() {
        // Listen for gender changes
        const genderInputs = document.querySelectorAll('input[name="gender"]');
        genderInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                // Determine gender - default to Male for non-binary or prefer not to disclose
                if (e.target.value === 'Female') {
                    this.currentGender = 'Female';
                } else {
                    this.currentGender = 'Male'; // Default for Male, Non-binary, Prefer not to disclose
                }
                this.marks = [];
                this.updateInput();
                this.drawBodyMap();
            });
        });
        
        // Get initial gender selection if any
        const selectedGender = document.querySelector('input[name="gender"]:checked');
        if (selectedGender && selectedGender.value === 'Female') {
            this.currentGender = 'Female';
        }
    }
    
    drawBodyMap() {
        // Draw a simple body outline
        const canvas = this.canvas;
        const ctx = this.ctx;
        
        // Clear canvas with light background
        ctx.fillStyle = '#f9f9f9';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw border
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        
        // Draw body outline
        ctx.strokeStyle = '#999';
        ctx.fillStyle = '#f0f0f0';
        ctx.lineWidth = 2;
        
        const centerX = canvas.width / 2;
        
        // Head
        ctx.beginPath();
        ctx.arc(centerX, 50, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Neck
        ctx.fillRect(centerX - 12, 75, 24, 20);
        ctx.strokeRect(centerX - 12, 75, 24, 20);
        
        // Shoulders and torso
        ctx.beginPath();
        ctx.moveTo(centerX - 50, 95);
        ctx.lineTo(centerX + 50, 95);
        ctx.lineTo(centerX + 40, 250);
        ctx.lineTo(centerX - 40, 250);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Left arm
        ctx.fillRect(centerX - 55, 100, 20, 130);
        ctx.strokeRect(centerX - 55, 100, 20, 130);
        
        // Right arm
        ctx.fillRect(centerX + 35, 100, 20, 130);
        ctx.strokeRect(centerX + 35, 100, 20, 130);
        
        // Left leg
        ctx.fillRect(centerX - 30, 250, 25, 150);
        ctx.strokeRect(centerX - 30, 250, 25, 150);
        
        // Right leg
        ctx.fillRect(centerX + 5, 250, 25, 150);
        ctx.strokeRect(centerX + 5, 250, 25, 150);
        
        // Draw label
        ctx.fillStyle = '#999';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Click to mark areas of discomfort', centerX, canvas.height - 10);
        
        // Redraw dots
        this.redrawDots();
    }
    
    handleCanvasClick(e) {
        if (!this.canvas) return;
        
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        let x, y;
        
        if (e.touches) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }
        
        // Scale coordinates if canvas is displayed at different size
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        x *= scaleX;
        y *= scaleY;
        
        // Add mark at this location
        this.addMark(x, y);
    }
    
    addMark(x, y) {
        // Check if clicking on an existing dot
        for (let i = this.marks.length - 1; i >= 0; i--) {
            const mark = this.marks[i];
            const distance = Math.sqrt((mark.x - x) ** 2 + (mark.y - y) ** 2);
            if (distance < this.dotRadius * 1.5) {
                // Remove this mark
                this.marks.splice(i, 1);
                this.redrawDots();
                this.updateInput();
                return;
            }
        }
        
        // Add new mark
        this.marks.push({
            x: Math.round(x),
            y: Math.round(y),
            timestamp: new Date().toISOString()
        });
        
        this.redrawDots();
        this.updateInput();
    }
    
    redrawDots() {
        // Redraw the body map
        this.drawBodyMap();
        
        // Draw all dots
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.strokeStyle = '#c0392b';
        this.ctx.lineWidth = 2;
        
        this.marks.forEach(mark => {
            // Draw dot
            this.ctx.beginPath();
            this.ctx.arc(mark.x, mark.y, this.dotRadius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Draw cross in center
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(mark.x - 3, mark.y);
            this.ctx.lineTo(mark.x + 3, mark.y);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(mark.x, mark.y - 3);
            this.ctx.lineTo(mark.x, mark.y + 3);
            this.ctx.stroke();
        });
    }
    
    updateInput() {
        // Store marks as JSON in hidden input
        if (this.marksInput) {
            this.marksInput.value = JSON.stringify(this.marks);
        }
    }
    
    clear() {
        this.marks = [];
        this.redrawDots();
        this.updateInput();
    }
    
    getMarks() {
        return this.marks;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Try both container types
    let muscleContainer = document.getElementById('muscleMapContainer');
    let canvasElement = document.getElementById('muscleMapCanvas');
    let containerId = null;
    
    if (muscleContainer) {
        containerId = 'muscleMapContainer';
    } else if (canvasElement) {
        containerId = 'muscleMapCanvas';
    }
    
    if (containerId) {
        window.muscleMap = new InteractiveMuscleMap(containerId, 'muscleMapMarks');
        
        // Clear button
        const clearBtn = document.getElementById('clearMuscleMap');
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.muscleMap.clear();
            });
        }
    }
});

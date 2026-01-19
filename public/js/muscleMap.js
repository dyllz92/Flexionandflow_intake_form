/**
 * SVG Muscle Map Interaction Handler
 * Allows users to click on SVG muscle areas to mark discomfort
 */

class SVGMuscleMap {
    constructor(containerId, marksInputId) {
        this.container = document.getElementById(containerId);
        this.marksInput = document.getElementById(marksInputId);
        this.marks = [];
        this.currentGender = 'Male'; // Default
        this.svgElement = null;
        
        this.initializeGenderListener();
        this.loadSVG();
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
                this.loadSVG();
            });
        });
        
        // Get initial gender selection if any
        const selectedGender = document.querySelector('input[name="gender"]:checked');
        if (selectedGender && selectedGender.value === 'Female') {
            this.currentGender = 'Female';
        }
    }
    
    loadSVG() {
        // Clear container
        this.container.innerHTML = '';
        this.marks = [];
        this.updateInput();
        
        // Determine which SVG to load
        const svgFile = this.currentGender === 'Female' 
            ? '/js/Female Body Map.svg' 
            : '/js/Male Body Map.svg';
        
        // Fetch and insert SVG
        fetch(svgFile)
            .then(response => response.text())
            .then(svgContent => {
                // Create a wrapper div for the SVG
                const svgWrapper = document.createElement('div');
                svgWrapper.className = 'svg-muscle-map-wrapper';
                svgWrapper.innerHTML = svgContent;
                
                this.container.appendChild(svgWrapper);
                
                // Get the actual SVG element
                this.svgElement = svgWrapper.querySelector('svg');
                
                if (this.svgElement) {
                    // Set up click handlers for all clickable elements
                    this.setupClickHandlers();
                    
                    // Add some styling
                    this.svgElement.setAttribute('class', 'svg-muscle-map');
                }
            })
            .catch(error => {
                console.error('Error loading SVG:', error);
                this.container.innerHTML = '<p style="color: red;">Error loading muscle map</p>';
            });
    }
    
    setupClickHandlers() {
        // Get all paths and groups in the SVG that should be clickable
        const clickableElements = this.svgElement.querySelectorAll('[data-body-part], path, circle, rect, polygon');
        
        clickableElements.forEach((element, index) => {
            // Skip if it's text or already has handler
            if (element.tagName === 'text') return;
            
            element.style.cursor = 'pointer';
            
            element.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleMark(element, index);
            });
            
            element.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleMark(element, index);
            });
        });
    }
    
    toggleMark(element, index) {
        // Create a unique identifier for this body part
        const partId = element.getAttribute('data-body-part') || element.id || `part-${index}`;
        const partName = element.getAttribute('data-body-part-name') || partId;
        
        // Check if already marked
        const existingMark = this.marks.find(m => m.partId === partId);
        
        if (existingMark) {
            // Remove mark
            this.marks = this.marks.filter(m => m.partId !== partId);
            element.classList.remove('marked');
        } else {
            // Add mark
            this.marks.push({
                partId,
                partName,
                x: element.getBBox ? element.getBBox().x : 0,
                y: element.getBBox ? element.getBBox().y : 0
            });
            element.classList.add('marked');
        }
        
        this.updateInput();
    }
    
    updateInput() {
        // Store marks as JSON in hidden input
        this.marksInput.value = JSON.stringify(this.marks);
    }
    
    clear() {
        this.marks = [];
        
        // Remove marking class from all elements
        if (this.svgElement) {
            this.svgElement.querySelectorAll('.marked').forEach(el => {
                el.classList.remove('marked');
            });
        }
        
        this.updateInput();
    }
    
    getMarks() {
        return this.marks;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    const muscleContainer = document.getElementById('muscleMapContainer');
    if (muscleContainer) {
        window.muscleMap = new SVGMuscleMap('muscleMapContainer', 'muscleMapMarks');
        
        // Clear button
        const clearBtn = document.getElementById('clearMuscleMap');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                window.muscleMap.clear();
            });
        }
    }
});

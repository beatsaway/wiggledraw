// Canvas setup and management
const A4_ASPECT_RATIO = 1.414; // 297mm / 210mm

class CanvasManager {
    constructor() {
        this.canvasContainer = document.querySelector('.canvas-container');
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.startPanX = 0;
        this.startPanY = 0;
        this.isPanning = false;
    }

    resizeCanvas() {
        // Use full viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Calculate dimensions based on A4 aspect ratio (1.414:1)
        let width, height;
        
        // First try to fit by height
        height = viewportHeight;
        width = height * A4_ASPECT_RATIO;
        
        // If width exceeds viewport width, scale down
        if (width > viewportWidth) {
            width = viewportWidth;
            height = width / A4_ASPECT_RATIO;
        }
        
        // Set container dimensions
        this.canvasContainer.style.width = `${width}px`;
        this.canvasContainer.style.height = `${height}px`;
        
        // Set canvas dimensions
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Redraw content if needed
        if (!window.animationManager.isWiggling && window.strokeHistory.length > 0) {
            for (const stroke of window.strokeHistory) {
                window.animationManager.replayStroke(stroke);
            }
        }
        // Draw grid overlay if needed
        if (window.selectedGridType) {
            this.drawGrid(window.selectedGridType);
        }
        this.updateCanvasTransform();
    }

    updateCanvasTransform() {
        // Apply CSS transform to canvas element for visual zoom
        this.canvas.style.transform = `scale(${this.scale}) translate3d(${this.offsetX}px, ${this.offsetY}px, 0)`;
        
        // Keep the transform matrix in context synchronized
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Redraw if not animating
        if (!window.animationManager.isWiggling && window.strokeHistory.length > 0) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            for (const stroke of window.strokeHistory) {
                window.animationManager.replayStroke(stroke);
            }
        }
        // Draw grid overlay if needed
        if (window.selectedGridType) {
            this.drawGrid(window.selectedGridType);
        }
    }

    getCanvasCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        
        // Convert screen coordinates to canvas coordinates
        const canvasX = screenX / this.scale;
        const canvasY = screenY / this.scale;
        
        return [canvasX, canvasY];
    }

    clearCanvas() {
        // First stop any ongoing animation and wait for it to complete
        if (window.animationManager.animationRequestId) {
            cancelAnimationFrame(window.animationManager.animationRequestId);
            window.animationManager.animationRequestId = null;
        }
        
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Reset animation state
        window.animationManager.isWiggling = false;
        window.animationManager.stopAnimation();
        
        // Clear stroke history
        window.strokeHistory = [];
        
        // Reset animation manager state
        window.animationManager.isTimelapsing = false;
        window.animationManager.currentStrokeIndex = 0;
        
        // Hide stop button
        document.getElementById('stopAnimationBtn').style.display = 'none';
    }

    replayStroke(stroke) {
        if (!window.animationManager.isWiggling && window.strokeHistory.length > 0) {
            window.animationManager.replayStroke(stroke);
        }
    }

    replayLastStroke() {
        if (!window.animationManager.isWiggling && window.strokeHistory.length > 0) {
            const lastStroke = window.strokeHistory[window.strokeHistory.length - 1];
            window.animationManager.replayStroke(lastStroke);
        }
    }

    drawIsometricGrid(ctx, x0, y0, w, h, spacing) {
        const tan60 = Math.tan(Math.PI / 3);
        const xStart = (-h * tan60) % spacing;
        const firstX = xStart < 0 ? xStart + spacing : xStart;
        const baseAlpha = window.gridOpacity || 0.25;
        // 1. 60° lines (down-right)
        let lineIndex = 0;
        for (let x = -h * tan60; x < w + h * tan60; x += spacing, lineIndex++) {
            ctx.save();
            ctx.globalAlpha = (lineIndex % 10 === 0) ? Math.min(baseAlpha + 0.25, 1) : baseAlpha;
            ctx.beginPath();
            ctx.moveTo(x0 + x, y0 + 0);
            ctx.lineTo(x0 + x + h * tan60, y0 + h);
            ctx.stroke();
            ctx.restore();
        }
        // 2. 120° lines (down-left, with offset)
        lineIndex = 0;
        for (let x = w + h * tan60; x > -h * tan60; x -= spacing, lineIndex++) {
            ctx.save();
            ctx.globalAlpha = (lineIndex % 10 === 0) ? Math.min(baseAlpha + 0.25, 1) : baseAlpha;
            ctx.beginPath();
            ctx.moveTo(x0 + x, y0 + 5);
            ctx.lineTo(x0 + x - h * tan60, y0 + h);
            ctx.stroke();
            ctx.restore();
        }
        // 3. Vertical lines (denser)
        lineIndex = 0;
        for (let x = firstX; x < w; x += spacing / 2, lineIndex++) {
            ctx.save();
            ctx.globalAlpha = baseAlpha;
            ctx.beginPath();
            ctx.moveTo(x0 + x - 6, y0 + 0);
            ctx.lineTo(x0 + x - 6, y0 + h);
            ctx.stroke();
            ctx.restore();
        }
    }

    drawObliqueGrid(ctx, x0, y0, w, h, spacing) {
        const angle = Math.PI / 4; // 45 degrees
        const tan45 = Math.tan(angle); // = 1
        const baseAlpha = window.gridOpacity || 0.25;
        // 1. 45° receding lines (down-left, denser, with offset)
        let lineIndex = 0;
        for (let x = w + h * tan45; x > -h * tan45; x -= spacing / 2, lineIndex++) {
            ctx.save();
            ctx.globalAlpha = baseAlpha;
            ctx.beginPath();
            ctx.moveTo(x0 + x, y0 -4);
            ctx.lineTo(x0 + x - h * tan45, y0 + h);
            ctx.stroke();
            ctx.restore();
        }
        // 2. Vertical lines (denser)
        lineIndex = 0;
        for (let x = 0; x < w; x += spacing / 2, lineIndex++) {
            ctx.save();
            ctx.globalAlpha = (lineIndex % 10 === 0) ? Math.min(baseAlpha + 0.25, 1) : baseAlpha;
            ctx.beginPath();
            ctx.moveTo(x0 + x, y0 + 0);
            ctx.lineTo(x0 + x, y0 + h);
            ctx.stroke();
            ctx.restore();
        }
        // 3. Horizontal lines (denser)
        lineIndex = 0;
        for (let y = 0; y < h; y += spacing / 2, lineIndex++) {
            ctx.save();
            ctx.globalAlpha = (lineIndex % 10 === 0) ? Math.min(baseAlpha + 0.25, 1) : baseAlpha;
            ctx.beginPath();
            ctx.moveTo(x0 + 0, y0 + y);
            ctx.lineTo(x0 + w, y0 + y);
            ctx.stroke();
            ctx.restore();
        }
    }

    drawGrid(type) {
        const ctx = this.ctx;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform for grid
        ctx.globalAlpha = window.gridOpacity || 0.25;
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1 / this.scale;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const spacing = window.gridSpacing || 20;
        if (type === 'isometric') {
            this.drawIsometricGrid(ctx, 0, 0, w, h, spacing);
        } else if (type === 'oblique') {
            this.drawObliqueGrid(ctx, 0, 0, w, h, spacing);
        } else if (type === 'obliso') {
            const midX = w / 2;
            // Left half: Oblique
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, midX, h);
            ctx.clip();
            this.drawObliqueGrid(ctx, 0, 0, w, h, spacing); // Draw over full canvas, only left half shows
            ctx.restore();
            // Right half: Isometric
            ctx.save();
            ctx.beginPath();
            ctx.rect(midX, 0, w - midX, h);
            ctx.clip();
            this.drawIsometricGrid(ctx, 0, 0, w, h, spacing); // Draw over full canvas, only right half shows
            ctx.restore();
        }
        ctx.restore();
    }

    redrawAll() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (window.strokeHistory.length > 0) {
            for (const stroke of window.strokeHistory) {
                window.animationManager.replayStroke(stroke);
            }
        }
        if (window.selectedGridType) {
            this.drawGrid(window.selectedGridType);
        }
    }
}

// Export the CanvasManager class
window.CanvasManager = CanvasManager; 

// Set default grid opacity
window.gridOpacity = 0.25;

// Set up grid opacity slider event listener (after DOM is loaded)
document.addEventListener('DOMContentLoaded', function() {
    var slider = document.getElementById('gridOpacitySlider');
    if (slider) {
        slider.value = window.gridOpacity;
        slider.addEventListener('input', function(e) {
            window.gridOpacity = parseFloat(e.target.value);
            if (window.canvasManager) {
                window.canvasManager.redrawAll();
            }
        });
    }
}); 
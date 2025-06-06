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

    drawGrid(type) {
        const ctx = this.ctx;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform for grid
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        
        const w = this.canvas.width;
        const h = this.canvas.height;
        const diagSpacing = 20; // spacing for diagonals
        const vertSpacing = diagSpacing; // verticals at every intersection
        const tan60 = Math.tan(Math.PI / 3);
        const xStart = (-h * tan60) % vertSpacing;
        const firstX = xStart < 0 ? xStart + vertSpacing : xStart;
        if (type === 'isometric') {
            // 1. 60° lines (down-right)
            for (let x = -h * tan60; x < w + h * tan60; x += diagSpacing) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x + h * tan60, h);
                ctx.stroke();
            }
            // 2. 120° lines (down-left)
            for (let x = w + h * tan60; x > -h * tan60; x -= diagSpacing) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x - h * tan60, h);
                ctx.stroke();
            }
            // 3. Vertical lines (uniformly denser)
            for (let x = firstX; x < w; x += vertSpacing / 2) {
                ctx.beginPath();
                ctx.moveTo(x - 6, 0);
                ctx.lineTo(x - 6, h);
                ctx.stroke();
            }
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
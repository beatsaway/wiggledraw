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
        
        // Reset drawing history
        this.drawingManager.clearDrawingHistory();
        
        // Reset animation manager state
        window.animationManager.isTimelapsing = false;
        window.animationManager.currentStrokeIndex = 0;
        
        // Hide stop button
        document.getElementById('toggleAnimationBtn').style.display = 'none';
        
        // Hide timelapse button
        document.getElementById('timelapseBtn').style.display = 'none';
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
}

// Export the CanvasManager class
window.CanvasManager = CanvasManager; 
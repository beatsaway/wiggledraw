// Drawing functionality
class DrawingManager {
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.currentColor = '#000000';
        this.baseSize = 5;
        this.drawingHistory = [];
        this.currentHistoryIndex = -1;
        this.HISTORY_LIMIT = 50;
    }

    startDrawing(e) {
        this.isDrawing = true;
        
        // Get coordinates in canvas space
        const [canvasX, canvasY] = this.canvasManager.getCanvasCoordinates(e);
        this.lastX = canvasX;
        this.lastY = canvasY;
        
        // Start recording a new stroke
        window.strokeHistory.push({
            points: [],
            color: this.currentColor,
            size: this.baseSize,
            baseSize: this.baseSize,
            originalPoints: []
        });
        
        this.recordPoint(e);
        // Don't save canvas state here anymore
    }

    draw(e) {
        if (!this.isDrawing) return;
        this.recordPoint(e);
        this.drawWithPressure(e);
    }

    recordPoint(e) {
        const [canvasX, canvasY] = this.canvasManager.getCanvasCoordinates(e);
        const pressure = e.pressure || 0.5;
        
        if (window.strokeHistory.length > 0) {
            const currentStroke = window.strokeHistory[window.strokeHistory.length - 1];
            currentStroke.points.push({
                x: canvasX, y: canvasY, pressure
            });
            currentStroke.originalPoints = currentStroke.points.map(p => ({...p}));
        }
        
        document.getElementById('pressureValue').textContent = pressure.toFixed(2);
    }

    drawWithPressure(e) {
        const [canvasX, canvasY] = this.canvasManager.getCanvasCoordinates(e);
        const pressure = e.pressure || 0.5;
        const dynamicSize = this.baseSize * (pressure * 2);
        const opacity = Math.min(1, pressure * 1.5);
        
        const ctx = this.canvasManager.ctx;
        ctx.beginPath();
        ctx.moveTo(this.lastX, this.lastY);
        ctx.lineTo(canvasX, canvasY);
        
        const rgbaColor = this.hexToRgba(this.currentColor, opacity);
        ctx.strokeStyle = rgbaColor;
        
        ctx.lineWidth = dynamicSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        
        // Update the current stroke's size
        if (window.strokeHistory.length > 0) {
            const currentStroke = window.strokeHistory[window.strokeHistory.length - 1];
            currentStroke.size = dynamicSize;
        }
        
        this.lastX = canvasX;
        this.lastY = canvasY;
    }

    endDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            // Only save canvas state when we finish drawing
            this.saveCanvasState();
            
            // Show/hide timelapse button based on stroke count
            const timelapseBtn = document.getElementById('timelapseBtn');
            timelapseBtn.style.display = window.strokeHistory.length > 1 ? 'inline-block' : 'none';
            
            // If this is the first stroke, automatically start wiggling
            if (window.strokeHistory.length === 1 && !window.animationManager.isWiggling && !window.animationManager.isTimelapsing) {
                window.animationManager.startAnimation();
            }
        }
    }

    saveCanvasState() {
        if (this.currentHistoryIndex < this.drawingHistory.length - 1) {
            this.drawingHistory = this.drawingHistory.slice(0, this.currentHistoryIndex + 1);
        }
        
        const ctx = this.canvasManager.ctx;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const imageData = ctx.getImageData(0, 0, this.canvasManager.canvas.width, this.canvasManager.canvas.height);
        ctx.restore();
        
        this.drawingHistory.push(imageData);
        
        if (this.drawingHistory.length > this.HISTORY_LIMIT) {
            this.drawingHistory.shift();
        } else {
            this.currentHistoryIndex = this.drawingHistory.length - 1;
        }
    }

    undo() {
        if (this.currentHistoryIndex < 0) return;
        
        this.currentHistoryIndex--;
        const imageData = this.drawingHistory[this.currentHistoryIndex];
        
        const ctx = this.canvasManager.ctx;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.putImageData(imageData, 0, 0);
        ctx.restore();
        
        if (window.strokeHistory.length > 0) {
            window.strokeHistory.pop();
        }
    }

    clearDrawingHistory() {
        this.drawingHistory = [];
        this.currentHistoryIndex = -1;
    }

    hexToRgba(hex, alpha) {
        hex = hex.replace(/^#/, '');
        
        let r, g, b;
        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else {
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        }
        
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}

// Export the DrawingManager class
window.DrawingManager = DrawingManager; 
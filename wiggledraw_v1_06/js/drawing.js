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
        this.rulerMode = false;
        this.rulerStartPoint = null;
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
            baseSize: this.baseSize,
            originalPoints: []
        });

        if (this.rulerMode) {
            this.rulerStartPoint = { x: canvasX, y: canvasY };
            // Add the start point
            this.recordPoint(e);
        } else {
            this.recordPoint(e);
        }
    }

    draw(e) {
        if (!this.isDrawing) return;
        
        if (this.rulerMode) {
            const [canvasX, canvasY] = this.canvasManager.getCanvasCoordinates(e);
            const pressure = e.pressure || 0.5;
            
            // Get the current stroke
            const currentStroke = window.strokeHistory[window.strokeHistory.length - 1];
            if (!currentStroke) return;
            
            // Calculate line length
            const dx = canvasX - this.rulerStartPoint.x;
            const dy = canvasY - this.rulerStartPoint.y;
            const lineLength = Math.sqrt(dx * dx + dy * dy);
            
            // Number of points based on line length (1 point per 10 pixels)
            const numPoints = Math.max(2, Math.ceil(lineLength / 10));
            
            // Generate interpolated points
            const points = [];
            for (let i = 0; i < numPoints; i++) {
                const t = i / (numPoints - 1); // t goes from 0 to 1
                points.push({
                    x: this.rulerStartPoint.x + dx * t,
                    y: this.rulerStartPoint.y + dy * t,
                    pressure: pressure
                });
            }
            
            // Update the stroke with interpolated points
            currentStroke.points = points;
            currentStroke.originalPoints = points.map(p => ({...p}));
            
            // Only redraw the current stroke
            const ctx = this.canvasManager.ctx;
            ctx.save();
            
            // Clear only the area of the current stroke
            const strokeBounds = this.getStrokeBounds(currentStroke);
            ctx.clearRect(strokeBounds.x - 5, strokeBounds.y - 5, 
                        strokeBounds.width + 10, strokeBounds.height + 10);
            
            // Redraw all strokes up to the current one
            for (let i = 0; i < window.strokeHistory.length - 1; i++) {
                this.drawStroke(window.strokeHistory[i]);
            }
            
            // Draw the current stroke
            this.drawStroke(currentStroke);
            
            ctx.restore();
        } else {
            this.recordPoint(e);
            this.drawWithPressure(e);
        }
    }

    drawRulerPreview(endX, endY) {
        const ctx = this.canvasManager.ctx;
        ctx.save();
        
        // Clear the previous preview
        this.canvasManager.clearCanvas();
        this.canvasManager.redrawStrokes();
        
        // Draw the preview line
        ctx.beginPath();
        ctx.moveTo(this.rulerStartPoint.x, this.rulerStartPoint.y);
        ctx.lineTo(endX, endY);
        
        ctx.strokeStyle = this.hexToRgba(this.currentColor, 0.5);
        ctx.lineWidth = this.baseSize;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        ctx.restore();
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
        
        this.lastX = canvasX;
        this.lastY = canvasY;
    }

    endDrawing(e) {
        if (!this.isDrawing) return;
        
        if (this.rulerMode) {
            // The stroke is already complete with just the start and end points
            this.isDrawing = false;
            this.rulerStartPoint = null;
            this.saveCanvasState();
            
            // If this is the first stroke, automatically start wiggling
            if (window.strokeHistory.length === 1 && !window.animationManager.isWiggling && !window.animationManager.isTimelapsing) {
                window.animationManager.startAnimation();
            }
        } else {
            this.isDrawing = false;
            this.saveCanvasState();
            
            // If this is the first stroke, automatically start wiggling
            if (window.strokeHistory.length === 1 && !window.animationManager.isWiggling && !window.animationManager.isTimelapsing) {
                window.animationManager.startAnimation();
            }
        }
        window.canvasManager.redrawAll();
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
        window.canvasManager.redrawAll();
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

    getStrokeBounds(stroke) {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        for (const point of stroke.points) {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        }
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    drawStroke(stroke) {
        const ctx = this.canvasManager.ctx;
        if (stroke.points.length < 2) return;
        
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        
        for (let i = 1; i < stroke.points.length; i++) {
            const point = stroke.points[i];
            ctx.lineTo(point.x, point.y);
        }
        
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.baseSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    }
}

// Export the DrawingManager class
window.DrawingManager = DrawingManager; 
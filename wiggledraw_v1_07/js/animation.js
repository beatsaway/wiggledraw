// Animation functionality
class AnimationManager {
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
        this.isWiggling = false;
        this.isTimelapsing = false;
        this.animationRequestId = null;
        this.frameDuration = 125;
        this.wiggleAmount = 1;
        this.lastAnimationTime = 0;
        this.currentStrokeIndex = 0;
        this.isLooping = false;
    }

    toggleAnimation() {
        if (this.isWiggling) {
            this.stopAnimation();
        } else {
            this.startAnimation();
        }
    }

    startAnimation() {
        if (window.strokeHistory.length === 0) return;
        
        this.isWiggling = true;
        document.getElementById('wiggleBtn').style.display = 'none';
        document.getElementById('stopAnimationBtn').style.display = 'inline-block';
        document.getElementById('stopAnimationBtn').textContent = "Wiggling...";
        
        this.lastAnimationTime = performance.now();
        this.animationRequestId = requestAnimationFrame(this.animateWiggle.bind(this));
    }

    animateWiggle(timestamp) {
        if (!this.isWiggling && !this.isTimelapsing) return;
        
        if (timestamp - this.lastAnimationTime < this.frameDuration) {
            this.animationRequestId = requestAnimationFrame(this.animateWiggle.bind(this));
            return;
        }
        this.lastAnimationTime = timestamp;
        
        const ctx = this.canvasManager.ctx;
        ctx.clearRect(0, 0, this.canvasManager.canvas.width, this.canvasManager.canvas.height);
        
        // If timelapse is active, only show strokes up to currentStrokeIndex
        if (this.isTimelapsing) {
            // Only show strokes up to currentStrokeIndex
            for (let i = 0; i <= this.currentStrokeIndex; i++) {
                const stroke = window.strokeHistory[i];
                // Only apply wiggle effect if wiggling is enabled
                if (this.isWiggling) {
                    this.applyWiggleEffect(stroke);
                }
                this.replayStroke(stroke);
            }
            // Only auto-advance frame if not in manual mode
            const manualMode = document.getElementById('manualTimelapseCheckbox').checked;
            if (!manualMode) {
                // Move to next stroke
                this.currentStrokeIndex++;
                // Check if we've reached the end
                if (this.currentStrokeIndex >= window.strokeHistory.length) {
                    if (this.isLooping) {
                        // If looping is enabled, reset to the beginning
                        this.currentStrokeIndex = 0;
                    } else {
                        // If not looping, stop at the last stroke
                        this.currentStrokeIndex = window.strokeHistory.length - 1;
                        this.isTimelapsing = false; // Turn off timelapse mode
                        document.getElementById('timelapseBtn').textContent = "Timelapse";
                        document.getElementById('loopCheckbox').disabled = false;
                    }
                }
            }
        } else {
            // Normal wiggle animation - show all strokes
            for (const stroke of window.strokeHistory) {
                this.applyWiggleEffect(stroke);
                this.replayStroke(stroke);
            }
        }
        // Draw grid overlay if needed
        if (window.selectedGridType) {
            this.canvasManager.drawGrid(window.selectedGridType);
        }
        this.animationRequestId = requestAnimationFrame(this.animateWiggle.bind(this));
    }

    applyWiggleEffect(stroke) {
        if (this.wiggleAmount > 0 && stroke.originalPoints) {
            for (let i = 0; i < stroke.points.length; i++) {
                stroke.points[i].x = stroke.originalPoints[i].x + (Math.random() * 2 - 1) * this.wiggleAmount;
                stroke.points[i].y = stroke.originalPoints[i].y + (Math.random() * 2 - 1) * this.wiggleAmount;
            }
        }
    }

    replayStroke(stroke) {
        if (stroke.points.length < 2) return;
        
        const ctx = this.canvasManager.ctx;
        for (let i = 1; i < stroke.points.length; i++) {
            const prevPoint = stroke.points[i-1];
            const point = stroke.points[i];
            const dynamicSize = stroke.baseSize * (point.pressure * 2);
            const opacity = Math.min(1, point.pressure * 1.5);
            
            const rgbaColor = this.hexToRgba(stroke.color, opacity);
            
            ctx.beginPath();
            ctx.moveTo(prevPoint.x, prevPoint.y);
            ctx.lineTo(point.x, point.y);
            ctx.strokeStyle = rgbaColor;
            ctx.lineWidth = dynamicSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
        }
    }

    stopAnimation() {
        this.isWiggling = false;
        this.isTimelapsing = false;
        if (this.animationRequestId) {
            cancelAnimationFrame(this.animationRequestId);
            this.animationRequestId = null;
        }
        
        document.getElementById('wiggleBtn').style.display = 'inline-block';
        document.getElementById('stopAnimationBtn').style.display = 'none';
        document.getElementById('timelapseBtn').textContent = "Timelapse";
        
        if (window.strokeHistory.length > 0) {
            const ctx = this.canvasManager.ctx;
            ctx.clearRect(0, 0, this.canvasManager.canvas.width, this.canvasManager.canvas.height);
            
            for (const stroke of window.strokeHistory) {
                if (stroke.originalPoints) {
                    for (let i = 0; i < stroke.points.length; i++) {
                        stroke.points[i].x = stroke.originalPoints[i].x;
                        stroke.points[i].y = stroke.originalPoints[i].y;
                    }
                }
                this.replayStroke(stroke);
            }
        }
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

    startTimelapse() {
        if (window.strokeHistory.length === 0) return;
        if (window.strokeHistory.length === 1) return;

        const manualMode = document.getElementById('manualTimelapseCheckbox').checked;
        const loopCheckbox = document.getElementById('loopCheckbox');
        if (manualMode) {
            loopCheckbox.checked = false;
            loopCheckbox.disabled = true;
        } else {
            loopCheckbox.disabled = false;
        }
        if (this.isTimelapsing) {
            this.isTimelapsing = false;
            document.getElementById('timelapseBtn').textContent = "Timelapse";
            // Only enable loop if manual is off
            if (!document.getElementById('manualTimelapseCheckbox').checked) {
                loopCheckbox.disabled = false;
            }
            document.removeEventListener('keydown', this._manualTimelapseHandler);
        } else {
            this.isTimelapsing = true;
            this.currentStrokeIndex = 0;
            this.isLooping = loopCheckbox.checked;
            document.getElementById('timelapseBtn').textContent = manualMode ? "Manual..." : "Timelapsing...";
            if (manualMode) {
                this._manualTimelapseHandler = (e) => {
                    if (!this.isTimelapsing) return;
                    if (e.key === 'ArrowRight') {
                        if (this.currentStrokeIndex < window.strokeHistory.length - 1) {
                            this.currentStrokeIndex++;
                            this._drawManualTimelapse();
                        }
                        // If at last stroke, do nothing (stay in manual mode)
                    } else if (e.key === 'ArrowLeft') {
                        if (this.currentStrokeIndex > 0) {
                            this.currentStrokeIndex--;
                            this._drawManualTimelapse();
                        }
                    }
                };
                document.addEventListener('keydown', this._manualTimelapseHandler);
                this._drawManualTimelapse();
            } else {
                this.lastAnimationTime = performance.now();
                this.animationRequestId = requestAnimationFrame(this.animateWiggle.bind(this));
            }
        }
    }

    _drawManualTimelapse() {
        const ctx = this.canvasManager.ctx;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.canvasManager.canvas.width, this.canvasManager.canvas.height);
        ctx.restore();
        for (let i = 0; i <= this.currentStrokeIndex; i++) {
            const stroke = window.strokeHistory[i];
            this.replayStroke(stroke);
        }
        if (window.selectedGridType) {
            this.canvasManager.drawGrid(window.selectedGridType);
        }
    }
}

// Export the AnimationManager class
window.AnimationManager = AnimationManager; 
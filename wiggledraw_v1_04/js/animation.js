// Animation functionality
class AnimationManager {
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
        this.isWiggling = false;
        this.isTimelapsing = false;
        this.animationRequestId = null;
        this.fps = 8; // Default FPS value
        this.wiggleAmount = 1;
        this.wiggleColor = '#000000'; // Default wiggle color
        this.wiggleColor2 = '#000000';
        this.wiggleAmount2 = 1;
        this.lastAnimationTime = 0;
        this.currentStrokeIndex = 0;
        this.lastFrameTime = 0;
        this.frameInterval = 1000 / this.fps;
        this.baseWiggleAmount = 0;
        
        // Initialize wiggle effects
        this.wiggleEffects = [
            new WiggleEffect('#000000', 1, 100),  // First wiggle effect (faster)
            new WiggleEffect('#888888', 11, 200),  // Second wiggle effect (medium)
            new WiggleEffect('#CCCCCC', 0, 300)   // Third wiggle effect (slower)
        ];
    }

    get frameDuration() {
        return 1000 / this.fps; // Convert FPS to milliseconds
    }

    set frameDuration(value) {
        this.fps = value;
    }

    set wiggleAmount(value) {
        this._wiggleAmount = value;
        // Start animation if wiggle amount is greater than 0 and not already animating
        if (value > 0 && !this.isWiggling) {
            this.startAnimation();
        }
        // Stop animation if wiggle amount is 0
        else if (value === 0 && this.isWiggling) {
            this.stopAnimation();
        }
    }

    get wiggleAmount() {
        return this._wiggleAmount;
    }

    startAnimation() {
        if (window.strokeHistory.length === 0) return;
        
        this.isWiggling = true;
        document.getElementById('toggleAnimationBtn').style.display = 'inline-block';
        document.getElementById('toggleAnimationBtn').textContent = "Wiggling...";
        
        this.lastAnimationTime = performance.now();
        this.animationRequestId = requestAnimationFrame(this.animateWiggle.bind(this));
    }

    animateWiggle(timestamp) {
        if (!this.isWiggling) return;
        
        // Convert FPS to milliseconds for timing
        const frameDurationMs = 1000 / this.fps;
        
        if (timestamp - this.lastAnimationTime < frameDurationMs) {
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
                this.applyWiggleEffect(stroke);
            }
            
            // Move to next stroke
            this.currentStrokeIndex++;
            
            // Check if we've reached the end
            if (this.currentStrokeIndex >= window.strokeHistory.length) {
                this.currentStrokeIndex = window.strokeHistory.length - 1; // Stay at the last stroke
                this.isTimelapsing = false; // Turn off timelapse mode
                document.getElementById('timelapseBtn').textContent = "Timelapse";
                document.getElementById('toggleAnimationBtn').style.display = 'inline-block';
                document.getElementById('toggleAnimationBtn').textContent = "Wiggle";
                this.stopAnimation(); // Stop the animation when timelapse finishes
            }
        } else {
            // Normal wiggle animation - show all strokes
            for (const stroke of window.strokeHistory) {
                this.applyWiggleEffect(stroke);
            }
        }
        
        this.animationRequestId = requestAnimationFrame(this.animateWiggle.bind(this));
    }

    applyWiggleEffect(stroke) {
        if (!stroke || !stroke.points || stroke.points.length === 0) return;
        
        const ctx = this.canvasManager.ctx;
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        
        // Set the stroke style and size before drawing
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size || stroke.baseSize; // Use size if available, fallback to baseSize
        
        for (let i = 1; i < stroke.points.length; i++) {
            const point = stroke.points[i];
            let wiggleX = 0;
            let wiggleY = 0;
            
            // Apply all matching wiggle effects
            this.wiggleEffects.forEach(effect => {
                if (effect.matchesColor(stroke.color)) {
                    const wiggle = effect.applyToPoint(point, i, this.baseWiggleAmount);
                    wiggleX += wiggle.x;
                    wiggleY += wiggle.y;
                }
            });
            
            const x = point.x + wiggleX;
            const y = point.y + wiggleY;
            
            ctx.lineTo(x, y);
        }
        
        ctx.stroke();
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
        
        document.getElementById('toggleAnimationBtn').textContent = "Wiggle";
        
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
        
        // Don't allow timelapse if there's only 1 stroke
        if (window.strokeHistory.length === 1) return;
        
        // If not already animating, start animation
        if (!this.isWiggling) {
            this.isWiggling = true;
            document.getElementById('toggleAnimationBtn').style.display = 'inline-block';
            document.getElementById('toggleAnimationBtn').textContent = "Wiggling...";
            
            this.lastAnimationTime = performance.now();
            this.animationRequestId = requestAnimationFrame(this.animateWiggle.bind(this));
        }
        
        // Toggle timelapse mode
        if (this.isTimelapsing) {
            // If already timelapsing, show all strokes
            this.isTimelapsing = false;
            document.getElementById('toggleAnimationBtn').style.display = 'inline-block';
        } else {
            // Start timelapse
            this.isTimelapsing = true;
            this.currentStrokeIndex = 0;
            document.getElementById('toggleAnimationBtn').style.display = 'none';
        }
    }
}

// Export the AnimationManager class
window.AnimationManager = AnimationManager; 
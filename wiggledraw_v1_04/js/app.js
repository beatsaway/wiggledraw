// Main application initialization and event handling
class App {
    constructor() {
        // Initialize state
        window.strokeHistory = [];
        
        // Initialize managers
        this.canvasManager = new CanvasManager();
        this.drawingManager = new DrawingManager(this.canvasManager);
        this.animationManager = new AnimationManager(this.canvasManager);
        this.zoomManager = new ZoomManager(this.canvasManager);
        this.fileManager = new FileManager(this.canvasManager);

        // Make managers available globally
        window.canvasManager = this.canvasManager;
        window.drawingManager = this.drawingManager;
        window.animationManager = this.animationManager;
        window.zoomManager = this.zoomManager;
        window.fileManager = this.fileManager;

        // Initialize animation state
        window.animationManager.isWiggling = false;
        window.currentMode = 'draw';

        // Set up event listeners
        this.setupEventListeners();
        this.setupUIControls();

        // Initialize canvas
        this.canvasManager.resizeCanvas();
        window.addEventListener('resize', () => this.canvasManager.resizeCanvas());
        
        // Save initial empty canvas state
        this.drawingManager.saveCanvasState();

        // Animation Controls
        this.animationManager.wiggleEffects[0].color = document.getElementById('wiggleColor').value;
        this.animationManager.wiggleEffects[0].amount = parseInt(document.getElementById('wiggleAmount').value);
        this.animationManager.wiggleEffects[1].color = document.getElementById('wiggleColor2').value;
        this.animationManager.wiggleEffects[1].amount = parseInt(document.getElementById('wiggleAmount2').value);
        this.animationManager.wiggleEffects[2].color = document.getElementById('wiggleColor3').value;
        this.animationManager.wiggleEffects[2].amount = parseInt(document.getElementById('wiggleAmount3').value);
        this.animationManager.fps = parseInt(document.getElementById('fps').value);
        this.animationManager.baseWiggleAmount = parseInt(document.getElementById('wiggleBase').value);

        // Add event listener for base wiggle amount
        document.getElementById('wiggleBase').addEventListener('input', (e) => {
            this.animationManager.baseWiggleAmount = parseInt(e.target.value);
        });

        document.getElementById('wiggleColor').addEventListener('input', (e) => {
            this.animationManager.wiggleEffects[0].color = e.target.value;
            this.drawingManager.currentColor = e.target.value;
            document.getElementById('colorPicker').value = e.target.value;
        });

        document.getElementById('wiggleAmount').addEventListener('input', (e) => {
            this.animationManager.wiggleEffects[0].amount = parseInt(e.target.value);
        });

        // Add click handler for first wiggle amount label
        document.querySelector('label[for="wiggleAmount"]').addEventListener('click', () => {
            const color = document.getElementById('wiggleColor').value;
            this.drawingManager.currentColor = color;
            document.getElementById('colorPicker').value = color;
            // Add pulse animation
            const colorPicker = document.getElementById('colorPicker');
            colorPicker.classList.add('color-picker-pulse');
            setTimeout(() => colorPicker.classList.remove('color-picker-pulse'), 500);
        });

        document.getElementById('wiggleColor2').addEventListener('input', (e) => {
            this.animationManager.wiggleEffects[1].color = e.target.value;
            this.drawingManager.currentColor = e.target.value;
            document.getElementById('colorPicker').value = e.target.value;
        });

        document.getElementById('wiggleAmount2').addEventListener('input', (e) => {
            this.animationManager.wiggleEffects[1].amount = parseInt(e.target.value);
        });

        // Add click handler for second wiggle amount label
        document.querySelector('label[for="wiggleAmount2"]').addEventListener('click', () => {
            const color = document.getElementById('wiggleColor2').value;
            this.drawingManager.currentColor = color;
            document.getElementById('colorPicker').value = color;
            // Add pulse animation
            const colorPicker = document.getElementById('colorPicker');
            colorPicker.classList.add('color-picker-pulse');
            setTimeout(() => colorPicker.classList.remove('color-picker-pulse'), 500);
        });

        document.getElementById('wiggleColor3').addEventListener('input', (e) => {
            this.animationManager.wiggleEffects[2].color = e.target.value;
            this.drawingManager.currentColor = e.target.value;
            document.getElementById('colorPicker').value = e.target.value;
        });

        document.getElementById('wiggleAmount3').addEventListener('input', (e) => {
            this.animationManager.wiggleEffects[2].amount = parseInt(e.target.value);
        });

        // Add click handler for third wiggle amount label
        document.querySelector('label[for="wiggleAmount3"]').addEventListener('click', () => {
            const color = document.getElementById('wiggleColor3').value;
            this.drawingManager.currentColor = color;
            document.getElementById('colorPicker').value = color;
            // Add pulse animation
            const colorPicker = document.getElementById('colorPicker');
            colorPicker.classList.add('color-picker-pulse');
            setTimeout(() => colorPicker.classList.remove('color-picker-pulse'), 500);
        });
        
        // Zoom controls
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomManager.changeZoom(0.1));
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomManager.changeZoom(-0.1));
        document.getElementById('resetZoomBtn').addEventListener('click', () => this.zoomManager.resetZoom());

        // Add tooltips for all buttons
        document.getElementById('resetZoomBtn').title = "0";
        document.getElementById('undoBtn').title = "Ctrl+Z";
        document.getElementById('saveBtn').title = "Ctrl+S";
        document.getElementById('loadBtn').title = "Ctrl+L";
    }

    setupEventListeners() {
        const canvas = this.canvasManager.canvas;

        // Drawing & Zooming events
        canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
        canvas.addEventListener('pointermove', this.handlePointerMove.bind(this));
        canvas.addEventListener('pointerup', this.handlePointerUp.bind(this));
        canvas.addEventListener('pointerout', this.handlePointerUp.bind(this));
        
        // Zoom with mouse wheel
        canvas.addEventListener('wheel', this.handleWheel.bind(this));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    setupUIControls() {
        // Mode switching
        document.getElementById('drawModeBtn').addEventListener('click', () => this.setMode('draw'));
        document.getElementById('zoomModeBtn').addEventListener('click', () => this.setMode('zoom'));
        
        // Drawing controls
        document.getElementById('colorPicker').addEventListener('input', (e) => {
            this.drawingManager.currentColor = e.target.value;
        });
        
        document.getElementById('sizeRange').addEventListener('input', (e) => {
            this.drawingManager.baseSize = parseInt(e.target.value);
            document.getElementById('sizeValue').textContent = `${this.drawingManager.baseSize}px`;
        });
        
        document.getElementById('undoBtn').addEventListener('click', () => this.drawingManager.undo());
        document.getElementById('saveBtn').addEventListener('click', () => this.fileManager.saveCanvas());
        document.getElementById('loadBtn').addEventListener('click', () => document.getElementById('fileInput').click());
        document.getElementById('fileInput').addEventListener('change', (e) => this.fileManager.loadCanvas(e));
        
        // Animation controls
        document.getElementById('toggleAnimationBtn').addEventListener('click', () => {
            const btn = document.getElementById('toggleAnimationBtn');
            if (btn.textContent === "Wiggle") {
                // Start animation if there are strokes and no animation is running
                if (window.strokeHistory.length > 0 && !window.animationManager.isWiggling && !window.animationManager.isTimelapsing) {
                    window.animationManager.startAnimation();
                }
            } else {
                window.animationManager.stopAnimation();
            }
        });
        document.getElementById('timelapseBtn').addEventListener('click', () => window.animationManager.startTimelapse());
        document.getElementById('fps').addEventListener('input', (e) => {
            // Clamp value between 1 and 60 FPS
            const value = Math.min(60, Math.max(1, parseInt(e.target.value) || 8));
            // Update input value to show clamped result
            e.target.value = value;
            this.animationManager.fps = value;
        });
        
        // Zoom controls
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomManager.changeZoom(0.1));
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomManager.changeZoom(-0.1));
        document.getElementById('resetZoomBtn').addEventListener('click', () => this.zoomManager.resetZoom());

        // Add tooltips for all buttons
        document.getElementById('resetZoomBtn').title = "0";
        document.getElementById('undoBtn').title = "Ctrl+Z";
        document.getElementById('saveBtn').title = "Ctrl+S";
        document.getElementById('loadBtn').title = "Ctrl+L";
    }

    setMode(mode) {
        window.currentMode = mode;
        document.getElementById('drawModeBtn').classList.toggle('active', mode === 'draw');
        document.getElementById('zoomModeBtn').classList.toggle('active', mode === 'zoom');
        
        this.canvasManager.canvas.style.cursor = mode === 'draw' ? 'crosshair' : 'grab';
    }

    handlePointerDown(e) {
        if (window.currentMode === 'timelapse') return;
        if (window.currentMode === 'draw') {
            this.drawingManager.startDrawing(e);
        } else if (window.currentMode === 'zoom') {
            this.zoomManager.startPanning(e);
        }
    }

    handlePointerMove(e) {
        if (window.currentMode === 'timelapse') return;
        if (window.currentMode === 'draw' && this.drawingManager.isDrawing) {
            this.drawingManager.draw(e);
        } else if (window.currentMode === 'zoom' && this.canvasManager.isPanning) {
            this.zoomManager.updatePanning(e);
        }
    }

    handlePointerUp(e) {
        if (window.currentMode === 'draw') {
            this.drawingManager.endDrawing();
        } else if (window.currentMode === 'zoom') {
            this.zoomManager.endPanning();
        }
    }

    handleWheel(e) {
        if (window.currentMode === 'timelapse') return;
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        
        const rect = this.canvasManager.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        this.zoomManager.zoomAtPoint(mouseX, mouseY, delta);
    }

    handleKeyDown(e) {
        // Ignore keyboard shortcuts when typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        // Mode switching with D key
        if (e.key.toLowerCase() === 'd') {
            // Toggle between draw and zoom modes
            this.setMode(window.currentMode === 'draw' ? 'zoom' : 'draw');
        }
        
        // Zoom controls
        if (e.key === '+' || e.key === '=') {
            this.zoomManager.changeZoom(0.1);
        } else if (e.key === '-') {
            this.zoomManager.changeZoom(-0.1);
        } else if (e.key === '0') {
            this.zoomManager.resetZoom();
        }
        
        // Action shortcuts
        if (e.ctrlKey) {
            if (e.key.toLowerCase() === 'z') {
                e.preventDefault();
                this.drawingManager.undo();
            } else if (e.key.toLowerCase() === 's') {
                e.preventDefault();
                this.fileManager.saveCanvas();
            } else if (e.key.toLowerCase() === 'l') {
                e.preventDefault();
                document.getElementById('fileInput').click();
            }
        }
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
}); 
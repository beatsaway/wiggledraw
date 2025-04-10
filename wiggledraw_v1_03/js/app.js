// Main application initialization and event handling
class App {
    constructor() {
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

        // Initialize state
        window.strokeHistory = [];
        window.isAnimating = false;
        window.currentMode = 'draw';

        // Set up event listeners
        this.setupEventListeners();
        this.setupUIControls();

        // Initialize canvas
        this.canvasManager.resizeCanvas();
        window.addEventListener('resize', () => this.canvasManager.resizeCanvas());
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
        
        document.getElementById('clearBtn').addEventListener('click', () => {
            if (window.strokeHistory.length > 0) {
                if (confirm('Warning: This will clear all strokes from the canvas. This action cannot be undone. Are you sure you want to proceed?')) {
                    this.canvasManager.clearCanvas();
                }
            } else {
                this.canvasManager.clearCanvas();
            }
        });
        
        document.getElementById('undoBtn').addEventListener('click', () => this.drawingManager.undo());
        document.getElementById('saveBtn').addEventListener('click', () => this.fileManager.saveCanvas());
        document.getElementById('loadBtn').addEventListener('click', () => document.getElementById('fileInput').click());
        document.getElementById('fileInput').addEventListener('change', (e) => this.fileManager.loadCanvas(e));
        
        // Animation controls
        document.getElementById('animateBtn').addEventListener('click', () => window.animationManager.toggleAnimation());
        document.getElementById('stopAnimationBtn').addEventListener('click', () => window.animationManager.stopAnimation());
        document.getElementById('timelapseBtn').addEventListener('click', () => window.animationManager.startTimelapse());
        document.getElementById('frameDuration').addEventListener('input', (e) => {
            // Clamp value between 1 and 2048
            const value = Math.min(2048, Math.max(1, parseInt(e.target.value) || 16));
            // Update input value to show clamped result
            e.target.value = value;
            this.animationManager.frameDuration = value;
        });
        document.getElementById('wiggleAmount').addEventListener('input', (e) => {
            // Clamp value between 0 and 30
            const value = Math.min(30, Math.max(0, parseInt(e.target.value) || 1));
            // Update input value to show clamped result
            e.target.value = value;
            this.animationManager.wiggleAmount = value;
        });
        
        // Zoom controls
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomManager.changeZoom(0.1));
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomManager.changeZoom(-0.1));
        document.getElementById('resetZoomBtn').addEventListener('click', () => this.zoomManager.resetZoom());

        // Add tooltips for all buttons
        document.getElementById('resetZoomBtn').title = "0";
        document.getElementById('clearBtn').title = "Backspace";
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
        
        // Clear canvas with backspace
        if (e.key === 'Backspace') {
            e.preventDefault();
            if (window.strokeHistory.length > 0) {
                if (confirm('Warning: This will clear all strokes from the canvas. This action cannot be undone. Are you sure you want to proceed?')) {
                    this.canvasManager.clearCanvas();
                }
            } else {
                this.canvasManager.clearCanvas();
            }
        }
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
}); 
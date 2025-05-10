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
        // Panel toggle for mobile
        document.getElementById('panelToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('active');
        });
        
        // Mode switching
        document.getElementById('drawModeBtn').addEventListener('click', () => this.setMode('draw'));
        document.getElementById('zoomModeBtn').addEventListener('click', () => this.setMode('zoom'));
        
        // Ruler mode
        document.getElementById('rulerModeBtn').addEventListener('click', () => {
            this.drawingManager.rulerMode = !this.drawingManager.rulerMode;
            document.getElementById('rulerModeBtn').classList.toggle('active', this.drawingManager.rulerMode);
        });
        
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
        document.getElementById('wiggleBtn').addEventListener('click', () => window.animationManager.toggleAnimation());
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
        
        // Manual timelapse disables loop checkbox
        const manualTimelapseCheckbox = document.getElementById('manualTimelapseCheckbox');
        const loopCheckbox = document.getElementById('loopCheckbox');
        manualTimelapseCheckbox.addEventListener('change', () => {
            if (manualTimelapseCheckbox.checked) {
                loopCheckbox.checked = false;
                loopCheckbox.disabled = true;
            } else {
                loopCheckbox.disabled = false;
            }
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

        // Grid dropdown
        const gridTypeSelect = document.getElementById('gridType');
        window.selectedGridType = gridTypeSelect.value;
        gridTypeSelect.addEventListener('change', (e) => {
            window.selectedGridType = e.target.value;
            window.canvasManager.redrawAll();
        });
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
            this.drawingManager.endDrawing(e);
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
        
        // Ruler mode with R key
        if (e.key.toLowerCase() === 'r') {
            const rulerBtn = document.getElementById('rulerModeBtn');
            this.drawingManager.rulerMode = !this.drawingManager.rulerMode;
            rulerBtn.classList.toggle('active', this.drawingManager.rulerMode);
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
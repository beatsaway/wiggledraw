// File handling functionality
class FileManager {
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
    }

    saveCanvas() {
        const data = {
            width: this.canvasManager.canvas.width,
            height: this.canvasManager.canvas.height,
            strokes: window.strokeHistory.map(stroke => ({
                points: stroke.points,
                color: stroke.color,
                baseSize: stroke.baseSize
            }))
        };
        
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'drawing.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    loadCanvas(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                
                // Reset zoom
                window.zoomManager.resetZoom();
                
                // Clear and store stroke history
                this.canvasManager.ctx.clearRect(0, 0, this.canvasManager.canvas.width, this.canvasManager.canvas.height);
                let strokes = json.strokes || [];
                // Scale strokes if needed
                if (json.width && json.height && (json.width !== this.canvasManager.canvas.width || json.height !== this.canvasManager.canvas.height)) {
                    const scaleX = this.canvasManager.canvas.width / json.width;
                    const scaleY = this.canvasManager.canvas.height / json.height;
                    strokes = strokes.map(stroke => ({
                        ...stroke,
                        points: stroke.points.map(p => ({
                            x: p.x * scaleX,
                            y: p.y * scaleY
                        }))
                    }));
                }
                window.strokeHistory = strokes;
                // Store original points for wiggle effect
                for (const stroke of window.strokeHistory) {
                    stroke.originalPoints = stroke.points.map(p => ({...p}));
                    window.animationManager.replayStroke(stroke);
                }
                window.drawingManager.saveCanvasState();
            } catch (error) {
                alert('Error loading file: ' + error.message);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }
}

// Export the FileManager class
window.FileManager = FileManager; 
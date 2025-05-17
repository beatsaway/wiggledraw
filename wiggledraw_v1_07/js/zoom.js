// Zoom functionality
class ZoomManager {
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
    }

    startPanning(e) {
        this.canvasManager.isPanning = true;
        this.canvasManager.canvas.style.cursor = 'grabbing';
        
        const rect = this.canvasManager.canvas.getBoundingClientRect();
        this.canvasManager.startPanX = e.clientX - rect.left;
        this.canvasManager.startPanY = e.clientY - rect.top;
    }

    updatePanning(e) {
        if (!this.canvasManager.isPanning) return;
        
        const rect = this.canvasManager.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const dx = x - this.canvasManager.startPanX;
        const dy = y - this.canvasManager.startPanY;
        
        this.canvasManager.offsetX += dx / this.canvasManager.scale;
        this.canvasManager.offsetY += dy / this.canvasManager.scale;
        
        this.canvasManager.updateCanvasTransform();
        
        this.canvasManager.startPanX = x;
        this.canvasManager.startPanY = y;
    }

    endPanning() {
        this.canvasManager.isPanning = false;
        this.canvasManager.canvas.style.cursor = 'grab';
    }

    changeZoom(delta) {
        const newScale = Math.max(0.1, Math.min(10, this.canvasManager.scale + delta));
        const centerX = this.canvasManager.canvas.width / 2;
        const centerY = this.canvasManager.canvas.height / 2;
        
        this.zoomAtPoint(centerX, centerY, delta);
    }

    zoomAtPoint(x, y, delta) {
        const oldScale = this.canvasManager.scale;
        const newScale = Math.max(0.1, Math.min(10, this.canvasManager.scale + delta));
        
        const canvasX = x / oldScale;
        const canvasY = y / oldScale;
        
        this.canvasManager.offsetX = this.canvasManager.offsetX + (canvasX * (oldScale - newScale)) / newScale;
        this.canvasManager.offsetY = this.canvasManager.offsetY + (canvasY * (oldScale - newScale)) / newScale;
        
        this.canvasManager.scale = newScale;
        
        // Ensure the canvas stays within the visible area
        this.keepCanvasInView();
        
        document.getElementById('zoomLevel').textContent = `${Math.round(newScale * 100)}%`;
        
        this.canvasManager.updateCanvasTransform();
    }

    resetZoom() {
        this.canvasManager.scale = 1;
        this.canvasManager.offsetX = 0;
        this.canvasManager.offsetY = 0;
        document.getElementById('zoomLevel').textContent = '100%';
        this.canvasManager.updateCanvasTransform();
    }

    keepCanvasInView() {
        const canvas = this.canvasManager.canvas;
        const container = this.canvasManager.canvasContainer;
        const rect = container.getBoundingClientRect();
        
        // Calculate the visible area
        const visibleWidth = rect.width;
        const visibleHeight = rect.height;
        
        // Calculate the scaled canvas dimensions
        const scaledWidth = canvas.width * this.canvasManager.scale;
        const scaledHeight = canvas.height * this.canvasManager.scale;
        
        // Calculate the maximum allowed offset to keep the canvas in view
        const maxOffsetX = Math.max(0, (scaledWidth - visibleWidth) / 2);
        const maxOffsetY = Math.max(0, (scaledHeight - visibleHeight) / 2);
        
        // Clamp the offset to keep the canvas in view
        this.canvasManager.offsetX = Math.min(maxOffsetX, Math.max(-maxOffsetX, this.canvasManager.offsetX));
        this.canvasManager.offsetY = Math.min(maxOffsetY, Math.max(-maxOffsetY, this.canvasManager.offsetY));
    }
}

// Export the ZoomManager class
window.ZoomManager = ZoomManager; 
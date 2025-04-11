class WiggleEffect {
    constructor(color, amount, speed = 100) {
        this.color = color;
        this.amount = amount;
        this.speed = speed; // Lower number = faster animation
    }

    applyToPoint(point, index, baseAmount = 0) {
        if (!point) return { x: 0, y: 0 };
        
        // Use random values for a more natural wiggle
        const totalAmount = baseAmount + this.amount;
        const randomX = (Math.random() * 2 - 1) * totalAmount;
        const randomY = (Math.random() * 2 - 1) * totalAmount;
        
        return {
            x: randomX,
            y: randomY
        };
    }

    matchesColor(strokeColor) {
        return strokeColor.toLowerCase() === this.color.toLowerCase();
    }
}

// Export the WiggleEffect class
window.WiggleEffect = WiggleEffect; 
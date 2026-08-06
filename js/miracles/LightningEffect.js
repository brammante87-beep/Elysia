export class LightningEffect {
    constructor(x, y, duration = 0.55) {
        this.x = x;
        this.y = y;
        this.timer = duration;
        this.duration = duration;
        this.alive = true;
    }

    update(delta) {
        this.timer = Math.max(0, this.timer - delta);
        this.alive = this.timer > 0;
    }

    render(context, canvas, sprite = null) {
        const progress = this.timer / this.duration;
        context.save();
        if (sprite) {
            context.globalAlpha = progress;
            context.drawImage(sprite, this.x - 32, this.y - 64, 64, 64);
        } else {
            this.renderFallback(context, canvas, progress);
        }
        context.restore();
    }

    renderFallback(context, canvas, progress) {
        context.fillStyle = `rgba(255,255,235,${Math.max(0, progress - 0.7) * 0.16})`;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = `rgba(245,250,255,${progress})`;
        context.shadowColor = "#dbeafe";
        context.shadowBlur = 14;
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(this.x - 18, 0);
        context.lineTo(this.x + 6, this.y * 0.38);
        context.lineTo(this.x - 8, this.y * 0.7);
        context.lineTo(this.x, this.y);
        context.stroke();
        context.fillStyle = `rgba(255,220,90,${progress})`;
        context.beginPath();
        context.arc(this.x, this.y, 18 * progress, 0, Math.PI * 2);
        context.fill();
    }
}

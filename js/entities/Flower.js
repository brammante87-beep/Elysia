import { Entity } from "./Entity.js";

export class Flower extends Entity {
    static RADIUS = 7;

    constructor(x, y, savedState = {}) {
        super("Flower", x, y, "#f472b6");
        this.id = savedState.id ?? null;
        this.radius = Flower.RADIUS;
        this.alive = savedState.alive !== false;
        this.observerIds = [...new Set(savedState.observerIds || [])];
        this.observationProgress = Number.isFinite(savedState.observationProgress) ? savedState.observationProgress : 0;
        this.requiredUniqueObservers = 3;
        this.evolved = savedState.evolved === true;
        this.activeObserver = null;
        this.observationFeedbackTimer = 0;
        this.spriteVariant = Number.isInteger(savedState.spriteVariant) ? savedState.spriteVariant : Math.floor(Math.random() * 3);
        this.sway = 0;
    }

    update(delta) {
        this.observationFeedbackTimer = Math.max(0, this.observationFeedbackTimer - delta);
        this.sway += delta;
    }

    render(context, sprite = null) {
        if (!this.alive) { return; }
        const hasUsableSprite =
            sprite &&
            sprite.assetFallback !== true &&
            Number(sprite.width) > 0 &&
            Number(sprite.height) > 0;

        if (hasUsableSprite) {
            context.drawImage(sprite, this.x - 12, this.y - 20, 24, 24);
        } else {
            this.renderFallback(context);
        }
        if (this.activeObserver) { this.renderObservation(context); }
        this.debug("Flower rendered");
    }

    renderFallback(context) {
        this.debug("Flower fallback rendered");
        const sway = Math.sin(this.sway * 2) * 1.5;
        context.strokeStyle = "#397447";
        context.lineWidth = 2;
        context.beginPath(); context.moveTo(this.x, this.y + 7); context.lineTo(this.x + sway, this.y - 3); context.stroke();
        context.beginPath(); context.moveTo(this.x, this.y + 2); context.lineTo(this.x - 4, this.y); context.moveTo(this.x, this.y + 3); context.lineTo(this.x + 4, this.y + 1); context.stroke();
        context.fillStyle = ["#f472b6", "#fde047", "#a78bfa"][this.spriteVariant] || "#f472b6";
        for (let petal = 0; petal < 5; petal += 1) {
            const angle = petal * Math.PI * 0.4;
            context.beginPath(); context.arc(this.x + sway + Math.cos(angle) * 4, this.y - 5 + Math.sin(angle) * 4, 3, 0, Math.PI * 2); context.fill();
        }
        context.fillStyle = "#f59e0b"; context.beginPath(); context.arc(this.x + sway, this.y - 5, 2, 0, Math.PI * 2); context.fill();
    }

    renderObservation(context) {
        context.strokeStyle = "rgba(255,255,255,.8)";
        context.beginPath();
        context.arc(this.x, this.y - 5, 12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, this.observationProgress / 2));
        context.stroke();
    }

    serialize() {
        return { id: this.id, x: this.x, y: this.y, alive: this.alive, observerIds: [...this.observerIds], observationProgress: this.observationProgress, evolved: this.evolved, spriteVariant: this.spriteVariant };
    }

    debug(message) {
        if (globalThis.ELYSIA_DEBUG === true) { console.debug(message, { id: this.id, x: this.x, y: this.y }); }
    }
}

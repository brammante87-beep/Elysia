export class HumanIdleAnimation {
  constructor(random = Math.random) {
    this.random = random;
    this.timelines = new Map();
  }

  state(character, elapsed) {
    if (character.lifeStage === 'child' || character.species || character.visualState !== 'idle') {
      this.timelines.delete(character.id);
      return character.visualState;
    }
    let timeline = this.timelines.get(character.id);
    if (!timeline) {
      timeline = { gestureAt: elapsed + this.interval(), gestureEnds: 0 };
      this.timelines.set(character.id, timeline);
    }
    if (elapsed >= timeline.gestureAt && !timeline.gestureEnds) timeline.gestureEnds = timeline.gestureAt + 1.35;
    if (timeline.gestureEnds && elapsed < timeline.gestureEnds) return 'armGesture';
    if (timeline.gestureEnds) {
      timeline.gestureAt = elapsed + this.interval();
      timeline.gestureEnds = 0;
    }
    return 'idle';
  }

  interval() { return 4 + this.random() * 5; }

  animationTime(character, elapsed, state) {
    if (state !== 'armGesture') return elapsed;
    return Math.max(0, elapsed - this.timelines.get(character.id).gestureAt);
  }
}

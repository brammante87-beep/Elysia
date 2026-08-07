export class Config {
  static VERSION = 'Alpha 0.0.7';
  static MAX_DELTA_SECONDS = 0.1;
  static BACKGROUND_COLOR = '#25282a';
  static SAVE_KEY = 'elysia_reboot_save_v1';
  static SAVE_VERSION = 1;
  static DAY_DURATION_SECONDS = 240;
  static NIGHT_DURATION_SECONDS = 60;
  static WORLD_CYCLE_SECONDS = Config.DAY_DURATION_SECONDS + Config.NIGHT_DURATION_SECONDS;
  static DAWN_DURATION_SECONDS = 15;
  static DUSK_DURATION_SECONDS = 15;
  static INTIMACY_PROBABILITY = 0.35;
}

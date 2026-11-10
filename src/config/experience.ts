/**
 * Experience configuration — scene order, timing, and global settings
 */
export const experience = {
  /** Scene keys in order */
  sceneOrder: [
    'loading',
    'unknownUniverse',
    'worldThatBlooms',
    'littleThings',
    'heartOfLight',
    'finalLetter',
  ] as const,

  /** Minimum time to show loading screen (ms) */
  minLoadingTime: 2500,

  /** Whether to show interaction hints */
  showHints: true,

  /** Auto-hide hints after this many ms */
  hintDuration: 4000,

  /** Enable reduced motion for accessibility */
  respectReducedMotion: true,

  /** WebGL fallback — use Canvas2D if WebGL unavailable */
  enableFallback: true,

  /** Sound enabled by default */
  soundEnabledByDefault: false,
};

export type SceneKey = (typeof experience.sceneOrder)[number];

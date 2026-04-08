/**
 * Google Analytics 4 analytics module for Networker.
 *
 * Mirrors the pattern used in nikhedonia/lineball:
 *   – Dynamically injects the gtag.js script on web.
 *   – All calls no-op silently on server / when GA_ID is absent.
 *   – In development (no GA_ID) events are logged to the console.
 *
 * Configure by setting EXPO_PUBLIC_GA_ID in your .env.local file.
 */

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    // dataLayer accepts both IArguments (from gtag calls) and plain objects
    dataLayer: (IArguments | unknown[])[];
  }
}

const GA_ID = process.env.EXPO_PUBLIC_GA_ID;

// Dynamically load the GA4 script and initialise gtag on web.
if (GA_ID && typeof document !== 'undefined') {
  window.dataLayer = window.dataLayer || [];
  // gtag.js requires the `arguments` object (not a spread array) to be pushed
  // onto dataLayer — this is the canonical initialisation pattern.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
}

function gtag(...args: unknown[]) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag === 'function') {
    window.gtag(...args);
  } else if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', ...args);
  }
}

// ─── Speed tier helpers ───────────────────────────────────────────────────────
// Rough classification of how quickly a puzzle was completed.
// The thresholds are relative to puzzle size (level ≈ number of cells).
function speedTier(level: number, timeSeconds: number): 'fast' | 'medium' | 'slow' {
  const fastThreshold  = level * 0.8;   // e.g. level 15 → ≤12 s
  const mediumThreshold = level * 3;    // e.g. level 15 → ≤45 s
  if (timeSeconds <= fastThreshold)  return 'fast';
  if (timeSeconds <= mediumThreshold) return 'medium';
  return 'slow';
}

// ─── Public API ───────────────────────────────────────────────────────────────
export const analytics = {
  pageView(): void {
    if (typeof window === 'undefined') return;
    gtag('event', 'page_view', {
      page_path: window.location.pathname + window.location.hash,
    });
  },

  gameStarted(level: number, seed: string): void {
    gtag('event', 'game_start', {
      level,
      puzzle_name: seed,
    });
  },

  /**
   * Fired when the puzzle is fully solved.
   * Logs rich engagement metrics useful for GA4 custom reports.
   */
  gameCompleted(level: number, seed: string, time: number, moves: number): void {
    const movesPerMinute = time > 0 ? Math.round((moves / time) * 60) : 0;
    gtag('event', 'game_complete', {
      level,
      puzzle_name: seed,
      time_seconds: time,
      move_count: moves,
      moves_per_minute: movesPerMinute,
      speed_tier: speedTier(level, time),
    });
  },

  /**
   * Fired on every rotation click.
   *
   * – moveNumber === 1  → logs `first_interaction` (time-to-first-move)
   * – every 10th move   → logs `engagement_checkpoint` to track session depth
   */
  moveMade(level: number, moveNumber: number, secondsElapsed: number): void {
    if (moveNumber === 1) {
      gtag('event', 'first_interaction', {
        level,
        seconds_to_first_move: secondsElapsed,
      });
    }
    // Checkpoint every 10 moves to measure sustained engagement
    if (moveNumber % 10 === 0) {
      gtag('event', 'engagement_checkpoint', {
        level,
        move_number: moveNumber,
        seconds_elapsed: secondsElapsed,
      });
    }
  },

  /**
   * Fired when the user abandons a game (starts a new one or changes difficulty)
   * before completing it, but only if they've made at least one move.
   */
  puzzleAbandoned(level: number, seed: string, time: number, moves: number): void {
    gtag('event', 'puzzle_abandoned', {
      level,
      puzzle_name: seed,
      time_seconds: time,
      move_count: moves,
    });
  },

  difficultyChanged(from: number, to: number): void {
    gtag('event', 'difficulty_change', {
      from_level: from,
      to_level: to,
      direction: to > from ? 'harder' : 'easier',
    });
  },
};


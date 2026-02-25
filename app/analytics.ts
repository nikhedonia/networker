/**
 * Lightweight analytics module that works across web and mobile browsers.
 * Uses the Beacon API (navigator.sendBeacon) for reliable event delivery,
 * with a fetch fallback. No-ops gracefully when no endpoint is configured.
 *
 * Configure via NEXT_PUBLIC_ANALYTICS_URL environment variable.
 */

export type AnalyticsEvent =
  | { name: 'page_view'; path: string }
  | { name: 'game_started'; level: number; seed: string }
  | { name: 'game_completed'; level: number; seed: string; time: number; moves: number }
  | { name: 'move_made'; level: number }
  | { name: 'difficulty_changed'; from: number; to: number };

function getEndpoint(): string | null {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ANALYTICS_URL) {
    return process.env.NEXT_PUBLIC_ANALYTICS_URL;
  }
  return null;
}

function sendEvent(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;

  const endpoint = getEndpoint();
  const payload = JSON.stringify({
    ...event,
    timestamp: Date.now(),
    url: window.location.href,
    referrer: document.referrer || undefined,
    screen: `${window.screen.width}x${window.screen.height}`,
    userAgent: navigator.userAgent,
  });

  if (!endpoint) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.debug('[analytics]', event);
    }
    return;
  }

  // Prefer sendBeacon for reliability on mobile (fires even on page unload)
  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, new Blob([payload], { type: 'application/json' }));
  } else {
    fetch(endpoint, {
      method: 'POST',
      body: payload,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => {});
  }
}

export const analytics = {
  pageView(): void {
    if (typeof window === 'undefined') return;
    sendEvent({ name: 'page_view', path: window.location.pathname + window.location.hash });
  },

  gameStarted(level: number, seed: string): void {
    sendEvent({ name: 'game_started', level, seed });
  },

  gameCompleted(level: number, seed: string, time: number, moves: number): void {
    sendEvent({ name: 'game_completed', level, seed, time, moves });
  },

  moveMade(level: number): void {
    sendEvent({ name: 'move_made', level });
  },

  difficultyChanged(from: number, to: number): void {
    sendEvent({ name: 'difficulty_changed', from, to });
  },
};

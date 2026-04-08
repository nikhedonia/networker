export type PuzzleResult = {
  difficulty: number;
  timeSeconds: number;
  moves: number;
};

export type GameSession = {
  id: string;
  mode: 'race' | 'freeplay';
  startedAt: number;
  raceDuration?: number; // seconds allotted (race mode)
  startDifficulty: number;
  autoIncrease: boolean;
  puzzles: PuzzleResult[];
};

const STORAGE_KEY = 'networker_sessions';

export function loadSessions(): GameSession[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GameSession[]) : [];
  } catch {
    return [];
  }
}

export function saveSession(session: GameSession): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const sessions = loadSessions();
    sessions.unshift(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // ignore storage errors
  }
}

export function clearSessions(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

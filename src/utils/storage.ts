import type { PlayerSession } from '../types';

const STORAGE_KEY = 'czolko_session';

export function saveSession(session: PlayerSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function loadSession(): PlayerSession | null {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;

  try {
    return JSON.parse(data) as PlayerSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function isSessionForLobby(lobbyId: string): boolean {
  const session = loadSession();
  return session !== null && session.lobbyId === lobbyId;
}

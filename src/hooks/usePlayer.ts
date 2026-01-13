import { useState, useEffect, useCallback } from 'react';
import { loadSession, saveSession, clearSession } from '../utils/storage';
import { generatePlayerId, addPlayer } from '../firebase';
import type { PlayerSession, Player } from '../types';

interface UsePlayerResult {
  session: PlayerSession | null;
  currentPlayer: Player | null;
  createSession: (lobbyId: string, name: string, isNewLobby?: boolean, existingPlayerId?: string) => Promise<PlayerSession>;
  clearCurrentSession: () => void;
  isOwner: (ownerId: string) => boolean;
}

export function usePlayer(players: Player[]): UsePlayerResult {
  const [session, setSession] = useState<PlayerSession | null>(null);

  useEffect(() => {
    const stored = loadSession();
    if (stored) {
      setSession(stored);
    }
  }, []);

  const currentPlayer = players.find(p => p.oderId === session?.oderId) ?? null;

  const createSession = useCallback(async (
    lobbyId: string,
    name: string,
    isNewLobby: boolean = false,
    existingPlayerId?: string
  ): Promise<PlayerSession> => {
    const oderId = existingPlayerId ?? generatePlayerId();
    const newSession: PlayerSession = { oderId, lobbyId, name };

    // Only add player to Firebase if this is not a new lobby (owner already added)
    if (!isNewLobby) {
      await addPlayer(lobbyId, oderId, name);
    }

    saveSession(newSession);
    setSession(newSession);
    return newSession;
  }, []);

  const clearCurrentSession = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const isOwner = useCallback((ownerId: string): boolean => {
    return session?.oderId === ownerId;
  }, [session]);

  return {
    session,
    currentPlayer,
    createSession,
    clearCurrentSession,
    isOwner
  };
}

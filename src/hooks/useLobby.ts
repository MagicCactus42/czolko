import { useState, useEffect } from 'react';
import { subscribeLobby, isLobbyExpired } from '../firebase';
import type { Lobby } from '../types';

interface UseLobbyResult {
  lobby: Lobby | null;
  loading: boolean;
  error: string | null;
  isExpired: boolean;
}

export function useLobby(lobbyId: string | undefined): UseLobbyResult {
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!lobbyId) {
      setLoading(false);
      setError('No lobby ID provided');
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeLobby(lobbyId, (lobbyData) => {
      setLoading(false);

      if (!lobbyData) {
        setError('Lobby not found');
        setLobby(null);
        return;
      }

      if (isLobbyExpired(lobbyData)) {
        setIsExpired(true);
        setError('Lobby has expired');
      }

      setLobby(lobbyData);
    });

    return () => unsubscribe();
  }, [lobbyId]);

  return { lobby, loading, error, isExpired };
}

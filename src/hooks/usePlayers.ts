import { useState, useEffect } from 'react';
import { subscribePlayers } from '../firebase';
import type { Player } from '../types';

interface UsePlayersResult {
  players: Player[];
  loading: boolean;
}

export function usePlayers(lobbyId: string | undefined): UsePlayersResult {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lobbyId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribePlayers(lobbyId, (playersData) => {
      setPlayers(playersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [lobbyId]);

  return { players, loading };
}

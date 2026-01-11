import type { Player, MatchingMode, Exclusion } from '../types';

interface MatchResult {
  playerId: string;
  matchedWithId: string;
}

export function calculateMatches(
  players: Player[],
  mode: MatchingMode,
  exclusions: Exclusion[] = []
): MatchResult[] {
  const sortedPlayers = [...players]
    .filter(p => p.seatNumber !== null)
    .sort((a, b) => (a.seatNumber ?? 0) - (b.seatNumber ?? 0));

  if (sortedPlayers.length < 2) {
    return [];
  }

  switch (mode) {
    case 'left':
      return matchLeft(sortedPlayers);
    case 'right':
      return matchRight(sortedPlayers);
    case 'random':
      return matchRandom(sortedPlayers, exclusions);
    default:
      return [];
  }
}

function matchLeft(players: Player[]): MatchResult[] {
  return players.map((player, index) => {
    const leftIndex = index === 0 ? players.length - 1 : index - 1;
    return {
      playerId: player.oderId,
      matchedWithId: players[leftIndex].oderId
    };
  });
}

function matchRight(players: Player[]): MatchResult[] {
  return players.map((player, index) => {
    const rightIndex = (index + 1) % players.length;
    return {
      playerId: player.oderId,
      matchedWithId: players[rightIndex].oderId
    };
  });
}

function matchRandom(players: Player[], exclusions: Exclusion[]): MatchResult[] {
  const playerIds = players.map(p => p.oderId);

  const exclusionMap = new Map<string, Set<string>>();
  for (const player of players) {
    exclusionMap.set(player.oderId, new Set([player.oderId]));
  }
  for (const exc of exclusions) {
    exclusionMap.get(exc.player1Id)?.add(exc.player2Id);
    exclusionMap.get(exc.player2Id)?.add(exc.player1Id);
  }

  const maxAttempts = 1000;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = tryRandomDerangement(playerIds, exclusionMap);
    if (result) {
      return result;
    }
  }

  return matchRight(players);
}

function tryRandomDerangement(
  playerIds: string[],
  exclusionMap: Map<string, Set<string>>
): MatchResult[] | null {
  const n = playerIds.length;
  const available = [...playerIds];
  const result: MatchResult[] = [];

  const shuffledIndices = [...Array(n).keys()].sort(() => Math.random() - 0.5);

  for (const i of shuffledIndices) {
    const playerId = playerIds[i];
    const excluded = exclusionMap.get(playerId) ?? new Set();

    const validTargets = available.filter(
      targetId => !excluded.has(targetId) && targetId !== playerId
    );

    if (validTargets.length === 0) {
      return null;
    }

    const targetId = validTargets[Math.floor(Math.random() * validTargets.length)];
    result.push({ playerId, matchedWithId: targetId });

    const targetIndex = available.indexOf(targetId);
    available.splice(targetIndex, 1);
  }

  return result;
}

export function allPlayersSeated(players: Player[]): boolean {
  return players.length > 0 && players.every(p => p.seatNumber !== null);
}

export function allWordsAssigned(players: Player[]): boolean {
  return players.length > 0 && players.every(p => p.wordToGuess !== null);
}

export function getAvailableSeats(players: Player[], totalPlayers: number): number[] {
  const takenSeats = new Set(players.map(p => p.seatNumber).filter(s => s !== null));
  const available: number[] = [];

  for (let i = 1; i <= totalPlayers; i++) {
    if (!takenSeats.has(i)) {
      available.push(i);
    }
  }

  return available;
}

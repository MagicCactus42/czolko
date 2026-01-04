import { Timestamp } from 'firebase/firestore';

export type LobbyStatus = 'waiting' | 'seating' | 'assigning' | 'playing' | 'finished';
export type MatchingMode = 'left' | 'right' | 'random';

export interface Exclusion {
  player1Id: string;
  player2Id: string;
}

export interface Lobby {
  id: string;
  code: string;
  ownerId: string;
  ownerAuthUid: string;
  ownerDisplayName: string | null;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  status: LobbyStatus;
  matchingMode: MatchingMode | null;
  exclusions: Exclusion[];
}

export interface Player {
  oderId: string;
  name: string;
  joinedAt: Timestamp;
  seatNumber: number | null;
  matchedWithId: string | null;
  wordToGuess: string | null;
  wordAssignedById: string | null;
}

export interface PlayerSession {
  oderId: string;
  lobbyId: string;
  name: string;
}

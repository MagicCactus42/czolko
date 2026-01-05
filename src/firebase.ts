import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot, query, Timestamp, getDocs, writeBatch } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import type { Lobby, Player, LobbyStatus, MatchingMode, Exclusion } from './types';
import { checkRateLimit, RATE_LIMITS } from './utils/rateLimit';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

function enforceRateLimit(action: keyof typeof RATE_LIMITS): void {
  const result = checkRateLimit(action, RATE_LIMITS[action]);
  if (!result.allowed) {
    const seconds = Math.ceil((result.retryAfter ?? 0) / 1000);
    throw new Error(`Too many requests. Please wait ${seconds} seconds.`);
  }
}

export function signInWithGoogle(): Promise<User> {
  return signInWithPopup(auth, googleProvider).then(result => result.user);
}

export function signOutUser(): Promise<void> {
  return signOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function generatePlayerId(): string {
  return crypto.randomUUID();
}

export const MAX_LOBBY_SIZE = 32;

export async function createLobby(ownerId: string, ownerName: string): Promise<Lobby> {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('You must be signed in to create a lobby');
  }

  enforceRateLimit('createLobby');

  const lobbyRef = doc(collection(db, 'lobbies'));
  const now = Timestamp.now();
  const twoHoursLater = Timestamp.fromMillis(now.toMillis() + 2 * 60 * 60 * 1000);

  const lobby: Lobby = {
    id: lobbyRef.id,
    code: generateCode(),
    ownerId,
    ownerAuthUid: user.uid,
    ownerDisplayName: user.displayName,
    createdAt: now,
    expiresAt: twoHoursLater,
    status: 'waiting',
    matchingMode: null,
    exclusions: [],
  };

  await setDoc(lobbyRef, lobby);
  await addPlayer(lobby.id, ownerId, ownerName);

  return lobby;
}

export async function getLobby(lobbyId: string): Promise<Lobby | null> {
  const lobbyRef = doc(db, 'lobbies', lobbyId);
  const lobbySnap = await getDoc(lobbyRef);

  if (!lobbySnap.exists()) {
    return null;
  }

  return lobbySnap.data() as Lobby;
}

export async function getLobbyByCode(code: string): Promise<Lobby | null> {
  const lobbiesRef = collection(db, 'lobbies');
  const snapshot = await getDocs(lobbiesRef);

  for (const docSnap of snapshot.docs) {
    const lobby = docSnap.data() as Lobby;
    if (lobby.code.toUpperCase() === code.toUpperCase()) {
      return lobby;
    }
  }

  return null;
}

export function subscribeLobby(lobbyId: string, callback: (lobby: Lobby | null) => void): () => void {
  const lobbyRef = doc(db, 'lobbies', lobbyId);
  return onSnapshot(lobbyRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as Lobby);
    } else {
      callback(null);
    }
  });
}

export async function updateLobbyStatus(lobbyId: string, status: LobbyStatus): Promise<void> {
  const lobbyRef = doc(db, 'lobbies', lobbyId);
  await updateDoc(lobbyRef, { status });
}

export async function updateLobbyMatchingMode(lobbyId: string, matchingMode: MatchingMode): Promise<void> {
  const lobbyRef = doc(db, 'lobbies', lobbyId);
  await updateDoc(lobbyRef, { matchingMode });
}

export async function updateLobbyExclusions(lobbyId: string, exclusions: Exclusion[]): Promise<void> {
  const lobbyRef = doc(db, 'lobbies', lobbyId);
  await updateDoc(lobbyRef, { exclusions });
}

export async function deleteLobby(lobbyId: string): Promise<void> {
  const playersRef = collection(db, 'lobbies', lobbyId, 'players');
  const playersSnap = await getDocs(playersRef);
  const batch = writeBatch(db);

  playersSnap.docs.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });

  await batch.commit();

  const lobbyRef = doc(db, 'lobbies', lobbyId);
  await deleteDoc(lobbyRef);
}

export async function addPlayer(lobbyId: string, oderId: string, name: string): Promise<Player> {
  enforceRateLimit('joinLobby');

  const currentPlayers = await getPlayers(lobbyId);
  if (currentPlayers.length >= MAX_LOBBY_SIZE) {
    throw new Error(`Lobby is full (max ${MAX_LOBBY_SIZE} players)`);
  }

  const playerRef = doc(db, 'lobbies', lobbyId, 'players', oderId);

  const player: Player = {
    oderId,
    name,
    joinedAt: Timestamp.now(),
    seatNumber: null,
    matchedWithId: null,
    wordToGuess: null,
    wordAssignedById: null,
  };

  await setDoc(playerRef, player);
  return player;
}

export async function getPlayers(lobbyId: string): Promise<Player[]> {
  const playersRef = collection(db, 'lobbies', lobbyId, 'players');
  const snapshot = await getDocs(playersRef);
  return snapshot.docs.map(doc => doc.data() as Player);
}

export function subscribePlayers(lobbyId: string, callback: (players: Player[]) => void): () => void {
  const playersRef = collection(db, 'lobbies', lobbyId, 'players');
  return onSnapshot(query(playersRef), (snapshot) => {
    const players = snapshot.docs.map(doc => doc.data() as Player);
    callback(players);
  });
}

export async function updatePlayerSeat(lobbyId: string, oderId: string, seatNumber: number): Promise<void> {
  enforceRateLimit('updateSeat');
  const playerRef = doc(db, 'lobbies', lobbyId, 'players', oderId);
  await updateDoc(playerRef, { seatNumber });
}

export async function updatePlayerMatch(lobbyId: string, oderId: string, matchedWithId: string): Promise<void> {
  const playerRef = doc(db, 'lobbies', lobbyId, 'players', oderId);
  await updateDoc(playerRef, { matchedWithId });
}

export async function assignWordToPlayer(lobbyId: string, targetPlayerId: string, word: string, assignedById: string): Promise<void> {
  enforceRateLimit('assignWord');
  const playerRef = doc(db, 'lobbies', lobbyId, 'players', targetPlayerId);
  await updateDoc(playerRef, {
    wordToGuess: word,
    wordAssignedById: assignedById
  });
}

export function isLobbyExpired(lobby: Lobby): boolean {
  return Timestamp.now().toMillis() > lobby.expiresAt.toMillis();
}

export async function cleanupExpiredLobbies(): Promise<number> {
  const lobbiesRef = collection(db, 'lobbies');
  const snapshot = await getDocs(lobbiesRef);
  const now = Timestamp.now().toMillis();
  let deletedCount = 0;

  for (const docSnap of snapshot.docs) {
    const lobby = docSnap.data() as Lobby;
    if (lobby.expiresAt.toMillis() < now) {
      try {
        await deleteLobby(lobby.id);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete expired lobby ${lobby.id}:`, error);
      }
    }
  }

  return deletedCount;
}

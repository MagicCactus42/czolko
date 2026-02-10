import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { PlayerList } from '../components/PlayerList';
import { ShareLink } from '../components/ShareLink';
import { SeatSelector } from '../components/SeatSelector';
import { MatchingConfig } from '../components/MatchingConfig';
import { WordAssignment } from '../components/WordAssignment';
import { WordReveal } from '../components/WordReveal';
import { useLobby } from '../hooks/useLobby';
import { usePlayers } from '../hooks/usePlayers';
import { usePlayer } from '../hooks/usePlayer';
import { updateLobbyStatus, deleteLobby, addPlayer, generatePlayerId, MAX_LOBBY_SIZE } from '../firebase';
import { saveSession, isSessionForLobby } from '../utils/storage';
import { allPlayersSeated, allWordsAssigned } from '../utils/matching';
import type { LobbyStatus } from '../types';

const gamePhases: { status: LobbyStatus; label: string; icon: string }[] = [
  { status: 'waiting', label: 'Lobby', icon: '👥' },
  { status: 'seating', label: 'Seats', icon: '💺' },
  { status: 'assigning', label: 'Words', icon: '✏️' },
  { status: 'playing', label: 'Play', icon: '🎮' },
];

function ProgressIndicator({ currentStatus }: { currentStatus: LobbyStatus }) {
  const currentIndex = gamePhases.findIndex(p => p.status === currentStatus);

  return (
    <div className="card mb-4 sm:mb-6">
      <div className="flex items-center justify-between">
        {gamePhases.map((phase, index) => {
          const isActive = phase.status === currentStatus;
          const isCompleted = index < currentIndex;
          const isLast = index === gamePhases.length - 1;

          return (
            <div key={phase.status} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl
                    transition-all duration-300
                    ${isActive
                      ? 'bg-purple-600 shadow-glow scale-110'
                      : isCompleted
                        ? 'bg-green-500/80'
                        : 'bg-white/10'
                    }
                  `}
                >
                  {isCompleted ? '✓' : phase.icon}
                </div>
                <span
                  className={`mt-1.5 text-xs font-medium hidden sm:block ${
                    isActive ? 'text-white' : isCompleted ? 'text-green-300' : 'text-purple-300/50'
                  }`}
                >
                  {phase.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={`flex-1 h-1 mx-2 rounded-full transition-colors ${
                    isCompleted ? 'bg-green-500/50' : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Lobby() {
  const { lobbyId } = useParams<{ lobbyId: string }>();
  const navigate = useNavigate();
  const { lobby, loading: lobbyLoading, error: lobbyError, isExpired } = useLobby(lobbyId);
  const { players, loading: playersLoading } = usePlayers(lobbyId);
  const { session, currentPlayer, isOwner } = usePlayer(players);

  const [joiningName, setJoiningName] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const needsToJoin = !lobbyLoading && lobby && !isSessionForLobby(lobbyId ?? '');

  useEffect(() => {
    if (lobby?.status === 'seating' && allPlayersSeated(players) && isOwner(lobby.ownerId)) {
      // Owner controls via MatchingConfig
    }
  }, [lobby, players, isOwner]);

  useEffect(() => {
    if (lobby?.status === 'assigning' && allWordsAssigned(players) && isOwner(lobby.ownerId)) {
      updateLobbyStatus(lobbyId!, 'playing');
    }
  }, [lobby, players, lobbyId, isOwner]);

  const handleJoinLobby = async () => {
    if (!joiningName.trim()) {
      setJoinError('Please enter your name');
      return;
    }

    if (!lobbyId || !lobby) return;

    if (lobby.status !== 'waiting') {
      setJoinError('This room is no longer accepting new players');
      return;
    }

    if (players.length >= MAX_LOBBY_SIZE) {
      setJoinError(`This room is full (max ${MAX_LOBBY_SIZE} players)`);
      return;
    }

    setJoining(true);
    setJoinError(null);

    try {
      const oderId = generatePlayerId();
      await addPlayer(lobbyId, oderId, joiningName.trim());
      saveSession({ oderId, lobbyId, name: joiningName.trim() });
    } catch (err) {
      console.error('Failed to join:', err);
      const message = err instanceof Error ? err.message : 'Failed to join. Please try again.';
      setJoinError(message);
    } finally {
      setJoining(false);
    }
  };

  const handleStartSeating = async () => {
    if (!lobbyId) return;
    await updateLobbyStatus(lobbyId, 'seating');
  };

  const handleDeleteLobby = async () => {
    if (!lobbyId || !window.confirm('Are you sure you want to delete this lobby?')) return;

    setDeleting(true);
    try {
      await deleteLobby(lobbyId);
      navigate('/');
    } catch (err) {
      console.error('Failed to delete lobby:', err);
    } finally {
      setDeleting(false);
    }
  };

  // Loading state
  if (lobbyLoading || playersLoading) {
    return (
      <Layout>
        <div className="max-w-lg sm:max-w-xl md:max-w-2xl mx-auto">
          <div className="card text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/20 mb-4">
              <svg className="animate-spin h-8 w-8 text-purple-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <p className="text-white text-lg font-medium">Loading room...</p>
            <p className="text-purple-300/60 text-sm mt-1">Please wait</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (lobbyError || !lobby) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto">
          <div className="card border-red-500/30 bg-red-500/10 text-center py-8">
            <span className="text-5xl mb-4 block">😕</span>
            <h2 className="text-white text-xl font-semibold mb-2">Room Not Found</h2>
            <p className="text-red-200/80 mb-6">{lobbyError || 'This room does not exist.'}</p>
            <button onClick={() => navigate('/')} className="btn-primary">
              Go Home
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Expired state
  if (isExpired) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto">
          <div className="card border-yellow-500/30 bg-yellow-500/10 text-center py-8">
            <span className="text-5xl mb-4 block">⏰</span>
            <h2 className="text-white text-xl font-semibold mb-2">Room Expired</h2>
            <p className="text-yellow-200/80 mb-6">This room has exceeded the 2-hour time limit.</p>
            <button onClick={() => navigate('/')} className="btn-primary">
              Create New Room
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Join form for new visitors
  if (needsToJoin && lobby.status === 'waiting') {
    return (
      <Layout>
        <div className="max-w-md mx-auto">
          <div className="card">
            <div className="text-center mb-6">
              <span className="text-4xl mb-2 block">👋</span>
              <h2 className="text-white text-xl font-semibold">Join Room</h2>
              <div className="mt-3 inline-block bg-purple-500/20 border border-purple-400/30 rounded-lg px-4 py-2">
                <span className="text-purple-200 text-sm">Room Code: </span>
                <span className="font-mono font-bold text-white tracking-wider">{lobby.code}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={joiningName}
                  onChange={(e) => setJoiningName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinLobby()}
                  placeholder="Enter your name"
                  className="input"
                  disabled={joining}
                  autoFocus
                />
              </div>

              {joinError && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm flex items-start gap-2 animate-fade-in">
                  <span className="text-red-400 mt-0.5">⚠</span>
                  <span>{joinError}</span>
                </div>
              )}

              <button
                onClick={handleJoinLobby}
                disabled={joining}
                className="btn-primary w-full"
              >
                {joining ? 'Joining...' : 'Join Room'}
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Late joiner
  if (needsToJoin && lobby.status !== 'waiting') {
    return (
      <Layout>
        <div className="max-w-lg mx-auto">
          <div className="card border-yellow-500/30 bg-yellow-500/10 text-center py-8">
            <span className="text-5xl mb-4 block">🎮</span>
            <h2 className="text-white text-xl font-semibold mb-2">Game In Progress</h2>
            <p className="text-yellow-200/80 mb-6">This room is no longer accepting new players.</p>
            <button onClick={() => navigate('/')} className="btn-primary">
              Go Home
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const showOwnerControls = session && isOwner(lobby.ownerId);

  return (
    <Layout>
      <div className="max-w-lg sm:max-w-xl md:max-w-2xl mx-auto space-y-4 sm:space-y-6">
        {/* Progress Indicator */}
        <ProgressIndicator currentStatus={lobby.status} />

        {/* Waiting Phase */}
        {lobby.status === 'waiting' && (
          <>
            <ShareLink lobbyId={lobby.id} code={lobby.code} />
            <PlayerList
              players={players}
              currentPlayerId={session?.oderId}
              ownerId={lobby.ownerId}
            />
            {showOwnerControls && players.length >= 2 && (
              <button onClick={handleStartSeating} className="btn-success w-full">
                Start Game ({players.length} players)
              </button>
            )}
            {showOwnerControls && players.length < 2 && (
              <div className="card bg-white/5 text-center">
                <p className="text-purple-300/80 text-sm">
                  Need at least 2 players to start
                </p>
              </div>
            )}
          </>
        )}

        {/* Seating Phase */}
        {lobby.status === 'seating' && (
          <>
            <PlayerList
              players={players}
              currentPlayerId={session?.oderId}
              ownerId={lobby.ownerId}
              showSeats
            />
            {currentPlayer && (
              <SeatSelector
                lobbyId={lobby.id}
                players={players}
                currentPlayer={currentPlayer}
              />
            )}
            {showOwnerControls && allPlayersSeated(players) && (
              <MatchingConfig lobbyId={lobby.id} players={players} />
            )}
            {showOwnerControls && !allPlayersSeated(players) && (
              <div className="card bg-white/5 text-center">
                <p className="text-purple-300/80 text-sm">
                  Waiting for all players to select seats ({players.filter(p => p.seatNumber !== null).length}/{players.length})
                </p>
              </div>
            )}
          </>
        )}

        {/* Assigning Phase */}
        {lobby.status === 'assigning' && currentPlayer && (
          <>
            <WordAssignment
              lobbyId={lobby.id}
              currentPlayer={currentPlayer}
              players={players}
            />
            <PlayerList
              players={players}
              currentPlayerId={session?.oderId}
              ownerId={lobby.ownerId}
              showSeats
            />
            <div className="card bg-white/5 text-center">
              <p className="text-purple-300/80 text-sm">
                Words assigned: {players.filter(p => p.wordToGuess !== null).length}/{players.length}
              </p>
            </div>
          </>
        )}

        {/* Playing Phase */}
        {lobby.status === 'playing' && session && (
          <>
            <WordReveal players={players} currentPlayerId={session.oderId} />
            <div className="card bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Now Playing!</h3>
                  <p className="text-green-200/80 text-sm">
                    Take turns asking yes/no questions to figure out your word.
                    Everyone else can see your word - don't let them give it away!
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Owner Controls */}
        {showOwnerControls && (lobby.status === 'playing' || lobby.status === 'finished') && (
          <button
            onClick={handleDeleteLobby}
            disabled={deleting}
            className="btn-danger w-full"
          >
            {deleting ? 'Deleting...' : 'End Game & Delete Room'}
          </button>
        )}
      </div>
    </Layout>
  );
}

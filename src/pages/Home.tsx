import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { AuthButton } from '../components/AuthButton';
import { useAuth } from '../hooks/useAuth';
import { createLobby, getLobbyByCode, generatePlayerId, addPlayer, MAX_LOBBY_SIZE, getPlayers, cleanupExpiredLobbies } from '../firebase';
import { saveSession } from '../utils/storage';

export function Home() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<'create' | 'join'>('create');

  // Cleanup expired lobbies on mount
  useEffect(() => {
    cleanupExpiredLobbies().catch(console.error);
  }, []);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!user) {
      setError('Please sign in to create a room');
      return;
    }

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const oderId = generatePlayerId();
      const lobby = await createLobby(oderId, name.trim());
      saveSession({ oderId, lobbyId: lobby.id, name: name.trim() });
      navigate(`/lobby/${lobby.id}`);
    } catch (err) {
      console.error('Failed to create lobby:', err);
      const message = err instanceof Error ? err.message : 'Failed to create lobby';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!code.trim()) {
      setError('Please enter the room code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const lobby = await getLobbyByCode(code.trim());

      if (!lobby) {
        setError('Room not found. Please check the code.');
        setLoading(false);
        return;
      }

      if (lobby.expiresAt.toMillis() < Date.now()) {
        setError('This room has expired.');
        setLoading(false);
        return;
      }

      if (lobby.status !== 'waiting') {
        setError('This room is no longer accepting new players.');
        setLoading(false);
        return;
      }

      // Check lobby size
      const players = await getPlayers(lobby.id);
      if (players.length >= MAX_LOBBY_SIZE) {
        setError(`This room is full (max ${MAX_LOBBY_SIZE} players).`);
        setLoading(false);
        return;
      }

      const oderId = generatePlayerId();
      await addPlayer(lobby.id, oderId, name.trim());
      saveSession({ oderId, lobbyId: lobby.id, name: name.trim() });
      navigate(`/lobby/${lobby.id}`);
    } catch (err) {
      console.error('Failed to join lobby:', err);
      const message = err instanceof Error ? err.message : 'Failed to join lobby. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'create') {
      handleCreate();
    } else {
      handleJoin();
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <div className="card">
          {/* Tabs */}
          <div className="flex rounded-xl bg-white/5 p-1 mb-6">
            <button
              onClick={() => { setMode('create'); setError(null); }}
              className={`flex-1 py-2.5 text-center font-medium rounded-lg transition-all duration-200 ${
                mode === 'create'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              Create Room
            </button>
            <button
              onClick={() => { setMode('join'); setError(null); }}
              className={`flex-1 py-2.5 text-center font-medium rounded-lg transition-all duration-200 ${
                mode === 'join'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              Join Room
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Auth Section for Create Mode */}
            {mode === 'create' && !authLoading && (
              <div className="animate-fade-in">
                {user ? (
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-xl mb-2">
                    {user.photoURL && (
                      <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-green-300 text-sm font-medium truncate">
                        {user.displayName || user.email}
                      </p>
                      <p className="text-green-200/60 text-xs">Ready to create</p>
                    </div>
                  </div>
                ) : (
                  <div className="border border-white/10 rounded-xl p-4 mb-2">
                    <AuthButton />
                  </div>
                )}
              </div>
            )}

            {/* Name Input */}
            <div>
              <label className="block text-purple-200 text-sm font-medium mb-2">
                Your Name
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300/50">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="input pl-12"
                  disabled={loading || (mode === 'create' && !user)}
                  autoFocus={mode === 'join' || !!user}
                />
              </div>
            </div>

            {/* Code Input (Join mode) */}
            {mode === 'join' && (
              <div className="animate-fade-in">
                <label className="block text-purple-200 text-sm font-medium mb-2">
                  Room Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="XXXXXX"
                  maxLength={6}
                  className="input font-mono text-xl tracking-[0.3em] text-center uppercase"
                  disabled={loading}
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm flex items-start gap-2 animate-fade-in">
                <span className="text-red-400 mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (mode === 'create' && !user)}
              className="btn-primary w-full text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Please wait...
                </span>
              ) : mode === 'create' ? (
                'Create Room'
              ) : (
                'Join Room'
              )}
            </button>
          </form>
        </div>

        {/* How to Play */}
        <div className="mt-8 card bg-white/5">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <span>📖</span>
            How to Play
          </h2>
          <ol className="space-y-3 text-sm">
            {[
              { icon: '🏠', text: 'Create a room and invite friends' },
              { icon: '💺', text: 'Select your seat positions' },
              { icon: '✏️', text: 'Assign words for others to guess' },
              { icon: '❓', text: 'Take turns asking yes/no questions' },
              { icon: '🏆', text: 'First to guess their word wins!' },
            ].map((step, index) => (
              <li key={index} className="flex items-center gap-3 text-purple-200">
                <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  {step.icon}
                </span>
                <span>{step.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Layout>
  );
}

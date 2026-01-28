import { useState } from 'react';
import type { Player, MatchingMode, Exclusion } from '../types';
import { updateLobbyMatchingMode, updateLobbyExclusions, updateLobbyStatus, updatePlayerMatch } from '../firebase';
import { calculateMatches } from '../utils/matching';

interface MatchingConfigProps {
  lobbyId: string;
  players: Player[];
}

const modeConfig = {
  left: {
    icon: '←',
    label: 'Person on Left',
    description: 'Match with the person in the lower seat number (wraps around)',
  },
  right: {
    icon: '→',
    label: 'Person on Right',
    description: 'Match with the person in the higher seat number (wraps around)',
  },
  random: {
    icon: '🎲',
    label: 'Random',
    description: 'Random matching with optional exclusions',
  },
};

export function MatchingConfig({ lobbyId, players }: MatchingConfigProps) {
  const [mode, setMode] = useState<MatchingMode>('right');
  const [exclusions, setExclusions] = useState<Exclusion[]>([]);
  const [newExclusion, setNewExclusion] = useState({ player1Id: '', player2Id: '' });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddExclusion = () => {
    if (newExclusion.player1Id && newExclusion.player2Id && newExclusion.player1Id !== newExclusion.player2Id) {
      const exists = exclusions.some(
        e => (e.player1Id === newExclusion.player1Id && e.player2Id === newExclusion.player2Id) ||
             (e.player1Id === newExclusion.player2Id && e.player2Id === newExclusion.player1Id)
      );
      if (!exists) {
        setExclusions([...exclusions, newExclusion]);
      }
      setNewExclusion({ player1Id: '', player2Id: '' });
    }
  };

  const handleRemoveExclusion = (index: number) => {
    setExclusions(exclusions.filter((_, i) => i !== index));
  };

  const handleStartMatching = async () => {
    setProcessing(true);
    setError(null);

    try {
      await updateLobbyMatchingMode(lobbyId, mode);
      if (mode === 'random') {
        await updateLobbyExclusions(lobbyId, exclusions);
      }

      const matches = calculateMatches(players, mode, exclusions);

      if (matches.length !== players.length) {
        setError('Could not create valid matches with current exclusions. Try removing some exclusions.');
        setProcessing(false);
        return;
      }

      for (const match of matches) {
        await updatePlayerMatch(lobbyId, match.playerId, match.matchedWithId);
      }

      await updateLobbyStatus(lobbyId, 'assigning');
    } catch (err) {
      console.error('Failed to start matching:', err);
      setError('Failed to create matches. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getPlayerName = (id: string) => players.find(p => p.oderId === id)?.name ?? 'Unknown';

  return (
    <div className="card animate-slide-up">
      <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <span className="text-xl">⚙️</span>
        Configure Matching
      </h3>

      <div className="space-y-4 sm:space-y-5">
        {/* Matching Mode Selection */}
        <div>
          <label className="block text-purple-200 text-sm font-medium mb-3">
            How should players be matched?
          </label>
          <div className="grid gap-2 sm:gap-3">
            {(['left', 'right', 'random'] as MatchingMode[]).map((m) => {
              const config = modeConfig[m];
              const isSelected = mode === m;

              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl text-left transition-all duration-200 border ${
                    isSelected
                      ? 'bg-purple-600/80 border-purple-400 shadow-glow-sm'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <span className={`text-2xl w-10 h-10 flex items-center justify-center rounded-lg ${
                    isSelected ? 'bg-purple-500' : 'bg-white/10'
                  }`}>
                    {config.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-white font-medium block">{config.label}</span>
                    <p className="text-purple-200/70 text-xs sm:text-sm mt-0.5 line-clamp-2">
                      {config.description}
                    </p>
                  </div>
                  {isSelected && (
                    <span className="text-purple-300 text-lg">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Exclusions Section */}
        {mode === 'random' && (
          <div className="border-t border-white/10 pt-4 animate-fade-in">
            <label className="block text-purple-200 text-sm font-medium mb-2">
              Exclusions (optional)
            </label>
            <p className="text-purple-300/60 text-xs mb-4">
              Prevent specific players from being matched together
            </p>

            {/* Responsive form - stacks on mobile */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <select
                value={newExclusion.player1Id}
                onChange={(e) => setNewExclusion({ ...newExclusion, player1Id: e.target.value })}
                className="flex-1 bg-white/10 text-white rounded-lg px-3 py-2.5 text-sm border border-white/10 focus:border-purple-400/50"
              >
                <option value="">Select player...</option>
                {players.map((p) => (
                  <option key={p.oderId} value={p.oderId}>{p.name}</option>
                ))}
              </select>

              <span className="hidden sm:flex items-center text-purple-300/60 px-2">≠</span>
              <span className="sm:hidden text-center text-purple-300/60 text-sm">cannot match with</span>

              <select
                value={newExclusion.player2Id}
                onChange={(e) => setNewExclusion({ ...newExclusion, player2Id: e.target.value })}
                className="flex-1 bg-white/10 text-white rounded-lg px-3 py-2.5 text-sm border border-white/10 focus:border-purple-400/50"
              >
                <option value="">Select player...</option>
                {players.filter(p => p.oderId !== newExclusion.player1Id).map((p) => (
                  <option key={p.oderId} value={p.oderId}>{p.name}</option>
                ))}
              </select>

              <button
                onClick={handleAddExclusion}
                disabled={!newExclusion.player1Id || !newExclusion.player2Id}
                className="btn-primary py-2.5 text-sm sm:px-4"
              >
                Add
              </button>
            </div>

            {/* Exclusion List */}
            {exclusions.length > 0 && (
              <ul className="space-y-2">
                {exclusions.map((exc, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between bg-white/5 px-3 py-2.5 rounded-lg text-sm border border-white/5 animate-fade-in"
                  >
                    <span className="text-white flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{getPlayerName(exc.player1Id)}</span>
                      <span className="text-purple-400">✗</span>
                      <span className="font-medium">{getPlayerName(exc.player2Id)}</span>
                    </span>
                    <button
                      onClick={() => handleRemoveExclusion(i)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded transition-colors"
                      aria-label="Remove exclusion"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
          onClick={handleStartMatching}
          disabled={processing}
          className="btn-success w-full text-base"
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating Matches...
            </span>
          ) : (
            'Start Word Assignment →'
          )}
        </button>
      </div>
    </div>
  );
}

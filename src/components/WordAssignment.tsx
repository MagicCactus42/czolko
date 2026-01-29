import { useState } from 'react';
import type { Player } from '../types';
import { assignWordToPlayer } from '../firebase';

interface WordAssignmentProps {
  lobbyId: string;
  currentPlayer: Player;
  players: Player[];
}

const suggestions = [
  'Famous person',
  'Fictional character',
  'Historical figure',
  'Celebrity',
  'Animal',
  'Object',
];

export function WordAssignment({ lobbyId, currentPlayer, players }: WordAssignmentProps) {
  const [word, setWord] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const matchedPlayer = players.find(p => p.oderId === currentPlayer.matchedWithId);
  const hasAlreadyAssigned = matchedPlayer?.wordAssignedById === currentPlayer.oderId;

  const handleSubmit = async () => {
    if (!matchedPlayer || !word.trim()) return;

    setSubmitting(true);
    try {
      await assignWordToPlayer(lobbyId, matchedPlayer.oderId, word.trim(), currentPlayer.oderId);
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to assign word:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (hasAlreadyAssigned || submitted) {
    return (
      <div className="card border-green-500/30 bg-green-500/10 animate-scale-in">
        <div className="text-center py-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/20 mb-3">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-green-300 font-medium text-lg">
            Word assigned to {matchedPlayer?.name}!
          </p>
          <p className="text-green-200/60 text-sm mt-1">
            Waiting for other players to assign words...
          </p>
        </div>
      </div>
    );
  }

  if (!matchedPlayer) {
    return (
      <div className="card border-red-500/30 bg-red-500/10">
        <div className="text-center py-2">
          <span className="text-3xl mb-2 block">⚠️</span>
          <p className="text-red-300">Error: No match found. Please contact the host.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card animate-slide-up">
      <div className="mb-4">
        <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
          <span className="text-xl">✏️</span>
          Assign a Word
        </h3>
        <p className="text-purple-200/70 text-sm mt-2">
          Choose something for{' '}
          <span className="font-semibold text-white bg-purple-500/30 px-2 py-0.5 rounded">
            {matchedPlayer.name}
          </span>{' '}
          to guess. Be creative!
        </p>
      </div>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-2 mb-4">
        {suggestions.map((suggestion) => (
          <span
            key={suggestion}
            className="text-xs text-purple-300/60 bg-white/5 px-2 py-1 rounded-full"
          >
            {suggestion}
          </span>
        ))}
      </div>

      {/* Input Form */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && word.trim() && handleSubmit()}
          placeholder="e.g., Donald Trump, Shrek, A banana..."
          className="input text-base"
          disabled={submitting}
          autoFocus
        />
        <button
          onClick={handleSubmit}
          disabled={!word.trim() || submitting}
          className="btn-primary whitespace-nowrap"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Submitting...
            </span>
          ) : (
            'Submit'
          )}
        </button>
      </div>

      {/* Tip */}
      <p className="text-purple-300/40 text-xs mt-3 text-center">
        Tip: Choose something that's not too easy or too hard to guess!
      </p>
    </div>
  );
}

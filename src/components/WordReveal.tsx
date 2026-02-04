import type { Player } from '../types';

interface WordRevealProps {
  players: Player[];
  currentPlayerId: string;
}

// Generate a consistent color based on string
function getColorForSeat(seatNumber: number): string {
  const colors = [
    'border-l-purple-400',
    'border-l-pink-400',
    'border-l-blue-400',
    'border-l-green-400',
    'border-l-yellow-400',
    'border-l-orange-400',
    'border-l-red-400',
    'border-l-cyan-400',
    'border-l-indigo-400',
    'border-l-emerald-400',
  ];
  return colors[(seatNumber - 1) % colors.length];
}

export function WordReveal({ players, currentPlayerId }: WordRevealProps) {
  const sortedPlayers = [...players].sort((a, b) => (a.seatNumber ?? 999) - (b.seatNumber ?? 999));

  return (
    <div className="card animate-slide-up">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
          <span className="text-xl">🎭</span>
          Who Is Who?
        </h3>
        <p className="text-purple-200/70 text-sm mt-1">
          Everyone can see what others have to guess, but your word is hidden!
        </p>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-2">
        {sortedPlayers.map((player) => {
          const isCurrentPlayer = player.oderId === currentPlayerId;
          const assigner = players.find(p => p.oderId === player.wordAssignedById);
          const borderColor = getColorForSeat(player.seatNumber ?? 1);

          return (
            <div
              key={player.oderId}
              className={`
                relative rounded-xl p-3 border-l-4 ${borderColor}
                ${isCurrentPlayer
                  ? 'bg-purple-500/20 border border-purple-400/30'
                  : 'bg-white/5 border border-white/5'
                }
                animate-fade-in
              `}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Player Info */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${isCurrentPlayer ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/80'}
                  `}>
                    {player.seatNumber ?? '?'}
                  </div>
                  <div className="min-w-0">
                    <span className="text-white font-medium block truncate">
                      {player.name}
                    </span>
                    {isCurrentPlayer && (
                      <span className="text-purple-300 text-xs">(You)</span>
                    )}
                  </div>
                </div>

                {/* Word */}
                <div className="text-right flex-shrink-0">
                  {isCurrentPlayer ? (
                    <span className="text-2xl font-bold text-purple-400 animate-pulse">???</span>
                  ) : (
                    <div>
                      <span className="text-white font-bold block">
                        {player.wordToGuess ?? '—'}
                      </span>
                      {assigner && (
                        <span className="text-purple-300/60 text-xs">
                          by {assigner.name}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="text-left text-purple-200 text-sm font-medium py-3 px-4">Player</th>
              <th className="text-left text-purple-200 text-sm font-medium py-3 px-4">Has to Guess</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedPlayers.map((player) => {
              const isCurrentPlayer = player.oderId === currentPlayerId;
              const assigner = players.find(p => p.oderId === player.wordAssignedById);

              return (
                <tr
                  key={player.oderId}
                  className={`transition-colors ${isCurrentPlayer ? 'bg-purple-500/10' : 'hover:bg-white/5'}`}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-10 h-10 rounded-xl flex items-center justify-center font-bold
                        ${isCurrentPlayer
                          ? 'bg-purple-500 text-white shadow-glow-sm'
                          : 'bg-white/10 text-white/80'
                        }
                      `}>
                        {player.seatNumber ?? '?'}
                      </div>
                      <div>
                        <span className="text-white font-medium block">
                          {player.name}
                        </span>
                        {isCurrentPlayer && (
                          <span className="text-purple-300 text-xs">That's you!</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {isCurrentPlayer ? (
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-purple-400 animate-pulse">???</span>
                        <span className="text-purple-300/50 text-sm">It's a mystery!</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-lg">
                          {player.wordToGuess ?? '—'}
                        </span>
                        {assigner && (
                          <span className="badge-primary">
                            by {assigner.name}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import type { Player } from '../types';

interface PlayerListProps {
  players: Player[];
  currentPlayerId?: string;
  ownerId: string;
  showSeats?: boolean;
}

// Generate avatar color based on name
function getAvatarColor(name: string): string {
  const colors = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-yellow-500',
    'from-red-500 to-pink-500',
    'from-indigo-500 to-purple-500',
    'from-teal-500 to-green-500',
    'from-rose-500 to-orange-500',
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function PlayerList({ players, currentPlayerId, ownerId, showSeats = false }: PlayerListProps) {
  const sortedPlayers = showSeats
    ? [...players].sort((a, b) => (a.seatNumber ?? 999) - (b.seatNumber ?? 999))
    : players;

  return (
    <div className="card">
      <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
        <span className="text-xl">👥</span>
        Players
        <span className="ml-auto badge-primary">
          {players.length}
        </span>
      </h3>

      <ul className="space-y-2 sm:space-y-3">
        {sortedPlayers.map((player, index) => {
          const isCurrentPlayer = player.oderId === currentPlayerId;
          const isOwner = player.oderId === ownerId;
          const avatarColor = getAvatarColor(player.name);

          return (
            <li
              key={player.oderId}
              className={`
                flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl
                transition-all duration-200 animate-fade-in
                ${isCurrentPlayer
                  ? 'bg-purple-500/20 border border-purple-400/50 shadow-glow-sm'
                  : 'bg-white/5 border border-white/5 hover:bg-white/10'
                }
              `}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className={`
                  relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center
                  text-white text-sm font-bold shadow-lg
                  bg-gradient-to-br ${avatarColor}
                `}>
                  {showSeats && player.seatNumber !== null ? (
                    player.seatNumber
                  ) : (
                    getInitials(player.name)
                  )}

                  {/* Online indicator */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-purple-950 animate-pulse-slow" />
                </div>

                {/* Name */}
                <div>
                  <span className="text-white font-medium block">
                    {player.name}
                  </span>
                  {isCurrentPlayer && (
                    <span className="text-purple-300 text-xs">That's you!</span>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2">
                {isOwner && (
                  <span className="badge-warning flex items-center gap-1">
                    <span>👑</span>
                    <span className="hidden sm:inline">Host</span>
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {players.length === 0 && (
        <p className="text-purple-300/60 text-center py-4 text-sm">
          No players yet. Share the link to invite friends!
        </p>
      )}
    </div>
  );
}

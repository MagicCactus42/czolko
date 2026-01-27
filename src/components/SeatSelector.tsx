import { useState, useEffect, useRef } from 'react';
import type { Player } from '../types';
import { getAvailableSeats } from '../utils/matching';
import { updatePlayerSeat } from '../firebase';

interface SeatSelectorProps {
  lobbyId: string;
  players: Player[];
  currentPlayer: Player;
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function SeatSelector({ lobbyId, players, currentPlayer }: SeatSelectorProps) {
  const [selecting, setSelecting] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const autoAssignAttempted = useRef(false);
  const availableSeats = getAvailableSeats(players, players.length);
  const seatedPlayersCount = players.filter(p => p.seatNumber !== null).length;

  useEffect(() => {
    if (currentPlayer.seatNumber !== null) {
      autoAssignAttempted.current = false;
      return;
    }

    if (
      availableSeats.length === 1 &&
      !selecting &&
      !autoAssignAttempted.current
    ) {
      const lastSeat = availableSeats[0];
      autoAssignAttempted.current = true;
      setSelecting(true);
      setSelectedSeat(lastSeat);

      updatePlayerSeat(lobbyId, currentPlayer.oderId, lastSeat)
        .catch((error) => {
          console.error('Failed to auto-assign seat:', error);
          setSelectedSeat(null);
          autoAssignAttempted.current = false;
        })
        .finally(() => {
          setSelecting(false);
        });
    }
  }, [seatedPlayersCount, currentPlayer.seatNumber, currentPlayer.oderId, lobbyId, selecting, availableSeats]);

  const handleSelectSeat = async (seatNumber: number) => {
    setSelecting(true);
    setSelectedSeat(seatNumber);
    try {
      await updatePlayerSeat(lobbyId, currentPlayer.oderId, seatNumber);
    } catch (error) {
      console.error('Failed to select seat:', error);
      setSelectedSeat(null);
    } finally {
      setSelecting(false);
    }
  };

  if (selecting && availableSeats.length === 1) {
    return (
      <div className="card border-purple-500/30 bg-purple-500/10 animate-scale-in">
        <div className="text-center py-2">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-purple-500/20 border-2 border-purple-400 mb-3">
            <svg className="animate-spin h-8 w-8 text-purple-300" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-purple-300 font-medium text-lg">
            Auto-assigning seat #{selectedSeat}...
          </p>
          <p className="text-purple-200/60 text-sm mt-1">
            Only one seat remaining
          </p>
        </div>
      </div>
    );
  }

  if (currentPlayer.seatNumber !== null) {
    return (
      <div className="card border-green-500/30 bg-green-500/10 animate-scale-in">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-green-500/20 border-2 border-green-400 mb-3">
            <span className="text-3xl sm:text-4xl font-bold text-green-300">
              {currentPlayer.seatNumber}
            </span>
          </div>
          <p className="text-green-300 font-medium text-lg">
            You're in seat #{currentPlayer.seatNumber}
          </p>
          <p className="text-green-200/60 text-sm mt-1">
            Waiting for other players to select seats...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card animate-slide-up">
      <div className="mb-4">
        <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
          <span className="text-xl">💺</span>
          Select Your Seat
        </h3>
        <p className="text-purple-200/70 text-sm mt-1">
          Your seat determines who you'll be matched with
        </p>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 sm:gap-3">
        {Array.from({ length: players.length }, (_, i) => i + 1).map((seatNum) => {
          const isAvailable = availableSeats.includes(seatNum);
          const takenBy = players.find(p => p.seatNumber === seatNum);
          const isSelecting = selecting && selectedSeat === seatNum;

          return (
            <button
              key={seatNum}
              onClick={() => isAvailable && !selecting && handleSelectSeat(seatNum)}
              disabled={!isAvailable || selecting}
              className={`
                relative aspect-square rounded-xl font-bold text-lg sm:text-xl
                transition-all duration-200 border-2
                ${isAvailable
                  ? 'bg-purple-600/80 hover:bg-purple-500 border-purple-400/50 hover:border-purple-300 text-white cursor-pointer hover:scale-105 active:scale-95 shadow-lg shadow-purple-900/30'
                  : 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                }
                ${isSelecting ? 'animate-pulse scale-105' : ''}
              `}
              title={takenBy ? `Taken by ${takenBy.name}` : `Select seat ${seatNum}`}
            >
              {isAvailable ? (
                <span className="drop-shadow-md">{seatNum}</span>
              ) : (
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <span className="text-xs sm:text-sm opacity-60">{seatNum}</span>
                  {takenBy && (
                    <span className="text-[10px] sm:text-xs font-medium truncate max-w-full px-1 opacity-80">
                      {getInitials(takenBy.name)}
                    </span>
                  )}
                </div>
              )}

              {isSelecting && (
                <span className="absolute inset-0 flex items-center justify-center bg-purple-600/50 rounded-xl">
                  <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t border-white/10 text-xs text-purple-300/60">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-purple-600 border border-purple-400/50"></span>
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-white/5 border border-white/10"></span>
          Taken
        </span>
      </div>

      {availableSeats.length === 1 && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
          <p className="text-yellow-200 text-sm">
            You're the last one! If your seat doesn't auto-assign, please{' '}
            <button
              onClick={() => window.location.reload()}
              className="underline hover:text-yellow-100"
            >
              refresh the page
            </button>
          </p>
        </div>
      )}
    </div>
  );
}

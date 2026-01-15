import { useState } from 'react';
import { signInWithGoogle, signOutUser } from '../firebase';
import { useAuth } from '../hooks/useAuth';

interface AuthButtonProps {
  onAuthSuccess?: () => void;
  compact?: boolean;
}

export function AuthButton({ onAuthSuccess, compact = false }: AuthButtonProps) {
  const { user, loading } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle();
      onAuthSuccess?.();
    } catch (err) {
      console.error('Google sign-in failed:', err);
      setError('Failed to sign in with Google');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <svg className="animate-spin h-5 w-5 text-purple-400" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (user) {
    return (
      <div className={`flex items-center gap-3 ${compact ? '' : 'p-3 bg-white/5 rounded-xl'}`}>
        {user.photoURL && (
          <img
            src={user.photoURL}
            alt=""
            className="w-8 h-8 rounded-full"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">
            {user.displayName || user.email}
          </p>
          {!compact && (
            <p className="text-purple-300/60 text-xs">Signed in</p>
          )}
        </div>
        <button
          onClick={handleSignOut}
          className="text-purple-300/60 hover:text-white text-sm transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-purple-200 text-sm text-center">
        Sign in to create a room
      </p>

      <button
        onClick={handleGoogleSignIn}
        disabled={signingIn}
        className="flex items-center justify-center gap-3 w-full bg-white text-gray-800 font-medium py-2.5 px-4 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {signingIn ? 'Signing in...' : 'Continue with Google'}
      </button>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-3 py-2 rounded-lg text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
}

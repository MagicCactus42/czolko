import { useState, useEffect } from 'react';
import { type User } from 'firebase/auth';
import { onAuthChange } from '../firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setState({ user, loading: false });
    });

    return unsubscribe;
  }, []);

  return state;
}

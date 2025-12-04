import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

type PrivateKeyState = {
  privateKey: string | null;
  isLoading: boolean;
  fetchPrivateKey: () => Promise<void>;
  clearPrivateKey: () => void;
};

const PrivateKeyContext = createContext<PrivateKeyState | undefined>(undefined);

export function usePrivateKey(): PrivateKeyState {
  const context = useContext(PrivateKeyContext);
  if (!context) {
    throw new Error('usePrivateKey must be used within a PrivateKeyProvider');
  }
  return context;
}

type PrivateKeyProviderProps = {
  children: ReactNode;
};

export function PrivateKeyProvider({ children }: PrivateKeyProviderProps) {
  const { user } = useAuth();
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPrivateKey = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setPrivateKey(null);

    try {
      const { data, error } = await supabase
        .from('key_pairs')
        .select('private_key_encrypted')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error) {
        // It's okay if no key is found, it might not have been generated yet.
        if (error.code !== 'PGRST116') {
          console.error('Error fetching private key:', error);
        }
      }

      if (data) {
        // NOTE: The private key is not actually encrypted in the database.
        // This should be addressed in a future update.
        setPrivateKey(data.private_key_encrypted);
      }
    } catch (err) {
      console.error('Unexpected error fetching private key:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const clearPrivateKey = () => {
    setPrivateKey(null);
  };

  useEffect(() => {
    if (user) {
      fetchPrivateKey();
    } else {
      clearPrivateKey();
    }
  }, [user, fetchPrivateKey]);

  const value = {
    privateKey,
    isLoading,
    fetchPrivateKey,
    clearPrivateKey,
  };

  return (
    <PrivateKeyContext.Provider value={value}>
      {children}
    </PrivateKeyContext.Provider>
  );
}

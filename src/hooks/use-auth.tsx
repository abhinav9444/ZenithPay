'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import type { User } from '@/lib/types';
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { addUser, getUser } from '@/lib/actions';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: (FirebaseUser & { accountNumber?: string }) | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthContextType['user'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // After first login, ensure user exists in our mock DB
        await addUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || 'Anonymous',
          photoURL: firebaseUser.photoURL || `https://picsum.photos/seed/${firebaseUser.uid}/100/100`,
        });
        // Fetch the full user object with account number
        const appUser = await getUser(firebaseUser.uid);
        setUser({ ...firebaseUser, accountNumber: appUser?.accountNumber });

      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google', error);
    } finally {
      // setLoading will be handled by onAuthStateChanged
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

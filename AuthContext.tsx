import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserData } from '../types';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: UserData | null;
  isAdmin: boolean;
  loading: boolean;
  login: (user: UserData) => Promise<void>;
  adminLogin: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const savedAdmin = localStorage.getItem('club_admin');
        if (savedAdmin === 'true') {
          setIsAdmin(true);
          setUser(null);
        } else {
          const savedUserId = localStorage.getItem('club_user_id');
          if (savedUserId) {
            const userDoc = await getDoc(doc(db, 'users', savedUserId));
            if (userDoc.exists()) {
              setUser({ ...userDoc.data(), id: userDoc.id } as UserData);
              setIsAdmin(false);
            }
          }
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (userData: UserData) => {
    await signInAnonymously(auth);
    setUser(userData);
    setIsAdmin(false);
    localStorage.setItem('club_user_id', userData.id);
    localStorage.removeItem('club_admin');
  };

  const adminLogin = async () => {
    await signInAnonymously(auth);
    setIsAdmin(true);
    setUser(null);
    localStorage.setItem('club_admin', 'true');
    localStorage.removeItem('club_user_id');
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('club_user_id');
    localStorage.removeItem('club_admin');
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, login, adminLogin, logout }}>
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

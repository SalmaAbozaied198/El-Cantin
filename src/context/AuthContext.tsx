import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { User } from '../types';
import { StorageService } from '../services/storage';
import { getFirebaseInstance } from '../config/firebase';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  isAdmin: boolean;
  loginUser: (user: User) => Promise<void>;
  signInWithFirebase: (email: string, pass: string) => Promise<User>;
  signUpWithFirebase: (name: string, email: string, pass: string, role: 'admin' | 'user') => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  addUser: (name: string, email: string, role: 'admin' | 'user') => Promise<User>;
  deleteUser: (userId: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const { auth } = getFirebaseInstance();
    let unsubscribe: (() => void) | undefined;

    if (auth) {
      unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser && fbUser.email) {
          const storedUsers = await StorageService.getStoredUsers();
          let localUser = storedUsers.find((u) => u.email.toLowerCase() === fbUser.email?.toLowerCase());

          if (!localUser) {
            localUser = {
              id: fbUser.uid,
              name: fbUser.displayName || fbUser.email.split('@')[0],
              email: fbUser.email,
              role: 'admin',
              firebaseUid: fbUser.uid,
            };
            const updated = [...storedUsers, localUser];
            await StorageService.saveUsers(updated);
            setUsers(updated);
          }
          await StorageService.setCurrentUser(localUser);
          setCurrentUser(localUser);
        } else {
          // Firebase reports signed out -> clear active session
          await StorageService.setCurrentUser(null);
          setCurrentUser(null);
        }
        setIsLoading(false);
      });
    } else {
      loadUserData();
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loadUserData = async () => {
    try {
      const storedUsers = await StorageService.getStoredUsers();
      const current = await StorageService.getCurrentUser();
      setUsers(storedUsers);
      setCurrentUser(current);
    } catch (err) {
      console.error('Failed to load user data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithFirebase = async (email: string, pass: string): Promise<User> => {
    const { auth } = getFirebaseInstance();
    if (!auth) throw new Error('Firebase Auth is not configured');

    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const fbUser = cred.user;

    const storedUsers = await StorageService.getStoredUsers();
    let localUser = storedUsers.find((u) => u.email.toLowerCase() === fbUser.email?.toLowerCase());

    if (!localUser) {
      localUser = {
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
        email: fbUser.email || email,
        role: 'admin',
        firebaseUid: fbUser.uid,
      };
      const updated = [...storedUsers, localUser];
      await StorageService.saveUsers(updated);
      setUsers(updated);
    }

    await StorageService.setCurrentUser(localUser);
    setCurrentUser(localUser);
    return localUser;
  };

  const signUpWithFirebase = async (
    name: string,
    email: string,
    pass: string,
    role: 'admin' | 'user'
  ): Promise<User> => {
    const { auth } = getFirebaseInstance();
    if (!auth) throw new Error('Firebase Auth is not configured');

    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const fbUser = cred.user;

    const newUser: User = {
      id: fbUser.uid,
      name: name.trim(),
      email: fbUser.email || email.trim(),
      role,
      firebaseUid: fbUser.uid,
    };

    const storedUsers = await StorageService.getStoredUsers();
    const updated = [...storedUsers.filter((u) => u.email.toLowerCase() !== newUser.email.toLowerCase()), newUser];
    await StorageService.saveUsers(updated);
    await StorageService.setCurrentUser(newUser);

    setUsers(updated);
    setCurrentUser(newUser);
    return newUser;
  };

  const resetPassword = async (email: string): Promise<void> => {
    const { auth } = getFirebaseInstance();
    if (!auth) throw new Error('Firebase Auth is not configured');
    await sendPasswordResetEmail(auth, email.trim());
  };

  const loginUser = async (user: User) => {
    setCurrentUser(user);
    await StorageService.setCurrentUser(user);
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === user.id);
      if (!exists) {
        const next = [...prev, user];
        StorageService.saveUsers(next);
        return next;
      }
      return prev;
    });
  };

  const switchUser = async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      await loginUser(target);
    }
  };

  const addUser = async (name: string, email: string, role: 'admin' | 'user'): Promise<User> => {
    const newUser: User = {
      id: `user_${Date.now()}`,
      name,
      email,
      role,
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    await StorageService.saveUsers(updatedUsers);
    await StorageService.setCurrentUser(newUser);
    setCurrentUser(newUser);
    return newUser;
  };

  const deleteUser = async (userId: string) => {
    const updatedUsers = users.filter((u) => u.id !== userId);
    setUsers(updatedUsers);
    await StorageService.saveUsers(updatedUsers);

    if (currentUser?.id === userId) {
      if (updatedUsers.length > 0) {
        await loginUser(updatedUsers[0]);
      } else {
        await logoutUser();
      }
    }
  };

  const logoutUser = async () => {
    await StorageService.setCurrentUser(null);
    setCurrentUser(null);
    const { auth } = getFirebaseInstance();
    if (auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn('Sign out error:', e);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isAdmin: currentUser?.role === 'admin',
        loginUser,
        signInWithFirebase,
        signUpWithFirebase,
        resetPassword,
        switchUser,
        addUser,
        deleteUser,
        logoutUser,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

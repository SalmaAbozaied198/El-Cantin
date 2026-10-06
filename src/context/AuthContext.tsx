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
    // 1. Immediately restore local session on startup or refresh
    const initSession = async () => {
      try {
        const storedUsers = await StorageService.getStoredUsers();
        const current = await StorageService.getCurrentUser();
        setUsers(storedUsers);
        if (current) {
          setCurrentUser(current);
        }
      } catch (err) {
        console.error('Failed to load user data on startup:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    // 2. Connect Firebase Auth listener to keep cloud user in sync
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
          // If Firebase reports null (e.g. offline or email/password not in cloud), keep active local user
          const localCurrent = await StorageService.getCurrentUser();
          if (localCurrent) {
            setCurrentUser(localCurrent);
          }
        }
      });
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
    const cleanEmail = email.trim().toLowerCase();
    const storedUsers = await StorageService.getStoredUsers();
    const localUser = storedUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    // If locally stored user exists with a password, verify it
    if (localUser && localUser.password && localUser.password !== pass) {
      throw new Error('Incorrect password. Please try again.');
    }

    const { auth } = getFirebaseInstance();
    let fbUid: string | undefined = localUser?.firebaseUid;

    if (auth) {
      try {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
        fbUid = cred.user.uid;
      } catch (err: any) {
        console.warn('Firebase signIn notice:', err?.message || err);
        if (!localUser) {
          if (
            err.message?.includes('invalid-credential') ||
            err.message?.includes('user-not-found') ||
            err.message?.includes('wrong-password')
          ) {
            throw new Error('Invalid email or password.');
          }
          if (
            err.message?.includes('CONFIGURATION_NOT_FOUND') ||
            err.code === 'auth/configuration-not-found'
          ) {
            throw new Error('Account not found locally. Please register a new account.');
          }
          throw err;
        }
        // If local user matched password, continue in offline/local mode
      }
    }

    if (!localUser && !fbUid) {
      throw new Error('Account not found. Please register first.');
    }

    const finalUser: User = localUser
      ? { ...localUser, firebaseUid: fbUid || localUser.firebaseUid }
      : {
          id: fbUid || `user_${Date.now()}`,
          name: cleanEmail.split('@')[0],
          email: cleanEmail,
          role: 'admin',
          firebaseUid: fbUid,
        };

    const updated = [
      ...storedUsers.filter((u) => u.email.toLowerCase() !== cleanEmail),
      finalUser,
    ];
    await StorageService.saveUsers(updated);
    await StorageService.setCurrentUser(finalUser);
    setUsers(updated);
    setCurrentUser(finalUser);
    return finalUser;
  };

  const signUpWithFirebase = async (
    name: string,
    email: string,
    pass: string,
    role: 'admin' | 'user'
  ): Promise<User> => {
    const cleanEmail = email.trim().toLowerCase();
    const storedUsers = await StorageService.getStoredUsers();

    if (storedUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error('This email is already registered. Please sign in instead.');
    }

    const { auth } = getFirebaseInstance();
    let fbUid: string | undefined;

    if (auth) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
        fbUid = cred.user.uid;
      } catch (err: any) {
        console.warn('Firebase signUp notice:', err?.message || err);
        if (
          err.message?.includes('email-already-in-use') ||
          err.code === 'auth/email-already-in-use'
        ) {
          throw new Error('This email is already in use. Please sign in instead.');
        }
        // If CONFIGURATION_NOT_FOUND or offline, smoothly fallback to local credentials
      }
    }

    const newUser: User = {
      id: fbUid || `user_${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      role,
      firebaseUid: fbUid,
      password: pass,
    };

    const updated = [
      ...storedUsers.filter((u) => u.email.toLowerCase() !== cleanEmail),
      newUser,
    ];
    await StorageService.saveUsers(updated);
    await StorageService.setCurrentUser(newUser);

    setUsers(updated);
    setCurrentUser(newUser);
    return newUser;
  };

  const resetPassword = async (email: string): Promise<void> => {
    const cleanEmail = email.trim().toLowerCase();
    const storedUsers = await StorageService.getStoredUsers();
    const userExists = storedUsers.some((u) => u.email.toLowerCase() === cleanEmail);

    const { auth } = getFirebaseInstance();
    if (auth) {
      try {
        await sendPasswordResetEmail(auth, cleanEmail);
        return;
      } catch (err: any) {
        console.warn('Firebase reset password notice:', err?.message || err);
        if (!userExists && (err.message?.includes('user-not-found') || err.code === 'auth/user-not-found')) {
          throw new Error('No user found with this email address.');
        }
      }
    }

    if (!userExists) {
      throw new Error('No user found with this email address.');
    }
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

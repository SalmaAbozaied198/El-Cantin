import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { StorageService } from '../services/storage';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  isAdmin: boolean;
  loginUser: (user: User) => Promise<void>;
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
    loadUserData();
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

  const loginUser = async (user: User) => {
    setCurrentUser(user);
    await StorageService.setCurrentUser(user);
    // Ensure the logged-in user is saved into the stored users list
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
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isAdmin: currentUser?.role === 'admin',
        loginUser,
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

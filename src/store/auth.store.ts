/**
 * Authentication Store
 * Manages user authentication state using Zustand
 */

import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {UserRole} from '../types';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (
    username: string,
    email: string,
    password: string,
    role: UserRole,
    firstName: string,
    lastName: string,
    phone?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (username: string, password: string) => {
        set({isLoading: true});
        try {
          const {authenticateUser} = await import('../services/auth');
          const user = await authenticateUser(username, password);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({isLoading: false});
          // If database error, show helpful message
          if (error?.message?.includes('Database not available') || 
              error?.message?.includes('development build')) {
            throw new Error(
              'Database not available. This app requires a development build.\n\n' +
              'To enable login functionality, run:\n' +
              'npx expo run:ios\n\n' +
              'The UI is available for preview without database.'
            );
          }
          throw error;
        }
      },

      signup: async (
        username: string,
        email: string,
        password: string,
        role: UserRole,
        firstName: string,
        lastName: string,
        phone?: string,
      ) => {
        set({isLoading: true});
        try {
          const {createUser} = await import('../services/auth');
          const user = await createUser(
            username,
            email,
            password,
            role,
            firstName,
            lastName,
            phone,
          );

          // After successful signup, automatically log in the user
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({isLoading: false});
          // If database error, show helpful message
          if (error?.message?.includes('Database not available') || 
              error?.message?.includes('development build')) {
            throw new Error(
              'Database not available. This app requires a development build.\n\n' +
              'To enable signup functionality, run:\n' +
              'npx expo run:ios\n\n' +
              'The UI is available for preview without database.'
            );
          }
          throw error;
        }
      },

      logout: async () => {
        set({
          user: null,
          isAuthenticated: false,
        });
        // Clear AsyncStorage
        await AsyncStorage.multiRemove([
          'auth-storage',
          '@dentalapp:user',
          '@dentalapp:token',
        ]);
      },

      setUser: (user: User) => {
        set({
          user,
          isAuthenticated: true,
        });
      },

      checkAuth: async () => {
        // Check if user is still authenticated
        // This will be called on app startup
        const {user} = get();
        if (user) {
          set({isAuthenticated: true});
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);


import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  username: string;
  isAdmin: boolean;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// This is a simplified auth implementation - in a real app, you would use proper authentication
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      
      login: async (username: string, password: string) => {
        // For demo purposes, hardcoded admin credentials
        // In a real application, you would validate against a server
        if (username === 'admin' && password === 'admin123') {
          set({ 
            user: { username, isAdmin: true },
            isAuthenticated: true 
          });
          return true;
        }
        return false;
      },
      
      logout: () => {
        set({ user: null, isAuthenticated: false });
      }
    }),
    {
      name: 'vinc-auth-storage',
    }
  )
);

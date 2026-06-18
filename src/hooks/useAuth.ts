import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppUser } from '../types/database';
import { authService, type AuthUser } from '../services/auth.service';

interface AuthState {
  user: AuthUser | null;
  appUser: AppUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  setUser: (user: AuthUser | null) => void;
  setAppUser: (appUser: AppUser | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      appUser: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,

      setUser: (user) => set({
        user,
        isAuthenticated: !!user,
        appUser: user?.appUser || null
      }),

      setAppUser: (appUser) => set({ appUser }),

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { session, user, appUser } = await authService.signIn(email, password);
          set({
            user: { id: user.id, email: user.email || '', appUser },
            appUser,
            isAuthenticated: !!session,
            isLoading: false
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Login failed';
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.signOut();
          set({
            user: null,
            appUser: null,
            isAuthenticated: false,
            isLoading: false
          });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      resetPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
          await authService.resetPassword(email);
          set({ isLoading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Password reset failed';
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      updatePassword: async (password) => {
        set({ isLoading: true, error: null });
        try {
          await authService.updatePassword(password);
          set({ isLoading: false });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Password update failed';
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const user = await authService.getCurrentUser();
          set({
            user,
            appUser: user?.appUser || null,
            isAuthenticated: !!user,
            isLoading: false
          });
        } catch {
          set({
            user: null,
            appUser: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'pms-auth',
      partialize: (state) => ({
        user: state.user,
        appUser: state.appUser,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export const useAuth = () => {
  const store = useAuthStore();
  return {
    user: store.user,
    appUser: store.appUser,
    isLoading: store.isLoading,
    isAuthenticated: store.isAuthenticated,
    error: store.error,
    login: store.login,
    logout: store.logout,
    resetPassword: store.resetPassword,
    updatePassword: store.updatePassword,
    checkAuth: store.checkAuth,
    clearError: store.clearError,
    hasRole: (role: string) => {
      const roleHierarchy: Record<string, number> = {
        'ADMIN': 5,
        'SPV': 4,
        'MANDOR': 3,
        'DRYER_OPERATOR': 2,
        'PACKING_OPERATOR': 2
      };
      const userRole = store.appUser?.role;
      if (!userRole) return false;
      return (roleHierarchy[userRole] || 0) >= (roleHierarchy[role] || 0);
    }
  };
};

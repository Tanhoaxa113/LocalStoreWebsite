/**
 * Authentication Store - Zustand
 * Manages user authentication state and token
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    phone_number?: string;
    avatar?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    setAuth: (user: User, token: string) => void;
    clearAuth: () => void;
    setLoading: (loading: boolean) => void;
    updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,

            setAuth: (user, token) => {
                // Store in zustand
                set({
                    user,
                    token,
                    isAuthenticated: true,
                });
                // Sync with localStorage for API interceptor
                if (typeof window !== 'undefined') {
                    localStorage.setItem('auth_token', token);
                }
            },

            clearAuth: () => {
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                });
                // Clear from localStorage
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('auth_token');
                }
            },

            setLoading: (loading) => set({ isLoading: loading }),

            updateUser: (userData) => set((state) => ({
                user: state.user ? { ...state.user, ...userData } : null,
            })),
        }),
        {
            name: 'auth-storage', // localStorage key
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

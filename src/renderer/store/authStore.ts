import { create } from 'zustand';
import { User, LoginDto } from '../../shared/types/entities';
import { IpcChannels } from '../../shared/types/ipc';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (credentials: LoginDto) => Promise<void>;
    logout: () => void;
    setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
            const user = await window.api.auth.login(credentials);
            set({ user, isAuthenticated: true, isLoading: false });
        } catch (err: any) {
            set({
                error: err.message || 'Login failed',
                isLoading: false,
                isAuthenticated: false,
            });
            throw err;
        }
    },

    logout: () => {
        set({ user: null, isAuthenticated: false });
        // In a real app we might call backend to invalidate session too
    },

    setError: (error) => set({ error }),
}));

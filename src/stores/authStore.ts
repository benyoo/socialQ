// Auth store — manages authentication state
import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '../config/supabase';

interface AuthState {
    session: Session | null;
    user: User | null;
    isLoading: boolean;
    isInitialized: boolean;

    initialize: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    session: null,
    user: null,
    isLoading: false,
    isInitialized: false,

    initialize: async () => {
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            set({
                session,
                user: session?.user ?? null,
                isInitialized: true,
            });

            // Listen for auth state changes
            supabase.auth.onAuthStateChange((_event, session) => {
                set({ session, user: session?.user ?? null });
            });
        } catch (error) {
            console.error('Auth initialization error:', error);
            set({ isInitialized: true });
        }
    },

    signIn: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            set({ isLoading: false });
            return { error: error ? new Error(error.message) : null };
        } catch (error) {
            set({ isLoading: false });
            return { error: error as Error };
        }
    },

    signUp: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
            const { error } = await supabase.auth.signUp({ email, password });
            set({ isLoading: false });
            return { error: error ? new Error(error.message) : null };
        } catch (error) {
            set({ isLoading: false });
            return { error: error as Error };
        }
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ session: null, user: null });
    },
}));

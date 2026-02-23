// Reminders store — manages reminder CRUD operations
import { create } from 'zustand';
import { supabase } from '../config/supabase';
import type { Reminder, ReminderFrequency } from '../types';

export interface ReminderFormData {
    person_id: string;
    message: string;
    frequency: ReminderFrequency;
    next_due_at: string;
}

export interface ReminderWithPerson extends Reminder {
    person?: {
        id: string;
        name: string;
        avatar_url?: string;
    };
}

interface RemindersState {
    reminders: ReminderWithPerson[];
    isLoading: boolean;
    error: string | null;

    fetchReminders: () => Promise<void>;
    addReminder: (data: ReminderFormData) => Promise<Reminder | null>;
    updateReminder: (id: string, data: Partial<ReminderFormData>) => Promise<boolean>;
    deleteReminder: (id: string) => Promise<boolean>;
    toggleReminder: (id: string) => Promise<boolean>;
    getDueSoon: (withinDays?: number) => ReminderWithPerson[];
}

export const useRemindersStore = create<RemindersState>((set, get) => ({
    reminders: [],
    isLoading: false,
    error: null,

    fetchReminders: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('reminders')
                .select(`
                    *,
                    people (id, name, avatar_url)
                `)
                .order('next_due_at', { ascending: true });

            if (error) throw error;

            const reminders: ReminderWithPerson[] = (data ?? []).map((r: any) => ({
                ...r,
                person: r.people ?? undefined,
            }));

            set({ reminders, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    addReminder: async (formData: ReminderFormData) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('reminders')
                .insert({ ...formData, user_id: user.id })
                .select()
                .single();

            if (error) throw error;
            await get().fetchReminders();
            return data;
        } catch (error) {
            set({ error: (error as Error).message });
            return null;
        }
    },

    updateReminder: async (id: string, formData: Partial<ReminderFormData>) => {
        try {
            const { error } = await supabase
                .from('reminders')
                .update(formData)
                .eq('id', id);

            if (error) throw error;
            await get().fetchReminders();
            return true;
        } catch (error) {
            set({ error: (error as Error).message });
            return false;
        }
    },

    deleteReminder: async (id: string) => {
        try {
            const { error } = await supabase.from('reminders').delete().eq('id', id);
            if (error) throw error;
            set((state) => ({
                reminders: state.reminders.filter((r) => r.id !== id),
            }));
            return true;
        } catch (error) {
            set({ error: (error as Error).message });
            return false;
        }
    },

    toggleReminder: async (id: string) => {
        const reminder = get().reminders.find((r) => r.id === id);
        if (!reminder) return false;

        try {
            const { error } = await supabase
                .from('reminders')
                .update({ is_active: !reminder.is_active })
                .eq('id', id);

            if (error) throw error;
            set((state) => ({
                reminders: state.reminders.map((r) =>
                    r.id === id ? { ...r, is_active: !r.is_active } : r
                ),
            }));
            return true;
        } catch (error) {
            set({ error: (error as Error).message });
            return false;
        }
    },

    getDueSoon: (withinDays = 7) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() + withinDays);
        return get().reminders.filter(
            (r) => r.is_active && new Date(r.next_due_at) <= cutoff
        );
    },
}));

// People store — manages people list and CRUD operations
import { create } from 'zustand';
import { supabase } from '../config/supabase';
import type { FilterOptions, Person, PersonFormData } from '../types';

interface PeopleState {
    people: Person[];
    isLoading: boolean;
    error: string | null;

    fetchPeople: () => Promise<void>;
    addPerson: (data: PersonFormData) => Promise<Person | null>;
    quickAddPerson: (name: string) => Promise<Person | null>;
    updatePerson: (id: string, data: Partial<PersonFormData>) => Promise<boolean>;
    deletePerson: (id: string) => Promise<boolean>;
    searchPeople: (query: string) => Person[];
    getPersonById: (id: string) => Person | undefined;
    filterPeople: (filters: FilterOptions) => Person[];
}

export const usePeopleStore = create<PeopleState>((set, get) => ({
    people: [],
    isLoading: false,
    error: null,

    fetchPeople: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('people')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            set({ people: data ?? [], isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    addPerson: async (formData: PersonFormData) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('people')
                .insert({ ...formData, user_id: user.id })
                .select()
                .single();

            if (error) throw error;
            set((state) => ({ people: [...state.people, data] }));
            return data;
        } catch (error) {
            set({ error: (error as Error).message });
            return null;
        }
    },

    quickAddPerson: async (name: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('people')
                .insert({
                    name: name.trim(),
                    relationship_type: 'acquaintance',
                    closeness_level: 3,
                    user_id: user.id,
                })
                .select()
                .single();

            if (error) throw error;
            set((state) => ({ people: [...state.people, data] }));
            return data;
        } catch (error) {
            set({ error: (error as Error).message });
            return null;
        }
    },

    updatePerson: async (id: string, formData: Partial<PersonFormData>) => {
        try {
            const { error } = await supabase
                .from('people')
                .update({ ...formData, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            set((state) => ({
                people: state.people.map((p) =>
                    p.id === id ? { ...p, ...formData } : p
                ),
            }));
            return true;
        } catch (error) {
            set({ error: (error as Error).message });
            return false;
        }
    },

    deletePerson: async (id: string) => {
        try {
            const { error } = await supabase.from('people').delete().eq('id', id);
            if (error) throw error;
            set((state) => ({ people: state.people.filter((p) => p.id !== id) }));
            return true;
        } catch (error) {
            set({ error: (error as Error).message });
            return false;
        }
    },

    searchPeople: (query: string) => {
        const lowerQuery = query.toLowerCase();
        return get().people.filter(
            (p) =>
                p.name.toLowerCase().includes(lowerQuery) ||
                p.nickname?.toLowerCase().includes(lowerQuery) ||
                p.email?.toLowerCase().includes(lowerQuery) ||
                p.phone?.includes(query)
        );
    },

    getPersonById: (id: string) => {
        return get().people.find((p) => p.id === id);
    },

    filterPeople: (filters: FilterOptions) => {
        let result = get().people;
        if (filters.relationship_type) {
            result = result.filter(
                (p) => p.relationship_type === filters.relationship_type
            );
        }
        if (filters.search_query) {
            const q = filters.search_query.toLowerCase();
            result = result.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.nickname?.toLowerCase().includes(q)
            );
        }
        return result;
    },
}));

// Interactions store — manages interaction logging and retrieval
import { create } from 'zustand';
import { supabase } from '../config/supabase';
import type { Interaction, InteractionFormData, InteractionWithPeople } from '../types';

interface InteractionsState {
    interactions: InteractionWithPeople[];
    isLoading: boolean;
    error: string | null;

    fetchInteractions: () => Promise<void>;
    fetchInteractionsForPerson: (personId: string) => Promise<InteractionWithPeople[]>;
    addInteraction: (data: InteractionFormData) => Promise<Interaction | null>;
    updateInteraction: (id: string, data: Partial<InteractionFormData>) => Promise<boolean>;
    deleteInteraction: (id: string) => Promise<boolean>;
    getRecentInteractions: (limit?: number) => InteractionWithPeople[];
}

export const useInteractionsStore = create<InteractionsState>((set, get) => ({
    interactions: [],
    isLoading: false,
    error: null,

    fetchInteractions: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data, error } = await supabase
                .from('interactions')
                .select(`
          *,
          interaction_people (
            person_id,
            people (*)
          )
        `)
                .order('occurred_at', { ascending: false });

            if (error) throw error;

            // Flatten the nested people data
            const interactions: InteractionWithPeople[] = (data ?? []).map((i: any) => ({
                ...i,
                people: i.interaction_people?.map((ip: any) => ip.people).filter(Boolean) ?? [],
            }));

            set({ interactions, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    fetchInteractionsForPerson: async (personId: string) => {
        try {
            const { data, error } = await supabase
                .from('interactions')
                .select(`
          *,
          interaction_people!inner (
            person_id,
            people (*)
          )
        `)
                .eq('interaction_people.person_id', personId)
                .order('occurred_at', { ascending: false });

            if (error) throw error;

            return (data ?? []).map((i: any) => ({
                ...i,
                people: i.interaction_people?.map((ip: any) => ip.people).filter(Boolean) ?? [],
            }));
        } catch (error) {
            console.error('Error fetching interactions for person:', error);
            return [];
        }
    },

    addInteraction: async (formData: InteractionFormData) => {
        try {
            const { person_ids, ...interactionData } = formData;

            // Insert the interaction
            const { data: interaction, error: interactionError } = await supabase
                .from('interactions')
                .insert(interactionData)
                .select()
                .single();

            if (interactionError) throw interactionError;

            // Link people to the interaction
            if (person_ids.length > 0) {
                const links = person_ids.map((person_id) => ({
                    interaction_id: interaction.id,
                    person_id,
                }));

                const { error: linkError } = await supabase
                    .from('interaction_people')
                    .insert(links);

                if (linkError) throw linkError;
            }

            // Update last_interaction_at for each person
            for (const personId of person_ids) {
                await supabase
                    .from('people')
                    .update({ last_interaction_at: formData.occurred_at })
                    .eq('id', personId);
            }

            // Refresh the interactions list
            await get().fetchInteractions();
            return interaction;
        } catch (error) {
            set({ error: (error as Error).message });
            return null;
        }
    },

    updateInteraction: async (id: string, formData: Partial<InteractionFormData>) => {
        try {
            const { person_ids, ...updateData } = formData;

            const { error } = await supabase
                .from('interactions')
                .update({ ...updateData, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;

            // If person_ids changed, update the links
            if (person_ids) {
                await supabase.from('interaction_people').delete().eq('interaction_id', id);
                if (person_ids.length > 0) {
                    const links = person_ids.map((person_id) => ({
                        interaction_id: id,
                        person_id,
                    }));
                    await supabase.from('interaction_people').insert(links);
                }
            }

            await get().fetchInteractions();
            return true;
        } catch (error) {
            set({ error: (error as Error).message });
            return false;
        }
    },

    deleteInteraction: async (id: string) => {
        try {
            const { error } = await supabase.from('interactions').delete().eq('id', id);
            if (error) throw error;
            set((state) => ({
                interactions: state.interactions.filter((i) => i.id !== id),
            }));
            return true;
        } catch (error) {
            set({ error: (error as Error).message });
            return false;
        }
    },

    getRecentInteractions: (limit = 20) => {
        return get().interactions.slice(0, limit);
    },
}));

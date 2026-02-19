// SocialQ TypeScript Type Definitions

export type RelationshipType =
    | 'family'
    | 'friend'
    | 'colleague'
    | 'acquaintance'
    | 'other';

export type InteractionType =
    | 'in-person'
    | 'call'
    | 'text'
    | 'video'
    | 'social-media'
    | 'email';

export type ReminderFrequency =
    | 'one-time'
    | 'weekly'
    | 'biweekly'
    | 'monthly'
    | 'quarterly';

export type QualityRating = 1 | 2 | 3 | 4 | 5;

export type ClosenessLevel = 1 | 2 | 3 | 4 | 5;

// ─── Core Entities ───────────────────────────────────────────

export interface Person {
    id: string;
    user_id: string;
    name: string;
    nickname?: string;
    phone?: string;
    email?: string;
    avatar_url?: string;
    relationship_type: RelationshipType;
    closeness_level: ClosenessLevel;
    notes?: string;
    birthday?: string; // ISO date string
    last_interaction_at?: string; // ISO datetime
    created_at: string;
    updated_at: string;
}

export interface Interaction {
    id: string;
    user_id: string;
    type: InteractionType;
    title: string;
    notes?: string;
    quality: QualityRating;
    location?: string;
    occurred_at: string; // ISO datetime
    duration_minutes?: number;
    created_at: string;
    updated_at: string;
}

export interface InteractionWithPeople extends Interaction {
    people: Person[];
}

export interface InteractionPerson {
    interaction_id: string;
    person_id: string;
}

export interface Group {
    id: string;
    user_id: string;
    name: string;
    color: string;
    icon?: string;
    created_at: string;
}

export interface GroupMember {
    group_id: string;
    person_id: string;
}

export interface Reminder {
    id: string;
    user_id: string;
    person_id: string;
    message: string;
    frequency: ReminderFrequency;
    next_due_at: string; // ISO datetime
    is_active: boolean;
    created_at: string;
}

export interface Tag {
    id: string;
    interaction_id: string;
    label: string;
}

// ─── Form Types ──────────────────────────────────────────────

export interface PersonFormData {
    name: string;
    nickname?: string;
    phone?: string;
    email?: string;
    relationship_type: RelationshipType;
    closeness_level: ClosenessLevel;
    notes?: string;
    birthday?: string;
}

export interface InteractionFormData {
    type: InteractionType;
    title: string;
    notes?: string;
    quality: QualityRating;
    location?: string;
    occurred_at: string;
    duration_minutes?: number;
    person_ids: string[];
}

// ─── UI Types ────────────────────────────────────────────────

export interface TabBarIcon {
    name: string;
    color: string;
    focused: boolean;
}

export interface FilterOptions {
    relationship_type?: RelationshipType;
    interaction_type?: InteractionType;
    date_from?: string;
    date_to?: string;
    search_query?: string;
}

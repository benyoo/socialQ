-- SocialQ — Initial Schema Migration
-- Creates all tables for Phase 1 MVP

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── People ──────────────────────────────────────────────────
CREATE TABLE people (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    nickname TEXT,
    phone TEXT,
    email TEXT,
    avatar_url TEXT,
    relationship_type TEXT NOT NULL DEFAULT 'friend'
        CHECK (relationship_type IN ('family', 'friend', 'colleague', 'acquaintance', 'other')),
    closeness_level SMALLINT NOT NULL DEFAULT 3
        CHECK (closeness_level BETWEEN 1 AND 5),
    notes TEXT,
    birthday DATE,
    last_interaction_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_people_user_id ON people(user_id);
CREATE INDEX idx_people_name ON people(user_id, name);

-- ─── Groups ──────────────────────────────────────────────────
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6C5CE7',
    icon TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_groups_user_id ON groups(user_id);

-- ─── Group Members ──────────────────────────────────────────
CREATE TABLE group_members (
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, person_id)
);

-- ─── Interactions ────────────────────────────────────────────
CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'in-person'
        CHECK (type IN ('in-person', 'call', 'text', 'video', 'social-media', 'email')),
    title TEXT NOT NULL,
    notes TEXT,
    quality SMALLINT NOT NULL DEFAULT 3
        CHECK (quality BETWEEN 1 AND 5),
    location TEXT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_minutes INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interactions_user_id ON interactions(user_id);
CREATE INDEX idx_interactions_occurred_at ON interactions(user_id, occurred_at DESC);

-- ─── Interaction ↔ People (many-to-many) ─────────────────────
CREATE TABLE interaction_people (
    interaction_id UUID NOT NULL REFERENCES interactions(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    PRIMARY KEY (interaction_id, person_id)
);

CREATE INDEX idx_interaction_people_person ON interaction_people(person_id);

-- ─── Reminders ───────────────────────────────────────────────
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    frequency TEXT NOT NULL DEFAULT 'monthly'
        CHECK (frequency IN ('one-time', 'weekly', 'biweekly', 'monthly', 'quarterly')),
    next_due_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reminders_user_id ON reminders(user_id);
CREATE INDEX idx_reminders_due ON reminders(user_id, next_due_at) WHERE is_active = true;

-- ─── Tags ────────────────────────────────────────────────────
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interaction_id UUID NOT NULL REFERENCES interactions(id) ON DELETE CASCADE,
    label TEXT NOT NULL
);

CREATE INDEX idx_tags_interaction ON tags(interaction_id);

-- ─── Row-Level Security ──────────────────────────────────────
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- People: users can only access their own
CREATE POLICY "Users can view own people"
    ON people FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own people"
    ON people FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own people"
    ON people FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own people"
    ON people FOR DELETE USING (auth.uid() = user_id);

-- Groups: users can only access their own
CREATE POLICY "Users can view own groups"
    ON groups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own groups"
    ON groups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own groups"
    ON groups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own groups"
    ON groups FOR DELETE USING (auth.uid() = user_id);

-- Group members: through group ownership
CREATE POLICY "Users can view own group members"
    ON group_members FOR SELECT
    USING (EXISTS (SELECT 1 FROM groups WHERE groups.id = group_id AND groups.user_id = auth.uid()));
CREATE POLICY "Users can manage own group members"
    ON group_members FOR ALL
    USING (EXISTS (SELECT 1 FROM groups WHERE groups.id = group_id AND groups.user_id = auth.uid()));

-- Interactions: users can only access their own
CREATE POLICY "Users can view own interactions"
    ON interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interactions"
    ON interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own interactions"
    ON interactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own interactions"
    ON interactions FOR DELETE USING (auth.uid() = user_id);

-- Interaction people: through interaction ownership
CREATE POLICY "Users can view own interaction people"
    ON interaction_people FOR SELECT
    USING (EXISTS (SELECT 1 FROM interactions WHERE interactions.id = interaction_id AND interactions.user_id = auth.uid()));
CREATE POLICY "Users can manage own interaction people"
    ON interaction_people FOR ALL
    USING (EXISTS (SELECT 1 FROM interactions WHERE interactions.id = interaction_id AND interactions.user_id = auth.uid()));

-- Reminders: users can only access their own
CREATE POLICY "Users can view own reminders"
    ON reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reminders"
    ON reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reminders"
    ON reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reminders"
    ON reminders FOR DELETE USING (auth.uid() = user_id);

-- Tags: through interaction ownership
CREATE POLICY "Users can view own tags"
    ON tags FOR SELECT
    USING (EXISTS (SELECT 1 FROM interactions WHERE interactions.id = interaction_id AND interactions.user_id = auth.uid()));
CREATE POLICY "Users can manage own tags"
    ON tags FOR ALL
    USING (EXISTS (SELECT 1 FROM interactions WHERE interactions.id = interaction_id AND interactions.user_id = auth.uid()));

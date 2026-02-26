// App-wide constants

import { Colors } from '../theme/tokens';
import type { InteractionType, RelationshipType } from '../types';

export const INTERACTION_TYPE_META: Record<
    InteractionType,
    { label: string; icon: string; color: string }
> = {
    'in-person': { label: 'In Person', icon: 'people', color: Colors.inPerson },
    call: { label: 'Phone Call', icon: 'call', color: Colors.call },
    text: { label: 'Text', icon: 'chatbubble', color: Colors.text },
    video: { label: 'Video Call', icon: 'videocam', color: Colors.video },
    'social-media': {
        label: 'Social Media',
        icon: 'share-social',
        color: Colors.socialMedia,
    },
    email: { label: 'Email', icon: 'mail', color: Colors.email },
};

export const RELATIONSHIP_TYPE_META: Record<
    RelationshipType,
    { label: string; icon: string; color: string }
> = {
    family: { label: 'Family', icon: 'heart', color: '#FF6B6B' },
    friend: { label: 'Friend', icon: 'people', color: '#6C5CE7' },
    colleague: { label: 'Colleague', icon: 'briefcase', color: '#00D2FF' },
    acquaintance: { label: 'Acquaintance', icon: 'person-add', color: '#FFD740' },
    other: { label: 'Other', icon: 'ellipsis-horizontal', color: '#9090A8' },
};

export const SENTIMENT_LABELS: Record<number, string> = {
    1: 'Very Negative',
    2: 'Negative',
    3: 'Neutral',
    4: 'Positive',
    5: 'Very Positive',
};

export const CLOSENESS_LABELS: Record<number, string> = {
    1: 'Distant',
    2: 'Casual',
    3: 'Regular',
    4: 'Close',
    5: 'Very Close',
};

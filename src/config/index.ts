// Environment configuration
// All env vars are prefixed with EXPO_PUBLIC_ for client-side access

export const config = {
    supabase: {
        url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
        anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
    app: {
        name: 'SocialQ',
        version: '1.0.0',
        defaultReminderDays: 30,
        maxQualityRating: 5,
        maxClosenessLevel: 5,
    },
};

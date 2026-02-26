// SocialQ Design Tokens
// Premium dark theme with accent colors

export const Colors = {
    // Brand
    primary: '#955eee',
    primaryLight: '#A29BFE',
    primaryDark: '#955eee',

    // Accent
    accent: '#00D2FF',
    accentLight: '#74E8FF',
    accentDark: '#00A8CC',

    // Sentiment / Quality Colors
    excellent: '#00E676',
    good: '#69F0AE',
    neutral: '#FFD740',
    poor: '#FF6E40',
    bad: '#FF5252',

    // Interaction Type Colors
    inPerson: '#6C5CE7',
    call: '#00D2FF',
    text: '#69F0AE',
    video: '#FF6E40',
    socialMedia: '#FF79C6',
    email: '#FFD740',

    // Backgrounds
    background: '#202020',
    backgroundElevated: '#131313',
    backgroundCard: '#272727',
    backgroundCardHover: '#2b2b2b',
    backgroundModal: '#1a1a1aee',

    // Surfaces
    surface: '#252525',
    surfaceLight: '#2A2A38',
    surfaceBorder: '#1b1b1b',

    // Text
    textPrimary: '#F0F0F5',
    textSecondary: '#9090A8',
    textTertiary: '#606078',
    textInverse: '#0A0A0F',

    // System
    error: '#FF5252',
    success: '#00E676',
    warning: '#FFD740',
    info: '#00D2FF',

    // Utility
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    overlay: 'rgba(0, 0, 0, 0.5)',
};

export const Spacing = {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 48,
    massive: 64,
};

export const FontSize = {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
};

export const FontWeight = {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
};

export const BorderRadius = {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 9999,
};

export const Shadow = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    glow: (color: string) => ({
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    }),
};

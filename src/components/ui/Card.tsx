// Card — elevated container with dark theme styling
import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { BorderRadius, Colors, Shadow, Spacing } from '../../theme/tokens';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    onPress?: () => void;
    variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({ children, style, onPress, variant = 'default' }: CardProps) {
    const cardStyle = [
        styles.base,
        variant === 'elevated' && styles.elevated,
        variant === 'outlined' && styles.outlined,
        style,
    ];

    if (onPress) {
        return (
            <Pressable
                onPress={onPress}
                style={({ pressed }) => [
                    ...cardStyle,
                    pressed && styles.pressed,
                ]}
            >
                {children}
            </Pressable>
        );
    }

    return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
    base: {
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        ...Shadow.sm,
    },
    elevated: {
        backgroundColor: Colors.surface,
        ...Shadow.md,
    },
    outlined: {
        backgroundColor: Colors.transparent,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    pressed: {
        backgroundColor: Colors.backgroundCardHover,
        transform: [{ scale: 0.98 }],
    },
});

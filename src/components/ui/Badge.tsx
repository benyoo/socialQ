// Badge — small colored pill for tags and labels
import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../theme/tokens';

interface BadgeProps {
    label: string;
    color?: string;
    style?: ViewStyle;
    size?: 'sm' | 'md';
}

export function Badge({ label, color = Colors.primary, style, size = 'md' }: BadgeProps) {
    return (
        <View
            style={[
                styles.base,
                size === 'sm' && styles.sm,
                { backgroundColor: `${color}20` },
                style,
            ]}
        >
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text
                style={[
                    styles.text,
                    size === 'sm' && styles.textSm,
                    { color },
                ]}
            >
                {label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        borderRadius: BorderRadius.full,
        alignSelf: 'flex-start',
    },
    sm: {
        paddingVertical: Spacing.xxs,
        paddingHorizontal: Spacing.xs + 2,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: Spacing.xs,
    },
    text: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
    textSm: {
        fontSize: FontSize.xs,
    },
});

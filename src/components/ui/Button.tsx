// Button — primary action button with loading state
import React from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    type ViewStyle,
} from 'react-native';
import { BorderRadius, Colors, FontSize, FontWeight, Shadow, Spacing } from '../../theme/tokens';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
    icon?: React.ReactNode;
}

export function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    style,
    icon,
}: ButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <Pressable
            onPress={onPress}
            disabled={isDisabled}
            style={({ pressed }) => [
                styles.base,
                styles[variant],
                styles[`size_${size}`],
                pressed && styles.pressed,
                isDisabled && styles.disabled,
                variant === 'primary' && Shadow.glow(Colors.primary),
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={variant === 'primary' ? Colors.white : Colors.primary}
                />
            ) : (
                <>
                    {icon}
                    <Text
                        style={[
                            styles.text,
                            styles[`text_${variant}`],
                            styles[`textSize_${size}`],
                            icon ? { marginLeft: Spacing.sm } : undefined,
                        ]}
                    >
                        {title}
                    </Text>
                </>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.md,
    },
    primary: {
        backgroundColor: Colors.primary,
    },
    secondary: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
    },
    ghost: {
        backgroundColor: Colors.transparent,
    },
    danger: {
        backgroundColor: Colors.error,
    },
    size_sm: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
    },
    size_md: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
    },
    size_lg: {
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.xxl,
    },
    pressed: {
        opacity: 0.85,
        transform: [{ scale: 0.97 }],
    },
    disabled: {
        opacity: 0.5,
    },
    text: {
        fontWeight: FontWeight.semibold,
    },
    text_primary: {
        color: Colors.white,
    },
    text_secondary: {
        color: Colors.textPrimary,
    },
    text_ghost: {
        color: Colors.primary,
    },
    text_danger: {
        color: Colors.white,
    },
    textSize_sm: {
        fontSize: FontSize.sm,
    },
    textSize_md: {
        fontSize: FontSize.md,
    },
    textSize_lg: {
        fontSize: FontSize.lg,
    },
});

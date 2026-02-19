// Input — styled text input with label and error state
import React from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    View,
    type TextInputProps,
    type ViewStyle,
} from 'react-native';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../theme/tokens';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
}

export function Input({ label, error, containerStyle, style, ...props }: InputProps) {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={[
                    styles.input,
                    error && styles.inputError,
                    style,
                ]}
                placeholderTextColor={Colors.textTertiary}
                selectionColor={Colors.primary}
                {...props}
            />
            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.lg,
    },
    label: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        marginBottom: Spacing.xs,
        marginLeft: Spacing.xxs,
    },
    input: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.surfaceBorder,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        color: Colors.textPrimary,
        fontSize: FontSize.md,
    },
    inputError: {
        borderColor: Colors.error,
    },
    error: {
        color: Colors.error,
        fontSize: FontSize.xs,
        marginTop: Spacing.xs,
        marginLeft: Spacing.xxs,
    },
});

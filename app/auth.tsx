// Auth screen — login / signup
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Button, Input } from '../src/components/ui';
import { useAuthStore } from '../src/stores';
import { BorderRadius, Colors, FontSize, FontWeight, Shadow, Spacing } from '../src/theme/tokens';

export default function AuthScreen() {
    const router = useRouter();
    const { signIn, signUp, isLoading } = useAuthStore();

    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        setError(null);
        const { error } = isSignUp
            ? await signUp(email, password)
            : await signIn(email, password);

        if (error) {
            setError(error.message);
        } else {
            router.replace('/(tabs)');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.inner}>
                {/* Logo / Brand */}
                <View style={styles.brand}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoText}>SQ</Text>
                    </View>
                    <Text style={styles.appName}>SocialQ</Text>
                    <Text style={styles.tagline}>Track the relationships that matter</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Input
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="you@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <Input
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="••••••••"
                        secureTextEntry
                    />

                    {error && <Text style={styles.errorText}>{error}</Text>}

                    <Button
                        title={isSignUp ? 'Create Account' : 'Sign In'}
                        onPress={handleSubmit}
                        loading={isLoading}
                        disabled={!email || !password}
                        size="lg"
                    />

                    <Pressable
                        style={styles.toggleButton}
                        onPress={() => {
                            setIsSignUp(!isSignUp);
                            setError(null);
                        }}
                    >
                        <Text style={styles.toggleText}>
                            {isSignUp
                                ? 'Already have an account? Sign in'
                                : "Don't have an account? Sign up"}
                        </Text>
                    </Pressable>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    inner: {
        flex: 1,
        justifyContent: 'center',
        padding: Spacing.xxl,
    },
    brand: {
        alignItems: 'center',
        marginBottom: Spacing.huge,
    },
    logoContainer: {
        width: 72,
        height: 72,
        borderRadius: BorderRadius.xl,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadow.glow(Colors.primary),
        marginBottom: Spacing.lg,
    },
    logoText: {
        color: Colors.white,
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.heavy,
    },
    appName: {
        color: Colors.textPrimary,
        fontSize: FontSize.xxxl,
        fontWeight: FontWeight.bold,
    },
    tagline: {
        color: Colors.textSecondary,
        fontSize: FontSize.md,
        marginTop: Spacing.xs,
    },
    form: {
        gap: Spacing.xs,
    },
    errorText: {
        color: Colors.error,
        fontSize: FontSize.sm,
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    toggleButton: {
        paddingVertical: Spacing.lg,
        alignItems: 'center',
    },
    toggleText: {
        color: Colors.primaryLight,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
    },
});

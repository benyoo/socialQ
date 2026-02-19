// Avatar — circular user image with initials fallback
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { FontWeight } from '../../theme/tokens';

interface AvatarProps {
    name: string;
    uri?: string;
    size?: number;
    color?: string;
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

function hashColor(name: string): string {
    const hues = [280, 320, 200, 170, 40, 10, 260, 140];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hues[Math.abs(hash) % hues.length];
    return `hsl(${hue}, 60%, 50%)`;
}

export function Avatar({ name, uri, size = 44, color }: AvatarProps) {
    const bgColor = color ?? hashColor(name);
    const fontSize = size * 0.38;

    if (uri) {
        return (
            <Image
                source={{ uri }}
                style={[
                    styles.image,
                    { width: size, height: size, borderRadius: size / 2 },
                ]}
            />
        );
    }

    return (
        <View
            style={[
                styles.fallback,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: `${bgColor}30`,
                },
            ]}
        >
            <Text style={[styles.initials, { fontSize, color: bgColor }]}>
                {getInitials(name)}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    image: {
        resizeMode: 'cover',
    },
    fallback: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    initials: {
        fontWeight: FontWeight.bold,
    },
});

import React from 'react';
import { Circle, Text as SvgText } from 'react-native-svg';
import { Colors, FontSize } from '../../theme/tokens';
import type { GraphNode as GraphNodeData } from '../../utils/graphTransform';

interface GraphNodeProps {
    node: GraphNodeData;
    onPress: (id: string, type: 'person' | 'interaction') => void;
}

export function GraphNode({ node, onPress }: GraphNodeProps) {
    const { id, type, label, color, radius, opacity, x, y } = node;

    const handlePress = () => onPress(id, type);

    return (
        <>
            {/* Outer glow halo */}
            <Circle
                cx={x}
                cy={y}
                r={radius + 8}
                fill={color}
                fillOpacity={opacity * 0.08}
            />
            {/* Inner glow */}
            <Circle
                cx={x}
                cy={y}
                r={radius + 4}
                fill={color}
                fillOpacity={opacity * 0.15}
            />
            {/* Solid core */}
            <Circle
                cx={x}
                cy={y}
                r={radius}
                fill={color}
                fillOpacity={opacity}
            />
            {/* Rim stroke */}
            <Circle
                cx={x}
                cy={y}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeOpacity={opacity * 0.6}
            />
            {/* Label for person nodes */}
            {type === 'person' && (
                <SvgText
                    x={x}
                    y={y + radius + 12}
                    fontSize={FontSize.xs}
                    fill={Colors.textSecondary}
                    fillOpacity={opacity}
                    textAnchor="middle"
                >
                    {label}
                </SvgText>
            )}
            {/* Transparent hit target — larger tap area */}
            <Circle
                cx={x}
                cy={y}
                r={radius + 10}
                fill="transparent"
                onPress={handlePress}
            />
        </>
    );
}

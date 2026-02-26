import React from 'react';
import { Line } from 'react-native-svg';
import { Colors } from '../../theme/tokens';

interface GraphEdgeProps {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    opacity: number;
}

export function GraphEdge({ x1, y1, x2, y2, opacity }: GraphEdgeProps) {
    return (
        <Line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={Colors.primary}
            strokeWidth={1}
            strokeOpacity={opacity * 0.35}
        />
    );
}

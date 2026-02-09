import React from 'react';
import type { DailySummary } from '@shared/types/entities';

interface Props {
  data: DailySummary[];
  width?: number;
  height?: number;
  onBarClick?: (date: string) => void;
}

export function RevenueChart({ data, width = 800, height = 200, onBarClick }: Props) {
  const max = Math.max(1, ...data.map((d) => d.totalRevenue));
  const barWidth = data.length ? Math.max(4, Math.floor(width / data.length) - 4) : 0;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      <rect x={0} y={0} width={width} height={height} fill="transparent" />
      {data.map((d, i) => {
        const h = (d.totalRevenue / max) * (height - 30);
        const x = i * (barWidth + 4) + 40;
        const y = height - h - 20;
        return (
          <g key={d.date}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={h}
              fill="#2563eb"
              style={{ cursor: onBarClick ? 'pointer' : 'default' }}
              onClick={() => onBarClick?.(d.date)}
            />
            <text x={x + barWidth / 2} y={height - 6} fontSize={9} fill="#374151" textAnchor="middle">
              {new Date(d.date).toLocaleDateString()}
            </text>
          </g>
        );
      })}
      <line x1={30} y1={height - 20} x2={width - 10} y2={height - 20} stroke="#e5e7eb" />
    </svg>
  );
}

export default RevenueChart;

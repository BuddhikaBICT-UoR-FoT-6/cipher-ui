/**
 * @fileoverview Visualizes Rail Fence cipher zigzag pattern as a rails x columns grid
 */

import React, { useMemo } from 'react';
import './RailFencePattern.css';

const DEFAULT_PREVIEW_LIMIT = 120;
const CELL_W = 26;
const CELL_H = 32;
const PADDING_X = 14;
const PADDING_Y = 14;

const RAIL_COLORS = [
  '#ff6b6b',
  '#4ecdc4',
  '#45b7d1',
  '#667eea',
  '#f39c12',
  '#9b59b6',
  '#2ecc71',
  '#e67e22',
  '#1abc9c',
  '#e84393'
];

function normalizeForGrid(text) {
  // Keep column count stable and visible for whitespace/newlines.
  return text
    .replace(/\r/g, '')
    .replace(/\n/g, '↵')
    .replace(/ /g, '␠');
}

function buildRailFenceGrid(text, rails) {
  const normalized = normalizeForGrid(text);
  const chars = [...normalized];

  if (rails <= 1 || chars.length === 0) {
    return { normalized, chars, grid: [], pattern: [] };
  }

  const grid = Array.from({ length: rails }, () => Array(chars.length).fill(null));
  const pattern = [];

  let rail = 0;
  let direction = 1;

  for (let col = 0; col < chars.length; col++) {
    grid[rail][col] = chars[col];
    pattern.push(rail);

    rail += direction;
    if (rail === 0 || rail === rails - 1) {
      direction *= -1;
    }
  }

  return { normalized, chars, grid, pattern };
}

const RailFencePattern = ({ text, rails, previewLimit = DEFAULT_PREVIEW_LIMIT }) => {
  const safeRails = Number.isFinite(Number(rails)) ? Math.max(2, Math.min(10, parseInt(rails, 10))) : 2;
  const safeText = typeof text === 'string' ? text : '';

  const previewText = safeText.length > previewLimit ? safeText.slice(0, previewLimit) : safeText;
  const isTruncated = safeText.length > previewLimit;

  const { grid, chars, pattern } = useMemo(
    () => buildRailFenceGrid(previewText, safeRails),
    [previewText, safeRails]
  );

  if (!previewText.trim() || chars.length === 0 || grid.length === 0) {
    return null;
  }

  const cols = chars.length;
  const svgWidth = PADDING_X * 2 + Math.max(1, cols) * CELL_W;
  const svgHeight = PADDING_Y * 2 + safeRails * CELL_H;

  const pointFor = (rowIndex, colIndex) => {
    const x = PADDING_X + colIndex * CELL_W + CELL_W / 2;
    const y = PADDING_Y + rowIndex * CELL_H + CELL_H / 2;
    return { x, y };
  };

  const pathD = (() => {
    let d = '';
    for (let col = 0; col < cols; col++) {
      const row = pattern[col];
      const { x, y } = pointFor(row, col);
      d += col === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }
    return d;
  })();

  return (
    <div className="railfence-pattern">
      {isTruncated && (
        <div className="railfence-pattern-note">
          Showing first {previewLimit} characters.
        </div>
      )}
      <div className="railfence-pattern-scroll" role="img" aria-label="Rail Fence zigzag pattern chart">
        <svg
          className="railfence-pattern-svg"
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="rfPath" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ff6b6b" />
              <stop offset="50%" stopColor="#4ecdc4" />
              <stop offset="100%" stopColor="#45b7d1" />
            </linearGradient>
          </defs>

          {/* Rail bands */}
          {Array.from({ length: safeRails }).map((_, rowIdx) => (
            <rect
              key={rowIdx}
              x={PADDING_X}
              y={PADDING_Y + rowIdx * CELL_H}
              width={cols * CELL_W}
              height={CELL_H}
              rx="8"
              className="railfence-rail-band"
            />
          ))}

          {/* Vertical grid lines */}
          {Array.from({ length: cols + 1 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={PADDING_X + i * CELL_W}
              y1={PADDING_Y}
              x2={PADDING_X + i * CELL_W}
              y2={PADDING_Y + safeRails * CELL_H}
              className="railfence-grid-line"
            />
          ))}

          {/* Horizontal grid lines */}
          {Array.from({ length: safeRails + 1 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1={PADDING_X}
              y1={PADDING_Y + i * CELL_H}
              x2={PADDING_X + cols * CELL_W}
              y2={PADDING_Y + i * CELL_H}
              className="railfence-grid-line"
            />
          ))}

          {/* Zigzag path */}
          <path d={pathD} fill="none" stroke="url(#rfPath)" strokeWidth="3" className="railfence-path" />

          {/* Points + characters */}
          {Array.from({ length: cols }).map((_, colIdx) => {
            const rowIdx = pattern[colIdx];
            const { x, y } = pointFor(rowIdx, colIdx);
            const color = RAIL_COLORS[rowIdx % RAIL_COLORS.length];
            const ch = chars[colIdx];

            return (
              <g key={colIdx}>
                <circle cx={x} cy={y} r="11" fill={color} opacity="0.9" className="railfence-node" />
                <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className="railfence-node-text">
                  {ch}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="railfence-pattern-legend">
        <span>␠ = space</span>
        <span>↵ = newline</span>
      </div>
    </div>
  );
};

export default RailFencePattern;

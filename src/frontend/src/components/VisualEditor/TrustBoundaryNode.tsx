/**
 * Trust Boundary Node Component
 * Representa zonas de confiança no diagrama
 */

import React, { memo } from 'react';
import { NodeProps } from 'reactflow';

const BOUNDARY_STYLES = {
  internal: { color: '#10b981', label: 'Internal', borderStyle: 'solid' },
  dmz: { color: '#f59e0b', label: 'DMZ', borderStyle: 'dashed' },
  external: { color: '#ef4444', label: 'External', borderStyle: 'dashed' },
  'third-party': { color: '#8b5cf6', label: 'Third-party', borderStyle: 'dotted' }
};

export const TrustBoundaryNode = memo(({ data, selected }: NodeProps) => {
  const boundaryType = data.trustLevel || 'internal';
  const style = BOUNDARY_STYLES[boundaryType as keyof typeof BOUNDARY_STYLES];

  return (
    <div 
      className={`trust-boundary ${selected ? 'selected' : ''}`}
      style={{
        borderColor: style.color,
        borderStyle: style.borderStyle as any
      }}
    >
      <div 
        className="boundary-label"
        style={{ backgroundColor: style.color }}
      >
        🛡️ {data.label || style.label}
      </div>

      <div className="boundary-hint">
        Arraste assets para dentro desta zona
      </div>

      <style jsx>{`
        .trust-boundary {
          background: rgba(0, 0, 0, 0.1);
          border: 3px solid;
          border-radius: 12px;
          padding: 40px 24px 24px;
          min-width: 300px;
          min-height: 200px;
          position: relative;
          opacity: 0.8;
          transition: all 0.2s;
        }

        .trust-boundary:hover {
          opacity: 1;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .trust-boundary.selected {
          opacity: 1;
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
        }

        .boundary-label {
          position: absolute;
          top: 8px;
          left: 8px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: bold;
          color: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .boundary-hint {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 11px;
          color: #666;
          font-style: italic;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
});

TrustBoundaryNode.displayName = 'TrustBoundaryNode';


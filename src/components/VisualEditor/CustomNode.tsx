/**
 * Custom Node Component para ReactFlow
 * Representa um asset no diagrama
 */

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import type { ThreatLevel } from '../../types/visual';

const getThreatLevelColor = (level?: ThreatLevel): string => {
  switch (level) {
    case 'CRITICAL': return '#dc2626';
    case 'HIGH': return '#f59e0b';
    case 'MEDIUM': return '#eab308';
    case 'LOW': return '#10b981';
    default: return '#6b7280';
  }
};

export const CustomNode = memo(({ data, selected }: NodeProps) => {
  const threatColor = getThreatLevelColor(data.threatLevel);
  const hasThreats = data.threats && data.threats.length > 0;

  return (
    <div className={`custom-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} className="node-handle" />
      
      <div className="node-content">
        <div className="node-icon-wrapper">
          <span className="node-icon">{data.icon || '📦'}</span>
          {hasThreats && (
            <span 
              className="threat-badge"
              style={{ backgroundColor: threatColor }}
              title={`${data.threats.length} ameaças detectadas`}
            >
              {data.threats.length}
            </span>
          )}
        </div>
        
        <div className="node-label">{data.label}</div>

        {data.description && (
          <div className="node-description">{data.description}</div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="node-handle" />

      <style jsx>{`
        .custom-node {
          background: #1f1f1f;
          border: 2px solid #3b82f6;
          border-radius: 10px;
          padding: 12px;
          min-width: 140px;
          max-width: 200px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
          transition: all 0.2s;
        }

        .custom-node:hover {
          box-shadow: 0 6px 12px rgba(59, 130, 246, 0.3);
          border-color: #60a5fa;
        }

        .custom-node.selected {
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }

        .node-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .node-icon-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .node-icon {
          font-size: 32px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
        }

        .threat-badge {
          position: absolute;
          top: -4px;
          right: -8px;
          background: #dc2626;
          color: white;
          font-size: 10px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 10px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .node-label {
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          text-align: center;
          word-wrap: break-word;
          line-height: 1.3;
        }

        .node-description {
          font-size: 10px;
          color: #888;
          text-align: center;
          line-height: 1.2;
        }

        :global(.react-flow__handle) {
          width: 8px;
          height: 8px;
          background: #3b82f6;
          border: 2px solid #fff;
        }

        :global(.react-flow__handle:hover) {
          background: #60a5fa;
        }
      `}</style>
    </div>
  );
});

CustomNode.displayName = 'CustomNode';


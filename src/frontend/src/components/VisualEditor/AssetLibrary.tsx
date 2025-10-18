/**
 * Biblioteca de Assets Drag-and-Drop para Editor Visual
 */

import React, { useState } from 'react';
import { ASSET_CATEGORIES, getAssetsByCategory } from '../../data/assetLibrary';
import type { Asset, AssetCategory } from '../../types/visual';

interface AssetLibraryProps {
  onAssetSelect?: (asset: Asset) => void;
}

export const AssetLibrary: React.FC<AssetLibraryProps> = ({ onAssetSelect }) => {
  const [expandedCategory, setExpandedCategory] = useState<AssetCategory | null>('ai');

  const onDragStart = (event: React.DragEvent, asset: Asset) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(asset));
    event.dataTransfer.effectAllowed = 'move';
  };

  const toggleCategory = (categoryId: AssetCategory) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  return (
    <div className="asset-library">
      <div className="asset-library-header">
        <h3 className="text-lg font-bold">📚 Asset Library</h3>
        <p className="text-xs text-gray-400 mt-1">Arraste assets para o canvas</p>
      </div>

      <div className="asset-categories">
        {ASSET_CATEGORIES.map((category) => {
          const assets = getAssetsByCategory(category.id as AssetCategory);
          const isExpanded = expandedCategory === category.id;

          return (
            <div key={category.id} className="asset-category">
              <button
                className="category-header"
                onClick={() => toggleCategory(category.id as AssetCategory)}
              >
                <span className="category-icon">{category.icon}</span>
                <span className="category-label">{category.label}</span>
                <span className="category-count">({assets.length})</span>
                <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
              </button>

              {isExpanded && (
                <div className="asset-list">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="asset-item"
                      draggable
                      onDragStart={(e) => onDragStart(e, asset)}
                      onClick={() => onAssetSelect?.(asset)}
                      title={asset.description}
                    >
                      <span className="asset-icon">{asset.icon}</span>
                      <div className="asset-info">
                        <span className="asset-label">{asset.label}</span>
                        {asset.typicalThreats.length > 0 && (
                          <span className="asset-threats">
                            {asset.typicalThreats.slice(0, 2).join(', ')}
                            {asset.typicalThreats.length > 2 && '...'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .asset-library {
          width: 280px;
          background: #1a1a1a;
          border-right: 1px solid #333;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          height: 100%;
        }

        .asset-library-header {
          padding: 16px;
          border-bottom: 1px solid #333;
          background: #0f0f0f;
        }

        .asset-categories {
          flex: 1;
          overflow-y: auto;
        }

        .asset-category {
          border-bottom: 1px solid #2a2a2a;
        }

        .category-header {
          width: 100%;
          padding: 12px 16px;
          background: #1a1a1a;
          border: none;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s;
        }

        .category-header:hover {
          background: #2a2a2a;
        }

        .category-icon {
          font-size: 20px;
        }

        .category-label {
          flex: 1;
          text-align: left;
          font-weight: 600;
        }

        .category-count {
          font-size: 12px;
          color: #888;
        }

        .expand-icon {
          font-size: 10px;
          transition: transform 0.2s;
        }

        .expand-icon.expanded {
          transform: rotate(180deg);
        }

        .asset-list {
          background: #0f0f0f;
          padding: 8px;
        }

        .asset-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          margin-bottom: 6px;
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 6px;
          cursor: grab;
          transition: all 0.2s;
        }

        .asset-item:hover {
          background: #2a2a2a;
          border-color: #3b82f6;
          transform: translateX(4px);
        }

        .asset-item:active {
          cursor: grabbing;
        }

        .asset-icon {
          font-size: 24px;
        }

        .asset-info {
          flex: 1;
          min-width: 0;
        }

        .asset-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 2px;
        }

        .asset-threats {
          display: block;
          font-size: 10px;
          color: #888;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
};


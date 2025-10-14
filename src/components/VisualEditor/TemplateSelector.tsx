/**
 * Template Selector Component
 * Permite usuário escolher template predefinido
 */

import React, { useState } from 'react';
import { ALL_TEMPLATES, TEMPLATE_CATEGORIES, DiagramTemplate } from '../../data/diagramTemplates';

interface TemplateSelectorProps {
  onSelectTemplate: (template: DiagramTemplate) => void;
  onClose: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelectTemplate, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ai');

  const filteredTemplates = ALL_TEMPLATES.filter(t => t.category === selectedCategory);

  return (
    <div className="template-modal-overlay" onClick={onClose}>
      <div className="template-modal" onClick={(e) => e.stopPropagation()}>
        <div className="template-header">
          <h3 className="text-2xl font-bold">📋 Escolher Template</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="template-categories">
          {TEMPLATE_CATEGORIES.map((category) => (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              <span>{category.label}</span>
            </button>
          ))}
        </div>

        <div className="template-grid">
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="template-card"
                onClick={() => {
                  onSelectTemplate(template);
                  onClose();
                }}
              >
                <div className="template-icon">{template.icon}</div>
                <h4 className="template-name">{template.name}</h4>
                <p className="template-description">{template.description}</p>
                <div className="template-stats">
                  <span>📦 {template.nodes.length} assets</span>
                  <span>🔗 {template.edges.length} conexões</span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-templates">
              <p>Nenhum template disponível nesta categoria</p>
            </div>
          )}
        </div>

        <style jsx>{`
          .template-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(4px);
          }

          .template-modal {
            background: #1f1f1f;
            border-radius: 12px;
            padding: 32px;
            width: 90%;
            max-width: 900px;
            max-height: 90vh;
            overflow-y: auto;
            border: 1px solid #444;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          }

          .template-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid #333;
          }

          .close-btn {
            background: transparent;
            border: none;
            color: #888;
            font-size: 28px;
            cursor: pointer;
            padding: 0;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            transition: all 0.2s;
          }

          .close-btn:hover {
            background: #333;
            color: #fff;
          }

          .template-categories {
            display: flex;
            gap: 8px;
            margin-bottom: 24px;
            flex-wrap: wrap;
          }

          .category-btn {
            padding: 10px 20px;
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 8px;
            color: #fff;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
            font-weight: 500;
          }

          .category-btn:hover {
            background: #333;
            border-color: #3b82f6;
          }

          .category-btn.active {
            background: #3b82f6;
            border-color: #60a5fa;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
          }

          .category-icon {
            font-size: 18px;
          }

          .template-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 16px;
          }

          .template-card {
            background: #2a2a2a;
            border: 2px solid #444;
            border-radius: 12px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .template-card:hover {
            border-color: #3b82f6;
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(59, 130, 246, 0.2);
          }

          .template-icon {
            font-size: 48px;
            margin-bottom: 12px;
          }

          .template-name {
            font-size: 16px;
            font-weight: 700;
            color: #fff;
            margin-bottom: 8px;
          }

          .template-description {
            font-size: 13px;
            color: #888;
            margin-bottom: 12px;
            line-height: 1.4;
          }

          .template-stats {
            display: flex;
            gap: 12px;
            font-size: 12px;
            color: #aaa;
          }

          .no-templates {
            grid-column: 1 / -1;
            text-align: center;
            padding: 40px;
            color: #888;
            font-style: italic;
          }
        `}</style>
      </div>
    </div>
  );
};


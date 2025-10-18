/**
 * Visual Editor Component - Editor Visual de DFD
 * Funcionalidades:
 * - Drag-and-drop de assets
 * - Edição rica de fluxos (cor, tipo, bidirecional, criptografia)
 * - Trust boundaries
 * - Templates
 * - Exportar/Importar JSON
 * - Análise de ameaças
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { AssetLibrary } from './AssetLibrary';
import { CustomNode } from './CustomNode';
import { TrustBoundaryNode } from './TrustBoundaryNode';
import { TemplateSelector } from './TemplateSelector';
import { convertDiagramToSystemInfo } from '../../utils/diagramConverter';
import type { SystemInfo } from '../../../types';
import type { Asset } from '../../types/visual';
import type { DiagramTemplate } from '../../data/diagramTemplates';

const nodeTypes = {
  custom: CustomNode,
  boundary: TrustBoundaryNode,
};

interface VisualEditorProps {
  onAnalyze: (systemInfo: SystemInfo) => void;
  onSave?: (diagram: { nodes: Node[]; edges: Edge[] }) => void;
  isAnalyzing?: boolean;
}

export const VisualEditor: React.FC<VisualEditorProps> = ({ onAnalyze, onSave, isAnalyzing = false }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [systemName, setSystemName] = useState('Meu Sistema');
  const [showTemplates, setShowTemplates] = useState(false);
  
  // Estados para edição de nodes e edges
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [showEditNodeModal, setShowEditNodeModal] = useState(false);
  const [showEditEdgeModal, setShowEditEdgeModal] = useState(false);
  const [editingLabel, setEditingLabel] = useState('');
  
  // Estados para edição rica de fluxos
  const [edgeColor, setEdgeColor] = useState('#3b82f6');
  const [edgeBidirectional, setEdgeBidirectional] = useState(false);
  const [edgeDataType, setEdgeDataType] = useState('');
  const [edgeEncrypted, setEdgeEncrypted] = useState(false);
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // ===== HANDLERS =====

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({
      ...params,
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed', color: '#3b82f6' },
    }, eds)),
    [setEdges]
  );

  // Drag and drop de assets
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const assetData = event.dataTransfer.getData('application/reactflow');

      if (!assetData || !reactFlowBounds || !reactFlowInstance) return;

      const asset: Asset = JSON.parse(assetData);
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `${asset.id}-${Date.now()}`,
        type: 'custom',
        position,
        data: {
          label: asset.label,
          icon: asset.icon,
          assetId: asset.id,
          assetType: asset.category,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  // Double-click para editar node
  const onNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
      setEditingLabel(node.data.label || '');
      setShowEditNodeModal(true);
    },
    []
  );

  // Salvar edição de node
  const handleSaveNodeLabel = () => {
    if (!selectedNode) return;
    
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNode.id) {
          return { ...n, data: { ...n.data, label: editingLabel } };
        }
        return n;
      })
    );
    
    setShowEditNodeModal(false);
    setSelectedNode(null);
  };

  // Double-click para editar edge
  const onEdgeDoubleClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      setSelectedEdge(edge);
      setEditingLabel((edge.label as string) || '');
      setEdgeColor(edge.style?.stroke as string || '#3b82f6');
      setEdgeBidirectional(edge.data?.bidirectional || false);
      setEdgeDataType(edge.data?.dataType || '');
      setEdgeEncrypted(edge.data?.encrypted || false);
      setShowEditEdgeModal(true);
    },
    []
  );

  // Salvar edição completa da edge
  const handleSaveEdgeLabel = () => {
    if (!selectedEdge) return;
    
    // Detectar automaticamente criptografia baseado no tipo de dados
    const autoEncrypted = edgeDataType.toLowerCase().includes('https') || 
                         edgeDataType.toLowerCase().includes('ssl') ||
                         edgeDataType.toLowerCase().includes('tls') ||
                         edgeEncrypted;
    
    setEdges((eds) =>
      eds.map((e) => {
        if (e.id === selectedEdge.id) {
          return {
            ...e,
            label: editingLabel,
            animated: true,
            style: {
              ...e.style,
              stroke: edgeColor,
              strokeWidth: edgeBidirectional ? 3 : 2,
            },
            markerEnd: edgeBidirectional ? undefined : {
              type: 'arrowclosed' as const,
              color: edgeColor,
            },
            markerStart: edgeBidirectional ? {
              type: 'arrowclosed' as const,
              color: edgeColor,
            } : undefined,
            data: {
              ...e.data,
              bidirectional: edgeBidirectional,
              dataType: edgeDataType,
              encrypted: autoEncrypted,
            },
          };
        }
        return e;
      })
    );
    
    setShowEditEdgeModal(false);
    setSelectedEdge(null);
  };

  // Adicionar trust boundary
  const addBoundary = (trustLevel: 'internal' | 'dmz' | 'external' | 'third-party') => {
    const newBoundary: Node = {
      id: `boundary-${Date.now()}`,
      type: 'boundary',
      position: { x: 100, y: 100 },
      data: {
        label: trustLevel.charAt(0).toUpperCase() + trustLevel.slice(1),
        trustLevel,
      },
      style: { width: 400, height: 300, zIndex: -1 },
    };
    setNodes((nds) => [...nds, newBoundary]);
  };

  // Carregar template
  const handleLoadTemplate = (template: DiagramTemplate) => {
    setNodes(template.nodes);
    setEdges(template.edges);
    setSystemName(template.name);
  };

  // Exportar diagrama
  const handleExport = () => {
    const diagram = { nodes, edges, systemName };
    const dataStr = JSON.stringify(diagram, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${systemName.replace(/\s+/g, '-')}-diagram.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Importar diagrama
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const diagram = JSON.parse(e.target?.result as string);
        setNodes(diagram.nodes || []);
        setEdges(diagram.edges || []);
        setSystemName(diagram.systemName || 'Sistema Importado');
      } catch (error) {
        alert('Erro ao importar arquivo. Verifique o formato JSON.');
      }
    };
    reader.readAsText(file);
  };

  // Limpar diagrama
  const handleClear = () => {
    if (window.confirm('Tem certeza que deseja limpar o diagrama?')) {
      setNodes([]);
      setEdges([]);
      setSystemName('Meu Sistema');
    }
  };

  // Analisar ameaças
  const handleAnalyze = () => {
    if (nodes.length === 0) {
      alert('⚠️ Adicione pelo menos um componente ao diagrama antes de analisar!');
      return;
    }

    const systemInfo = convertDiagramToSystemInfo(nodes, edges, systemName);
    onAnalyze(systemInfo);
    
    // Salvar automaticamente se callback fornecido
    if (onSave) {
      onSave({ nodes, edges });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        setNodes((nds) => nds.filter((node) => !node.selected));
        setEdges((eds) => eds.filter((edge) => !edge.selected));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setNodes, setEdges]);

  return (
    <div className="visual-editor-container">
      {/* Header com controles */}
      <div className="visual-editor-header">
        <div className="header-left">
          <input
            type="text"
            value={systemName}
            onChange={(e) => setSystemName(e.target.value)}
            className="system-name-input"
            placeholder="Nome do Sistema"
          />
          <span className="node-count">
            {nodes.filter(n => n.type !== 'boundary').length} componentes, {edges.length} fluxos
          </span>
        </div>

        <div className="header-actions">
          <button onClick={() => setShowTemplates(true)} className="btn-secondary">
            📋 Templates
          </button>
          
          <div className="boundary-buttons">
            <button onClick={() => addBoundary('internal')} className="btn-boundary btn-internal" title="Adicionar zona Internal">
              🛡️
            </button>
            <button onClick={() => addBoundary('dmz')} className="btn-boundary btn-dmz" title="Adicionar zona DMZ">
              🛡️
            </button>
            <button onClick={() => addBoundary('external')} className="btn-boundary btn-external" title="Adicionar zona External">
              🛡️
            </button>
            <button onClick={() => addBoundary('third-party')} className="btn-boundary btn-thirdparty" title="Adicionar zona Third-party">
              🛡️
            </button>
          </div>

          <label className="btn-secondary">
            📂 Importar
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </label>

          <button onClick={handleExport} className="btn-secondary" disabled={nodes.length === 0}>
            💾 Exportar
          </button>

          <button onClick={handleClear} className="btn-secondary btn-danger" disabled={nodes.length === 0}>
            🗑️
          </button>

          <button 
            onClick={handleAnalyze} 
            className="btn-primary"
            disabled={isAnalyzing || nodes.length === 0}
          >
            {isAnalyzing ? '⏳ Analisando...' : '🔍 Analisar Ameaças'}
          </button>
        </div>
      </div>

      {/* Canvas com ReactFlow */}
      <div className="visual-editor-body">
        <AssetLibrary />

        <div 
          ref={reactFlowWrapper}
          style={{ flex: 1, height: '100%' }}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onNodeDoubleClick={onNodeDoubleClick}
            onEdgeDoubleClick={onEdgeDoubleClick}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode={['Delete', 'Backspace']}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#333" />
            <Controls />
            <MiniMap 
              nodeColor={(node) => {
                if (node.type === 'boundary') return '#333';
                return '#3b82f6';
              }}
              maskColor="rgba(0, 0, 0, 0.6)"
            />
          </ReactFlow>
        </div>
      </div>

      {/* Info box */}
      {nodes.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🎨</div>
          <h3>Comece arrastando assets da biblioteca</h3>
          <p>Ou escolha um template pronto clicando em "📋 Templates"</p>
        </div>
      )}

      <div className="info-box">
        <strong>⌨️ Atalhos:</strong> Delete = deletar | Double-click = editar | Arraste assets para criar componentes
      </div>

      {/* Modal de edição de node */}
      {showEditNodeModal && (
        <div className="edit-modal-overlay" onClick={() => setShowEditNodeModal(false)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">✏️ Editar Componente</h3>
            <input
              type="text"
              value={editingLabel}
              onChange={(e) => setEditingLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveNodeLabel();
                if (e.key === 'Escape') setShowEditNodeModal(false);
              }}
              placeholder="Nome do componente"
              className="modal-input"
              autoFocus
            />
            <div className="modal-buttons">
              <button onClick={handleSaveNodeLabel} className="btn-save">✅ Salvar</button>
              <button onClick={() => setShowEditNodeModal(false)} className="btn-cancel">❌ Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição de edge (rico) */}
      {showEditEdgeModal && (
        <div className="edit-modal-overlay" onClick={() => setShowEditEdgeModal(false)}>
          <div className="edit-modal edit-edge-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">🏷️ Editar Fluxo de Dados</h3>
            
            <div className="form-group">
              <label>Nome do Fluxo:</label>
              <input
                type="text"
                value={editingLabel}
                onChange={(e) => setEditingLabel(e.target.value)}
                placeholder="ex: HTTPS, API calls, dados sensíveis"
                className="modal-input"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Tipo de Dados:</label>
              <select
                value={edgeDataType}
                onChange={(e) => setEdgeDataType(e.target.value)}
                className="modal-select"
              >
                <option value="">Selecione...</option>
                <option value="HTTPS">HTTPS (criptografado) 🔒</option>
                <option value="HTTP">HTTP (não criptografado) ⚠️</option>
                <option value="gRPC/SSL">gRPC/SSL (criptografado) 🔒</option>
                <option value="API REST">API REST</option>
                <option value="WebSocket">WebSocket</option>
                <option value="WebSocket/WSS">WebSocket/WSS (criptografado) 🔒</option>
                <option value="dados-sensiveis">Dados Sensíveis 🔴</option>
                <option value="credenciais">Credenciais 🔴</option>
                <option value="tokens">Tokens/Auth 🔐</option>
                <option value="queries">Database Queries</option>
                <option value="mensagens">Mensagens (Queue)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Cor do Fluxo:</label>
              <div className="color-picker-group">
                <input
                  type="color"
                  value={edgeColor}
                  onChange={(e) => setEdgeColor(e.target.value)}
                  className="color-input"
                />
                <div className="color-presets">
                  <button type="button" onClick={() => setEdgeColor('#3b82f6')} title="Azul (Padrão)" className="color-preset">🔵</button>
                  <button type="button" onClick={() => setEdgeColor('#10b981')} title="Verde (Seguro)" className="color-preset">🟢</button>
                  <button type="button" onClick={() => setEdgeColor('#f59e0b')} title="Laranja (Atenção)" className="color-preset">🟠</button>
                  <button type="button" onClick={() => setEdgeColor('#dc2626')} title="Vermelho (Crítico)" className="color-preset">🔴</button>
                  <button type="button" onClick={() => setEdgeColor('#8b5cf6')} title="Roxo (IA/ML)" className="color-preset">🟣</button>
                  <button type="button" onClick={() => setEdgeColor('#6b7280')} title="Cinza (Storage)" className="color-preset">⚫</button>
                </div>
              </div>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={edgeBidirectional}
                  onChange={(e) => setEdgeBidirectional(e.target.checked)}
                />
                <span>Fluxo Bidirecional (↔️)</span>
              </label>
              <small>Ative se os dados fluem nos dois sentidos</small>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={edgeEncrypted}
                  onChange={(e) => setEdgeEncrypted(e.target.checked)}
                />
                <span>Criptografado (🔒)</span>
              </label>
              <small>Marca manualmente como criptografado (auto-detectado para HTTPS/SSL/TLS)</small>
            </div>

            <div className="modal-buttons">
              <button onClick={handleSaveEdgeLabel} className="btn-save">✅ Salvar</button>
              <button onClick={() => setShowEditEdgeModal(false)} className="btn-cancel">❌ Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de templates */}
      {showTemplates && (
        <TemplateSelector
          onSelectTemplate={handleLoadTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}

      <style jsx>{`
        .visual-editor-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #0f0f0f;
          position: relative;
        }

        .visual-editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          background: #1a1a1a;
          border-bottom: 1px solid #333;
          gap: 16px;
          flex-wrap: wrap;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 300px;
        }

        .system-name-input {
          padding: 8px 14px;
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 6px;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          min-width: 250px;
        }

        .node-count {
          font-size: 12px;
          color: #888;
          white-space: nowrap;
        }

        .header-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .boundary-buttons {
          display: flex;
          gap: 4px;
          background: #2a2a2a;
          padding: 4px;
          border-radius: 6px;
        }

        .btn-primary {
          padding: 8px 18px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          padding: 8px 14px;
          background: #2a2a2a;
          color: #fff;
          border: 1px solid #444;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #333;
          border-color: #3b82f6;
        }

        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-danger:hover:not(:disabled) {
          border-color: #dc2626;
          color: #dc2626;
        }

        .btn-boundary {
          padding: 6px 10px;
          background: transparent;
          color: white;
          border: 2px solid;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
        }

        .btn-internal { border-color: #10b981; }
        .btn-internal:hover { background: #10b981; }
        .btn-dmz { border-color: #f59e0b; }
        .btn-dmz:hover { background: #f59e0b; }
        .btn-external { border-color: #ef4444; }
        .btn-external:hover { background: #ef4444; }
        .btn-thirdparty { border-color: #8b5cf6; }
        .btn-thirdparty:hover { background: #8b5cf6; }

        .visual-editor-body {
          display: flex;
          flex: 1;
          overflow: hidden;
          position: relative;
        }

        .empty-state {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          z-index: 10;
          pointer-events: none;
        }

        .empty-icon {
          font-size: 72px;
          margin-bottom: 16px;
          opacity: 0.3;
        }

        .empty-state h3 {
          font-size: 20px;
          color: #888;
          margin-bottom: 8px;
        }

        .empty-state p {
          font-size: 14px;
          color: #666;
        }

        .info-box {
          padding: 10px 20px;
          background: #1a1a1a;
          border-top: 1px solid #333;
          font-size: 12px;
          color: #888;
          text-align: center;
        }

        /* Modals */
        .edit-modal-overlay {
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

        .edit-modal {
          background: #1f1f1f;
          border-radius: 12px;
          padding: 24px;
          min-width: 400px;
          border: 1px solid #444;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .edit-edge-modal {
          min-width: 500px;
          max-width: 600px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #e5e7eb;
        }

        .modal-input,
        .modal-select {
          width: 100%;
          padding: 10px 12px;
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 6px;
          color: #fff;
          font-size: 14px;
        }

        .modal-input:focus,
        .modal-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .color-picker-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .color-input {
          width: 60px;
          height: 40px;
          border: 1px solid #444;
          border-radius: 6px;
          cursor: pointer;
        }

        .color-presets {
          display: flex;
          gap: 6px;
        }

        .color-preset {
          font-size: 24px;
          cursor: pointer;
          background: none;
          border: none;
          padding: 4px;
          border-radius: 4px;
          transition: transform 0.2s;
        }

        .color-preset:hover {
          transform: scale(1.2);
        }

        .checkbox-group small {
          display: block;
          font-size: 11px;
          color: #888;
          margin-top: 4px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-weight: normal;
        }

        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .modal-buttons {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .btn-save, .btn-cancel {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-save {
          background: #10b981;
          color: white;
        }

        .btn-save:hover {
          background: #059669;
        }

        .btn-cancel {
          background: #6b7280;
          color: white;
        }

        .btn-cancel:hover {
          background: #4b5563;
        }
      `}</style>
    </div>
  );
};


/**
 * Utilitários para converter diagrama visual em SystemInfo
 * e realizar análise de riscos automática
 */

import type { Node, Edge } from 'reactflow';
import type { SystemInfo } from '../../types';
import { getAssetById } from '../data/assetLibrary';

/**
 * Converte o diagrama visual (nodes + edges) em SystemInfo
 * para análise de ameaças
 */
export function convertDiagramToSystemInfo(
  nodes: Node[],
  edges: Edge[],
  systemName: string = 'Sistema do Diagrama Visual'
): SystemInfo {
  // Filtrar nodes que são assets (não boundaries)
  const assetNodes = nodes.filter(n => n.type === 'custom' || !n.type);

  // Extrair componentes
  const components = assetNodes
    .filter(n => {
      const category = n.data.assetType;
      return ['service', 'ai', 'storage'].includes(category);
    })
    .map(n => n.data.label)
    .join(', ');

  // Extrair dados sensíveis
  const dataAssets = assetNodes
    .filter(n => n.data.assetType === 'data')
    .map(n => n.data.label);
  
  const sensitiveData = dataAssets.length > 0
    ? `Dados identificados no diagrama: ${dataAssets.join(', ')}`
    : 'Não especificado';

  // Extrair tecnologias (inferir de assets)
  const techAssets = assetNodes
    .filter(n => ['ai', 'storage', 'service'].includes(n.data.assetType))
    .map(n => {
      const asset = getAssetById(n.data.assetId);
      return asset?.description || n.data.label;
    });
  
  const technologies = techAssets.length > 0
    ? techAssets.slice(0, 10).join(', ')
    : 'Não especificado';

  // Extrair integrações externas
  const externalIntegrations = assetNodes
    .filter(n => n.data.assetType === 'external')
    .map(n => n.data.label)
    .join(', ') || 'Nenhuma identificada';

  // Extrair perfis de usuário
  const userProfiles = assetNodes
    .filter(n => n.data.assetType === 'user')
    .map(n => n.data.label)
    .join(', ') || 'Não especificado';

  // Identificar autenticação
  const hasAuthService = assetNodes.some(n => 
    n.data.label?.toLowerCase().includes('auth') ||
    n.data.assetId === 'auth-service'
  );
  
  const authentication = hasAuthService
    ? 'Sistema possui serviço de autenticação dedicado'
    : 'Não especificado no diagrama';

  // ===== ANÁLISE COMPLETA DOS FLUXOS =====
  
  // Identificar fluxos de dados com detalhes completos
  const dataFlows = edges
    .map(e => {
      const sourceNode = assetNodes.find(n => n.id === e.source);
      const targetNode = assetNodes.find(n => n.id === e.target);
      
      if (!sourceNode || !targetNode) return null;
      
      const label = e.label || 'dados';
      const dataType = e.data?.dataType || 'não especificado';
      const bidirectional = e.data?.bidirectional ? '↔️ (bidirecional)' : '→ (unidirecional)';
      const encrypted = e.data?.encrypted ? '🔒 criptografado' : '⚠️ não criptografado';
      
      return `  • ${sourceNode.data.label} ${bidirectional} ${targetNode.data.label}
    - Fluxo: ${label}
    - Tipo: ${dataType} (${encrypted})`;
    })
    .filter(Boolean)
    .join('\n\n');

  // Analisar fluxos de dados não criptografados (alto risco)
  const unencryptedFlows = edges.filter(e => {
    const dataType = (e.data?.dataType || '').toLowerCase();
    const encrypted = e.data?.encrypted;
    
    return e.data?.dataType && 
           !encrypted &&
           (dataType.includes('http') && !dataType.includes('https')) ||
           dataType === 'websocket' ||
           dataType === 'queries';
  });

  // Analisar fluxos com dados sensíveis
  const sensitiveFlows = edges.filter(e => {
    const dataType = (e.data?.dataType || '').toLowerCase();
    return dataType.includes('sensíveis') || 
           dataType.includes('credenciais') || 
           dataType.includes('tokens');
  });

  // Analisar fluxos cross-boundary
  const boundaries = nodes.filter(n => n.type === 'boundary');
  const crossBoundaryFlows = edges.filter(e => {
    const sourceNode = nodes.find(n => n.id === e.source);
    const targetNode = nodes.find(n => n.id === e.target);
    if (!sourceNode || !targetNode) return false;

    const sourceBoundary = boundaries.find(b => isNodeInsideBoundary(sourceNode, b));
    const targetBoundary = boundaries.find(b => isNodeInsideBoundary(targetNode, b));
    
    return sourceBoundary?.id !== targetBoundary?.id;
  });

  // Construir descrição geral
  const generalDescription = `Sistema modelado visualmente com arquitetura de ${assetNodes.length} componentes e ${edges.length} fluxos de dados.

COMPONENTES PRINCIPAIS:
${components || 'Não especificado'}

INTEGRAÇÕES EXTERNAS:
${externalIntegrations}

DADOS:
${sensitiveData}

AUTENTICAÇÃO:
${authentication}`;

  // Construir contexto adicional rico para análise
  let additionalContext = `═══════════════════════════════════════════════════════════
📊 ANÁLISE DETALHADA DO DIAGRAMA VISUAL
═══════════════════════════════════════════════════════════

🔍 ESTATÍSTICAS GERAIS:
  • Total de componentes: ${assetNodes.length}
  • Total de fluxos de dados: ${edges.length}
  • Trust boundaries: ${boundaries.length}

🚨 ANÁLISE DE RISCOS DOS FLUXOS:
  • Fluxos não criptografados: ${unencryptedFlows.length} ${unencryptedFlows.length > 0 ? '⚠️ ALTO RISCO' : '✅'}
  • Fluxos com dados sensíveis: ${sensitiveFlows.length} ${sensitiveFlows.length > 0 ? '⚠️ ATENÇÃO' : '✅'}
  • Fluxos cross-boundary: ${crossBoundaryFlows.length} ${crossBoundaryFlows.length > 0 ? '⚠️ VERIFICAR' : '✅'}

📦 FLUXOS DE DADOS DETALHADOS:
${dataFlows || '  Nenhum fluxo definido'}

`;

  // Adicionar alertas específicos
  if (unencryptedFlows.length > 0) {
    additionalContext += `\n⚠️ ALERTA DE SEGURANÇA - Fluxos não criptografados detectados:
${unencryptedFlows.map(e => {
  const source = assetNodes.find(n => n.id === e.source);
  const target = assetNodes.find(n => n.id === e.target);
  return `  • ${source?.data.label} → ${target?.data.label} (${e.data?.dataType || 'sem tipo'})`;
}).join('\n')}
Recomendação: Implementar TLS/SSL para proteger dados em trânsito.
`;
  }

  if (sensitiveFlows.length > 0) {
    additionalContext += `\n🔐 Fluxos com dados sensíveis identificados:
${sensitiveFlows.map(e => {
  const source = assetNodes.find(n => n.id === e.source);
  const target = assetNodes.find(n => n.id === e.target);
  const encrypted = e.data?.encrypted ? '✅ criptografado' : '❌ SEM CRIPTOGRAFIA';
  return `  • ${source?.data.label} → ${target?.data.label} (${encrypted})`;
}).join('\n')}
`;
  }

  if (crossBoundaryFlows.length > 0) {
    additionalContext += `\n🌐 Fluxos que cruzam trust boundaries:
${crossBoundaryFlows.map(e => {
  const source = assetNodes.find(n => n.id === e.source);
  const target = assetNodes.find(n => n.id === e.target);
  return `  • ${source?.data.label} → ${target?.data.label} (${e.label || 'sem nome'})`;
}).join('\n')}
Recomendação: Validar autenticação e autorização em cada boundary crossing.
`;
  }

  // Identificar componentes de IA/ML
  const aiComponents = assetNodes.filter(n => n.data.assetType === 'ai');
  if (aiComponents.length > 0) {
    additionalContext += `\n🤖 COMPONENTES DE IA/ML IDENTIFICADOS:
${aiComponents.map(n => `  • ${n.data.label} (${n.data.assetId})`).join('\n')}

⚠️ ATENÇÃO: Sistema contém componentes de IA/ML. Considere ameaças específicas do OWASP LLM Top 10:
- LLM01: Prompt Injection
- LLM03: Training Data Poisoning
- LLM05: Supply Chain Vulnerabilities
- LLM06: Sensitive Information Disclosure
- LLM10: Model Theft
`;
  }

  return {
    systemName,
    systemVersion: new Date().toISOString().split('T')[0],
    generalDescription,
    components: components || 'Componentes identificados no diagrama visual',
    sensitiveData,
    technologies,
    authentication,
    userProfiles,
    externalIntegrations,
    additionalContext
  };
}

/**
 * Verifica se um node está dentro de uma boundary
 */
function isNodeInsideBoundary(node: Node, boundary: Node): boolean {
  if (!boundary.position || !boundary.style?.width || !boundary.style?.height) {
    return false;
  }

  const nodeX = node.position.x;
  const nodeY = node.position.y;
  const boundaryX = boundary.position.x;
  const boundaryY = boundary.position.y;
  const boundaryWidth = typeof boundary.style.width === 'number' ? boundary.style.width : parseInt(boundary.style.width as string);
  const boundaryHeight = typeof boundary.style.height === 'number' ? boundary.style.height : parseInt(boundary.style.height as string);

  return (
    nodeX >= boundaryX &&
    nodeX <= boundaryX + boundaryWidth &&
    nodeY >= boundaryY &&
    nodeY <= boundaryY + boundaryHeight
  );
}

/**
 * Gera resumo do diagrama
 */
export function generateDiagramSummary(nodes: Node[], edges: Edge[]): string {
  const assetNodes = nodes.filter(n => n.type === 'custom' || !n.type);
  const boundaries = nodes.filter(n => n.type === 'boundary');

  const assetsByCategory: Record<string, number> = {};
  assetNodes.forEach(n => {
    const category = n.data.assetType || 'other';
    assetsByCategory[category] = (assetsByCategory[category] || 0) + 1;
  });

  let summary = `📊 Resumo do Diagrama:\n\n`;
  summary += `Total de Assets: ${assetNodes.length}\n`;
  summary += `Total de Fluxos: ${edges.length}\n`;
  summary += `Trust Boundaries: ${boundaries.length}\n\n`;
  
  summary += `Assets por Categoria:\n`;
  Object.entries(assetsByCategory).forEach(([category, count]) => {
    const emoji = {
      'ai': '🤖',
      'data': '📊',
      'storage': '💾',
      'service': '⚙️',
      'external': '🔗',
      'user': '👤'
    }[category] || '📦';
    summary += `  ${emoji} ${category}: ${count}\n`;
  });

  return summary;
}


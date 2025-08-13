import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportData } from '../types';

interface ReportDisplayProps {
  reportData: ReportData | null;
  isLoading: boolean;
}

const safeString = (value: any) => {
  if (typeof value === 'string')
    return value;
  if (value === null || value === undefined)
    return 'Não informado';
  return String(value);
};

const generateMarkdownReport = (reportData: ReportData): string => {
  const { systemInfo, threats, generatedAt } = reportData;
  
  return `# Relatório de Modelagem de Ameaças

## Informações do Sistema

**Nome do Sistema:** ${safeString(systemInfo.systemName)}
**Versão:** ${safeString(systemInfo.systemVersion)}
**Data de Geração:** ${new Date(generatedAt).toLocaleString('pt-BR')}

### Descrição Geral
${safeString(systemInfo.generalDescription)}

### Componentes
${safeString(systemInfo.components)}

### Dados Sensíveis
${safeString(systemInfo.sensitiveData)}

### Tecnologias
${safeString(systemInfo.technologies)}

### Autenticação
${safeString(systemInfo.authentication)}

### Perfis de Usuário
${safeString(systemInfo.userProfiles)}

### Integrações Externas
${safeString(systemInfo.externalIntegrations)}

## Ameaças Identificadas

${threats.map((threat, index) => `
### Ameaça ${index + 1}

**Elemento:** ${safeString(threat.elementName)}
**Categoria STRIDE:** ${safeString(threat.strideCategory)}
**Impacto:** ${safeString(threat.impact)}
**OWASP Top 10:** ${safeString(threat.owaspTop10)}

**Cenário de Ameaça:**
${safeString(threat.threatScenario)}

**CAPEC ID:** ${safeString(threat.capecId)}
**CAPEC Nome:** ${safeString(threat.capecName)}
**Descrição CAPEC:**
${safeString(threat.capecDescription)}

**Recomendações de Mitigação:**
${safeString(threat.mitigationRecommendations)}

---
`).join('')}

---
*Relatório gerado automaticamente por IA. Sempre valide com especialistas em segurança.*
`;
};

const ReportDisplay: React.FC<ReportDisplayProps> = ({ reportData, isLoading }) => {
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [showAttackTree, setShowAttackTree] = useState<boolean>(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reportData) {
      setMarkdownContent(generateMarkdownReport(reportData));
    } else {
      setMarkdownContent("");
    }
  }, [reportData]);

  const openAttackTree = () => {
    if (!reportData?.attackTreeMermaid) return;
    const encoded = btoa(encodeURIComponent(reportData.attackTreeMermaid));
    const url = `/mermaid-iframe.html?diagram=${encoded}`;
    window.open(url, '_blank');
  };

  const iframeSrc = (() => {
    if (!reportData?.attackTreeMermaid) return '';
    try {
      const encoded = btoa(encodeURIComponent(reportData.attackTreeMermaid));
      return `/mermaid-iframe.html?diagram=${encoded}`;
    } catch {
      return '';
    }
  })();

  const handleDownloadPdf = () => {
    if (!reportRef.current) return;

    const pdf = new jsPDF();
    const content = reportRef.current.innerText || '';
    
    // Configurar fonte e tamanho
    pdf.setFontSize(12);
    
    // Dividir conteúdo em linhas que cabem na página
    const pageWidth = pdf.internal.pageSize.getWidth() - 20;
    const lines = pdf.splitTextToSize(content, pageWidth);
    
    let yPosition = 20;
    const lineHeight = 7;
    
    lines.forEach((line: string) => {
      if (yPosition > pdf.internal.pageSize.getHeight() - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(line, 10, yPosition);
      yPosition += lineHeight;
    });
    
    pdf.save('relatorio-ameacas.pdf');
  };

  const copyAttackTreeLink = () => {
    if (!reportData?.attackTreeMermaid) return;
    const encoded = btoa(encodeURIComponent(reportData.attackTreeMermaid));
    const url = `${window.location.origin}/mermaid-iframe.html?diagram=${encoded}`;
    navigator.clipboard.writeText(url);
  };

  if (!reportData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Relatório de Modelagem de Ameaças
          </h2>
          <p className="text-gray-400 text-sm">
            Gerado em {new Date(reportData.generatedAt).toLocaleString('pt-BR')}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800 transition"
          >
            📄 Baixar PDF
          </button>
          
          {reportData.attackTreeMermaid && (
            <>
              <button
                onClick={() => setShowAttackTree(!showAttackTree)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-gray-800 transition"
              >
                🌳 Ver Árvore de Ataque
              </button>
              
              <button
                onClick={openAttackTree}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-gray-800 transition"
              >
                🔗 Abrir em Nova Aba
              </button>
              
              <button
                onClick={copyAttackTreeLink}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-800 transition"
              >
                📋 Copiar Link
              </button>
            </>
          )}
        </div>
      </div>

      {/* Árvore de Ataque Embarcada */}
      {showAttackTree && reportData.attackTreeMermaid && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Árvore de Ataque</h3>
            <p className="text-gray-400 text-sm">
              Visualização interativa das ameaças organizadas por categoria STRIDE
            </p>
          </div>
          <div className="h-96">
            <iframe
              src={iframeSrc}
              className="w-full h-full border-0"
              title="Árvore de Ataque"
            />
          </div>
        </div>
      )}

      {/* Conteúdo do Relatório */}
      <article className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-6">
          <div ref={reportRef}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              className="prose prose-invert max-w-none"
            >
              {markdownContent}
            </ReactMarkdown>
          </div>
        </div>
      </article>
    </div>
  );
};

export default ReportDisplay;

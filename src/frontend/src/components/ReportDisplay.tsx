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
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object' && value !== null) return JSON.stringify(value, null, 2);
  return value ?? '';
};

const generateMarkdownReport = (data: ReportData): string => {
  // Suporte para quando generalDescription é um objeto com todos os campos do resumo
  let desc = data.systemInfo.generalDescription;
  let components = data.systemInfo.components;
  let sensitiveData = data.systemInfo.sensitiveData;
  let technologies = data.systemInfo.technologies;
  let authentication = data.systemInfo.authentication;
  let userProfiles = data.systemInfo.userProfiles;
  let externalIntegrations = data.systemInfo.externalIntegrations;

  if (
    typeof desc === 'object' &&
    desc !== null &&
    'generalDescription' in desc
  ) {
    const d = desc as any;
    components = d.components;
    sensitiveData = d.sensitiveData;
    technologies = d.technologies;
    authentication = d.authentication;
    userProfiles = d.userProfiles;
    externalIntegrations = d.externalIntegrations;
    desc = d.generalDescription;
  }

  return `
# Relatório de Modelagem de Ameaças: ${data.systemInfo.systemName}

**Gerado em:** ${new Date(data.generatedAt).toLocaleString('pt-BR')}

## 1. Visão Geral do Sistema

**Descrição Geral:** ${safeString(desc)}

**Componentes Chave:** ${safeString(components)}

**Dados Sensíveis:** ${safeString(sensitiveData)}

**Tecnologias:** ${safeString(technologies)}

**Autenticação/Autorização:** ${safeString(authentication)}

**Perfis de Usuário:** ${safeString(userProfiles)}

**Integrações Externas:** ${safeString(externalIntegrations)}



## 3. Análise de Ameaças (STRIDE + CAPEC)

_A tabela de ameaças é renderizada como um componente React separado para melhor visualização._

## 4. Recomendações Gerais de Segurança

*   Revise e atualize regularmente este modelo de ameaças à medida que o sistema evolui.
*   Implemente logging e monitoramento abrangentes em todos os componentes.
*   Conduza auditorias de segurança e testes de penetração regularmente.
*   Garanta que todas as dependências estejam atualizadas e corrigidas.
*   Siga práticas de codificação segura (ex: Nome do CAPEC).
*   Forneça treinamento de conscientização em segurança para desenvolvedores e usuários.
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
    if (!reportData) return;

    const doc = new jsPDF();

    // Cores do tema do frontend
    const primaryOrange = '#ff6b35'; // z4l1nux-primary (cor laranja do frontend)
    const darkBlack = '#000000';     // custom-black
    const lightGray = '#F5F5F5';     // Para texto em fundo escuro

    // Extrair campos do resumo igual ao markdown
    let desc = reportData.systemInfo.generalDescription;
    let components = reportData.systemInfo.components;
    let sensitiveData = reportData.systemInfo.sensitiveData;
    let technologies = reportData.systemInfo.technologies;
    let authentication = reportData.systemInfo.authentication;
    let userProfiles = reportData.systemInfo.userProfiles;
    let externalIntegrations = reportData.systemInfo.externalIntegrations;

    if (
      typeof desc === 'object' &&
      desc !== null &&
      'generalDescription' in desc
    ) {
      const d = desc as any;
      components = d.components;
      sensitiveData = d.sensitiveData;
      technologies = d.technologies;
      authentication = d.authentication;
      userProfiles = d.userProfiles;
      externalIntegrations = d.externalIntegrations;
      desc = d.generalDescription;
    }

    // Título
    doc.setFontSize(18);
    doc.setTextColor(darkBlack);
    doc.text(`Relatório de Modelagem de Ameaças: ${reportData.systemInfo.systemName}`, 14, 22, { maxWidth: 180 });

    // Informações do sistema
    doc.setFontSize(12);
    doc.setTextColor(darkBlack);
    doc.text(`Gerado em: ${new Date(reportData.generatedAt).toLocaleString('pt-BR')}`, 14, 32, { maxWidth: 180 });
    // Descrição e campos do resumo
    let y = 40;
    const addField = (label: string, value: any) => {
      const txt = `${label}: ${safeString(value)}`;
      const split = doc.splitTextToSize(txt, 180);
      doc.text(split, 14, y);
      y += split.length * 7 + 2;
    };
    addField('Descrição', desc);
    addField('Componentes Chave', components);
    addField('Dados Sensíveis', sensitiveData);
    addField('Tecnologias', technologies);
    addField('Autenticação/Autorização', authentication);
    addField('Perfis de Usuário', userProfiles);
    addField('Integrações Externas', externalIntegrations);

    // Calcular altura dinâmica para a tabela
    const tableStartY = y + 6;

    // Tabela de Ameaças
    const tableColumn = ["Elemento", "STRIDE", "Cenário", "CAPEC ID", "Nome CAPEC", "Descrição CAPEC", "Mitigação", "Impacto", "OWASP Top 10"];
    const tableRows = reportData.threats.map(threat => [
      threat.elementName,
      threat.strideCategory,
      threat.threatScenario,
      threat.capecId,
      threat.capecName,
      threat.capecDescription,
      threat.mitigationRecommendations,
      threat.impact,
      threat.owaspTop10
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: tableStartY,
      theme: 'grid',
      tableWidth: 'auto',
      styles: { 
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
        halign: 'left',
        valign: 'middle',
        textColor: darkBlack,
      },
      headStyles: { 
        fillColor: primaryOrange,
        textColor: darkBlack
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 20 }, // Elemento
        1: { cellWidth: 18 }, // STRIDE
        2: { cellWidth: 28 }, // Cenário
        3: { cellWidth: 16 }, // CAPEC ID
        4: { cellWidth: 20 }, // Nome CAPEC
        5: { cellWidth: 28 }, // Descrição CAPEC
        6: { cellWidth: 28 }, // Mitigação
        7: { cellWidth: 14 }, // Impacto
        8: { cellWidth: 20 }, // OWASP Top 10
      }
    });

    // Nome do PDF: nome do sistema sem espaços/caracteres especiais
    let cleanName = reportData.systemInfo.systemName || "ThreatModelReport";
    cleanName = cleanName.split(" ")[0]; // Pega só a primeira palavra (nome curto)
    cleanName = cleanName.replace(/[^a-zA-Z0-9]/g, "");
    if (!cleanName) cleanName = "ThreatModelReport";
    doc.save(`${cleanName}_Threat_Model_Report.pdf`);
  };

  if (isLoading && !reportData) {
    return <div className="text-center p-10 text-xl text-indigo-400">Gerando relatório...</div>;
  }

  if (!reportData) {
    return <div className="text-center p-10 text-xl text-gray-400">Nenhum relatório gerado ainda. Por favor, submeta as informações do sistema.</div>;
  }

  return (
    <div ref={reportRef} className="space-y-8 p-6 bg-custom-black shadow-xl rounded-lg border border-custom-yellow/30">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-custom-yellow/30 pb-4 gap-2">
        <h2 className="text-2xl lg:text-3xl font-semibold text-custom-yellow">Relatório de Modelagem de Ameaças: {reportData.systemInfo.systemName}</h2>
        <div className="space-x-2 flex-shrink-0">
          <button
            onClick={() => reportData?.attackTreeMermaid ? setShowAttackTree(!showAttackTree) : undefined}
            disabled={!reportData?.attackTreeMermaid}
            className="px-3 py-2 text-xs sm:text-sm font-medium text-custom-black bg-custom-yellow hover:bg-custom-yellow/80 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-yellow focus:ring-offset-custom-black transition disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {showAttackTree ? 'Ocultar Árvore de Ataque' : 'Ver Árvore de Ataque'}
          </button>
          <button
            onClick={handleDownloadPdf}
            className="px-3 py-2 text-xs sm:text-sm font-medium text-custom-black bg-custom-yellow hover:bg-custom-yellow/80 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-yellow focus:ring-offset-custom-black transition"
          >
            Baixar PDF
          </button>
        </div>
      </div>

      {showAttackTree && reportData?.attackTreeMermaid && (
        <div className="w-full border border-custom-yellow/30 rounded-md overflow-hidden">
          <div className="flex justify-between items-center px-3 py-2 bg-black border-b border-custom-yellow/30">
            <span className="text-custom-yellow text-sm">Árvore de Ataque (Mermaid)</span>
            <div className="space-x-2">
              <button
                onClick={openAttackTree}
                className="px-2 py-1 text-xs font-medium text-custom-black bg-custom-yellow hover:bg-custom-yellow/80 rounded"
              >
                Abrir em Nova Aba
              </button>
              <button
                onClick={() => iframeSrc && navigator.clipboard.writeText(window.location.origin + iframeSrc)}
                className="px-2 py-1 text-xs font-medium text-custom-black bg-custom-yellow hover:bg-custom-yellow/80 rounded"
              >
                Copiar Link
              </button>
            </div>
          </div>
          <iframe
            title="Attack Tree"
            src={iframeSrc}
            style={{ width: '100%', height: '70vh', border: '0' }}
          />
        </div>
      )}

      <>
        <article className="prose prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-none p-4 bg-custom-black rounded shadow overflow-x-auto border border-custom-yellow/30">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownContent}</ReactMarkdown>
        </article>

          {/* Tabela React pura para ameaças */}
          <section className="mt-8 mb-8">
            <h3 className="text-2xl font-semibold text-custom-yellow mb-4">Análise de Ameaças (STRIDE + CAPEC)</h3>
            <div className="border border-custom-yellow/30 rounded-lg">
              <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
                <table className="w-full text-custom-yellow bg-black" style={{ tableLayout: 'fixed', minWidth: '1200px' }}>
                  <colgroup>
                    <col style={{ width: '120px' }} />{/* Nome do Elemento */}
                    <col style={{ width: '100px' }} />{/* Categoria STRIDE */}
                    <col style={{ width: '180px' }} />{/* Cenário de Ameaça */}
                    <col style={{ width: '80px' }} />{/* ID CAPEC */}
                    <col style={{ width: '140px' }} />{/* Nome do CAPEC */}
                    <col style={{ width: '240px' }} />{/* Descrição CAPEC */}
                    <col style={{ width: '240px' }} />{/* Recomendações de Mitigação */}
                    <col style={{ width: '80px' }} />{/* Impacto */}
                    <col style={{ width: '160px' }} />{/* OWASP Top 10 */}
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="px-4 py-3 border-b border-custom-yellow/30 text-left font-bold bg-black sticky top-0 z-10">Nome do Elemento</th>
                      <th className="px-4 py-3 border-b border-custom-yellow/30 text-left font-bold bg-black sticky top-0 z-10">Categoria STRIDE</th>
                      <th className="px-4 py-3 border-b border-custom-yellow/30 text-left font-bold bg-black sticky top-0 z-10">Cenário de Ameaça</th>
                      <th className="px-4 py-3 border-b border-custom-yellow/30 text-left font-bold bg-black sticky top-0 z-10">ID CAPEC</th>
                      <th className="px-4 py-3 border-b border-custom-yellow/30 text-left font-bold bg-black sticky top-0 z-10">Nome do CAPEC</th>
                      <th className="px-4 py-3 border-b border-custom-yellow/30 text-left font-bold bg-black sticky top-0 z-10">Descrição CAPEC</th>
                      <th className="px-4 py-3 border-b border-custom-yellow/30 text-left font-bold bg-black sticky top-0 z-10">Recomendações de Mitigação</th>
                      <th className="px-4 py-3 border-b border-custom-yellow/30 text-left font-bold bg-black sticky top-0 z-10">Impacto</th>
                      <th className="px-4 py-3 border-b border-custom-yellow/30 text-left font-bold bg-black sticky top-0 z-10">OWASP Top 10</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.threats.map((threat, idx) => (
                      <tr key={threat.id || idx} className="align-top hover:bg-gray-900">
                        <td className="px-4 py-3 border-b border-custom-yellow/20">
                          <div className="break-words whitespace-pre-line">{threat.elementName}</div>
                        </td>
                        <td className="px-4 py-3 border-b border-custom-yellow/20">
                          <div className="break-words whitespace-pre-line">{threat.strideCategory}</div>
                        </td>
                        <td className="px-4 py-3 border-b border-custom-yellow/20">
                          <div className="break-words whitespace-pre-line">{threat.threatScenario}</div>
                        </td>
                        <td className="px-4 py-3 border-b border-custom-yellow/20">
                          <a href={`https://capec.mitre.org/data/definitions/${threat.capecId.split('-')[1]}.html`} 
                             target="_blank" 
                             rel="noopener noreferrer" 
                             className="underline text-custom-yellow hover:text-custom-yellow/80">
                            {threat.capecId}
                          </a>
                        </td>
                        <td className="px-4 py-3 border-b border-custom-yellow/20">
                          <div className="break-words whitespace-pre-line">{threat.capecName}</div>
                        </td>
                        <td className="px-4 py-3 border-b border-custom-yellow/20">
                          <div className="break-words whitespace-pre-line">{threat.capecDescription}</div>
                        </td>
                        <td className="px-4 py-3 border-b border-custom-yellow/20">
                          <div className="break-words whitespace-pre-line">{threat.mitigationRecommendations}</div>
                        </td>
                        <td className="px-4 py-3 border-b border-custom-yellow/20">
                          <div className="break-words whitespace-pre-line">{threat.impact}</div>
                        </td>
                        <td className="px-4 py-3 border-b border-custom-yellow/20">
                          <div className="break-words whitespace-pre-line">{threat.owaspTop10}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-400 text-right pr-2">* Role horizontalmente para ver todos os detalhes</div>
            <style>{`
              .overflow-x-auto {
                scrollbar-width: thin;
                scrollbar-color: #FBC02D30 #000;
                overflow-x: auto;
              }
              .overflow-x-auto::-webkit-scrollbar {
                height: 8px;
              }
              .overflow-x-auto::-webkit-scrollbar-track {
                background: #000;
              }
              .overflow-x-auto::-webkit-scrollbar-thumb {
                background-color: #FBC02D30;
                border-radius: 4px;
              }
              td div {
                max-height: 300px;
                overflow-y: auto;
                padding-right: 6px;
                word-break: break-word;
                white-space: pre-line;
              }
              td div::-webkit-scrollbar {
                width: 4px;
              }
              td div::-webkit-scrollbar-track {
                background: #000;
              }
              td div::-webkit-scrollbar-thumb {
                background-color: #FBC02D30;
                border-radius: 2px;
              }
            `}</style>
          </section>
      </>
    </div>
  );
};

export default ReportDisplay;

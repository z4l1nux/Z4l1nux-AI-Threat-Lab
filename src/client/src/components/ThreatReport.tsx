import React, { useEffect, useRef } from 'react';
import { Threat } from '@shared/types/threat-modeling';

interface ThreatReportProps {
  threats: Threat[];
  systemName: string;
  systemType: string;
  sensitivity: string;
  description: string;
  assets: string;
}

export const ThreatReport: React.FC<ThreatReportProps> = ({
  threats,
  systemName,
  systemType: _systemType,
  sensitivity: _sensitivity,
  description: _description,
  assets: _assets
}) => {
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mermaidRef.current && (window as any).mermaid) {
      try {
        const attackTreeDiagram = generateAttackTree(systemName, threats);
        mermaidRef.current.innerHTML = attackTreeDiagram;
        
        // Aguardar um pouco para o DOM ser atualizado
        setTimeout(() => {
          if (mermaidRef.current) {
            (window as any).mermaid.init(undefined, mermaidRef.current);
          }
        }, 100);
      } catch (error) {
        console.error('Erro ao renderizar Mermaid:', error);
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = '<p>Erro ao renderizar diagrama de árvore de ataque</p>';
        }
      }
    }
  }, [threats, systemName]);

  const summaryStats = calculateStats(threats);

  return (
    <div className="results-section">
      <div className="report-card">
        <div className="report-header">
          <h2 className="report-title">🌳 Árvore de Ataque</h2>
          <button className="export-btn" onClick={exportReport}>
            📄 Exportar PDF
          </button>
        </div>
        <div className="attack-tree">
          <div ref={mermaidRef} className="mermaid"></div>
        </div>
      </div>
      
      <div className="report-card">
        <div className="report-header">
          <h2 className="report-title">📋 Análise Detalhada de Ameaças</h2>
        </div>
        <div className="summary-stats">
          <div className="stat-card">
            <div className="stat-number">{threats.length}</div>
            <div className="stat-label">Total de Ameaças</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{summaryStats.critical}</div>
            <div className="stat-label">Severidade Crítica</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{summaryStats.high}</div>
            <div className="stat-label">Severidade Alta</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{summaryStats.medium}</div>
            <div className="stat-label">Severidade Média</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{summaryStats.low}</div>
            <div className="stat-label">Severidade Baixa</div>
          </div>
        </div>
        {generateThreatTable(threats)}
      </div>
    </div>
  );
};

function generateAttackTree(systemName: string, threats: Threat[]): string {
  let diagram = `graph TD\n                A["🎯 ${systemName}"]`;
  let connections: string[] = [];
  let classes: string[] = [];
  let criticalClasses: string[] = [];
  
  const strideCategories: Record<string, { name: string; threats: Array<{ id: string; name: string; severity: string }> }> = {
    'S': { name: '🔑 Spoofing', threats: [] },
    'T': { name: '🔧 Tampering', threats: [] },
    'R': { name: '📜 Repudiation', threats: [] },
    'I': { name: '📊 Information Disclosure', threats: [] },
    'D': { name: '🚫 Denial of Service', threats: [] },
    'E': { name: '⬆️ Elevation of Privilege', threats: [] }
  };
  
  threats.forEach((threat, index) => {
    if (threat.stride && Array.isArray(threat.stride)) {
      threat.stride.forEach(category => {
        if (strideCategories[category]) {
          strideCategories[category].threats.push({
            id: `T${index + 1}`,
            name: threat.ameaca || threat.categoria || 'Ameaça',
            severity: threat.severidade || 'Média'
          });
        }
      });
    }
  });
  
  Object.entries(strideCategories).forEach(([key, category]) => {
    if (category.threats.length > 0) {
      connections.push(`A --> ${key}`);
      connections.push(`${key}["${category.name}"]`);
      
      category.threats.forEach(threat => {
        connections.push(`${key} --> ${threat.id}["${threat.name}"]`);
        
        if (threat.severity.toLowerCase() === 'crítica') {
          criticalClasses.push(threat.id);
        } else if (threat.severity.toLowerCase() === 'alta') {
          classes.push(threat.id);
        }
      });
    }
  });
  
  diagram += '\n                ' + connections.join('\n                ');
  
  diagram += `
                classDef critical fill:#dc2626,stroke:#991b1b,stroke-width:3px,color:#fff
                classDef high fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
                classDef medium fill:#d97706,stroke:#92400e,stroke-width:2px,color:#fff
                classDef low fill:#059669,stroke:#065f46,stroke-width:2px,color:#fff`;
  
  if (criticalClasses.length > 0) {
    diagram += `\n                class ${criticalClasses.join(',')} critical`;
  }
  
  if (classes.length > 0) {
    diagram += `\n                class ${classes.join(',')} high`;
  }
  
  return diagram;
}

function generateThreatTable(threats: Threat[]): JSX.Element {
  const strideColors = { 'S': '#3b82f6', 'T': '#8b5cf6', 'R': '#ef4444', 'I': '#10b981', 'D': '#f59e0b', 'E': '#6366f1' };
  
  const tableRows = threats.map(threat => {
    const strideTags = threat.stride.map(s => 
      `<span class="stride-tag" style="background-color: ${strideColors[s]}20; color: ${strideColors[s]};">${s}</span>`
    ).join('');
    
    const severityClass = threat.severidade.toLowerCase() === 'crítica' ? 'severity-critical' : 
                          threat.severidade.toLowerCase() === 'alta' ? 'severity-high' : 
                          threat.severidade.toLowerCase() === 'média' ? 'severity-medium' : 'severity-low';
    
    return (
      <tr key={threat.id}>
        <td>{threat.id}</td>
        <td dangerouslySetInnerHTML={{ __html: strideTags }}></td>
        <td>{threat.categoria}</td>
        <td>{threat.ameaca}</td>
        <td>{threat.descricao}</td>
        <td>{threat.impacto}</td>
        <td>{threat.probabilidade}</td>
        <td><span className={severityClass}>{threat.severidade}</span></td>
        <td>{threat.mitigacao}</td>
        <td>{threat.capec}</td>
        <td>{threat.deteccao}</td>
      </tr>
    );
  });

  return (
    <table className="threat-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>STRIDE</th>
          <th>Categoria</th>
          <th>Ameaça</th>
          <th>Descrição</th>
          <th>Impacto</th>
          <th>Probabilidade</th>
          <th>Severidade</th>
          <th>Mitigação</th>
          <th>CAPEC</th>
          <th>Detecção</th>
        </tr>
      </thead>
      <tbody>
        {tableRows}
      </tbody>
    </table>
  );
}

function calculateStats(threats: Threat[]): { critical: number; high: number; medium: number; low: number } {
  const stats = { critical: 0, high: 0, medium: 0, low: 0 };
  
  threats.forEach(threat => {
    const severity = (threat.severidade || 'média').toLowerCase();
    if (severity === 'crítica') stats.critical++;
    else if (severity === 'alta') stats.high++;
    else if (severity === 'média') stats.medium++;
    else stats.low++;
  });
  
  return stats;
}

async function exportReport(): Promise<void> {
  const { jsPDF } = (window as any).jspdf;
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  const resultsSection = document.querySelector('.results-section');
  if (!resultsSection) {
    alert('Nenhum relatório encontrado para exportar.');
    return;
  }

  pdf.setFontSize(20);
  pdf.setTextColor(255, 107, 53);
  pdf.text('Relatório de Análise de Ameaças', 20, 20);
  
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);
  
  const reportCards = resultsSection.querySelectorAll('.report-card');
  let yPosition = 40;
  
  for (let i = 0; i < reportCards.length; i++) {
    const card = reportCards[i] as HTMLElement;
    
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 20;
    }
    
    const canvas = await (window as any).html2canvas(card, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#0f1419'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    if (yPosition + imgHeight > 280) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight);
    yPosition += imgHeight + 10;
  }
  
  pdf.save('relatorio-analise-ameacas.pdf');
}

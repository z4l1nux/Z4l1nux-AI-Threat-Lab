import { useState, useCallback, useEffect } from 'react';
import { SystemInfo, IdentifiedThreat, ReportData, StrideCapecMapType } from '../types';
import { analyzeThreatsAndMitigations, summarizeSystemDescription, generateAttackTreeMermaid } from '../services/geminiService';

export const useThreatModeler = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [threats, setThreats] = useState<IdentifiedThreat[] | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [strideCapecMap, setStrideCapecMap] = useState<StrideCapecMapType | null>(null);

  useEffect(() => {
    const fetchMapping = async () => {
      try {
        // In a Vite/Create React App setup, files in `public` are served at the root.
        const response = await fetch('/data/mapeamento-stride-capec-pt.json'); // Updated file name
        if (!response.ok) {
          throw new Error(`Erro HTTP! status: ${response.status}`);
        }
        const data: StrideCapecMapType = await response.json();
        setStrideCapecMap(data);
      } catch (e: any) {
        console.error("Falha ao carregar o mapeamento STRIDE-CAPEC:", e);
        setError("Falha ao carregar dados críticos de mapeamento STRIDE-CAPEC. Verifique o console.");
        setStrideCapecMap([]); // Set to empty array to prevent further issues if map is required
      }
    };
    fetchMapping();
  }, []);

  const generateThreatModel = useCallback(async (systemInfo: SystemInfo) => {
    if (!strideCapecMap) {
      setError("Mapeamento STRIDE-CAPEC ainda não foi carregado. Aguarde um momento e tente novamente.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSystemInfo(systemInfo);

    try {
      // 1. Resumir e estruturar a descrição do sistema
      const summarizedSystemInfo = await summarizeSystemDescription(systemInfo.generalDescription);
      
      // 2. Analisar ameaças e mitigações
      const { threats: identifiedThreats } = await analyzeThreatsAndMitigations(
        summarizedSystemInfo,
        strideCapecMap
      );

      // 3. Gerar árvore de ataque em Mermaid
      let mermaidDiagram = '';
      try {
        mermaidDiagram = await generateAttackTreeMermaid(summarizedSystemInfo, identifiedThreats);
      } catch (err) {
        console.warn('Falha ao gerar diagrama Mermaid:', err);
        // Continue sem o diagrama
      }

      // 4. Criar relatório final
      const newReportData: ReportData = {
        systemInfo: summarizedSystemInfo,
        threats: identifiedThreats,
        generatedAt: new Date().toISOString(),
        attackTreeMermaid: mermaidDiagram
      };

      setReportData(newReportData);
      setThreats(identifiedThreats);
    } catch (e: any) {
      console.error("Erro ao gerar modelo de ameaças:", e);
      setError(e.message || "Ocorreu um erro desconhecido durante a geração do modelo de ameaças.");
    } finally {
      setIsLoading(false);
    }
  }, [strideCapecMap]);

  return {
    systemInfo,
    threats,
    reportData,
    isLoading,
    error,
    generateThreatModel,
    setSystemInfo 
  };
};
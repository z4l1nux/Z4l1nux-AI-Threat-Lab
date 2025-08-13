import { useState, useCallback, useEffect } from 'react';
import { SystemInfo, IdentifiedThreat, ReportData, StrideCapecMapType } from '../types';
import { analyzeThreatsAndMitigations, refineAnalysis, summarizeSystemDescription, generateAttackTreeMermaid } from '../services/geminiService';


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

  const generateThreatModel = useCallback(async (currentSystemInfo: SystemInfo) => {
    if (!strideCapecMap) {
      setError("Mapeamento STRIDE-CAPEC não carregado. Não é possível gerar o modelo.");
      setIsLoading(false); // Ensure loading is stopped
      return;
    }
    if (strideCapecMap.length === 0 && !error) { // If map is empty but no fetch error, it might be an issue with the file content
        setError("Mapeamento STRIDE-CAPEC está vazio. Verifique o arquivo 'mapeamento-stride-capec-pt.json'.");
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);

    try {
      // 1. Modelagem de ameaças com a descrição COMPLETA
      setSystemInfo(currentSystemInfo);
      const identifiedThreats = await analyzeThreatsAndMitigations(currentSystemInfo, strideCapecMap);
      setThreats(identifiedThreats);
      // 2. Resumir a descrição geral via IA APENAS para exibição
      const summarizedDescription = await summarizeSystemDescription(currentSystemInfo.generalDescription || "");
      const systemInfoWithSummary = {
        ...currentSystemInfo,
        generalDescription: summarizedDescription
      };
      const newReportData: ReportData = {
        systemInfo: systemInfoWithSummary,
        threats: identifiedThreats,
        generatedAt: new Date().toISOString(),
      };
      try {
        const mermaid = await generateAttackTreeMermaid(systemInfoWithSummary as SystemInfo, identifiedThreats);
        setReportData({ ...newReportData, attackTreeMermaid: mermaid });
      } catch (err) {
        console.warn('Falha ao gerar Mermaid de árvore de ataque:', err);
        setReportData(newReportData);
      }
    } catch (e: any) {
      console.error("Erro ao gerar modelo de ameaças:", e);
      setError(e.message || "Ocorreu um erro desconhecido durante a geração do modelo de ameaças.");
    } finally {
      setIsLoading(false);
    }
  }, [strideCapecMap, error]);
  
  const updateReportMarkdown = useCallback((markdown: string) => {
      console.log("Markdown do relatório atualizado (no hook, se necessário):", markdown.substring(0,100) + "...");
       if (reportData) {
       }
  }, [reportData]);

  const refineThreatModel = useCallback(async (currentMarkdown: string) => {
    if (!systemInfo || !strideCapecMap) {
      setError("Informações do sistema ou mapeamento STRIDE-CAPEC não estão disponíveis para refinamento.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { threats: refinedThreats } = await refineAnalysis(
        systemInfo,
        currentMarkdown,
        strideCapecMap
      );

      const newReportData: ReportData = {
        systemInfo: systemInfo, // Keep original system info
        threats: refinedThreats,
        generatedAt: new Date().toISOString(), // Update timestamp
      };
      try {
        const mermaid = await generateAttackTreeMermaid(systemInfo, refinedThreats);
        setReportData({ ...newReportData, attackTreeMermaid: mermaid });
      } catch (err) {
        console.warn('Falha ao gerar Mermaid após refinamento:', err);
        setReportData(newReportData);
      }

    } catch (e: any) {
      console.error("Erro ao refinar análise:", e);
      setError(e.message || "Ocorreu um erro desconhecido durante o refinamento da análise.");
    } finally {
      setIsLoading(false);
    }
  }, [systemInfo, strideCapecMap]);


  return {
    systemInfo,
    threats,
    reportData,
    isLoading,
    error,
    generateThreatModel,
    updateReportMarkdown,
    refineThreatModel,
    setSystemInfo 
  };
};
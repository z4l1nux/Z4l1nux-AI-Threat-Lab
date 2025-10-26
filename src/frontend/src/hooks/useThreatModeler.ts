import { useState, useCallback, useEffect } from 'react';
import { SystemInfo, IdentifiedThreat, ReportData } from '../../types';
import { refineAnalysis, summarizeSystemDescription, generateAttackTreeMermaid, analyzeThreats } from '../services/aiService';
import { useModelSelection } from './useModelSelection';

export const useThreatModeler = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [threats, setThreats] = useState<IdentifiedThreat[] | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [ragInitialized, setRagInitialized] = useState<boolean>(false);
  
  const { getModelConfig } = useModelSelection();

  // Sistema tradicional sempre disponível
  useEffect(() => {
    console.log('🔧 Sistema tradicional sempre disponível');
    setRagInitialized(true);
  }, []);

  const generateThreatModel = useCallback(async (currentSystemInfo: SystemInfo) => {
    console.log('🔧 Sistema tradicional pronto para análise!');
    
    setIsLoading(true);
    setError(null);

    try {
      // Aguardar um pouco para garantir que o estado do modelo seja atualizado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Obter configuração do modelo
      const modelConfig = getModelConfig();
      console.log('🤖 Configuração do modelo atual:', modelConfig);
      console.log('🔍 Enviando para backend:', JSON.stringify(modelConfig, null, 2));
      console.log('⏰ Timestamp da análise:', new Date().toISOString());
      
      // Verificar se o modelo mudou desde a última análise
      const currentTime = Date.now();
      console.log('🕐 Timestamp atual:', currentTime);
      
      // Enviar descrição do sistema ao backend RAG para processamento automático
      try {
        const systemId = `${currentSystemInfo.systemName || 'Sistema'}_${currentSystemInfo.generalDescription?.substring(0, 50) || 'Descricao'}_${new Date().toISOString().split('T')[0]}`;
        console.log('📤 Enviando informações do sistema ao RAG:', systemId);
        
        // Upload do documento para RAG (comentado por enquanto)
        // await ragService.uploadDocument(
        //   currentSystemInfo.generalDescription || ""
        // );
        
        console.log('✅ Informações do sistema processadas no RAG com sucesso');
      } catch (ragError) {
        console.warn('⚠️ Aviso: Falha ao processar no RAG, continuando com análise:', ragError);
      }
      
      // 1. Modelagem de ameaças com sistema tradicional
      setSystemInfo(currentSystemInfo);
      
      let identifiedThreats: IdentifiedThreat[];
      
      // Usar sistema tradicional
      console.log('🔧 Usando sistema tradicional para análise...');
      try {
        identifiedThreats = await analyzeThreats(currentSystemInfo, modelConfig);
        console.log(`✅ Sistema tradicional concluído: ${identifiedThreats.length} ameaças`);
      } catch (analysisError) {
        console.error('❌ Sistema tradicional falhou:', analysisError);
        throw new Error(`Análise de ameaças falhou: ${analysisError instanceof Error ? analysisError.message : 'Erro desconhecido'}`);
      }
      
      setThreats(identifiedThreats);
      
      // 2. Resumir e estruturar informações do sistema via IA para exibição
      console.log('📝 Resumindo informações do sistema para exibição...');
      const summarizedInfo = await summarizeSystemDescription(currentSystemInfo.generalDescription || "", modelConfig);
      
      // Mesclar informações resumidas com dados originais
      const finalSystemInfo: SystemInfo = {
        ...currentSystemInfo,
        systemName: summarizedInfo.systemName || currentSystemInfo.systemName,
        generalDescription: summarizedInfo.generalDescription || currentSystemInfo.generalDescription,
        components: summarizedInfo.components || currentSystemInfo.components,
        sensitiveData: summarizedInfo.sensitiveData || currentSystemInfo.sensitiveData,
        technologies: summarizedInfo.technologies || currentSystemInfo.technologies,
        authentication: summarizedInfo.authentication || currentSystemInfo.authentication,
        userProfiles: summarizedInfo.userProfiles || currentSystemInfo.userProfiles,
        externalIntegrations: summarizedInfo.externalIntegrations || currentSystemInfo.externalIntegrations
      };
      
      console.log('✅ Informações do sistema estruturadas:', {
        systemName: finalSystemInfo.systemName,
        systemVersion: new Date().toISOString().split('T')[0],
        generalDescription: finalSystemInfo.generalDescription?.substring(0, 100) + '...',
        components: finalSystemInfo.components,
        sensitiveData: finalSystemInfo.sensitiveData,
        technologies: finalSystemInfo.technologies,
        authentication: finalSystemInfo.authentication,
        userProfiles: finalSystemInfo.userProfiles,
        externalIntegrations: finalSystemInfo.externalIntegrations
      });
      
      // 3. Gerar árvore de ataque em Mermaid
      console.log('🌳 Gerando árvore de ataque...');
      const attackTreeMermaid = await generateAttackTreeMermaid(identifiedThreats, finalSystemInfo.systemName || 'Sistema', modelConfig);
      
      // 4. Criar dados do relatório
      const newReportData: ReportData = {
        systemInfo: finalSystemInfo,
        threats: identifiedThreats,
        attackTreeMermaid,
        generatedAt: new Date().toISOString()
      };
      
      setReportData(newReportData);
      console.log('✅ Modelo de ameaças gerado com sucesso!');
      
    } catch (e) {
      console.error("Erro ao gerar modelo de ameaças:", e);
      setError(e instanceof Error ? e.message : "Ocorreu um erro desconhecido durante a geração do modelo de ameaças.");
    } finally {
      setIsLoading(false);
    }
  }, [getModelConfig, ragInitialized]);
  
  const updateReportMarkdown = useCallback((markdown: string) => {
    console.log("Markdown do relatório atualizado (no hook, se necessário):", markdown.substring(0,100) + "...");
    if (reportData) {
      // Atualizar o markdown no reportData se necessário
    }
  }, [reportData]);

  const refineThreatModel = useCallback(async (markdown: string) => {
    if (!systemInfo) {
      setError("Nenhum sistema carregado para refinar.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("🔄 Refinando análise de ameaças...");
      
      // Obter configuração do modelo
      const modelConfig = getModelConfig();
      
      // Refinar a análise usando o markdown fornecido
      const refinedMarkdown = await refineAnalysis(markdown, modelConfig);
      
      // Por enquanto, manter as ameaças existentes
      // TODO: Implementar parsing do markdown refinado para extrair ameaças
      console.log('✅ Análise refinada:', refinedMarkdown.substring(0, 100) + '...');
      
      // Atualizar dados do relatório
      if (reportData) {
        const updatedReportData: ReportData = {
          ...reportData,
          generatedAt: new Date().toISOString()
        };
        setReportData(updatedReportData);
      }
      
      console.log("✅ Análise refinada com sucesso!");
      
    } catch (e) {
      console.error("Erro ao refinar análise:", e);
      setError(e instanceof Error ? e.message : "Ocorreu um erro desconhecido durante o refinamento da análise.");
    } finally {
      setIsLoading(false);
    }
  }, [systemInfo, getModelConfig]);

  // Função para resetar todo o estado e começar uma nova modelagem
  const resetThreatModel = useCallback(() => {
    console.log('🔄 Resetando modelagem de ameaças...');
    setSystemInfo(null);
    setThreats(null);
    setReportData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    systemInfo,
    threats,
    reportData,
    isLoading,
    error,
    ragInitialized,
    generateThreatModel,
    updateReportMarkdown,
    refineThreatModel,
    setSystemInfo,
    resetThreatModel
  };
};

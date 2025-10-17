import { useState, useCallback, useEffect } from 'react';
import { SystemInfo, IdentifiedThreat, ReportData, StrideCapecMapType } from '../types';
import { analyzeThreatsAndMitigations, refineAnalysis, summarizeSystemDescription, generateAttackTreeMermaid } from '../services/aiService';
import { useModelSelection } from './useModelSelection';
import { ragService } from '../services/ragService';


export const useThreatModeler = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [threats, setThreats] = useState<IdentifiedThreat[] | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [strideCapecMap, setStrideCapecMap] = useState<StrideCapecMapType | null>(null);
  const [ragInitialized, setRagInitialized] = useState<boolean>(false);
  
  const { getModelConfig } = useModelSelection();

  // Verificar se o RAG está inicializado antes de buscar o mapeamento
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    const checkRAGStatus = async () => {
      try {
        const health = await ragService.checkHealth();
        const isInitialized = health.services.rag === 'initialized';
        setRagInitialized(isInitialized);
        
        if (isInitialized) {
          console.log('✅ RAG inicializado! Pronto para buscar mapeamento STRIDE-CAPEC.');
          // Parar o polling quando o RAG estiver inicializado
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        } else {
          console.log('⏳ Aguardando RAG inicializar...');
        }
      } catch (error) {
        console.error('❌ Erro ao verificar status do RAG:', error);
        setRagInitialized(false);
      }
    };

    // Verificar imediatamente
    checkRAGStatus();

    // Verificar periodicamente até o RAG estar pronto (apenas se não estiver inicializado)
    if (!ragInitialized) {
      intervalId = setInterval(checkRAGStatus, 2000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [ragInitialized]);

  useEffect(() => {
    // Só buscar o mapeamento quando o RAG estiver inicializado
    if (!ragInitialized) {
      console.log('⏳ Aguardando RAG inicializar antes de buscar mapeamento STRIDE-CAPEC...');
      return;
    }

    const fetchMapping = async () => {
      try {
        const BACKEND_URL = 'http://localhost:3001';
        console.log('📋 Buscando mapeamento STRIDE-CAPEC do RAG...');
        
        const response = await fetch(`${BACKEND_URL}/api/stride-capec-mapping`);
        
        if (!response.ok) {
          if (response.status === 503) {
            console.warn('⚠️ Sistema RAG não inicializado (ainda processando)');
            // Não mostrar erro imediatamente, aguardar mais um pouco
            return;
          }
          
          if (response.status === 404) {
            console.warn('⚠️ Mapeamento STRIDE-CAPEC não encontrado no RAG');
            setError("⚠️ Mapeamento STRIDE-CAPEC não encontrado. Por favor:\n\n1. Faça upload do arquivo 'capec-stride-mapping-completo.md' (pasta src/knowledge-base/)\n2. Aguarde o processamento no painel RAG (status: verde)\n3. Recarregue a página ou tente gerar o modelo novamente\n\n📁 Arquivo recomendado: src/knowledge-base/capec-stride-mapping-completo.md\n📦 Formatos aceitos: JSON, PDF, Markdown, TXT, DOCX, DOC");
            setStrideCapecMap([]);
            return;
          }
          
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Erro HTTP! status: ${response.status}`);
        }
        
        const data = await response.json();
        const mapping: StrideCapecMapType = data.mapping || [];
        
        if (mapping.length === 0) {
          console.warn('⚠️ Mapeamento STRIDE-CAPEC vazio');
          setError("⚠️ Mapeamento STRIDE-CAPEC está vazio ou não foi encontrado. Por favor:\n\n1. Verifique se o documento contém o mapeamento STRIDE-CAPEC\n2. Formatos aceitos: JSON, PDF, Markdown, TXT, DOCX, DOC\n3. Consulte MAPEAMENTO_STRIDE_CAPEC.md para exemplos\n4. Faça upload de um documento válido\n\nO documento deve conter as 6 categorias STRIDE:\n- Spoofing\n- Tampering\n- Repudiation\n- Information Disclosure\n- Denial of Service\n- Elevation of Privilege\n\nCom seus respectivos CAPECs (ex: CAPEC-98: Phishing)");
        } else {
          console.log(`✅ Mapeamento STRIDE-CAPEC carregado: ${mapping.length} categorias`);
          setError(null); // Limpar erro se houver sucesso
        }
        
        setStrideCapecMap(mapping);
      } catch (e: any) {
        console.error("Falha ao carregar o mapeamento STRIDE-CAPEC:", e);
        
        if (e.message?.includes('Failed to fetch')) {
          setError("❌ Backend não disponível. Por favor:\n1. Inicie o backend: npm run dev:backend\n2. Aguarde o backend iniciar\n3. Recarregue a página");
        } else {
          setError(`❌ Erro ao carregar mapeamento: ${e.message}\n\nVerifique os logs do console para mais detalhes.`);
        }
        
        setStrideCapecMap([]);
      }
    };
    fetchMapping();
  }, [ragInitialized]); // Executar quando ragInitialized mudar para true

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
      // Aguardar um pouco para garantir que o estado do modelo seja atualizado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Obter configuração do modelo FRESCAMENTE (não usar cache)
      const modelConfig = getModelConfig();
      console.log('🤖 Configuração do modelo atual:', modelConfig);
      console.log('🔍 Enviando para backend:', JSON.stringify(modelConfig, null, 2));
      console.log('⏰ Timestamp da análise:', new Date().toISOString());
      
      // Verificar se o modelo mudou desde a última análise
      const currentTime = Date.now();
      console.log('🕐 Timestamp atual:', currentTime);
      
      // 0. Enviar descrição do sistema ao backend RAG para processamento automático
      try {
        const BACKEND_URL = 'http://localhost:3001';
        const systemDocumentName = `Sistema_${currentSystemInfo.systemName}_${new Date().toISOString().split('T')[0]}`;
        const systemDocumentContent = `
Nome do Sistema: ${currentSystemInfo.systemName}

DESCRIÇÃO COMPLETA DO SISTEMA:
${currentSystemInfo.generalDescription}

COMPONENTES:
${currentSystemInfo.components || 'Não informado'}

DADOS SENSÍVEIS:
${currentSystemInfo.sensitiveData || 'Não informado'}

TECNOLOGIAS:
${currentSystemInfo.technologies || 'Não informado'}

AUTENTICAÇÃO:
${currentSystemInfo.authentication || 'Não informado'}

PERFIS DE USUÁRIO:
${currentSystemInfo.userProfiles || 'Não informado'}

INTEGRAÇÕES EXTERNAS:
${currentSystemInfo.externalIntegrations || 'Não informado'}
        `.trim();

        console.log(`📤 Enviando informações do sistema ao RAG: ${systemDocumentName}`);
        
        const ragResponse = await fetch(`${BACKEND_URL}/api/documents/text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: systemDocumentName, 
            content: systemDocumentContent,
            modelConfig: modelConfig
          })
        });

        if (ragResponse.ok) {
          console.log(`✅ Informações do sistema processadas no RAG com sucesso`);
        } else {
          console.warn('⚠️ Falha ao processar informações no RAG, continuando sem RAG');
        }
      } catch (ragError) {
        console.warn('⚠️ Erro ao enviar informações ao RAG, continuando sem RAG:', ragError);
      }

      // 1. Modelagem de ameaças com a descrição COMPLETA
      setSystemInfo(currentSystemInfo);
      const identifiedThreats = await analyzeThreatsAndMitigations(currentSystemInfo, strideCapecMap, modelConfig);
      setThreats(identifiedThreats);
      
      // 2. Resumir e estruturar informações do sistema via IA para exibição
      console.log('📝 Resumindo informações do sistema para exibição...');
      const summarizedInfo = await summarizeSystemDescription(currentSystemInfo.generalDescription || "", modelConfig);
      
      // Mesclar informações resumidas com dados originais
      const systemInfoWithSummary = {
        ...currentSystemInfo,
        generalDescription: summarizedInfo.generalDescription || currentSystemInfo.generalDescription,
        components: summarizedInfo.components || currentSystemInfo.components || "Não informado",
        sensitiveData: summarizedInfo.sensitiveData || currentSystemInfo.sensitiveData || "Não informado",
        technologies: summarizedInfo.technologies || currentSystemInfo.technologies || "Não informado",
        authentication: summarizedInfo.authentication || currentSystemInfo.authentication || "Não informado",
        userProfiles: summarizedInfo.userProfiles || currentSystemInfo.userProfiles || "Não informado",
        externalIntegrations: summarizedInfo.externalIntegrations || currentSystemInfo.externalIntegrations || "Não informado"
      };
      
      console.log('✅ Informações do sistema estruturadas:', systemInfoWithSummary);
      const newReportData: ReportData = {
        systemInfo: systemInfoWithSummary,
        threats: identifiedThreats,
        generatedAt: new Date().toISOString(),
      };
      try {
        const mermaid = await generateAttackTreeMermaid(identifiedThreats, currentSystemInfo.systemName, modelConfig);
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
  }, [strideCapecMap, error]); // Remover getModelConfig para evitar cache
  
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
      const modelConfig = getModelConfig();
      await refineAnalysis(
        currentMarkdown,
        modelConfig
      );

      // Para refinamento, mantemos as ameaças originais e apenas atualizamos o markdown
      const newReportData: ReportData = {
        systemInfo: systemInfo, // Keep original system info
        threats: threats || [], // Keep original threats
        generatedAt: new Date().toISOString(), // Update timestamp
      };
      
      // Não geramos novo Mermaid para refinamento, mantemos o original
      setReportData(newReportData);

    } catch (e: any) {
      console.error("Erro ao refinar análise:", e);
      setError(e.message || "Ocorreu um erro desconhecido durante o refinamento da análise.");
    } finally {
      setIsLoading(false);
    }
  }, [systemInfo, strideCapecMap]); // Remover getModelConfig para evitar cache


  // Função para resetar todo o estado e começar uma nova modelagem
  const resetThreatModel = useCallback(() => {
    console.log('🔄 Resetando modelagem de ameaças...');
    setSystemInfo(null);
    setThreats(null);
    setReportData(null);
    setError(null);
    // Manter strideCapecMap e ragInitialized (não precisam ser recarregados)
    console.log('✅ Estado resetado! Pronto para nova modelagem.');
    console.log('💡 Dica: Troque o modelo no seletor se necessário, depois faça nova análise.');
    console.log('⏳ Aguarde 1 segundo após trocar o modelo antes de analisar para garantir sincronização.');
  }, []);

  return {
    systemInfo,
    threats,
    reportData,
    isLoading,
    error,
    generateThreatModel,
    updateReportMarkdown,
    refineThreatModel,
    setSystemInfo,
    resetThreatModel  // Nova função para limpar o estado
  };
};
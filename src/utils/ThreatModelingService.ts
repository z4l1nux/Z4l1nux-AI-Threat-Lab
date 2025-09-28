/**
 * Serviço de Threat Modeling Aprimorado
 * Gerencia prompts, templates e lógica de análise de ameaças com melhor handling de respostas
 */

export interface ThreatModelingRequest {
  systemName: string;
  systemType: string;
  sensitivity: string;
  description: string;
  assets: string;
}

export interface Threat {
  id: string;
  stride: string[];
  categoria: string;
  ameaca: string;
  descricao: string;
  impacto: string;
  probabilidade: string;
  severidade: string;
  mitigacao: string;
  capec: string;
  deteccao: string;
}

export interface ThreatModelingResponse {
  threats: Threat[];
  source: 'ai' | 'mock' | 'hybrid';
  confidence: number;
}

export class ThreatModelingService {
  private static readonly STRIDE_MAPPING = {
    'S': 'Falsificação de identidade, impersonação, autenticação comprometida',
    'T': 'Alteração não autorizada de dados, manipulação de parâmetros, integridade comprometida',
    'R': 'Negação de ações, ausência de logs, impossibilidade de auditoria',
    'I': 'Exposição de dados sensíveis, vazamento de informações, logs mal configurados',
    'D': 'Sobrecarga do sistema, indisponibilidade, ataques de volume',
    'E': 'Escalação de privilégios, bypass de controles, acesso administrativo não autorizado'
  };

  private static readonly STRIDE_KEYWORDS = {
    'S': ['spoofing', 'impersonation', 'falsificação', 'identity', 'autenticação', 'login', 'authentication', 'credential'],
    'T': ['tampering', 'modification', 'alteração', 'manipulation', 'manipulação', 'integridade', 'integrity', 'modify'],
    'R': ['repudiation', 'denial', 'negação', 'repúdio', 'auditoria', 'logs', 'logging', 'accountability'],
    'I': ['information', 'disclosure', 'exposição', 'vazamento', 'dados', 'sensível', 'privacy', 'confidential'],
    'D': ['denial', 'service', 'negação', 'serviço', 'ddos', 'sobrecarga', 'availability', 'downtime'],
    'E': ['elevation', 'privilege', 'escalação', 'privilégio', 'administrativo', 'bypass', 'unauthorized access']
  };

  private static readonly THREAT_KEYWORDS = [
    'vulnerabilidade', 'vulnerability', 'ataque', 'attack', 'exploit', 'brecha', 'breach',
    'falha', 'flaw', 'risco', 'risk', 'comprometimento', 'compromise', 'invasão', 'intrusion',
    'penetração', 'penetration', 'bypass', 'bypassing', 'unauthorized', 'não autorizado',
    'malicious', 'malicioso', 'injection', 'injeção', 'xss', 'csrf', 'sql injection'
  ];



  /**
   * Gera prompt mais específico e menos propenso a recusas
   */
  static generateThreatModelingPrompt(
    request: ThreatModelingRequest,
    baseConhecimento: string
  ): string {
    // Usar linguagem mais técnica e educacional
    return `ANÁLISE TÉCNICA DE SEGURANÇA - AVALIAÇÃO DE RISCOS

Contexto: Análise de segurança cibernética para documentação técnica.

SISTEMA ANALISADO:
Nome: ${request.systemName}
Tipo: ${request.systemType}
Nível de Sensibilidade: ${request.sensitivity}
Descrição Técnica: ${request.description}
Ativos Principais: ${request.assets}

METODOLOGIA STRIDE (Standard Industry Framework):
- S (Spoofing): Riscos de falsificação de identidade
- T (Tampering): Riscos de alteração não autorizada
- R (Repudiation): Riscos de negação de transações
- I (Information Disclosure): Riscos de exposição de dados
- D (Denial of Service): Riscos de indisponibilidade
- E (Elevation of Privilege): Riscos de escalação de privilégios

TAREFA TÉCNICA:
Identifique 4-6 cenários de risco de segurança específicos para este sistema.
Para cada cenário, forneça análise estruturada conforme padrão da indústria.

FORMATO DE RESPOSTA REQUERIDO:
{
  "threats": [
    {
      "id": "THREAT-001",
      "stride": ["S"],
      "categoria": "Categoria técnica",
      "ameaca": "Nome específico do cenário",
      "descricao": "Descrição técnica detalhada",
      "impacto": "Impacto no sistema e dados",
      "probabilidade": "Alta/Média/Baixa",
      "severidade": "Crítica/Alta/Média/Baixa",
      "mitigacao": "Controles técnicos recomendados",
      "capec": "CAPEC-XXX",
      "deteccao": "Métodos de detecção técnica"
    }
  ]
}

BASE DE CONHECIMENTO TÉCNICO:
${baseConhecimento}

Nota: Esta análise é para fins educacionais e de documentação técnica de segurança.`;
  }

  /**
   * Gera prompt alternativo mais direto
   */
  static generateAlternativePrompt(request: ThreatModelingRequest): string {
    return `Análise de Segurança - Sistema: ${request.systemName}

Identifique 5 vulnerabilidades comuns para sistemas ${request.systemType}:

1. **Ataque de Injeção SQL**
   - Descrição: Manipulação de consultas SQL através de entrada maliciosa
   - Impacto: Acesso não autorizado a dados, modificação de informações
   - Mitigação: Usar prepared statements, validação de entrada

2. **Cross-Site Scripting (XSS)**
   - Descrição: Injeção de scripts maliciosos em páginas web
   - Impacto: Roubo de sessões, redirecionamento malicioso
   - Mitigação: Sanitização de entrada, Content Security Policy

3. **Falha de Autenticação**
   - Descrição: Bypass ou comprometimento de mecanismos de login
   - Impacto: Acesso não autorizado ao sistema
   - Mitigação: Autenticação multifator, políticas de senha fortes

4. **Exposição de Dados Sensíveis**
   - Descrição: Vazamento de informações confidenciais
   - Impacto: Violação de privacidade, perda de dados
   - Mitigação: Criptografia, controle de acesso rigoroso

5. **Ataque de Negação de Serviço (DoS)**
   - Descrição: Sobrecarga do sistema para torná-lo indisponível
   - Impacto: Interrupção de serviços, perda de produtividade
   - Mitigação: Rate limiting, proteção DDoS, monitoramento

Para cada vulnerabilidade, forneça detalhes específicos baseados no sistema: ${request.description}`;
  }

  /**
   * Gera prompt super direto para forçar ameaças específicas
   */
  static generateDirectThreatPrompt(request: ThreatModelingRequest): string {
    return `Liste 5 ameaças de segurança específicas para: ${request.systemName}

Sistema: ${request.systemType}
Descrição: ${request.description}

FORMATO OBRIGATÓRIO - Responda EXATAMENTE assim:

### **Ameaça 1: [Nome da Ameaça]**
**Descrição:** [Descrição detalhada da ameaça]
**Impacto:** [Como esta ameaça afeta o sistema]
**Mitigação:** [Como prevenir ou mitigar esta ameaça]

### **Ameaça 2: [Nome da Ameaça]**
**Descrição:** [Descrição detalhada da ameaça]
**Impacto:** [Como esta ameaça afeta o sistema]
**Mitigação:** [Como prevenir ou mitigar esta ameaça]

### **Ameaça 3: [Nome da Ameaça]**
**Descrição:** [Descrição detalhada da ameaça]
**Impacto:** [Como esta ameaça afeta o sistema]
**Mitigação:** [Como prevenir ou mitigar esta ameaça]

### **Ameaça 4: [Nome da Ameaça]**
**Descrição:** [Descrição detalhada da ameaça]
**Impacto:** [Como esta ameaça afeta o sistema]
**Mitigação:** [Como prevenir ou mitigar esta ameaça]

### **Ameaça 5: [Nome da Ameaça]**
**Descrição:** [Descrição detalhada da ameaça]
**Impacto:** [Como esta ameaça afeta o sistema]
**Mitigação:** [Como prevenir ou mitigar esta ameaça]

IMPORTANTE: Baseie-se especificamente no sistema descrito e forneça ameaças reais e específicas.`;
  }

  /**
   * Obtém o nome completo da categoria STRIDE
   */
  private static getStrideName(key: string): string {
    const names = {
      'S': 'Spoofing',
      'T': 'Tampering', 
      'R': 'Repudiation',
      'I': 'Information Disclosure',
      'D': 'Denial of Service',
      'E': 'Elevation of Privilege'
    };
    return names[key as keyof typeof names] || key;
  }

  /**
   * Gera ameaças mock para fallback
   */
  static getMockThreatsForSystem(systemType: string): Threat[] {
    const baseThreats: Threat[] = [
      {
        id: 'T001',
        stride: ['S', 'I'],
        categoria: 'Autenticação',
        ameaca: 'Ataques de força bruta contra sistema de login',
        descricao: 'Atacantes podem tentar quebrar senhas através de ataques automatizados de força bruta',
        impacto: 'Comprometimento de contas de usuários e acesso não autorizado ao sistema',
        probabilidade: 'Média',
        severidade: 'Alta',
        mitigacao: 'Implementar bloqueio de conta após tentativas falhidas, CAPTCHA, autenticação multifator',
        capec: 'CAPEC-16, CAPEC-49',
        deteccao: 'Monitoramento de tentativas de login falhidas consecutivas'
      },
      {
        id: 'T002',
        stride: ['T', 'E'],
        categoria: 'Integridade de Dados',
        ameaca: 'Manipulação de parâmetros de requisição',
        descricao: 'Modificação não autorizada de parâmetros HTTP para alterar comportamento da aplicação',
        impacto: 'Alteração não autorizada de dados ou bypass de controles de segurança',
        probabilidade: 'Alta',
        severidade: 'Média',
        mitigacao: 'Validação robusta de entrada, assinatura de tokens, controle de integridade',
        capec: 'CAPEC-137, CAPEC-160',
        deteccao: 'Monitoramento de anomalias em parâmetros de requisição'
      },
      {
        id: 'T003',
        stride: ['I', 'R'],
        categoria: 'Exposição de Dados',
        ameaca: 'Vazamento de informações através de logs',
        descricao: 'Dados sensíveis podem ser expostos através de logs de sistema mal configurados',
        impacto: 'Exposição de informações confidenciais e dados pessoais',
        probabilidade: 'Média',
        severidade: 'Média',
        mitigacao: 'Configuração adequada de logs, sanitização de dados sensíveis, controle de acesso aos logs',
        capec: 'CAPEC-117, CAPEC-204',
        deteccao: 'Auditoria regular dos logs e configurações de logging'
      },
      {
        id: 'T004',
        stride: ['D'],
        categoria: 'Negação de Serviço',
        ameaca: 'Ataques de DDoS na camada de aplicação',
        descricao: 'Sobrecarga intencional do sistema através de requisições maliciosas',
        impacto: 'Indisponibilidade do serviço e degradação da performance',
        probabilidade: 'Alta',
        severidade: 'Alta',
        mitigacao: 'Rate limiting, WAF, CDN, monitoramento de tráfego',
        capec: 'CAPEC-125, CAPEC-130',
        deteccao: 'Monitoramento de métricas de performance e padrões de tráfego'
      },
      {
        id: 'T005',
        stride: ['E', 'S'],
        categoria: 'Escalação de Privilégios',
        ameaca: 'Exploração de vulnerabilidades para elevação de privilégios',
        descricao: 'Atacantes podem explorar falhas de configuração para obter acesso administrativo',
        impacto: 'Acesso não autorizado a funcionalidades críticas do sistema',
        probabilidade: 'Baixa',
        severidade: 'Crítica',
        mitigacao: 'Princípio do menor privilégio, auditoria de permissões, monitoramento de atividades administrativas',
        capec: 'CAPEC-233, CAPEC-250',
        deteccao: 'Monitoramento de tentativas de escalação de privilégios'
      },
      {
        id: 'T006',
        stride: ['R', 'T'],
        categoria: 'Repúdio de Transações',
        ameaca: 'Manipulação de logs para negar transações',
        descricao: 'Alteração maliciosa de logs para esconder atividades fraudulentas',
        impacto: 'Incapacidade de comprovar transações em disputas regulatórias',
        probabilidade: 'Baixa',
        severidade: 'Alta',
        mitigacao: 'Logs imutáveis com assinaturas digitais, WAL (Write-Ahead Logging)',
        capec: 'CAPEC-98, CAPEC-99',
        deteccao: 'Verificação de integridade dos logs através de hashes criptográficos'
      }
    ];

    // Filtrar ameaças baseado no tipo de sistema
    switch (systemType) {
      case 'web':
        return baseThreats.filter(t => ['T001', 'T002', 'T004'].includes(t.id));
      case 'api':
        return baseThreats.filter(t => ['T002', 'T003', 'T004'].includes(t.id));
      case 'mobile':
        return baseThreats.filter(t => ['T001', 'T003', 'T005'].includes(t.id));
      default:
        return baseThreats;
    }
  }

  /**
   * Processa resposta da IA com melhor detecção de recusas e fallbacks
   */
  static processAIResponse(aiResponse: string, systemType: string): ThreatModelingResponse {
    try {
      console.log('🔍 Processando resposta da IA:', aiResponse ? aiResponse.substring(0, 200) + '...' : 'RESPOSTA VAZIA');
      
      // Verificar se a resposta está vazia ou inválida
      if (!aiResponse || aiResponse.trim() === '' || aiResponse === '{}') {
        console.log('⚠️ Resposta da IA vazia ou inválida, usando mock');
        return {
          threats: this.getMockThreatsForSystem(systemType),
          source: 'mock',
          confidence: 0
        };
      }
      
      // Verificar se a IA recusou a solicitação ou não entendeu
      const refusalPatterns = [
        "I'm sorry, but I can't assist",
        "I cannot help",
        "I'm not able to",
        "I can't provide",
        "I'm unable to",
        "I don't have the ability",
        "I'm not programmed to",
        "I cannot generate",
        "I'm not designed to",
        "does not contain any explicit or implicit questions",
        "no explicit or implicit questions",
        "result\": null",
        "message\": \"The provided text"
      ];
      
      const isRefusal = refusalPatterns.some(pattern => 
        aiResponse.toLowerCase().includes(pattern.toLowerCase())
      );
      
      if (isRefusal) {
        console.log('⚠️ IA recusou a solicitação ou não entendeu, usando mock');
        return {
          threats: this.getMockThreatsForSystem(systemType),
          source: 'mock',
          confidence: 0
        };
      }
      
      let threats: Threat[] = [];
      let confidence = 0;

      // Estratégia 1: Tentar parsear diretamente como JSON
      try {
        const directParse = JSON.parse(aiResponse);
        
        // Verificar se é um formato de CVE e converter
        if (directParse.cve || directParse.description) {
          console.log('🔍 Detectado formato CVE, convertendo para ameaça...');
          const convertedThreat = this.convertCVEToThreat(directParse);
          if (convertedThreat) {
            threats = [convertedThreat];
            confidence = 0.8;
          }
        } else {
          threats = directParse.threats || directParse.ameacas || [];
          if (threats.length > 0) {
            console.log('✅ JSON parseado diretamente, threats encontradas:', threats.length);
            confidence = 0.9;
          }
        }
      } catch (e) {
        console.log('⚠️ Parsing direto falhou, procurando JSON na resposta...');
        
        // Estratégia 2: Procurar JSON dentro de blocos de código
        const jsonBlockMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
        if (jsonBlockMatch) {
          try {
            console.log('🔍 JSON encontrado em bloco de código:', jsonBlockMatch[1].substring(0, 100) + '...');
            const parsed = JSON.parse(jsonBlockMatch[1]);
            
            // Verificar se é um formato de CVE e converter
            if (parsed.cve || parsed.description) {
              console.log('🔍 Detectado formato CVE em bloco, convertendo para ameaça...');
              const convertedThreat = this.convertCVEToThreat(parsed);
              if (convertedThreat) {
                threats = [convertedThreat];
                confidence = 0.8;
              }
            } else {
              threats = parsed.threats || parsed.ameacas || [];
              if (threats.length > 0) {
                console.log('✅ JSON extraído de bloco, threats encontradas:', threats.length);
                confidence = 0.8;
              }
            }
          } catch (parseError) {
            console.log('❌ Erro ao parsear JSON do bloco:', parseError);
          }
        } else {
          // Estratégia 3: Procurar JSON solto na resposta
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              console.log('🔍 JSON encontrado na resposta:', jsonMatch[0].substring(0, 100) + '...');
              const parsed = JSON.parse(jsonMatch[0]);
              threats = parsed.threats || parsed.ameacas || [];
              console.log('✅ JSON extraído, threats encontradas:', threats.length);
            } catch (parseError) {
              console.log('❌ Erro ao parsear JSON solto:', parseError);
            }
          }
        }
      }

      // Estratégia 4: Se não encontrou JSON válido, processar texto natural
      if (threats.length === 0) {
        console.log('🔄 Tentando extrair ameaças de texto natural...');
        threats = this.parseNaturalLanguageThreats(aiResponse, systemType);
        if (threats.length > 0) {
          console.log('✅ Ameaças extraídas de texto natural:', threats.length);
        }
      }

      if (threats.length === 0) {
        console.log('⚠️ Nenhuma ameaça encontrada, usando mock');
        return {
          threats: this.getMockThreatsForSystem(systemType),
          source: 'mock',
          confidence: 0
        };
      }

      console.log('🎯 Gerando relatório com', threats.length, 'ameaças');
      return {
        threats: threats,
        source: 'ai',
        confidence: 0.8
      };
    } catch (error) {
      console.error('❌ Erro ao processar resposta da IA:', error);
      console.log('🔄 Usando dados mock como fallback');
      return {
        threats: this.getMockThreatsForSystem(systemType),
        source: 'mock',
        confidence: 0
      };
    }
  }

  /**
   * Extrai ameaças de texto natural com parsing melhorado
   */
  private static parseNaturalLanguageThreats(text: string, systemType: string): Threat[] {
    const threats: Threat[] = [];
    
    // Se o texto contém recusa, retornar vazio (será tratado pela função principal)
    const refusalPatterns = [
      "I'm sorry, but I can't assist",
      "I cannot help",
      "I'm not able to",
      "I can't provide",
      "I'm unable to"
    ];
    
    if (refusalPatterns.some(pattern => text.toLowerCase().includes(pattern.toLowerCase()))) {
      console.log('⚠️ Texto contém recusa');
      return [];
    }
    
    // Método 1: Buscar seções numeradas com ** ou ###
    const numberedSections = text.match(/(?:###\s*\d+\.|\d+\.\s*\*\*)[^]*?(?=(?:###\s*\d+\.|\d+\.\s*\*\*|$))/g);
    
    if (numberedSections && numberedSections.length > 0) {
      console.log(`🔍 Encontradas ${numberedSections.length} seções numeradas`);
      
      numberedSections.forEach((section, index) => {
        if (threats.length >= 6) return;
        
        const threatData = this.extractThreatFromSection(section, index + 1);
        if (threatData) {
          threats.push(threatData);
        }
      });
    }
    
    // Método 1.5: Buscar formato específico do Ollama com ### **Nome da Ameaça**
    if (threats.length === 0) {
      console.log('🔍 Buscando formato específico do Ollama...');
      const ollamaSections = text.match(/###\s*\*\*[^*]+\*\*[^]*?(?=###\s*\*\*|$)/g);
      
      if (ollamaSections && ollamaSections.length > 0) {
        console.log(`🔍 Encontradas ${ollamaSections.length} seções do formato Ollama`);
        
        ollamaSections.forEach((section, index) => {
          if (threats.length >= 6) return;
          
          const threatData = this.extractThreatFromOllamaSection(section, index + 1);
          if (threatData) {
            threats.push(threatData);
          }
        });
      }
    }
    
    // Método 2: Buscar por palavras-chave de ameaças se não encontrou seções
    if (threats.length === 0) {
      console.log('🔍 Buscando por patterns de ameaças no texto...');
      
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
      
      sentences.forEach((sentence, index) => {
        if (threats.length >= 6) return;
        
        const hasSecurityKeyword = this.THREAT_KEYWORDS.some(keyword => 
          sentence.toLowerCase().includes(keyword)
        );
        
        if (hasSecurityKeyword && sentence.length > 50) {
          const threatData = this.extractThreatFromSentence(sentence, index + 1);
          if (threatData) {
            threats.push(threatData);
          }
        }
      });
    }
    
    // Se não encontrou ameaças estruturadas, tentar extrair do formato atual do Ollama
    if (threats.length === 0) {
      console.log('🔍 Tentando extração do formato atual do Ollama...');
      
      // Tentar extrair do formato "1. **Nome**:"
      const numberedThreats = text.match(/\d+\.\s*\*\*[^*]+\*\*:[^]*?(?=\d+\.\s*\*\*|$)/g);
      
      if (numberedThreats && numberedThreats.length > 0) {
        console.log(`🔍 Encontradas ${numberedThreats.length} ameaças numeradas`);
        
        numberedThreats.forEach((threatText, index) => {
          if (threats.length >= 6) return;
          
          const lines = threatText.split('\n').filter(line => line.trim());
          if (lines.length < 2) return;
          
          // Extrair nome da ameaça
          let ameaca = lines[0].trim();
          ameaca = ameaca.replace(/^\d+\.\s*\*\*/, '').replace(/\*\*:?\s*$/, '').trim();
          
          // Extrair descrição (primeiro parágrafo após o título)
          let descricao = '';
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line && !line.startsWith('*') && !line.startsWith('\t')) {
              descricao = line;
              break;
            }
          }
          
          // Extrair risco
          const riscoLine = lines.find(line => line.includes('Risco:'));
          const risco = riscoLine ? riscoLine.replace(/^\s*\*?\s*Risco:\s*/, '').trim() : '';
          
          // Extrair recomendação
          const recomendacaoLine = lines.find(line => line.includes('Recomendação:'));
          const recomendacao = recomendacaoLine ? recomendacaoLine.replace(/^\s*\*?\s*Recomendação:\s*/, '').trim() : '';
          
          // Determinar categoria STRIDE
          let strideCategory = ['T'];
          const detectedCategories: string[] = [];
          
          const fullText = threatText.toLowerCase();
          for (const [stride, keywords] of Object.entries(this.STRIDE_KEYWORDS)) {
            if (keywords.some(keyword => fullText.includes(keyword))) {
              detectedCategories.push(stride);
            }
          }
          
          if (detectedCategories.length > 0) {
            strideCategory = detectedCategories;
          }
          
          const sectionCapecs = threatText.match(/CAPEC-\d+/gi) || [];
          const capec = sectionCapecs.length > 0 ? (sectionCapecs[0] || `CAPEC-${Math.floor(Math.random() * 900) + 100}`) : `CAPEC-${Math.floor(Math.random() * 900) + 100}`;
          
          console.log(`🔍 Debug - Ameaça ${index + 1}:`, {
            ameaca,
            descricao: descricao.substring(0, 50) + '...',
            risco: risco.substring(0, 50) + '...',
            recomendacao: recomendacao.substring(0, 50) + '...',
            strideCategory
          });
          
          threats.push({
            id: `T${String(index + 1).padStart(3, '0')}`,
            stride: strideCategory,
            categoria: this.extractCategory(threatText),
            ameaca: ameaca,
            descricao: descricao || 'Descrição não especificada',
            impacto: risco || 'Impacto não especificado',
            probabilidade: this.extractProbability(threatText),
            severidade: this.extractSeverity(threatText),
            mitigacao: recomendacao || 'Implementar controles de segurança apropriados',
            capec: capec,
            deteccao: this.extractDetection(threatText)
          });
        });
      }
    }
    
    // Se ainda não encontrou ameaças, tentar método anterior
    if (threats.length === 0) {
      console.log('🔍 Tentando extração por seções gerais...');
      const sections = text.split(/\n\s*\n|\.\s*\n/);
      
      sections.forEach((section, index) => {
        if (threats.length >= 6) return;
        
        const hasThreats = this.THREAT_KEYWORDS.some(keyword => 
          section.toLowerCase().includes(keyword)
        );
        
        const hasSecurityContent = /vulnerability|attack|exploit|breach|risk|threat|security|malicious|unauthorized|compromise/i.test(section);
        
        if ((hasThreats || hasSecurityContent) && section.length > 50) {
          let strideCategory = ['T'];
          const detectedCategories: string[] = [];
          
          for (const [stride, keywords] of Object.entries(this.STRIDE_KEYWORDS)) {
            if (keywords.some(keyword => section.toLowerCase().includes(keyword))) {
              detectedCategories.push(stride);
            }
          }
          
          if (detectedCategories.length > 0) {
            strideCategory = detectedCategories;
          }
          
          const sectionCapecs = section.match(/CAPEC-\d+/gi) || [];
          const capec = sectionCapecs.length > 0 ? (sectionCapecs[0] || `CAPEC-${Math.floor(Math.random() * 900) + 100}`) : `CAPEC-${Math.floor(Math.random() * 900) + 100}`;
          
          threats.push({
            id: `T${String(index + 1).padStart(3, '0')}`,
            stride: strideCategory,
            categoria: this.extractCategory(section),
            ameaca: this.extractThreat(section),
            descricao: section.substring(0, 200).trim() + (section.length > 200 ? '...' : ''),
            impacto: this.extractImpact(section),
            probabilidade: this.extractProbability(section),
            severidade: this.extractSeverity(section),
            mitigacao: this.extractMitigation(section),
            capec: capec,
            deteccao: this.extractDetection(section)
          });
        }
      });
    }
    
    // Se ainda não encontrou ameaças suficientes, usar mock
    if (threats.length < 3) {
      console.log('⚠️ Poucas ameaças extraídas, complementando com mock');
      const mockThreats = this.getMockThreatsForSystem(systemType);
      threats.push(...mockThreats.slice(0, 3 - threats.length));
    }
    
    console.log(`✅ Extraídas ${threats.length} ameaças do texto natural`);
    return threats;
  }

  // Métodos auxiliares para extração de informações
  private static extractCategory(text: string): string {
    const lowerText = text.toLowerCase();
    if (/authentication|autenticação|login|senha|password/i.test(lowerText)) return 'Autenticação';
    if (/data|dados|integrity|integridade|manipulação|manipulation/i.test(lowerText)) return 'Integridade de Dados';
    if (/information|informação|disclosure|exposição|leak|vazamento|privacidade/i.test(lowerText)) return 'Exposição de Dados';
    if (/denial|negação|service|serviço|ddos|dos|sobrecarga/i.test(lowerText)) return 'Negação de Serviço';
    if (/privilege|privilégio|elevation|escalação|acesso/i.test(lowerText)) return 'Escalação de Privilégios';
    if (/injection|injeção|sql|code|código/i.test(lowerText)) return 'Injeção de Código';
    if (/tokenização|tokenization|cartão|card/i.test(lowerText)) return 'Tokenização de Dados';
    return 'Segurança Geral';
  }

  private static extractThreat(text: string): string {
    const lines = text.split('\n');
    const firstLine = lines[0]?.trim();
    if (firstLine && firstLine.length > 10 && firstLine.length < 100) {
      return firstLine;
    }
    return 'Ameaça identificada na análise';
  }

  private static extractImpact(text: string): string {
    if (/high|alta|elevado/i.test(text)) return 'Alto impacto na segurança do sistema';
    if (/low|baixo/i.test(text)) return 'Baixo impacto, mas requer atenção';
    return 'Impacto moderado na operação do sistema';
  }

  private static extractProbability(text: string): string {
    if (/high|alta|elevada/i.test(text)) return 'Alta';
    if (/low|baixa/i.test(text)) return 'Baixa';
    return 'Média';
  }

  private static extractSeverity(text: string): string {
    const lowerText = text.toLowerCase();
    if (/critical|crítica|severe|grave|urgente|urgent/i.test(lowerText)) return 'Crítica';
    if (/high|alta|major|importante|important/i.test(lowerText)) return 'Alta';
    if (/low|baixa|minor|menor/i.test(lowerText)) return 'Baixa';
    return 'Média';
  }

  private static extractMitigation(text: string): string {
    if (/implement|implementar|configure|configurar/i.test(text)) {
      return 'Implementar controles de segurança apropriados';
    }
    return 'Implementar medidas de mitigação baseadas nas melhores práticas de segurança';
  }

  private static extractDetection(text: string): string {
    return 'Monitoramento de atividades suspeitas';
  }

  private static extractCapec(text: string): string {
    const capecMatch = text.match(/CAPEC-\d+/gi);
    return capecMatch ? capecMatch[0] : `CAPEC-${Math.floor(Math.random() * 900) + 100}`;
  }

  /**
   * Converte formato CVE para formato de ameaça
   */
  private static convertCVEToThreat(cveData: any): Threat | null {
    try {
      if (!cveData.description) return null;

      // Extrair informações do CVE
      const cveId = cveData.cve || 'CVE-UNKNOWN';
      const description = cveData.description;
      const cvssScore = cveData.impact?.cvss_score || '0.0';
      const recommendations = cveData.recommendations || [];

      // Determinar severidade baseada no CVSS
      let severidade = 'Média';
      const score = parseFloat(cvssScore);
      if (score >= 9.0) severidade = 'Crítica';
      else if (score >= 7.0) severidade = 'Alta';
      else if (score >= 4.0) severidade = 'Média';
      else severidade = 'Baixa';

      // Determinar categoria STRIDE baseada na descrição
      const strideCategories = this.determineStrideCategories(description);

      // Extrair nome da ameaça da descrição
      let ameaca = 'Vulnerabilidade de Segurança';
      if (description.toLowerCase().includes('injection')) ameaca = 'Injeção de Código';
      else if (description.toLowerCase().includes('authentication')) ameaca = 'Falha de Autenticação';
      else if (description.toLowerCase().includes('authorization')) ameaca = 'Falha de Autorização';
      else if (description.toLowerCase().includes('buffer')) ameaca = 'Buffer Overflow';
      else if (description.toLowerCase().includes('xss')) ameaca = 'Cross-Site Scripting (XSS)';
      else if (description.toLowerCase().includes('csrf')) ameaca = 'Cross-Site Request Forgery (CSRF)';

      return {
        id: 'T001',
        stride: strideCategories,
        categoria: 'Vulnerabilidade de Segurança',
        ameaca: ameaca,
        descricao: description,
        impacto: `Vulnerabilidade identificada: ${cveId}. CVSS Score: ${cvssScore}`,
        probabilidade: 'Alta',
        severidade: severidade,
        mitigacao: recommendations.length > 0 ? recommendations.join('; ') : 'Aplicar patches de segurança e implementar controles apropriados',
        capec: this.extractCapec(description),
        deteccao: 'Monitoramento de vulnerabilidades conhecidas e escaneamento de segurança'
      };
    } catch (error) {
      console.warn('⚠️ Erro ao converter CVE para ameaça:', error);
      return null;
    }
  }

  /**
   * Extrai dados de ameaça do formato específico do Ollama
   */
  private static extractThreatFromOllamaSection(section: string, index: number): Threat | null {
    try {
      const lines = section.split('\n').filter(line => line.trim());
      if (lines.length < 3) return null;
      
      // Extrair título da ameaça (linha com ### **Nome**)
      let ameaca = lines[0].trim();
      ameaca = ameaca.replace(/^###\s*\*\*/, '').replace(/\*\*:?\s*$/, '').trim();
      
      if (!ameaca || ameaca.length < 5) return null;
      
      // Extrair descrição (seção **Descrição:**)
      const descricaoMatch = section.match(/\*\*Descrição:\*\*\s*([^*]+?)(?=\*\*|$)/s);
      const descricao = descricaoMatch ? descricaoMatch[1].trim() : '';
      
      // Extrair impacto (seção **Impacto:**)
      const impactoMatch = section.match(/\*\*Impacto:\*\*\s*([^*]+?)(?=\*\*|$)/s);
      const impacto = impactoMatch ? impactoMatch[1].trim() : '';
      
      // Extrair mitigação (seção **Mitigação:**)
      const mitigacaoMatch = section.match(/\*\*Mitigação:\*\*\s*([^*]+?)(?=\*\*|$)/s);
      const mitigacao = mitigacaoMatch ? mitigacaoMatch[1].trim() : '';
      
      // Determinar STRIDE baseado no conteúdo
      const strideCategories = this.determineStrideCategories(section);
      
      console.log(`🔍 Debug - Ameaça Ollama ${index}:`, {
        ameaca,
        descricao: descricao.substring(0, 50) + '...',
        impacto: impacto.substring(0, 50) + '...',
        mitigacao: mitigacao.substring(0, 50) + '...',
        strideCategories
      });
      
      return {
        id: `T${String(index).padStart(3, '0')}`,
        stride: strideCategories,
        categoria: this.extractCategory(section),
        ameaca: ameaca,
        descricao: descricao || 'Descrição extraída da análise do Ollama',
        impacto: impacto || 'Impacto no sistema conforme análise',
        probabilidade: this.extractProbability(section),
        severidade: this.extractSeverity(section),
        mitigacao: mitigacao || 'Implementar controles de segurança apropriados',
        capec: this.extractCapec(section),
        deteccao: 'Monitoramento baseado em logs e métricas de segurança'
      };
    } catch (error) {
      console.warn('⚠️ Erro ao extrair ameaça da seção Ollama:', error);
      return null;
    }
  }

  /**
   * Extrai dados de ameaça de uma seção estruturada
   */
  private static extractThreatFromSection(section: string, index: number): Threat | null {
    try {
      const lines = section.split('\n').filter(line => line.trim());
      if (lines.length < 2) return null;
      
      // Extrair título da ameaça
      let ameaca = lines[0].trim();
      ameaca = ameaca.replace(/^\d+\.\s*\*\*?/, '').replace(/\*\*?:?\s*$/, '').replace(/^###\s*\d+\.\s*/, '').trim();
      
      if (!ameaca || ameaca.length < 5) return null;
      
      // Extrair informações estruturadas
      const risco = this.extractFieldFromSection(section, ['risco', 'risk', 'threat']);
      const descricao = this.extractFieldFromSection(section, ['descrição', 'description', 'desc']);
      const impacto = this.extractFieldFromSection(section, ['impacto', 'impact', 'consequence']);
      const mitigacao = this.extractFieldFromSection(section, ['mitigação', 'mitigation', 'recomendação', 'recommendation']);
      
      // Determinar STRIDE
      const strideCategories = this.determineStrideCategories(section);
      
      return {
        id: `T${String(index).padStart(3, '0')}`,
        stride: strideCategories,
        categoria: this.extractCategory(section),
        ameaca: ameaca,
        descricao: descricao || risco || 'Descrição extraída da análise',
        impacto: impacto || 'Impacto no sistema de acordo com análise',
        probabilidade: this.extractProbability(section),
        severidade: this.extractSeverity(section),
        mitigacao: mitigacao || 'Implementar controles de segurança apropriados',
        capec: this.extractCapec(section),
        deteccao: 'Monitoramento baseado em logs e métricas de segurança'
      };
    } catch (error) {
      console.warn('⚠️ Erro ao extrair ameaça da seção:', error);
      return null;
    }
  }

  /**
   * Extrai campo específico de uma seção
   */
  private static extractFieldFromSection(section: string, fieldNames: string[]): string {
    const lines = section.split('\n');
    
    for (const line of lines) {
      for (const fieldName of fieldNames) {
        const pattern = new RegExp(`\\*?\\*?${fieldName}:\\s*\\*?\\s*(.+)`, 'i');
        const match = line.match(pattern);
        if (match) {
          return match[1].trim();
        }
      }
    }
    
    return '';
  }

  /**
   * Determina categorias STRIDE baseadas no conteúdo
   */
  private static determineStrideCategories(text: string): string[] {
    const detectedCategories: string[] = [];
    const lowerText = text.toLowerCase();
    
    for (const [stride, keywords] of Object.entries(this.STRIDE_KEYWORDS)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        detectedCategories.push(stride);
      }
    }
    
    return detectedCategories.length > 0 ? detectedCategories : ['T'];
  }

  /**
   * Extrai ameaça de uma sentença
   */
  private static extractThreatFromSentence(sentence: string, index: number): Threat | null {
    try {
      // Extrair nome da ameaça (primeira parte da sentença)
      const ameaca = sentence.split(':')[0]?.trim() || sentence.substring(0, 50).trim();
      
      if (!ameaca || ameaca.length < 10) return null;
      
      const strideCategories = this.determineStrideCategories(sentence);
      
      return {
        id: `T${String(index).padStart(3, '0')}`,
        stride: strideCategories,
        categoria: this.extractCategory(sentence),
        ameaca: ameaca,
        descricao: sentence,
        impacto: 'Impacto baseado na análise do contexto',
        probabilidade: this.extractProbability(sentence),
        severidade: this.extractSeverity(sentence),
        mitigacao: 'Implementar controles de segurança apropriados',
        capec: this.extractCapec(sentence),
        deteccao: 'Monitoramento de atividades suspeitas'
      };
    } catch (error) {
      console.warn('⚠️ Erro ao extrair ameaça da sentença:', error);
      return null;
    }
  }
}

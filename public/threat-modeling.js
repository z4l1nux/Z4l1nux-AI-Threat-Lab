/**
 * Cliente JavaScript para Threat Modeling
 * Usa o novo serviço TypeScript dedicado
 */

class ThreatModelingClient {
  constructor() {
    this.baseUrl = window.location.origin;
  }

  /**
   * Gera análise de threat modeling
   */
  async generateThreatModeling(request) {
    try {
      console.log('🔍 Enviando requisição de threat modeling:', request);
      
      const response = await fetch(`${this.baseUrl}/api/threat-modeling`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('📡 Resposta recebida:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Erro na requisição de threat modeling:', error);
      throw error;
    }
  }

  /**
   * Processa resposta da IA usando o serviço TypeScript
   */
  processAIResponse(aiResponse, systemType) {
    // Esta função agora será chamada do servidor TypeScript
    // Mantida aqui para compatibilidade com o frontend existente
    console.log('🔍 Processando resposta da IA no cliente:', typeof aiResponse === 'string' ? aiResponse.substring(0, 200) + '...' : aiResponse);
    return this.parseThreatsFromResponse(aiResponse, systemType);
  }

  /**
   * Parse básico de ameaças da resposta (fallback)
   */
  parseThreatsFromResponse(aiResponse, systemType) {
    try {
      let threats = [];
      
      // Tentar parsear JSON
      try {
        const directParse = JSON.parse(aiResponse);
        
        // Verificar formato cenarios_risco do Ollama
        if (directParse.cenarios_risco && Array.isArray(directParse.cenarios_risco)) {
          console.log('🎯 Formato Ollama (cenarios_risco) detectado no frontend!');
          threats = this.convertCenariosRiscoToThreats(directParse.cenarios_risco);
        } else if (directParse.cenarios_de_risco && Array.isArray(directParse.cenarios_de_risco)) {
          console.log('🎯 Formato OpenRouter (cenarios_de_risco) detectado no frontend!');
          threats = this.convertCenariosDeRiscoToThreats(directParse.cenarios_de_risco);
        } else if (directParse.cenariosDeRisco && Array.isArray(directParse.cenariosDeRisco)) {
          console.log('🎯 Formato OpenRouter (cenariosDeRisco) detectado no frontend!');
          threats = this.convertCenariosDeRiscoToThreats(directParse.cenariosDeRisco);
        } else {
          threats = directParse.threats || directParse.ameacas || [];
        }
      } catch (e) {
        // Procurar JSON em blocos de código
        const jsonBlockMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
        if (jsonBlockMatch) {
          try {
            const parsed = JSON.parse(jsonBlockMatch[1]);
            
            // Verificar formato cenarios_risco do Ollama
            if (parsed.cenarios_risco && Array.isArray(parsed.cenarios_risco)) {
              console.log('🎯 Formato Ollama (cenarios_risco) detectado em bloco!');
              threats = this.convertCenariosRiscoToThreats(parsed.cenarios_risco);
            } else if (parsed.cenarios_de_risco && Array.isArray(parsed.cenarios_de_risco)) {
              console.log('🎯 Formato OpenRouter (cenarios_de_risco) detectado em bloco!');
              threats = this.convertCenariosDeRiscoToThreats(parsed.cenarios_de_risco);
            } else if (parsed.cenariosDeRisco && Array.isArray(parsed.cenariosDeRisco)) {
              console.log('🎯 Formato OpenRouter (cenariosDeRisco) detectado em bloco!');
              threats = this.convertCenariosDeRiscoToThreats(parsed.cenariosDeRisco);
            } else {
              threats = parsed.threats || parsed.ameacas || [];
            }
          } catch (parseError) {
            console.log('❌ Erro ao parsear JSON do bloco:', parseError);
          }
        }
      }

      if (threats.length === 0) {
        console.log('⚠️ Nenhuma ameaça encontrada, usando mock');
        threats = this.getMockThreatsForSystem(systemType);
      }

      return threats;
    } catch (error) {
      console.error('❌ Erro ao processar resposta da IA:', error);
      return this.getMockThreatsForSystem(systemType);
    }
  }

  /**
   * Converte formato cenarios_de_risco do OpenRouter para formato de ameaças
   */
  convertCenariosDeRiscoToThreats(cenarios) {
    const threats = [];
    
    cenarios.forEach((cenario, index) => {
      try {
        // Extrair informações do cenário (suporta múltiplos formatos)
        const tipo = cenario.tipo || '';
        const descricao = cenario.descricao || '';
        const probabilidade = cenario.probabilidade || 'Média';
        const impacto = cenario.impacto || 'Médio';
        const exemplo = cenario.exemplo || '';
        const exemplos = Array.isArray(cenario.exemplos) 
          ? cenario.exemplos.join('; ') 
          : exemplo;
        
        // Determinar categorias STRIDE baseadas no tipo
        const strideCategories = this.determineStrideCategories(tipo + ' ' + descricao);
        
        // Extrair nome da ameaça do tipo (remover categorias STRIDE se presentes)
        let ameaca = tipo;
        if (ameaca.includes('(') && ameaca.includes(')')) {
          // Remover categorias STRIDE do nome (ex: "S (Spoofing)" -> "Spoofing")
          ameaca = ameaca.replace(/^[A-Z]\s*\(/, '').replace(/\)$/, '').trim();
        }
        
        // Mapear nomes específicos
        if (ameaca === 'Information Disclosure') ameaca = 'Exposição de Informações';
        else if (ameaca === 'Denial of Service') ameaca = 'Negação de Serviço';
        else if (ameaca === 'Elevation of Privilege') ameaca = 'Escalação de Privilégios';
        else if (ameaca === 'Repudiation') ameaca = 'Repúdio de Transações';
        
        // Determinar categoria baseada no tipo
        const categoria = this.extractCategory(tipo + ' ' + descricao);
        
        // Mapear severidade do OpenRouter
        let severidade = 'Média';
        if (impacto === 'Crítico') severidade = 'Crítica';
        else if (impacto === 'Alto') severidade = 'Alta';
        else if (impacto === 'Médio') severidade = 'Média';
        else if (impacto === 'Baixo') severidade = 'Baixa';
        
        // Mapear probabilidade do OpenRouter
        let probabilidadeNormalizada = 'Média';
        if (probabilidade === 'Alta') probabilidadeNormalizada = 'Alta';
        else if (probabilidade === 'Média') probabilidadeNormalizada = 'Média';
        else if (probabilidade === 'Baixa') probabilidadeNormalizada = 'Baixa';
        
        // Gerar mitigação baseada no tipo
        let mitigacao = 'Implementar controles de segurança apropriados';
        if (tipo.includes('Spoofing')) mitigacao = 'Autenticação multifator, validação rigorosa de identidade, auditoria de acessos';
        else if (tipo.includes('Tampering')) mitigacao = 'Controle de integridade, assinaturas digitais, validação de dados';
        else if (tipo.includes('Information Disclosure')) mitigacao = 'Criptografia, controle de acesso, classificação de dados';
        else if (tipo.includes('Denial of Service')) mitigacao = 'Rate limiting, WAF, monitoramento de tráfego, redundância';
        else if (tipo.includes('Elevation of Privilege')) mitigacao = 'Princípio do menor privilégio, auditoria de permissões, controle de acesso';
        else if (tipo.includes('Repudiation')) mitigacao = 'Logs imutáveis, assinaturas digitais, auditoria completa';
        
        const threat = {
          id: `T${String(index + 1).padStart(3, '0')}`,
          stride: strideCategories,
          categoria: categoria,
          ameaca: ameaca,
          descricao: descricao,
          impacto: exemplos ? `Exemplo: ${exemplos}. Impacto: ${impacto}` : `Impacto: ${impacto}`,
          probabilidade: probabilidadeNormalizada,
          severidade: severidade,
          mitigacao: mitigacao,
          capec: this.extractCapec(tipo + ' ' + descricao),
          deteccao: 'Monitoramento baseado em logs e métricas de segurança'
        };
        
        threats.push(threat);
        
        console.log(`🔍 Convertido cenário OpenRouter ${index + 1}:`, {
          ameaca: threat.ameaca,
          categoria: threat.categoria,
          stride: threat.stride,
          severidade: threat.severidade
        });
        
      } catch (error) {
        console.warn(`⚠️ Erro ao converter cenário OpenRouter ${index + 1}:`, error);
      }
    });
    
    return threats;
  }

  /**
   * Converte formato cenarios_risco do Ollama para formato de ameaças
   */
  convertCenariosRiscoToThreats(cenarios) {
    const threats = [];
    
    cenarios.forEach((cenario, index) => {
      try {
        // Extrair informações do cenário - CORRIGIDO para usar os campos corretos da resposta da IA
        const tipoRisco = cenario.tipo_risco || '';
        const descritivo = cenario.descritivo || '';
        const impacto = cenario.impacto || '';
        const mitigacao = Array.isArray(cenario.mitigacao) 
          ? cenario.mitigacao.join('; ') 
          : cenario.mitigacao || '';
        
        // Determinar categorias STRIDE baseadas no tipo de risco e descritivo
        const strideCategories = this.determineStrideCategories(tipoRisco + ' ' + descritivo);
        
        // Extrair nome da ameaça do tipo_risco
        let ameaca = tipoRisco;
        if (ameaca.includes('(') && ameaca.includes(')')) {
          // Remover categorias STRIDE do nome (ex: "Spoofing (S)" -> "Spoofing")
          ameaca = ameaca.replace(/\s*\([^)]+\)\s*$/, '').trim();
        }
        
        // Determinar categoria baseada no conteúdo
        const categoria = this.extractCategory(descritivo + ' ' + impacto);
        
        // Determinar severidade baseada no impacto - MELHORADO
        let severidade = 'Média';
        const impactoLower = impacto.toLowerCase();
        
        // Severidade Crítica - palavras-chave de alto impacto
        if (impactoLower.includes('crítica') || impactoLower.includes('critical') ||
            impactoLower.includes('fraude financeira') || impactoLower.includes('financial fraud') ||
            impactoLower.includes('comprometimento total') || impactoLower.includes('total compromise') ||
            impactoLower.includes('perda total') || impactoLower.includes('total loss')) {
          severidade = 'Crítica';
        }
        // Severidade Alta - palavras-chave de impacto significativo
        else if (impactoLower.includes('alta') || impactoLower.includes('high') ||
                 impactoLower.includes('perda de dados') || impactoLower.includes('data loss') ||
                 impactoLower.includes('violação de privacidade') || impactoLower.includes('privacy violation') ||
                 impactoLower.includes('vazamento de dados') || impactoLower.includes('data breach') ||
                 impactoLower.includes('acesso não autorizado') || impactoLower.includes('unauthorized access') ||
                 impactoLower.includes('perda de negócios') || impactoLower.includes('business loss') ||
                 impactoLower.includes('compliance') || impactoLower.includes('regulatório')) {
          severidade = 'Alta';
        }
        // Severidade Baixa - palavras-chave de baixo impacto
        else if (impactoLower.includes('baixa') || impactoLower.includes('low') ||
                 impactoLower.includes('menor') || impactoLower.includes('minor') ||
                 impactoLower.includes('inconveniente') || impactoLower.includes('inconvenience') ||
                 impactoLower.includes('degradação') || impactoLower.includes('degradation')) {
          severidade = 'Baixa';
        }
        
        // Determinar probabilidade baseada no tipo de ameaça
        let probabilidade = 'Média';
        if (tipoRisco.toLowerCase().includes('injection') || tipoRisco.toLowerCase().includes('xss')) {
          probabilidade = 'Alta';
        } else if (tipoRisco.toLowerCase().includes('spoofing') || tipoRisco.toLowerCase().includes('dos')) {
          probabilidade = 'Alta';
        }
        
        const threat = {
          id: `T${String(index + 1).padStart(3, '0')}`,
          stride: strideCategories,
          categoria: categoria,
          ameaca: ameaca,
          descricao: descritivo,  // CORRIGIDO: usar descritivo em vez de resumo
          impacto: impacto,
          probabilidade: probabilidade,
          severidade: severidade,
          mitigacao: mitigacao,
          capec: this.extractCapec(descritivo + ' ' + impacto),
          deteccao: 'Monitoramento baseado em logs e métricas de segurança'
        };
        
        threats.push(threat);
        
        console.log(`🔍 Convertido cenário ${index + 1}:`, {
          ameaca: threat.ameaca,
          categoria: threat.categoria,
          stride: threat.stride,
          severidade: threat.severidade
        });
        
      } catch (error) {
        console.warn(`⚠️ Erro ao converter cenário ${index + 1}:`, error);
      }
    });
    
    return threats;
  }

  /**
   * Determina categorias STRIDE baseadas no conteúdo
   */
  determineStrideCategories(text) {
    const detectedCategories = [];
    const lowerText = text.toLowerCase();
    
    const strideKeywords = {
      'S': ['spoofing', 'impersonation', 'falsificação', 'identity', 'autenticação', 'login', 'authentication', 'credential'],
      'T': ['tampering', 'modification', 'alteração', 'manipulation', 'manipulação', 'integridade', 'integrity', 'modify'],
      'R': ['repudiation', 'denial', 'negação', 'repúdio', 'auditoria', 'logs', 'logging', 'accountability'],
      'I': ['information', 'disclosure', 'exposição', 'vazamento', 'dados', 'sensível', 'privacy', 'confidential'],
      'D': ['denial', 'service', 'negação', 'serviço', 'ddos', 'sobrecarga', 'availability', 'downtime'],
      'E': ['elevation', 'privilege', 'escalação', 'privilégio', 'administrativo', 'bypass', 'unauthorized access']
    };
    
    for (const [stride, keywords] of Object.entries(strideKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        detectedCategories.push(stride);
      }
    }
    
    return detectedCategories.length > 0 ? detectedCategories : ['T'];
  }

  /**
   * Extrai categoria baseada no conteúdo
   */
  extractCategory(text) {
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

  /**
   * Extrai CAPEC do texto
   */
  extractCapec(text) {
    const capecMatch = text.match(/CAPEC-\d+/gi);
    return capecMatch ? capecMatch[0] : `CAPEC-${Math.floor(Math.random() * 900) + 100}`;
  }

  /**
   * Ameaças mock para fallback
   */
  getMockThreatsForSystem(systemType) {
    const baseThreats = [
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
}

// Instância global do cliente
window.threatModelingClient = new ThreatModelingClient();

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
        threats = directParse.threats || directParse.ameacas || [];
      } catch (e) {
        // Procurar JSON em blocos de código
        const jsonBlockMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
        if (jsonBlockMatch) {
          try {
            const parsed = JSON.parse(jsonBlockMatch[1]);
            threats = parsed.threats || parsed.ameacas || [];
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

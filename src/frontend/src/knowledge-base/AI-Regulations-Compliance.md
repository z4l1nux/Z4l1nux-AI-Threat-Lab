# Regulações e Compliance para IA

## Visão Geral

Este documento consolida as principais **regulações, leis e frameworks de compliance** para sistemas de Inteligência Artificial em 2024-2025.

---

## 📜 EU AI Act (2024)

### Visão Geral

**Status**: Em vigor desde 2024  
**Jurisdição**: União Europeia  
**Escopo**: Qualquer sistema de IA usado na UE

### Classificação de Riscos

```
┌─────────────────────────────────────────────────────────┐
│ NÍVEL 1: INACEITÁVEL (PROIBIDO)                         │
│ - Social scoring por governos                           │
│ - Manipulação subliminar prejudicial                    │
│ - Exploração de vulnerabilidades (crianças, deficientes)│
│ - Biometric identification em tempo real (públicos)     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ NÍVEL 2: ALTO RISCO                                     │
│ - Infraestrutura crítica (transporte, energia)          │
│ - Educação (pontuação de exames)                        │
│ - Emprego (recrutamento, demissões)                     │
│ - Serviços essenciais (credit scoring)                  │
│ - Law enforcement                                        │
│ - Gerenciamento de migração                             │
│ - Administração de justiça                              │
│ - Biometrics                                             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ NÍVEL 3: RISCO LIMITADO                                 │
│ - Chatbots (transparência obrigatória)                  │
│ - Deepfakes (disclosure obrigatório)                    │
│ - Emotion recognition (notification)                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ NÍVEL 4: RISCO MÍNIMO                                   │
│ - Spam filters, recomendações, etc.                     │
│ - Sem requisitos especiais                              │
└─────────────────────────────────────────────────────────┘
```

### Requisitos para Sistemas de Alto Risco

1. **Risk Management System**
   - Identificar, avaliar e mitigar riscos
   - Documentar todo o ciclo de vida
   - Atualização contínua

2. **Data Governance**
   - Datasets representativos e sem viés
   - Documentação de data provenance
   - Quality metrics

3. **Technical Documentation**
   - Arquitetura do sistema
   - Data flow diagrams
   - Training methodology
   - Performance metrics

4. **Record Keeping**
   - Logs de operação (mínimo 6 meses)
   - Traceability de decisões
   - Audit trail

5. **Transparency**
   - Usuários informados sobre uso de IA
   - Instructions for use
   - Explicações sobre funcionamento

6. **Human Oversight**
   - Human-in-the-loop para decisões críticas
   - Override capability
   - Stop button

7. **Accuracy, Robustness, Security**
   - Performance mínima documentada
   - Resilience a adversarial attacks
   - Cybersecurity measures

8. **Conformity Assessment**
   - Certificação por terceiros (alguns casos)
   - Self-assessment (maioria)
   - CE marking

### Penalidades

- **Proibições violadas**: Até €35M ou 7% do faturamento global
- **Alto risco não conforme**: Até €15M ou 3% do faturamento
- **Informações falsas**: Até €7.5M ou 1.5% do faturamento

### Mapeamento STRIDE

| Requisito EU AI Act | STRIDE | OWASP LLM |
|--------------------|--------|-----------|
| Data Governance | Tampering | LLM03 |
| Transparency | Information Disclosure | LLM06, LLM09 |
| Human Oversight | Elevation of Privilege | LLM08 |
| Robustness | Denial of Service | LLM04 |
| Security | All categories | All |

---

## 🇪🇺 GDPR (Aplicado a IA)

### Visão Geral

**Status**: Em vigor desde 2018  
**Jurisdição**: União Europeia (global se processar dados de EU)  
**Escopo**: Qualquer processamento de dados pessoais

### Artigos Relevantes para IA

#### Art. 22: Automated Decision-Making

**Direito**:
- Não ser sujeito a decisões baseadas exclusivamente em processamento automatizado
- Inclui profiling

**Exceções** (decisão automatizada permitida se):
1. Necessária para contrato
2. Autorizada por lei
3. Consentimento explícito

**Salvaguardas obrigatórias**:
- Direito a explicação
- Direito a intervenção humana
- Direito a contestar decisão

#### Art. 35: Data Protection Impact Assessment (DPIA)

**Obrigatório para**:
- Automated decision-making com efeitos legais/significativos
- Monitoramento sistemático em larga escala
- Processamento de dados sensíveis em larga escala

**Conteúdo**:
- Descrição do processamento
- Necessidade e proporcionalidade
- Riscos aos indivíduos
- Medidas de mitigação

#### Princípios Fundamentais

1. **Lawfulness, Fairness, Transparency**
   - IA não pode violar direitos fundamentais
   - Explicações devem ser fornecidas

2. **Purpose Limitation**
   - Dados coletados para propósito específico
   - Não reutilizar para treinar IA sem base legal

3. **Data Minimization**
   - Apenas dados necessários
   - Relevante para feature engineering

4. **Accuracy**
   - Dados devem ser precisos e atualizados
   - Mitigar vieses

5. **Storage Limitation**
   - Não reter dados indefinidamente
   - Políticas de retenção para datasets

6. **Integrity and Confidentiality**
   - Segurança adequada
   - Proteger contra data breaches

### Direitos dos Indivíduos

- **Right to be Informed**: Sobre uso de IA
- **Right of Access**: Ver dados que IA usa
- **Right to Rectification**: Corrigir dados incorretos
- **Right to Erasure** ("Right to be Forgotten"): Deletar dados
- **Right to Object**: Objection a automated decisions
- **Right to Data Portability**: Receber dados em formato machine-readable

### Penalidades

- Até €20M ou 4% do faturamento global anual

### Mapeamento STRIDE

| GDPR Principle | STRIDE | OWASP LLM |
|----------------|--------|-----------|
| Transparency | Information Disclosure | LLM06, LLM09 |
| Data Minimization | Information Disclosure | LLM06 |
| Accuracy | Tampering | LLM03 |
| Security | All categories | All |

---

## 🇧🇷 LGPD (Lei Geral de Proteção de Dados - Brasil)

### Visão Geral

**Status**: Em vigor desde 2020  
**Jurisdição**: Brasil  
**Escopo**: Processamento de dados pessoais no Brasil

### Similaridades com GDPR

- Princípios similares (transparência, minimização, segurança)
- Direitos similares (acesso, correção, exclusão)
- DPIA obrigatório para alto risco
- Penalidades similares (até 2% da receita, máximo R$ 50M por infração)

### Diferenças Relevantes para IA

#### Art. 20: Decisões Automatizadas

**Direito**:
- Revisão de decisões automatizadas que afetem interesses
- Informação sobre critérios e procedimentos

**Requisitos**:
- Deve haver possibilidade de revisão por pessoa natural
- Transparência nos critérios

#### Dados Sensíveis

**Categoria especial**:
- Dados sobre origem racial ou étnica
- Convicção religiosa
- Opinião política
- Filiação a sindicato
- Dados referentes à saúde ou vida sexual
- **Dados genéticos ou biométricos**

**Implicações para IA**:
- Biometric recognition = dados sensíveis
- Consentimento explícito necessário (ou outra base legal específica)

### Base Legal para IA

Para treinar modelos com dados brasileiros:
1. **Consentimento** (preferido)
2. **Legítimo interesse** (se demonstrar balanceamento)
3. **Execução de contrato**
4. **Cumprimento de obrigação legal**

### Mapeamento STRIDE

| LGPD Principle | STRIDE | OWASP LLM |
|----------------|--------|-----------|
| Art. 20 (Automated) | Repudiation | LLM09 |
| Dados Sensíveis | Information Disclosure | LLM06 |
| Segurança | All categories | All |

---

## 🇺🇸 Regulações dos EUA

### Federal

#### AI Bill of Rights (2022)

**Status**: Blueprint (não vinculante)  
**5 Princípios**:
1. **Safe and Effective Systems**
2. **Algorithmic Discrimination Protections**
3. **Data Privacy**
4. **Notice and Explanation**
5. **Human Alternatives, Consideration, and Fallback**

#### Executive Order on AI (2023)

**Foco**:
- Segurança de modelos foundation
- Reporting requirements para modelos grandes
- Standards do NIST

### Estaduais

#### California Consumer Privacy Act (CCPA/CPRA)

**Similar ao GDPR**:
- Direito de saber sobre automated decision-making
- Direito de opt-out
- DPIA obrigatório para alto risco

#### New York City - Automated Employment Decision Tools (2023)

**Requisitos**:
- Bias audit obrigatório anual
- Notice aos candidatos
- Publicação de resultados

---

## 🌐 ISO/IEC Standards

### ISO/IEC 42001 (2023): AI Management System

**Escopo**: Sistema de gestão para IA

**Requisitos**:
1. **Context of Organization**
   - Entender stakeholders e requisitos
   
2. **Leadership**
   - AI governance structure
   - Accountability

3. **Planning**
   - Risk assessment
   - Objetivos de IA

4. **Support**
   - Recursos, competências, awareness
   
5. **Operation**
   - Design, development, deployment
   - Change management

6. **Performance Evaluation**
   - Monitoring, measurement, analysis
   - Internal audit

7. **Improvement**
   - Nonconformities, corrective actions
   - Continual improvement

**Certificação**: Auditoria por terceiros

### ISO/IEC 23894 (2023): AI Risk Management

**Complement to ISO 42001**:
- Risk identification
- Risk analysis
- Risk evaluation
- Risk treatment

### ISO/IEC 27001 + AI Extension

**Information Security MS + AI**:
- Controles específicos para IA
- Model security
- Data pipeline security

---

## 🏥 Setores Regulados

### Healthcare (FDA - EUA)

**Medical AI/ML Devices**:
- Pre-market approval
- Post-market surveillance
- Software as Medical Device (SaMD)

**Requirements**:
- Clinical validation
- Safety testing
- Continuous monitoring

### Finance

#### Model Risk Management (SR 11-7)

**Federal Reserve Guidance**:
- Model validation obrigatória
- Independent review
- Ongoing monitoring

#### Fair Lending Laws

**Equal Credit Opportunity Act**:
- Proibir discriminação
- Explicações de adverse actions

### Automotivo

**UN Regulation 157 (Automated Lane Keeping)**:
- Safety validation
- Data recording
- Cybersecurity

---

## 📋 Checklist de Compliance

### Para Sistemas com LLM/IA

#### GDPR/LGPD
- [ ] DPIA realizado
- [ ] Base legal definida
- [ ] Data minimization aplicado
- [ ] Direito a explicação implementado
- [ ] Privacy policy atualizada
- [ ] Consent mechanism (se necessário)
- [ ] Data retention policy
- [ ] DPO nomeado (se aplicável)

#### EU AI Act
- [ ] Classificação de risco determinada
- [ ] Risk management system implementado
- [ ] Technical documentation completa
- [ ] Data governance estabelecida
- [ ] Human oversight implementado
- [ ] Transparency requirements atendidos
- [ ] Conformity assessment realizado
- [ ] CE marking (se high-risk)

#### ISO 42001
- [ ] AI governance structure
- [ ] Risk assessment processo
- [ ] Lifecycle management
- [ ] Performance monitoring
- [ ] Internal audit schedule
- [ ] Improvement process

#### OWASP LLM Top 10
- [ ] Prompt injection mitigations
- [ ] Output validation
- [ ] Training data validation
- [ ] Rate limiting (DoS prevention)
- [ ] Supply chain security
- [ ] PII detection/redaction
- [ ] Plugin security
- [ ] Access controls
- [ ] User education (overreliance)
- [ ] Model protection (theft)

---

## ⚖️ Mapping: Compliance ↔ Security

| Compliance Requirement | Security Control | Framework |
|------------------------|------------------|-----------|
| GDPR Art. 32 (Security) | Encryption, access control | ISO 27001 |
| EU AI Act (Robustness) | Adversarial testing | NIST AI RMF |
| LGPD Art. 46 (Security) | Data protection measures | CIS Controls |
| ISO 42001 (Risk Mgmt) | Threat modeling | STRIDE |
| OWASP LLM (All) | Secure coding, testing | OWASP ASVS |

---

## 🔗 Referências

- EU AI Act: https://artificialintelligenceact.eu/
- GDPR: https://gdpr.eu/
- LGPD: https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd
- ISO/IEC 42001: https://www.iso.org/standard/81230.html
- OWASP LLM Top 10: https://owasp.org/www-project-top-10-for-large-language-model-applications/
- NIST AI RMF: https://www.nist.gov/itl/ai-risk-management-framework

---

**Versão**: 2025.1  
**Última Atualização**: Outubro 2025  
**Licença**: CC BY-SA 4.0


# Threat Modeling Co-Pilot com RAG

## Descrição

Plataforma de modelagem de ameaças que utiliza IA (Google Gemini) e RAG (Retrieval-Augmented Generation) para:
- Analisar sistemas e identificar ameaças STRIDE
- Mapear ameaças para padrões CAPEC
- Sugerir mitigações e avaliar impactos
- Gerar relatórios completos em PDF
- Criar árvores de ataque interativas

## Arquitetura

### Stack Tecnológica
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **IA**: Google Gemini (embeddings 768D + geração de conteúdo)
- **Banco de Dados**: Neo4j (armazenamento vetorial)
- **RAG**: Busca semântica automática com embeddings Gemini

### Sistema RAG
- **Processamento Automático**: Sistema envia informações ao backend automaticamente
- **Busca Vetorial**: Embeddings Gemini (768 dimensões) + Neo4j
- **Mapeamento Dinâmico**: STRIDE-CAPEC carregado via upload de documentos
- **Contexto Inteligente**: Análise enriquecida com base de conhecimento
- **Formatos Suportados**: PDF, DOCX, DOC, TXT, MD, XML, JSON, CSV

## Pré-requisitos

- Node.js 18+
- npm ou yarn
- Docker e Docker Compose
- Conta e chave de API do Google Gemini (https://aistudio.google.com/app/apikey)

## Instalação

1. Clone o repositório:
   ```bash
   git clone <url-do-repo>
   cd threat-modeling-co-pilot-with-ai-3
   ```

2. Instale as dependências:
   ```bash
   npm install
   # ou
   yarn install
   ```

3. Configure as variáveis de ambiente:
   - Copie o arquivo de exemplo:
     ```bash
     cp .env.example .env.local
     ```
   - Edite o arquivo `.env.local` e configure suas chaves:
     ```env
     # Obrigatório - Chave da API Gemini
     GEMINI_API_KEY=sua_chave_gemini_aqui
     
     # Opcional - URL do backend (padrão: http://localhost:3001)
     VITE_BACKEND_URL=http://localhost:3001
     
     # Configurações Neo4j (OBRIGATÓRIO - defina suas próprias credenciais)
     NEO4J_URI=bolt://localhost:7687
     NEO4J_USER=neo4j
     NEO4J_PASSWORD=sua_senha_segura_aqui
     ```
     
     ⚠️ **IMPORTANTE:** Substitua `sua_senha_segura_aqui` por uma senha forte!

4. Iniciar o Neo4j com Docker:
   ```bash
   docker-compose up -d
   ```

5. Inicializar o sistema RAG:
   ```bash
   npm run create-neo4j
   ```

## Uso

### Iniciar o Sistema

**Opção 1: Tudo junto (Recomendado)**
```bash
npm run dev:full
```

**Opção 2: Separadamente**
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend  
npm run dev
```

### Fluxo de Uso

1. **Acesse**: `http://localhost:5173`

2. **Inicialize o RAG**: Painel esquerdo → "Inicializar Sistema RAG"

3. **Upload de Mapeamento STRIDE-CAPEC** (obrigatório):
   - Faça upload do arquivo de mapeamento (MD, JSON, PDF, etc.)
   - Nome sugerido: `capec-stride-mapping.md`

4. **Modelar Ameaças**:
   - Insira a descrição completa do sistema
   - Clique em "Gerar Modelo de Ameaças"
   - O sistema buscará automaticamente CAPECs relevantes via RAG

5. **Visualizar Resultados**:
   - Árvore de Ataque Interativa (Mermaid com zoom/pan)
   - Exportar relatório PDF
   - Refinar análise com IA

## Funcionalidades

### Análise de Ameaças
- Análise STRIDE automática com mapeamento CAPEC
- Sugestão de mitigações práticas
- Avaliação de impacto (CRITICAL, HIGH, MEDIUM, LOW)
- Mapeamento OWASP Top 10
- Árvore de Ataque Interativa (Mermaid)
- Exportação de relatório PDF
- Refinamento com IA

### Sistema RAG
- Upload de documentos (PDF, DOCX, TXT, MD, XML, JSON, CSV)
- Busca semântica vetorial (Gemini embeddings 768D)
- Mapeamento STRIDE-CAPEC dinâmico (via upload)
- Contexto automático para análise de ameaças
- Armazenamento persistente no Neo4j
- Sem duplicação de documentos (atualização inteligente)

## Testes

### Testes Unitários (TypeScript)

Testes unitários isolados usando **Vitest** com mocks:

```bash
# Instalar dependências
npm install

# Executar testes unitários
npm test

# Executar com interface UI
npm run test:ui

# Gerar relatório de cobertura
npm run test:coverage
```

**Cobertura de Testes:**
- ✅ `geminiService.ts` - Funções de IA isoladas
- ✅ `useThreatModeler.ts` - Hook de modelagem de ameaças
- ✅ `SystemInputForm.tsx` - Componente de entrada
- ✅ Validação de remoção do campo "Versão"

### Testes de Integração (Shell Script)

Testes E2E do sistema completo:

```bash
# Executar testes de integração
npm run test:integration

# Ou diretamente:
chmod +x test-rag.sh
./test-rag.sh
```

**Validações:**
- Conectividade do backend
- Inicialização do RAG
- Busca semântica (todas categorias STRIDE)
- Mapeamento STRIDE-CAPEC
- Confiança da busca (>= 70%)
- Upload de documentos

## Documentação

- **[TESTES.md](src/__tests__/TESTES.md)** - Guia completo de testes unitários e integração
- **[QUERIES_NEO4J.md](src/__tests__/QUERIES_NEO4J.md)** - Queries Cypher úteis para Neo4j
- **[GUIA_RAPIDO_NEO4J.md](src/__tests__/GUIA_RAPIDO_NEO4J.md)** - Top 5 queries + troubleshooting
- **[VALIDACAO_RAG.md](src/__tests__/VALIDACAO_RAG.md)** - Evidências de funcionamento do RAG

## Estrutura do Projeto

```
threat-modeling-co-pilot-with-ai-3/
├── src/                          # Frontend React
│   ├── __tests__/               # 🧪 Testes unitários centralizados
│   │   ├── setup.ts
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── components/              # Componentes React
│   │   ├── SystemInputForm.tsx
│   │   ├── ReportDisplay.tsx
│   │   ├── RAGPanel.tsx
│   │   └── LoadingSpinner.tsx
│   ├── hooks/                   # Custom React Hooks
│   │   ├── useThreatModeler.ts
│   │   └── useRAGSystem.ts
│   └── services/                # Serviços
│       ├── geminiService.ts
│       └── ragService.ts
├── backend/                     # Backend Node.js
│   └── src/
│       ├── server.ts           # Express server
│       ├── core/               # Sistema RAG
│       │   ├── graph/          # Neo4j client
│       │   ├── cache/          # Cache manager
│       │   └── search/         # Busca semântica
│       └── utils/              # Utilidades
│           └── documentLoaders.ts
├── test-rag.sh                 # Testes automatizados
├── QUERIES_NEO4J.md           # Queries úteis Neo4j
├── GUIA_RAPIDO_NEO4J.md       # Guia rápido Neo4j
└── VALIDACAO_RAG.md           # Validação do RAG
```

## Criando um Gem no Gemini para Facilitar a Modelagem

Para facilitar a geração do prompt correto que será usado no Threat Modeling Copilot, você pode criar um Gem personalizado no [Gemini](https://gemini.google.com). Siga os passos:

1. Acesse [gemini.google.com](https://gemini.google.com)
2. Clique no ícone de "Gem Manager" ou "Criar Gem"
3. Crie um novo Gem com o nome: **"Threat Modeling Copilot - System Overview"**
4. Cole o template abaixo nas instruções do Gem:

### **Sugestão de Prompt para Modelagem de Ameaças: [Nome do Sistema]**

**Nome do Sistema:** [Nome do seu sistema. Ex: FinDataFlow Engine, EduConnect Hub]

**Objetivo:** [Descrição concisa do propósito principal do sistema. O que ele faz? Qual problema ele resolve?]

**Componentes Chave:**
* [Liste os principais módulos, microsserviços, aplicações (frontends/backends), gateways, etc. Ex: Portal do Aluno, Serviço de Gerenciamento de Cursos, Cluster de Processamento EC2, Dispositivos IoT.]
* [Adicione mais pontos conforme necessário, detalhando a arquitetura.]

**Dados Críticos:**
* [Liste os tipos de dados mais sensíveis que o sistema armazena, processa ou transmite. Ex: Dados Pessoais Identificáveis (PII), Dados de Transações Financeiras, Histórico Médico, Propriedade Intelectual, Credenciais de Acesso.]
* [Especifique a sensibilidade: Confidencialidade, Integridade, Disponibilidade.]

**Tecnologias e Infraestrutura:**
* [Liste as principais tecnologias usadas (linguagens, frameworks, bancos de dados, message brokers). Ex: Python, Java, Spring Boot, PostgreSQL, MongoDB, Kafka.]
* [Descreva a infraestrutura de deployment (cloud provider, orquestração, serviços específicos). Ex: AWS EC2, S3, Kubernetes, Azure IoT Hub.]
* [Mencione aspectos de segurança da tecnologia. Ex: TLS, OAuth, Criptografia em repouso/trânsito.]

**Fluxos de Usuário/Processo:**
* [Descreva os principais atores (usuários, sistemas externos) e como eles interagem com o sistema. Ex: Aluno acessa aulas, Engenheiro de Dados gerencia pipeline, Dispositivo IoT envia telemetria.]
* [Liste os fluxos de dados mais importantes e as interações críticas.]

**[OPCIONAL] Cenário de Ameaça Específico (se aplicável, para prompts baseados em CVE/Incidentes):**
* [Descreva um cenário hipotético ou real onde uma vulnerabilidade específica é explorada, levando a um incidente. Se não houver uma CVE específica, esta seção pode ser omitida ou generalizada como um "Cenário de Risco" principal.]
* [Ex: "Um atacante explora a CVE-XXXX-YYYY no componente Z para obter acesso W, resultando em X."]

**Pergunta para a Modelagem de Ameaças:**

Com base no objetivo do sistema, seus componentes, dados críticos e fluxos de usuário [e no cenário de ameaça descrito, se aplicável]:

* Quais são os principais **ativos** a serem protegidos (incluindo dados, funcionalidades, reputação, infraestrutura)?
* Quais **ameaças** (utilizando o modelo **STRIDE**) poderiam explorar vulnerabilidades no sistema? (Ex: Spoofing de identidade, Tampering de dados, Information Disclosure de informações sensíveis, Denial of Service, Elevação de Privilégio, Repudiação).
* Quais **controles** de segurança (mitigações) você sugere para prevenir essas ameaças, com foco em [especifique áreas-chave como: segurança na nuvem, autenticação/autorização, proteção de dados, hardening de endpoints, moderação de conteúdo, etc.] e como esses controles se alinham com os princípios de segurança?

Após criar o Gem, você pode usá-lo para gerar automaticamente prompts estruturados que serão mais eficazes quando colados no Threat Modeling Copilot.

## Sugestão de Descrição Completa do Sistema

### Exemplo de Prompt para Modelagem de Ameaças: Sistema de Telemedicina

**Nome do Sistema:** HealthConnect

**Objetivo:** Plataforma de telemedicina para agendamento e realização de consultas online, com gerenciamento de prontuários eletrônicos (PEP) e prescrições digitais.

**Componentes Chave:**
- **Frontends:** Portal do Paciente (Web/Móvel) e Portal do Médico (Web).
- **Backends:** API Central, serviços de Agendamento, Teleconsulta (WebRTC), PEP e Prescrição Digital.
- **Dados:** Bancos de Dados de perfil de usuário (MongoDB) e Clínico confidencial (PostgreSQL).
- **Integrações:** Gateways de pagamento, SMS/E-mail e serviços de assinatura digital.

**Dados Críticos:**
- **Dados Pessoais de Saúde (DPH):** Prontuários, histórico médico, resultados de exames e prescrições.
- **Dados Sensíveis:** Informações de identificação do paciente (CPF, nome), credenciais e tokens de pagamento.

**Tecnologias e Infraestrutura:**
- **Tecnologias:** Vue.js, Flutter, Python, Golang, WebRTC, Kafka.
- **Infraestrutura:** Containers (Docker), Orquestração (Kubernetes) no Azure.
- **Segurança:** TLS 1.3, criptografia de ponta a ponta e assinaturas digitais (X.509).

**Fluxos de Usuário:**
- **Paciente:** Agenda, participa de consultas e acessa dados de saúde.
- **Médico:** Gerencia agenda, acessa prontuários e emite prescrições.
- **Administrador:** Gerencia usuários e monitora o sistema.

## Licença
MIT

# Z4l1nux AI Threat Lab

## Descrição

Plataforma avançada de modelagem de ameaças que utiliza múltiplos provedores de IA e RAG (Retrieval-Augmented Generation) para:
- Analisar sistemas e identificar ameaças STRIDE
- Mapear ameaças para padrões CAPEC
- Sugerir mitigações e avaliar impactos
- Gerar relatórios completos em PDF
- Criar árvores de ataque interativas

## Arquitetura

### Stack Tecnológica
- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **IA**: Múltiplos provedores (Gemini, Ollama, OpenRouter)
- **Banco de Dados**: Neo4j (armazenamento vetorial e grafos)
- **RAG**: Busca semântica com embeddings configuráveis

### Provedores de IA Suportados

#### 1. Google Gemini
- **Modelos**: Gemini 1.5 Pro, Gemini 1.5 Flash
- **Embeddings**: Gemini Embedding 001 (768D)
- **Configuração**: `GEMINI_API_KEY`

#### 2. Ollama (Modelos Locais)
- **Modelos**: Qualquer modelo disponível no Ollama
- **Embeddings**: Modelos de embedding do Ollama (nomic-embed-text)
- **Configuração**: 
  - `OLLAMA_BASE_URL` (ex: http://172.21.112.1:11434)
  - `MODEL_OLLAMA` (ex: granite3.3:8b, qwen2.5-coder:7b)
  - `EMBEDDING_MODEL` (ex: nomic-embed-text:latest)

#### 3. OpenRouter
- **Modelos**: Qualquer modelo disponível no OpenRouter
- **Embeddings**: Usa Gemini como fallback
- **Configuração**:
  - `OPENROUTER_API_KEY`
  - `MODEL_OPENROUTER` (ex: meta-llama/llama-3.3-70b-instruct:free)

### Sistema RAG
- **Processamento Automático**: Sistema envia informações ao backend automaticamente
- **Busca Vetorial**: Embeddings configuráveis + Neo4j com índices vetoriais
- **Mapeamento Dinâmico**: STRIDE-CAPEC carregado via upload de documentos
- **Contexto Inteligente**: Análise enriquecida com base de conhecimento
- **Formatos Suportados**: PDF, DOCX, DOC, TXT, MD, XML, JSON, CSV
- **Cache Inteligente**: Sistema de cache com TTL configurável
- **Múltiplos Provedores**: Suporte a diferentes provedores de IA e embeddings

### Seleção de Modelos
- **Interface Dinâmica**: Dropdowns para seleção de modelos em tempo real
- **Verificação de Disponibilidade**: Sistema verifica automaticamente quais modelos estão disponíveis
- **Fallback Inteligente**: Sistema usa modelos alternativos se o principal falhar
- **Configuração Flexível**: Suporte a modelos locais e remotos

## Pré-requisitos

- Node.js 18+
- npm ou yarn
- Docker e Docker Compose
- **Pelo menos um dos seguintes provedores de IA:**
  - Google Gemini: Conta e chave de API (https://aistudio.google.com/app/apikey)
  - Ollama: Instalação local do Ollama (https://ollama.ai)
  - OpenRouter: Conta e chave de API (https://openrouter.ai)

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
   
   Crie um arquivo `.env.local` na raiz do projeto com as configurações necessárias:
     ```env
     # Configurações do servidor backend
     BACKEND_PORT=3001
     FRONTEND_URL=http://localhost:5173
     
     # Configurações do Neo4j (OBRIGATÓRIO - defina suas próprias credenciais)
     NEO4J_URI=bolt://localhost:7687
     NEO4J_USER=neo4j
     NEO4J_PASSWORD=sua_senha_segura_aqui
     
     # Configurações de cache
     RESPONSE_CACHE_TTL_MS=300000
     RETRIEVAL_CACHE_TTL_MS=300000
     
     # Modo de busca
     SEARCH_MODE=neo4j
     
     # Configurações de upload
     MAX_FILE_SIZE=10485760
     ALLOWED_EXTENSIONS=pdf,docx,doc,txt,md,xml,json,csv
     
     # === PROVEDORES DE IA (configure pelo menos um) ===
     
     # Google Gemini (recomendado)
     GEMINI_API_KEY=sua_chave_gemini_aqui
     
     # Ollama (modelos locais)
     OLLAMA_BASE_URL=http://172.21.112.1:11434
     MODEL_OLLAMA=granite3.3:8b
     EMBEDDING_MODEL=nomic-embed-text:latest
     
     # OpenRouter (modelos remotos)
     # OPENROUTER_API_KEY=sk-or-my-api-key
     # MODEL_OPENROUTER=meta-llama/llama-3.3-70b-instruct:free
     ```
     
     ⚠️ **IMPORTANTE:** 
     - Substitua `sua_senha_segura_aqui` por uma senha forte para o Neo4j
     - Configure pelo menos um provedor de IA (Gemini, Ollama ou OpenRouter)
     - Ajuste `FRONTEND_URL` se estiver usando uma porta diferente

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

2. **Selecione os Modelos**: Use os dropdowns para escolher:
   - **Modelo de IA**: Para geração de conteúdo (Gemini, Ollama, OpenRouter)
   - **Modelo de Embedding**: Para busca semântica (Gemini, Ollama)

3. **Inicialize o RAG**: Painel esquerdo → "Inicializar Sistema RAG"

4. **Upload de Mapeamento STRIDE-CAPEC** (obrigatório):
   - Faça upload do arquivo de mapeamento (MD, JSON, PDF, etc.)
   - Nome sugerido: `capec-stride-mapping.md`

5. **Modelar Ameaças**:
   - Insira a descrição completa do sistema
   - Clique em "Gerar Modelo de Ameaças"
   - O sistema buscará automaticamente CAPECs relevantes via RAG

6. **Visualizar Resultados**:
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
- Busca semântica vetorial com embeddings configuráveis
- Mapeamento STRIDE-CAPEC dinâmico (via upload)
- Contexto automático para análise de ameaças
- Armazenamento persistente no Neo4j com índices vetoriais
- Cache inteligente com TTL configurável
- Suporte a múltiplos provedores de embeddings
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
│   │   │   └── SystemInputForm.test.tsx
│   │   ├── hooks/
│   │   │   └── useThreatModeler.test.ts
│   │   ├── services/
│   │   │   ├── aiService.test.ts
│   │   │   └── geminiService.test.ts
│   │   ├── TESTES.md           # Guia completo de testes
│   │   ├── QUERIES_NEO4J.md    # Queries úteis Neo4j
│   │   └── GUIA_RAPIDO_NEO4J.md # Guia rápido Neo4j
│   ├── components/              # Componentes React
│   │   ├── SystemInputForm.tsx
│   │   ├── ReportDisplay.tsx
│   │   ├── RAGPanel.tsx
│   │   ├── ModelSelector.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── DocumentUpload.tsx
│   ├── hooks/                   # Custom React Hooks
│   │   ├── useThreatModeler.ts
│   │   ├── useModelSelection.ts
│   │   └── useRAGSystem.ts
│   └── services/                # Serviços
│       ├── aiService.ts
│       └── ragService.ts
├── backend/                     # Backend Node.js
│   ├── src/
│   │   ├── server.ts           # Express server
│   │   ├── core/               # Sistema RAG e IA
│   │   │   ├── graph/          # Neo4j client
│   │   │   │   └── Neo4jClient.ts
│   │   │   ├── cache/          # Cache manager
│   │   │   ├── search/         # Busca semântica
│   │   │   │   ├── GeminiSearchFactory.ts
│   │   │   │   └── SemanticSearchFactory.ts
│   │   │   └── models/         # Provedores de IA
│   │   │       ├── providers/  # Gemini, Ollama, OpenRouter
│   │   │       │   ├── GeminiProvider.ts
│   │   │       │   ├── OllamaProvider.ts
│   │   │       │   └── OpenRouterProvider.ts
│   │   │       ├── ModelFactory.ts
│   │   │       └── ModelProvider.ts
│   │   ├── scripts/            # Scripts utilitários
│   │   │   ├── initNeo4j.ts
│   │   │   ├── testRAG.ts
│   │   │   ├── fixVectorIndex.ts
│   │   │   ├── createVectorIndexes.ts
│   │   │   └── simplifyNeo4jIndexes.ts
│   │   ├── types/              # Definições de tipos
│   │   └── utils/              # Utilidades
│   │       └── documentLoaders.ts
│   ├── package.json            # Dependências do backend
│   └── tsconfig.json           # Configuração TypeScript
├── test-rag.sh                 # Testes automatizados de integração
├── docker-compose.yml          # Configuração Neo4j
├── MODEL_SELECTION.md          # Documentação de seleção de modelos
├── package.json                # Dependências do frontend
├── vite.config.ts              # Configuração Vite
├── vitest.config.ts            # Configuração de testes
├── tailwind.config.js          # Configuração TailwindCSS
├── tsconfig.json               # Configuração TypeScript frontend
└── App.tsx                     # Componente principal
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

## ✅ Validação do Sistema

### Estrutura Validada
- ✅ **Frontend React**: Componentes, hooks e serviços organizados
- ✅ **Backend Node.js**: API REST com sistema RAG completo
- ✅ **Banco de Dados**: Neo4j configurado com Docker Compose
- ✅ **Testes**: Testes unitários (Vitest) e integração (Shell script)
- ✅ **Documentação**: README, guias e documentação técnica completa
- ✅ **Configuração**: Vite, TypeScript, TailwindCSS configurados

### Funcionalidades Validadas
- ✅ **Múltiplos Provedores de IA**: Gemini, Ollama, OpenRouter
- ✅ **Sistema RAG**: Busca semântica com embeddings configuráveis
- ✅ **Upload de Documentos**: Suporte a PDF, DOCX, TXT, MD, XML, JSON, CSV
- ✅ **Modelagem de Ameaças**: Análise STRIDE com mapeamento CAPEC
- ✅ **Interface Responsiva**: Design moderno com TailwindCSS
- ✅ **Testes Automatizados**: Cobertura de testes unitários e integração

### Arquivos de Configuração
- ✅ **package.json**: Dependências do frontend e backend
- ✅ **tsconfig.json**: Configuração TypeScript para ambos os projetos
- ✅ **vite.config.ts**: Configuração do bundler
- ✅ **vitest.config.ts**: Configuração de testes
- ✅ **tailwind.config.js**: Configuração de estilos
- ✅ **docker-compose.yml**: Configuração do Neo4j

## ⚠️ Problemas Identificados e Correções Necessárias

### Dependências Duplicadas
O sistema possui algumas dependências duplicadas entre frontend e backend que podem ser otimizadas:

**Dependências que devem ser removidas do frontend:**
- `neo4j-driver` - Usado apenas no backend
- `express` - Usado apenas no backend  
- `cors` - Usado apenas no backend
- `multer` - Usado apenas no backend
- `dotenv` - Usado apenas no backend
- `@langchain/community` - Usado apenas no backend
- `@langchain/google-genai` - Usado apenas no backend
- `csv-parser` - Usado apenas no backend
- `pdf-parse` - Usado apenas no backend
- `xml2js` - Usado apenas no backend

**Para otimizar:**
```bash
# Remover dependências desnecessárias do frontend
npm uninstall neo4j-driver express cors multer dotenv @langchain/community @langchain/google-genai csv-parser pdf-parse xml2js
```

### Segurança
- **Senha hardcoded no Docker Compose**: A senha do Neo4j está exposta no `docker-compose.yml`
- **Recomendação**: Usar variáveis de ambiente para credenciais sensíveis

### Arquivos Ausentes
- ✅ **test-rag.sh**: Criado durante a validação
- ✅ **Estrutura de testes**: Validada e funcional

### Melhorias Recomendadas
1. **Criar .env.example**: Para facilitar configuração inicial
2. **Separar dependências**: Manter apenas dependências necessárias em cada package.json
3. **Documentar variáveis de ambiente**: Listar todas as variáveis necessárias
4. **Adicionar health checks**: Para monitoramento do sistema

## Licença
MIT

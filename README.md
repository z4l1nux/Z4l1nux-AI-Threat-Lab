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
- **IA**: Múltiplos provedores (Ollama, OpenRouter)
- **Banco de Dados**: Neo4j (armazenamento vetorial e grafos)
- **RAG**: Busca semântica com embeddings configuráveis

### Provedores de IA Suportados

#### 2. Ollama (Modelos Locais)
- **Modelos**: Qualquer modelo disponível no Ollama
- **Embeddings**: Modelos de embedding do Ollama (nomic-embed-text)
- **Configuração**: 
  - `OLLAMA_BASE_URL` (ex: http://172.21.112.1:11434)
  - `MODEL_OLLAMA` (ex: granite3.3:8b, llama3.1:latest)
  - `EMBEDDING_MODEL` (ex: nomic-embed-text:latest)

#### 2. OpenRouter
- **Modelos**: Qualquer modelo disponível no OpenRouter
- **Embeddings**: Usa Ollama como fallback
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
├── LICENSE                     # Licença MIT
├── package.json                # Dependências do frontend
├── vite.config.ts              # Configuração Vite
├── vitest.config.ts            # Configuração de testes
├── tailwind.config.js          # Configuração TailwindCSS
├── tsconfig.json               # Configuração TypeScript frontend
└── App.tsx                     # Componente principal
```

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

## Configurações de Timeout

### Ollama (Modelo Local)
- **Timeout Padrão**: 180 segundos (3 minutos)
- **Tentativas**: 2 tentativas máximo
- **Fallback**: OpenRouter automático em caso de falha

### Variáveis de Ambiente Recomendadas
```bash
# Ollama
OLLAMA_BASE_URL=http://localhost:11434
MODEL_OLLAMA=llama3.1:latest
EMBEDDING_MODEL=nomic-embed-text:latest
OLLAMA_TIMEOUT=180000  # 3 minutos
OLLAMA_MAX_RETRIES=2

# OpenRouter (Fallback)
OPENROUTER_API_KEY=sua_chave_aqui
MODEL_OPENROUTER=meta-llama/llama-3.3-70b-instruct:free
```

### Ajuste de Timeout
Para prompts muito complexos, você pode aumentar o timeout:
- **Padrão**: 180s (3 minutos)
- **Complexo**: 300s (5 minutos) - `OLLAMA_TIMEOUT=300000`
- **Muito Complexo**: 600s (10 minutos) - `OLLAMA_TIMEOUT=600000`

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

### Resumo da Licença MIT

- ✅ **Uso comercial**: Permitido
- ✅ **Modificação**: Permitida  
- ✅ **Distribuição**: Permitida
- ✅ **Uso privado**: Permitido
- ⚠️ **Responsabilidade**: Sem garantias
- 📋 **Requisitos**: Incluir copyright e licença

Para mais informações, consulte o arquivo [LICENSE](LICENSE) na raiz do projeto.

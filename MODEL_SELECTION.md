# Sistema de Seleção de Modelos

O Z4l1nux AI Threat Lab agora suporta múltiplos provedores de IA através de um sistema de seleção de modelos dinâmico.

## Provedores Suportados

### 1. Google Gemini
- **Modelos**: Gemini 1.5 Pro, Gemini 1.5 Flash
- **Embeddings**: Gemini Embedding 001
- **Configuração**: `GEMINI_API_KEY`

### 2. Ollama (Modelos Locais)
- **Modelos**: Qualquer modelo disponível no Ollama
- **Embeddings**: Modelos de embedding do Ollama
- **Configuração**: 
  - `OLLAMA_BASE_URL` (ex: http://172.21.112.1:11434)
  - `MODEL_OLLAMA` (ex: granite3.3:8b)
  - `EMBEDDING_MODEL` (ex: nomic-embed-text:latest)

### 3. OpenRouter
- **Modelos**: Qualquer modelo disponível no OpenRouter
- **Configuração**:
  - `OPENROUTER_API_KEY`
  - `MODEL_OPENROUTER` (ex: meta-llama/llama-3.3-70b-instruct:free)

## Configuração

1. Crie um arquivo `.env.local` na raiz do projeto
2. Configure as variáveis para os provedores desejados:

```env
# Configurações do Ollama (para modelos locais)
OLLAMA_BASE_URL=http://172.21.112.1:11434
MODEL_OLLAMA=granite3.3:8b
EMBEDDING_MODEL=nomic-embed-text:latest

# Configurações do OpenRouter (para modelos remotos)
OPENROUTER_API_KEY=sk-or-my-api-key
MODEL_OPENROUTER=meta-llama/llama-3.3-70b-instruct:free

# Configurações do Gemini/AI Studio
GEMINI_API_KEY=sua-chave-api
EMBEDDING_MODEL=gemini-embedding-001

# Configurações do Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=!2NS£A82p5Y

# Configurações do servidor backend
BACKEND_PORT=3001
FRONTEND_URL=http://localhost:5173

# Configurações de cache
RESPONSE_CACHE_TTL_MS=300000
RETRIEVAL_CACHE_TTL_MS=300000

# Modo de busca
SEARCH_MODE=neo4j

# Configurações de upload
MAX_FILE_SIZE=10485760
ALLOWED_EXTENSIONS=pdf,docx,doc,txt,md,xml,json,csv
```

## Como Usar

1. **Inicie o backend**: `npm run dev:backend`
2. **Inicie o frontend**: `npm run dev`
3. **Selecione os modelos**: Use os dropdowns na interface para escolher:
   - Modelo de IA principal
   - Modelo de embedding
4. **Configure o sistema RAG**: Clique em "Inicializar Sistema RAG"
5. **Faça upload de documentos**: Use a seção de upload de documentos
6. **Gere o modelo de ameaças**: Preencha as informações e clique em "Gerar Modelo de Ameaças"

## Funcionalidades

- **Seleção dinâmica**: Os modelos aparecem automaticamente baseado nas variáveis de ambiente configuradas
- **Persistência**: As seleções são salvas no localStorage
- **Status dos provedores**: Indicadores visuais mostram quais provedores estão configurados
- **Fallback inteligente**: Se um provedor não estiver disponível, ele aparece como "Indisponível"

## Notas Técnicas

- O sistema detecta automaticamente quais provedores estão configurados
- As seleções são persistidas localmente para melhor UX
- O backend expõe um endpoint `/api/models/available` para listar modelos
- Suporte completo para modelos locais (Ollama) e remotos (Gemini, OpenRouter)

# Sistema RAG com Suporte ao Gemini e Ollama (TypeScript)

Este projeto implementa um sistema de Retrieval-Augmented Generation (RAG) em TypeScript que pode usar tanto a API do Google Gemini quanto o Ollama local com o modelo Mistral. Inclui uma interface web moderna e responsiva.

## Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- Ollama (para uso local)

## Instalação

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente (crie um arquivo `.env`):
```bash
# Chave da API Google (OBRIGATÓRIA - necessária para embeddings)
# Mesmo usando Ollama para chat, o Google Gemini é necessário para busca semântica
GOOGLE_API_KEY=sua_chave_api_google_aqui

# Configurações do Ollama (opcional)
OLLAMA_BASE_URL=http://127.0.0.1:11434
```

**⚠️ Importante**: A chave Google é obrigatória mesmo quando usando Ollama, pois é necessária para gerar os embeddings que permitem a busca semântica nos documentos.

## Configuração do Ollama

1. Instale o Ollama seguindo as instruções em: https://ollama.ai/

2. Baixe o modelo necessário:
```bash
ollama pull mistral
```

3. Inicie o servidor Ollama:
```bash
ollama serve
```

O servidor estará disponível em `http://127.0.0.1:11434`

## Preparando a Base de Conhecimento

1. Crie uma pasta chamada `base/` no diretório raiz do projeto
2. Coloque seus arquivos PDF nesta pasta
3. Execute o script para criar o banco de dados vetorial:
```bash
npm run create-db
```

## Uso

### Interface Web (Recomendado)

1. **Criar o banco de dados:**
```bash
npm run create-db
```

2. **Iniciar o servidor web:**
```bash
npm run web
```

3. **Abrir no navegador:**
```
http://localhost:3000
```

4. **Usar a interface web:**
   - Escolha entre Gemini ou Ollama
   - Digite sua pergunta
   - Veja a resposta e logs em tempo real
   - Visualize estatísticas dos resultados

### Interface de Linha de Comando

1. **Criar o banco de dados:**
```bash
npm run create-db
```

2. **Executar o programa:**
```bash
npm run dev
```

3. **Escolher o modelo:**
   - **1 - Gemini**: Usa a API do Google Gemini
   - **2 - Ollama (Mistral)**: Usa o modelo Mistral local via Ollama

### Produção
```bash
npm run build
npm start
```

## Funcionalidades

- **Interface Web Moderna**: Interface responsiva e intuitiva
- **Busca semântica**: Encontra documentos relevantes na base de conhecimento
- **Geração de respostas**: Gera respostas baseadas no contexto encontrado
- **Múltiplos modelos**: Suporte para Google Gemini e Ollama/Mistral
- **Logs em tempo real**: Visualize o processo de busca e geração
- **Estatísticas**: Veja quantos resultados foram encontrados e seus scores
- **Base de dados vetorial**: Usa MemoryVectorStore para armazenamento de embeddings
- **TypeScript**: Código totalmente tipado para melhor desenvolvimento

## Estrutura do Projeto

```
├── src/
│   ├── main.ts          # Script principal com as funções de RAG (CLI)
│   ├── server.ts        # Servidor web Express.js
│   ├── criarDb.ts       # Script para criar o banco de dados vetorial
│   └── types.ts         # Definições de tipos TypeScript
├── public/
│   └── index.html       # Interface web
├── dist/                # Código compilado (gerado automaticamente)
├── package.json         # Dependências e scripts do projeto
├── tsconfig.json        # Configuração do TypeScript
├── .env                 # Arquivo de configuração com variáveis de ambiente
└── README.md           # Este arquivo
```

## Scripts Disponíveis

- `npm run web`: Inicia o servidor web na porta 3000
- `npm run dev`: Executa o código TypeScript diretamente (interface CLI)
- `npm run build`: Compila o código TypeScript para JavaScript
- `npm start`: Executa o código compilado
- `npm run create-db`: Cria o banco de dados vetorial a partir de PDFs na pasta `base/`
- `npm run install-deps`: Instala as dependências

## Tecnologias Utilizadas

- **TypeScript**: Linguagem principal
- **LangChain**: Framework para LLMs
- **Express.js**: Servidor web
- **MemoryVectorStore**: Base de dados vetorial em memória
- **Google Gemini**: API de embeddings e chat
- **Ollama**: Execução local de modelos
- **Node.js**: Runtime JavaScript 
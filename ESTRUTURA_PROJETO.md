# Estrutura do Projeto - Padrão Organizado

Este documento descreve a nova estrutura organizada do projeto, seguindo boas práticas de organização de código e padrões de projeto claros e intuitivos.

## 🏗️ Estrutura de Diretórios

```
src/
├── core/                    # 🧠 Lógica principal do sistema
│   ├── cache/              # 💾 Gerenciadores de cache
│   │   ├── CacheManager.ts           # Cache JSON (legado)
│   │   └── LanceDBCacheManager.ts    # Cache LanceDB (novo)
│   ├── search/             # 🔍 Implementações de busca
│   │   ├── SearchFactory.ts          # Factory para múltiplos backends
│   │   ├── SemanticSearch.ts         # Busca tradicional
│   │   ├── OptimizedSemanticSearch.ts # Busca otimizada
│   │   └── LanceDBSemanticSearch.ts  # Busca LanceDB
│   └── types.ts            # 📝 Tipos principais do sistema
├── cli/                    # 💻 Interfaces de linha de comando
│   ├── main.ts             # Interface principal CLI
│   ├── searchManager.ts    # Gerenciador de busca CLI
│   └── managers/           # 🛠️ Gerenciadores específicos
│       ├── criarDb.ts      # Gerenciador cache JSON
│       └── criarLanceDB.ts # Gerenciador cache LanceDB
├── web/                    # 🌐 Interface web
│   └── server.ts           # Servidor web Express
├── utils/                  # 🔧 Utilitários gerais
│   ├── fileUtils.ts        # Utilitários para arquivos
│   ├── documentLoaders.ts  # Loaders para diferentes formatos
│   ├── ProgressTracker.ts  # Rastreador de progresso
│   ├── PromptTemplates.ts  # Templates de prompts
│   └── SearchSwitcher.ts   # Alternador de implementações
└── test/                   # 🧪 Testes
    ├── testCache.ts        # Testes de cache
    ├── testRAG.ts          # Testes do sistema RAG
    ├── testLanceDB.ts      # Testes específicos LanceDB
    ├── testLoaders.ts      # Testes dos loaders
    ├── testPerformance.ts  # Testes de performance
    ├── testReprocessamento.ts # Testes de reprocessamento
    ├── testCAPECSearch.ts  # Testes de busca CAPEC
    └── testFormattedResponse.ts # Testes de resposta formatada
```

## 🎯 Princípios de Organização

### 1. **Separação de Responsabilidades**
- **`core/`**: Lógica de negócio principal
- **`cli/`**: Interfaces de linha de comando
- **`web/`**: Interface web
- **`utils/`**: Utilitários reutilizáveis
- **`test/`**: Testes organizados por funcionalidade

### 2. **Padrão de Nomenclatura**
- **Arquivos**: PascalCase para classes, camelCase para funções
- **Diretórios**: camelCase para consistência
- **Imports**: Relativos claros e organizados

### 3. **Organização por Funcionalidade**
- Cada funcionalidade tem seu próprio diretório
- Arquivos relacionados ficam próximos
- Imports organizados e intuitivos

## 📁 Detalhamento dos Diretórios

### 🧠 **core/** - Lógica Principal

#### **core/cache/**
Gerencia diferentes tipos de cache para o sistema RAG.

- **`CacheManager.ts`**: Cache JSON customizado (sistema legado)
- **`LanceDBCacheManager.ts`**: Cache LanceDB (sistema atual)

#### **core/search/**
Implementações de busca semântica.

- **`SearchFactory.ts`**: Factory para criar instâncias de busca
- **`SemanticSearch.ts`**: Busca semântica tradicional
- **`OptimizedSemanticSearch.ts`**: Busca otimizada com índices
- **`LanceDBSemanticSearch.ts`**: Busca usando LanceDB

#### **core/types.ts**
Definições de tipos principais do sistema.

### 💻 **cli/** - Interfaces de Linha de Comando

#### **cli/main.ts**
Interface principal de linha de comando para interação com o usuário.

#### **cli/searchManager.ts**
Gerenciador específico para alternar entre implementações de busca.

#### **cli/managers/**
Gerenciadores para diferentes tipos de cache.

- **`criarDb.ts`**: Gerenciador para cache JSON
- **`criarLanceDB.ts`**: Gerenciador para cache LanceDB

### 🌐 **web/** - Interface Web

#### **web/server.ts**
Servidor Express para interface web do sistema RAG.

### 🔧 **utils/** - Utilitários

#### **fileUtils.ts**
Utilitários para manipulação de arquivos e diretórios.

#### **documentLoaders.ts**
Loaders para diferentes tipos de documentos (PDF, XML, JSON, CSV).

#### **ProgressTracker.ts**
Sistema de rastreamento de progresso para operações longas.

#### **PromptTemplates.ts**
Templates de prompts para diferentes tipos de perguntas.

#### **SearchSwitcher.ts**
Utilitário para alternar entre implementações de busca.

### 🧪 **test/** - Testes

Testes organizados por funcionalidade:

- **`testCache.ts`**: Testes de cache
- **`testRAG.ts`**: Testes do sistema RAG completo
- **`testLanceDB.ts`**: Testes específicos do LanceDB
- **`testLoaders.ts`**: Testes dos loaders de documentos
- **`testPerformance.ts`**: Testes de performance
- **`testReprocessamento.ts`**: Testes de reprocessamento
- **`testCAPECSearch.ts`**: Testes de busca CAPEC
- **`testFormattedResponse.ts`**: Testes de resposta formatada

## 🔄 Padrão de Imports

### Imports Internos
```typescript
// De core para utils
import { FileUtils } from '../../utils/fileUtils';

// De cli para core
import { SearchFactory } from '../core/search/SearchFactory';

// De test para core
import { SearchFactory } from '../core/search/SearchFactory';
```

### Imports Externos
```typescript
// LangChain
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// LanceDB
import { connect, Connection, Table } from '@lancedb/lancedb';

// Node.js
import * as path from 'path';
import * as fs from 'fs';
```

## 🚀 Comandos Disponíveis

### Desenvolvimento
```bash
# Interface CLI
npm run dev

# Interface Web
npm run web

# Build
npm run build
```

### Gerenciamento de Cache
```bash
# Cache LanceDB (recomendado)
npm run create-lancedb

# Cache JSON (legado)
npm run create-db

# Gerenciador de busca
npm run search-manager
```

### Testes
```bash
# Testes específicos
npm run test-lancedb
npm run test-rag
npm run test-loaders
npm run test-performance
```

## 🎯 Vantagens da Nova Estrutura

### 1. **Clareza e Intuição**
- Estrutura fácil de entender
- Arquivos organizados por funcionalidade
- Nomenclatura consistente

### 2. **Manutenibilidade**
- Separação clara de responsabilidades
- Fácil localização de arquivos
- Imports organizados

### 3. **Escalabilidade**
- Fácil adição de novas funcionalidades
- Estrutura preparada para crescimento
- Padrões consistentes

### 4. **Testabilidade**
- Testes organizados por funcionalidade
- Fácil isolamento de componentes
- Cobertura de testes clara

## 🔧 Configuração do TypeScript

O `tsconfig.json` está configurado para suportar a nova estrutura:

```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./src",
    "paths": {
      "@core/*": ["core/*"],
      "@cli/*": ["cli/*"],
      "@web/*": ["web/*"],
      "@utils/*": ["utils/*"],
      "@test/*": ["test/*"]
    }
  }
}
```

## 📝 Convenções de Código

### 1. **Imports**
- Ordem: Externos → Internos → Relativos
- Agrupamento por funcionalidade
- Imports específicos quando possível

### 2. **Nomenclatura**
- Classes: PascalCase
- Funções/Variáveis: camelCase
- Constantes: UPPER_SNAKE_CASE
- Arquivos: PascalCase para classes, camelCase para outros

### 3. **Organização de Classes**
- Imports no topo
- Interfaces/Types
- Classe principal
- Exports

### 4. **Documentação**
- JSDoc para funções públicas
- Comentários explicativos para lógica complexa
- README atualizado com mudanças

## 🎉 Conclusão

A nova estrutura oferece:

- **Organização clara** e intuitiva
- **Fácil navegação** no código
- **Manutenibilidade** melhorada
- **Escalabilidade** para futuras funcionalidades
- **Padrões consistentes** em todo o projeto

O projeto agora segue boas práticas de organização de código e está preparado para crescimento futuro! 🚀

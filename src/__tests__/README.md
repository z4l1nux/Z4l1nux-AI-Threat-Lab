# 🧪 Testes & Documentação

Este diretório centraliza **todos os testes** e **documentação técnica** do projeto.

## 📁 Estrutura

```
src/__tests__/
├── 📄 Documentação
│   ├── README.md                    # Este arquivo
│   ├── TESTES.md                    # Guia completo de testes
│   ├── QUERIES_NEO4J.md             # Queries úteis Neo4j
│   ├── GUIA_RAPIDO_NEO4J.md         # Top 5 queries
│   └── VALIDACAO_RAG.md             # Validação do RAG
│
├── 🧪 Testes
│   ├── setup.ts                     # Setup global
│   ├── components/                  # Testes React
│   │   └── *.test.tsx
│   ├── hooks/                       # Testes Hooks
│   │   └── *.test.ts
│   └── services/                    # Testes Services
│       └── *.test.ts
```

## 📚 Documentação Disponível

- **[TESTES.md](TESTES.md)** - Guia completo de testes (unitários e integração)
- **[QUERIES_NEO4J.md](QUERIES_NEO4J.md)** - Queries Cypher úteis para o Neo4j
- **[GUIA_RAPIDO_NEO4J.md](GUIA_RAPIDO_NEO4J.md)** - Top 5 queries + troubleshooting
- **[VALIDACAO_RAG.md](VALIDACAO_RAG.md)** - Evidências de funcionamento do sistema RAG

## 🔧 Setup de Testes

O arquivo `setup.ts` configura:

1. **Matchers do Testing Library** - Métodos como `toBeInTheDocument()`, `toBeDisabled()`, etc.
2. **Cleanup Automático** - Limpeza do DOM após cada teste
3. **Mocks Globais** - `window.matchMedia` e outras APIs do navegador

## 📝 Convenções

### Nomenclatura

- Arquivos de teste: `*.test.ts` ou `*.test.tsx`
- Suites de teste: Use `describe()` para agrupar testes relacionados
- Casos de teste: Use `it()` ou `test()` com descrições claras em português

### Organização

```
src/__tests__/
├── components/
│   └── NomeDoComponente.test.tsx    # Testa src/components/NomeDoComponente.tsx
├── hooks/
│   └── useNomeDoHook.test.ts        # Testa src/hooks/useNomeDoHook.ts
└── services/
    └── nomeDoService.test.ts        # Testa src/services/nomeDoService.ts
```

### Exemplo de Teste

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('MinhaFuncao', () => {
  it('deve retornar valor esperado quando input é válido', () => {
    const resultado = minhaFuncao('input válido');
    expect(resultado).toBe('esperado');
  });

  it('deve lançar erro quando input é inválido', () => {
    expect(() => minhaFuncao(null)).toThrow();
  });
});
```

## 🎯 Boas Práticas

1. **Isole suas unidades** - Teste apenas uma coisa por vez
2. **Use mocks** - Simule dependências externas (APIs, banco de dados)
3. **Teste casos extremos** - Não apenas o caminho feliz
4. **Mantenha testes rápidos** - Evite operações assíncronas desnecessárias
5. **Descrições claras** - O teste deve documentar o comportamento esperado
6. **Centralize testes** - Todos em `src/__tests__/`, organizados por tipo

## 🔍 Mocks Disponíveis

### APIs do Navegador

```typescript
// window.matchMedia já está mockado globalmente em setup.ts
```

### Google GenAI (Exemplo)

```typescript
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn()
    }
  }))
}));
```

### Fetch API

```typescript
global.fetch = vi.fn();

// No teste:
(global.fetch as any).mockResolvedValueOnce({
  ok: true,
  json: async () => ({ data: 'mock' })
});
```

## 🚀 Executar Testes

```bash
# Todos os testes
npm test

# Modo watch
npm test -- --watch

# Interface UI
npm run test:ui

# Cobertura
npm run test:coverage

# Teste específico
npm test -- geminiService.test.ts
```

## 📊 Cobertura Esperada

- **Statements**: >= 80%
- **Branches**: >= 75%  
- **Functions**: >= 80%
- **Lines**: >= 80%

## 🐛 Debugging

```bash
# Com logs detalhados
npm test -- --reporter=verbose

# Parar no primeiro erro
npm test -- --bail

# Modo debug
npm test -- --inspect-brk
```

## ➕ Adicionar Novo Teste

1. Identifique o tipo (component, hook ou service)
2. Crie o arquivo em `src/__tests__/{tipo}/`
3. Importe o que está testando: `../../{tipo}/arquivo`
4. Escreva o teste
5. Execute: `npm test`

Exemplo:
```typescript
// src/__tests__/services/meuService.test.ts
import { describe, it, expect } from 'vitest';
import { minhaFuncao } from '../../services/meuService';

describe('meuService', () => {
  it('deve funcionar', () => {
    expect(minhaFuncao()).toBeDefined();
  });
});
```


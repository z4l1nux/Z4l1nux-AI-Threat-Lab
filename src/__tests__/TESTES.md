# 🧪 Guia de Testes - Threat Modeling Co-Pilot

## 📋 Tipos de Testes

### 1. **Testes Unitários** (TypeScript + Vitest)

Testes que isolam e validam **funções, classes e componentes individuais** usando mocks.

#### **Instalação**
```bash
npm install
```

#### **Executar Testes**
```bash
# Executar todos os testes unitários
npm test

# Executar em modo watch (re-executa ao salvar)
npm test -- --watch

# Executar com interface gráfica
npm run test:ui

# Gerar relatório de cobertura
npm run test:coverage
```

#### **Cobertura Atual**

| Arquivo | Tipo | Testes | Descrição |
|---------|------|--------|-----------|
| **geminiService.ts** | Service | 4 | Resumo de sistema, validação, erros |
| **useThreatModeler.ts** | Hook | 5 | Estado, mapeamento STRIDE, envio RAG |
| **SystemInputForm.tsx** | Component | 8 | Renderização, submit, acessibilidade |

#### **Arquivos de Teste**
```
src/
└── __tests__/
    ├── setup.ts                      # Configuração global
    ├── services/
    │   └── geminiService.test.ts
    ├── hooks/
    │   └── useThreatModeler.test.ts
    └── components/
        └── SystemInputForm.test.tsx
```

---

### 2. **Testes de Integração** (Shell Script)

Testes E2E que validam o **sistema completo** (frontend + backend + Neo4j).

#### **Executar**
```bash
# Via npm
npm run test:integration

# Diretamente
chmod +x test-rag.sh
./test-rag.sh
```

#### **Cobertura**

✅ **1. Conectividade** (2 testes)
- Health check do backend
- Inicialização do sistema RAG

✅ **2. Estatísticas** (1 teste)
- Métricas do sistema

✅ **3. Busca Semântica** (6 testes)
- Spoofing attacks
- Tampering attacks  
- Information Disclosure
- Denial of Service
- Elevation of Privilege
- Repudiation

✅ **4. Mapeamento STRIDE-CAPEC** (1 teste)
- Carregamento dinâmico do mapeamento

✅ **5. Validação de Dados** (2 testes)
- Confiança da busca >= 70%
- Número de fontes >= 1

✅ **6. Upload de Documentos** (1 teste)
- Upload de texto (sistema)

**Total**: 13 testes

---

## 🎯 Exemplo de Teste Unitário

### **Teste de Serviço (Mock de API)**

```typescript
// src/__tests__/services/geminiService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { summarizeSystemDescription } from '../../services/geminiService';

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn()
    }
  }))
}));

describe('geminiService', () => {
  it('deve resumir descrição do sistema corretamente', async () => {
    const { GoogleGenAI } = await import('@google/genai');
    const mockGenAI = new GoogleGenAI({ apiKey: 'test-key' });
    
    const mockResponse = {
      text: JSON.stringify({
        generalDescription: 'Sistema de gestão farmacêutica',
        components: 'Frontend React, Backend Node.js'
      })
    };

    vi.spyOn(mockGenAI.models, 'generateContent')
      .mockResolvedValue(mockResponse);

    const result = await summarizeSystemDescription('Descrição completa...');

    expect(result.generalDescription).toBe('Sistema de gestão farmacêutica');
    expect(result.components).toBe('Frontend React, Backend Node.js');
  });
});
```

### **Teste de Componente React**

```typescript
// src/__tests__/components/SystemInputForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SystemInputForm from '../../components/SystemInputForm';

describe('SystemInputForm', () => {
  it('NÃO deve renderizar campo "Versão"', () => {
    render(<SystemInputForm onSubmit={vi.fn()} isLoading={false} />);

    expect(screen.queryByLabelText(/versão/i)).not.toBeInTheDocument();
  });

  it('deve chamar onSubmit com dados corretos', async () => {
    const mockOnSubmit = vi.fn();
    render(<SystemInputForm onSubmit={mockOnSubmit} isLoading={false} />);

    const textarea = screen.getByLabelText('Descrição Completa do Sistema');
    fireEvent.change(textarea, { target: { value: 'Teste' } });
    
    const form = screen.getByRole('button').closest('form')!;
    fireEvent.submit(form);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      fullDescription: 'Teste'
    });
  });
});
```

### **Teste de Hook React**

```typescript
// src/__tests__/hooks/useThreatModeler.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useThreatModeler } from '../../hooks/useThreatModeler';

global.fetch = vi.fn();

describe('useThreatModeler', () => {
  it('deve inicializar com estado padrão', () => {
    const { result } = renderHook(() => useThreatModeler());

    expect(result.current.systemInfo).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
```

---

## 🔍 Análise de Cobertura

### **Executar Cobertura**
```bash
npm run test:coverage
```

### **Visualizar Relatório HTML**
```bash
npm run test:coverage
open coverage/index.html
```

### **Métricas Esperadas**
- **Statements**: >= 80%
- **Branches**: >= 75%
- **Functions**: >= 80%
- **Lines**: >= 80%

---

## 📊 Estrutura de Testes

```
threat-modeling-co-pilot-with-ai-3/
├── vitest.config.ts              # Configuração Vitest
├── src/
│   └── __tests__/                # 🎯 Todos os testes centralizados aqui
│       ├── setup.ts              # Setup global (mocks, matchers)
│       ├── services/
│       │   └── *.test.ts
│       ├── hooks/
│       │   └── *.test.ts
│       └── components/
│           └── *.test.tsx
└── test-rag.sh                   # Testes de integração
```

---

## 🚀 Comandos Rápidos

```bash
# Desenvolvimento
npm run dev                       # Frontend
npm run dev:backend              # Backend
npm run dev:full                 # Tudo junto

# Testes
npm test                         # Testes unitários
npm run test:ui                  # UI interativa
npm run test:coverage            # Cobertura
npm run test:integration         # Integração E2E

# Build
npm run build                    # Frontend
npm run build:backend            # Backend
```

---

## ✅ Checklist de Testes

Ao adicionar nova funcionalidade:

- [ ] Criar teste unitário para a função/classe
- [ ] Criar teste para o componente React (se aplicável)
- [ ] Mockar dependências externas (API, banco de dados)
- [ ] Adicionar teste de integração (se necessário)
- [ ] Verificar cobertura >= 80%
- [ ] Atualizar documentação

---

## 🐛 Debugging de Testes

### **Ver logs detalhados**
```bash
npm test -- --reporter=verbose
```

### **Executar teste específico**
```bash
npm test -- geminiService.test.ts
```

### **Modo debug**
```bash
npm test -- --inspect-brk
```

### **Parar no primeiro erro**
```bash
npm test -- --bail
```

---

## 📚 Referências

- **Vitest**: https://vitest.dev/
- **React Testing Library**: https://testing-library.com/react
- **Testing Best Practices**: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library


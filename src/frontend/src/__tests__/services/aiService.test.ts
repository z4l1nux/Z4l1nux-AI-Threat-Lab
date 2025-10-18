import { describe, it, expect, vi, beforeEach } from 'vitest';
import { summarizeSystemDescription } from '../../services/aiService';

// Mock do fetch global
global.fetch = vi.fn();

// Mock do Google GenAI
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn()
    }
  }))
}));

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  describe('summarizeSystemDescription', () => {
    it('deve resumir descrição do sistema corretamente', async () => {
      // Mock do backend response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: JSON.stringify({
            generalDescription: 'Sistema de gestão farmacêutica',
            components: 'Frontend React, Backend Node.js, MySQL',
            sensitiveData: 'Dados de saúde, prescrições médicas',
            technologies: 'React, Node.js, MySQL, Redis',
            authentication: 'OAuth 2.0, JWT',
            userProfiles: 'Admin, Farmacêutico, Cliente',
            externalIntegrations: 'ANVISA, Operadoras de Saúde'
          })
        })
      });

      const fullDescription = `
        Sistema de gestão para farmácias com controle de estoque,
        vendas, prescrições digitais e integração com ANVISA.
      `;

      const result = await summarizeSystemDescription(fullDescription);

      expect(result).toBeDefined();
      expect(result.generalDescription).toBe('Sistema de gestão farmacêutica');
      expect(result.components).toBe('Frontend React, Backend Node.js, MySQL');
      expect(result.technologies).toBe('React, Node.js, MySQL, Redis');
    });

    it('deve retornar valores padrão quando campos estão vazios', async () => {
      // Mock do backend response com campos vazios
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: JSON.stringify({
            generalDescription: '',
            components: ''
          })
        })
      });

      const result = await summarizeSystemDescription('Descrição simples');

      expect(result.generalDescription).toBe('Não informado');
      expect(result.components).toBe('Não informado');
    });

    it('deve lançar erro quando descrição está vazia', async () => {
      await expect(
        summarizeSystemDescription('')
      ).rejects.toThrow('Descrição do sistema não informada');
    });

    it('deve lançar erro quando API key não está configurada', async () => {
      vi.doUnmock('@google/genai');
      
      // Simular ausência de API key
      const originalEnv = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      delete process.env.API_KEY;

      await expect(
        summarizeSystemDescription('Teste')
      ).rejects.toThrow();

      // Restaurar
      process.env.GEMINI_API_KEY = originalEnv;
    });
  });
});


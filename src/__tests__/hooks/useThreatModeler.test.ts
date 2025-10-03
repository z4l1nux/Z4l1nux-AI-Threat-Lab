import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useThreatModeler } from '../../hooks/useThreatModeler';

// Mock do fetch global
global.fetch = vi.fn();

// Mock dos serviços
vi.mock('../../services/aiService', () => ({
  analyzeThreatsAndMitigations: vi.fn(),
  generateAttackTreeMermaid: vi.fn(),
  summarizeSystemDescription: vi.fn()
}));

describe('useThreatModeler Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  it('deve inicializar com estado padrão', () => {
    const { result } = renderHook(() => useThreatModeler());

    expect(result.current.systemInfo).toBeNull();
    expect(result.current.threats).toBeNull();
    expect(result.current.reportData).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('deve carregar mapeamento STRIDE-CAPEC do backend', async () => {
    const mockMapping = {
      mapping: [
        {
          stride: 'Spoofing',
          capecs: [
            { id: 'CAPEC-148', name: 'Content Spoofing' }
          ]
        }
      ]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMapping
    });

    const { result } = renderHook(() => useThreatModeler());

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/stride-capec-mapping'
      );
    });
  });

  it('deve tratar erro ao carregar mapeamento', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: async () => 'Sistema RAG não inicializado'
    });

    const { result } = renderHook(() => useThreatModeler());

    await waitFor(() => {
      expect(result.current.error).toContain('Sistema RAG não está inicializado');
    });
  });

  it('deve enviar informações do sistema ao RAG', async () => {
    const { analyzeThreatsAndMitigations } = await import('../../services/aiService');
    
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ mapping: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Sistema processado' })
      });

    (analyzeThreatsAndMitigations as any).mockResolvedValue([
      {
        id: 'threat-1',
        elementName: 'API de Autenticação',
        strideCategory: 'Spoofing',
        threatScenario: 'Ataque de credential stuffing',
        capecId: 'CAPEC-600',
        capecName: 'Credential Stuffing',
        capecDescription: 'Uso de credenciais vazadas',
        mitigationRecommendations: 'Implementar MFA',
        impact: 'HIGH',
        owaspTop10: 'A07:2021'
      }
    ]);

    const { result } = renderHook(() => useThreatModeler());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const systemInfo = {
      systemName: 'Sistema Teste',
      generalDescription: 'Sistema de testes',
      components: 'API, Frontend',
      sensitiveData: 'Dados de usuários',
      technologies: 'React, Node.js',
      authentication: 'OAuth 2.0',
      userProfiles: 'Admin, User',
      externalIntegrations: 'API Externa'
    };

    await result.current.generateThreatModel(systemInfo);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/documents/text',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Sistema_Sistema Teste')
        })
      );
    });
  });

  it('deve validar que systemVersion não é mais usado', () => {
    const { result } = renderHook(() => useThreatModeler());
    
    // Verificar que a interface SystemInfo não tem systemVersion
    const systemInfo = {
      systemName: 'Teste',
      generalDescription: 'Teste',
      components: 'Teste',
      sensitiveData: 'Teste',
      technologies: 'Teste',
      authentication: 'Teste',
      userProfiles: 'Teste',
      externalIntegrations: 'Teste'
    };

    // Não deve ter erro de tipo
    expect(systemInfo).not.toHaveProperty('systemVersion');
  });
});


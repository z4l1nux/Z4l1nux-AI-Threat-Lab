import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SystemInputForm from '../../components/SystemInputForm';

describe('SystemInputForm Component', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o formulário corretamente', () => {
    render(
      <SystemInputForm
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    expect(screen.getByText('Informações do Sistema')).toBeInTheDocument();
    expect(screen.getByLabelText('Descrição Completa do Sistema')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /gerar modelo de ameaças/i })).toBeInTheDocument();
  });

  it('NÃO deve renderizar campo "Versão"', () => {
    render(
      <SystemInputForm
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    // Verificar que NÃO existe campo de versão
    expect(screen.queryByLabelText(/versão/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/versão/i)).not.toBeInTheDocument();
  });

  it('deve preencher o textarea com valor inicial', () => {
    const initialDescription = 'Sistema de teste com componentes web';

    render(
      <SystemInputForm
        initialInfo={{ fullDescription: initialDescription }}
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const textarea = screen.getByLabelText('Descrição Completa do Sistema') as HTMLTextAreaElement;
    expect(textarea.value).toBe(initialDescription);
  });

  it('deve chamar onSubmit com dados corretos ao submeter', async () => {
    const user = userEvent.setup();

    render(
      <SystemInputForm
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const textarea = screen.getByLabelText('Descrição Completa do Sistema');
    const submitButton = screen.getByRole('button', { name: /gerar modelo de ameaças/i });

    await user.clear(textarea);
    await user.type(textarea, 'Descrição do sistema de testes');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith({
        fullDescription: 'Descrição do sistema de testes'
      });
    });
  });

  it('deve desabilitar campos quando isLoading=true', () => {
    render(
      <SystemInputForm
        onSubmit={mockOnSubmit}
        isLoading={true}
      />
    );

    const textarea = screen.getByLabelText('Descrição Completa do Sistema');
    const submitButton = screen.getByRole('button');

    expect(textarea).toBeDisabled();
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Analisando Sistema...');
  });

  it('deve mostrar texto correto no botão quando não está carregando', () => {
    render(
      <SystemInputForm
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const submitButton = screen.getByRole('button');
    expect(submitButton).toHaveTextContent('Gerar Modelo de Ameaças');
  });

  it('deve permitir enviar formulário com Enter', async () => {
    render(
      <SystemInputForm
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const form = screen.getByRole('button').closest('form')!;
    const textarea = screen.getByLabelText('Descrição Completa do Sistema');

    await userEvent.type(textarea, 'Teste');
    
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        fullDescription: 'Teste'
      });
    });
  });

  it('deve manter o foco acessível com labels corretos', () => {
    render(
      <SystemInputForm
        onSubmit={mockOnSubmit}
        isLoading={false}
      />
    );

    const textarea = screen.getByLabelText('Descrição Completa do Sistema');
    expect(textarea).toHaveAttribute('aria-label', 'Descrição Completa do Sistema');
  });
});


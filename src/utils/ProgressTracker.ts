import { EstatisticasProcessamento, ConfiguracaoVerbosidade } from '../core/types';

export class ProgressTracker {
  private estatisticas: EstatisticasProcessamento;
  private configuracao: ConfiguracaoVerbosidade;
  private ultimaAtualizacao: number = 0;

  constructor(configuracao: Partial<ConfiguracaoVerbosidade> = {}) {
    this.configuracao = {
      mostrarProgresso: true,
      mostrarTokens: true,
      mostrarTempoEstimado: true,
      mostrarDetalhesChunks: true,
      mostrarRespostasAPI: false,
      intervaloAtualizacao: 1000, // 1 segundo
      ...configuracao
    };

    this.estatisticas = {
      totalDocumentos: 0,
      documentosProcessados: 0,
      totalChunks: 0,
      chunksProcessados: 0,
      tokensConsumidos: 0,
      tempoInicio: new Date(),
      tempoAtual: new Date(),
      taxaProcessamento: 0
    };
  }

  /**
   * Inicializa o rastreador com o total de documentos
   */
  inicializar(totalDocumentos: number): void {
    this.estatisticas = {
      totalDocumentos,
      documentosProcessados: 0,
      totalChunks: 0,
      chunksProcessados: 0,
      tokensConsumidos: 0,
      tempoInicio: new Date(),
      tempoAtual: new Date(),
      taxaProcessamento: 0
    };

    if (this.configuracao.mostrarProgresso) {
      console.log(`🚀 Iniciando processamento de ${totalDocumentos} documentos...`);
      console.log(`⏰ Início: ${this.estatisticas.tempoInicio.toLocaleTimeString('pt-BR')}`);
      console.log('');
    }
  }

  /**
   * Atualiza o progresso do processamento
   */
  atualizarProgresso(
    documentoProcessado: boolean = false,
    chunksAdicionados: number = 0,
    tokensConsumidos: number = 0,
    respostaAPI?: any
  ): void {
    this.estatisticas.tempoAtual = new Date();

    if (documentoProcessado) {
      this.estatisticas.documentosProcessados++;
    }

    if (chunksAdicionados > 0) {
      this.estatisticas.chunksProcessados += chunksAdicionados;
    }

    if (tokensConsumidos > 0) {
      this.estatisticas.tokensConsumidos += tokensConsumidos;
    }

    // Calcular taxa de processamento
    const tempoDecorrido = (this.estatisticas.tempoAtual.getTime() - this.estatisticas.tempoInicio.getTime()) / 1000;
    if (tempoDecorrido > 0) {
      this.estatisticas.taxaProcessamento = this.estatisticas.chunksProcessados / tempoDecorrido;
    }

    // Calcular tempo estimado restante
    if (this.estatisticas.taxaProcessamento > 0) {
      const chunksRestantes = this.estatisticas.totalChunks - this.estatisticas.chunksProcessados;
      this.estatisticas.tempoEstimadoRestante = chunksRestantes / this.estatisticas.taxaProcessamento;
    }

    // Verificar se deve atualizar a exibição
    const agora = Date.now();
    if (agora - this.ultimaAtualizacao >= this.configuracao.intervaloAtualizacao) {
      this.exibirProgresso();
      this.ultimaAtualizacao = agora;
    }

    // Mostrar resposta da API se configurado
    if (this.configuracao.mostrarRespostasAPI && respostaAPI) {
      this.exibirRespostaAPI(respostaAPI);
    }
  }

  /**
   * Atualiza o total de chunks estimado
   */
  atualizarTotalChunks(totalChunks: number): void {
    this.estatisticas.totalChunks = totalChunks;
  }

  /**
   * Exibe o progresso atual
   */
  private exibirProgresso(): void {
    if (!this.configuracao.mostrarProgresso) return;

    const progressoDocumentos = ((this.estatisticas.documentosProcessados / this.estatisticas.totalDocumentos) * 100).toFixed(1);
    const progressoChunks = this.estatisticas.totalChunks > 0 
      ? ((this.estatisticas.chunksProcessados / this.estatisticas.totalChunks) * 100).toFixed(1)
      : '0.0';

    console.log(`📊 Progresso: ${this.estatisticas.documentosProcessados}/${this.estatisticas.totalDocumentos} documentos (${progressoDocumentos}%)`);
    console.log(`📄 Chunks: ${this.estatisticas.chunksProcessados}/${this.estatisticas.totalChunks} (${progressoChunks}%)`);
    
    if (this.configuracao.mostrarTokens) {
      console.log(`🎯 Tokens consumidos: ${this.estatisticas.tokensConsumidos.toLocaleString()}`);
    }

    if (this.configuracao.mostrarTempoEstimado && this.estatisticas.tempoEstimadoRestante) {
      const tempoRestante = this.formatarTempo(this.estatisticas.tempoEstimadoRestante);
      console.log(`⏱️ Tempo estimado restante: ${tempoRestante}`);
    }

    if (this.configuracao.mostrarDetalhesChunks) {
      console.log(`⚡ Taxa: ${this.estatisticas.taxaProcessamento.toFixed(2)} chunks/seg`);
    }

    console.log(`🕒 Tempo decorrido: ${this.formatarTempoDecorrido()}`);
    console.log('─'.repeat(60));
  }

  /**
   * Exibe resposta da API
   */
  private exibirRespostaAPI(resposta: any): void {
    console.log(`🔍 Resposta API:`, {
      status: resposta?.status || 'N/A',
      tokens: resposta?.usage?.totalTokens || 'N/A',
      model: resposta?.model || 'N/A'
    });
  }

  /**
   * Formata tempo em segundos para formato legível
   */
  private formatarTempo(segundos: number): string {
    if (segundos < 60) {
      return `${Math.round(segundos)}s`;
    } else if (segundos < 3600) {
      const minutos = Math.floor(segundos / 60);
      const segs = Math.round(segundos % 60);
      return `${minutos}m ${segs}s`;
    } else {
      const horas = Math.floor(segundos / 3600);
      const minutos = Math.floor((segundos % 3600) / 60);
      return `${horas}h ${minutos}m`;
    }
  }

  /**
   * Formata tempo decorrido desde o início
   */
  private formatarTempoDecorrido(): string {
    const tempoDecorrido = (this.estatisticas.tempoAtual.getTime() - this.estatisticas.tempoInicio.getTime()) / 1000;
    return this.formatarTempo(tempoDecorrido);
  }

  /**
   * Finaliza o processamento e exibe resumo
   */
  finalizar(): EstatisticasProcessamento {
    this.estatisticas.tempoAtual = new Date();
    
    if (this.configuracao.mostrarProgresso) {
      console.log('\n🎉 Processamento concluído!');
      console.log('📊 Resumo final:');
      console.log(`   📄 Documentos processados: ${this.estatisticas.documentosProcessados}/${this.estatisticas.totalDocumentos}`);
      console.log(`   📄 Chunks processados: ${this.estatisticas.chunksProcessados}`);
      console.log(`   🎯 Tokens consumidos: ${this.estatisticas.tokensConsumidos.toLocaleString()}`);
      console.log(`   ⏱️ Tempo total: ${this.formatarTempoDecorrido()}`);
      console.log(`   ⚡ Taxa média: ${this.estatisticas.taxaProcessamento.toFixed(2)} chunks/seg`);
    }

    return { ...this.estatisticas };
  }

  /**
   * Obtém estatísticas atuais
   */
  obterEstatisticas(): EstatisticasProcessamento {
    return { ...this.estatisticas };
  }
} 
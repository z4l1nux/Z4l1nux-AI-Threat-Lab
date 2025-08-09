import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export class FileUtils {
  /**
   * Sanitiza o nome de um arquivo para evitar path traversal
   */
  private static sanitizarNomeArquivo(nomeArquivo: string): string {
    // Remove caracteres perigosos e normaliza o caminho
    return path.basename(nomeArquivo.replace(/[<>:"|?*\x00-\x1f]/g, ''));
  }



  /**
   * Calcula o hash MD5 de um arquivo
   */
  static async calcularHashArquivo(caminhoArquivo: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = fs.createReadStream(caminhoArquivo);
      
      stream.on('data', (data) => {
        hash.update(data);
      });
      
      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });
      
      stream.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Obtém informações detalhadas de um arquivo
   */
  static async obterInfoArquivo(caminhoArquivo: string): Promise<{
    nomeArquivo: string;
    caminhoCompleto: string;
    hashArquivo: string;
    tamanhoArquivo: number;
    dataModificacao: Date;
  }> {
    const stats = fs.statSync(caminhoArquivo);
    const hash = await this.calcularHashArquivo(caminhoArquivo);
    
    return {
      nomeArquivo: path.basename(caminhoArquivo),
      caminhoCompleto: caminhoArquivo,
      hashArquivo: hash,
      tamanhoArquivo: stats.size,
      dataModificacao: stats.mtime
    };
  }

  /**
   * Lista todos os arquivos PDF em uma pasta
   */
  // eslint-disable-next-line security/detect-unsafe-regex
  static listarPDFs(pasta: string): string[] {
    // Validação de segurança para path traversal
    if (pasta.includes('..') || pasta.includes('//')) {
      throw new Error('Caminho inválido detectado');
    }
    
    // Sanitização do caminho da pasta
    const pastaLimpa = pasta.replace(/[<>:"|?*\x00-\x1f]/g, '');
    const pastaSanitizada = path.resolve(pastaLimpa);
    if (!fs.existsSync(pastaSanitizada)) {
      return [];
    }
    
    return fs.readdirSync(pastaSanitizada)
      .filter(arquivo => arquivo.toLowerCase().endsWith('.pdf'))
      .map(arquivo => {
        const arquivoSanitizado = this.sanitizarNomeArquivo(arquivo);
        return path.join(pastaSanitizada, arquivoSanitizado);
      });
  }

  /**
   * Lista todos os arquivos XML em uma pasta
   */
  // eslint-disable-next-line security/detect-unsafe-regex
  static listarXMLs(pasta: string): string[] {
    // Validação de segurança para path traversal
    if (pasta.includes('..') || pasta.includes('//')) {
      throw new Error('Caminho inválido detectado');
    }
    
    // Sanitização do caminho da pasta
    const pastaLimpa = pasta.replace(/[<>:"|?*\x00-\x1f]/g, '');
    const pastaSanitizada = path.resolve(pastaLimpa);
    if (!fs.existsSync(pastaSanitizada)) {
      return [];
    }
    
    return fs.readdirSync(pastaSanitizada)
      .filter(arquivo => arquivo.toLowerCase().endsWith('.xml'))
      .map(arquivo => {
        const arquivoSanitizado = this.sanitizarNomeArquivo(arquivo);
        return path.join(pastaSanitizada, arquivoSanitizado);
      });
  }

  /**
   * Lista todos os arquivos JSON em uma pasta
   */
  // eslint-disable-next-line security/detect-unsafe-regex
  static listarJSONs(pasta: string): string[] {
    // Validação de segurança para path traversal
    if (pasta.includes('..') || pasta.includes('//')) {
      throw new Error('Caminho inválido detectado');
    }
    
    // Sanitização do caminho da pasta
    const pastaLimpa = pasta.replace(/[<>:"|?*\x00-\x1f]/g, '');
    const pastaSanitizada = path.resolve(pastaLimpa);
    if (!fs.existsSync(pastaSanitizada)) {
      return [];
    }
    
    return fs.readdirSync(pastaSanitizada)
      .filter(arquivo => arquivo.toLowerCase().endsWith('.json'))
      .map(arquivo => {
        const arquivoSanitizado = this.sanitizarNomeArquivo(arquivo);
        return path.join(pastaSanitizada, arquivoSanitizado);
      });
  }

  /**
   * Lista todos os arquivos CSV em uma pasta
   */
  // eslint-disable-next-line security/detect-unsafe-regex
  static listarCSVs(pasta: string): string[] {
    // Validação de segurança para path traversal
    if (pasta.includes('..') || pasta.includes('//')) {
      throw new Error('Caminho inválido detectado');
    }
    
    // Sanitização do caminho da pasta
    const pastaLimpa = pasta.replace(/[<>:"|?*\x00-\x1f]/g, '');
    const pastaSanitizada = path.resolve(pastaLimpa);
    if (!fs.existsSync(pastaSanitizada)) {
      return [];
    }
    
    return fs.readdirSync(pastaSanitizada)
      .filter(arquivo => arquivo.toLowerCase().endsWith('.csv'))
      .map(arquivo => {
        const arquivoSanitizado = this.sanitizarNomeArquivo(arquivo);
        return path.join(pastaSanitizada, arquivoSanitizado);
      });
  }

  /**
   * Lista todos os arquivos suportados (PDF, XML, JSON, CSV) em uma pasta
   */
  // eslint-disable-next-line security/detect-unsafe-regex
  static listarArquivosSuportados(pasta: string): string[] {
    // Validação de segurança para path traversal
    if (pasta.includes('..') || pasta.includes('//')) {
      throw new Error('Caminho inválido detectado');
    }
    
    // Sanitização do caminho da pasta
    const pastaLimpa = pasta.replace(/[<>:"|?*\x00-\x1f]/g, '');
    const pastaSanitizada = path.resolve(pastaLimpa);
    if (!fs.existsSync(pastaSanitizada)) {
      return [];
    }
    
    return fs.readdirSync(pastaSanitizada)
      .filter(arquivo => {
        const extensao = arquivo.toLowerCase();
        return extensao.endsWith('.pdf') || 
               extensao.endsWith('.xml') || 
               extensao.endsWith('.json') || 
               extensao.endsWith('.csv') ||
               extensao.endsWith('.md') ||
               extensao.endsWith('.markdown');
      })
      .map(arquivo => {
        const arquivoSanitizado = this.sanitizarNomeArquivo(arquivo);
        return path.join(pastaSanitizada, arquivoSanitizado);
      });
  }

  /**
   * Verifica se um arquivo foi modificado comparando hash e data
   */
  static async arquivoModificado(
    caminhoArquivo: string, 
    hashAnterior: string, 
    dataModificacaoAnterior: Date
  ): Promise<boolean> {
    try {
      const infoAtual = await this.obterInfoArquivo(caminhoArquivo);
      
      return infoAtual.hashArquivo !== hashAnterior || 
             infoAtual.dataModificacao.getTime() !== dataModificacaoAnterior.getTime();
    } catch (error) {
      console.error(`Erro ao verificar modificação do arquivo ${caminhoArquivo}:`, error);
      return true; // Assume que foi modificado em caso de erro
    }
  }

  /**
   * Cria um ID único para um chunk baseado no arquivo e posição
   */
  static gerarChunkId(nomeArquivo: string, indiceChunk: number): string {
    const extensao = path.extname(nomeArquivo);
    const base = path.basename(nomeArquivo, extensao);
    return `${base}_chunk_${indiceChunk}`;
  }

  /**
   * Salva dados em formato JSON com formatação legível
   */
  static salvarJSON(caminhoArquivo: string, dados: any): void {
    fs.writeFileSync(caminhoArquivo, JSON.stringify(dados, null, 2));
  }

  /**
   * Carrega dados de um arquivo JSON
   */
  static carregarJSON<T>(caminhoArquivo: string): T | null {
    try {
      if (!fs.existsSync(caminhoArquivo)) {
        return null;
      }
      
      const conteudo = fs.readFileSync(caminhoArquivo, 'utf8');
      const dados = JSON.parse(conteudo);
      
      // Converter strings de data de volta para objetos Date
      if (dados.dataCriacao) {
        dados.dataCriacao = new Date(dados.dataCriacao);
      }
      if (dados.dataUltimaAtualizacao) {
        dados.dataUltimaAtualizacao = new Date(dados.dataUltimaAtualizacao);
      }
      
      if (dados.documentos) {
        dados.documentos.forEach((doc: any) => {
          if (doc.dataModificacao) {
            doc.dataModificacao = new Date(doc.dataModificacao);
          }
          if (doc.dataProcessamento) {
            doc.dataProcessamento = new Date(doc.dataProcessamento);
          }
        });
      }
      
      return dados;
    } catch (error) {
      console.error(`Erro ao carregar JSON de ${caminhoArquivo}:`, error);
      return null;
    }
  }

  /**
   * Verifica se um arquivo existe
   */
  static arquivoExiste(caminhoArquivo: string): boolean {
    return fs.existsSync(caminhoArquivo);
  }

  /**
   * Remove um arquivo se existir
   */
  static removerArquivo(caminhoArquivo: string): boolean {
    try {
      if (fs.existsSync(caminhoArquivo)) {
        fs.unlinkSync(caminhoArquivo);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Erro ao remover arquivo ${caminhoArquivo}:`, error);
      return false;
    }
  }
} 
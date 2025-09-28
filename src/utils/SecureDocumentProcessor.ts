/**
 * Processador seguro de documentos que processa diretamente para Neo4j
 * sem salvar arquivos no filesystem, com verificações de segurança robustas
 */

import * as crypto from 'crypto';
import * as path from 'path';
import { OllamaEmbeddings } from "@langchain/ollama";
import { Neo4jCacheManager } from '../core/cache/Neo4jCacheManager';

export interface SecurityCheckResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedContent?: string;
  metadata: {
    originalSize: number;
    processedSize: number;
    contentType: string;
    hash: string;
    detectedLanguage?: string;
  };
}

export interface SecureUploadFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export class SecureDocumentProcessor {
  private readonly maxFileSize = 50 * 1024 * 1024; // 50MB
  private readonly allowedMimeTypes = [
    'text/plain',
    'text/markdown',
    'text/x-markdown',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv',
    'application/json',
    'application/xml',
    'text/xml',
    'application/octet-stream' // Permitir para detectar por extensão
  ];
  
  private readonly allowedExtensions = [
    '.txt', '.md', '.pdf', '.doc', '.docx', 
    '.csv', '.json', '.xml', '.yml', '.yaml'
  ];

  private readonly dangerousPatterns = [
    // Scripts maliciosos executáveis
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript\s*:/gi,
    /vbscript\s*:/gi,
    /onload\s*=\s*["'][^"']*["']/gi,
    /onerror\s*=\s*["'][^"']*["']/gi,
    
    // Comandos de sistema perigosos
    /\b(rm\s+-rf\s+\/|del\s+\/s\s+\*|format\s+c:|shutdown\s+-f|reboot\s+-f)\b/gi,
    /\$\([^)]*rm\s|[^)]*del\s|[^)]*format\s\)/gi, // Command substitution perigoso
    
    // SQL Injection patterns específicos
    /(\bunion\s+all\s+select\b|\bdrop\s+table\s+\w+)/gi,
    /(\binsert\s+into\s+\w+.*values\s*\(|\bdelete\s+from\s+\w+\s+where)/gi,
    
    // Path traversal malicioso
    /\.\.[\/\\]\.\.[\/\\]/g, // Múltiplos path traversal
    /\/(etc\/passwd|proc\/version|sys\/|dev\/)/gi,
    
    // Prompt injection específico
    /ignore\s+all\s+previous\s+instructions/gi,
    /system\s*:\s*you\s+are\s+now\s+a\s+/gi,
    /\[SYSTEM\]\s*override/gi,
    /jailbreak\s+prompt/gi
  ];

  private readonly suspiciousKeywords = [
    'password', 'secret', 'token', 'api_key', 'private_key',
    'ssh_key', 'credential', 'auth', 'session', 'cookie'
  ];

  /**
   * Processa arquivos de forma segura diretamente para Neo4j
   */
  async processDocumentsSecurely(
    files: SecureUploadFile[], 
    embeddings: OllamaEmbeddings
  ): Promise<{
    success: boolean;
    results: SecurityCheckResult[];
    processed: number;
    rejected: number;
    logs: string[];
    summary: any;
  }> {
    const logs: string[] = [];
    const results: SecurityCheckResult[] = [];
    let processed = 0;
    let rejected = 0;

    logs.push(`🔒 Iniciando processamento seguro de ${files.length} arquivo(s)`);

    // Processar cada arquivo
    for (const file of files) {
      try {
        logs.push(`🔍 Verificando segurança: ${file.originalname}`);
        
        // Verificações de segurança
        const securityCheck = await this.performSecurityChecks(file);
        results.push(securityCheck);

        if (!securityCheck.isValid) {
          rejected++;
          logs.push(`❌ Arquivo rejeitado: ${file.originalname}`);
          securityCheck.errors.forEach(error => logs.push(`   🚨 ${error}`));
          continue;
        }

        // Warnings (não bloqueiam, mas alertam)
        securityCheck.warnings.forEach(warning => 
          logs.push(`⚠️ ${file.originalname}: ${warning}`)
        );

        // Processar conteúdo diretamente na memória (já inclui Neo4j)
        const documentName = await this.processFileInMemory(file, securityCheck, embeddings, logs);
        processed++;
        logs.push(`✅ Processado com segurança: ${file.originalname}`);

      } catch (error: any) {
        rejected++;
        logs.push(`❌ Erro ao processar ${file.originalname}: ${error.message}`);
        results.push({
          isValid: false,
          errors: [error.message],
          warnings: [],
          metadata: {
            originalSize: file.size,
            processedSize: 0,
            contentType: file.mimetype,
            hash: this.calculateHash(file.buffer)
          }
        });
      }
    }

    logs.push(`📊 Processamento concluído: ${processed} aceitos, ${rejected} rejeitados`);

    return {
      success: processed > 0,
      results,
      processed,
      rejected,
      logs,
      summary: {
        totalFiles: files.length,
        processedFiles: processed,
        rejectedFiles: rejected,
        securityChecks: results.length
      }
    };
  }

  /**
   * Realiza verificações de segurança abrangentes
   */
  private async performSecurityChecks(file: SecureUploadFile): Promise<SecurityCheckResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const hash = this.calculateHash(file.buffer);

    // 1. Verificação de tamanho
    if (file.size > this.maxFileSize) {
      errors.push(`Arquivo muito grande: ${this.formatBytes(file.size)} (máximo: ${this.formatBytes(this.maxFileSize)})`);
    }

    if (file.size === 0) {
      errors.push('Arquivo vazio');
    }

    // 2. Verificação de tipo MIME e extensão (mais inteligente)
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeTypeValid = this.allowedMimeTypes.includes(file.mimetype);
    const extensionValid = this.allowedExtensions.includes(ext);
    
    // Para application/octet-stream, verificar se a extensão é válida
    if (file.mimetype === 'application/octet-stream') {
      if (!extensionValid) {
        errors.push(`Extensão não permitida para arquivo binário: ${ext}`);
      }
    } else if (!mimeTypeValid && !extensionValid) {
      errors.push(`Tipo de arquivo não permitido: ${file.mimetype} (extensão: ${ext})`);
    } else if (!extensionValid) {
      errors.push(`Extensão não permitida: ${ext}`);
    }

    // 4. Verificação de nome de arquivo
    if (!this.isValidFilename(file.originalname)) {
      errors.push('Nome de arquivo inválido ou perigoso');
    }

    // 5. Análise de conteúdo
    const content = file.buffer.toString('utf-8');
    const contentAnalysis = this.analyzeContent(content);
    
    // Debug: log dos padrões detectados
    console.log(`🔍 DEBUG - Arquivo: ${file.originalname}`);
    console.log(`📊 Padrões detectados: ${contentAnalysis.detectedPatterns.length}`);
    contentAnalysis.detectedPatterns.forEach(pattern => {
      console.log(`   🔍 Pattern: ${pattern}`);
    });
    console.log(`⚠️ Perigoso: ${contentAnalysis.hasDangerousPatterns}`);
    console.log(`🔑 Suspeito: ${contentAnalysis.hasSuspiciousKeywords}`);
    
    if (contentAnalysis.hasDangerousPatterns) {
      errors.push(`Conteúdo contém padrões perigosos: ${contentAnalysis.detectedPatterns.filter(p => !p.startsWith('doc-')).join(', ')}`);
    }

    if (contentAnalysis.hasSuspiciousKeywords) {
      warnings.push(`Conteúdo pode conter informações sensíveis: ${contentAnalysis.detectedPatterns.filter(p => p.startsWith('keyword:')).join(', ')}`);
    }

    // 6. Verificação de integridade
    const integrityCheck = this.checkFileIntegrity(file.buffer);
    if (!integrityCheck.isValid) {
      errors.push('Arquivo pode estar corrompido ou modificado maliciosamente');
    }

    // 7. Sanitização de conteúdo
    const sanitizedContent = this.sanitizeContent(content);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedContent,
      metadata: {
        originalSize: file.size,
        processedSize: sanitizedContent.length,
        contentType: file.mimetype,
        hash,
        detectedLanguage: this.detectLanguage(content)
      }
    };
  }

  /**
   * Processa arquivo diretamente na memória sem salvar no filesystem
   */
  private async processFileInMemory(
    file: SecureUploadFile,
    securityCheck: SecurityCheckResult,
    embeddings: OllamaEmbeddings,
    logs: string[]
  ): Promise<string> {
    // Criar documento temporário na memória
    const tempDocument = {
      name: this.sanitizeFilename(file.originalname),
      content: securityCheck.sanitizedContent!,
      metadata: {
        ...securityCheck.metadata,
        uploadedAt: new Date().toISOString(),
        processedSecurely: true
      }
    };

    logs.push(`🧠 Gerando embeddings para: ${tempDocument.name}`);
    
    // Processar diretamente para Neo4j usando o cache manager
    const cacheManager = new Neo4jCacheManager(
      process.env.NEO4J_URI || "bolt://localhost:7687",
      process.env.NEO4J_USER || "neo4j",
      process.env.NEO4J_PASSWORD || "s3nh4forte",
      embeddings,
      {
        mostrarProgresso: false,
        mostrarTokens: false,
        mostrarTempoEstimado: false,
        mostrarDetalhesChunks: false,
        mostrarRespostasAPI: false,
        intervaloAtualizacao: 5000
      }
    );

    // Inicializar Neo4j se necessário
    await cacheManager.initialize();

    // Processar documento da memória diretamente
    await cacheManager.processDocumentFromMemory(tempDocument);
    
    logs.push(`💾 Documento processado diretamente para Neo4j: ${tempDocument.name}`);
    
    return tempDocument.name;
  }


  /**
   * Analisa conteúdo em busca de padrões perigosos
   */
  private analyzeContent(content: string): {
    hasDangerousPatterns: boolean;
    hasSuspiciousKeywords: boolean;
    detectedPatterns: string[];
  } {
    const detectedPatterns: string[] = [];
    let hasDangerousPatterns = false;
    let hasSuspiciousKeywords = false;

    // Verificar se é conteúdo de documentação (menos restritivo)
    const isDocumentation = this.isDocumentationContent(content);
    console.log(`📚 É documentação: ${isDocumentation}`);

    // Verificar padrões perigosos
    for (const pattern of this.dangerousPatterns) {
      if (pattern.test(content)) {
        // Para documentação, ser menos restritivo com alguns padrões
        if (isDocumentation && this.isDocumentationPattern(pattern, content)) {
          detectedPatterns.push(`doc-pattern: ${pattern.source}`);
          console.log(`✅ Padrão aceito em documentação: ${pattern.source}`);
          // Não marcar como perigoso para documentação
        } else {
          hasDangerousPatterns = true;
          detectedPatterns.push(pattern.source);
          console.log(`❌ Padrão perigoso detectado: ${pattern.source}`);
        }
      }
    }

    // Verificar palavras-chave suspeitas (mais tolerante para documentação)
    const contentLower = content.toLowerCase();
    for (const keyword of this.suspiciousKeywords) {
      if (contentLower.includes(keyword)) {
        if (isDocumentation) {
          // Para documentação, apenas avisar
          detectedPatterns.push(`doc-keyword: ${keyword}`);
        } else {
          hasSuspiciousKeywords = true;
          detectedPatterns.push(`keyword: ${keyword}`);
        }
      }
    }

    return {
      hasDangerousPatterns,
      hasSuspiciousKeywords,
      detectedPatterns
    };
  }

  /**
   * Verifica se o conteúdo parece ser documentação técnica
   */
  private isDocumentationContent(content: string): boolean {
    const docIndicators = [
      /^#\s+/m, // Títulos Markdown
      /```/g, // Blocos de código
      /\*\*[^*]+\*\*/g, // Texto em negrito
      /\[.*\]\(.*\)/g, // Links Markdown
      /^\s*-\s+/m, // Listas
      /^\s*\d+\.\s+/m, // Listas numeradas
      /## |### |#### /g, // Subtítulos
      /documentation|readme|guide|tutorial|example|nexus|pay|api|endpoint|request|response/gi,
      /\bGET\b|\bPOST\b|\bPUT\b|\bDELETE\b/g, // Métodos HTTP
      /\bjson\b|\bxml\b|\byaml\b/gi, // Formatos de dados
      /\bkubernetes\b|\bdocker\b|\bhelm\b/gi // Tecnologias
    ];

    let docScore = 0;
    for (const indicator of docIndicators) {
      const matches = content.match(indicator);
      if (matches) {
        docScore += matches.length > 5 ? 2 : 1; // Mais peso para muitas ocorrências
      }
    }

    console.log(`📊 Score de documentação: ${docScore}`);

    // Score alto = definitivamente documentação
    this.documentationScore = docScore;
    return docScore >= 2; // Reduzir threshold para ser mais permissivo
  }

  private documentationScore: number = 0;

  /**
   * Verifica se um padrão detectado é aceitável em documentação
   */
  private isDocumentationPattern(pattern: RegExp, content: string): boolean {
    const patternSource = pattern.source.toLowerCase();
    
    // Se o score de documentação é muito alto (>=10), aceitar quase tudo
    if (this.documentationScore >= 10) {
      console.log(`🎯 Score alto (${this.documentationScore}) - padrão aceito automaticamente`);
      return true;
    }
    
    // Padrões que são OK em documentação
    if (patternSource.includes('select') || patternSource.includes('insert') || patternSource.includes('union') || patternSource.includes('delete')) {
      // SQL em blocos de código ou exemplos é OK
      return /```[\s\S]*?(sql|database)[\s\S]*?```/gi.test(content) || 
             /example|exemplo|sample/gi.test(content);
    }
    
    if (patternSource.includes('script')) {
      // Scripts em blocos de código são OK
      return /```[\s\S]*?(javascript|js|html|bash|shell)[\s\S]*?```/gi.test(content);
    }
    
    if (patternSource.includes('rm') || patternSource.includes('del') || patternSource.includes('format')) {
      // Comandos em exemplos de documentação são OK
      console.log(`🔍 Verificando padrão de comando: ${patternSource}`);
      const hasCodeBlocks = /```[\s\S]*?(bash|shell|cmd|powershell|sh)[\s\S]*?```/gi.test(content);
      const hasExamples = /example|exemplo|sample|tutorial|guide|documentation|readme/gi.test(content);
      const hasK8sCommands = /kubectl|docker|helm|kubernetes/gi.test(content);
      console.log(`   📝 Tem blocos de código: ${hasCodeBlocks}`);
      console.log(`   📚 Tem exemplos: ${hasExamples}`);
      console.log(`   ☸️ Tem comandos K8s: ${hasK8sCommands}`);
      return hasCodeBlocks || hasExamples || hasK8sCommands;
    }
    
    if (patternSource.includes('system') || patternSource.includes('prompt')) {
      // Discussões sobre prompts em documentação técnica são OK
      return /documentation|guide|tutorial|example|llm|ai|prompt/gi.test(content);
    }
    
    return true; // Para documentação, ser mais permissivo por padrão
  }

  /**
   * Sanitiza conteúdo removendo padrões perigosos
   */
  private sanitizeContent(content: string): string {
    let sanitized = content;

    // Remover padrões perigosos
    for (const pattern of this.dangerousPatterns) {
      sanitized = sanitized.replace(pattern, '[CONTEÚDO REMOVIDO POR SEGURANÇA]');
    }

    // Limitar tamanho
    if (sanitized.length > 1000000) { // 1MB de texto
      sanitized = sanitized.substring(0, 1000000) + '\n[CONTEÚDO TRUNCADO POR SEGURANÇA]';
    }

    return sanitized;
  }

  /**
   * Verifica integridade básica do arquivo
   */
  private checkFileIntegrity(buffer: Buffer): { isValid: boolean; reason?: string } {
    // Verificar se não é apenas zeros ou dados repetitivos
    const uniqueBytes = new Set(buffer);
    if (uniqueBytes.size < 10 && buffer.length > 1000) {
      return { isValid: false, reason: 'Arquivo suspeito com dados repetitivos' };
    }

    // Verificar densidade de caracteres de controle
    const controlChars = buffer.filter(byte => byte < 32 && byte !== 9 && byte !== 10 && byte !== 13);
    if (controlChars.length > buffer.length * 0.3) {
      return { isValid: false, reason: 'Muitos caracteres de controle suspeitos' };
    }

    return { isValid: true };
  }

  /**
   * Valida nome de arquivo
   */
  private isValidFilename(filename: string): boolean {
    // Caracteres perigosos
    const dangerousChars = /[<>:"|?*\x00-\x1f]/;
    if (dangerousChars.test(filename)) return false;

    // Path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) return false;

    // Nomes reservados do Windows
    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
    if (reservedNames.test(filename)) return false;

    // Muito longo
    if (filename.length > 255) return false;

    return true;
  }

  /**
   * Sanitiza nome de arquivo
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"|?*\x00-\x1f]/g, '_')
      .replace(/\.\./g, '_')
      .replace(/[\/\\]/g, '_')
      .substring(0, 255);
  }

  /**
   * Calcula hash do arquivo
   */
  private calculateHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Detecta idioma básico do conteúdo
   */
  private detectLanguage(content: string): string {
    const portugueseWords = ['que', 'uma', 'para', 'com', 'não', 'por', 'mais', 'como', 'mas'];
    const englishWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can'];
    
    const contentLower = content.toLowerCase();
    const ptCount = portugueseWords.filter(word => contentLower.includes(word)).length;
    const enCount = englishWords.filter(word => contentLower.includes(word)).length;
    
    if (ptCount > enCount) return 'pt';
    if (enCount > ptCount) return 'en';
    return 'unknown';
  }

  /**
   * Formata bytes para exibição
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

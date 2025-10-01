import { Document } from "langchain/document";
import { BaseDocumentLoader } from "langchain/document_loaders/base";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { DocxLoader } from "langchain/document_loaders/fs/docx";
import * as fs from "fs";
import * as path from "path";
import * as xml2js from "xml2js";
import csv from "csv-parser";

export class MarkdownLoader extends BaseDocumentLoader {
  constructor(public filePath: string) {
    super();
  }

  async load(): Promise<Document[]> {
    const content = fs.readFileSync(this.filePath, "utf-8");
    return [
      new Document({
        pageContent: content,
        metadata: {
          source: this.filePath,
          type: "markdown",
        },
      }),
    ];
  }
}

export class XMLLoader extends BaseDocumentLoader {
  constructor(public filePath: string) {
    super();
  }

  async load(): Promise<Document[]> {
    const content = fs.readFileSync(this.filePath, "utf-8");
    const parser = new xml2js.Parser({ explicitArray: false });
    
    try {
      const result = await parser.parseStringPromise(content);
      const jsonString = JSON.stringify(result, null, 2);
      
      return [
        new Document({
          pageContent: jsonString,
          metadata: {
            source: this.filePath,
            type: "xml"
          }
        })
      ];
    } catch (error) {
      console.error(`Erro ao processar XML ${this.filePath}:`, error);
      return [
        new Document({
          pageContent: content,
          metadata: {
            source: this.filePath,
            type: "xml",
            error: "Falha no parsing XML"
          }
        })
      ];
    }
  }
}

export class JSONLoader extends BaseDocumentLoader {
  constructor(public filePath: string) {
    super();
  }

  async load(): Promise<Document[]> {
    try {
      const content = fs.readFileSync(this.filePath, "utf-8");
      const jsonData = JSON.parse(content);
      const jsonString = JSON.stringify(jsonData, null, 2);
      
      return [
        new Document({
          pageContent: jsonString,
          metadata: {
            source: this.filePath,
            type: "json"
          }
        })
      ];
    } catch (error) {
      console.error(`Erro ao processar JSON ${this.filePath}:`, error);
      return [
        new Document({
          pageContent: fs.readFileSync(this.filePath, "utf-8"),
          metadata: {
            source: this.filePath,
            type: "json",
            error: "Falha no parsing JSON"
          }
        })
      ];
    }
  }
}

export class CSVLoader extends BaseDocumentLoader {
  constructor(public filePath: string) {
    super();
  }

  async load(): Promise<Document[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      
      fs.createReadStream(this.filePath)
        .pipe(csv())
        .on('data', (data: any) => results.push(data))
        .on('end', () => {
          try {
            const csvString = JSON.stringify(results, null, 2);
            
            resolve([
              new Document({
                pageContent: csvString,
                metadata: {
                  source: this.filePath,
                  type: "csv",
                  rows: results.length
                }
              })
            ]);
          } catch (error) {
            console.error(`Erro ao processar CSV ${this.filePath}:`, error);
            resolve([
              new Document({
                pageContent: fs.readFileSync(this.filePath, "utf-8"),
                metadata: {
                  source: this.filePath,
                  type: "csv",
                  error: "Falha no parsing CSV"
                }
              })
            ]);
          }
        })
        .on('error', (error: any) => {
          console.error(`Erro ao ler CSV ${this.filePath}:`, error);
          reject(error);
        });
    });
  }
}

export class DocumentLoaderFactory {
  static createLoader(filePath: string): BaseDocumentLoader {
    const extensao = path.extname(filePath).toLowerCase();
    
    console.log(`🔍 Criando loader para arquivo: ${filePath} (extensão: ${extensao})`);
    
    switch (extensao) {
      case '.pdf':
        console.log('📄 Usando PDFLoader');
        return new PDFLoader(filePath);
      
      case '.docx':
        console.log('📝 Usando DocxLoader');
        return new DocxLoader(filePath);
      
      case '.doc':
        console.log('📄 Usando TextLoader para .doc (limitações)');
        return new TextLoader(filePath);
      
      case '.txt':
        console.log('📝 Usando TextLoader');
        return new TextLoader(filePath);
      
      case '.xml':
        console.log('🗂️ Usando XMLLoader');
        return new XMLLoader(filePath);
      
      case '.json':
        console.log('📋 Usando JSONLoader');
        return new JSONLoader(filePath);
      
      case '.csv':
        console.log('📊 Usando CSVLoader');
        return new CSVLoader(filePath);
      
      case '.md':
      case '.markdown':
        console.log('📚 Usando MarkdownLoader');
        return new MarkdownLoader(filePath);
      
      default:
        console.error(`❌ Extensão não suportada: ${extensao}`);
        console.log('📋 Extensões suportadas: .pdf, .docx, .doc, .txt, .md, .xml, .json, .csv');
        throw new Error(`Extensão não suportada: ${extensao}. Suportadas: .pdf, .docx, .doc, .txt, .md, .xml, .json, .csv`);
    }
  }

  static async processFileFromBuffer(
    buffer: Buffer, 
    originalName: string, 
    mimeType: string
  ): Promise<string> {
    const tempDir = path.join(process.cwd(), 'temp');
    
    // Criar diretório temp se não existir
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Sanitizar originalName para prevenir path traversal
    const sanitizedName = path.basename(originalName).replace(/[^a-zA-Z0-9._-]/g, '_');
    const tempFilePath = path.join(tempDir, `temp_${Date.now()}_${sanitizedName}`);
    
    try {
      // Escrever buffer para arquivo temporário
      fs.writeFileSync(tempFilePath, buffer);
      
      // Processar arquivo
      const loader = this.createLoader(tempFilePath);
      const documents = await loader.load();
      
      // Concatenar conteúdo de todos os documentos
      const content = documents.map(doc => doc.pageContent).join('\n\n');
      
      return content;
      
    } finally {
      // Limpar arquivo temporário
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  }

  static getExtensionsSupported(): string[] {
    return ['.pdf', '.docx', '.doc', '.txt', '.md', '.xml', '.json', '.csv'];
  }

  static isExtensionSupported(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return this.getExtensionsSupported().includes(ext);
  }
}

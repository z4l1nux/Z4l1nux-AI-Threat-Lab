import { Document } from "langchain/document";
import { BaseDocumentLoader } from "langchain/document_loaders/base";
import * as fs from "fs";
import * as path from "path";
import * as xml2js from "xml2js";
import csv from "csv-parser";

/**
 * Loader para arquivos Markdown
 */
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

/**
 * Loader para arquivos XML
 */
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

/**
 * Loader para arquivos JSON
 */
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

/**
 * Loader para arquivos CSV
 */
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

/**
 * Factory para criar o loader apropriado baseado na extensão do arquivo
 */
export class DocumentLoaderFactory {
  static createLoader(filePath: string): BaseDocumentLoader {
    const extensao = path.extname(filePath).toLowerCase();
    
    switch (extensao) {
      case '.xml':
        return new XMLLoader(filePath);
      case '.json':
        return new JSONLoader(filePath);
      case '.csv':
        return new CSVLoader(filePath);
      case '.md':
      case '.markdown':
        return new MarkdownLoader(filePath);
      default:
        throw new Error(`Extensão não suportada: ${extensao}`);
    }
  }
} 
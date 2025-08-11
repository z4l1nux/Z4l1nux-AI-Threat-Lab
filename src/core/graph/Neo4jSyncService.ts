import { Session } from "neo4j-driver";
import { Neo4jClient } from "./Neo4jClient";
import { ChunkInfo } from "../types";

export class Neo4jSyncService {
  private readonly database?: string;

  constructor(database?: string) {
    this.database = database;
  }

  async upsertDocumento(nomeArquivo: string, hashArquivo: string): Promise<void> {
    const session = Neo4jClient.getSession(this.database);
    try {
      await session.executeWrite(async tx => {
        await tx.run(
          `MERGE (d:Document {id: $id})
           ON CREATE SET d.nomeArquivo = $nomeArquivo, d.hashArquivo = $hashArquivo, d.createdAt = datetime()
           ON MATCH SET d.nomeArquivo = $nomeArquivo, d.hashArquivo = $hashArquivo, d.updatedAt = datetime()`,
          { id: nomeArquivo, nomeArquivo, hashArquivo }
        );
      });
    } finally {
      await session.close();
    }
  }

  async upsertChunks(nomeArquivo: string, chunks: ChunkInfo[]): Promise<void> {
    if (chunks.length === 0) return;
    const session = Neo4jClient.getSession(this.database);
    try {
      await session.executeWrite(async tx => {
        for (const chunk of chunks) {
          await tx.run(
            `MERGE (c:Chunk {id: $id})
             ON CREATE SET c.pageContent = $pageContent, c.chunkIndex = $chunkIndex, c.createdAt = datetime(), c.vector = $vector
             ON MATCH SET c.pageContent = $pageContent, c.chunkIndex = $chunkIndex, c.updatedAt = datetime(), c.vector = $vector
             WITH c
             MATCH (d:Document {id: $docId})
             MERGE (d)-[:HAS_CHUNK]->(c)`,
            {
              id: chunk.id,
              pageContent: chunk.pageContent,
              chunkIndex: chunk.metadata?.chunkIndex ?? 0,
              docId: nomeArquivo,
              vector: chunk.embedding || []
            }
          );
        }
      });
    } finally {
      await session.close();
    }
  }

  async removerDocumento(nomeArquivo: string): Promise<void> {
    const session = Neo4jClient.getSession(this.database);
    try {
      await session.executeWrite(async tx => {
        await tx.run(
          `MATCH (d:Document {id: $id})
           OPTIONAL MATCH (d)-[r:HAS_CHUNK]->(c:Chunk)
           DETACH DELETE d, c`,
          { id: nomeArquivo }
        );
      });
    } finally {
      await session.close();
    }
  }
}



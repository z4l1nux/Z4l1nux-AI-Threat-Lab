import neo4j, { Driver, Session } from "neo4j-driver";
import * as dotenv from "dotenv";

dotenv.config({ path: '../../../.env.local' });

export class Neo4jClient {
  private static driver: Driver | null = null;

  static getDriver(): Driver {
    if (!this.driver) {
      // Configurações do Neo4j - sempre via variáveis de ambiente
      const uri = process.env.NEO4J_URI || "bolt://localhost:7687";
      const user = process.env.NEO4J_USER || "neo4j";
      const password = process.env.NEO4J_PASSWORD || "password";
      
      // Validação básica
      if (!uri || !user || !password) {
        throw new Error("❌ Variáveis de ambiente do Neo4j não configuradas. Configure NEO4J_URI, NEO4J_USER e NEO4J_PASSWORD no .env.local");
      }
      
      console.log(`🔗 Conectando ao Neo4j: ${uri}`);
      this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    }
    return this.driver;
  }

  static getInstance(): Neo4jClient {
    return new Neo4jClient();
  }

  static async executeQuery(query: string, params?: any): Promise<any[]> {
    const session = this.getSession();
    try {
      const result = await session.run(query, params);
      return result.records.map(record => record.toObject());
    } finally {
      await session.close();
    }
  }

  static getSession(database?: string): Session {
    const driver = this.getDriver();
    return driver.session({ database });
  }

  static async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
      console.log("🔌 Conexão Neo4j fechada");
    }
  }

  static async testConnection(): Promise<boolean> {
    let session: Session | null = null;
    try {
      session = this.getSession();
      const result = await session.run("RETURN 1 as test");
      const testValue = result.records[0]?.get('test');
      
      // Neo4j retorna um objeto Integer, precisamos converter para número
      const numValue = typeof testValue === 'object' && testValue.toNumber ? testValue.toNumber() : testValue;
      
      if (numValue === 1) {
        console.log("✅ Conexão Neo4j testada com sucesso");
        return true;
      } else {
        console.log("⚠️ Neo4j conectou mas retornou valor inesperado:", testValue, "convertido:", numValue);
        return false;
      }
    } catch (error) {
      console.error("❌ Erro ao testar conexão Neo4j:", error);
      return false;
    } finally {
      if (session) {
        await session.close();
      }
    }
  }
}

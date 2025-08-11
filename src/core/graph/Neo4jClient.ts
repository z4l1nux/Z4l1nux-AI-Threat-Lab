import neo4j, { Driver, Session } from "neo4j-driver";

export class Neo4jClient {
  private static driver: Driver | null = null;

  static getDriver(): Driver {
    if (!this.driver) {
      const uri = process.env.NEO4J_URI || "bolt://localhost:7687";
      const user = process.env.NEO4J_USERNAME || "neo4j";
      const password = process.env.NEO4J_PASSWORD || "neo4j";
      this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    }
    return this.driver;
  }

  static getSession(database?: string): Session {
    const driver = this.getDriver();
    return driver.session({ database });
  }

  static async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
    }
  }
}



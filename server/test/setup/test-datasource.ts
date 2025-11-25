import "reflect-metadata";
import { DataSource } from "typeorm";
import { UserDAO } from "../../src/models/dao/UserDAO";
import { OfficerDAO } from "../../src/models/dao/OfficerDAO";
import { ReportDAO } from "../../src/models/dao/ReportDAO";

// Database in memoria SQLite per i test
export const TestDataSource = new DataSource({
  type: "sqlite",
  database: ":memory:",
  dropSchema: true,
  entities: [UserDAO, OfficerDAO, ReportDAO],
  synchronize: true,
  logging: false // Abilito per vedere cosa succede
});

export async function initializeTestDatabase() {
  if (!TestDataSource.isInitialized) {
    // console.log("🔄 Inizializzazione database di test...");
    await TestDataSource.initialize();
    
    // Verifica che il database sia stato inizializzato correttamente
    const entities = TestDataSource.entityMetadatas;
    // console.log("✅ Database di test inizializzato con successo");
    // console.log(`📊 Database type: ${TestDataSource.options.type}`);
    // console.log(`📁 Database: ${TestDataSource.options.database}`);
    // console.log(`📦 Entità caricate: ${entities.length}`);
    
    if (entities.length > 0) {
      // console.log("📋 Lista entità:");
      entities.forEach(entity => {
        // console.log(`   - ${entity.name} (tabella: ${entity.tableName})`);
      });
    } else {
      // console.warn("⚠️ ATTENZIONE: Nessuna entità caricata!");
    }
  }
  return TestDataSource;
}

export async function closeTestDatabase() {
  if (TestDataSource.isInitialized) {
    await TestDataSource.destroy();
    // console.log("Test database closed");
  }
}

export async function clearDatabase() {
  if (TestDataSource.isInitialized) {
    const entities = TestDataSource.entityMetadatas;
    
    for (const entity of entities) {
      const repository = TestDataSource.getRepository(entity.name);
      await repository.clear();
    }
  }
}

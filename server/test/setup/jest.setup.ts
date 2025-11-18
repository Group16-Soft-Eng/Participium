// Setup globale per tutti i test
import { TestDataSource } from './test-datasource';

// Aumenta il timeout per i test di integrazione
jest.setTimeout(30000);

// Setup before all tests
beforeAll(async () => {
  // Inizializza il database di test
  if (!TestDataSource.isInitialized) {
    await TestDataSource.initialize();
  }
});

// Cleanup after all tests
afterAll(async () => {
  // Chiudi la connessione al database
  if (TestDataSource.isInitialized) {
    await TestDataSource.destroy();
  }
});

// Reset del database dopo ogni test
afterEach(async () => {
  if (TestDataSource.isInitialized) {
    const entities = TestDataSource.entityMetadatas;
    
    for (const entity of entities) {
      const repository = TestDataSource.getRepository(entity.name);
      await repository.query(`DELETE FROM ${entity.tableName};`);
    }
  }
});

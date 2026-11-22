export const DB_NAME = 'RH_Masters-db';
export const DB_VERSION = 1;
export const EMPLOYEES_STORE = 'funcionarios';
export const COMPANIES_STORE = 'empresas';

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(EMPLOYEES_STORE)) {
        const empStore = db.createObjectStore(EMPLOYEES_STORE, { keyPath: 'id' });
        empStore.createIndex('by_nome', 'nome', { unique: false });
        empStore.createIndex('by_empresaId', 'empresaId', { unique: false });
        empStore.createIndex('by_cargo', 'cargo', { unique: false });
        empStore.createIndex('by_salario', 'salario', { unique: false });
        empStore.createIndex('by_status', 'status', { unique: false });
      }

      if (!db.objectStoreNames.contains(COMPANIES_STORE)) {
        const compStore = db.createObjectStore(COMPANIES_STORE, { keyPath: 'id' });
        compStore.createIndex('by_nome', 'nome', { unique: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
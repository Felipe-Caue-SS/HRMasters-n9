import { COMPANIES_STORE, openDB } from './db.ts';

export interface Company {
  id: string;
  nome: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CompanyFilters {
  termo?: string;
}


export function normalizeCompanyName(nome: string): string {
  return nome.trim().replace(/\s+/g, ' ');
}

async function runCompanyHelper<Transaction>(
  mode: IDBTransactionMode,
  executor: (store: IDBObjectStore) => IDBRequest<Transaction>
): Promise<Transaction> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(COMPANIES_STORE, mode);
    const store = tx.objectStore(COMPANIES_STORE);
    const req = executor(store);

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.onabort = () => reject(tx.error);
  });
}

// --- Operações CRUD ---

export async function listCompanies(filters: CompanyFilters = {}): Promise<Company[]> {
  const termo = normalizeCompanyName(filters.termo ?? '').toLowerCase();
  const todas = await runCompanyHelper<Company[]>('readonly', (store) => store.getAll());

  const filtradas = (todas || []).filter((company) => {
    if (!termo) return true;
    return company.nome.toLowerCase().includes(termo);
  });

  return filtradas.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

export async function getCompanyById(id: string): Promise<Company | null> {
  const result = await runCompanyHelper<Company | undefined>('readonly', (store) => store.get(id));
  return result ?? null;
}

export async function getCompanyByName(nome: string): Promise<Company | null> {
  const nomeLimpo = normalizeCompanyName(nome).toLowerCase();
  if (!nomeLimpo) return null;

  const todas = await runCompanyHelper<Company[]>('readonly', (store) => store.getAll());
  return (todas || []).find((c) => c.nome.toLowerCase() === nomeLimpo) ?? null;
}

export async function createCompany(nome: string): Promise<Company> {
  const nomeLimpo = normalizeCompanyName(nome);
  if (!nomeLimpo) {
    throw new Error('Informe o nome da empresa.');
  }

  const existente = await getCompanyByName(nomeLimpo);
  if (existente) {
    return existente;
  }

  const agora = new Date().toISOString();
  const company: Company = {
    id: crypto.randomUUID(),
    nome: nomeLimpo,
    criadoEm: agora,
    atualizadoEm: agora,
  };

  try {
    await runCompanyHelper('readwrite', (store) => store.add(company));
    return company;
  } catch (err: unknown) {
    // Caso ocorra conflito de índice único (ex.: mesma grafia exata em corrida)
    if (err instanceof DOMException && err.name === 'ConstraintError') {
      const jaCriada = await getCompanyByName(nomeLimpo);
      if (jaCriada) return jaCriada;
    }
    throw err;
  }
}

export async function resolveCompanySelection(params: {
  selectedId?: string;
  typedName?: string;
}): Promise<Company> {
  const selectedId = params.selectedId?.trim() ?? '';
  const typedName = normalizeCompanyName(params.typedName ?? '');

  if (selectedId) {
    const byId = await getCompanyById(selectedId);
    if (byId) {
      if (typedName && typedName.toLowerCase() !== byId.nome.toLowerCase()) {
        return createCompany(typedName);
      }
      return byId;
    }
  }

  if (!typedName) {
    throw new Error('Selecione uma empresa existente ou digite o nome de uma nova.');
  }

  return createCompany(typedName);
}

export async function updateCompanyName(id: string, novoNome: string): Promise<Company> {
  const atual = await getCompanyById(id);
  if (!atual) {
    throw new Error('Empresa não encontrada.');
  }

  const nomeLimpo = normalizeCompanyName(novoNome);
  if (!nomeLimpo) {
    throw new Error('O nome da empresa não pode ficar vazio.');
  }

  const duplicada = await getCompanyByName(nomeLimpo);
  if (duplicada && duplicada.id !== id) {
    throw new Error('Já existe outra empresa cadastrada com esse nome.');
  }

  const atualizada: Company = {
    ...atual,
    nome: nomeLimpo,
    atualizadoEm: new Date().toISOString(),
  };

  await runCompanyHelper('readwrite', (store) => store.put(atualizada));
  return atualizada;
}
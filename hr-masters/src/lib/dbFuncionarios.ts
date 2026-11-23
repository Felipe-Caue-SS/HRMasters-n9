import { EMPLOYEES_STORE, openDB } from "./db.ts";

import { formatCPF, isValidCPF } from "@utils/cpfHandler";
import { normalizeName } from "@utils/nameHandler.ts";
import { formatPisPasep, isValidPisPasep } from "@utils/pispasepHandler";
import { formatSalario, isValidSalario, onlyDigits } from "@utils/salarioHandler";
import { formatTelefone, isValidTelefone } from "@utils/telefoneHandler";

export interface Employee {
  id: string;
  nome: string;
  dataNascimento: string; // YYYY-MM-DD (input type="date")
  cpf: string; // nnn.nnn.nnn-nn
  pisPasep: string; // nnn.nnnnn.nn-n
  telefone: string; // +nn (nn) nnnnn - nnnn
  email: string;
  empresaId: string;
  empresa: string;
  dataAdmissao: string; // YYYY-MM-DD (input type="date")
  cargo: string;
  salario: string; // R$ x,nn (ex.: "R$ 3.500,00" ou "R$ 1250,50")
  ativo: boolean;
  dataSaida: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export type CreateEmployeeInput = Omit<
  Employee,
  "id" | "ativo" | "dataSaida" | "criadoEm" | "atualizadoEm"
>;

export type UpdateEmployeeInput = Partial<
  Omit<Employee, "id" | "criadoEm" | "atualizadoEm">
>;

export type EmployeeStatusFilter = 'ativos' | 'arquivados' | 'todos';
export interface ListEmployeesFilters {
  nome?: string;
  empresa?: string;
  cargo?: string;
  salario?: string;
  status?: EmployeeStatusFilter;
}

export type SearchQueryType = "nome" | "cpf";

export interface EmployeeSearchFilters {
  query?: string;
  tipo?: SearchQueryType;
  empresaId?: string;
  status?: EmployeeStatusFilter;
}

function normalizeEmployeeData(
  input: CreateEmployeeInput,
): CreateEmployeeInput {
  const cpf = formatCPF(input.cpf);
  const pisPasep = formatPisPasep(input.pisPasep);
  const telefone = formatTelefone(input.telefone);
  const salario = formatSalario(input.salario);

  if (!input.nome?.trim()) throw new Error("Nome é obrigatório.");
  if (!input.dataNascimento)
    throw new Error("Data de nascimento é obrigatória.");
  if (!isValidCPF(cpf))
    throw new Error("CPF inválido. Use o formato nnn.nnn.nnn-nn.");
  if (!isValidPisPasep(pisPasep)) {
    throw new Error("PIS/PASEP inválido. Use o formato nnn.nnnnn.nn-n.");
  }
  if (!isValidTelefone(telefone)) {
    throw new Error("Telefone inválido. Use o formato +nn (nn) nnnnn - nnnn.");
  }
  if (!input.email?.trim()) throw new Error("E-mail é obrigatório.");
  if (!input.empresaId?.trim() || !input.empresa?.trim()) {
    throw new Error("Empresa é obrigatória.");
  }
  if (!input.dataAdmissao) throw new Error("Data de admissão é obrigatória.");
  if (!input.cargo?.trim()) throw new Error("Cargo é obrigatório.");
  if (!isValidSalario(salario)) {
    throw new Error("Salário inválido. Use o formato R$ x,nn.");
  }

  return {
    nome: input.nome.trim().replace(/\s+/g, " "),
    dataNascimento: input.dataNascimento,
    cpf,
    pisPasep,
    telefone,
    email: input.email.trim().toLowerCase(),
    empresaId: input.empresaId.trim(),
    empresa: input.empresa.trim().replace(/\s+/g, " "),
    dataAdmissao: input.dataAdmissao,
    cargo: input.cargo.trim().replace(/\s+/g, " "),
    salario,
  };
}

async function runTransactionHelper<Transaction>(
  mode: IDBTransactionMode,
  executor: (store: IDBObjectStore) => IDBRequest<Transaction>,
): Promise<Transaction> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(EMPLOYEES_STORE, mode);
    const store = tx.objectStore(EMPLOYEES_STORE);
    const req = executor(store);

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.onabort = () => reject(tx.error);
  });
}

// --- Operações CRUD ---
export async function createEmployee(
  input: CreateEmployeeInput,
): Promise<Employee> {
  const normalizado = normalizeEmployeeData(input);
  const agora = new Date().toISOString();

  const employee: Employee = {
    id: crypto.randomUUID(),
    ...normalizado,
    ativo: true,
    dataSaida: null,
    criadoEm: agora,
    atualizadoEm: agora,
  };

  await runTransactionHelper("readwrite", (store) => store.add(employee));
  return employee;
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  const result = await runTransactionHelper("readonly", (store) =>
    store.get(id),
  );
  return (result as Employee) ?? null;
}

export async function listEmployees(
  filters: ListEmployeesFilters = {}
): Promise<Employee[]> {
  const status: EmployeeStatusFilter = filters.status ?? 'todos';
  const nomeFilter = normalizeName(filters.nome ?? '');
  const empresaFilter = normalizeName(filters.empresa ?? '');
  const cargoFilter = normalizeName(filters.cargo ?? '');
  const salarioRaw = (filters.salario ?? '').trim().toLowerCase();
  const salarioDigits = onlyDigits(salarioRaw);

  const todos = await runTransactionHelper<Employee[]>('readonly', (store) =>
    store.getAll()
  );

  return (todos || []).filter((emp) => {
    if (status === 'ativos' && !emp.ativo) return false;
    if (status === 'arquivados' && emp.ativo) return false;

    if (nomeFilter && !normalizeName(emp.nome).includes(nomeFilter)) {
      return false;
    }

    if (empresaFilter && !normalizeName(emp.empresa).includes(empresaFilter)) {
      return false;
    }

    if (cargoFilter && !normalizeName(emp.cargo).includes(cargoFilter)) {
      return false;
    }

    if (salarioRaw) {
      const empSalarioLower = emp.salario.toLowerCase();
      const empSalarioDigits = onlyDigits(emp.salario);

      const matchesSalario =
        empSalarioLower.includes(salarioRaw) ||
        (salarioDigits.length > 0 && empSalarioDigits.includes(salarioDigits));

      if (!matchesSalario) return false;
    }

    return true;
  });
}

export async function searchEmployees(
  query: string,
  tipo: SearchQueryType,
): Promise<Employee[]> {
  const trimmedQuery = query.trim();

  const todos = await runTransactionHelper<Employee[]>("readonly", (store) =>
    store.getAll(),
  );

  if (!trimmedQuery) {
    return [];
  } else {
    switch (tipo) {
      case "cpf":
        return (todos || []).filter((emp) => emp.cpf.includes(trimmedQuery));

      case "nome":
        const normalizedQuery = normalizeName(trimmedQuery);
        return (todos || []).filter((emp) =>
          normalizeName(emp.nome).includes(normalizedQuery),
        );
    }
  }
}

export async function updateEmployee(
  id: string,
  updates: UpdateEmployeeInput,
): Promise<Employee> {
  const atual = await getEmployeeById(id);
  if (!atual) {
    throw new Error("Funcionário não encontrado.");
  }

  const mesclado: CreateEmployeeInput = {
    nome: updates.nome ?? atual.nome,
    dataNascimento: updates.dataNascimento ?? atual.dataNascimento,
    cpf: updates.cpf ?? atual.cpf,
    pisPasep: updates.pisPasep ?? atual.pisPasep,
    telefone: updates.telefone ?? atual.telefone,
    email: updates.email ?? atual.email,
    empresaId: updates.empresaId ?? atual.empresaId,
    empresa: updates.empresa ?? atual.empresa,
    dataAdmissao: updates.dataAdmissao ?? atual.dataAdmissao,
    cargo: updates.cargo ?? atual.cargo,
    salario: updates.salario ?? atual.salario,
  };

  const normalizado = normalizeEmployeeData(mesclado);

  const atualizado: Employee = {
    ...atual,
    ...normalizado,
    ativo: updates.ativo ?? atual.ativo,
    dataSaida:
      updates.dataSaida !== undefined ? updates.dataSaida : atual.dataSaida,
    id: atual.id,
    criadoEm: atual.criadoEm,
    atualizadoEm: new Date().toISOString(),
  };

  await runTransactionHelper("readwrite", (store) => store.put(atualizado));
  return atualizado;
}

export async function archiveEmployee(
  id: string,
  dataSaida: string,
): Promise<Employee> {
  if (!dataSaida) {
    throw new Error("Informe a data de saída para arquivar o funcionário.");
  }

  return updateEmployee(id, {
    ativo: false,
    dataSaida,
  });
}

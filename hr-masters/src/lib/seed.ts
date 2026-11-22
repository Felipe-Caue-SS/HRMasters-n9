import { seedData } from '@data/dadosIniciais.ts';
import { createCompany, listCompanies } from './dbEmpresas';
import { createEmployee, searchEmployees } from './dbFuncionarios';

let seedPromise: Promise<void> | null = null;

async function runSeed(): Promise<void> {
  if (typeof window === 'undefined') return;

  const existingCompanies = await listCompanies();
  const existingEmployees = await searchEmployees({ status: 'todos' });

  if (existingCompanies.length > 0 && existingEmployees.length > 0) {
    return;
  }

  const companyMap = new Map<string, { id: string; nome: string }>();

  for (const company of existingCompanies) {
    companyMap.set(company.nome.toLowerCase(), {
      id: company.id,
      nome: company.nome,
    });
  }

  for (const rawName of seedData.companies) {
    const key = rawName.trim().toLowerCase();
    if (!companyMap.has(key)) {
      const created = await createCompany(rawName);
      companyMap.set(created.nome.toLowerCase(), {
        id: created.id,
        nome: created.nome,
      });
    }
  }

  const existingEmails = new Set(
    existingEmployees.map((e) => e.email.toLowerCase())
  );
  const existingCpfs = new Set(existingEmployees.map((e) => e.cpf));

  for (const item of seedData.employees) {
    const emailNorm = item.email.trim().toLowerCase();
    if (existingEmails.has(emailNorm) || existingCpfs.has(item.cpf)) {
      continue;
    }

    const companyKey = item.empresa.trim().toLowerCase();
    const company =
      companyMap.get(companyKey) ?? (await createCompany(item.empresa));

    companyMap.set(company.nome.toLowerCase(), {
      id: company.id,
      nome: company.nome,
    });

    await createEmployee({
      ...item,
      empresaId: company.id,
      empresa: company.nome,
    });

    existingEmails.add(emailNorm);
    existingCpfs.add(item.cpf);
  }
}

export function dbSeedReady(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (!seedPromise) {
    seedPromise = runSeed().catch((err) => {
      seedPromise = null; // permite tentar novamente se falhar
      throw err;
    });
  }
  return seedPromise;
}
import type { CreateEmployeeInput } from '../lib/dbFuncionarios';

export interface SeedEmployeeItem
  extends Omit<CreateEmployeeInput, 'empresaId' | 'empresa'> {
  empresa: string;
}

export interface SeedData {
  companies: string[];
  employees: SeedEmployeeItem[];
}

export const seedData: SeedData = {
  companies: [
    'Atlas Logística',
    'SolNascente Tecnologia',
    'Vértice Engenharia',
  ],
  employees: [
    {
      nome: 'Ana Clara Souza',
      dataNascimento: '1994-05-12',
      cpf: '123.456.789-01',
      pisPasep: '123.45678.90-1',
      telefone: '+55 (79) 99812 - 3456',
      email: 'ana.souza@atlas.com.br',
      empresa: 'Atlas Logística',
      dataAdmissao: '2024-02-01',
      cargo: 'Analista de Operações',
      salario: 'R$ 4200,00',
    },
    {
      nome: 'Lucas Mendes',
      dataNascimento: '1991-09-23',
      cpf: '234.567.890-12',
      pisPasep: '234.56789.01-2',
      telefone: '+55 (79) 99123 - 4567',
      email: 'lucas.mendes@solnascente.com.br',
      empresa: 'SolNascente Tecnologia',
      dataAdmissao: '2023-07-15',
      cargo: 'Desenvolvedor Full Stack',
      salario: 'R$ 6800,00',
    },
    {
      nome: 'Mariana Costa',
      dataNascimento: '1997-11-04',
      cpf: '345.678.901-23',
      pisPasep: '345.67890.12-3',
      telefone: '+55 (79) 98876 - 5432',
      email: 'mariana.costa@vertice.com.br',
      empresa: 'Vértice Engenharia',
      dataAdmissao: '2025-03-10',
      cargo: 'Coordenadora de Projetos',
      salario: 'R$ 5500,00',
    },
  ],
};
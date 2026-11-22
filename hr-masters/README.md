
# HR Masters

## Rotas
`/interno/` => Rotas do sistema interno da empresa (Onde os Analistas de RH e Coordenadores de Folha tranalham);
`/cliente/` => Rota específica para cada cliente (onde podem consultar os dados da sua empresa);

## Funcionalidades

- Cadastro de funcionários;
- Busca por perfis de funcionários;
- Modificar informações de funcionários;
- Encerrar/arquivar registros de funcionários;

## Estrutura do Projeto

```text
src/
├── assets/         # Arquivos estáticos 
├── components/      # Componentes de UI
├── data/            # Dados iniciais para popular site
├── layouts/         # Layouts astro
├── lib/             # Modelagem e operações CRUD com base de dados IndexedDB
├── pages/
|   ├─ [cliente]    # Rotas das plataformas das empresas clientes do HR Masters
|   ├─ interno/      # Rota da plataforma interna do HR Masters
|   ├─ clientes     # Lista de empresas clientes
|   └─ index        # Landing page
├── utils/           # Scripts utilitários
└── global.css      # Estilos css globais
```
## Executando Ambiente de Desenvolvimento
Verificar [requisitos](../README.md#requisitos). Se satisfeitos, executar o seguinte comando no diretório `hr-masters`. 

```bash
# Para instalar pacotes node
npm install

# Para iniciar o servidor de desenvolvimento
npm run dev

# Para iniciar o servidor de desenvolvimento e expor porta na rede local
# Útil para acessar o site pelo celular
npm run dev -- --host
```
## Persistência de Dados com IndexedDB

A camada de persistência utiliza o **IndexedDB** nativo do navegador para armazenar e consultar os dados de **funcionários** e **empresas** localmente, sem dependência de backend externo. A estrutura foi dividida em módulos em `src/lib/` com operações assíncronas baseadas em `Promise`, normalização de campos e carga inicial idempotente a partir de `src/data/seedData.ts`.

### Visão Geral da Implementação

- **Conexão e transações:** `src/lib/db.ts` centraliza a abertura do banco (`openDB`) e a criação das *object stores* (`EMPLOYEES_STORE` e `COMPANIES_STORE`). Operações de leitura e escrita encapsulam transações IndexedDB em *helpers* assíncronos.
- **Carga inicial (*seed*):** `src/lib/seed.ts` expõe `dbSeedReady()`, que garante a população inicial de empresas e funcionários a partir de `src/data/seedData.ts` caso o banco ainda não tenha registros. A promessa compartilhada evita condições de corrida e duplicações entre rotas.
- **Regras de negócio por domínio:** `src/lib/dbEmpresas.ts` gerencia empresas e resolve seleções do combobox (vinculando uma empresa existente ou criando uma nova), enquanto `src/lib/dbFuncionarios.ts` trata o cadastro, busca, atualização e arquivamento (*soft delete* com `ativo: false` e `dataSaida`).

---

### Schemas das Stores

#### `EMPLOYEES_STORE` (Funcionários)

Representa os registros de funcionários armazenados na store de funcionários:

| Campo | Tipo | Descrição / Observações |
| :--- | :--- | :--- |
| `id` | `string` | Identificador único gerado (ex.: UUID). |
| `nome` | `string` | Nome completo normalizado. |
| `dataNascimento` | `string` | Data de nascimento (`YYYY-MM-DD`). |
| `cpf` | `string` | CPF formatado/validado conforme máscara do sistema. |
| `pisPasep` | `string` | Número PIS/PASEP formatado/validado conforme máscara. |
| `telefone` | `string` | Telefone formatado (ex.: `+55 (79) 99999 - 9999`). |
| `email` | `string` | E-mail de contato. |
| `empresaId` | `string` | ID da empresa vinculada em `COMPANIES_STORE`. |
| `empresa` | `string` | Nome da empresa vinculada. |
| `dataAdmissao` | `string` | Data de admissão (`YYYY-MM-DD`). |
| `cargo` | `string` | Cargo ou função do funcionário. |
| `salario` | `string` | Valor monetário formatado (`R$ x,nn`). |
| `ativo` | `boolean` | `true` para ativo; `false` para arquivado (*soft delete*). |
| `dataSaida` | `string \| null` | Data de saída/arquivamento quando `ativo` é `false`, ou `null` quando ativo. |
| `criadoEm` | `string` | Data/hora ISO de criação do registro. |
| `atualizadoEm` | `string` | Data/hora ISO da última atualização. |

#### `COMPANIES_STORE` (Empresas)

Representa os registros de empresas armazenados na store de empresas:

| Campo | Tipo | Descrição / Observações |
| :--- | :--- | :--- |
| `id` | `string` | Identificador único gerado (ex.: UUID). |
| `nome` | `string` | Nome da empresa normalizado (sem espaços duplicados/nas extremidades). |
| `criadoEm` | `string` | Data/hora ISO de criação do registro. |
| `atualizadoEm` | `string` | Data/hora ISO da última atualização. |

---

### Funções por Arquivo em `src/lib/`

#### `src/lib/db.ts`
Camada base de conexão e nomes das *stores* do IndexedDB.

- **`openDB()`**
  - **Parâmetros:** Nenhum.
  - **O que faz:** Abre (ou cria/atualiza na versão configurada) a instância do `IDBDatabase` garantindo a existência de `EMPLOYEES_STORE` e `COMPANIES_STORE`.
  - **Retorno:** `Promise<IDBDatabase>`.

#### `src/lib/dbEmpresas.ts`
Gerencia o cadastro, consulta e resolução de empresas para o combobox de seleção/criação.

- **`normalizeCompanyName(nome: string)`**
  - **Parâmetros:** `nome: string` — texto bruto digitado ou informado.
  - **O que faz:** Remove espaços extras nas extremidades e colapsa múltiplos espaços internos em um único espaço.
  - **Retorno:** `string`.
- **`listCompanies(filters?: { termo?: string })`**
  - **Parâmetros:** `filters` opcional contendo `termo?: string` para filtrar por trecho do nome.
  - **O que faz:** Lista as empresas da store, aplica filtro opcional por termo (case-insensitive) e ordena em ordem alfabética (`pt-BR`).
  - **Retorno:** `Promise<Company[]>`.
- **`getCompanyById(id: string)`**
  - **Parâmetros:** `id: string` — identificador da empresa.
  - **O que faz:** Busca uma empresa específica pelo `id`.
  - **Retorno:** `Promise<Company | null>`.
- **`getCompanyByName(nome: string)`**
  - **Parâmetros:** `nome: string` — nome da empresa.
  - **O que faz:** Busca uma empresa pelo nome normalizado (comparação case-insensitive).
  - **Retorno:** `Promise<Company | null>`.
- **`createCompany(nome: string)`**
  - **Parâmetros:** `nome: string` — nome da empresa a cadastrar.
  - **O que faz:** Valida e normaliza o nome; se já existir uma empresa com o mesmo nome, retorna o registro existente; caso contrário, cria e persiste uma nova `Company`.
  - **Retorno:** `Promise<Company>`.
- **`resolveCompanySelection(params: { selectedId?: string; typedName?: string })`**
  - **Parâmetros:** Objeto com `selectedId?: string` (ID do campo oculto do combobox) e `typedName?: string` (texto visível no campo).
  - **O que faz:** Resolve o envio do combobox: retorna a empresa existente se selecionada/correspondente ou cria uma nova empresa se o usuário digitou um nome inédito.
  - **Retorno:** `Promise<Company>`.
- **`updateCompanyName(id: string, novoNome: string)`**
  - **Parâmetros:** `id: string` — ID da empresa; `novoNome: string` — novo nome desejado.
  - **O que faz:** Valida a existência do registro, verifica duplicidade de nome e atualiza `nome` e `atualizadoEm` na store.
  - **Retorno:** `Promise<Company>`.

#### `src/lib/dbFuncionarios.ts`
Gerencia operações de funcionários, formatação/validação e arquivamento.

- **`createEmployee(input)`**
  - **Parâmetros:** Dados de entrada do funcionário (`nome`, `dataNascimento`, `cpf`, `pisPasep`, `telefone`, `email`, `empresaId`, `empresa`, `dataAdmissao`, `cargo`, `salario`).
  - **O que faz:** Valida/normaliza os campos, define `ativo: true`, `dataSaida: null`, `id` e timestamps, e salva o funcionário em `EMPLOYEES_STORE`.
  - **Retorno:** `Promise<Employee>` (ou o registro criado).
- **`searchEmployees(filters)`**
  - **Parâmetros:** Objeto de filtros (ex.: `status?: 'ativos' | 'arquivados' | 'todos'`, além de eventuais filtros de busca/empresa).
  - **O que faz:** Consulta os funcionários na store e aplica os filtros solicitados.
  - **Retorno:** `Promise<Employee[]>`.
- **`getEmployeeById(id: string)`**
  - **Parâmetros:** `id: string` — identificador do funcionário.
  - **O que faz:** Recupera um funcionário específico pelo `id`.
  - **Retorno:** `Promise<Employee | null>`.
- **`updateEmployee(id: string, changes)`**
  - **Parâmetros:** `id: string` — ID do funcionário; `changes` — campos atualizados.
  - **O que faz:** Atualiza os dados do funcionário e renova `atualizadoEm` na store.
  - **Retorno:** `Promise<Employee>`.
- **`archiveEmployee(id: string, dataSaida?: string)`**
  - **Parâmetros:** `id: string` — ID do funcionário; `dataSaida?: string` opcional (padrão para data atual se omitida).
  - **O que faz:** Executa *soft delete* marcando `ativo: false` e preenchendo `dataSaida` e `atualizadoEm` sem remover o histórico da store.
  - **Retorno:** `Promise<Employee>`.

#### `src/lib/seed.ts`
Controla a carga inicial de dados a partir de `src/data/seedData.ts`.

- **`dbSeedReady()`**
  - **Parâmetros:** Nenhum.
  - **O que faz:** Inicia (ou aguarda a execução em andamento de) `ensureSeeded` no ambiente do navegador, populando empresas e funcionários iniciais apenas se ainda não existirem registros na base.
  - **Retorno:** `Promise<void>`.
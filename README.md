# CliniVet

Agenda de coletas veterinárias com cadastro, autenticação e calendário. Cada conta gerencia suas próprias coletas, com filtros, edição e cancelamento.

## Funcionalidades

- Cadastro e login por e-mail e senha. O login responde **“Credenciais inválidas”** sem revelar qual dado está incorreto.
- Calendário em **dia, semana e mês** no computador. No celular, a visualização mensal permite selecionar um dia e percorrer suas coletas.
- Criação, edição e cancelamento de coletas. O cancelamento altera o status e preserva o registro.
- Filtro por data e seleção de múltiplos status; resultados ordenados por data e hora.
- Isolamento por conta: as consultas e alterações na API usam o usuário da sessão.
- Vinte coletas de exemplo por conta nova, incluindo um dia movimentado para demonstrar o recurso **“Ver mais”**. Os exemplos não são duplicados ao entrar novamente.
- Validação no servidor de campos obrigatórios, data futura e conflito entre coletas **Agendado** da mesma conta no mesmo horário.
- Estados de carregamento, erro e agenda vazia.

## Tecnologias

| Área | Tecnologia |
| --- | --- |
| Aplicação | Next.js 16 (App Router), React 19 e TypeScript |
| Dados | Prisma 6 e SQLite |
| Validação e autenticação | Zod, bcryptjs e sessão em cookie HTTP-only assinada com `jose` |
| Interface | CSS, Lucide, Framer Motion, React DayPicker e SimpleBar |

O SQLite usa um arquivo local. Não é necessário iniciar um servidor de banco de dados separado.

## Executar localmente

### Pré-requisitos

- Node.js 20 ou superior e npm.
- Uma porta livre para o servidor local (a padrão é `3000`).

No PowerShell, dentro da pasta do projeto:

```powershell
npm ci
Copy-Item .env.example .env
```

Edite `.env` e substitua `SESSION_SECRET` por uma chave aleatória. Você pode gerar uma chave no PowerShell com:

```powershell
[Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Em seguida, prepare o banco e inicie a aplicação:

```powershell
npm run db:generate
npm run db:setup
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) e crie uma conta em **Cadastro**. `db:setup` prepara o arquivo SQLite e aplica as migrações; o banco fica em `prisma/dev.db` e não é versionado. Para usar outra porta, execute `npm run dev -- -p 3001` e abra `http://localhost:3001`.

### Conta de demonstração opcional

Defina `DEMO_PASSWORD` no `.env` com uma senha de pelo menos seis caracteres e execute:

```powershell
npm run db:seed
```

Isso cria ou atualiza `admin@clinivet.local` com a senha definida. Ao entrar, essa conta também recebe os exemplos de coletas. Sem `DEMO_PASSWORD`, use o cadastro; o seed não cria uma senha padrão.

## Como usar

1. Crie uma conta ou entre com uma existente.
2. Navegue pelo período no cabeçalho. No computador, escolha dia, semana ou mês; no celular, toque em um dia do mês para ver sua lista.
3. Use o botão flutuante **+** para agendar uma coleta, informando clínica, animal, exame, data, hora e status. Observações são opcionais.
4. Use os filtros de data e status para localizar registros. No calendário do computador, **Ver mais** abre os eventos que não cabem na célula.
5. Passe o mouse sobre um evento para ver detalhes e os controles de edição e cancelamento. No celular, os controles ficam na lista do dia.

## Estrutura do projeto

```text
src/app/agenda/                 Calendário e interação da agenda
src/app/api/auth/               Cadastro, login e logout
src/app/api/appointments/       Consulta, criação e edição de coletas
src/lib/                        Sessão, validação e acesso ao Prisma
prisma/                         Modelo, migrações e seed opcional
tests/                          Testes de regras e da API
docs/                           Plano de execução e validação do teste
```

### API

| Método e rota | Uso |
| --- | --- |
| `POST /api/auth/register` | Criar conta e iniciar sessão |
| `POST /api/auth/login` | Entrar |
| `POST /api/auth/logout` | Sair |
| `GET /api/appointments` | Listar coletas da conta; aceita `date=AAAA-MM-DD` e um ou mais parâmetros `status` |
| `POST /api/appointments` | Criar coleta |
| `PATCH /api/appointments/:id` | Editar ou cancelar uma coleta, alterando seu status |

As rotas de coletas exigem sessão. O modelo está em `prisma/schema.prisma`; as regras de data, conflito e exemplos ficam em `src/lib/appointments.ts`.

## Verificação

```powershell
npm run lint
npx tsc --noEmit
npm run test:unit
npm run test:mutation
npm run build
```

Para testar os fluxos da API, inicie a aplicação em outro terminal e execute:

```powershell
npm run test:api
```

O teste de API usa contas temporárias e as remove ao final. Se o servidor estiver em outra porta, defina `CLINIVET_TEST_URL` antes de executar o teste (por exemplo, `http://localhost:3001`). O teste de mutação altera temporariamente cópias isoladas das regras de validação e exige que os testes detectem cada alteração. Ele não cobre toda a aplicação.

A [validação do teste prático](docs/VALIDACAO_DO_TESTE.md) registra as verificações em código, API e navegador, além dos diferenciais pendentes. O [plano de execução](docs/PLANO_DE_EXECUCAO.md) acompanha as atividades concluídas.

## Decisões e limites atuais

- A aplicação reúne interface e API no Next.js para reduzir a configuração local.
- O SQLite atende à execução local do teste. Para uso com múltiplas instâncias, seria preciso escolher um banco compartilhado e proteger a regra de conflito contra gravações simultâneas.
- A interface foi revisada no computador e no celular, e os fluxos de dados foram exercitados pela API. Não há versão publicada nem iniciador `.exe` versionado neste repositório.

## Uso de IA

**Ferramenta.** Codex auxiliou na implementação, revisão do código, análise das imagens de erro e criação dos testes. As alterações foram conferidas com lint, TypeScript, testes locais e builds durante o desenvolvimento.

**Prompts relevantes do usuário.**

1. “Login e Senha precisam ter suas validações ... ao errar email e senha NÃO deve indicar que o email ou a senha está errado”.
2. “o calendário ta dividido em grids para cada dia (e nao cards) e os cards são as tarefas dentro dos grids”.
3. “ao preencher a hora digitando manualmente pelo celular não tá formatando e consegui fazer dar um ‘invalid date’”.
4. “tá faltando o botão de ver mais no dia 12, ocultou uma tarefa”.
5. “o botão de ver mais só deve aparecer quando o grid nao comportar mais tarefas”.

**Erros encontrados na implementação assistida por IA.** A entrada manual de horário produzia uma data inválida; a entrada passou a ser formatada e validada antes do envio. O primeiro limite de eventos do mês ocultava uma coleta sem acesso; uma revisão posterior mostrava “Ver mais” cedo demais. A quantidade visível passou a considerar a altura da célula.

**Decisões do usuário.** A escolha de Next.js full stack, SQLite local, `lucide-react`, grade contínua do calendário e commits pequenos veio das revisões do usuário. Para manter o escopo simples, as regras de agendamento ficaram em `src/lib/appointments.ts` e o formulário de criar e editar é compartilhado.

**Evolução.** Para múltiplas instâncias, eu migraria para um banco compartilhado e protegeria o conflito de horário em uma operação transacional. Ampliaria os testes de interface e a cobertura de mutação para fluxos de autenticação e persistência. Separaria configuração e implantação por ambiente, com gestão de segredos fora do repositório.

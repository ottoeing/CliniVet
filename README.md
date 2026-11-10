# CliniVet

Agenda de coletas veterinárias com cadastro, autenticação e calendário. Cada conta gerencia suas próprias coletas, com filtros, edição e cancelamento.

## Funcionalidades

- Cadastro e login por e-mail e senha. O login responde **“Credenciais inválidas”** sem revelar qual dado está incorreto.
- Calendário em **dia, semana e mês** no computador. No celular, a visualização mensal permite selecionar um dia e percorrer suas coletas.
- Criação, edição e cancelamento de coletas. O cancelamento altera o status e preserva o registro.
- Filtro por data e seleção de múltiplos status; resultados ordenados por data e hora.
- Busca por clínica em uma lista paginada de dez coletas, sem limitar os eventos exibidos no calendário.
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

### Com Docker Compose

Com Docker Compose instalado, crie o `.env` a partir de `.env.example`, substitua `SESSION_SECRET` por uma chave aleatória e execute:

```sh
docker compose up --build
```

Acesse [http://localhost:3000](http://localhost:3000). O contêiner prepara o SQLite, aplica as migrações e inicia o site. O volume `clinivet_data` preserva os dados entre reinícios. `docker compose down` encerra o serviço sem apagar o volume.

## Executar localmente

### Pré-requisitos

- Node.js 22.9 ou superior e npm.
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
4. Use os filtros de data e status ou a lupa para buscar por clínica e percorrer os resultados. No calendário do computador, **Ver mais** abre os eventos que não cabem na célula.
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
| `GET /api/appointments` | Listar coletas da conta; aceita `date=AAAA-MM-DD`, `clinic`, um ou mais `status`, além de `page` e `pageSize` (máximo 50) para paginação |
| `POST /api/appointments` | Criar coleta |
| `PATCH /api/appointments/:id` | Editar ou cancelar uma coleta, alterando seu status |

As rotas de coletas exigem sessão. O modelo está em `prisma/schema.prisma`; as regras de data, conflito e exemplos ficam em `src/lib/appointments.ts`.
Sem `page` ou `pageSize`, a rota retorna todas as coletas filtradas para compor o calendário. Com paginação, também retorna `total`, `page`, `pageSize` e `totalPages`.

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
- A aplicação foi preparada para rodar localmente com Node.js ou Docker Compose. A publicação em nuvem foi retirada do escopo; não há iniciador `.exe` versionado neste repositório.

## Uso de IA

**Ferramentas.** Usei o ChatGPT para gerar os dois arquivos Markdown de planejamento no início do projeto. Na implementação e nas revisões, usei o Codex com os modelos 5.6 e 6 sol, alternando conforme a complexidade do pedido. Conferi as alterações manualmente e executei lint, verificação de TypeScript, testes e build.

**Prompts que usei.**

1. “Podemos implementar dinâmicas de KISS, YAGNI e DRY.” Usei esse pedido para manter a solução simples, evitar funções fora do escopo e reaproveitar código quando isso fazia sentido.
2. “Gere um prompt para iniciarmos isso. [...] quero que você faça dois arquivos de .md, um arquivo com instruções a serem seguidas e o outro de um passo a passo a ser executado.” Depois pedi checkboxes (`[ ]` e `[x]`) no passo a passo para acompanhar as tarefas.
3. “Quero que você faça testes com mutantes no código e crie testes para as requisições que não possuem, por último, faça testes você mesmo.” Dei prioridade a esse prompt para verificar se os testes detectavam alterações indevidas nas regras e para exercitar os fluxos da API.

**Erros encontrados na implementação assistida por IA.** Encontrei principalmente problemas visuais e de interação que atrapalhavam o uso do aplicativo. Por exemplo, o calendário inicialmente foi feito com blocos para os dias, apesar de eu pedir uma grade contínua; refinei o prompt e revisei o resultado na tela. Também encontrei uma data inválida ao digitar o horário no celular e um limite de eventos que ocultava coletas ou mostrava “Ver mais” cedo demais. Solicitei as correções e verifiquei cada uma manualmente. Erros de biblioteca e de código foram corrigidos com facilidade pela IA, e conferi o comportamento logo depois.

**Decisões que tomei.** Escolhi Next.js full stack para manter o front-end e as rotas de API organizados no mesmo projeto. Nas revisões, defini o uso de SQLite local, `lucide-react`, uma grade contínua para o calendário e commits pequenos. Para seguir KISS, YAGNI e DRY, mantive as regras de agendamento em `src/lib/appointments.ts` e compartilhei o formulário de criação e edição.

**Evolução.** Pretendo incluir responsáveis por cada coleta no card, histórico de alterações e anexos de imagens e áudios. Também quero otimizar o calendário e continuar as melhorias visuais. Se o projeto crescer para múltiplas instâncias, migraria o banco local para um banco compartilhado e reforçaria a proteção contra conflitos simultâneos de horário.

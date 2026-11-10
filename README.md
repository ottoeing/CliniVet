# CliniVet

Agenda de coletas veterinárias com login, calendário, filtros e controle de agendamentos por conta.

## Requisitos

Node.js 20 ou superior e npm. O SQLite é um arquivo local; não há serviço de banco para iniciar.

## Executar localmente

Copie `.env.example` para `.env` e substitua `SESSION_SECRET` por uma chave aleatória de pelo menos 32 caracteres. Defina `DEMO_PASSWORD` se quiser criar a conta de demonstração pelo seed. Depois, na pasta do projeto:

```powershell
npm install
npm run db:generate
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). O banco fica em `prisma/dev.db` e é ignorado pelo Git.

**Conta de demonstração:** `admin@clinivet.local`, com a senha definida por você em `DEMO_PASSWORD`. Sem essa variável, use a tela de cadastro para criar uma conta. O seed não grava senha em texto puro no banco.

## Funcionalidades

- Cadastro e login por e-mail e senha; respostas de login não revelam qual credencial está errada.
- Agenda em dia, semana e mês no computador; mês com lista do dia selecionado no celular.
- Criação, edição e cancelamento de coletas. Cancelar mantém o registro com status `Cancelado`.
- Filtros por data e status, com registros limitados à conta autenticada.
- Validação de campos obrigatórios, data futura e conflito entre duas coletas `Agendado` no mesmo horário.

## Stack e decisões

Next.js com App Router e TypeScript, Prisma com SQLite, Zod para validação, `lucide-react` para ícones, React DayPicker para datas e SimpleBar para rolagem. Uma aplicação full stack e um banco local mantêm a configuração curta. As regras principais ficam em `src/lib/appointments.ts`; as rotas da API verificam a sessão e restringem consultas pelo `userId`. O formulário de criar e editar é compartilhado.

Execute `npm run lint`, `npx tsc --noEmit` e `npx tsx --test tests/validation.test.ts` para verificar código e regras. A revisão manual dos fluxos em celular e desktop ainda deve ser concluída antes da entrega final.

## Uso de IA

**Ferramenta e aplicação.** Codex auxiliou na estrutura do projeto, implementação das rotas e interface, análise das imagens de erro, revisão do código e criação dos testes. As alterações foram conferidas com lint, TypeScript e testes locais antes dos commits recentes.

**Prompts relevantes, escritos pelo usuário.**

1. “Login e Senha precisam ter suas validações ... ao errar email e senha NÃO deve indicar que o email ou a senha está errado”.
2. “o calendário ta dividido em grids para cada dia (e nao cards) e os cards são as tarefas dentro dos grids”.
3. “ao preencher a hora digitando manualmente pelo celular não tá formatando e consegui fazer dar um ‘invalid date’”.
4. “tá faltando o botão de ver mais no dia 12, ocultou uma tarefa”. Este pedido corrigiu uma primeira solução que ocultava tarefas sem exibir o botão.
5. “o botão de ver mais só deve aparecer quando o grid nao comportar mais tarefas”. Este pedido corrigiu o limite fixo usado na segunda solução.

**Erros encontrados e correções.** A digitação manual de horário podia produzir uma data inválida; a tela passou a formatar o horário e validar o valor antes de enviar. O primeiro limite de eventos do mês escondia uma tarefa sem acesso; depois, um limite fixo fazia “Ver mais” aparecer cedo demais. A quantidade visível passou a ser calculada pela altura da célula.

**Decisões do usuário.** O usuário escolheu Next.js full stack, pediu SQLite local com iniciador, exigiu `lucide-react`, orientou o uso de KISS/YAGNI/DRY e preferiu commits pequenos. A visualização móvel mensal e a grade contínua para o desktop também vieram de suas revisões da interface.

**Se o sistema crescesse.** Eu revisaria a acessibilidade e adicionaria testes de interface e integração para os fluxos principais. Um banco compartilhado exigiria regra transacional para evitar conflito de horário em requisições simultâneas. Também separaria configuração e implantação por ambiente, com gestão de segredos fora do repositório.

## Pendências

Confirmar manualmente todos os fluxos e tamanhos de tela; validar a build de produção em ambiente com acesso às fontes usadas pelo Next.js; publicar o projeto se desejado.

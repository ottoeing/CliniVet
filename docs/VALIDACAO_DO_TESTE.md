# Validação do teste prático

Referência: `Teste Prático — Desenvolvedor(a) Full Stack.pdf`, fornecido pelo usuário. Revisão em 10/11/2026. `[x]` indica evidência verificada no código, por comando ou em navegador; `[ ]` indica verificação ainda necessária.

## Cinco requisitos obrigatórios

- [x] Login por e-mail e senha e proteção da agenda: `src/app/api/auth/login/route.ts`, `src/app/agenda/page.tsx` e `src/lib/auth.ts`. A resposta de credenciais incorretas é genérica.
- [x] Filtros por data/status e ordenação: `src/app/api/appointments/route.ts` restringe por `userId`, aplica os filtros e ordena por `scheduledAt` crescente.
- [x] Criar, editar e cancelar: rotas `POST`/`PATCH` e interface em `src/app/agenda/agenda-client.tsx`. O cancelamento altera o status; não exclui o registro.
- [x] Validação no servidor: campos obrigatórios, data futura e conflito entre registros `AGENDADO` do mesmo usuário em `src/lib/appointments.ts` e nas rotas da API. Testes automatizados cobrem credenciais, campos e data.
- [x] Estados de carregamento, erro e lista vazia presentes na agenda. Há regras de layout para celular e desktop em `src/app/globals.css`.
- [x] Exercitar os fluxos de autenticação, filtros, criação, edição, cancelamento, conflito e isolamento entre contas pela API de produção com duas contas temporárias, removidas ao fim do teste.
- [x] Cadastro criou 20 exemplos por conta, com pelo menos 10 no mesmo dia; o segundo login manteve a contagem e os horários `AGENDADO` não se repetiram.
- [x] Revisar em navegador a agenda no computador (1280 × 720) e no celular (390 × 844): calendário, filtro de status múltiplo, lista do dia, modal de criação e edição, além do horário `99:99` rejeitado pelo campo. Uma conta temporária foi removida após o teste.

## Diferenciais e entrega

- [x] Next.js full stack com TypeScript estrito (`tsconfig.json`), Prisma e SQLite.
- [x] Testes automatizados de validação em `tests/validation.test.ts`: 3 passaram, incluindo hífen antes do `@`.
- [x] Teste de integração das rotas, incluindo erros de cadastro, login genérico, autorização, filtros, conflito na criação e edição, cancelamento e logout, em `tests/api-smoke.mjs`.
- [x] Teste de mutação direcionado em `tests/mutation.mjs`: 7 de 7 mutantes detectados por falhas de asserção. Escopo: regras de e-mail, senha, campos obrigatórios, data e status.
- [ ] Docker ou Compose para iniciar com um comando (opcional no enunciado).
- [ ] Busca por clínica e paginação (opcional no enunciado).
- [ ] Publicação online (opcional no enunciado).
- [x] README com execução em cinco comandos, stack, decisões e seção `Uso de IA` com ferramenta, cinco prompts reais, dois erros corrigidos, decisões do usuário e evolução.
- [x] `.env` e banco local ignorados pelo Git; apenas `.env.example` está versionado. A senha de demonstração passou a vir de `DEMO_PASSWORD`.
- [x] Histórico contém commits pequenos e coesos.
- [x] `npm run build` passou após empacotar as fontes localmente e executar a build fora do isolamento do Windows.
- [x] Conferir uma cópia limpa do código versionado seguindo o README: `npm ci`, `.env`, `npm run db:generate`, `npm run db:setup` e `npm run dev`; a página `/login` respondeu HTTP 200. O `db:setup` prepara o arquivo SQLite antes da migração, necessário neste Windows.
- [x] Commits recentes enviados para `https://github.com/ottoeing/CliniVet`.
- [ ] Gerar o iniciador `.exe` pedido anteriormente; a publicação .NET depende do NuGet, inacessível nesta sessão. O script e o código do iniciador ainda estão locais.
- [ ] Enviar o link do repositório ao RH. Envio externo deve ser feito pelo candidato.

## Comandos executados nesta revisão

- `npm run lint` — passou.
- `npx tsc --noEmit` — passou.
- `npm run test:unit` — 3 testes passaram.
- `npm run test:mutation` — 7 de 7 mutantes detectados.
- `npm run db:setup` — passou em banco novo e no banco existente, sem duplicar migrações.
- `npm run test:api` — passou contra a aplicação compilada; as contas de teste foram removidas.
- `npm run build` — passou fora do isolamento do Windows, com fontes locais.
- Instalação limpa — dependências instaladas, migração aplicada e página de login carregada; arquivos temporários removidos.

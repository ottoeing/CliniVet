# Validação do teste prático

Referência: `Teste Prático — Desenvolvedor(a) Full Stack.pdf`, fornecido pelo usuário. Revisão em 09/11/2026. `[x]` indica evidência verificada no código ou por comando; `[ ]` indica verificação ainda necessária. Inspeção de código não substitui o teste manual da interface.

## Cinco requisitos obrigatórios

- [x] Login por e-mail e senha e proteção da agenda: `src/app/api/auth/login/route.ts`, `src/app/agenda/page.tsx` e `src/lib/auth.ts`. A resposta de credenciais incorretas é genérica.
- [x] Filtros por data/status e ordenação: `src/app/api/appointments/route.ts` restringe por `userId`, aplica os filtros e ordena por `scheduledAt` crescente.
- [x] Criar, editar e cancelar: rotas `POST`/`PATCH` e interface em `src/app/agenda/agenda-client.tsx`. O cancelamento altera o status; não exclui o registro.
- [x] Validação no servidor: campos obrigatórios, data futura e conflito entre registros `AGENDADO` do mesmo usuário em `src/lib/appointments.ts` e nas rotas da API. Testes automatizados cobrem credenciais, campos e data.
- [x] Estados de carregamento, erro e lista vazia presentes na agenda. Há regras de layout para celular e desktop em `src/app/globals.css`.
- [ ] Exercitar os cinco requisitos em navegador, nos dois tamanhos de tela. A automação da janela expirou e a chamada HTTP ao servidor local não respondeu nesta sessão.

## Diferenciais e entrega

- [x] Next.js full stack com TypeScript estrito (`tsconfig.json`), Prisma e SQLite.
- [x] Testes automatizados de validação em `tests/validation.test.ts`: 3 passaram.
- [ ] Teste automatizado de conflito de horário e teste de integração das rotas.
- [ ] Docker ou Compose para iniciar com um comando (opcional no enunciado).
- [ ] Busca por clínica e paginação (opcional no enunciado).
- [ ] Publicação online (opcional no enunciado).
- [x] README com execução em cinco comandos, stack, decisões e seção `Uso de IA` com ferramenta, cinco prompts reais, erros corrigidos, decisões do usuário e evolução.
- [x] `.env` e banco local ignorados pelo Git; apenas `.env.example` está versionado. A senha de demonstração passou a vir de `DEMO_PASSWORD`.
- [x] Histórico contém commits pequenos e coesos.
- [ ] Conferir o projeto rodando a partir de um clone limpo. `npm run build` parou por permissão de junção do Turbopack; `next build --webpack` não conseguiu baixar fontes do Google neste ambiente sem rede.
- [ ] Enviar o link do repositório ao RH. Envio externo deve ser feito pelo candidato.

## Comandos executados nesta revisão

- `npm run lint` — passou.
- `npx tsc --noEmit` — passou.
- `npx tsx --test tests/validation.test.ts` — 3 testes passaram.
- `npm run db:seed` — passou; sem `DEMO_PASSWORD`, orientou criar conta pelo cadastro.
- `npm run build` — bloqueado pela permissão de junção no Windows.
- `npx next build --webpack` — bloqueado pelo acesso às fontes do Google.

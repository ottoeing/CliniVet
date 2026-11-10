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
- [x] Reproduzir no navegador o formulário novo com horário antes da data e data antes do horário: ambos mantiveram valores válidos e não exibiram “Invalid Date”. A conta temporária desse teste também foi removida.

## Diferenciais e entrega

- [x] Next.js full stack com TypeScript estrito (`tsconfig.json`), Prisma e SQLite.
- [x] Testes automatizados de validação em `tests/validation.test.ts`: 4 passaram, incluindo hífen antes do `@` e preenchimento de data/hora em ambas as ordens.
- [x] Teste de integração das rotas, incluindo erros de cadastro, login genérico, autorização, filtros, conflito na criação e edição, cancelamento e logout, em `tests/api-smoke.mjs`.
- [x] Teste de mutação direcionado em `tests/mutation.mjs`: 9 de 9 mutantes detectados por falhas de asserção. Escopo: regras de e-mail, senha, campos obrigatórios, data, hora e status.
- [x] Docker Compose preparado com inicialização do banco e site por `docker compose up --build`; volume nomeado preserva o SQLite. Os arquivos YAML foram analisados, mas Docker não está instalado neste ambiente para exercitar o contêiner.
- [ ] Executar o Compose e conferir persistência após reinício em um ambiente com Docker.
- [x] Busca por clínica e paginação na API e em painel próprio da agenda. O teste da API verificou filtros, metadados, ordem e isolamento; o navegador confirmou resultados e troca de página.
- [ ] Publicação online (diferencial opcional do PDF, retirado do escopo por decisão posterior de hospedar somente na máquina local).
- [x] README com execução local e via Compose, stack, decisões e seção `Uso de IA` em primeira pessoa com prompts reais, erros corrigidos e evolução.
- [x] `.env` e banco local ignorados pelo Git; apenas `.env.example` está versionado. A senha de demonstração passou a vir de `DEMO_PASSWORD`.
- [x] Histórico contém commits pequenos e coesos.
- [x] `npm run build` passou após empacotar as fontes localmente e executar a build fora do isolamento do Windows.
- [ ] Avaliar atualização da cadeia do Prisma: `npm audit --omit=dev --audit-level=high` relatou 3 alertas altos em `deepmerge-ts@7.1.5`, dependência de `@prisma/config` via `@prisma/client@6.19.3`. O reparo automático propõe Prisma 7, uma atualização com quebra de compatibilidade; não foi aplicado nesta validação.
- [x] Conferir uma cópia limpa do código versionado seguindo o README: `npm ci`, `.env`, `npm run db:generate`, `npm run db:setup` e `npm run dev`; a página `/login` respondeu HTTP 200. O `db:setup` prepara o arquivo SQLite antes da migração, necessário neste Windows.
- [x] Commits recentes enviados para `https://github.com/ottoeing/CliniVet`.
- [ ] Gerar o iniciador `.exe` pedido anteriormente; a publicação .NET depende do NuGet, inacessível nesta sessão. O script e o código do iniciador ainda estão locais.
- [ ] Enviar o link do repositório ao RH. Envio externo deve ser feito pelo candidato.

## Comandos executados nesta revisão

- `npm run lint` — passou.
- `npx tsc --noEmit` — passou.
- `npm run test:unit` — 4 testes passaram.
- `npm run test:mutation` — 9 de 9 mutantes detectados.
- `npm run db:setup` — passou em banco novo e no banco existente, sem duplicar migrações.
- `npm run test:api` — passou nesta revisão contra o servidor local, incluindo busca e paginação; as contas de teste foram removidas.
- `npm run build` — passou fora do isolamento do Windows, com fontes locais.
- `npm audit --omit=dev --audit-level=high` — encontrou os 3 alertas descritos acima.
- Instalação limpa — dependências instaladas, migração aplicada e página de login carregada; arquivos temporários removidos.
- Busca e paginação — verificadas em navegador com uma conta temporária de 20 exemplos; a conta foi removida ao final.
- `compose.yaml` e `render.yaml` — sintaxe analisada com o módulo YAML local; execução Docker pendente porque o comando não está instalado neste Windows.

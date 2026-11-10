# Plano de execução - CliniVet

Marque uma atividade concluída substituindo `[ ]` por `[x]`. Cada grupo concluído deve ter seu próprio commit pequeno e coeso.

## Fundação

- [x] Inicializar o projeto com Next.js e TypeScript estrito.
- [x] Configurar Git, branch `main` e repositório remoto.
- [x] Adicionar `lucide-react` como biblioteca de ícones.
- [x] Configurar Prisma com SQLite.
- [x] Criar `.env.example` e seed com usuário de demonstração.
- [x] Definir modelos `User` e `Appointment`.

## Autenticação

- [x] Criar login por e-mail e senha.
- [x] Implementar sessão e logout.
- [x] Proteger as rotas da agenda.
- [x] Criar cards demonstrativos para cada conta recém-criada.
- [x] Restringir a visualização e edição de agendamentos à própria conta.

## Regras de agendamento

- [x] Centralizar tipos e status: `Agendado`, `Coletado` e `Cancelado`.
- [x] Validar campos obrigatórios.
- [x] Bloquear data/hora passada.
- [x] Bloquear dois agendamentos com status `Agendado` no mesmo horário.
- [x] Garantir que as validações sejam executadas no servidor.

## Interface da agenda

- [x] Construir a listagem ordenada pela data/hora da coleta.
- [x] Adicionar filtros por status e data.
- [x] Criar formulário reutilizável para criar e editar.
- [x] Implementar cancelamento sem excluir o registro.
- [x] Exibir estados de carregamento, erro e lista vazia.
- [x] Indicar visualmente os campos obrigatórios.
- [x] Aplicar interações de hover e identidade visual própria.
- [ ] Revisar responsividade para celular e desktop.

## Qualidade e entrega

- [ ] Testar manualmente login, filtros, criação, edição e cancelamento.
- [ ] Adicionar testes automatizados para as regras de validação.
- [ ] Escrever README de execução, decisões e credenciais de demonstração.
- [ ] Preencher a seção "Uso de IA" apenas com evidências reais do desenvolvimento.
- [ ] Conferir variáveis de ambiente e ausência de segredos no Git.
- [ ] Publicar o projeto (opcional).

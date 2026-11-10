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
- [x] Oferecer 20 coletas demonstrativas por conta, com 13 no mesmo dia para exercitar a grade e o "Ver mais".
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
- [x] Permitir selecionar vários status no mesmo filtro.
- [x] Criar formulário reutilizável para criar e editar.
- [x] Implementar cancelamento sem excluir o registro.
- [x] Exibir estados de carregamento, erro e lista vazia.
- [x] Indicar visualmente os campos obrigatórios.
- [x] Alinhar o indicador de foco à borda completa dos campos de autenticação.
- [x] Aplicar interações de hover e identidade visual própria.
- [x] Substituir o favicon padrão pela marca inclinada do CliniVet.
- [x] Oferecer visualizações de calendário por dia, semana e mês.
- [x] Abrir o formulário pelo botão flutuante de nova coleta.
- [x] Manter o botão flutuante visível e clicável ao passar o mouse sobre o calendário.
- [x] Exibir dia, semana e mês em grade contínua, com os modos no cabeçalho principal.
- [x] Personalizar a rolagem do aplicativo.
- [x] Ampliar os exemplos de coletas por conta e uniformizar os cartões do calendário.
- [x] Usar seletor de data integrado ao tema no formulário.
- [x] Centralizar a navegação de datas e compactar visões e filtros em ícones.
- [x] Manter o cabeçalho visível durante a rolagem.
- [x] Adaptar o mês para celular com seleção de dia e lista rolável de eventos.
- [x] Mostrar somente o mês no celular, com filtros no cabeçalho compacto.
- [x] Mostrar eventos excedentes do mês em "Ver mais" no desktop.
- [x] Alinhar "Ver mais" à célula do dia e mostrar descrições fora da área rolável.
- [x] Mostrar editar e cancelar sobre o card apenas no hover ou foco.
- [x] Agrupar editar e cancelar no canto do card sem sobreposição visual.
- [x] Manter os controles de "Ver mais" dentro da borda do próprio card.
- [x] Alinhar nome, status e controles no topo dos cards da agenda no celular.
- [x] Remover a listagem duplicada abaixo da visualização diária no desktop.
- [x] Ancorar o seletor de data do formulário ao respectivo campo.
- [x] Dar espaço ao título do mês e usar inicial maiúscula nos seletores de data.
- [ ] Revisar responsividade para celular e desktop.

## Qualidade e entrega

- [ ] Testar manualmente login, filtros, criação, edição e cancelamento.
- [x] Adicionar testes automatizados para credenciais, campos, data e conflito, com teste de integração da API.
- [x] Escrever README de execução, decisões e credenciais de demonstração.
- [x] Preencher a seção "Uso de IA" apenas com evidências reais do desenvolvimento.
- [x] Conferir variáveis de ambiente e ausência de segredos no Git.
- [ ] Publicar o projeto (opcional).

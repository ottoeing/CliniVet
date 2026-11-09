<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Diretrizes do CliniVet

- Use `lucide-react` para ícones; não introduza outra biblioteca de ícones sem uma necessidade concreta.
- Aplique KISS, YAGNI e DRY com pragmatismo: mantenha o escopo do teste, evite abstrações prematuras e reutilize regras, tipos e componentes quando houver uso real.
- Faça commits pequenos, coesos e semânticos ao concluir cada etapa. Não acumule todas as alterações em um único commit.
- Antes de cada commit, confira o diff e execute a verificação mais relevante para os arquivos alterados.

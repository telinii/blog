# AGENTS.md

Contexto do projeto e convenções para agentes de código.

## Projeto

Blog full stack em dois apps independentes:

- `backend/` — API REST: Express 5, TypeScript, Prisma 7, MariaDB/MySQL, Zod, JWT
- `frontend/` — Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript

Portas: API em `3000`, frontend em `3001`. Detalhes de setup e endpoints no
[`README.md`](README.md).

## Google Stitch

O Stitch é usado para desenhar as telas antes de codar. O design vive no Stitch
Canvas; o código é escrito aqui.

### Autenticação

O Stitch **não aceita mais API key** — o endpoint rejeita com
`API keys are not supported by this API` (HTTP 401). A autenticação é OAuth via
Stitch CLI:

```bash
stitch login    # abre o navegador; token fica em ~/.stitch/credentials.json
stitch status   # confere se está autenticado
```

O token é renovado automaticamente (`canAutoRefresh: true`). Se um comando
falhar com 401, rode `stitch login` de novo — não tente contornar com API key.

### MCP

Configurado em `opencode.json` como servidor local:

```json
{ "mcp": { "servers": { "stitch": { "type": "local", "command": ["stitch", "mcp", "start"] } } } }
```

Isso expõe 7 tools genéricas. **Atenção:** as skills do Stitch foram escritas
para o MCP remoto e citam tools específicas que não existem aqui. Use a tabela
abaixo para traduzir.

| Skill pede | Use |
| --- | --- |
| `list_projects` | `stitch_find({ resource: "projects" })` |
| `get_project` | `stitch_get({ resource: "project", id })` |
| `create_project` | `stitch_create({ resource: "project", body: { title } })` |
| `list_screens` | `stitch_find({ resource: "screens", project })` |
| `get_screen` | `stitch_get({ resource: "screen", id, project })` |
| `generate_screen` / `generate_screen_from_text` | `stitch_generate({ resource: "screens", project, prompt, device })` |
| `edit_screens` | `stitch_edit({ resource: "screen", id, project, patch: { prompt } })` |
| `list_design_systems` | `stitch_find({ resource: "design-systems", project })` |
| `create_design_system` | `stitch_create({ resource: "design-system", project, body: { designSystem: { ... } } })` |

Fora do escopo das tools, use o CLI:

```bash
stitch upload design      # vincula um DESIGN.md a um projeto
stitch download           # baixa HTML + screenshot de uma tela
stitch serve              # preview local das telas
stitch open project       # abre o projeto no Canvas
```

`stitch_generate` é assíncrono e pode demorar. Timeout na resposta não significa
falha: confirme com `stitch_find`/`stitch_get` antes de gerar de novo, senão você
cria telas duplicadas.

### Skills instaladas

Em `.agents/skills/` (com symlinks em `.claude/skills/`). A pasta é gitignored —
para reinstalar, copie de <https://github.com/google-labs-code/stitch-skills> e
renomeie o `name:` do frontmatter para kebab-case igual ao diretório.

Fluxo recomendado:

1. `generate-design` — gerar a primeira tela
2. `design-md` — extrair o `DESIGN.md` da tela aprovada
3. `enhance-prompt` — prompts das telas seguintes
4. `stitch-loop` — converter as telas em código
5. `remotion` — vídeo walkthrough do site

`react-native`, `shadcn-ui` e `react-vite-dashboard` não estão instaladas: não
fazem sentido para este stack.

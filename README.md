# FlipClock — relógio flip, Pomodoro e ferramentas de estudo

Um mesmo app Angular 20 distribuído em **três alvos**:

| Alvo | Como roda | Onde |
| --- | --- | --- |
| **Site / PWA** | GitHub Pages + service worker | https://jeverson-oliveira.github.io/my-flip-clock/ |
| **Extensão do Chrome** | Manifest V3, popup 400×600 | `dist/extension` (carregar sem empacotamento) |
| **Widget desktop** | Tauri v2, janela transparente sempre no topo | Windows (`.msi`/`.exe`) e Ubuntu (`.deb`/`.AppImage`) |

## Funcionalidades
- **Flip Clock** (`/`): horas/minutos/segundos em cards flip, atualização a cada 1s
- **Pomodoro** (`/pomodoro`): durações configuráveis e persistentes, ciclos 4×, notificações e histórico diário de foco
- **Tarefas** (`/tarefas`): checklist com `localStorage`
- **Estatísticas** (`/estatisticas`): pomodoros, tarefas, tempo total e minutos de hoje
- **Sons de foco** (`/foco`): ruído/chuva/ondas gerados via Web Audio, continuam ao navegar
- **Widget** (`/widget`): mini relógio + Pomodoro, arrastável e sempre no topo

## Stack
Angular 20.3 + TypeScript 5.9 + zone.js 0.15 + RxJS 7.8 · Tauri 2.12 (+ Rust) · Workbox/`@angular/service-worker` · Karma/Jasmine.

O mesmo código-fonte é compilado com configurações diferentes (`angular.json`):

| Configuração | Saída | `baseHref` | Service worker |
| --- | --- | --- | --- |
| `production` | `docs/` | `/my-flip-clock/` | sim (PWA) |
| `extension` | `dist/extension/` | `./` | não |
| `widget` | `dist/widget/` | `./` | não |

O host é detectado em `src/app/core/platform.ts`:
- `chrome-extension://` → hash routing + classe `host-extension` (popup 400×600)
- `__TAURI_INTERNALS__` → hash routing, classe `host-tauri` (fundo transparente) e abre em `#/widget`

## Scripts
```bash
npm install                # --legacy-peer-deps (typescript-eslint 8.34 × TS 5.9)
npm start                  # site em http://localhost:4200
npm run build              # site → docs/ (PWA)
npm run build:extension    # extensão → dist/extension
npm run build:widget       # widget → dist/widget
npm run lint
npm test
npm run deploy             # publica o site no gh-pages
```

## Extensão do Chrome
```bash
npm run build:extension
# chrome://extensions → modo desenvolvedor → "Carregar sem compactação" → dist/extension
```
O popup abre o app inteiro (relógio, Pomodoro, tarefas, stats, sons). O timer é calculado por timestamp e persistido, então continua correto ao fechar e reabrir o popup — mas notificações com o popup fechado ainda não são disparadas por um service worker em segundo plano (próximo passo).

## Widget desktop (Tauri)
```bash
npm run build:widget
npm run tauri dev            # requer Rust + WebKitGTK (Linux)
npm run tauri build          # gera .deb/.AppImage/.rpm (Linux) e .msi/.exe (Windows)
```
- Janela 340×180, `decorations: false`, `transparent: true`, `alwaysOnTop: true`, `skipTaskbar: true`
- Arraste pela barra superior (`data-tauri-drag-region`), `✕` esconde para a bandeja
- Bandeja: clique esquerdo mostra/oculta, menu com **Mostrar/Ocultar** e **Sair** (`src-tauri/src/lib.rs`)

Dependências Linux (Ubuntu 24.04):
```bash
sudo apt install libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev patchelf
```

## CI
- `.github/workflows/deploy.yml` — build do site + deploy no Pages e artefato `flipclock-chrome-extension`
- `.github/workflows/desktop.yml` — matriz Ubuntu/Windows, gera os instaladores; em tags `v*` anexa ao release (rascunho)

## Estrutura
```
src/app/components/flip-clock/     # relógio
src/app/components/pomodoro-timer/ # pomodoro
src/app/components/widget/         # mini widget desktop
src/app/components/{task-list,stats,focus-sounds}/
src/app/core/platform.ts           # detecção site/extensão/Tauri
src/app/services/                  # pomodoro, tarefas, sons
extension/manifest.json            # Manifest V3 (copiado no build)
src-tauri/                         # app Tauri (Rust + config + ícones)
```

## Git
`/.gitignore` ignora `/docs`, `/dist`, `/src-tauri/{target,gen}`, `/.angular`, `/node_modules` — `docs/` é publicado apenas via GitHub Actions (branch `gh-pages` não é mais usada).

## Snap (legado)
`snapcraft.yaml` empacota o conteúdo de `docs/`:
```bash
snapcraft pack
```

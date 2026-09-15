# FlipClock — Angular 20

Relógio flip + Pomodoro Timer com Angular 20 (standalone components, lazy routes, application builder).

## Funcionalidades
- **Flip Clock** (`/`): horas/minutos/segundos em cards flip, atualização a cada 1s (`flip-clock.component.ts:11`)
- **Pomodoro** (`/pomodoro`): 25/5/20 min, ciclos 4×, centésimos, `PomodoroService` com `BehaviorSubject` (`pomodoro.service.ts:14`)
- **Menu** lateral fixo com navegação acessível (`menu.component.html:1`)
- Build para GitHub Pages (`docs/` ignorado no git, deploy via `gh-pages`)

## Stack
Angular 20.3 + TypeScript 5.9 + zone.js 0.15 + RxJS 7.8 — builder `application` (`angular.json:14`), output `docs/` com `.nojekyll` e `404.html` para SPA.

## Scripts
```bash
npm install
npm start          # ng serve http://localhost:4200
npm run build      # ng build → docs/ (application builder, lazy chunks)
npm run lint       # ng lint (angular-eslint 20)
npm test           # ng test (Karma)
npm run deploy     # build --base-href /my-flip-clock/ + gh-pages
```

## Estrutura
```
src/app/components/flip-clock/   # relógio
src/app/components/pomodoro-timer/ # pomodoro + flip cards
src/app/components/menu/         # navegação
src/app/services/pomodoro.service.ts
src/app/app.routes.ts            # lazy loadComponent
```

## Git
`/.gitignore` ignora `/docs`, `/.angular`, `/node_modules`, `*.log`, `.env` — `docs/` é artefato de build, versionado apenas via `gh-pages`.

## Snap
`snapcraft.yaml` usa `base: core24`, `plugin: dump`, `source: docs` (válido YAML sem duplicate `parts`).
```bash
snapcraft pack
snap install flip-clock_1.0.0_amd64.snap
flip-clock  # xdg-open /usr/share/flip-clock/index.html
```

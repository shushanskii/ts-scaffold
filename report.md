# Отчёт: как заставить декларированное исполняться машинно

Два вопроса, заданных владельцем репозитория:

1. **Как обеспечить границы слоёв**, которые обещают `README.md` и `conventions/*.md`, но которые сейчас никто не проверяет?
2. **Как обеспечить CI** — чтобы гейт нельзя было обойти и чтобы тесты вообще начинали когда-нибудь запускаться?

Отчёт исследовательский: сначала источники и замеры, потом варианты и рекомендация. Ничего в код не изменено; все эксперименты откатаны, `git status` на момент написания — чистый, кроме этого файла.

- Репозиторий: `ts-scaffold` @ `dd68bda`, ветка `fix/catalog-advisories` (запушена)
- Дата: 2026-10-14
- Инструменты на момент замеров: fallow 3.10.0, pnpm 11.11.0, Node 24.18.0 (local) / `engines.node: ">=22"`

---

## 0. Исходная точка: замеры, а не догадки

### Что декларировано

| Документ | Утверждение |
|---|---|
| `conventions/redux.md` | направление: `types → schemas → api → actions → reducers → sagas → store → selectors → hooks → components`; «**A saga therefore cannot use a selector**»; «`reducers/` never imports `store/`» |
| `conventions/react.md` | «**Components may not import `reducers/` directly** — state reaches the UI through a hook» |
| `conventions/project.md` | «`api` and `web` never import each other. Both may import `shared`; `shared` imports nothing» |
| `README.md` | «Layers only import leftwards, **and fallow enforces it**» |

### Что проверяется фактически

В `.fallowrc.json` — три зоны, по пакету (`packages/shared/src/**`, `apps/api/src/**`, `apps/web/src/**`). Правил *между слоями внутри пакета* нет ни одного.

Проверено подставными импортами на текущем дереве (fallow 3.10.0, флаг `--boundary-violations`):

| Нарушение | Текущий конфиг | Комментарий |
|---|---|---|
| `components/App` → `#reducers/todos` | **не ловит** | прямо запрещено `react.md` |
| то же, относительным путём `../../reducers/todos` | не ловит | subpath-imports и относительные резолвятся одинаково |
| `sagas` → `#selectors/todos` | **не ловит** | прямо запрещено `redux.md` |
| новый бакет `apps/web/src/utils/**` | никем не замечен | зона не заведёт правил на файл, которого нет в паттернах |
| `web` → `@app/api` | **ловит** (`web → api`) | пакетный граф уже под защитой |
| `web` → `../../../api/src/...` (в обход имени пакета) | не boundary, но **unresolved import → гейт красный** | срабатывает по другой причине, но срабатывает |

**Вывод:** фраза README верна на уровне пакетов и неверна на уровне слоёв. Дыра — только внутри пакета.

### Второй промах: гейт, который не запускается

- `pnpm run audit` = typecheck + Biome + fallow. **`pnpm test` в него не входит.**
- Единственный исполнитель гейта — husky `pre-commit`, обходится `--no-verify`.
- CI нет вообще: ни `.github/`, ни другой.
- За всю историю репозитория 32 существующих теста не были запущены автоматически ни разу.

### Проверка «а работает ли вообще то, что мы чиним» (снимок состояния)

Прогоны без кэша (`turbo run … --force`, иначе `FULL TURBO` и логи лишь воспроизводятся):

| Команда | Результат |
|---|---|
| `pnpm test` | 32 теста / 6 файлов — зелёные (shared 5, api 11, web 16), 1.8s |
| `pnpm run build` | `tsup` → `apps/api/dist/main.js` 3.78 KB; `vite build` → 138 модулей, 320.66 KB (gzip 102.52 KB), 0.6s |
| `pnpm run audit` | typecheck 3/3, Biome 42 файла без замечаний, fallow «No issues found» |
| `pnpm audit --prod` | No known vulnerabilities found |
| `pnpm install --frozen-lockfile` | Already up to date (лок-файл синхронен) |
| `pnpm dedupe --check` | exit 0 |
| `pnpm run audit --force` | **падает** (и вариант `pnpm run audit -- --force` тоже) |

---

## 1. Вопрос A — границы слоёв

### 1.1 Что говорят источники

**Fallow** (уже зависимость репозитория) умеет заметно больше, чем использует конфиг.
Источник: <https://fallow.tools/docs/configuration/boundaries/> и `node_modules/fallow/schema.json`.

- Зоны (`patterns`), правила (`from` / `allow` / `allowTypeOnly`), плюс две секции, которые мы не используем:
  - **`coverage.requireAllFiles`** — репортит файлы, не попавшие ни в одну зону (`boundary-coverage`);
  - **`calls.forbidden`** — запрет вызовов в зоне (`{ from, callee }`, например `console.*` или `child_process.*` в домене).
- Ключевая семантика, из-за которой мы и сидим с дырой (дословно из доков):
  > Files that match no zone are **unrestricted**. … **No rule entry** means the zone is unrestricted.
- Зона = первое совпавшее правило (`first match wins`), поэтому порядок списка значим: тестовая зона идёт первой.
- **Пресеты** `layered` / `hexagonal` / `feature-sliced` / `bulletproof` строят зоны как `{rootDir}/<zone>/**`, где `rootDir` берётся из `tsconfig.json`. Документация прямо пишет, что для монорепо с раздельными `src` пресеты не годятся и даёт образец ручных зон на пакет — то есть наш случай.
- **`autoDiscover`** делает каждую непосредственно дочернюю директорию зоной `parent/child` и проверяет импорты между соседями как кросс-зонные. Но: «The parent rule automatically allows its discovered children», а порождённые правила «keep the original `allow` list exactly» — направление слоёв из `autoDiscover` не появляется.

Альтернативы, которые называют в том же контексте (dependency-cruiser, eslint-plugin-boundaries, import-linter, ArchUnitTS, rev-dep):

| Инструмент | За | Против именно здесь |
|---|---|---|
| **fallow boundaries** | 0 новых зависимостей, уже в гейте, Rust-скорость, есть `coverage`, `calls`, `--format github-annotations`/SARIF | направление слоёв описывается руками в JSON |
| **dependency-cruiser** | зрелый, конфиг на JS, умеет сирот/циклы/«зависимости не тяжелее соседа» | +зависимость, второй gate-тул с пересечением зон ответственности с fallow |
| **eslint-plugin-boundaries** | самая богатая семантика (parent/child/sibling, «не глубже чем на слой») | требует ESLint, а репозиторий сознательно на Biome; правил на импорты в Biome нет |
| **ArchUnitTS / «architecture as tests»** | правило = красный тест, видно в `pnpm test` | исполняется только там, где запущены тесты; тесты сейчас вне гейта (см. вопрос B) |
| **TS project references по слоям** | жёсткость на уровне компилятора | 10+ tsconfig, переусложнение для шаблона, который кто-то будет копировать |

### 1.2 Что я проверил руками, а не взял из доков

Кандидат-конфиг (17 зон / 17 правил, `/tmp/fallow-layers.json`) прогнан на этом дереве:

| Проверка | Результат |
|---|---|
| чистое дерево | `✓ No issues found` — то есть конфиг не требует ни одного изменения в коде |
| `components/App` → `#reducers/todos` | **ловит**: `web-components → web-reducers` |
| то же относительным путём | ловит |
| `sagas` → `#selectors/todos` | **ловит**: `web-sagas → web-selectors` |
| `web` → `@app/api` | ловит: `web-components → api-entry` |
| `@app/shared` из компонентов | резолвится в зону `packages/shared/src/index.ts` (проверено временным запретом — 2 находки), то есть кросс-пакетные правила работают по имени пакета |
| новый бакет `apps/web/src/utils/**` | `Boundary coverage: no matching boundary zone` |

⚠️ **Нюанс, которого нет в документации.** Импорт проверяется только у файлов, достижимых от точки входа: файл-проба `apps/web/src/components/__probe.tsx` с нарушением прошёл гейт молча. Поймал его только `dead-code` как *unused file*. То есть граница под защитой **только при едином гейте**: `boundaries` закрывает достижимый код, `dead-code` — недостижимый. По-отдельности обе проверки оставляют щель.

### 1.3 Варианты

| Вариант | Суть | Цена | Вердикт |
|---|---|---|---|
| **A1** ⭐ | Ручные слоёвые зоны в `.fallowrc.json` + `coverage.requireAllFiles` | один файл, 0 зависимостей, конфиг уже валидирован зелёным | **брать** |
| **A2** | `autoDiscover` вместо ручных зон | меньше строк | только как дополнение (изоляция соседних `components/<X>`); направление слоёв не даёт |
| **A3** | Пресет (`layered` / `bulletproof` / FSD) | 3 строки | отвергнут: требует переименовать бакеты под `src/<zone>/**`, то есть переписать `conventions/*` и все subpath-imports — а это и есть предмет демонстрации шаблона |
| **A4** | A1 + «architecture test» в vitest поверх (в духе ArchUnitTS) | +1 тест | отложить: для правил, которые fallow не выражает (например «сага не зовёт `select()`») |
| **A5** | Ничего не enforcement, убрать из README обещание | правка трёх `*.md` | честнее, чем молчать, но хуже A1: правка A1 дешевле и даёт защиту вместо снятия требования |

**Рекомендация: A1** (+ `coverage.requireAllFiles` обязательно, иначе новый бакет молча выпадает из правил). Дополнительно — тест-ловушка, чтобы следующий, кто «упростит» конфиг до трёх зон, получил красный гейт.

---

## 2. Вопрос B — CI

### 2.1 Что говорят источники

- **pre-commit — не гейт.** Он обходится `--no-verify`; отсюда стандартная связка «CI + required status checks», а хук остаётся быстрой локальной пристрелкой.
- **Официальный гайд Turborepo** — <https://turborepo.dev/docs/guides/ci-vendors/github-actions>: checkout → setup-node с кэшем → install → `turbo run …`. Кэш `.turbo` через `actions/cache` полезен только внутри одного рана; настоящий прирост даёт Remote Cache (OIDC — рекомендуемый путь, либо PAT-секрет).
- **Scope-фильтры** — <https://turborepo.dev/docs/core-concepts/filtering>: `--filter=...[origin/main]` и variants `[main...my-feature]`. Требуют истории git (`fetch-depth`), и дают лишний способ получить ложно-зелёный прогон.
- **pnpm в Actions** — <https://github.com/pnpm/action-setup>: для pnpm ≥ 11 есть младший <https://github.com/pnpm/setup> (`pnpm/setup@v1`) — один шаг ставит pnpm (берёт версию из `packageManager`, у нас `pnpm@11.11.0`) и рантайм (`runtime: node@22`), и кэширует store. Важно: по умолчанию он сам выполняет `pnpm install`, поэтому нужен `install: false`, чтобы `--frozen-lockfile` оставался отдельным явным шагом.
- **Audit в PR-гейте hard-fail делают редко**: транзитивный advisory в dev-зависимости блокирует несвязанный PR. Консенсус — `--audit-level`, отдельный/еженедельный прогон, плюс робот обновлений.
  - Dependabot поддерживает pnpm catalogs с 02.2025: <https://github.blog/changelog/2025-02-04-dependabot-now-supports-pnpm-workspace-catalogs-ga/>
  - Renovate — <https://docs.renovatebot.com/modules/manager/npm/>
  - ⚠️ caveat: <https://github.com/dependabot/dependabot-core/issues/14794> — на pnpm 11 бывают PR, где меняется только лок-файл, а манифест остаётся `catalog:`. Это ровно наша связка (в этом репозитории `pnpm update <pkg>` вообще ничего не двигает, потому что версии — `catalog:`-ссылки), значит автопрапы обязаны проходить тот же гейт, а не мержиться вслепую.
- **Гигиена Actions** (есть почти в каждом чек-листе): `permissions: contents: read` на уровне workflow, `concurrency` + `cancel-in-progress` (<https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency>), `persist-credentials: false`, пин actions, отсутствие секретов в fork-PR.
- **Fallow заточен под CI из коробки:** `--format github-annotations` / `github-summary` / `--ci` (= SARIF + `--fail-on-issues`), `fallow audit --changed-since main` как PR-гейт «только изменённое», `fallow report` для аннотаций. `fallow ci-template` есть, но шаблон только GitLab.
- **Дешёвая страховка, которую мы заслужили вчера:** `pnpm dedupe --check` существует и на текущем лок-файле зелёный — возврат дублей (см. случай с `qs`) станет красным прогоном, а не «ой, снова две версии».
- Справочно по pnpm 11: `allowBuilds` в репозитории уже используется; `minimumReleaseAge` и `strictDepBuilds` сейчас не выставлены (`pnpm config get` → undefined), то есть это опции, а не дефолт.

### 2.2 Варианты

| Вариант | Что | Цена | Когда брать |
|---|---|---|---|
| **B1** ⭐ | Один `ci.yml`, один job, **полный** прогон всегда: install `--frozen-lockfile` → `dedupe --check` → `verify` (typecheck + Biome + fallow + тесты + обе сборки) → advisory non-blocking | ~1.5–2 мин | репо на 3 пакета: тесты 1.8s, билд 0.6s — экономить не на чём |
| **B2** | 3 параллельных job (verify / test / build) + артефакты | 3× install; чище логи | когда time-to-first-signal станет болью |
| **B3** | affected-only (`--filter=...[origin/$BASE]`) + Remote Cache | `fetch-depth`, база, секреты, лишние ложные зелени | десятки пакетов |
| **B4** | Только гейт, без билда | минимум | не советует: `tsc` у нас ничего не эмитит, ошибки сборки видны только билдом |

### 2.3 Сопутствующее, без чего B1 будет врать

1. **`pnpm run verify` = `audit` + `test` + `build`.** Одна команда для хука, CI и README; тогда «the single verification command» перестаёт расходиться с реальностью.
2. **Починить `pnpm run audit --force`.** Проверено: падают и `pnpm run audit --force`, и `pnpm run audit -- --force` — pnpm дописывает флаг в конец цепочки, и его получает `fallow dead-code --fail-on-issues --force` (`unexpected argument`). Из-за этого холодный прогон гейта собирается из трёх команд вручную.
3. **Branch protection** (`main` ← required check `verify`) — единственное, что нельзя закоммитить. Либо включить в UI / `gh api`, либо задокументировать в README как шаг «Making it yours», иначе скопированный шаблон снова стартует без гейта.
4. Опционально: `.github/dependabot.yml` (pnpm, корневой каталог, grouped, без auto-merge) и `fallow --format github-annotations` отдельным шагом, чтобы fallow писал прямо по строкам PR.
5. Совмещённый прогон `pnpm test` локально остаётся обязательным до появления B1 — сейчас он единственный способ узнать, что тесты вообще есть.

---

## 3. План

Два независимых маленьких PR.

**PR 1 — `fix(fallow): enforce the layer direction the conventions already claim`** (вариант A1)
- `.fallowrc.json`: слоёвые зоны для `shared` / `api` / `web` + правила по направлению из `conventions/redux.md`, тестовая зона первой, `coverage.requireAllFiles: true` с `allowUnmatched` на `apps/web/index.html` и конфиги сборщиков;
- пакетный граф (`shared ← api`, `shared ← web`, `api`/`web` не пересекаются) сохраняется как подмножество правил;
- тест-ловушка на «конфиг схлопнули до трёх зон»;
- проверка: `fallow list --boundaries` (все зоны с ненулевым числом файлов) → `pnpm run audit` зелёный → подставы `component→reducer` и `saga→selector` красные.

**PR 2 — `ci(repo): run the gate where it cannot be skipped`** (вариант B1)
- `.github/workflows/ci.yml`: `push` в `main` + `pull_request`, `permissions: contents: read`, `concurrency` + `cancel-in-progress`, `actions/checkout@v5` с `persist-credentials: false`, `pnpm/setup@v1` (`runtime: node@22`, `cache: true`, `install: false`), `pnpm install --frozen-lockfile`, `pnpm dedupe --check`, `pnpm run verify`, advisory-шаг с `continue-on-error`;
- корневые скрипты: `verify` = audit + test + build; фикс проброса флага в `audit`;
- README: привести формулировку гейта в соответствие и добавить шаг про branch protection.

Черновики: `.fallowrc.json` — провалидирован (зелёный на текущем коде, обе подставы ловятся), `ci.yml` — YAML провалидирован, набор шагов соответствует списку выше.

### Открытые решения владельца

1. A1 как рекомендовано, или A4 (правила как тесты) / A5 (снять обещание с README)?
2. B1 как рекомендовано, или B2/B3?
3. Включать ли Dependabot в PR 2, или завести отдельным шагом (с учётом caveat про `catalog:`)?
4. Ветка для PR: продолжение `fix/catalog-advisories` или новая от `main`?

---

## Приложение. Как воспроизвести замеры

```bash
# базовое состояние
pnpm install --frozen-lockfile
pnpm exec turbo run test --force      # 32 теста
pnpm exec turbo run build --force     # tsup + vite
pnpm run audit                        # typecheck + Biome + fallow
pnpm audit --prod
pnpm dedupe --check

# текущий конфиг зон и число файлов в них
./node_modules/.bin/fallow list --boundaries

# проба: компонент импортирует редьюсер (запрещено conventions/react.md)
#   без слоёвых зон — «No issues found», со слоёвыми — web-components → web-reducers
python3 - <<'EOF'
p = 'apps/web/src/components/App/index.tsx'
s = open(p).read()
open(p, 'w').write('import { setLoading } from "#reducers/todos";\n'
                   + s.replace('export function App', 'export const __p = setLoading;\n\nexport function App'))
EOF
./node_modules/.bin/fallow dead-code --boundary-violations   # текущий конфиг
git checkout -- apps/web/src/components/App/index.tsx
```

Замечание по методике: файл-проба, не достижимый от точки входа, проверкой границ **не** проверяется (см. §1.2) — правьте существующий достижимый файл и откатывайте его.

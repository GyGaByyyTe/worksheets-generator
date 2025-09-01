# Генератор Учебных Заданий

Это монорепозиторий на базе pnpm workspace для создания интерактивных учебных заданий
и рабочих листов для детей. Проект генерирует SVG-страницы с различными типами заданий.

## Архитектура

Проект состоит из трех пакетов:

- `@wg/core` — основная логика генерации заданий (реэкспорт из `scripts/`)
- `@wg/server` — Express REST API сервер для генерации через HTTP
- `@wg/web` — Next.js 15 веб-интерфейс на TypeScript с App Router

## Типы заданий

### Доступные генераторы заданий:

**`clocks`** — Задания с часами и временем

- Обучение определению времени по аналоговым часам
- Различные варианты положения стрелок
- Подходит для изучения часов и минут

**`weights`** — Задания на взвешивание и сравнение

- Сравнение предметов по весу с помощью весов
- Логические задачи на определение более тяжелых/легких объектов
- Развитие навыков анализа и сравнения

**`connect-dots`** — Соединение точек по номерам

- Классические задания "соедини точки"
- Поддержка загрузки собственных изображений
- Автоматическое преобразование картинок в точечные контуры
- Настраиваемое количество точек и сложность

**`find-parts`** — Поиск частей и фрагментов

- Задания на поиск недостающих деталей
- Развитие внимания и пространственного мышления
- Работа с геометрическими формами

**`postman`** — Упорядочивание чисел (почтальон)

- Задания на сортировку чисел по возрастанию/убыванию
- Обучение порядковому счету
- Логические цепочки с числами

**`spot-diff`** — Найди отличия между картинками

- Классические задания на внимательность
- Поиск различий между двумя похожими изображениями
- Развитие зрительного восприятия

**`addition`** — Примеры на сложение

- Математические задачи для начальной школы
- Различные уровни сложности
- Визуальное представление примеров

**`maze`** — Лабиринты различной сложности

- Генерация лабиринтов разного размера
- Настраиваемая сложность прохождения
- Развитие логического мышления и планирования

## Технологии

- **Node.js** + **TypeScript** 5.6.2
- **React** 19.0.0 + **Next.js** 15.0.0
- **Express** 4.19.2 для API
- **PostgreSQL** 15/16 + **Prisma** ORM для хранения результатов и auth
- **Sharp** 0.33.4, **Potrace** 2.1.0 для обработки изображений
- **pnpm** как пакетный менеджер

## Предварительные требования

- Node.js 18+
- pnpm 8+ (рекомендуется активировать через Corepack)

```powershell
corepack enable
corepack prepare pnpm@latest --activate
```

## Установка

Из корневой директории:

```powershell
pnpm install
```

## Development

You can start both the API server and the web app in parallel:

```powershell
pnpm dev
```

Or in separate terminals:

```powershell
pnpm dev:server  # starts @wg/server on http://localhost:4000
pnpm dev:web     # starts @wg/web on    http://localhost:3000
```

The web app will call the API at `http://localhost:4000` by default. To point the UI to a different backend URL, set the environment variable before running the web app:

```powershell
$env:NEXT_PUBLIC_API_URL = "http://localhost:4000"
pnpm dev:web
```

## Build (production)

Build all workspace packages:

```powershell
pnpm build
```

Start production servers (in parallel):

```powershell
pnpm start
```

Or start separately in two terminals:

```powershell
pnpm start:server
pnpm start:web
```

## REST API (summary)

- `GET /health` — health check
- `GET /tasks` — available generator keys
- `POST /generate/worksheets` — body: `{ days: number, tasks: string[], seed?: any, imageDots?: Row[] }`
  - Returns JSON with same structure as before, but file links are DB-backed: `/files/:pageId`, and previews under `/generations/:genId/day/:day/index.html`. Anonymous mode is allowed (no token required) — such generations have no user.
- `GET /files/:id` — streams a single generated page from DB (SVG/PNG/JPEG)
- `GET /generations/:genId/day/:day/index.html` — simple preview HTML for a day
- Pictures (optional feature):
  - `GET /pictures/categories` — returns `{ categories: string[], subcategories: Record<string,string[]> }`
  - `GET /pictures/search?category=Animals&subcategory=Cats&type=silhouette` — returns `{ count, images[] }` from the upstream provider. Requires PICTURE_API_* to be configured; otherwise returns HTTP 501.
- Auth (optional):
  - `POST /auth/register` — `{ email, password }`
  - `POST /auth/login` — `{ email, password }` → `{ token }` (send as `Authorization: Bearer <token>`)
  - `GET /me` — returns current user or null

Notes:
- The backend now stores results in a PostgreSQL database and serves files via API. Static `/static` is kept for legacy assets but is not used for newly generated results.

## Project Notes

- The legacy monolithic `server.js` and NPM `package-lock.json` were removed in favor of pnpm workspaces and the `@wg/server` package.
- Demo artifacts `result.svg` and `result.jpeg` were removed.
- Sample asset `base.jpg` is kept for local debug (`scripts/debug-dots.js`).
- The `scripts/` directory remains because `@wg/core` re-exports gen logic from there (minimal-change refactor). A later step may move sources fully under `packages/core`.

## Структура workspace

### Скрипты корневого уровня

- `pnpm dev` — запуск сервера и веб-приложения параллельно
- `pnpm dev:server` — только сервер
- `pnpm dev:web` — только веб-приложение
- `pnpm build` — сборка всех пакетов
- `pnpm start` — запуск в продакшне (параллельно)
- `pnpm start:server` — только сервер в продакшне
- `pnpm start:web` — только веб в продакшне
- `pnpm test` — тесты для всех пакетов
- `pnpm format` — форматирование кода с Prettier

## Packages

- `packages/core`
  - build: none (JS sources)
  - test: prints a simple ok message
- `packages/server`
  - dev/start: `node src/index.js`
  - build: none (JS sources)
- `packages/web`
  - dev: Next dev on port 3000
  - build/start: Next build and start (port 3000)



## Local setup on Windows

If you just cloned the repo on a Windows machine and want to start developing, follow:

- LOCAL_SETUP_WINDOWS.md — step-by-step guide (PowerShell), including PostgreSQL, Prisma, env vars, and running dev servers.


## Изображения для задания "connect-dots" (опционально)

Для задания «соедини точки» можно:
- загрузить своё изображение из веб‑интерфейса (PNG/JPG), либо
- ничего не загружать — тогда сервер, если выбрано задание `connect-dots`, попытается взять случайную картинку из папки ассетов.

Папка ассетов для этого задания:
- `packages\server\assets\connect-dots`

Поддерживаемые форматы файлов в этой папке: `.png`, `.jpg`, `.jpeg`, `.webp`.

Примечания:
- Если в папке ассетов нет подходящих картинок, при старте сервера вы увидите предупреждение в консоли:
  `YOU MAY WANT TO ADD PICTURES: place .png/.jpg/.jpeg/.webp files into ...`.
- Папка может быть пустой из коробки — это нормально. Просто добавьте несколько изображений, чтобы включить случайную подстановку.
- При загрузке через веб UI сервер использует загруженное изображение; если оно отсутствует или имеет неподдерживаемый формат, используется случайное изображение из ассетов (если есть).


## Optional: External Picture API for "connect-dots"

The web UI now supports picking a random image by category/subcategory for the "connect-dots" task. This feature uses an external image provider (Pixabay) via the backend.

Environment variables (optional):
- PICTURE_API_URL — default provider base URL, e.g., https://pixabay.com/api/
- PICTURE_API_KEY — your Pixabay API key

Behavior:
- If these vars are not configured on the server, the endpoint `/pictures/search` will respond with 501 Not Implemented, and the UI may not be able to pick random images.
- When configured, the server exposes:
  - GET /pictures/categories — lists categories/subcategories for the UI
  - GET /pictures/search?category=Animals&subcategory=Cats&type=silhouette — returns a list of candidate images from the upstream provider.

Note: Local assets fallback for connect-dots (`packages\server\assets\connect-dots`) can still be used for random images if present, but the preferred way forward is via the external API.

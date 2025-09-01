# Развёртывание worksheets-generator на VPS (Ubuntu 24 + Node.js + NGINX + SSL)

Данный репозиторий — monorepo на pnpm с тремя пакетами:

- `@wg/web` — фронтенд на Next.js (порт 3000);
- `@wg/server` — бекенд на Express (порт 4000), генерирует задания, сохраняет результаты в PostgreSQL и отдаёт их через API (`/files/:id`, предпросмотр `/generations/:genId/day/:day/index.html`).
- `@wg/core` — библиотека со скриптами генерации/обработки.

Цель: рабочее приложение по адресу https://kids.does.cool/.
Фронтенд запрашивает API по `NEXT_PUBLIC_API_URL`. Мы будем проксировать `/api/*`, а также `/files/*` и `/generations/*` на бекенд (порт 4000) через NGINX, остальное — на фронтенд (порт 3000).

Ниже — минимально необходимый, но полный и актуальный (на 2025 год) гайд.

---

## 1. Подготовка сервера

Предполагается чистый сервер Ubuntu 24.x LTS и доступ по SSH (пользователь с sudo, например `ubuntu` или `root`).

### 1.1. Обновление системы

```
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg ufw
```

### 1.2. Брандмауэр (UFW)

Разрешим только SSH, HTTP, HTTPS:

```
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

### 1.3. Node.js 22 LTS и pnpm

Рекомендуем Node.js 22 LTS (совместимо с Next.js 15 и React 19). Установим через официальный репозиторий NodeSource:

```
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
npm -v
```

Установим pnpm глобально:

```
sudo npm i -g pnpm@9
pnpm -v
```

### 1.4. PM2 для процесс-менеджмента

```
sudo npm i -g pm2@latest
pm2 -v
```

### 1.5. NGINX

```
sudo apt install -y nginx
nginx -v
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl status nginx --no-pager
```

---

## 2. Подготовка домена и DNS

- Убедитесь, что домен `kids.does.cool` указывает A-запись на IP вашего сервера.
- Проверьте распространение DNS, например, командой:

```
dig +short kids.does.cool
```

Она должна вернуть IP вашего сервера.

---

## 3. Получение кода на сервере

Выберите директорию для приложений, например `/opt/apps`:

```
sudo mkdir -p /opt/apps
sudo chown -R $(whoami):$(whoami) /opt/apps
cd /opt/apps
```

Клонируйте репозиторий (замените на ваш реальный URL, если он приватный — настройте SSH-ключи):

```
git clone https://github.com/<your-org-or-user>/worksheets-generator.git
cd worksheets-generator
```

Если у вас уже скопирован проект и вы доставляете артефактами — просто положите его в `/opt/apps/worksheets-generator`.

---

## 4. Установка зависимостей и сборка

В проекте используется pnpm workspace. Команды есть на корне.

```
cd /opt/apps/worksheets-generator
pnpm install --frozen-lockfile
pnpm build
```

Сборка выполнит:

- `@wg/web`: `next build`;
- `@wg/server` и `@wg/core`: сборки не требуются (по пакетам прописаны заглушки).

---

## 5. Переменные окружения

Фронтенду нужно знать публичный URL API. Мы будем проксировать API под `/api`. Поэтому:

- на фронтенде установим: `NEXT_PUBLIC_API_URL=https://kids.does.cool/api`

Создайте файл окружения для фронтенда:

```
cp packages/web/.env.example packages/web/.env
```

Откройте и при необходимости отредактируйте:

```
nano packages/web/.env
```

Содержимое по умолчанию:

```
NEXT_PUBLIC_API_URL=https://kids.does.cool/api
```

Примечания:

- Переменная `NEXT_PUBLIC_*` читается как на сервере Next.js, так и в браузере.
- На локальной разработке по умолчанию (без .env) фронтенд стучится на `http://localhost:4000` (см. `packages/web/app/lib/api.ts`).

Переменные окружения для бекенда (@wg/server):

- `DATABASE_URL` — строка подключения PostgreSQL, например:
  - `postgresql://wg_user:wg_password@127.0.0.1:5432/wg?schema=public`
- `JWT_SECRET` — секрет для подписи JWT (используется для опциональной аутентификации).
- `PORT` — порт сервера (по умолчанию 4000).

Инициализация БД (однократно после настройки `DATABASE_URL`):

```
# Сгенерировать клиент Prisma (выполняется и на postinstall)
pnpm --filter @wg/server prisma:generate

# Применить схему в базу (создать таблицы)
pnpm --filter @wg/server prisma:push
```

Если нужно изменить порты:

- Фронтенд по умолчанию: 3000 (см. `packages/web/package.json`), можно задать `PORT=3000` в PM2;
- Бекенд по умолчанию: 4000 (`PORT` читает из окружения в `packages/server/src/index.js`).

---

## 6. PM2 конфигурация и запуск

В корне проекта добавлен файл `ecosystem.config.js`, который поднимает два процесса:

- `wg-web` (Next.js, порт 3000), с окружением `NEXT_PUBLIC_API_URL=https://kids.does.cool/api`;
- `wg-server` (Express, порт 4000).

Запуск:

```
cd /opt/apps/worksheets-generator
pm2 start ecosystem.config.js
pm2 status
pm2 logs --lines 100
```

Автозапуск PM2 при перезагрузке сервера:

```
pm2 startup systemd
# PM2 выведет команду с sudo — выполните её, например:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u <your-user> --hp /home/<your-user>
pm2 save
```

Обновление приложения (деплой без простоя):

```
cd /opt/apps/worksheets-generator
git pull
pnpm install --frozen-lockfile
pnpm build
pm2 reload ecosystem.config.js --update-env
```

---

## 7. Конфигурация NGINX (reverse proxy + SSL)

Создайте конфиг для сайта:

```
sudo nano /etc/nginx/sites-available/kids.does.cool
```

Вставьте конфиг (HTTP, временно без SSL — нужен для выдачи сертификата):

```
server {
    listen 80;
    listen [::]:80;
    server_name kids.does.cool;

    # Реальные IP из Cloudflare/прокси (при необходимости)
    real_ip_header X-Forwarded-For;

    location /.well-known/acme-challenge/ {
        root /var/www/html; # certbot будет использовать для проверки
    }

    # API -> Express (порт 4000), с удалением префикса /api
    location /api/ {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
        rewrite ^/api/(.*)$ /$1 break;
        proxy_pass http://127.0.0.1:4000;
    }

    # Доступ к файлам генераций из БД через API (порт 4000)
    location /files/ {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
        proxy_pass http://127.0.0.1:4000;
    }

    # Предпросмотр страниц генерации (HTML)
    location /generations/ {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
        proxy_pass http://127.0.0.1:4000;
    }

    # Наследуемая статика (если осталась)
    location /static/ {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
        proxy_pass http://127.0.0.1:4000;
    }

    # Всё остальное -> Next.js (порт 3000)
    location / {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
        proxy_pass http://127.0.0.1:3000;
    }
}
```

Активируйте сайт и проверьте синтаксис:

```
sudo ln -s /etc/nginx/sites-available/kids.does.cool /etc/nginx/sites-enabled/kids.does.cool
sudo nginx -t
sudo systemctl reload nginx
```

### 7.1. SSL (Let’s Encrypt, Certbot)

Установите certbot и получите сертификат (режим веб-сервера NGINX):

```
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d kids.does.cool --redirect --hsts --staple-ocsp
```

Certbot автоматически добавит SSL-конфигурацию и перенаправление на HTTPS. Проверьте:

```
sudo nginx -t
sudo systemctl reload nginx
```

Сертификаты обновляются автоматом (systemd timer). Проверка таймера:

```
systemctl status certbot.timer --no-pager
```

При желании включите HTTP/2 и компрессию (обычно Certbot/NGINX уже включает). Можно добавить в серверный блок:

```
# Пример компрессии
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
```

---

## 8. Проверка работы

1. Убедитесь, что процессы подняты:

```
pm2 status
```

2. Проверьте, что фронтенд доступен:

```
curl -I https://kids.does.cool/
```

3. Проверьте API через домен (через NGINX):

```
curl -s https://kids.does.cool/api/health | jq .
# Ожидаемый ответ от @wg/server: { "ok": true, ... }
```

4. На странице выберите задания и сгенерируйте — ссылки должны иметь вид `/files/<pageId>` и предпросмотр `/generations/<genId>/day/<n>/index.html`.

---

## 9. Как это работает вместе

- Браузер открывает `https://kids.does.cool/` (Next.js 3000 через NGINX).
- При загрузке задач фронтенд вызывает `GET https://kids.does.cool/api/tasks`.
  - NGINX переписывает `/api/tasks` -> `/tasks` и проксирует на Express (4000).
- При генерации фронтенд вызывает `POST https://kids.does.cool/api/generate/worksheets`.
- Бекенд складывает результат в свою `public/generated/...` и отдаёт по `/static/...`.
- Фронтенд отображает ссылки на `https://kids.does.cool/static/...` — NGINX проксирует их на порт 4000.

---

## 10. Команды обслуживания

- Просмотр логов:

```
pm2 logs wg-web --lines 200
pm2 logs wg-server --lines 200
```

- Перезапуск после обновления конфигов/ENV:

```
pm2 reload ecosystem.config.js --update-env
```

- Остановка:

```
pm2 stop wg-web wg-server
```

- Удаление из PM2:

```
pm2 delete wg-web wg-server
```

---

## 11. Тонкости и полезные советы

- Память/CPU: при больших изображениях для "connect-dots" библиотека `sharp` может использовать заметно памяти и CPU. Убедитесь, что на VPS достаточно ресурсов, либо ограничьте параметры (кол-во точек, blurSigma и т.п.).
- Хранилище: результаты складываются в `packages/server/public/generated`. При росте объёма периодически чистите старые папки.
- Бэкапы и обновления: при `git pull` + `pnpm install` + `pnpm build` используйте `pm2 reload` для бесшовного обновления.
- Узлы NGINX: если используете Cloudflare — убедитесь, что SSL в режиме Full (Strict), и корректно передаются `X-Forwarded-Proto`/`Host` заголовки.

---

## 12. Быстрый чек-лист деплоя

1. DNS указывает на сервер ✓
2. Node.js 22 и pnpm установлены ✓
3. NGINX установлен и запущен ✓
4. Код в `/opt/apps/worksheets-generator`, зависимости поставлены, билд выполнен ✓
5. `.env` в `packages/web` с `NEXT_PUBLIC_API_URL=https://kids.does.cool/api` ✓
6. PM2 запустил `wg-web` и `wg-server` ✓
7. Certbot выпустил SSL-сертификат, NGINX перезагружен ✓
8. Открылась главная страница и API отвечает по `/api/health` ✓

Готово! Приложение доступно на https://kids.does.cool/.


---

## 12. Опциональные изображения для задания «connect-dots»

Задание «соедини точки» поддерживает два режима:
- загрузка пользовательского изображения через веб‑UI (PNG/JPG);
- если изображение не загружено, сервер может подставлять случайную картинку из папки ассетов.

Папка ассетов на сервере:
- `packages/server/assets/connect-dots`

Поддерживаемые форматы файлов: `.png`, `.jpg`, `.jpeg`, `.webp`.

Важно:
- Если папка отсутствует или пуста, при старте `@wg/server` выводит предупреждение в лог:
  `YOU MAY WANT TO ADD PICTURES: place .png/.jpg/.jpeg/.webp files into <path> to enable random fallback for "connect-dots".`
- Это лишь предупреждение — сервер продолжит работать. Добавьте несколько изображений, чтобы включить случайную подстановку.

Как подготовить папку ассетов при деплое (варианты):
1) Скопировать файлы на сервер до запуска:
```
mkdir -p packages/server/assets/connect-dots
# скопируйте свои .png/.jpg/.jpeg/.webp в эту папку
```
2) Хранить изображения рядом с кодом и доставлять вместе с артефактами релиза (CI/CD), чтобы папка уже содержала картинки на момент запуска.

Лицензии: добавляйте только изображения, на использование которых у вас есть права (собственные или из открытых источников с разрешающей лицензией).

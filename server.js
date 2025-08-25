/* Simple Node.js server with Express to configure and generate worksheets */
/* eslint-disable no-console */
const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const { generateCustom, GENERATORS } = require('./scripts/generate-custom');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads dir exists inside worksheets
const uploadsDir = path.resolve(process.cwd(), 'worksheets', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (_req, file, cb) {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const ts = Date.now();
    cb(null, `${ts}-${safe}`);
  }
});
const upload = multer({ storage });

app.use('/worksheets', express.static(path.resolve(process.cwd(), 'worksheets')));
app.use(express.urlencoded({ extended: true }));

function allTaskKeys() {
  return Object.keys(GENERATORS);
}

function renderForm({ days = 1, selected = allTaskKeys(), message = '' } = {}) {
  const tasks = [
    { key: 'clocks', label: 'Часы' },
    { key: 'weights', label: 'Весы' },
    { key: 'connect-dots', label: 'Соедини по точкам' },
    { key: 'find-parts', label: 'Найди кусочки' },
    { key: 'postman', label: 'Почтальон (числа по порядку)' },
    { key: 'spot-diff', label: 'Найди отличия' },
    { key: 'addition', label: 'Сложение' },
    { key: 'maze', label: 'Лабиринт' },
  ];
  const checkbox = (t) => `<label style="display:block;margin:6px 0;">
    <input type="checkbox" name="tasks" value="${t.key}" ${selected.includes(t.key) ? 'checked' : ''}/> ${t.label}
  </label>`;
  const tasksHtml = tasks.map(checkbox).join('');
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Генератор заданий</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .card { max-width: 740px; margin: 0 auto; background: #fff; padding: 16px 20px; border: 1px solid #ddd; border-radius: 8px; }
    h1 { margin-top: 0; }
    fieldset { border: 1px solid #ccc; padding: 12px 16px; border-radius: 8px; }
    .row { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
    .muted { color: #666; font-size: 14px; }
    .files { margin-top: 8px; }
    .btn { display: inline-block; padding: 10px 16px; background: #0b74de; color: #fff; border-radius: 6px; text-decoration: none; border: 0; cursor: pointer; }
    .btn:disabled { background: #9bbbe0; cursor: not-allowed; }
    .links a { display:block; margin: 6px 0; }
    .message { color: #c00; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Генератор заданий</h1>
    ${message ? `<div class="message">${message}</div>` : ''}
    <form action="/generate" method="post" enctype="multipart/form-data">
      <fieldset>
        <legend>Виды заданий</legend>
        ${tasksHtml}
      </fieldset>
      <div class="row" style="margin:12px 0;">
        <label>Число дней: <input type="number" name="days" value="${days}" min="1" max="31"/></label>
        <span class="muted">по умолчанию 1</span>
      </div>

      <div style="margin:12px 0;">
        <label><strong>Изображения для задания «соедини по точкам»</strong> (опционально):</label>
        <div class="muted">Если выбран «соедини по точкам», можно загрузить 1–N картинок-силуэтов (реализация автогенерации из картинок — позже).</div>
        <input id="connectImages" type="file" name="connectImages" multiple accept=".png,.jpg,.jpeg,.svg" />
      </div>
      <div style="margin-top:16px;">
        <button class="btn" type="submit">Сгенерировать</button>
      </div>
    </form>

    <div style="margin-top:18px;" class="muted">Готовые страницы доступны по ссылкам после генерации. Также можно просматривать все файлы в <a href="/worksheets/" target="_blank">/worksheets/</a>.</div>
  </div>
  <script>
    // Enable/disable file input depending on connect-dots checkbox
    (function(){
      function sync() {
        var boxes = document.querySelectorAll('input[type=checkbox][name=tasks]');
        var cd = Array.prototype.some.call(boxes, function(b){ return b.value==='connect-dots' && b.checked; });
        var fi = document.getElementById('connectImages');
        fi.disabled = !cd;
        fi.style.opacity = cd ? '1' : '0.6';
      }
      document.addEventListener('change', function(e){ if (e.target && e.target.name==='tasks') sync(); });
      sync();
    })();
  </script>
</body>
</html>`;
}

app.get('/', (_req, res) => {
  res.send(renderForm());
});

app.post('/generate', upload.array('connectImages', 50), async (req, res) => {
  try {
    // tasks may come as string or array; default to all if missing (but UI checks all by default)
    let selected = req.body.tasks;
    if (!selected) selected = allTaskKeys();
    if (!Array.isArray(selected)) selected = [selected];
    // sanitize unknowns
    selected = selected.filter(k => Object.prototype.hasOwnProperty.call(GENERATORS, k));
    if (selected.length === 0) {
      return res.send(renderForm({ days: Number(req.body.days) || 1, selected: allTaskKeys(), message: 'Нужно выбрать хотя бы один вид задания.' }));
    }
    const days = Math.max(1, Math.min(31, parseInt(req.body.days, 10) || 1));

    // Files saved by multer (not yet used for generation)
    const files = (req.files || []).map(f => ({ name: f.originalname, path: f.path }));

    const result = generateCustom({ days, tasks: selected });

    // Build links
    const wsRoot = path.resolve(process.cwd(), 'worksheets');
    const dayLinks = result.days.map(({ day, indexHtml }) => {
      const rel = path.relative(wsRoot, indexHtml).split(path.sep).join('/');
      const href = '/worksheets/' + rel;
      return `<li>День ${String(day).padStart(2,'0')}: <a href="${href}" target="_blank">${href}</a></li>`;
    }).join('');

    res.send(`<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Результаты генерации</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .card { max-width: 740px; margin: 0 auto; background: #fff; padding: 16px 20px; border: 1px solid #ddd; border-radius: 8px; }
    .btn { display:inline-block; padding:8px 12px; background:#0b74de; color:#fff; text-decoration:none; border-radius:6px; }
    li { margin: 6px 0; }
    .muted { color:#666; }
    code { background:#f3f3f3; padding:2px 6px; border-radius:4px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Готово!</h1>
    <p>Сгенерировано дней: <strong>${days}</strong>. Выбрано типов: <strong>${selected.length}</strong>.</p>
    ${files.length ? `<p class="muted">Загружено файлов для «соедини по точкам»: ${files.length} (пока не используется в генерации)</p>` : ''}
    <h3>Ссылки на страницы:</h3>
    <ul>${dayLinks}</ul>
    <p><a class="btn" href="/">← Назад к генератору</a> <a class="btn" href="/worksheets/" target="_blank">Открыть папку worksheets</a></p>
  </div>
</body>
</html>`);
  } catch (e) {
    console.error(e);
    res.status(500).send(`<pre>${String(e && e.stack || e)}</pre><p><a href="/">← Назад</a></p>`);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Browse worksheets at http://localhost:${PORT}/worksheets/`);
});

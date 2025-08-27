/* Simple Node.js server with Express to configure and generate worksheets */
/* eslint-disable no-console */
const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const { generateCustom, GENERATORS } = require('./scripts/generate-custom');
const { imageToDots } = require('./scripts/image_path_to_dots_processor');

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

function renderForm({ days = 1, selected = ['connect-dots'], message = '' } = {}) {
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

      <div style="margin:12px 0;" id="connectSection">
        <label><strong>Изображения для задания «соедини по точкам»</strong> (пер‑картинки параметры):</label>
        <div class="muted">Количество картинок должно совпадать с числом дней. Добавляйте строки в таблицу и указывайте параметры по каждой картинке.</div>
        <div style="margin:6px 0 10px 0;">
          <button type="button" class="btn" id="addRowBtn">Добавить картинку</button>
          <span class="muted" id="rowsHint" style="margin-left:10px;"></span>
        </div>
        <table style="width:100%; border-collapse: collapse;" id="connectTable">
          <thead>
            <tr>
              <th style="text-align:left; border-bottom:1px solid #ddd; padding:6px;">#</th>
              <th style="text-align:left; border-bottom:1px solid #ddd; padding:6px;">Файл</th>
              <th style="text-align:left; border-bottom:1px solid #ddd; padding:6px;">Точек</th>
              <th style="text-align:left; border-bottom:1px solid #ddd; padding:6px;">Порог</th>
              <th style="text-align:left; border-bottom:1px solid #ddd; padding:6px;">Мультиконтуры</th>
              <th style="text-align:left; border-bottom:1px solid #ddd; padding:6px;">Макс. контуров</th>
              <th style="text-align:left; border-bottom:1px solid #ddd; padding:6px;">Декор доля</th>
              <th style="text-align:left; border-bottom:1px solid #ddd; padding:6px;">Нумерация</th>
              <th style="text-align:left; border-bottom:1px solid #ddd; padding:6px;">Целевые контуры</th>
              <th style="text-align:left; border-bottom:1px solid #ddd; padding:6px;">Распред. точек</th>
              <th style="text-align:left; border-bottom:1px solid #ddd; padding:6px;">Simplify</th>
              <th style="text-align:left; border-bottom:1px solid #ddd; padding:6px;">Blur σ</th>
              <th style="text-align:left; border-bottom:1px solid #ddd; padding:6px;">—</th>
            </tr>
          </thead>
          <tbody id="connectTbody"></tbody>
        </table>

        <!-- шаблон строки -->
        <template id="rowTpl">
          <tr>
            <td class="idx" style="padding:6px;">1</td>
            <td style="padding:6px;"><input type="file" accept=".png,.jpg,.jpeg" /></td>
            <td style="padding:6px;"><input type="number" min="6" max="50" value="50" step="1" /></td>
            <td style="padding:6px;"><input type="number" min="0" max="255" value="180" step="1" /></td>
            <td style="padding:6px;"><input type="checkbox" checked /></td>
            <td style="padding:6px;"><input type="number" min="1" max="12" value="6" step="1" /></td>
            <td style="padding:6px;"><input type="number" min="0" max="0.9" value="0.18" step="0.01" /></td>
            <td style="padding:6px;">
              <select>
                <option value="continuous" selected>сплошная</option>
                <option value="per-contour">по контурам</option>
              </select>
            </td>
            <td style="padding:6px;"><input type="text" placeholder="например: 0,2" /></td>
            <td style="padding:6px;">
              <select>
                <option value="proportional" selected>пропорционально</option>
                <option value="equal">равномерно</option>
              </select>
            </td>
            <td style="padding:6px;"><input type="number" min="0.1" max="5" value="1.5" step="0.1" /></td>
            <td style="padding:6px;"><input type="number" min="0.5" max="5" value="1.5" step="0.1" /></td>
            <td style="padding:6px;"><button type="button" class="btn rm">Удалить</button></td>
          </tr>
        </template>
      </div>
      <div style="margin-top:16px;">
        <button class="btn" type="submit">Сгенерировать</button>
      </div>
    </form>

    <div style="margin-top:18px;" class="muted">Готовые страницы доступны по ссылкам после генерации. Также можно просматривать все файлы в <a href="/worksheets/" target="_blank">/worksheets/</a>.</div>
  </div>
  <script>
    (function(){
      var tbody = null, tpl = null, addBtn = null, daysInput = null, section = null, hint = null;
      function qs(sel){ return document.querySelector(sel); }
      function qsa(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel)); }

      function renumber() {
        var rows = qsa('#connectTbody tr');
        rows.forEach(function(tr, idx){
          tr.querySelector('.idx').textContent = String(idx+1);
          // assign names
          var prefix = 'connectItems['+idx+']';
          var inputs = tr.querySelectorAll('input, select');
          inputs.forEach(function(el){
            if (el.dataset.role === 'file') el.name = prefix + '[file]';
            else if (el.dataset.role) el.name = prefix + '[' + el.dataset.role + ']';
          });
        });
        updateHint();
      }

      function updateHint(){
        var rows = qsa('#connectTbody tr').length;
        var days = parseInt(daysInput.value || '1', 10);
        hint.textContent = rows + ' из ' + days + ' (нужно столько же, сколько дней)';
        addBtn.disabled = rows >= days;
      }

      function addRow() {
        var rows = qsa('#connectTbody tr').length;
        var days = parseInt(daysInput.value || '1', 10);
        if (rows >= days) return;
        var node = document.importNode(tpl.content, true);
        var tr = node.querySelector('tr');
        // mark role attributes on inputs for naming
        var tds = tr.querySelectorAll('td');
        tds[1].querySelector('input[type=file]').dataset.role = 'file';
        tds[2].querySelector('input').dataset.role = 'pointsCount';
        tds[3].querySelector('input').dataset.role = 'threshold';
        tds[4].querySelector('input[type=checkbox]').dataset.role = 'multiContours';
        tds[5].querySelector('input').dataset.role = 'maxContours';
        tds[6].querySelector('input').dataset.role = 'decorAreaRatio';
        tds[7].querySelector('select').dataset.role = 'numbering';
        tds[8].querySelector('input').dataset.role = 'targetContours';
        tds[9].querySelector('select').dataset.role = 'pointsDistribution';
        tds[10].querySelector('input').dataset.role = 'simplifyTolerance';
        tds[11].querySelector('input').dataset.role = 'blurSigma';

        tr.querySelector('.rm').addEventListener('click', function(){
          tr.parentNode.removeChild(tr);
          renumber();
        });
        tbody.appendChild(tr);
        renumber();
      }

      function ensureRowsMatchDays(){
        var rows = qsa('#connectTbody tr').length;
        var days = parseInt(daysInput.value || '1', 10);
        // add rows up to days
        while (rows < days) { addRow(); rows++; }
        // remove extra rows from the end if days reduced
        while (rows > days) {
          var trs = qsa('#connectTbody tr');
          var last = trs[trs.length - 1];
          if (last) last.parentNode.removeChild(last);
          rows--;
          renumber();
        }
        updateHint();
      }

      function toggleSection(){
        var active = Array.prototype.some.call(qsa('input[type=checkbox][name=tasks]'), function(b){ return b.value==='connect-dots' && b.checked; });
        section.style.opacity = active ? '1' : '0.5';
        Array.prototype.forEach.call(section.querySelectorAll('input,select,button'), function(el){ el.disabled = !active; });
      }

      document.addEventListener('DOMContentLoaded', function(){
        tbody = qs('#connectTbody');
        tpl = qs('#rowTpl');
        addBtn = qs('#addRowBtn');
        daysInput = qs('input[name=days]');
        section = qs('#connectSection');
        hint = qs('#rowsHint');
        addBtn.addEventListener('click', addRow);
        daysInput.addEventListener('change', ensureRowsMatchDays);
        document.addEventListener('change', function(e){ if (e.target && e.target.name==='tasks') toggleSection(); });
        // initial
        ensureRowsMatchDays();
        toggleSection();
      });
    })();
  </script>
</body>
</html>`;
}

app.get('/', (_req, res) => {
  res.send(renderForm());
});

app.post('/generate', upload.any(), async (req, res) => {
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

    // Parse per-row items connectItems[i][...]
    const result = generateCustom({ days, tasks: selected });

    const filesArr = Array.isArray(req.files) ? req.files : [];
    const body = req.body || {};
    const itemMap = new Map();

    // Prefer structured body if express parsed it (extended: true)
    if (Array.isArray(body.connectItems)) {
      body.connectItems.forEach((obj, idx) => {
        if (!obj) return;
        itemMap.set(idx, { ...obj });
      });
    } else {
      // Fallback: parse flat keys like connectItems[0][pointsCount]
      for (const [key, val] of Object.entries(body)) {
        const m = key.match(/^connectItems\[(\d+)\]\[(\w+)\]$/);
        if (!m) continue;
        const idx = parseInt(m[1], 10);
        const prop = m[2];
        if (!itemMap.has(idx)) itemMap.set(idx, {});
        itemMap.get(idx)[prop] = val;
      }
    }
    // files by fieldname connectItems[0][file]
    for (const f of filesArr) {
      const m = f.fieldname && f.fieldname.match(/^connectItems\[(\d+)\]\[file\]$/);
      if (!m) continue;
      const idx = parseInt(m[1], 10);
      if (!itemMap.has(idx)) itemMap.set(idx, {});
      itemMap.get(idx).file = { name: f.originalname, path: f.path };
    }
    const indices = Array.from(itemMap.keys()).sort((a,b)=>a-b);
    const items = indices.map(i => ({ index: i, ...itemMap.get(i) }))
      .filter(it => it.file && /\.(png|jpg|jpeg)$/i.test(it.file.name));

    // Process uploaded silhouettes into connect-the-dots pages if requested
    const connectIdx = selected.indexOf('connect-dots');
    let processed = [];
    if (connectIdx !== -1) {
      const uploadedCount = items.length;
      if (uploadedCount !== days) {
        return res.send(renderForm({ days, selected, message: `Количество картинок (${uploadedCount}) должно совпадать с числом дней (${days}).` }));
      }
      const pad2 = (n) => String(n).padStart(2, '0');
      // helpers
      const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
      const toNum = (v, d) => { const n = parseFloat(String(v ?? '').toString().replace(',', '.')); return Number.isFinite(n) ? n : d; };
      const toInt = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; };
      const toBool = (v, d) => { if (typeof v === 'boolean') return v; if (v == null) return d; const s = String(v).toLowerCase(); return s==='1'||s==='true'||s==='on'||s==='yes'; };
      const parseListInt = (s) => String(s || '').split(',').map(z=>parseInt(String(z).trim(),10)).filter(Number.isFinite);

      for (let i = 0; i < days; i++) {
        const it = items[i];
        const dayRes = result.days[i];
        const outFile = path.join(dayRes.dir, `page-${pad2(connectIdx + 1)}-connect-dots.svg`);

        const pointsCount = clamp(toInt(it.pointsCount, 50), 6, 50);
        const simplifyTolerance = clamp(toNum(it.simplifyTolerance, 1.5), 0.1, 10);
        const threshold = clamp(toInt(it.threshold, 180), 0, 255);
        const multiContours = toBool(it.multiContours, true);
        const maxContours = clamp(toInt(it.maxContours, 6), 1, 50);
        const decorAreaRatio = clamp(toNum(it.decorAreaRatio, 0.18), 0, 0.9);
        const numbering = (it.numbering === 'per-contour') ? 'per-contour' : 'continuous';
        const targetContoursList = parseListInt(it.targetContours);
        const targetContours = targetContoursList.length ? targetContoursList : null;
        const pointsDistribution = (it.pointsDistribution === 'equal') ? 'equal' : 'proportional';
        const blurSigma = clamp(toNum(it.blurSigma, 1.5), 0.5, 5);

        try {
          await imageToDots({
            input: it.file.path,
            outSvg: outFile,
            pointsCount,
            simplifyTolerance,
            threshold,
            multiContours,
            maxContours,
            decorAreaRatio,
            numbering,
            targetContours,
            pointsDistribution,
            blurSigma
          });
          processed.push({ day: i + 1, file: outFile, points: pointsCount, threshold });
        } catch (err) {
          console.error('connect-dots processing failed for day', i + 1, err);
          processed.push({ day: i + 1, error: String(err && err.message || err) });
        }
      }
    }

    // Build links
    const wsRoot = path.resolve(process.cwd(), 'worksheets');
    const dayLinks = result.days.map(({ day, indexHtml }) => {
      const rel = path.relative(wsRoot, indexHtml).split(path.sep).join('/');
      const href = '/worksheets/' + rel;
      return `<li>День ${String(day).padStart(2,'0')}: <a href="${href}" target="_blank">${href}</a></li>`;
    }).join('');

    // Build processed summary HTML
    let processedHtml = '';
    const uploadedCount = items.length;
    if (uploadedCount) {
      if (connectIdx === -1) {
        processedHtml = `<p class=\"muted\">Загружено строк для «соедини по точкам»: ${uploadedCount}, но тип задания не выбран — файлы не обработаны.</p>`;
      } else if (processed.length) {
        const ok = processed.filter(p => !p.error);
        const bad = processed.filter(p => p.error);
        const okList = ok.map(p => `<li>День ${String(p.day).padStart(2,'0')}: ${p.points} точек</li>`).join('');
        const badList = bad.map(p => `<li>День ${String(p.day).padStart(2,'0')}: ошибка — ${p.error}</li>`).join('');
        processedHtml = `${ok.length ? `<h3>Преобразованные силуэты:</h3><ul>${okList}</ul>` : ''}${bad.length ? `<h4>Ошибки:</h4><ul>${badList}</ul>` : ''}`;
      } else {
        processedHtml = `<p class=\"muted\">Загружено строк для «соедини по точкам»: ${uploadedCount}, но не удалось обработать ни один файл.</p>`;
      }
    }

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
    ${processedHtml}
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

const fs = require('fs');
const path = require('path');
const { GENERATORS } = require('@wg/core');
const { paths } = require('../config');

function listTasks(_req, res) {
  const keys = Object.keys(GENERATORS);
  const META = {
    clocks: { category: 'logic' },
    weights: { category: 'logic' },
    'connect-dots': { category: 'art' },
    'find-parts': { category: 'puzzles' },
    postman: { category: 'math' },
    'spot-diff': { category: 'memory' },
    addition: { category: 'math' },
    maze: { category: 'puzzles' },
    'road-maze': { category: 'puzzles' },
  };

  const tasks = keys.map((k) => {
    const meta = META[k] || {};
    const out = { key: k };
    if (meta.category && typeof meta.category === 'string') out.category = meta.category;
    if (meta.logo && typeof meta.logo === 'string') {
      const abs = path.join(paths.publicDir, meta.logo);
      if (fs.existsSync(abs)) {
        out.logo = `/static/${meta.logo.replace(/\\+/g, '/')}`;
      }
    }
    return out;
  });

  res.json({ keys, tasks });
}

module.exports = { listTasks };

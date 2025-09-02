const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { paths } = require('./config');

// Routers
const healthRouter = require('./routes/health');
const tasksRouter = require('./routes/tasks');
const authRouter = require('./routes/auth');
const generationRouter = require('./routes/generation');
const filesRouter = require('./routes/files');
const picturesRouter = require('./routes/pictures');
const profileRouter = require('./routes/profile');

function ensureDirs() {
  for (const dir of [paths.publicDir, paths.generatedDir]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

function createApp() {
  const app = express();

  // Middlewares
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // Ensure dirs and static serving
  ensureDirs();
  app.use('/static', express.static(paths.publicDir));

  // Routes
  app.use(healthRouter);
  app.use(tasksRouter);
  app.use(authRouter);
  app.use(generationRouter);
  app.use(filesRouter);
  app.use(picturesRouter);
  app.use(profileRouter);

  return app;
}

module.exports = { createApp };

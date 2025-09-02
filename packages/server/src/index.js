/* Express server exposing REST API to generate worksheets using @wg/core */
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { createApp } = require('./app');
const { PORT, paths } = require('./config');

function warnIfConnectDotsAssetsEmpty() {
  try {
    const dir = path.resolve(__dirname, '..', 'assets', 'connect-dots');
    const exists = fs.existsSync(dir);
    const files = exists ? fs.readdirSync(dir) : [];
    const allowed = files.filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
    if (!allowed.length) {
      console.warn(
        'YOU MAY WANT TO ADD PICTURES: place .png/.jpg/.jpeg/.webp files into ' +
          dir +
          ' to enable random fallback for "connect-dots".',
      );
    }
  } catch (e) {
    // ignore
  }
}

const app = createApp();

app.listen(PORT, () => {
  console.log(`@wg/server is running at http://localhost:${PORT}`);
  console.log(
    `Static files served from ${paths.publicDir} at http://localhost:${PORT}/static/`,
  );
  warnIfConnectDotsAssetsEmpty();
});

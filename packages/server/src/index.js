/* Express server exposing REST API to generate worksheets using @wg/core */
/* eslint-disable no-console */
const { createApp } = require('./app');
const { PORT, paths } = require('./config');

const app = createApp();

app.listen(PORT, () => {
  console.log(`@wg/server is running at http://localhost:${PORT}`);
  console.log(
    `Static files served from ${paths.publicDir} at http://localhost:${PORT}/static/`,
  );
});

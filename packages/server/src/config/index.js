/* Server configuration and path constants */
const path = require('path');

const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-it';

// Compute important directories relative to the server package root
// This file is located at src/config, so go two levels up to reach the package root
const serverRoot = path.resolve(__dirname, '..', '..');
const publicDir = path.join(serverRoot, 'public');
const generatedDir = path.join(publicDir, 'generated');

module.exports = {
  PORT,
  JWT_SECRET,
  paths: { serverRoot, publicDir, generatedDir },
};

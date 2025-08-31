/* Centralized server configuration with strict env validation */
/* eslint-disable no-console */
const path = require('path');
const dotenv = require('dotenv');

// Compute important directories relative to the server package root
// This file is located at src/config, so go two levels up to reach the package root
const serverRoot = path.resolve(__dirname, '..', '..');
const publicDir = path.join(serverRoot, 'public');
const generatedDir = path.join(publicDir, 'generated');

// Load .env from the server package root so env vars are available during validation
dotenv.config({ path: path.join(serverRoot, '.env') });

// Collect and validate required environment variables
const missing = [];
const invalid = [];

function readRequired(key) {
  const val = process.env[key];
  if (val === undefined || val === null || String(val).trim() === '') missing.push(key);
  return val;
}

// Required envs
const PORT_RAW = readRequired('PORT');
const JWT_SECRET = readRequired('JWT_SECRET');
const DATABASE_URL = readRequired('DATABASE_URL');
// Validate formats
let PORT;
if (PORT_RAW) {
  PORT = Number(PORT_RAW);
  if (!Number.isInteger(PORT) || PORT <= 0) invalid.push('PORT (must be a positive integer)');
}

if (missing.length || invalid.length) {
  console.error('[config] Invalid or missing environment configuration.');
  if (missing.length) {
    console.error('Missing required variables:');
    for (const k of missing) console.error(` - ${k}`);
  }
  if (invalid.length) {
    console.error('Invalid variables:');
    for (const k of invalid) console.error(` - ${k}`);
  }
  console.error('Please set the variables above and restart the application.');
  // Fail fast - do not start the server with incomplete configuration
  process.exit(1);
}

module.exports = {
  PORT,
  JWT_SECRET,
  DATABASE_URL,
  paths: { serverRoot, publicDir, generatedDir },
};

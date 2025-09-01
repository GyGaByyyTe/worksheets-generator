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

function readOptional(key) {
  const val = process.env[key];
  return (val === undefined || val === null) ? '' : String(val);
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

// Optional picture API integration
const PICTURE_API_KEY = readOptional('PICTURE_API_KEY');
const PICTURE_API_URL = readOptional('PICTURE_API_URL');
const IS_PICTURE_API_CONFIGURED = Boolean(PICTURE_API_KEY && PICTURE_API_KEY.trim() && PICTURE_API_URL && PICTURE_API_URL.trim());

if (!IS_PICTURE_API_CONFIGURED) {
  console.warn('[config] Picture API is not configured. Random image search will be disabled (routes will respond 501).');
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
  pictureApi: {
    key: PICTURE_API_KEY,
    url: PICTURE_API_URL,
    enabled: IS_PICTURE_API_CONFIGURED,
  },
};

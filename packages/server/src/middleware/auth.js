const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

function optionalAuth(req, _res, next) {
  try {
    const hdr =
      req.headers && (req.headers.authorization || req.headers.Authorization);
    if (hdr && typeof hdr === 'string') {
      const m = hdr.match(/^Bearer\s+(.+)$/i);
      if (m) {
        try {
          req.user = jwt.verify(m[1], JWT_SECRET);
        } catch (_) {
          // ignore invalid token to allow anonymous
        }
      }
    }
  } catch (_) {
    // ignore
  }
  next();
}

module.exports = { optionalAuth };

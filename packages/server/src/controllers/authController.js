const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db/prisma');
const { JWT_SECRET } = require('../config');

async function register(req, res) {
  try {
    const { email, password } = (req.body || {});
    if (!email || !password || String(password).length < 6) {
      return res.status(400).json({ error: 'email and password (min 6 chars) required' });
    }
    const hash = await bcrypt.hash(String(password), 12);
    const user = await prisma.user.create({
      data: { email: String(email).toLowerCase(), passwordHash: hash },
    });
    return res.status(201).json({ id: user.id, email: user.email });
  } catch (e) {
    const msg = String((e && e.message) || e);
    if (msg.includes('Unique constraint')) {
      return res.status(409).json({ error: 'email already registered' });
    }
    return res.status(400).json({ error: msg });
  }
}

async function login(req, res) {
  try {
    const { email, password } = (req.body || {});
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token });
  } catch (e) {
    return res.status(400).json({ error: String((e && e.message) || e) });
  }
}

async function me(req, res) {
  if (!req.user) return res.json({ user: null });
  return res.json({ user: { id: req.user.sub, email: req.user.email } });
}

module.exports = { register, login, me };

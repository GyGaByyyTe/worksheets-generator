const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const router = express.Router();

// Simple in-memory mock helpers
function ensureAuth(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  return null;
}

router.get('/profile', optionalAuth, (req, res) => {
  if (ensureAuth(req, res)) return; // already sent 401
  const email = req.user.email;
  const name = (email && email.split('@')[0]) || 'Пользователь';
  const payload = {
    id: req.user.sub,
    email,
    name: name
      .split(/[._-]/)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' '),
    plan: { code: 'basic', title: 'Базовый', color: '#16a34a' },
    avatarUrl: null, // could be gravatar in future
    joinedAt: new Date(Date.now() - 23 * 24 * 3600 * 1000).toISOString(),
  };
  res.json(payload);
});

router.get('/profile/stats', optionalAuth, (req, res) => {
  if (ensureAuth(req, res)) return;
  const used = 7;
  const limit = 10;
  res.json({
    month: { used, limit },
    downloadsTotal: 35,
    daysWithUs: 23,
    rating: 4.8,
  });
});

router.get('/profile/recent-generations', optionalAuth, (_req, res) => {
  const items = [
    {
      id: 'g1',
      title: 'Простой лабиринт 5×5',
      type: 'Лабиринт',
      createdAt: '2024-01-15',
      downloads: 12,
    },
    {
      id: 'g2',
      title: 'Кот по точкам',
      type: 'Точки',
      createdAt: '2024-01-14',
      downloads: 8,
    },
    {
      id: 'g3',
      title: 'Математика для 5 лет',
      type: 'Задания',
      createdAt: '2024-01-13',
      downloads: 15,
    },
  ];
  res.json({ items });
});

module.exports = router;

const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const prisma = require('../db/prisma');
const router = express.Router();

function ensureAuth(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  return null;
}

router.get('/profile', optionalAuth, async (req, res) => {
  if (ensureAuth(req, res)) return; // already sent 401
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
    if (!user) return res.status(404).json({ error: 'user not found' });
    const email = user.email;
    const nameRaw = (email && email.split('@')[0]) || 'Пользователь';
    const name = nameRaw
      .split(/[._-]/)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');
    const payload = {
      id: user.id,
      email: user.email,
      name,
      plan: { code: 'basic', title: 'Базовый', color: '#16a34a' },
      avatarUrl: null,
      joinedAt: user.createdAt.toISOString(),
    };
    res.json(payload);
  } catch (e) {
    res.status(400).json({ error: String((e && e.message) || e) });
  }
});

router.get('/profile/stats', optionalAuth, async (req, res) => {
  if (ensureAuth(req, res)) return;
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
    if (!user) return res.status(404).json({ error: 'user not found' });
    const since = new Date();
    since.setMonth(since.getMonth() - 1);
    const monthUsed = await prisma.generation.count({
      where: { userId: user.id, createdAt: { gte: since } },
    });
    // Count downloads for user's generations
    let downloadsTotal = 0;
    try {
      downloadsTotal = await prisma.generationDownload.count({
        where: { generation: { userId: user.id } },
      });
    } catch (_) {
      downloadsTotal = 0;
    }
    const daysWithUs = Math.max(
      1,
      Math.ceil((Date.now() - user.createdAt.getTime()) / (24 * 3600 * 1000)),
    );
    res.json({
      month: { used: monthUsed, limit: 100 },
      downloadsTotal,
      daysWithUs,
      rating: null,
    });
  } catch (e) {
    res.status(400).json({ error: String((e && e.message) || e) });
  }
});

router.get('/profile/recent-generations', optionalAuth, async (req, res) => {
  if (ensureAuth(req, res)) return;
  try {
    const limit = 5;
    const gens = await prisma.generation.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { id: true, tasks: true, createdAt: true },
    });
    const ids = gens.map((g) => g.id);
    let downloadsByGen = {};
    try {
      const grouped = await prisma.generationDownload.groupBy({
        by: ['generationId'],
        where: { generationId: { in: ids } },
        _count: { generationId: true },
      });
      downloadsByGen = Object.fromEntries(
        grouped.map((r) => [r.generationId, r._count.generationId || 0]),
      );
    } catch (_) {
      downloadsByGen = {};
    }
    const items = gens.map((g) => {
      const tasks = Array.isArray(g.tasks) ? g.tasks : [];
      const title = tasks.length
        ? `Рабочие листы: ${tasks.join(', ')}`
        : 'Рабочие листы';
      const type = tasks[0] ? String(tasks[0]) : 'Разное';
      return {
        id: g.id,
        title,
        type,
        createdAt: g.createdAt.toISOString().slice(0, 10),
        downloads: downloadsByGen[g.id] || 0,
      };
    });
    res.json({ items });
  } catch (e) {
    res.status(400).json({ error: String((e && e.message) || e) });
  }
});

module.exports = router;

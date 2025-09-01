const express = require('express');
const { pictureApi } = require('../config');

const router = express.Router();

// Simple in-memory categories/subcategories mapping for client dropdowns
const CATEGORIES = {
  Animals: ['Cats', 'Dogs', 'Fish', 'Birds', 'Dinosaurs', 'Horses', 'Insects'],
  Technics: ['Cars', 'Planes', 'Trains', 'Ships', 'Robots', 'Gadgets'],
  Nature: ['Trees', 'Flowers', 'Mountains', 'Landscapes', 'Leaves'],
};

router.get('/pictures/categories', (_req, res) => {
  res.json({ categories: Object.keys(CATEGORIES), subcategories: CATEGORIES });
});

function isConfigured() {
  return !!(pictureApi && pictureApi.enabled && pictureApi.key && pictureApi.url);
}

function mapCategoryToPixabay(cat) {
  // Try to map to Pixabay categories where possible; fallback to undefined
  const low = String(cat || '').toLowerCase();
  if (low === 'animals') return 'animals';
  if (low === 'nature') return 'nature';
  if (low === 'technics') return undefined; // not a direct pixabay category
  return undefined;
}

router.get('/pictures/search', async (req, res) => {
  if (!isConfigured()) {
    return res.status(501).json({ error: 'Picture API is not configured on the server.' });
  }
  try {
    const key = pictureApi.key;
    const baseUrl = String(pictureApi.url || '').replace(/\/+$/, '');
    const category = String(req.query.category || 'Animals');
    const subcategory = String(req.query.subcategory || '').trim();
    const type = String(req.query.type || 'silhouette');

    const qParts = [];
    if (subcategory) qParts.push(subcategory);
    if (type) qParts.push(type);
    const q = qParts.join(' ');

    const params = new URLSearchParams({
      key,
      q,
      image_type: 'vector',
      per_page: String(Math.max(1, Math.min(50, Number(req.query.per_page) || 20))),
      safesearch: 'true',
      editors_choice: 'false',
    });

    const mappedCategory = mapCategoryToPixabay(category);
    if (mappedCategory) params.set('category', mappedCategory);

    // Optional tuning for silhouettes
    params.set('colors', 'grayscale');

    const url = `${baseUrl}/?${params.toString()}`;
    const r = await fetch(url);
    if (!r.ok) {
      return res.status(502).json({ error: 'Upstream image API error', status: r.status });
    }
    const data = await r.json();
    const hits = Array.isArray(data?.hits) ? data.hits : [];

    const images = hits.map((h) => ({
      id: h.id,
      url: h.largeImageURL || h.webformatURL || h.previewURL,
      previewUrl: h.previewURL || h.webformatURL || h.largeImageURL,
      tags: h.tags || '',
      width: h.imageWidth || h.webformatWidth || null,
      height: h.imageHeight || h.webformatHeight || null,
      source: 'pixabay',
      pageURL: h.pageURL || null,
    }));

    res.json({ count: images.length, images });
  } catch (err) {
    console.error('[pictures] search error', err);
    res.status(500).json({ error: 'Failed to search pictures' });
  }
});

module.exports = router;

const express = require('express');
const db = require('../database/database');

const router = express.Router();

/**
 * Global search endpoint for students.
 * Searches classes, units, and lessons by title (and related names).
 * Public, read-only.
 */
router.get('/', async (req, res) => {
  try {
    const rawQuery = (req.query.q || '').trim();

    // Require a minimal query length to avoid useless full scans
    if (!rawQuery || rawQuery.length < 2) {
      return res.json({
        classes: [],
        units: [],
        lessons: []
      });
    }

    const likeQuery = `%${rawQuery.toLowerCase()}%`;

    // Classes: match on name
    const classes = await db.all(
      `
        SELECT id, name, created_at
        FROM classes
        WHERE LOWER(name) LIKE ?
        ORDER BY display_order ASC, created_at DESC
        LIMIT 20
      `,
      [likeQuery]
    );

    // Units: match on unit title or class name
    const units = await db.all(
      `
        SELECT 
          u.id,
          u.title,
          u.class_id,
          u.term,
          u.category,
          u.created_at,
          c.name AS class_name
        FROM units u
        JOIN classes c ON u.class_id = c.id
        WHERE LOWER(u.title) LIKE ?
           OR LOWER(c.name) LIKE ?
        ORDER BY u.created_at DESC, u.id DESC
        LIMIT 20
      `,
      [likeQuery, likeQuery]
    );

    // Lessons: match on lesson title, unit title, or class name
    const lessons = await db.all(
      `
        SELECT 
          l.id,
          l.title,
          l.unit_id,
          l.created_at,
          u.title AS unit_title,
          u.term,
          u.category AS unit_category,
          u.class_id,
          c.name AS class_name
        FROM lessons l
        JOIN units u ON l.unit_id = u.id
        JOIN classes c ON u.class_id = c.id
        WHERE LOWER(l.title) LIKE ?
           OR LOWER(u.title) LIKE ?
           OR LOWER(c.name) LIKE ?
        ORDER BY l.created_at DESC, l.id DESC
        LIMIT 20
      `,
      [likeQuery, likeQuery, likeQuery]
    );

    res.json({
      classes: classes || [],
      units: units || [],
      lessons: lessons || []
    });
  } catch (error) {
    console.error('Error in /api/search:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


const express = require('express');
const db = require('../database/database');
const { authenticateToken } = require('../middleware/auth');
const { parsePositiveInteger } = require('../utils/validation');

const router = express.Router();

// PUBLIC: Dashboard data (classes + units) for student home/classes page – one request, no auth
router.get('/dashboard-data', async (req, res) => {
  try {
    const [classes, units] = await Promise.all([
      db.all('SELECT * FROM classes ORDER BY display_order ASC, created_at DESC'),
      db.all('SELECT id, class_id FROM units ORDER BY display_order ASC, created_at ASC')
    ]);
    res.json({ classes: classes || [], units: units || [] });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUBLIC: Get all classes
router.get('/', async (req, res) => {
  try {
    const classes = await db.all('SELECT * FROM classes ORDER BY display_order ASC, created_at DESC');
    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUBLIC: Get single class
router.get('/:id', async (req, res) => {
  try {
    const parsed = parsePositiveInteger(req.params.id);
    if (!parsed.valid) {
      return res.status(400).json({ error: 'Invalid class id' });
    }
    const classItem = await db.get('SELECT * FROM classes WHERE id = ?', [parsed.value]);

    if (!classItem) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json(classItem);
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: Create class
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        error: 'اسم الصف مطلوب',
        code: 'NAME_REQUIRED'
      });
    }

    const trimmed = name.trim();

    // Validation: Check for Arabic letters only (including spaces)
    const arabicOnlyPattern = /^[\u0600-\u06FF\s]+$/;
    if (!arabicOnlyPattern.test(trimmed)) {
      return res.status(400).json({
        error: 'اسم الصف يجب أن يحتوي على أحرف عربية فقط',
        code: 'INVALID_CHARACTERS'
      });
    }

    // Check for duplicates (exact match)
    const existingClass = await db.get(
      'SELECT id FROM classes WHERE name = ?',
      [trimmed]
    );

    if (existingClass) {
      return res.status(409).json({
        error: 'هذا الاسم موجود بالفعل. يرجى اختيار اسم آخر',
        code: 'DUPLICATE_CLASS_NAME'
      });
    }

    const result = await db.run(
      'INSERT INTO classes (name) VALUES (?)',
      [trimmed]
    );

    const newClass = await db.get('SELECT * FROM classes WHERE id = ?', [result.id]);
    res.status(201).json(newClass);
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

// ADMIN: Update class
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const parsed = parsePositiveInteger(req.params.id);
    if (!parsed.valid) {
      return res.status(400).json({ error: 'Invalid class id' });
    }
    const id = parsed.value;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        error: 'اسم الصف مطلوب',
        code: 'NAME_REQUIRED'
      });
    }

    const trimmed = name.trim();

    // Validation: Check for Arabic letters only
    const arabicOnlyPattern = /^[\u0600-\u06FF\s]+$/;
    if (!arabicOnlyPattern.test(trimmed)) {
      return res.status(400).json({
        error: 'اسم الصف يجب أن يحتوي على أحرف عربية فقط',
        code: 'INVALID_CHARACTERS'
      });
    }

    // Check for duplicates excluding current class
    const existingClass = await db.get(
      'SELECT id FROM classes WHERE name = ? AND id != ?',
      [trimmed, id]
    );

    if (existingClass) {
      return res.status(409).json({
        error: 'هذا الاسم موجود بالفعل. يرجى اختيار اسم آخر',
        code: 'DUPLICATE_CLASS_NAME'
      });
    }

    const result = await db.run(
      'UPDATE classes SET name = ? WHERE id = ?',
      [trimmed, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'الصف غير موجود' });
    }

    const updatedClass = await db.get('SELECT * FROM classes WHERE id = ?', [id]);
    res.json(updatedClass);
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

// ADMIN: Delete class
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const parsed = parsePositiveInteger(req.params.id);
    if (!parsed.valid) {
      return res.status(400).json({ error: 'Invalid class id' });
    }
    const id = parsed.value;
    const result = await db.run('DELETE FROM classes WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json({ success: true, message: 'Class deleted' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: Reorder classes
router.post('/reorder', authenticateToken, async (req, res) => {
  try {
    const { order } = req.body; // Array of IDs in new order

    if (!order || !Array.isArray(order)) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    // Process reordering in transaction-like manner
    const updates = order.map((id, index) => {
      return db.run('UPDATE classes SET display_order = ? WHERE id = ?', [index, id]);
    });

    await Promise.all(updates);

    res.json({ success: true, message: 'Classes reordered successfully' });
  } catch (error) {
    console.error('Error reordering classes:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

const express = require('express');
const db = require('../database/database');
const { authenticateToken } = require('../middleware/auth');
const { parsePositiveInteger } = require('../utils/validation');

const router = express.Router();

// PUBLIC: Get units by class ID
router.get('/class/:classId', async (req, res) => {
  try {
    const parsed = parsePositiveInteger(req.params.classId);
    if (!parsed.valid) {
      return res.status(400).json({ error: 'Invalid class id' });
    }
    const units = await db.all(
      'SELECT * FROM units WHERE class_id = ? ORDER BY display_order ASC, created_at ASC',
      [parsed.value]
    );
    res.json(units);
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUBLIC: Get all units list (for student dashboard – no auth; must be before /:id)
router.get('/list/all', async (req, res) => {
  try {
    const units = await db.all(
      'SELECT id, class_id FROM units ORDER BY display_order ASC, created_at ASC'
    );
    res.json(units || []);
  } catch (error) {
    console.error('Error fetching units list:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUBLIC: Get single unit
router.get('/:id', async (req, res) => {
  try {
    const parsed = parsePositiveInteger(req.params.id);
    if (!parsed.valid) {
      return res.status(400).json({ error: 'Invalid unit id' });
    }
    const unit = await db.get('SELECT * FROM units WHERE id = ?', [parsed.value]);

    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    res.json(unit);
  } catch (error) {
    console.error('Error fetching unit:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: Get all units (for admin panel)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const units = await db.all(`
      SELECT u.*, c.name as class_name 
      FROM units u 
      JOIN classes c ON u.class_id = c.id 
      ORDER BY c.display_order ASC, u.display_order ASC
    `);
    res.json(units);
  } catch (error) {
    console.error('Error fetching all units:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: Create unit
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, class_id } = req.body;
    const classIdParsed = parsePositiveInteger(class_id);
    if (!classIdParsed.valid) {
      return res.status(400).json({ error: 'الصف الدراسي مطلوب', code: 'CLASS_ID_REQUIRED' });
    }
    const class_idNum = classIdParsed.value;

    if (!title || title.trim() === '') {
      return res.status(400).json({
        error: 'عنوان الوحدة مطلوب',
        code: 'TITLE_REQUIRED'
      });
    }

    const trimmed = title.trim();

    const arabicOnlyPattern = /^[\u0600-\u06FF\s]+$/;
    if (!arabicOnlyPattern.test(trimmed)) {
      return res.status(400).json({
        error: 'عنوان الوحدة يجب أن يحتوي على أحرف عربية فقط',
        code: 'INVALID_CHARACTERS'
      });
    }

    const classExists = await db.get('SELECT id FROM classes WHERE id = ?', [class_idNum]);
    if (!classExists) {
      return res.status(404).json({
        error: 'الصف الدراسي غير موجود',
        code: 'CLASS_NOT_FOUND'
      });
    }

    const existingUnit = await db.get(
      'SELECT id FROM units WHERE class_id = ? AND title = ? AND term = ?',
      [class_idNum, trimmed, String(req.body.term || '1')]
    );

    if (existingUnit) {
      const termName = (req.body.term || '1') == '1' ? 'الفصل الدراسي الأول' : 'الفصل الدراسي الثاني';
      return res.status(409).json({
        error: `هذا العنوان موجود بالفعل في ${termName} لهذا الصف.`,
        code: 'DUPLICATE_UNIT_TITLE'
      });
    }

    const result = await db.run(
      'INSERT INTO units (title, class_id, category, term) VALUES (?, ?, ?, ?)',
      [trimmed, class_idNum, req.body.category === 'Z' ? 'Z' : 'P', req.body.term || '1']
    );

    const newUnit = await db.get('SELECT * FROM units WHERE id = ?', [result.id]);
    res.status(201).json(newUnit);
  } catch (error) {
    console.error('Error creating unit:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

// ADMIN: Update unit
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const idParsed = parsePositiveInteger(req.params.id);
    if (!idParsed.valid) {
      return res.status(400).json({ error: 'Invalid unit id' });
    }
    const id = idParsed.value;
    const { title, class_id, category } = req.body;
    const classIdParsed = parsePositiveInteger(class_id);
    if (!classIdParsed.valid) {
      return res.status(400).json({ error: 'الصف الدراسي مطلوب', code: 'CLASS_ID_REQUIRED' });
    }
    const class_idNum = classIdParsed.value;

    if (!title || title.trim() === '') {
      return res.status(400).json({
        error: 'عنوان الوحدة مطلوب',
        code: 'TITLE_REQUIRED'
      });
    }

    const trimmed = title.trim();

    const arabicOnlyPattern = /^[\u0600-\u06FF\s]+$/;
    if (!arabicOnlyPattern.test(trimmed)) {
      return res.status(400).json({
        error: 'عنوان الوحدة يجب أن يحتوي على أحرف عربية فقط',
        code: 'INVALID_CHARACTERS'
      });
    }

    const classExists = await db.get('SELECT id FROM classes WHERE id = ?', [class_idNum]);
    if (!classExists) {
      return res.status(404).json({
        error: 'الصف الدراسي غير موجود',
        code: 'CLASS_NOT_FOUND'
      });
    }

    const validTerm = req.body.term || '1';

    const existingUnit = await db.get(
      'SELECT id FROM units WHERE class_id = ? AND title = ? AND term = ? AND id != ?',
      [class_idNum, trimmed, validTerm, id]
    );

    if (existingUnit) {
      const termName = validTerm == '1' ? 'الفصل الدراسي الأول' : 'الفصل الدراسي الثاني';
      return res.status(409).json({
        error: `هذا العنوان موجود بالفعل في ${termName} لهذا الصف.`,
        code: 'DUPLICATE_UNIT_TITLE'
      });
    }

    const validCategory = category === 'Z' ? 'Z' : 'P';

    const result = await db.run(
      'UPDATE units SET title = ?, class_id = ?, category = ?, term = ? WHERE id = ?',
      [trimmed, class_idNum, validCategory, validTerm, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'الوحدة غير موجودة' });
    }

    const updatedUnit = await db.get('SELECT * FROM units WHERE id = ?', [id]);
    res.json(updatedUnit);
  } catch (error) {
    console.error('Error updating unit:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

// ADMIN: Delete unit
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const parsed = parsePositiveInteger(req.params.id);
    if (!parsed.valid) {
      return res.status(400).json({ error: 'Invalid unit id' });
    }
    const id = parsed.value;
    const result = await db.run('DELETE FROM units WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    res.json({ success: true, message: 'Unit deleted' });
  } catch (error) {
    console.error('Error deleting unit:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN: Reorder units
router.post('/reorder', authenticateToken, async (req, res) => {
  try {
    const { order } = req.body; // Array of IDs in new order

    if (!order || !Array.isArray(order)) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    // Process reordering in transaction-like manner
    const updates = order.map((id, index) => {
      return db.run('UPDATE units SET display_order = ? WHERE id = ?', [index, id]);
    });

    await Promise.all(updates);

    res.json({ success: true, message: 'Units reordered successfully' });
  } catch (error) {
    console.error('Error reordering units:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

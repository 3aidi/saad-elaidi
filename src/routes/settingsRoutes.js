const express = require('express');
const db = require('../database/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Map database row to API response shape
function mapIdentityRow(row) {
  if (!row) return null;
  return {
    schoolName: row.school_name,
    platformLabel: row.platform_label,
    adminName: row.admin_name,
    adminRole: row.admin_role,
  };
}

// Default fallback identity (must match frontend defaults)
const DEFAULT_IDENTITY = {
  schoolName: 'مدرسة أبو فراس الحمداني للتعليم الأساسي',
  platformLabel: 'المنصة التعليمية',
  adminName: 'إدارة المدرسة',
  adminRole: 'مسؤول النظام التعليمي',
};

// Public: Get current school identity (used by public & admin frontends)
router.get('/identity', async (req, res) => {
  try {
    const row = await db.get(
      'SELECT school_name, platform_label, admin_name, admin_role FROM identity_settings LIMIT 1'
    );
    const identity = mapIdentityRow(row) || DEFAULT_IDENTITY;
    res.json(identity);
  } catch (error) {
    console.error('Error fetching identity settings:', error);
    res.status(500).json({ error: 'فشل تحميل إعدادات المدرسة' });
  }
});

// Admin-only: Update school identity
router.put('/identity', authenticateToken, async (req, res) => {
  try {
    let { schoolName, platformLabel, adminName, adminRole } = req.body || {};

    // Basic validation and sanitization
    const normalize = (v) => (typeof v === 'string' ? v.trim() : '');
    schoolName = normalize(schoolName);
    platformLabel = normalize(platformLabel);
    adminName = normalize(adminName);
    adminRole = normalize(adminRole);

    if (!schoolName || !platformLabel || !adminName || !adminRole) {
      return res
        .status(400)
        .json({ error: 'جميع الحقول مطلوبة: اسم المدرسة، اسم المنصة، جهة الإدارة، وصف جهة الإدارة' });
    }

    // Reasonable length limits to keep UI clean
    const maxLen = 150;
    if (
      schoolName.length > maxLen ||
      platformLabel.length > maxLen ||
      adminName.length > maxLen ||
      adminRole.length > maxLen
    ) {
      return res
        .status(400)
        .json({ error: `يجب ألا يتجاوز كل حقل ${maxLen} حرفًا` });
    }

    const existing = await db.get(
      'SELECT id FROM identity_settings LIMIT 1'
    );

    if (!existing) {
      await db.run(
        'INSERT INTO identity_settings (school_name, platform_label, admin_name, admin_role) VALUES (?, ?, ?, ?)',
        [schoolName, platformLabel, adminName, adminRole]
      );
    } else {
      await db.run(
        'UPDATE identity_settings SET school_name = ?, platform_label = ?, admin_name = ?, admin_role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [schoolName, platformLabel, adminName, adminRole, existing.id]
      );
    }

    res.json({ schoolName, platformLabel, adminName, adminRole });
  } catch (error) {
    console.error('Error updating identity settings:', error);
    res.status(500).json({ error: 'فشل تحديث إعدادات المدرسة' });
  }
});

module.exports = router;


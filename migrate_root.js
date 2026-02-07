require('dotenv').config();
const db = require('./src/database/database');

async function migrate() {
    console.log('Starting migration from ROOT...');
    const isPostgres = process.env.DATABASE_URL && process.env.NODE_ENV === 'production';

    // Helper to run query and ignore specific errors
    async function runSafe(sql, description) {
        try {
            await db.run(sql);
            console.log(`✓ ${description}`);
        } catch (e) {
            if (e.message.includes('duplicate column') || e.message.includes('no such column')) {
                console.log(`  ! ${description} (already done or skipped)`);
            } else {
                console.log(`  X Failed: ${description} - ${e.message}`);
            }
        }
    }

    try {
        if (isPostgres) {
            await runSafe('ALTER TABLE classes ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0', 'Add display_order to classes');
            await runSafe('ALTER TABLE units ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0', 'Add display_order to units');
            await runSafe("ALTER TABLE units ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'P'", 'Add category to units');
        } else {
            // SQLite
            await runSafe('ALTER TABLE classes ADD COLUMN display_order INTEGER DEFAULT 0', 'Add display_order to classes');
            await runSafe('ALTER TABLE units ADD COLUMN display_order INTEGER DEFAULT 0', 'Add display_order to units');
            await runSafe("ALTER TABLE units ADD COLUMN category TEXT DEFAULT 'P'", 'Add category to units');
        }
        console.log('Migration finished.');
        process.exit(0);
    } catch (err) {
        console.error('Migration fatal error:', err);
        process.exit(1);
    }
}

migrate();

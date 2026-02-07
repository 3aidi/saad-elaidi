require('dotenv').config();
const db = require('./src/database/database');

async function migrate() {
    console.log('Starting migration: Add TERM column to UNITS...');

    // Helper to run query and ignore specific errors
    async function runSafe(sql, description) {
        try {
            await db.run(sql);
            console.log(`✓ ${description}`);
        } catch (e) {
            if (e.message.includes('duplicate column') || e.message.includes('no such column')) {
                console.log(`  ! ${description} (likely already exists)`);
            } else {
                console.log(`  X Failed: ${description} - ${e.message}`);
            }
        }
    }

    try {
        await db.connect(); // Ensure connection

        // Add term column, default to '1' (First Term)
        await runSafe("ALTER TABLE units ADD COLUMN term TEXT DEFAULT '1'", 'Add term column to units');

        console.log('Migration finished.');
        process.exit(0);
    } catch (err) {
        console.error('Migration fatal error:', err);
        process.exit(1);
    }
}

migrate();

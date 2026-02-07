console.log('Loading modules...');
try {
    require('dotenv').config();
    const db = require('./src/database/database');
    console.log('Modules loaded.');

    async function migrate() {
        console.log('Connecting to DB...');
        // Force SQLite mode if not production to be safe, or rely on db.js logic
        await db.connect();
        console.log('Connected.');

        const queries = [
            "ALTER TABLE classes ADD COLUMN display_order INTEGER DEFAULT 0",
            "ALTER TABLE units ADD COLUMN display_order INTEGER DEFAULT 0",
            "ALTER TABLE units ADD COLUMN category TEXT DEFAULT 'P'"
        ];

        for (const sql of queries) {
            console.log(`Executing: ${sql}`);
            try {
                await db.run(sql);
                console.log('  -> Success');
            } catch (e) {
                console.log(`  -> Error (expected if exists): ${e.message}`);
            }
        }

        console.log('Done.');
        process.exit(0);
    }

    migrate();
} catch (e) {
    console.error('Fatal script error:', e);
}

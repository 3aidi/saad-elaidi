const db = require('./src/database/database');
async function check() {
    try {
        const indexes = await db.all('PRAGMA index_list(units)');
        for (const idx of indexes) {
            const info = await db.all(`PRAGMA index_info('${idx.name}')`);
            console.log(`Index ${idx.name} (Unique: ${idx.unique}):`, info.map(i => i.name).join(', '));
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();

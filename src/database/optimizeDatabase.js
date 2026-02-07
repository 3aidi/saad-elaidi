const db = require('./database');

/**
 * Database Performance Optimization
 * Creates indexes to speed up frequent queries
 */

async function optimizeDatabase() {
  console.log('🔧 Optimizing database...');

  try {
    // Index on classes (already has primary key, no additional index needed for simple queries)
    
    // Index on units - frequently queried by class_id
    await db.run('CREATE INDEX IF NOT EXISTS idx_units_class_id ON units(class_id)');
    console.log('✓ Index created: units.class_id');
    
    // Index on lessons - frequently queried by unit_id
    await db.run('CREATE INDEX IF NOT EXISTS idx_lessons_unit_id ON lessons(unit_id)');
    console.log('✓ Index created: lessons.unit_id');
    
    // Index on videos - frequently queried by lesson_id
    await db.run('CREATE INDEX IF NOT EXISTS idx_videos_lesson_id ON videos(lesson_id)');
    console.log('✓ Index created: videos.lesson_id');
    
    // Index on images - frequently queried by lesson_id
    await db.run('CREATE INDEX IF NOT EXISTS idx_images_lesson_id ON images(lesson_id)');
    console.log('✓ Index created: images.lesson_id');
    
    // Index on questions - frequently queried by lesson_id
    await db.run('CREATE INDEX IF NOT EXISTS idx_questions_lesson_id ON questions(lesson_id)');
    console.log('✓ Index created: questions.lesson_id');
    
    // Composite index for admin lookup of units with class info
    await db.run('CREATE INDEX IF NOT EXISTS idx_units_class_created ON units(class_id, created_at)');
    console.log('✓ Index created: units(class_id, created_at)');
    
    // Composite index for admin lookup of lessons with unit info
    await db.run('CREATE INDEX IF NOT EXISTS idx_lessons_unit_created ON lessons(unit_id, created_at)');
    console.log('✓ Index created: lessons(unit_id, created_at)');
    
    console.log('✅ Database optimization complete');
  } catch (error) {
    console.error('⚠️  Database optimization error:', error.message);
    console.error('This may be normal if indexes already exist or DB is read-only');
  }
}

module.exports = { optimizeDatabase };

// Run if called directly
if (require.main === module) {
  db.connect().then(() => {
    optimizeDatabase().then(() => {
      console.log('Done');
      process.exit(0);
    }).catch(err => {
      console.error('Failed:', err);
      process.exit(1);
    });
  });
}

/**
 * Security Setup Script
 * Generates secure random secrets for production deployment
 * 
 * Usage: node generate-secure-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 SECURITY SETUP - SECURE SECRETS GENERATOR\n');
console.log('=' .repeat(60));

// Generate JWT Secret (64 bytes = 128 hex characters)
const jwtSecret = crypto.randomBytes(64).toString('hex');

console.log('\n✅ JWT_SECRET (Copy to .env file):');
console.log('-'.repeat(60));
console.log(`JWT_SECRET=${jwtSecret}`);

console.log('\n📋 INSTRUCTIONS:');
console.log('1. Copy the JWT_SECRET above');
console.log('2. Add it to your .env file');
console.log('3. NEVER commit .env file to version control');
console.log('4. Generate NEW secrets for each environment');
console.log('\n⚠️  IMPORTANT:');
console.log('- Keep this secret safe and secure');
console.log('- Do not share via email, chat, or public channels');
console.log('- Store in environment variables or secret management system');
console.log('- Rotate this secret periodically (every 90 days recommended)');

console.log('\n🔑 ADDITIONAL SECURITY RECOMMENDATIONS:');
console.log('- Enable HTTPS in production (use Let\'s Encrypt)');
console.log('- Set NODE_ENV=production in production');
console.log('- Configure firewall rules');
console.log('- Enable database backups');
console.log('- Set up monitoring and alerts');

console.log('\n' + '='.repeat(60));
console.log('✨ Setup complete! Keep your secrets safe!\n');

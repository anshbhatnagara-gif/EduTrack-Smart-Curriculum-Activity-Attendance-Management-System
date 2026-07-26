const bcrypt = require('bcryptjs');
const { query } = require('../src/config/database');
require('dotenv').config();

async function createAdmin() {
  const name = process.env.ADMIN_NAME || 'EduTrack Admin';
  const email = process.env.ADMIN_EMAIL || 'admin@edutrack.local';
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    console.error('[ERROR] ADMIN_PASSWORD environment variable is not defined in .env');
    process.exit(1);
  }

  console.log(`Checking if Admin user "${email}" exists...`);

  try {
    const existing = await query('SELECT id FROM users WHERE email = ?', [email]);

    if (existing.length > 0) {
      console.log(`[INFO] Admin user with email "${email}" already exists (ID: ${existing[0].id}).`);
      return;
    }

    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    console.log('Inserting Admin user into database...');
    const result = await query(
      `INSERT INTO users (full_name, email, phone, password_hash, role, status)
       VALUES (?, ?, ?, ?, 'admin', 'active')`,
      [name, email, '0000000000', passwordHash]
    );

    console.log(`[SUCCESS] Admin user created successfully with ID: ${result.insertId}`);
  } catch (error) {
    console.error('[ERROR] Failed to seed Admin user:');
    console.error(error.message);
    process.exit(1);
  }
}

createAdmin().then(() => {
  console.log('Seed admin script finished.');
  process.exit(0);
});

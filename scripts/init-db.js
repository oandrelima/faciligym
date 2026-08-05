const postgres = require('postgres');

const UNPOOLED_URL = 'postgresql://neondb_owner:npg_D7dywqTpAH3l@ep-twilight-violet-axiojrl6.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require';

const sql = postgres(UNPOOLED_URL, { ssl: 'require' });

async function init() {
  console.log('Connecting to Neon PostgreSQL and updating schema for communities and chat...');

  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS diet_calories INT DEFAULT 2000;`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS diet_protein_g NUMERIC(5,1) DEFAULT 150.0;`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS diet_carbs_g NUMERIC(5,1) DEFAULT 200.0;`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS diet_fats_g NUMERIC(5,1) DEFAULT 50.0;`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS diet_configured BOOLEAN DEFAULT FALSE;`;

    // Create Communities Table
    await sql`
      CREATE TABLE IF NOT EXISTS communities (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        code VARCHAR(100) NOT NULL,
        created_by VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create Community Messages Table
    await sql`
      CREATE TABLE IF NOT EXISTS community_messages (
        id VARCHAR(100) PRIMARY KEY,
        community_id VARCHAR(100) NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
        sender_id VARCHAR(100) NOT NULL,
        sender_name VARCHAR(150) NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log('Database tables for communities & messages updated successfully!');
  } catch (err) {
    console.error('Error updating database:', err);
  } finally {
    await sql.end();
  }
}

init();

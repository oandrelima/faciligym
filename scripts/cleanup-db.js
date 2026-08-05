const postgres = require('postgres');

const UNPOOLED_URL = process.env.DATABASE_URL || process.env.EXPO_PUBLIC_DATABASE_URL || '';

const sql = postgres(UNPOOLED_URL, { ssl: 'require' });

async function cleanupDB() {
  console.log('Auditando e limpando estrutura do PostgreSQL...');

  try {
    // Drop unused columns if any
    await sql`ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;`;
    
    // Remove orphaned data or mock users that are no longer used
    await sql`DELETE FROM users WHERE email = 'atleta@faciligym.app';`;

    // Ensure performance indexes exist on active tables
    await sql`CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_weight_user_date ON weight_history(user_id, date);`;

    console.log('Limpeza do banco de dados concluída com sucesso!');
  } catch (err) {
    console.error('Erro na limpeza do banco de dados:', err);
  } finally {
    await sql.end();
  }
}

cleanupDB();

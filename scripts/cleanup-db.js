const postgres = require('postgres');

const UNPOOLED_URL = 'postgresql://neondb_owner:npg_D7dywqTpAH3l@ep-twilight-violet-axiojrl6.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require';

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

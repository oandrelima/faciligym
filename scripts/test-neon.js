const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL || process.env.EXPO_PUBLIC_DATABASE_URL || '');

async function main() {
  const users = await sql`SELECT id, name, email, onboarding_completed FROM users`;
  console.log('Neon DB Users:', users);
}

main();

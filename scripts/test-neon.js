const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_D7dywqTpAH3l@ep-twilight-violet-axiojrl6.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require');

async function main() {
  const users = await sql`SELECT id, name, email, onboarding_completed FROM users`;
  console.log('Neon DB Users:', users);
}

main();

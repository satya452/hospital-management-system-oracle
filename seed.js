import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
  console.log('Seeding Oracle Database 11g XE...');

  const user = process.env.ORACLE_USER || 'hms';
  const password = process.env.ORACLE_PASSWORD;
  const connect = process.env.ORACLE_CONNECT_STRING || 'localhost:1521/XE';
  if (!password || /[\r\n]/.test(user + password + connect)) throw new Error('Set valid Oracle credentials in backend/.env');
  const commands = `
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
CONNECT ${user}/"${password.replaceAll('"', '""')}"@${connect}
@backend/oracle_schema.sql
@backend/oracle_plsql.sql
@backend/oracle_seed.sql
exit;
`;

  try {
    const output = execSync('sqlplus -s /nolog', {
      input: commands,
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf-8'
    });
    console.log(output);
    console.log('\nâœ“ Oracle Database seeded successfully with 7 tables, PL/SQL procedures, triggers, and sequences.');
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  }
}

seed().catch(console.error);

/**
 * Global Test Setup
 *
 * Runs before any test file. Ensures tests NEVER execute against
 * a production database by verifying DATABASE_URL contains "_test".
 *
 * If DATABASE_URL is not set, it automatically points to a local
 * test database (arcane_ledger_test) so tests are safe by default.
 */

const dbUrl = process.env.DATABASE_URL ?? '';

// Auto-configure test database if not set
if (!dbUrl) {
  process.env.DATABASE_URL =
    'postgresql://arcane:arcane_dev_pass@localhost:5432/arcane_ledger_test';
}

// Safety check: refuse to run against a database that doesn't look like a test DB
const finalUrl = process.env.DATABASE_URL!;
if (!finalUrl.includes('_test') && !finalUrl.includes('test')) {
  console.error(
    '\n🛑 SAFETY: Tests refused to run.\n' +
    `   DATABASE_URL does not contain "_test": ${finalUrl}\n` +
    '   Tests create and delete real data — never run against production.\n\n' +
    '   Fix: set DATABASE_URL to a test database, e.g.:\n' +
    '   DATABASE_URL=postgresql://arcane:pass@localhost:5432/arcane_ledger_test\n',
  );
  process.exit(1);
}

// Set NODE_ENV for any code that checks it
process.env.NODE_ENV = 'test';

// Set JWT_SECRET for tests (required by auth middleware)
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-for-vitest';
}

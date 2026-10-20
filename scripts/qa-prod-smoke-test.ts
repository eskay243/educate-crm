/**
 * Educate CRM — Production Smoke & Health Verification Suite
 * Executes non-destructive, read-only verification against the live production server.
 * 
 * Usage: npx tsx scripts/qa-prod-smoke-test.ts
 */

const PROD_URL = process.env.TEST_API_URL || 'https://growpot.cloud';

interface TestResult {
  id: string;
  category: string;
  name: string;
  passed: boolean;
  durationMs: number;
  details?: string;
  error?: string;
}

const results: TestResult[] = [];

async function runTest(
  id: string,
  category: string,
  name: string,
  fn: () => Promise<void>
) {
  const start = Date.now();
  process.stdout.write(`  [PROD-TEST] ${id.padEnd(14)} | ${name.padEnd(55)} ... `);
  try {
    await fn();
    const duration = Date.now() - start;
    results.push({ id, category, name, passed: true, durationMs: duration });
    console.log(`\x1b[32mPASS\x1b[0m (${duration}ms)`);
  } catch (err: any) {
    const duration = Date.now() - start;
    const errorMsg = err?.message || String(err);
    results.push({ id, category, name, passed: false, durationMs: duration, error: errorMsg });
    console.log(`\x1b[31mFAIL\x1b[0m (${duration}ms)`);
    console.error(`              \x1b[31mError: ${errorMsg}\x1b[0m`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(path: string, options: RequestInit = {}) {
  const url = `${PROD_URL}${path}`;
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-user-role': 'super_admin',
    'x-user-email': 'abiola.adefowope@codelab.institute',
  };

  const res = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers as Record<string, string>),
    },
  });

  let body: any = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    body = await res.json();
  } else {
    body = await res.text();
  }

  return { status: res.status, headers: res.headers, body };
}

async function main() {
  console.log('================================================================================');
  console.log('🌐 EDUCATE CRM — PRODUCTION SMOKE & VERIFICATION SUITE');
  console.log(`📡 Target Production URL: ${PROD_URL}`);
  console.log('🛡️ Mode: Strictly Non-Destructive (Zero dummy records created)');
  console.log('================================================================================\n');

  // 1. HEALTH & CORE BOOTSTRAP
  console.log('--- [STAGE 1: PRODUCTION HEALTH & BOOTSTRAP] ---');
  await runTest('PRD-SYS-001', 'System Health', 'Production /api/health endpoint returns 200 & healthy', async () => {
    const res = await request('/api/health');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = res.body?.data || res.body;
    assert(data?.status === 'healthy', `Expected healthy status, got ${data?.status}`);
  });

  await runTest('PRD-SYS-002', 'Bootstrap', 'Production /api/bootstrap returns system datasets', async () => {
    const res = await request('/api/bootstrap');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = res.body?.data || res.body;
    assert(data?.settings !== undefined, 'Expected settings in bootstrap');
    assert(Array.isArray(data?.courses) || Array.isArray(data?.students), 'Expected core collections');
  });

  // 2. LIVE ROLE AUTHENTICATION
  console.log('\n--- [STAGE 2: LIVE MULTI-ROLE AUTHENTICATION] ---');
  const prodRoles = [
    { role: 'super_admin', email: 'abiola.adefowope@codelab.institute', password: 'password123' },
    { role: 'program_officer', email: 'program.officer@codelab.institute', password: 'password123' },
    { role: 'admissions', email: 'admissions@codelab.institute', password: 'password123' },
    { role: 'finance', email: 'finance@codelab.institute', password: 'password123' },
    { role: 'mentor', email: 'chidi.okeke@codelab.institute', password: 'password123' },
    { role: 'student', email: 'student@codelab.institute', password: 'password123' },
  ];

  for (const account of prodRoles) {
    await runTest(`PRD-AUTH-${account.role}`, 'Authentication', `Verify live credentials for role: ${account.role}`, async () => {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: account.email, password: account.password }),
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body?.success === true, 'Expected success === true');
      const user = res.body?.user || res.body?.data;
      assert(user?.email?.toLowerCase() === account.email.toLowerCase(), `Email mismatch: ${user?.email}`);
    });
  }

  await runTest('PRD-AUTH-NEG-1', 'Auth Guard', 'Login fails on incorrect password with 401 Unauthorized', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'abiola.adefowope@codelab.institute', password: 'wrongPassword!999' }),
    });
    assert(res.status === 401, `Expected 401 Unauthorized, got ${res.status}`);
    assert(res.body?.success === false, 'Expected success === false');
  });

  await runTest('PRD-AUTH-NEG-2', 'Auth Guard', 'Login fails on unregistered account with 401 Unauthorized', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'nonexistent.user.2026@codelab.institute', password: 'anyPassword' }),
    });
    assert(res.status === 401, `Expected 401 Unauthorized, got ${res.status}`);
    assert(res.body?.success === false, 'Expected success === false');
  });

  // 3. CURRICULUM, ROLES & BACKUPS
  console.log('\n--- [STAGE 3: CURRICULUM, GOVERNANCE & BACKUP READ-ONLY APIS] ---');
  await runTest('PRD-DATA-001', 'Courses', 'Fetch active curriculum courses list', async () => {
    const res = await request('/api/courses');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = res.body?.data || res.body;
    assert(Array.isArray(data), 'Expected array of courses');
    assert(data.length > 0, 'Expected at least 1 course in catalog');
  });

  await runTest('PRD-DATA-002', 'Governance', 'Fetch custom roles and permissions catalog', async () => {
    const res = await request('/api/roles');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = res.body?.data || res.body;
    assert(Array.isArray(data), 'Expected roles array');
  });

  await runTest('PRD-DATA-003', 'Database Backup', 'Super Admin export database backup JSON integrity', async () => {
    const res = await request('/api/backups/export');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const backup = res.body?.data?.data || res.body?.data || res.body;
    assert(Array.isArray(backup.students), 'Expected students array');
    assert(Array.isArray(backup.staffUsers) || Array.isArray(backup.staff), 'Expected staff array');
    assert(backup.settings !== undefined, 'Expected settings object');
  });

  // SUMMARY REPORT
  console.log('\n================================================================================');
  console.log('📊 PRODUCTION SMOKE TEST EXECUTION SUMMARY');
  console.log('================================================================================');

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((acc, r) => acc + r.durationMs, 0);

  console.log(`Total Smoke Tests Executed : ${total}`);
  console.log(`Passed                     : \x1b[32m${passed}\x1b[0m`);
  console.log(`Failed                     : ${failed > 0 ? `\x1b[31m${failed}\x1b[0m` : '\x1b[32m0\x1b[0m'}`);
  console.log(`Execution Time             : ${(totalDuration / 1000).toFixed(2)}s`);
  console.log('================================================================================\n');

  if (failed > 0) {
    console.error('❌ Production Failures Detected:');
    results.filter(r => !r.passed).forEach(r => {
      console.error(`  - [${r.id}] ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log('🎉 ALL PRODUCTION SMOKE TESTS PASSED! LIVE INSTANCE FULLY OPERATIONAL!');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal Production Smoke Test Exception:', err);
  process.exit(1);
});

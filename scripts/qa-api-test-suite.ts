/**
 * Comprehensive Automated End-to-End QA Regression Test Suite
 * Tests all 11 modules, 60+ API endpoints, role boundaries, and governance constraints.
 * 
 * Usage: npx tsx scripts/qa-api-test-suite.ts
 */

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5001';

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
  process.stdout.write(`  [TEST] ${id.padEnd(14)} | ${name.padEnd(55)} ... `);
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
    console.error(`         \x1b[31mError: ${errorMsg}\x1b[0m`);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(path: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  let body: any = null;
  const text = await res.text();
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, headers: res.headers, body };
}

async function main() {
  console.log('================================================================================');
  console.log('🧪 EDUCATE CRM — COMPREHENSIVE AUTOMATED QA REGRESSION TEST SUITE');
  console.log(`📡 Target API: ${BASE_URL}`);
  console.log('================================================================================\n');

  // ============================================================================
  // SUITE 1: SYSTEM HEALTH & BOOTSTRAP
  // ============================================================================
  console.log('\n--- [SUITE 1: SYSTEM HEALTH & BOOTSTRAP] ---');

  await runTest('QA-SYS-001', 'System', 'API Health Check Endpoint returns 200 and healthy status', async () => {
    const res = await request('/api/health');
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    assert(res.body?.status === 'healthy', `Expected healthy, got ${res.body?.status}`);
  });

  await runTest('QA-SYS-002', 'System', 'API Bootstrap Endpoint returns all core institutional datasets', async () => {
    const res = await request('/api/bootstrap');
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    const data = res.body?.data || res.body;
    assert(Array.isArray(data.students), 'Expected students array');
    assert(Array.isArray(data.mentors), 'Expected mentors array');
    assert(Array.isArray(data.leads), 'Expected leads array');
    assert(Array.isArray(data.courses), 'Expected courses array');
    assert(Array.isArray(data.cohorts), 'Expected cohorts array');
    assert(Array.isArray(data.expenses), 'Expected expenses array');
    assert(Array.isArray(data.tickets), 'Expected tickets array');
    assert(data.settings !== undefined, 'Expected settings object');
  });

  // ============================================================================
  // SUITE 2: AUTHENTICATION & MULTI-ROLE SECURITY
  // ============================================================================
  console.log('\n--- [SUITE 2: AUTHENTICATION & MULTI-ROLE SECURITY] ---');

  const demoAccounts = [
    { role: 'super_admin', email: 'abiola.adefowope@codelab.institute' },
    { role: 'program_officer', email: 'program.officer@codelab.institute' },
    { role: 'admissions', email: 'admissions@codelab.institute' },
    { role: 'finance', email: 'finance@codelab.institute' },
    { role: 'mentor', email: 'chidi.okeke@codelab.institute' },
    { role: 'student', email: 'student@codelab.institute' },
  ];

  for (const acc of demoAccounts) {
    await runTest(`QA-AUTH-001-${acc.role}`, 'Auth', `Login authentication for ${acc.role} (${acc.email})`, async () => {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: acc.email, password: 'password123' }),
      });
      assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
      assert(res.body?.success === true, 'Expected success === true');
      assert(res.body?.user?.role === acc.role, `Expected role ${acc.role}, got ${res.body?.user?.role}`);
    });
  }

  await runTest('QA-AUTH-002', 'Auth', 'Login fails on incorrect password with 401 Unauthorized', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'abiola.adefowope@codelab.institute', password: 'wrongpassword' }),
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
    assert(res.body?.success === false, 'Expected success === false');
  });

  await runTest('QA-AUTH-003', 'Auth', 'Login fails on non-existent account with 401 Unauthorized', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'nonexistent.user@codelab.institute', password: 'password123' }),
    });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  // ============================================================================
  // SUITE 3: LEADS PIPELINE & CONVERSION
  // ============================================================================
  console.log('\n--- [SUITE 3: LEADS PIPELINE & STUDENT CONVERSION] ---');

  let testLeadId = '';
  await runTest('QA-LED-001', 'Leads', 'Create new prospective student lead', async () => {
    const res = await request('/api/leads', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Olufunke Adeleke',
        email: `olufunke.qa.${Date.now()}@test.com`,
        phone: '+234 803 999 8877',
        company: 'Fidelity Tech',
        programInterest: 'Full-Stack Software Engineering',
        status: 'New',
        score: 65,
        source: 'Google Ads',
        assignedRep: 'Zainab Bello',
      }),
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    const lead = res.body?.data || res.body;
    assert(lead?.id !== undefined, 'Expected lead id to be defined');
    testLeadId = lead.id;
  });

  await runTest('QA-LED-002', 'Leads', 'Update lead stage to Qualified', async () => {
    assert(testLeadId !== '', 'Lead ID must be defined');
    const res = await request(`/api/leads/${testLeadId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Qualified', score: 85 }),
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    const lead = res.body?.data || res.body;
    assert(lead?.status === 'Qualified', `Expected status Qualified, got ${lead?.status}`);
  });

  let convertedStudentId = '';
  await runTest('QA-LED-003', 'Leads', 'Atomic Convert Lead to Student Scholar with default password', async () => {
    assert(testLeadId !== '', 'Lead ID must be defined');
    const res = await request(`/api/leads/${testLeadId}/convert`, {
      method: 'POST',
      body: JSON.stringify({
        cohort: 'Cohort Alpha 2026',
        program: 'Full-Stack Software Engineering',
        totalFees: 350000,
      }),
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    const student = res.body?.data?.student || res.body?.student || res.body;
    assert(student?.name === 'Olufunke Adeleke', `Expected student name Olufunke Adeleke, got ${student?.name}`);
    assert(student?.mustResetPassword === true, 'Expected mustResetPassword to be true');
    assert(typeof student?.password === 'string' && student?.password.length > 0, 'Expected default password generated');
    convertedStudentId = student.id;
  });

  // ============================================================================
  // SUITE 4: STUDENT ONBOARDING, BIODATA & CERTIFICATES
  // ============================================================================
  console.log('\n--- [SUITE 4: STUDENT ENROLLMENT, 3-TIER KYC & CERTIFICATES] ---');

  let directStudentId = '';
  await runTest('QA-STU-001', 'Students', 'Manual student enrollment with Nigerian 3-Tier KYC & Drive links', async () => {
    const res = await request('/api/students', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Chukwudi Nwachukwu',
        email: `chukwudi.qa.${Date.now()}@test.com`,
        phone: '+234 809 555 4433',
        program: 'Full-Stack Software Engineering',
        cohort: 'Cohort Alpha 2026',
        tuitionStatus: 'Partial',
        totalFees: 350000,
        paidAmount: 150000,
        outstandingBalance: 200000,
        curriculumDriveUrl: 'https://drive.google.com/file/d/test-curriculum',
        handbookDriveUrl: 'https://drive.google.com/file/d/test-handbook',
        stateOfOrigin: 'Enugu',
        lga: 'Nsukka',
        idType: 'NIN',
        idNumber: '89102938475',
        bankName: 'Zenith Bank PLC',
        bankCode: '057',
        accountNumber: '1012345678',
        accountName: 'Chukwudi Nwachukwu',
        isBankVerified: true,
        kycTier: 'Tier 3',
        kycStatus: 'Verified',
      }),
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    const student = res.body?.data || res.body;
    assert(student?.id !== undefined, 'Expected student id');
    assert(student?.mustResetPassword === true, 'Expected mustResetPassword === true');
    directStudentId = student.id;
  });

  await runTest('QA-STU-002', 'Students', 'Update student demographic & academic biodata', async () => {
    assert(directStudentId !== '', 'Student ID must be defined');
    const res = await request(`/api/students/${directStudentId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        phone: '+234 809 555 9999',
        attendanceRate: 98,
        attendedLearningHours: 42,
        progressPercent: 100,
      }),
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    const student = res.body?.data || res.body;
    assert(student?.phone === '+234 809 555 9999', 'Expected updated phone number');
  });

  await runTest('QA-STU-003', 'Students', 'Dispatch tuition payment reminder notification', async () => {
    assert(directStudentId !== '', 'Student ID must be defined');
    const res = await request(`/api/students/${directStudentId}/payment-reminder`, {
      method: 'POST',
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    assert(res.body?.success === true, 'Expected reminder dispatch success');
  });

  await runTest('QA-STU-004', 'Students', 'Record student bank transfer payment proof', async () => {
    assert(directStudentId !== '', 'Student ID must be defined');
    const res = await request(`/api/students/${directStudentId}/proof-of-payment`, {
      method: 'POST',
      body: JSON.stringify({
        amount: 100000,
        bankName: 'Zenith Bank PLC',
        referenceNumber: `NIP-TEST-${Date.now()}`,
        receiptProofUrl: 'https://codelab.institute/proofs/sample.pdf',
        notes: 'Tuition second installment via mobile app transfer',
      }),
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
  });

  await runTest('QA-STU-005', 'Students', 'Issue verifiable graduation certificate when learning hours >= 40', async () => {
    assert(directStudentId !== '', 'Student ID must be defined');
    const res = await request(`/api/students/${directStudentId}/issue-certificate`, {
      method: 'POST',
      body: JSON.stringify({ grade: 'Distinction', issueDate: '2026-10-20' }),
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    const data = res.body?.data || res.body;
    assert(data?.student?.certificateIssued === true || data?.certificateIssued === true, 'Expected certificateIssued to be true');
    assert(typeof (data?.certificateNumber || data?.student?.certificateNumber) === 'string', 'Expected certificateNumber generated');
  });

  // ============================================================================
  // SUITE 5: FACULTY MENTORS, GRADING & PAYOUTS (5% WHT)
  // ============================================================================
  console.log('\n--- [SUITE 5: FACULTY MENTORS & 5% WHT PAYOUTS] ---');

  let testMentorId = '';
  await runTest('QA-MNT-001', 'Mentors', 'Recruit new faculty mentor with expertise & NUBAN bank details', async () => {
    const res = await request('/api/mentors', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Engr. Amina Yusuf',
        email: `amina.qa.${Date.now()}@codelab.institute`,
        phone: '+234 802 777 6655',
        role: 'Senior Cloud Mentor',
        department: 'Cloud & DevOps Engineering',
        expertise: ['AWS', 'Docker', 'Kubernetes', 'Terraform'],
        bankName: 'Guaranty Trust Bank (GTBank)',
        bankCode: '058',
        accountNumber: '0234567891',
        accountName: 'Amina Yusuf',
        status: 'Active',
        lecturedHours: 28,
        minimumRequiredHours: 20,
      }),
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    const mentor = res.body?.data || res.body;
    assert(mentor?.id !== undefined, 'Expected mentor id');
    testMentorId = mentor.id;
  });

  let testPayoutId = '';
  await runTest('QA-MNT-002', 'Mentors', 'Submit faculty payout request with automatic 5% WHT deduction', async () => {
    assert(testMentorId !== '', 'Mentor ID must be defined');
    const grossAmount = 200000;
    const res = await request('/api/payout-requests', {
      method: 'POST',
      body: JSON.stringify({
        mentorId: testMentorId,
        mentorName: 'Engr. Amina Yusuf',
        mentorEmail: 'amina.qa@codelab.institute',
        amount: grossAmount,
        lecturedHours: 28,
        minimumRequiredHours: 20,
        bankName: 'Guaranty Trust Bank (GTBank)',
        bankCode: '058',
        accountNumber: '0234567891',
        accountName: 'Amina Yusuf',
      }),
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    const payout = res.body?.data || res.body;
    assert(payout?.amount === grossAmount, `Expected gross ${grossAmount}`);
    // 5% WHT of 200,000 = 10,000; Net = 190,000
    assert(payout?.whtDeductedAmount === 10000, `Expected WHT 10000, got ${payout?.whtDeductedAmount}`);
    assert(payout?.netDisbursedAmount === 190000, `Expected Net 190000, got ${payout?.netDisbursedAmount}`);
    assert(payout?.status === 'Pending', 'Expected status Pending');
    testPayoutId = payout.id;
  });

  await runTest('QA-MNT-003', 'Mentors', 'Approve mentor payout request by Super Admin / Finance', async () => {
    assert(testPayoutId !== '', 'Payout ID must be defined');
    const res = await request(`/api/payout-requests/${testPayoutId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'Approved',
        reviewedBy: 'Super Admin',
      }),
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    const payout = res.body?.data || res.body;
    assert(payout?.status === 'Approved', `Expected status Approved, got ${payout?.status}`);
  });

  await runTest('QA-MNT-004', 'Mentors', 'Edit pending payout request amount with automatic 5% WHT recalculation', async () => {
    // Create fresh pending payout request
    const createRes = await request('/api/payout-requests', {
      method: 'POST',
      body: JSON.stringify({
        mentorId: testMentorId,
        mentorName: 'Engr. Amina Yusuf',
        mentorEmail: 'amina.qa@codelab.institute',
        amount: 100000,
        lecturedHours: 25,
        minimumRequiredHours: 20,
      }),
    });
    const createdReq = createRes.body?.data || createRes.body;
    assert(createdReq?.id, 'Expected created payout request ID');

    // Edit amount to 150,000 NGN
    const patchRes = await request(`/api/payout-requests/${createdReq.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        amount: 150000,
        notes: 'Updated payout request memo after additional hours logged'
      })
    });
    assert(patchRes.status === 200, `Expected 200, got ${patchRes.status}`);
    const updated = patchRes.body?.data;
    assert(updated?.amount === 150000, `Expected amount 150000, got ${updated?.amount}`);
    // 5% WHT of 150,000 = 7,500; Net = 142,500
    assert(updated?.whtDeductedAmount === 7500, `Expected WHT 7500, got ${updated?.whtDeductedAmount}`);
    assert(updated?.netDisbursedAmount === 142500, `Expected Net 142500, got ${updated?.netDisbursedAmount}`);
  });

  // ============================================================================
  // SUITE 6: OPEX EXPENSES & 2-TIER SUPER ADMIN APPROVAL
  // ============================================================================
  console.log('\n--- [SUITE 6: OPEX EXPENSES & 2-TIER APPROVAL FLOW] ---');

  let testExpenseId = '';
  await runTest('QA-EXP-001', 'Expenses', 'Log OpEx requisition; status defaults to Pending Approval', async () => {
    const res = await request('/api/expenses', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Starlink Enterprise Satellite Internet Subscription',
        category: 'Utilities & Infrastructure',
        amount: 85000,
        payee: 'Starlink Internet Services Nigeria',
        payeeAccount: '0987654321',
        payeeBank: 'Access Bank Nigeria PLC',
        payeeBankCode: '044',
        requestedBy: 'Zainab Bello (Admissions)',
        receiptUrl: 'https://codelab.institute/receipts/starlink-oct2026.pdf',
        description: 'Monthly high-speed internet subscription for main learning campus',
      }),
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    const expense = res.body?.data || res.body;
    assert(expense?.id !== undefined, 'Expected expense id');
    assert(expense?.status === 'Pending Approval', `Expected Pending Approval, got ${expense?.status}`);
    testExpenseId = expense.id;
  });

  await runTest('QA-EXP-002', 'Expenses', 'Disbursement fails with HTTP 400 if expense is not Approved', async () => {
    assert(testExpenseId !== '', 'Expense ID must be defined');
    const res = await request('/api/wallet/disburse-expense', {
      method: 'POST',
      body: JSON.stringify({
        expenseId: testExpenseId,
        amount: 85000,
        accountNumber: '0987654321',
        bankCode: '044',
        disbursedByRole: 'admissions',
        disbursedByName: 'Zainab Bello',
      }),
    });
    // Strict requirement: HTTP 400 Bad Request
    assert(res.status === 400, `Expected HTTP 400 rejection, got ${res.status}`);
    assert(res.body?.success === false, 'Expected success === false');
  });

  await runTest('QA-EXP-003', 'Expenses', 'Super Admin approves OpEx requisition to Approved status', async () => {
    assert(testExpenseId !== '', 'Expense ID must be defined');
    const res = await request(`/api/expenses/${testExpenseId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'Approved',
        approvedBy: 'Abiola Adefowope (Super Admin)',
      }),
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    const expense = res.body?.data || res.body;
    assert(expense?.status === 'Approved', `Expected status Approved, got ${expense?.status}`);
  });

  await runTest('QA-EXP-004', 'Expenses', 'Authorized disburser executes Paystack disbursement for Approved expense', async () => {
    assert(testExpenseId !== '', 'Expense ID must be defined');
    // Ensure wallet is funded for OpEx disbursement
    await request('/api/wallet/topup/verify', {
      method: 'POST',
      body: JSON.stringify({ reference: `QA-TOP-${Date.now()}`, amountNaira: 500000 }),
    });

    const res = await request('/api/wallet/disburse-expense', {
      method: 'POST',
      body: JSON.stringify({
        expenseId: testExpenseId,
        amount: 85000,
        accountNumber: '0987654321',
        bankCode: '044',
        disbursementMethod: 'corporate_nip',
        nipSessionId: `NIP-EXP-TRF-${Date.now()}`,
        disbursedByRole: 'admissions',
        disbursedByName: 'Zainab Bello',
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}: ${res.body?.message || ''}`);
    assert(res.body?.success === true, 'Expected disbursement success');
    const transferRef = res.body?.data?.transferRef || res.body?.reference || res.body?.data?.expense?.transferReference;
    assert(typeof transferRef === 'string' && transferRef.length > 0, 'Expected transfer reference generated');
  });

  // ============================================================================
  // SUITE 7: CLASSROOM LMS & ASSIGNMENT GRADING
  // ============================================================================
  console.log('\n--- [SUITE 7: CLASSROOM LMS & ASSIGNMENT SUBMISSIONS] ---');

  let testLessonId = 'lesson-react-01';
  await runTest('QA-LMS-001', 'LMS', 'Student marks LMS curriculum lesson as complete', async () => {
    const activeStudentId = convertedStudentId || directStudentId || 'stu-1';
    const res = await request(`/api/lms/lessons/${testLessonId}/complete`, {
      method: 'POST',
      body: JSON.stringify({
        studentId: activeStudentId,
      }),
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    assert(res.body?.success === true, 'Expected lesson completion recorded');
  });

  let testSubmissionId = '';
  await runTest('QA-LMS-002', 'LMS', 'Student submits project assignment with GitHub & Live Demo URLs', async () => {
    const activeStudentId = convertedStudentId || directStudentId || 'stu-1';
    const res = await request('/api/lms/assignments/submit', {
      method: 'POST',
      body: JSON.stringify({
        studentId: activeStudentId,
        studentName: 'Olufunke Adeleke',
        taskTitle: 'Full-Stack REST API & Database Integration',
        courseTitle: 'Full-Stack Software Engineering',
        githubUrl: 'https://github.com/olufunke/educate-crm-api-task',
        liveUrl: 'https://educate-crm-demo.vercel.app',
        notes: 'Implemented with Express 5, TypeScript and PostgreSQL connection pooling.',
      }),
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    const sub = res.body?.data || res.body;
    assert(sub?.id !== undefined, 'Expected submission id');
    testSubmissionId = sub.id;
  });

  await runTest('QA-LMS-003', 'LMS', 'Faculty Mentor grades assignment with score and feedback', async () => {
    assert(testSubmissionId !== '', 'Submission ID must be defined');
    const res = await request(`/api/lms/assignments/${testSubmissionId}/grade`, {
      method: 'POST',
      body: JSON.stringify({
        grade: 96,
        mentorFeedback: 'Outstanding work. Code structure is modular and all endpoints are properly guarded.',
        status: 'Exceptional',
        gradedBy: 'Dr. Chidi Okeke',
      }),
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    const sub = res.body?.data || res.body;
    assert(sub?.grade === 96, `Expected grade 96, got ${sub?.grade}`);
    assert(sub?.status === 'Exceptional', `Expected status Exceptional, got ${sub?.status}`);
  });

  // ============================================================================
  // SUITE 8: UNIVERSAL SUPPORT TICKETS (ATTACHMENTS & TIMESTAMPS)
  // ============================================================================
  console.log('\n--- [SUITE 8: UNIVERSAL SUPPORT TICKETS] ---');

  let testTicketId = '';
  await runTest('QA-TCK-001', 'Tickets', 'Create ticket with multi-file attachments and priority', async () => {
    const res = await request('/api/tickets', {
      method: 'POST',
      body: JSON.stringify({
        title: 'LMS Video Player Buffering on Module 4',
        description: 'Encountered playback stall while streaming high-definition lesson 3.',
        category: 'academic',
        priority: 'high',
        createdBy: {
          id: 'user-student-demo',
          name: 'Adebayo Adeleke',
          email: 'student@codelab.institute',
          role: 'student',
          roleTitle: 'Enrolled Scholar',
        },
        attachments: [
          { name: 'console_error_log.txt', url: 'https://codelab.institute/logs/console.txt', size: 1420 },
          { name: 'player_screenshot.png', url: 'https://codelab.institute/shots/player.png', size: 84900 },
        ],
      }),
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    const ticket = res.body?.data || res.body;
    assert(ticket?.id !== undefined, 'Expected ticket id');
    assert(ticket?.ticketNumber !== undefined, 'Expected ticket number');
    assert(ticket?.attachments?.length === 2, 'Expected 2 attachments');
    assert(ticket?.status === 'open', 'Expected status open');
    testTicketId = ticket.id;
  });

  await runTest('QA-TCK-002', 'Tickets', 'Post comment response to ticket with attachment and timestamp', async () => {
    assert(testTicketId !== '', 'Ticket ID must be defined');
    const res = await request(`/api/tickets/${testTicketId}/comments`, {
      method: 'POST',
      body: JSON.stringify({
        authorName: 'Support Engineering Team',
        authorEmail: 'support@codelab.institute',
        authorRole: 'support',
        content: 'We have updated the CDN cache headers. Please clear local browser cache and verify.',
        attachments: [
          { name: 'cdn_fix_verification.pdf', url: 'https://codelab.institute/docs/cdn.pdf', size: 24000 },
        ],
      }),
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    const comment = res.body?.data || res.body;
    assert(typeof comment?.createdAt === 'string', 'Expected createdAt timestamp');
    assert(comment?.content !== undefined, 'Expected comment content');
  });

  await runTest('QA-TCK-003', 'Tickets', 'Resolve ticket with formal resolution notes', async () => {
    assert(testTicketId !== '', 'Ticket ID must be defined');
    const res = await request(`/api/tickets/${testTicketId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'resolved',
        isArchived: true,
        resolutionNotes: 'CDN origin stream re-encoded and verified across all student cohorts.',
        resolvedAt: new Date().toISOString(),
      }),
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    const ticket = res.body?.data || res.body;
    assert(ticket?.status === 'resolved', `Expected status resolved, got ${ticket?.status}`);
    assert(ticket?.isArchived === true, 'Expected ticket to be marked as isArchived');
  });

  await runTest('QA-TCK-004', 'Tickets', 'Support staff requests status confirmation on an open ticket', async () => {
    const res = await request(`/api/tickets/${testTicketId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        statusRequestedAt: new Date().toISOString(),
        statusRequestedBy: { id: 'usr-admin-1', name: 'Abiola Adefowope', role: 'super_admin' },
        statusRequestNote: 'Please verify if the video streaming issue is completely resolved.'
      }),
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    const ticket = res.body?.data || res.body;
    assert(ticket?.statusRequestedAt !== undefined, 'Expected statusRequestedAt to be set');
    assert(ticket?.statusRequestNote?.includes('Please verify'), 'Expected verification note');
  });

  // ============================================================================
  // SUITE 9: USER GOVERNANCE & ACCOUNT DEACTIVATION
  // ============================================================================
  console.log('\n--- [SUITE 9: USER GOVERNANCE & DEACTIVATION LOCK] ---');

  let testStaffId = '';
  const testStaffEmail = `test.staff.${Date.now()}@codelab.institute`;

  await runTest('QA-GOV-001', 'Governance', 'Create staff user account', async () => {
    const res = await request('/api/staff', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Kelechi Opara',
        email: testStaffEmail,
        role: 'program_officer',
        roleTitle: 'Assistant Program Officer',
        department: 'Academic Affairs',
        password: 'password123',
      }),
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    const staff = res.body?.data || res.body;
    assert(staff?.id !== undefined, 'Expected staff id');
    testStaffId = staff.id;
  });

  await runTest('QA-GOV-002', 'Governance', 'Deactivate user account; blocks login authentication', async () => {
    assert(testStaffId !== '', 'Staff ID must be defined');
    // Deactivate
    const patchRes = await request(`/api/users/${testStaffId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        isActive: false,
        status: 'Deactivated',
        deactivatedReason: 'Administrative security block by Super Admin',
      }),
    });
    assert(patchRes.status === 200, `Expected 200, got ${patchRes.status}`);

    // Verify login is blocked
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testStaffEmail, password: 'password123' }),
    });
    assert(loginRes.status === 401 || loginRes.status === 403, `Expected login rejection (401/403), got ${loginRes.status}`);
    assert(loginRes.body?.success === false, 'Expected success === false');
  });

  await runTest('QA-GOV-003', 'Governance', 'Reactivate user account and execute Super Admin password override', async () => {
    assert(testStaffId !== '', 'Staff ID must be defined');
    // Reactivate
    const activateRes = await request(`/api/users/${testStaffId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: true, status: 'Active' }),
    });
    assert(activateRes.status === 200, `Expected 200, got ${activateRes.status}`);

    // Reset password administratively
    const newPassword = 'NewSecretPassword#2026';
    const resetRes = await request(`/api/users/${testStaffId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
    assert(resetRes.status === 200, `Expected 200, got ${resetRes.status}`);

    // Verify login with new password
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testStaffEmail, password: newPassword }),
    });
    assert(loginRes.status === 200, `Expected 200, got ${loginRes.status}`);
    assert(loginRes.body?.success === true, 'Expected login success with overridden password');
  });

  // ============================================================================
  // SUITE 10: BACKUP & DATABASE SCHEMA INTEGRITY
  // ============================================================================
  console.log('\n--- [SUITE 10: DATABASE BACKUP & RESTORATION INTEGRITY] ---');

  await runTest('QA-DB-001', 'Database', 'Export full institutional database backup JSON', async () => {
    const res = await request('/api/backups/export');
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    const backup = res.body?.data?.data || res.body?.data || res.body;
    assert(Array.isArray(backup.students), 'Expected students array in backup');
    assert(Array.isArray(backup.staffUsers) || Array.isArray(backup.staff), 'Expected staff in backup');
    assert(Array.isArray(backup.expenses), 'Expected expenses in backup');
    assert(backup.settings !== undefined, 'Expected settings in backup');
  });

  // ============================================================================
  // SUITE 11: INSTITUTIONAL MULTI-ROLE CHAT & FILE SHARING
  // ============================================================================
  console.log('\n--- [SUITE 11: INSTITUTIONAL MULTI-ROLE CHAT & FILE SHARING] ---');

  let activeChatChannelId = '';
  await runTest('QA-CHT-001', 'Chat', 'Retrieve authorized chat channels for staff user', async () => {
    const res = await request('/api/chat/conversations?userId=usr-admin-1&role=super_admin');
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    const conversations = res.body?.data || [];
    assert(Array.isArray(conversations), 'Expected conversations array');
    assert(conversations.length >= 3, `Expected at least 3 channels, got ${conversations.length}`);
    const staffRoom = conversations.find((c: any) => c.name === 'staff-room');
    assert(staffRoom !== undefined, 'Expected staff-room channel');
    activeChatChannelId = staffRoom.id;
  });

  await runTest('QA-CHT-002', 'Chat', 'Staff dispatches message with file attachment and @mention', async () => {
    assert(activeChatChannelId !== '', 'Channel ID must be defined');
    const res = await request(`/api/chat/conversations/${activeChatChannelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        senderId: 'usr-admin-1',
        senderName: 'Abiola Adefowope',
        senderEmail: 'abiola.adefowope@codelab.institute',
        senderRole: 'super_admin',
        content: 'Hello @Zainab Bello, please review the attached updated syllabus for our software engineering cohort.',
        mentions: ['usr-admissions-1'],
        attachments: [
          {
            id: 'att-1',
            name: 'syllabus-q4-2026.pdf',
            url: 'https://codelab.institute/files/syllabus-q4.pdf',
            type: 'application/pdf',
            size: 154200
          }
        ]
      })
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    const msg = res.body?.data;
    assert(msg?.id !== undefined, 'Expected message ID');
    assert(msg?.attachments?.length === 1, 'Expected 1 attachment');
    assert(Array.isArray(msg?.mentions) && msg.mentions.includes('usr-admissions-1'), 'Expected mention recorded');
  });

  await runTest('QA-CHT-003', 'Chat', 'Initiate 1-on-1 direct message between authorized staff members', async () => {
    const res = await request('/api/chat/direct', {
      method: 'POST',
      body: JSON.stringify({
        senderId: 'usr-admin-1',
        senderEmail: 'abiola.adefowope@codelab.institute',
        senderName: 'Abiola Adefowope',
        senderRole: 'super_admin',
        targetUserId: 'usr-finance-1',
        targetEmail: 'finance@codelab.institute',
        targetName: 'Emeka Nwosu',
        targetRole: 'finance'
      })
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    const conv = res.body?.data;
    assert(conv?.type === 'direct', 'Expected direct conversation type');
    assert(Array.isArray(conv?.participants) && conv.participants.includes('usr-admin-1'), 'Expected sender in participants');
  });

  await runTest('QA-CHT-004', 'Chat', 'Permission boundary: Student blocked from messaging arbitrary student', async () => {
    const res = await request('/api/chat/direct', {
      method: 'POST',
      body: JSON.stringify({
        senderId: 'stu-demo-1',
        senderEmail: 'student1@codelab.institute',
        senderName: 'Student Alpha',
        senderRole: 'student',
        targetUserId: 'stu-demo-2',
        targetEmail: 'student2@codelab.institute',
        targetName: 'Student Beta',
        targetRole: 'student'
      })
    });
    assert(res.status === 403, `Expected HTTP 403 Forbidden, got ${res.status}`);
    assert(res.body?.success === false, 'Expected success === false');
  });

  let testMessageIdToEdit = '';
  await runTest('QA-CHT-005', 'Chat', 'Edit sent chat message with (edited) timestamp audit', async () => {
    assert(activeChatChannelId !== '', 'Channel ID must be defined');
    const sendRes = await request(`/api/chat/conversations/${activeChatChannelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        senderId: 'usr-admin-1',
        senderName: 'Abiola Adefowope',
        senderEmail: 'abiola.adefowope@codelab.institute',
        senderRole: 'super_admin',
        content: 'Original draft message before editing.',
      })
    });
    testMessageIdToEdit = sendRes.body?.data?.id;
    assert(testMessageIdToEdit, 'Expected new message ID');

    const editRes = await request(`/api/chat/messages/${testMessageIdToEdit}`, {
      method: 'PATCH',
      body: JSON.stringify({
        content: 'Updated and refined message content after editing.'
      })
    });
    assert(editRes.status === 200, `Expected 200, got ${editRes.status}`);
    assert(editRes.body?.data?.isEdited === true, 'Expected isEdited === true');
    assert(editRes.body?.data?.content.includes('Updated and refined'), 'Expected updated content');
  });

  await runTest('QA-CHT-006', 'Chat', 'Soft delete chat message with tombstone preserve', async () => {
    assert(testMessageIdToEdit !== '', 'Message ID must be defined');
    const delRes = await request(`/api/chat/messages/${testMessageIdToEdit}`, {
      method: 'DELETE',
      body: JSON.stringify({
        userId: 'usr-admin-1',
        userRole: 'super_admin'
      })
    });
    assert(delRes.status === 200, `Expected 200, got ${delRes.status}`);
    assert(delRes.body?.data?.isDeleted === true, 'Expected isDeleted === true');
    assert(delRes.body?.data?.content.includes('This message was deleted'), 'Expected tombstone content');
  });

  // ============================================================================
  // SUITE 12: AI DAILY STANDUP & WEEKLY SCRUM PERFORMANCE
  // ============================================================================
  console.log('\n--- [SUITE 12: AI DAILY STANDUP & WEEKLY SCRUM PERFORMANCE] ---');

  await runTest('QA-SCRUM-001', 'Scrum', 'Submit daily standup with module tags & receive AI coach feedback', async () => {
    const res = await request('/api/scrum/standup', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'usr-admin-1',
        userName: 'Abiola Adefowope',
        userRole: 'super_admin',
        userEmail: 'abiola.adefowope@codelab.institute',
        tasksYesterday: [
          {
            id: 'task-1',
            description: 'Resolved student admission inquiries and approved OpEx payouts',
            moduleId: 'expenses',
            status: 'completed'
          }
        ],
        tasksToday: [
          {
            id: 'task-2',
            description: 'Review faculty lectured hours and run weekly curriculum sync',
            moduleId: 'mentors',
            status: 'in_progress'
          }
        ],
        blockers: ['Pending third-party NIP transfer gateway confirmation'],
        taggedModuleIds: ['expenses', 'mentors']
      })
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    const standup = res.body?.data;
    assert(standup?.id !== undefined, 'Expected standup report ID');
    assert(typeof standup?.aiAgentFeedback === 'string' && standup.aiAgentFeedback.length > 0, 'Expected AI agent feedback');

    // Verify GET today endpoint returns same report
    const todayRes = await request('/api/scrum/standup/today?userId=usr-admin-1');
    assert(todayRes.status === 200, `Expected 200, got ${todayRes.status}`);
    assert(todayRes.body?.data?.id === standup.id, 'Expected today standup ID to match');
  });

  await runTest('QA-SCRUM-002', 'Scrum', 'Generate autonomous AI weekly performance audit with grade and velocity', async () => {
    const res = await request('/api/scrum/weekly-evaluation', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'usr-admin-1'
      })
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    const evalData = res.body?.data;
    assert(evalData?.overallScore >= 0 && evalData?.overallScore <= 100, 'Expected score 0-100');
    assert(typeof evalData?.letterGrade === 'string', 'Expected letter grade');
    assert(typeof evalData?.aiExecutiveSummary === 'string', 'Expected executive summary');
    assert(Array.isArray(evalData?.aiStrengths), 'Expected strengths array');
    assert(Array.isArray(evalData?.aiGrowthAreas), 'Expected growth areas array');
  });

  // ============================================================================
  // SUMMARY REPORT
  // ============================================================================
  console.log('\n================================================================================');
  console.log('📊 QA TEST SUITE EXECUTION SUMMARY');
  console.log('================================================================================');

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((acc, r) => acc + r.durationMs, 0);

  console.log(`Total Test Cases Executed : ${total}`);
  console.log(`Passed                    : \x1b[32m${passed}\x1b[0m`);
  console.log(`Failed                    : ${failed > 0 ? `\x1b[31m${failed}\x1b[0m` : '\x1b[32m0\x1b[0m'}`);
  console.log(`Execution Time            : ${(totalDuration / 1000).toFixed(2)}s`);
  console.log('================================================================================\n');

  if (failed > 0) {
    console.error('❌ Failures Detected:');
    results.filter(r => !r.passed).forEach(r => {
      console.error(`  - [${r.id}] ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log('🎉 ALL AUTOMATED QA TEST CASES PASSED SUCCESSFULLY WITH ZERO REGRESSIONS!');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal Test Runner Exception:', err);
  process.exit(1);
});

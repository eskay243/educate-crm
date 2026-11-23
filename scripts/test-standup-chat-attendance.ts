const API_BASE = 'http://localhost:5001/api';

async function runTests() {
  console.log('================================================================');
  console.log('🧪 STANDUP WEEKLY DIGEST, STUDENT-MENTOR CHAT & ATTENDANCE TESTS');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string, details?: any) {
    if (condition) {
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${name}`);
      if (details) console.error('    Details:', details);
      failed++;
    }
  }

  // 1. Student-to-Mentor Chat Search
  const bootRes = await fetch(`${API_BASE}/bootstrap`);
  const bootJson = await bootRes.json();
  const students = bootJson.data?.students || [];
  const sampleStudent = students.find((s: any) => s.mentorName || s.mentorId || s.program);
  assert(Boolean(sampleStudent), 'Found enrolled student in database for chat mentor search');

  if (sampleStudent) {
    const chatUsersRes = await fetch(
      `${API_BASE}/chat/users?userId=${encodeURIComponent(sampleStudent.id)}&role=student&email=${encodeURIComponent(sampleStudent.email)}`
    );
    const chatUsersJson = await chatUsersRes.json();
    const mentorsInSearch = (chatUsersJson.data || []).filter((u: any) => u.role === 'mentor');
    assert(
      chatUsersRes.status === 200 && mentorsInSearch.length > 0,
      `Student (${sampleStudent.name}) sees assigned mentor(s) in /api/chat/users search (${mentorsInSearch.length} mentor(s) found)`,
      mentorsInSearch.map((m: any) => m.name)
    );
  }

  // 2. Private Subgroup Isolation
  const subgroupRes = await fetch(`${API_BASE}/chat/subgroups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'QA Private Subgroup Test',
      creatorId: 'usr-finance-qa',
      creatorName: 'Finance QA',
      participants: ['usr-finance-qa', 'usr-admissions-qa'],
    }),
  });
  const subgroupJson = await subgroupRes.json();
  const subgroupId = subgroupJson.data?.id;
  assert(subgroupRes.status === 201 && Boolean(subgroupId), 'Created private subgroup between 2 non-admin staff');

  const adminConvsRes = await fetch(
    `${API_BASE}/chat/conversations?userId=usr-admin-qa&role=super_admin&email=admin-qa@codelab.institute`
  );
  const adminConvsJson = await adminConvsRes.json();
  const seesPrivateSubgroup = (adminConvsJson.data || []).some((c: any) => c.id === subgroupId);
  assert(!seesPrivateSubgroup, 'Non-participant user (including Super Admin) is NOT subscribed to other users private subgroup');

  // 3. Main DSU Sync to Today's Attendance
  const todayStr = new Date().toISOString().split('T')[0];
  const clockRes = await fetch(`${API_BASE}/attendance/clock-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: `att-qa-dsu-${Date.now()}`,
      staffId: 'usr-qa-dsu',
      staffName: 'QA DSU Sync User',
      staffEmail: 'qa.dsu.sync@test.com',
      date: todayStr,
      clockInTime: '09:00 AM',
      workMode: 'Remote',
      dailyTasksFocus: 'Initial clock-in task',
      status: 'Clocked In',
    }),
  });
  assert(clockRes.status === 200 || clockRes.status === 201, 'Logged QA clock-in record for today');

  const dsuRes = await fetch(`${API_BASE}/scrum/standup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'usr-qa-dsu',
      userName: 'QA DSU Sync User',
      userEmail: 'qa.dsu.sync@test.com',
      userRole: 'admissions',
      tasksYesterday: [{ id: 'y1', description: 'Completed admission audit', moduleId: 'leads', status: 'completed' }],
      tasksToday: [{ id: 't1', description: 'Updated main DSU deliverable', moduleId: 'students', status: 'in_progress' }],
      blockers: [],
      taggedModuleIds: ['leads', 'students'],
    }),
  });
  assert(dsuRes.status === 201, 'Submitted main DSU update');

  const attListRes = await fetch(`${API_BASE}/attendance`);
  const attListJson = await attListRes.json();
  const updatedAtt = (attListJson.data || []).find((a: any) => a.staffId === 'usr-qa-dsu' && a.date === todayStr);
  assert(
    Boolean(updatedAtt?.dailyTasksFocus?.includes('Updated main DSU deliverable')),
    'Attendance record dailyTasksFocus synced with main DSU update',
    updatedAtt?.dailyTasksFocus
  );

  // 4. Detailed Weekly Standup Digest & Evaluations
  const digestRes = await fetch(`${API_BASE}/scrum/send-weekly-digest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const digestJson = await digestRes.json();
  assert(
    digestRes.status === 200 &&
      digestJson.success === true &&
      digestJson.data?.totalPersonnelEvaluated > 0 &&
      Array.isArray(digestJson.data?.evaluations),
    `POST /api/scrum/send-weekly-digest evaluated ${digestJson.data?.totalPersonnelEvaluated || 0} staff/faculty with Completed/In-Progress/Blocked task breakdowns`
  );

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('----------------------------------------------------------------\n');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

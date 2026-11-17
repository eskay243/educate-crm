const API_BASE = 'http://localhost:5001/api';

async function runRolePayoutPermissionTests() {
  console.log('================================================================');
  console.log('🔐 ROLES, MODULES & MENTOR PAYOUT PERMISSIONS TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      if (details) console.error('    Details:', details);
      failed++;
    }
  }

  // 1. Verify admissions role has updated modules & permissions
  const rolesRes = await fetch(`${API_BASE}/roles`);
  const rolesJson = await rolesRes.json();
  const admissionsRole = rolesJson.data?.find((r: any) => r.id === 'admissions');

  assert(Boolean(admissionsRole), 'Admissions role exists in /api/roles');
  assert(
    Array.isArray(admissionsRole?.allowedModules) && admissionsRole.allowedModules.includes('mentors'),
    'Admissions role has "mentors" module enabled by default'
  );
  assert(
    admissionsRole?.permissions?.canEditMentorPayouts === true,
    'Admissions role has canEditMentorPayouts enabled by default'
  );
  assert(
    admissionsRole?.permissions?.canRejectMentorPayouts === true,
    'Admissions role has canRejectMentorPayouts enabled by default'
  );
  assert(
    !admissionsRole?.permissions?.canApproveMentorPayouts,
    'Admissions role does NOT have canApproveMentorPayouts enabled by default'
  );

  // 2. Get a mentor to create a temporary payout request
  const mentorsRes = await fetch(`${API_BASE}/mentors`);
  const mentorsJson = await mentorsRes.json();
  const sampleMentor = mentorsJson.data?.[0];
  assert(Boolean(sampleMentor), 'Fetched sample mentor for payout test');

  const createRes = await fetch(`${API_BASE}/payout-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mentorId: sampleMentor.id,
      amount: 50000,
      notes: 'QA Test Payout Request for Role Permission Verification',
    }),
  });
  const createJson = await createRes.json();
  const testRequestId = createJson.data?.id;
  assert(createRes.status === 201 && Boolean(testRequestId), 'Created temporary pending mentor payout request');

  // 3. Admissions Officer edits the pending payout request amount -> 200 OK
  const editRes = await fetch(`${API_BASE}/payout-requests/${testRequestId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'admissions',
      'x-user-email': 'admissions@codelab.institute',
    },
    body: JSON.stringify({
      amount: 60000,
      notes: 'Adjusted by Admissions Officer during QA verification',
    }),
  });
  const editJson = await editRes.json();
  assert(
    editRes.status === 200 && editJson.data?.amount === 60000 && editJson.data?.whtDeductedAmount === 3000,
    'Admissions Officer can edit pending payout request amount (with 5% WHT recalculated)'
  );

  // 4. Admissions Officer attempts to Approve -> 403 Forbidden
  const approveRes = await fetch(`${API_BASE}/payout-requests/${testRequestId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'admissions',
      'x-user-email': 'admissions@codelab.institute',
    },
    body: JSON.stringify({ status: 'Approved' }),
  });
  assert(
    approveRes.status === 403,
    'Admissions Officer is blocked (403) from approving payout when canApproveMentorPayouts is false'
  );

  // 5. Admissions Officer rejects the payout request -> 200 OK
  const rejectRes = await fetch(`${API_BASE}/payout-requests/${testRequestId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'admissions',
      'x-user-email': 'admissions@codelab.institute',
    },
    body: JSON.stringify({
      status: 'Rejected',
      rejectionReason: 'Incomplete lecture logs for week 3',
    }),
  });
  const rejectJson = await rejectRes.json();
  assert(
    rejectRes.status === 200 && rejectJson.data?.status === 'Rejected',
    'Admissions Officer can reject payout request with reason'
  );

  // 6. Super Admin revokes canEditMentorPayouts & canRejectMentorPayouts from admissions
  const revokeRes = await fetch(`${API_BASE}/roles/admissions`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      permissions: {
        ...admissionsRole.permissions,
        canEditMentorPayouts: false,
        canRejectMentorPayouts: false,
      },
    }),
  });
  assert(revokeRes.status === 200, 'Super Admin revoked edit & reject payout permissions from Admissions');

  // Verify Admissions Officer is now blocked (403) from editing & rejecting
  const blockedEditRes = await fetch(`${API_BASE}/payout-requests/${testRequestId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'admissions',
    },
    body: JSON.stringify({ amount: 45000 }),
  });
  assert(blockedEditRes.status === 403, 'Admissions Officer is blocked (403) from editing after permission revocation');

  const blockedRejectRes = await fetch(`${API_BASE}/payout-requests/${testRequestId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'admissions',
    },
    body: JSON.stringify({ status: 'Rejected', rejectionReason: 'Test' }),
  });
  assert(blockedRejectRes.status === 403, 'Admissions Officer is blocked (403) from rejecting after permission revocation');

  // 7. Super Admin re-assigns canEditMentorPayouts & canRejectMentorPayouts back to admissions
  const restoreRes = await fetch(`${API_BASE}/roles/admissions`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      permissions: {
        ...admissionsRole.permissions,
        canEditMentorPayouts: true,
        canRejectMentorPayouts: true,
      },
    }),
  });
  assert(restoreRes.status === 200, 'Super Admin re-assigned edit & reject payout permissions to Admissions');

  // 8. Clean up test payout request
  const delRes = await fetch(`${API_BASE}/payout-requests/${testRequestId}`, { method: 'DELETE' });
  assert(delRes.status === 200, 'Cleaned up temporary test payout request');

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('----------------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL ROLE & MENTOR PAYOUT PERMISSION TESTS PASSED!\n');
  }
}

runRolePayoutPermissionTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

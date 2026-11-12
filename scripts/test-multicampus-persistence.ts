import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:5001/api';

interface CampusLocation {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive: boolean;
}

async function runMultiCampusTests() {
  console.log('================================================================');
  console.log('🏛️ MULTI-CAMPUS PHYSICAL HUBS & GEOFENCING PERSISTENCE TEST SUITE');
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

  // 1. Check API Health
  try {
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthJson = await healthRes.json();
    assert(healthRes.status === 200 && healthJson.status === 'healthy', 'API health check returns 200 OK');
  } catch (err: any) {
    assert(false, 'API server is reachable on port 5001', err.message);
    process.exit(1);
  }

  // 2. Define the exact campuses matching the user screenshot
  const testCampuses: CampusLocation[] = [
    {
      id: 'campus-vi',
      code: 'LOS-VI',
      name: 'Victoria Island Executive Hub',
      address: 'Plot 14, Idejo Street, Victoria Island',
      city: 'Lagos State',
      latitude: 6.4281,
      longitude: 3.4219,
      radiusMeters: 300,
      isActive: false, // Inactive in screenshot
    },
    {
      id: 'campus-yab',
      code: 'LOS-YAB',
      name: 'Yaba Innovation & Tech Campus',
      address: '294 Herbert Macaulay Way, Alagomeji, Yaba',
      city: 'Lagos State',
      latitude: 6.5186,
      longitude: 3.3768,
      radiusMeters: 350,
      isActive: false, // Inactive in screenshot
    },
    {
      id: 'campus-abj',
      code: 'ABJ-CBD',
      name: 'Abuja Federal Executive Campus',
      address: 'Plot 782, Cadastral Zone A00, Central Business District',
      city: 'FCT Abuja',
      latitude: 9.0579,
      longitude: 7.4951,
      radiusMeters: 400,
      isActive: true, // Active in screenshot
    },
  ];

  // 3. Test Security Boundary: Non-super_admin role should be blocked with 403
  try {
    const forbiddenRes = await fetch(`${API_BASE}/settings/campuses`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'mentor',
      },
      body: JSON.stringify({ campusLocationsList: testCampuses }),
    });
    assert(
      forbiddenRes.status === 403,
      'Security Boundary: Non-super_admin role is blocked from modifying campus hubs (403)'
    );
  } catch (err: any) {
    assert(false, 'Security Boundary Check', err.message);
  }

  // 4. Test Super Admin Persistence via PUT /api/settings/campuses
  try {
    const saveRes = await fetch(`${API_BASE}/settings/campuses`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'super_admin',
        'x-user-email': 'abiola@codelab.institute',
      },
      body: JSON.stringify({ campusLocationsList: testCampuses }),
    });
    const saveJson = await saveRes.json();
    assert(
      saveRes.status === 200 && saveJson.success === true,
      'Super Admin successfully updates campus hubs via PUT /api/settings/campuses (200 OK)'
    );
    assert(
      Array.isArray(saveJson.data?.campusLocationsList) && saveJson.data.campusLocationsList.length === 3,
      'Response returns 3 updated campus hubs'
    );
    assert(
      saveJson.data?.officeLocation?.name === 'Abuja Federal Executive Campus',
      'Primary active officeLocation automatically synchronized to Abuja Federal Executive Campus'
    );
  } catch (err: any) {
    assert(false, 'Super Admin Campus Save', err.message);
  }

  // 5. Verify Disk Persistence in server/data/db.json
  try {
    const dbPath = path.resolve('server/data/db.json');
    const rawDb = fs.readFileSync(dbPath, 'utf-8');
    const db = JSON.parse(rawDb);
    const savedCampuses: CampusLocation[] = db.settings?.campusLocationsList || [];

    assert(savedCampuses.length === 3, 'server/data/db.json on disk contains exactly 3 campus hubs');

    const viHub = savedCampuses.find(c => c.code === 'LOS-VI');
    const yabHub = savedCampuses.find(c => c.code === 'LOS-YAB');
    const abjHub = savedCampuses.find(c => c.code === 'ABJ-CBD');

    assert(viHub?.isActive === false, 'LOS-VI is persisted as Inactive Hub');
    assert(yabHub?.isActive === false, 'LOS-YAB is persisted as Inactive Hub');
    assert(abjHub?.isActive === true, 'ABJ-CBD is persisted as Active Hub');
    assert(
      abjHub?.address === 'Plot 782, Cadastral Zone A00, Central Business District',
      'ABJ-CBD address correctly saved to "Plot 782, Cadastral Zone A00, Central Business District"'
    );
    assert(
      db.settings?.officeLocation?.name === 'Abuja Federal Executive Campus',
      'db.settings.officeLocation on disk synchronized to Abuja Federal Executive Campus'
    );
  } catch (err: any) {
    assert(false, 'Disk Persistence Verification', err.message);
  }

  // 6. Test GET /api/settings returns the persisted state
  try {
    const getRes = await fetch(`${API_BASE}/settings`);
    const getJson = await getRes.json();
    const fetchedCampuses = getJson.data?.campusLocationsList || [];
    assert(getRes.status === 200 && getJson.success === true, 'GET /api/settings succeeds');
    assert(fetchedCampuses.length === 3, 'GET /api/settings returns 3 campus locations');
    const activeHubs = fetchedCampuses.filter((c: any) => c.isActive);
    assert(
      activeHubs.length === 1 && activeHubs[0].code === 'ABJ-CBD',
      'Shift Clock-In Filter: Exactly 1 active hub (ABJ-CBD) available for GPS check-ins'
    );
  } catch (err: any) {
    assert(false, 'GET /api/settings verification', err.message);
  }

  // 7. Test GET /api/bootstrap returns the persisted state
  try {
    const bootRes = await fetch(`${API_BASE}/bootstrap`);
    const bootJson = await bootRes.json();
    const bootCampuses = bootJson.data?.settings?.campusLocationsList || bootJson.settings?.campusLocationsList || [];
    assert(bootRes.status === 200 && bootJson.success === true, 'GET /api/bootstrap succeeds');
    assert(bootCampuses.length === 3, 'GET /api/bootstrap returns 3 campus locations for frontend initialization');
  } catch (err: any) {
    assert(false, 'GET /api/bootstrap verification', err.message);
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('----------------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL MULTI-CAMPUS PERSISTENCE TESTS PASSED CLEANLY!\n');
  }
}

runMultiCampusTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});

const https = require('https');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../server/data/db.json');
const BACKUP_PATH = path.join(__dirname, '../server/data/db.local-pre-sync.json');
const PROD_URL = 'https://growpot.cloud/api/backups/export';

async function syncFromProduction() {
  console.log('🔄 Initiating local database sync from production...');

  // 1. Safety backup of existing local db
  if (fs.existsSync(DB_PATH)) {
    fs.copyFileSync(DB_PATH, BACKUP_PATH);
    console.log(`✓ Local safety snapshot created at: ${BACKUP_PATH}`);
  }

  // 2. Fetch live production export
  console.log(`🌐 Fetching latest institutional database snapshot from ${PROD_URL}...`);
  const rawData = await new Promise((resolve, reject) => {
    https.get(PROD_URL, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to fetch production backup: HTTP ${res.statusCode}`));
      }
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => resolve(chunks));
    }).on('error', reject);
  });

  const parsed = JSON.parse(rawData);
  if (!parsed.success || !parsed.data?.data) {
    throw new Error('Invalid backup structure returned by production server');
  }

  const prodDb = parsed.data.data;
  console.log(`✓ Successfully downloaded production snapshot (Exported by: ${parsed.data.exportedBy}, Timestamp: ${parsed.data.timestamp})`);

  // 3. Read current local db to preserve new chat tables if missing in prod
  let currentLocal = {};
  if (fs.existsSync(DB_PATH)) {
    try {
      currentLocal = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    } catch (e) {
      currentLocal = {};
    }
  }

  // Merge: all production collections are applied directly
  const mergedDb = {
    ...prodDb,
    chatConversations: prodDb.chatConversations || currentLocal.chatConversations || [
      {
        id: "conv-channel-general",
        type: "channel",
        name: "general-announcements",
        topic: "Campus Announcements & General News",
        description: "Institution-wide announcements for staff, faculty mentors, and students.",
        participants: [],
        allowedRoles: ["super_admin", "admissions", "finance", "program_officer", "mentor", "student", "it_support"],
        isDefault: true,
        lastMessage: {
          content: "Welcome to the unified Educate CRM institutional communications hub.",
          senderName: "System Administrator",
          timestamp: new Date().toISOString()
        },
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "conv-channel-staff",
        type: "channel",
        name: "staff-room",
        topic: "Operations, Approvals & Staff Coordination",
        description: "Private coordination channel for administrative staff, finance, and management.",
        participants: [],
        allowedRoles: ["super_admin", "admissions", "finance", "program_officer", "it_support"],
        isDefault: true,
        lastMessage: {
          content: "Staff coordination and task triage channel.",
          senderName: "Operations Lead",
          timestamp: new Date().toISOString()
        },
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "conv-channel-faculty",
        type: "channel",
        name: "faculty-mentors",
        topic: "Academic Mentorship, Syllabus & Curriculum Delivery",
        description: "Faculty mentors and academic coordination.",
        participants: [],
        allowedRoles: ["super_admin", "program_officer", "mentor"],
        isDefault: true,
        lastMessage: {
          content: "Please ensure topic completion is marked after every classroom lecture.",
          senderName: "Academic Director",
          timestamp: new Date().toISOString()
        },
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    chatMessages: prodDb.chatMessages || currentLocal.chatMessages || []
  };

  // Write formatted JSON to local DB
  fs.writeFileSync(DB_PATH, JSON.stringify(mergedDb, null, 2), 'utf-8');
  console.log(`🎉 Local database successfully synchronized with production!`);
  console.log(`   - Students: ${mergedDb.students?.length || 0}`);
  console.log(`   - Leads: ${mergedDb.leads?.length || 0}`);
  console.log(`   - Expenses: ${mergedDb.expenses?.length || 0}`);
  console.log(`   - Tickets: ${mergedDb.tickets?.length || 0}`);
  console.log(`   - Staff Accounts: ${mergedDb.staffUsers?.length || 0}`);
  console.log(`   - Timetables: ${mergedDb.timetables?.length || 0}`);
}

syncFromProduction().catch(err => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});

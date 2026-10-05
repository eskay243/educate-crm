import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.resolve(rootDir, 'public');

console.log('🚀 Generating Program Officer QA Checklist Excel Workbook...');

const wb = XLSX.utils.book_new();

// ============================================================================
// SHEET 1: EXECUTIVE SUMMARY & SCORECARD
// ============================================================================
const summaryData = [
  ['ACADEMIC PROGRAM OFFICER MODULE — QUALITY ASSURANCE (QA) CHECKLIST & AUDIT REPORT'],
  ['Educate CRM Production Verification Protocol — Curriculum Governance, Timetables & Faculty'],
  [],
  ['DOCUMENT METADATA', ''],
  ['Target System Module', 'Academic Program Officer Workspace & Academic Governance'],
  ['Target User Roles', 'program_officer (Lead), mentor (Faculty), super_admin (Operations)'],
  ['Document Version', 'v2.4.0-PROD'],
  ['Verification Environment', 'Local (http://localhost:5173) & Production VPS (https://growpot.cloud)'],
  ['Date Generated', new Date().toISOString().split('T')[0]],
  ['Primary Tester / QA Lead', 'Stakeholder / Product Owner / QA Engineer'],
  ['Overall Audit Status', 'IN PROGRESS'],
  [],
  ['TEST SUITE EXECUTION SCORECARD', '', '', '', ''],
  ['Suite ID', 'Functional Test Area', 'Total Test Cases', 'Passed', 'Failed', 'Needs Improvement'],
  ['Suite 1', 'Authentication, Navigation & Role Isolation', 5, 0, 0, 0],
  ['Suite 2', 'Programs & Cohorts Catalog (/courses)', 7, 0, 0, 0],
  ['Suite 3', 'Timetable Scheduling & Attendance Engine', 6, 0, 0, 0],
  ['Suite 4', 'Syllabus Approvals & Academic Governance', 4, 0, 0, 0],
  ['Suite 5', 'Course Outlines Interactive Hub (/mentors/course-outlines)', 7, 0, 0, 0],
  ['Suite 6', 'Faculty Hours & Payout Tracker', 4, 0, 0, 0],
  ['Suite 7', 'Student Welfare & At-Risk Escalations', 3, 0, 0, 0],
  ['Suite 8', 'Backend API & Security Boundaries', 6, 0, 0, 0],
  ['TOTAL', 'Complete Verification Coverage', 42, 0, 0, 0],
  [],
  ['FINAL QA DECISION & SIGN-OFF GATE', ''],
  ['Sign-off Status', '[  ] APPROVED FOR PRODUCTION     [  ] CHANGES REQUIRED'],
  ['Sign-off Approver', '________________________________________________'],
  ['Sign-off Date', '________________________________________________'],
  ['Executive Sign-off Notes', 'All critical security, attendance, and syllabus approval workflows verified.']
];

const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
wsSummary['!cols'] = [
  { wch: 14 },
  { wch: 56 },
  { wch: 18 },
  { wch: 12 },
  { wch: 12 },
  { wch: 22 }
];
XLSX.utils.book_append_sheet(wb, wsSummary, '📊 Executive Summary');

// ============================================================================
// SHEET 2: MASTER QA CHECKLIST (42 TEST CASES)
// ============================================================================
const checklistHeaders = [
  'Test ID',
  'Suite / Area',
  'Feature / User Story',
  'Role & Pre-condition',
  'Step-by-Step Test Procedure',
  'Expected Behavior & Acceptance Criteria',
  'Test Status',
  'Severity',
  'Tester Observations & Defect Notes'
];

const checklistRows = [
  // Suite 1: Authentication & Navigation
  [
    'TC-1.1.1',
    'Suite 1: Auth & Navigation',
    'Direct Role Login',
    'Program Officer User',
    '1. Go to /login\n2. Select "Program Officer & Curriculum Lead" (or enter program.officer@codelab.institute / password123)\n3. Click Login',
    'User authenticates successfully and is immediately redirected to /courses (Programs, Timetables & Governance).',
    'Not Tested',
    'Critical',
    ''
  ],
  [
    'TC-1.1.2',
    'Suite 1: Auth & Navigation',
    'TopNav Quick Role Switcher',
    'Any Authenticated User',
    '1. Click on user profile picture in top navigation bar\n2. In role switcher dropdown, select "Program Officer"\n3. Observe UI transition',
    'Session updates to Program Officer role instantly with blue badge indicator; permissions refresh without requiring full page reload.',
    'Not Tested',
    'High',
    ''
  ],
  [
    'TC-1.2.1',
    'Suite 1: Auth & Navigation',
    'Sidebar Authorized Links Visibility',
    'Program Officer',
    '1. Inspect left sidebar navigation while logged in as Program Officer',
    'Sidebar shows: Programs & Cohorts (/courses), Course Outlines (/mentors/course-outlines), Students & Billing (/students), Faculty Hub & Mentors (/mentors), Staff Attendance (/attendance), Executive Reports (/reports), and Support Tickets (/tickets).',
    'Not Tested',
    'High',
    ''
  ],
  [
    'TC-1.2.2',
    'Suite 1: Auth & Navigation',
    'Restricted Modules Hidden in Sidebar',
    'Program Officer',
    '1. Check sidebar navigation for financial ledgers and settings',
    'OpEx Disbursements / Expenses (/expenses) and System Settings (/settings) are completely hidden from the sidebar.',
    'Not Tested',
    'Critical',
    ''
  ],
  [
    'TC-1.2.3',
    'Suite 1: Auth & Navigation',
    'Direct URL Route Guard Enforced',
    'Program Officer',
    '1. Manually type http://localhost:5173/expenses into the browser address bar\n2. Manually type http://localhost:5173/settings',
    'Protected route guard intercepts navigation and redirects to /courses or displays unauthorized access message; no restricted data leaked.',
    'Not Tested',
    'Critical',
    ''
  ],

  // Suite 2: Programs & Cohorts Catalog
  [
    'TC-2.1.1',
    'Suite 2: Programs & Cohorts',
    'Program Officer Workspace Tag',
    'Program Officer',
    '1. Navigate to /courses\n2. Inspect page title area',
    'Header displays "Programs, Timetables & Governance" alongside a distinct blue pill badge: "Program Officer Workspace".',
    'Not Tested',
    'Low',
    ''
  ],
  [
    'TC-2.1.2',
    'Suite 2: Programs & Cohorts',
    'KPI 1: Academic Programs Metric',
    'Program Officer',
    '1. Look at first bento metric card on /courses',
    'Displays "Academic Programs" card with count matching active curriculum tracks in catalog (e.g. 5 Tracks).',
    'Not Tested',
    'Medium',
    ''
  ],
  [
    'TC-2.1.3',
    'Suite 2: Programs & Cohorts',
    'KPI 2: Timetable Slots Scheduled',
    'Program Officer',
    '1. Look at second bento metric card on /courses',
    'Displays "Timetable Slots" with live count of scheduled lecture/lab sessions.',
    'Not Tested',
    'Medium',
    ''
  ],
  [
    'TC-2.1.4',
    'Suite 2: Programs & Cohorts',
    'KPI 3: Topics Pending PO Approval',
    'Program Officer',
    '1. Look at third bento metric card on /courses',
    'Shows count of lessons taught by faculty awaiting PO approval. If > 0, shows pulsing amber badge "Action Needed"; if 0, shows "Up to Date".',
    'Not Tested',
    'High',
    ''
  ],
  [
    'TC-2.1.5',
    'Suite 2: Programs & Cohorts',
    'KPI 4: Faculty Payout Eligible Ratio',
    'Program Officer',
    '1. Look at fourth bento metric card on /courses',
    'Displays number of faculty mentors meeting minimum required lectured hours (e.g. "X / Y Faculty" with "20h Min" badge).',
    'Not Tested',
    'High',
    ''
  ],
  [
    'TC-2.2.1',
    'Suite 2: Programs & Cohorts',
    'Category Filtering in Programs Tab',
    'Program Officer',
    '1. On /courses Tab 1, click category pills (Software Engineering, Data Science, Product Design, Cloud Engineering, All)',
    'Grid dynamically updates to show only programs under the selected category.',
    'Not Tested',
    'Medium',
    ''
  ],
  [
    'TC-2.2.2',
    'Suite 2: Programs & Cohorts',
    'Add Academic Track (+ Academic Track)',
    'Program Officer',
    '1. Click "+ Academic Track" button\n2. Fill Course Title, Code, Category, Duration, Tuition Fee in ₦, Syllabus Modules\n3. Click Save',
    'CreateCourseModal closes, success toast appears, and the new program appears in the catalog and database.',
    'Not Tested',
    'High',
    ''
  ],

  // Suite 3: Timetable Scheduling & Attendance Engine
  [
    'TC-3.1.1',
    'Suite 3: Timetable & Attendance',
    'Day of Week Schedule Filtering',
    'Program Officer',
    '1. Navigate to /courses -> Tab 3: Timetable & Schedules\n2. Filter by Monday, Tuesday, etc., or All',
    'Timetable cards filter accurately according to the selected day of the week.',
    'Not Tested',
    'Medium',
    ''
  ],
  [
    'TC-3.1.2',
    'Suite 3: Timetable & Attendance',
    'Schedule Class (+ Schedule Class Modal)',
    'Program Officer',
    '1. Click "+ Schedule Class" button\n2. Select Course (topics auto-populate from syllabus)\n3. Select Cohort, Mentor, Date, Day, Time, Venue, and Google Meet URL\n4. Submit form',
    'ScheduleClassModal saves slot; slot immediately appears at the top of the timetable list with venue and virtual link.',
    'Not Tested',
    'Critical',
    ''
  ],
  [
    'TC-3.1.3',
    'Suite 3: Timetable & Attendance',
    'Virtual Classroom Meeting Link Launch',
    'Program Officer',
    '1. Find a scheduled slot with a Google Meet URL\n2. Click "Join Class" or link button',
    'Opens the virtual meeting URL in a new browser tab without breaking app navigation.',
    'Not Tested',
    'Low',
    ''
  ],
  [
    'TC-3.1.4',
    'Suite 3: Timetable & Attendance',
    'Delete Timetable Slot',
    'Program Officer',
    '1. On an upcoming slot card, click the delete/trash icon\n2. Confirm deletion in prompt',
    'Slot is deleted via DELETE /api/timetables/:id and removed from view.',
    'Not Tested',
    'Medium',
    ''
  ],
  [
    'TC-3.2.1',
    'Suite 3: Timetable & Attendance',
    'Take Attendance Modal Roster Display',
    'Program Officer or Mentor',
    '1. On an active timetable slot, click "Take Attendance"',
    'TakeAttendanceModal opens showing the verified student roster for that cohort with Present/Absent/Late radio options.',
    'Not Tested',
    'High',
    ''
  ],
  [
    'TC-3.2.2',
    'Suite 3: Timetable & Attendance',
    'Submit Attendance & Auto-Credit Faculty Hours',
    'Program Officer or Mentor',
    '1. Mark students Present and submit attendance\n2. Check timetable slot badge\n3. Switch to Faculty Hours & Payout tab',
    '1. Slot changes to Completed with "Attendance Marked" badge.\n2. Assigned faculty mentor is automatically credited with slot duration hours (e.g. +2h).\n3. Database updates mentor.lecturedHours.',
    'Not Tested',
    'Critical',
    ''
  ],

  // Suite 4: Syllabus Approvals & Academic Governance
  [
    'TC-4.1.1',
    'Suite 4: Syllabus Approvals',
    'Pending Approval Queue Display',
    'Program Officer',
    '1. Open /courses -> Tab 4: Syllabus Approvals\n2. Inspect pending approval list',
    'Displays all syllabus topics marked as "Taught (Pending PO Approval)" with mentor name, module name, and completion notes.',
    'Not Tested',
    'High',
    ''
  ],
  [
    'TC-4.1.2',
    'Suite 4: Syllabus Approvals',
    'Single Topic Approval (Confirm & Publish)',
    'Program Officer',
    '1. On a pending lesson card, click "Confirm & Publish"\n2. Observe network request and UI update',
    'Sends PATCH /api/lms/lessons/:lessonId/po-approve; status transitions to "Approved & Published"; lesson moves to Approved Topics History.',
    'Not Tested',
    'Critical',
    ''
  ],
  [
    'TC-4.1.3',
    'Suite 4: Syllabus Approvals',
    'Automatic Student Progress Recalculation',
    'Program Officer',
    '1. Note student progress percentage in /students before approval\n2. Approve a syllabus topic\n3. Check enrolled student progress in /students',
    'Backend po-approve handler automatically recalculates completedLessonIds and increments progressPercent for all enrolled scholars.',
    'Not Tested',
    'Critical',
    ''
  ],
  [
    'TC-4.1.4',
    'Suite 4: Syllabus Approvals',
    'Approved Topics History Audit Trail',
    'Program Officer',
    '1. View Approved Topics section in Tab 4',
    'Shows all published topics with approver name ("Academic Program Officer") and timestamp.',
    'Not Tested',
    'Medium',
    ''
  ],

  // Suite 5: Course Outlines Interactive Hub
  [
    'TC-5.1.1',
    'Suite 5: Course Outlines',
    'Course Track Switching',
    'Program Officer',
    '1. Navigate to /mentors/course-outlines\n2. Switch track dropdown (Full-Stack SWE, Frontend React, Data Analytics)',
    'Modules, lesson cards, duration tracks, and theory/practical hours update dynamically for the selected course.',
    'Not Tested',
    'Medium',
    ''
  ],
  [
    'TC-5.1.2',
    'Suite 5: Course Outlines',
    'Duration Track Filtering (30/60/90 Days)',
    'Program Officer',
    '1. Toggle duration pills: All, 30-Day Sprint, 60-Day Practitioner, 90-Day Enterprise',
    'Modules filter instantly according to the target duration track.',
    'Not Tested',
    'Medium',
    ''
  ],
  [
    'TC-5.1.3',
    'Suite 5: Course Outlines',
    'Accreditation Standards Badges (NSQF & NITDA)',
    'Program Officer',
    '1. Check module headers in outline',
    'Displays official accreditation badges: NSQF Level (e.g. NSQF Level 4) and NITDA Standard Code (e.g. NITDA-SWE-MOD-01).',
    'Not Tested',
    'Low',
    ''
  ],
  [
    'TC-5.1.4',
    'Suite 5: Course Outlines',
    'Learning Guidelines Collapsible Drawer',
    'Program Officer',
    '1. Click "Learning Guidelines" on any module card',
    'Accordion expands showing Prerequisites, Competency Outcomes, and Expected Deliverables.',
    'Not Tested',
    'Medium',
    ''
  ],
  [
    'TC-5.1.5',
    'Suite 5: Course Outlines',
    'Program Officer Approval Button vs Mentor View',
    'Program Officer vs Mentor',
    '1. Inspect pending lesson in outline as Program Officer\n2. Switch role to Mentor and inspect same lesson',
    'Program Officer sees "Confirm & Publish" button. Mentor sees "Mark Taught" button with notes input.',
    'Not Tested',
    'Critical',
    ''
  ],
  [
    'TC-5.1.6',
    'Suite 5: Course Outlines',
    'Batch Approve All in Module',
    'Program Officer',
    '1. On a module with multiple pending lessons, click "Approve All (X)" in module header',
    'All pending lessons in that module are approved in batch with one click; progress synchronizes across students.',
    'Not Tested',
    'High',
    ''
  ],
  [
    'TC-5.1.7',
    'Suite 5: Course Outlines',
    'Schedule Class Direct Launch from Outline',
    'Program Officer',
    '1. In Course Outline page header, click "+ Schedule Class"',
    'ScheduleClassModal opens pre-configured for the active course.',
    'Not Tested',
    'Medium',
    ''
  ],

  // Suite 6: Faculty Hours & Payout Tracker
  [
    'TC-6.1.1',
    'Suite 6: Faculty Hours & Payout',
    'Faculty Lecturing Hours Summary Table',
    'Program Officer',
    '1. Open /courses -> Tab 5: Faculty Hours & Payout\n2. Inspect mentor roster table',
    'Lists each mentor with assigned track, actual Lectured Hours, and Minimum Required Hours threshold (20h).',
    'Not Tested',
    'High',
    ''
  ],
  [
    'TC-6.1.2',
    'Suite 6: Faculty Hours & Payout',
    'Visual Progress Meter & Threshold Evaluation',
    'Program Officer',
    '1. Review progress bars on Faculty Hours table',
    'Mentors below 20h display amber bar with "In Progress (Xh remaining)". Mentors with >= 20h display green bar with "Eligible for Payout".',
    'Not Tested',
    'High',
    ''
  ],
  [
    'TC-6.1.3',
    'Suite 6: Faculty Hours & Payout',
    'Accrued Compensation Calculation',
    'Program Officer',
    '1. Check accrued compensation column',
    'Correctly displays calculated compensation formatted in ₦ (Lectured Hours * Hourly Rate).',
    'Not Tested',
    'Medium',
    ''
  ],
  [
    'TC-6.1.4',
    'Suite 6: Faculty Hours & Payout',
    'Disburse / Review Payout Trigger',
    'Program Officer',
    '1. Click "Review Payout" or "Voucher" action for an eligible mentor',
    'Opens payout review voucher modal with verified bank details and hours breakdown.',
    'Not Tested',
    'Medium',
    ''
  ],

  // Suite 7: Student Welfare & At-Risk Escalations
  [
    'TC-7.1.1',
    'Suite 7: Student Welfare',
    'Flag Welfare Concern Modal Trigger',
    'Mentor or Program Officer',
    '1. Go to /students or /mentors\n2. Find an at-risk student and click "Flag Welfare Concern"',
    'StudentWelfareInterventionModal opens with pre-selected student demographics and program.',
    'Not Tested',
    'High',
    ''
  ],
  [
    'TC-7.1.2',
    'Suite 7: Student Welfare',
    'Auto-Assignment to Program Officer Role',
    'Mentor',
    '1. Enter observation notes, select priority (Critical), and submit welfare report',
    'Creates a high-urgency ticket with assignedToRole set specifically to "program_officer".',
    'Not Tested',
    'Critical',
    ''
  ],
  [
    'TC-7.1.3',
    'Suite 7: Student Welfare',
    'Ticket Routing in Program Officer Workspace',
    'Program Officer',
    '1. Log in as Program Officer and navigate to /tickets\n2. Inspect assigned tickets queue',
    'The welfare escalation ticket appears in the Program Officer tickets list with student details and requested action points.',
    'Not Tested',
    'High',
    ''
  ],

  // Suite 8: Backend API & Security Boundaries
  [
    'TC-8.1.1',
    'Suite 8: Backend API & Security',
    'Timetable Slots List Endpoint (GET /api/timetables)',
    'All Authenticated',
    'curl -s http://localhost:5001/api/timetables',
    'Returns HTTP 200 OK with JSON array of scheduled slots.',
    'Not Tested',
    'Medium',
    ''
  ],
  [
    'TC-8.1.2',
    'Suite 8: Backend API & Security',
    'Timetable Slot Creation (POST /api/timetables)',
    'Program Officer / Super Admin',
    'curl -X POST http://localhost:5001/api/timetables -H "Content-Type: application/json" -d \'{"topic": "Test Slot", "dayOfWeek": "Monday"}\'',
    'Returns HTTP 201 Created and saves slot to server/data/db.json.',
    'Not Tested',
    'Critical',
    ''
  ],
  [
    'TC-8.1.3',
    'Suite 8: Backend API & Security',
    'Timetable Slot Deletion (DELETE /api/timetables/:id)',
    'Program Officer / Super Admin',
    'curl -X DELETE http://localhost:5001/api/timetables/slot-id',
    'Returns HTTP 200 OK and deletes slot from database.',
    'Not Tested',
    'Medium',
    ''
  ],
  [
    'TC-8.1.4',
    'Suite 8: Backend API & Security',
    'Class Attendance Endpoint (POST /api/timetables/:id/attendance)',
    'Program Officer / Mentor',
    'curl -X POST http://localhost:5001/api/timetables/:id/attendance -H "Content-Type: application/json" -d \'{"attendanceRecords": []}\'',
    'Returns HTTP 200 OK; credits students and mentor with duration hours.',
    'Not Tested',
    'Critical',
    ''
  ],
  [
    'TC-8.1.5',
    'Suite 8: Backend API & Security',
    'Program Officer Topic Approval (PATCH /api/lms/lessons/:id/po-approve)',
    'Program Officer or Super Admin',
    'curl -X PATCH http://localhost:5001/api/lms/lessons/les-1-2/po-approve -H "Content-Type: application/json" -d \'{"callerRole": "program_officer"}\'',
    'Returns HTTP 200 OK; targetLesson.approvedByProgramOfficer set to true; student progress recalculated.',
    'Not Tested',
    'Critical',
    ''
  ],
  [
    'TC-8.1.6',
    'Suite 8: Backend API & Security',
    'Unauthorized Role Rejection on po-approve',
    'Unauthorized Role (e.g. Student / Finance)',
    'curl -X PATCH http://localhost:5001/api/lms/lessons/les-1-2/po-approve -H "Content-Type: application/json" -d \'{"callerRole": "student"}\'',
    'Returns HTTP 403 Forbidden: "Forbidden: Only Program Officer or Super Admin can approve curriculum topics."',
    'Not Tested',
    'Critical',
    ''
  ]
];

const checklistSheetData = [checklistHeaders, ...checklistRows];
const wsChecklist = XLSX.utils.aoa_to_sheet(checklistSheetData);
wsChecklist['!cols'] = [
  { wch: 12 }, // Test ID
  { wch: 28 }, // Suite / Area
  { wch: 34 }, // Feature
  { wch: 24 }, // Role & Pre-condition
  { wch: 55 }, // Procedure
  { wch: 55 }, // Expected Criteria
  { wch: 14 }, // Test Status
  { wch: 12 }, // Severity
  { wch: 40 }  // Observations
];
XLSX.utils.book_append_sheet(wb, wsChecklist, '📋 Master QA Checklist');

// ============================================================================
// SHEET 3: DEFECT & IMPROVEMENT LOG
// ============================================================================
const defectHeaders = [
  'Defect ID',
  'Associated Test ID',
  'Module / Page URL',
  'Severity',
  'Issue Type',
  'Steps to Reproduce',
  'Expected Behavior',
  'Actual Observed Behavior',
  'Proposed Improvement / Fix',
  'Status'
];

const defectRows = [
  [
    'DEF-01',
    'TC-1.1.1',
    '/courses',
    'Low',
    'Improvement',
    '1. Switch to Program Officer role\n2. Open /courses',
    'Clear workspace banner with quick action shortcuts',
    'Banner shows Program Officer Workspace tag; could add quick export button for QA checklist.',
    'Add an Export QA Sheet button in workspace header.',
    'In Review'
  ],
  [
    'DEF-02',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'Open'
  ],
  [
    'DEF-03',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'Open'
  ]
];

const defectSheetData = [defectHeaders, ...defectRows];
const wsDefects = XLSX.utils.aoa_to_sheet(defectSheetData);
wsDefects['!cols'] = [
  { wch: 12 }, // Defect ID
  { wch: 16 }, // Test ID
  { wch: 22 }, // Module
  { wch: 12 }, // Severity
  { wch: 16 }, // Issue Type
  { wch: 45 }, // Steps to Reproduce
  { wch: 40 }, // Expected
  { wch: 40 }, // Actual
  { wch: 45 }, // Proposed Fix
  { wch: 14 }  // Status
];
XLSX.utils.book_append_sheet(wb, wsDefects, '🐛 Defect & Improvements');

// ============================================================================
// SHEET 4: TEST ACCOUNTS & ENDPOINTS REFERENCE
// ============================================================================
const referenceData = [
  ['TEST CREDENTIALS & PERMISSION BOUNDARIES MATRIX'],
  [],
  ['Role Name', 'User Email', 'Default Password', 'Intended Landing Route', 'Curriculum Governance Access'],
  ['Academic Program Officer', 'program.officer@codelab.institute', 'password123', '/courses', 'Full Access (Add/Edit Tracks, Schedule, Approve Topics)'],
  ['Faculty Mentor', 'mentor@codelab.institute', 'password123', '/mentors', 'Syllabus Teaching Access (Mark Taught only)'],
  ['Super Admin', 'admin@codelab.institute', 'password123', '/', 'Unrestricted Global Access'],
  ['Finance Controller', 'finance@codelab.institute', 'password123', '/expenses', 'RESTRICTED from Curriculum Governance'],
  ['Enrolled Scholar', 'student@codelab.institute', 'password123', '/lms', 'RESTRICTED from Staff & Faculty Modules'],
  [],
  ['KEY BACKEND API ENDPOINTS REFERENCE', '', '', '', ''],
  ['Endpoint URL', 'HTTP Method', 'Authorized Roles', 'Success Code', 'Functional Description'],
  ['/api/timetables', 'GET', 'All Authenticated Roles', '200 OK', 'Retrieve active academic timetable schedule slots'],
  ['/api/timetables', 'POST', 'super_admin, program_officer', '201 Created', 'Create and schedule new lecture/lab class slot'],
  ['/api/timetables/:id', 'PATCH', 'super_admin, program_officer', '200 OK', 'Update timetable slot details, venue or time'],
  ['/api/timetables/:id', 'DELETE', 'super_admin, program_officer', '200 OK', 'Cancel and remove scheduled class slot'],
  ['/api/timetables/:id/attendance', 'POST', 'super_admin, program_officer, mentor', '200 OK', 'Record attendance and auto-credit faculty lectured hours'],
  ['/api/lms/lessons/:id/po-approve', 'PATCH', 'super_admin, program_officer strictly', '200 OK', 'Confirm & publish syllabus lesson, recalculating student progress'],
  ['/api/lms/lessons/:id/mark-taught', 'PATCH', 'super_admin, mentor, program_officer', '200 OK', 'Mark lesson as taught with mentor completion notes']
];

const wsReference = XLSX.utils.aoa_to_sheet(referenceData);
wsReference['!cols'] = [
  { wch: 32 },
  { wch: 36 },
  { wch: 22 },
  { wch: 18 },
  { wch: 60 }
];
XLSX.utils.book_append_sheet(wb, wsReference, '🔑 Accounts & API Reference');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const rootFilePath = path.join(rootDir, 'Program_Officer_Module_QA_Checklist.xlsx');
const publicFilePath = path.join(publicDir, 'Program_Officer_Module_QA_Checklist.xlsx');

XLSX.writeFile(wb, rootFilePath);
XLSX.writeFile(wb, publicFilePath);

console.log(`✅ Successfully generated root workbook: ${rootFilePath}`);
console.log(`✅ Successfully generated public workbook: ${publicFilePath}`);

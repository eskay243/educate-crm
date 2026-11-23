import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CRMProvider } from './context/CRMContext';
import { PWAProvider } from './context/PWAContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useCRM } from './context/CRMContext';
import { lazyWithRetry } from './utils/lazyWithRetry';

import { ToastContainer } from './components/notifications/ToastContainer';
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt';
import { OfflineIndicator } from './components/common/OfflineIndicator';

// Code-split page components with automatic stale-chunk recovery
const LoginPage = lazyWithRetry(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })), 'LoginPage');
const ResetPasswordPage = lazyWithRetry(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })), 'ResetPasswordPage');
const ExecutiveReportPage = lazyWithRetry(() => import('./pages/ExecutiveReportPage').then(m => ({ default: m.ExecutiveReportPage })), 'ExecutiveReportPage');
const LeadManagementPage = lazyWithRetry(() => import('./pages/LeadManagementPage').then(m => ({ default: m.LeadManagementPage })), 'LeadManagementPage');
const ContactsPage = lazyWithRetry(() => import('./pages/ContactsPage').then(m => ({ default: m.ContactsPage })), 'ContactsPage');
const StudentEnrollmentPage = lazyWithRetry(() => import('./pages/StudentEnrollmentPage').then(m => ({ default: m.StudentEnrollmentPage })), 'StudentEnrollmentPage');
const MentorManagementPage = lazyWithRetry(() => import('./pages/MentorManagementPage').then(m => ({ default: m.MentorManagementPage })), 'MentorManagementPage');
const MentorAvailabilityPage = lazyWithRetry(() => import('./pages/MentorAvailabilityPage').then(m => ({ default: m.MentorAvailabilityPage })), 'MentorAvailabilityPage');
const FacultyGradingPage = lazyWithRetry(() => import('./pages/FacultyGradingPage').then(m => ({ default: m.FacultyGradingPage })), 'FacultyGradingPage');
const CourseOutlinePage = lazyWithRetry(() => import('./pages/CourseOutlinePage').then(m => ({ default: m.CourseOutlinePage })), 'CourseOutlinePage');
const BusinessExpensesPage = lazyWithRetry(() => import('./pages/BusinessExpensesPage').then(m => ({ default: m.BusinessExpensesPage })), 'BusinessExpensesPage');
const FinancialAuditPage = lazyWithRetry(() => import('./pages/FinancialAuditPage').then(m => ({ default: m.FinancialAuditPage })), 'FinancialAuditPage');
const CoursesCohortsPage = lazyWithRetry(() => import('./pages/CoursesCohortsPage').then(m => ({ default: m.CoursesCohortsPage })), 'CoursesCohortsPage');
const StaffAttendancePage = lazyWithRetry(() => import('./pages/StaffAttendancePage').then(m => ({ default: m.StaffAttendancePage })), 'StaffAttendancePage');
const SettingsPage = lazyWithRetry(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })), 'SettingsPage');
const StudentDashboardPage = lazyWithRetry(() => import('./pages/student/StudentDashboardPage').then(m => ({ default: m.StudentDashboardPage })), 'StudentDashboardPage');
const StudentCoursesPage = lazyWithRetry(() => import('./pages/student/StudentCoursesPage').then(m => ({ default: m.StudentCoursesPage })), 'StudentCoursesPage');
const StudentMentorPage = lazyWithRetry(() => import('./pages/student/StudentMentorPage').then(m => ({ default: m.StudentMentorPage })), 'StudentMentorPage');
const StudentBillingPage = lazyWithRetry(() => import('./pages/student/StudentBillingPage').then(m => ({ default: m.StudentBillingPage })), 'StudentBillingPage');
const StudentProfilePage = lazyWithRetry(() => import('./pages/student/StudentProfilePage').then(m => ({ default: m.StudentProfilePage })), 'StudentProfilePage');

// Dedicated Mentor / Faculty Portal Pages
const MentorDashboardPage = lazyWithRetry(() => import('./pages/mentor/MentorDashboardPage').then(m => ({ default: m.MentorDashboardPage })), 'MentorDashboardPage');
const MentorStudentsPage = lazyWithRetry(() => import('./pages/mentor/MentorStudentsPage').then(m => ({ default: m.MentorStudentsPage })), 'MentorStudentsPage');
const MentorSchedulePage = lazyWithRetry(() => import('./pages/mentor/MentorSchedulePage').then(m => ({ default: m.MentorSchedulePage })), 'MentorSchedulePage');
const MentorCurriculumPage = lazyWithRetry(() => import('./pages/mentor/MentorCurriculumPage').then(m => ({ default: m.MentorCurriculumPage })), 'MentorCurriculumPage');
const MentorPayoutsPage = lazyWithRetry(() => import('./pages/mentor/MentorPayoutsPage').then(m => ({ default: m.MentorPayoutsPage })), 'MentorPayoutsPage');
const MentorProfilePage = lazyWithRetry(() => import('./pages/mentor/MentorProfilePage').then(m => ({ default: m.MentorProfilePage })), 'MentorProfilePage');

const TicketsPage = lazyWithRetry(() => import('./pages/TicketsPage').then(m => ({ default: m.TicketsPage })), 'TicketsPage');
const ChatPage = lazyWithRetry(() => import('./pages/ChatPage').then(m => ({ default: m.ChatPage })), 'ChatPage');
const OperationalDashboardPage = lazyWithRetry(() => import('./pages/OperationalDashboardPage').then(m => ({ default: m.OperationalDashboardPage })), 'OperationalDashboardPage');

const PageLoadingFallback: React.FC = () => (
  <div className="flex min-h-[60vh] w-full flex-col items-center justify-center p-8">
    <div className="flex flex-col items-center gap-3">
      <div className="h-9 w-9 animate-spin rounded-full border-3 border-primary border-t-transparent" />
      <span className="text-xs font-bold uppercase tracking-wider text-secondary">Loading Module...</span>
    </div>
  </div>
);

const HomeRoute: React.FC = () => {
  const { currentUser, hasModulePermission, isModuleEnabled } = useCRM();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  if (currentUser.role === 'student') {
    return <Navigate to="/student/dashboard" replace />;
  }
  if (currentUser.role === 'mentor') {
    return <Navigate to="/mentor/dashboard" replace />;
  }
  // Super Admin, Admissions, Finance, and Program Officer land on the Operational Command Center
  if (['super_admin', 'admissions', 'finance', 'program_officer'].includes(currentUser.role)) {
    return <OperationalDashboardPage />;
  }

  // Fallback for custom configured roles based on enabled modules
  if (hasModulePermission('reports') && isModuleEnabled('reports')) return <ExecutiveReportPage />;
  if (hasModulePermission('courses') && isModuleEnabled('courses')) return <Navigate to="/courses" replace />;
  if (hasModulePermission('leads') && isModuleEnabled('leads')) return <Navigate to="/leads" replace />;
  if (hasModulePermission('students') && isModuleEnabled('students')) return <Navigate to="/students" replace />;
  if (hasModulePermission('mentors') && isModuleEnabled('mentors')) return <Navigate to="/mentors" replace />;
  if (hasModulePermission('attendance') && isModuleEnabled('attendance')) return <Navigate to="/attendance" replace />;
  if (hasModulePermission('expenses') && isModuleEnabled('expenses')) return <Navigate to="/expenses" replace />;
  if (hasModulePermission('settings')) return <Navigate to="/settings" replace />;

  if (isModuleEnabled('tickets')) return <Navigate to="/tickets" replace />;
  return <OperationalDashboardPage />;
};

export const App: React.FC = () => {
  return (
    <PWAProvider>
      <BrowserRouter>
        <CRMProvider>
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/set-password" element={<ResetPasswordPage />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<HomeRoute />} />
                <Route 
                  path="reports" 
                  element={
                    <ProtectedRoute allowedRoles={['super_admin', 'program_officer']} requiredModule="reports">
                      <ExecutiveReportPage />
                    </ProtectedRoute>
                  } 
                />
                
                <Route
                  path="courses"
                  element={
                    <ProtectedRoute allowedRoles={['super_admin', 'admissions', 'program_officer']} requiredModule="courses">
                      <CoursesCohortsPage />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="leads"
                  element={
                    <ProtectedRoute allowedRoles={['super_admin', 'admissions']} requiredModule="leads">
                      <LeadManagementPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="contacts"
                  element={
                    <ProtectedRoute allowedRoles={['super_admin', 'admissions', 'program_officer']} requiredModule="leads">
                      <ContactsPage />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="students"
                  element={
                    <ProtectedRoute allowedRoles={['super_admin', 'admissions', 'mentor', 'finance', 'program_officer']} requiredModule="students">
                      <StudentEnrollmentPage />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="mentors"
                  element={
                    <ProtectedRoute allowedRoles={['super_admin', 'mentor', 'program_officer']} requiredModule="mentors">
                      <MentorManagementPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="financial-audit"
                  element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                      <FinancialAuditPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="mentors/office-hours"
                  element={
                    <ProtectedRoute allowedRoles={['super_admin', 'mentor', 'program_officer']} requiredModule="mentors">
                      <MentorAvailabilityPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="mentors/grading"
                  element={
                    <ProtectedRoute allowedRoles={['super_admin', 'mentor', 'program_officer']} requiredModule="mentors">
                      <FacultyGradingPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="mentors/course-outlines"
                  element={
                    <ProtectedRoute allowedRoles={['super_admin', 'mentor', 'program_officer', 'admissions']} requiredModule="mentors">
                      <CourseOutlinePage />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="attendance"
                  element={
                    <ProtectedRoute allowedRoles={['super_admin', 'admissions', 'mentor', 'finance', 'program_officer']} requiredModule="attendance">
                      <StaffAttendancePage />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="expenses"
                  element={
                    <ProtectedRoute allowedRoles={['super_admin', 'admissions', 'finance']} requiredModule="expenses">
                      <BusinessExpensesPage />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Student Portal Routes */}
                <Route
                  path="student/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['student', 'super_admin']}>
                      <StudentDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="student/courses"
                  element={
                    <ProtectedRoute allowedRoles={['student', 'super_admin']} requiredModule="lms">
                      <StudentCoursesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="student/mentor"
                  element={
                    <ProtectedRoute allowedRoles={['student', 'super_admin']} requiredModule="mentors">
                      <StudentMentorPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="student/billing"
                  element={
                    <ProtectedRoute allowedRoles={['student', 'super_admin']} requiredModule="billing">
                      <StudentBillingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="student/profile"
                  element={
                    <ProtectedRoute allowedRoles={['student', 'super_admin']}>
                      <StudentProfilePage />
                    </ProtectedRoute>
                  }
                />

                {/* Dedicated Faculty / Mentor Portal Routes */}
                <Route
                  path="mentor/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['mentor', 'super_admin']}>
                      <MentorDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="mentor/students"
                  element={
                    <ProtectedRoute allowedRoles={['mentor', 'super_admin']}>
                      <MentorStudentsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="mentor/schedule"
                  element={
                    <ProtectedRoute allowedRoles={['mentor', 'super_admin']}>
                      <MentorSchedulePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="mentor/grading"
                  element={
                    <ProtectedRoute allowedRoles={['mentor', 'super_admin']}>
                      <FacultyGradingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="mentor/curriculum"
                  element={
                    <ProtectedRoute allowedRoles={['mentor', 'super_admin']}>
                      <MentorCurriculumPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="mentor/payouts"
                  element={
                    <ProtectedRoute allowedRoles={['mentor', 'super_admin']}>
                      <MentorPayoutsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="mentor/profile"
                  element={
                    <ProtectedRoute allowedRoles={['mentor', 'super_admin']}>
                      <MentorProfilePage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="tickets"
                  element={
                    <ProtectedRoute requiredModule="tickets">
                      <TicketsPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="chat"
                  element={
                    <ProtectedRoute>
                      <ChatPage />
                    </ProtectedRoute>
                  }
                />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
          <ToastContainer />
          <PWAInstallPrompt />
          <OfflineIndicator />
        </CRMProvider>
      </BrowserRouter>
    </PWAProvider>
  );
};

export default App;

